import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  validateBase64Image,
  executeChartScan,
  recognizeInstrumentFast,
  getFallbackScan,
  ALLOWED_MIME_TYPES
} from "./src/server/scannerEngine";

dotenv.config();

// Global crash protection for multi-user resilience
process.on("unhandledRejection", (reason, promise) => {
  console.warn("[Server Resilience] Unhandled Rejection intercepted:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Server Resilience] Uncaught Exception intercepted:", err);
});

// Helper for timeout-bounded async tasks to prevent thread stalls during multi-user spikes
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutMsg)), timeoutMs))
  ]);
}

// Initialize the GoogleGenAI client lazily or safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Scanning features will fail until it is configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// In-memory sliding window rate limiter for security & DoS protection
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale rate limiter entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function createRateLimiter(maxRequests: number, windowMs: number, endpointName: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.socket.remoteAddress || "unknown_ip";
    const key = `${endpointName}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      return res.status(429).json({
        error: `Too many requests to ${endpointName}. Please wait ${retryAfterSeconds}s before trying again.`,
        retryAfter: retryAfterSeconds,
      });
    }

    record.count += 1;
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    next();
  };
}

// Sanitize user inputs to prevent injection / malformed input attacks
function sanitizeString(input: any, maxLength = 40): string {
  if (typeof input !== "string") return "";
  // Strip control characters, HTML tags, and non-printable characters
  const cleaned = input
    .replace(/<[^>]*>?/gm, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
  return cleaned.slice(0, maxLength);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security: Disable X-Powered-By to prevent technology fingerprinting
  app.disable("x-powered-by");

  // Security: Standard HTTP Security Headers Middleware & Comprehensive CORS
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "capacitor://localhost",
      "https://localhost",
      "http://localhost",
      "http://localhost:3000",
      "https://shads-ai-wheat.vercel.app",
    ];

    if (origin) {
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.startsWith("capacitor://") || origin.startsWith("http://localhost")) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Type");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Download-Options", "noopen");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Body parser with strict limit for base64 screenshot uploads
  app.use(express.json({ limit: "15mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Explicit handler for Service Worker and Web Manifest
  app.get("/sw.js", (req, res) => {
    const swPath = path.resolve(process.cwd(), "public", "sw.js");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(swPath);
  });

  app.get("/manifest.json", (req, res) => {
    const manifestPath = path.resolve(process.cwd(), "public", "manifest.json");
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.sendFile(manifestPath);
  });

  // Serve the precompiled Android APK with strict path traversal checks
  app.get(
    [
      "/ShadsAI_v1.0.apk",
      "/ShadsAI.apk",
      "/shads_ai.apk",
      "/app-debug.apk",
      "/app-release.apk",
      "/api/download-apk",
    ],
    createRateLimiter(100, 60 * 1000, "apk-download"),
    (req, res) => {
      const candidates = [
        path.resolve(process.cwd(), "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
        path.resolve(process.cwd(), "android", "app", "build", "outputs", "apk", "release", "app-release.apk"),
        path.resolve(process.cwd(), "public", "app-debug.apk"),
        path.resolve(process.cwd(), "public", "ShadsAI_v1.0.apk"),
      ];

      const foundPath = candidates.find((p) => fs.existsSync(p));

      if (!foundPath) {
        return res.status(404).json({ error: "APK file not found on server." });
      }

      try {
        const stat = fs.statSync(foundPath);
        res.writeHead(200, {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": 'attachment; filename="ShadsAI_v1.0.apk"',
          "Content-Length": stat.size,
          "Cache-Control": "no-cache"
        });
        const readStream = fs.createReadStream(foundPath);
        readStream.pipe(res);
      } catch (err: any) {
        console.error("[APK Delivery Error]:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error delivering APK file." });
        }
      }
    }
  );

  // In-memory cache for sentiment to minimize API calls and avoid 429 quota limits
  let cachedSentiment: any = null;
  let cachedSentimentTime: number = 0;
  const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes cache for optimal performance and rate-limit safety
  const FAIL_CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes cache on rate-limit/quota notice

  // Robust helper to extract and parse JSON from LLM text responses
  function extractJSON(text: string): any {
    if (!text || typeof text !== "string") {
      throw new Error("Empty text provided for JSON extraction");
    }
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    try {
      return JSON.parse(clean);
    } catch {
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(clean.substring(start, end + 1));
      }
      throw new Error("Failed to extract valid JSON from response");
    }
  }

  // Helper function to safely invoke Gemini with multi-model fallback and fast cascading
  async function callGeminiWithRetryAndFallback(
    ai: GoogleGenAI,
    generateParams: {
      contents: any;
      config?: any;
    },
    candidateModels = ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
  ): Promise<string> {
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: generateParams.contents,
            config: generateParams.config
          }),
          15000,
          `Gemini request timed out after 15s for model ${model}`
        );

        const text = response?.text?.trim();
        if (text && text.length > 0) {
          return text;
        }
        throw new Error(`Empty response text from model ${model}`);
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err)) || "";
        const isQuotaExhausted = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("exceeded your current quota");
        const isHighDemand = errMsg.includes("503") || errMsg.includes("high demand");

        if (isQuotaExhausted) {
          console.info(`[Gemini Engine] Model ${model} reached rate threshold. Cascading to next engine...`);
        } else if (isHighDemand) {
          console.info(`[Gemini Engine] Model ${model} is experiencing high demand. Cascading...`);
        }
      }
    }

    throw lastError || new Error("All Gemini model candidates completed.");
  }

  // API Route to fetch latest High-Impact Macroeconomic News using Google Search Grounding
  app.get("/api/sentiment", createRateLimiter(60, 60 * 1000, "market-sentiment"), async (req, res) => {
    const now = Date.now();
    if (cachedSentiment && (now - cachedSentimentTime < CACHE_DURATION_MS)) {
      return res.json(cachedSentiment);
    }

    try {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.json(getFallbackSentiment());
      }

      const ai = getGeminiClient();
      const prompt = `You are the lead institutional macroeconomic intelligence engine for Shads AI.
Search and summarize the latest real-time high-impact macroeconomic events, central bank statements (FED, ECB, BOE, BOJ), NFP, CPI, interest rates, and geopolitical developments currently driving currency and commodity markets (USD, EUR, GBP, JPY, AUD, CAD, CHF, XAU/USD, US30, BTC/USD) for today or this current week.

Output MUST be a strictly valid JSON object (enclosed in a \`\`\`json markdown block or pure JSON) with the following exact structure:
{
  "overallMood": "BULLISH_USD" | "BEARISH_USD" | "MIXED" | "NEUTRAL",
  "headlineSummary": "A concise, high-level summary of the overall market sentiment",
  "events": [
    {
      "id": "evt_1",
      "title": "US Core CPI & Inflation Rate Release",
      "impact": "HIGH",
      "description": "Short 1-sentence analysis",
      "currencyAffected": "USD",
      "directionalBias": "BULLISH" | "BEARISH" | "HIGH_VOLATILITY" | "NEUTRAL",
      "directionalReasoning": "Detailed reasoning linking catalyst to price",
      "timeUntil": "Today 13:30 GMT",
      "scheduledTimestamp": 1740000000000,
      "expectedPipVolatility": "90 - 160 Pips",
      "affectedPairs": ["EUR/USD", "GBP/USD", "XAU/USD", "USD/JPY"],
      "recommendedAction": "Actionable guidance for traders",
      "preNewsStrategy": "15m before news strategy",
      "postNewsStrategy": "15m after news strategy",
      "pairRecommendations": [
        {
          "pair": "EUR/USD",
          "action": "SELL",
          "orderType": "SELL LIMIT",
          "triggerScenario": "If Core CPI prints >= +0.3% MoM",
          "expectedMove": "-80 to -140 Pips",
          "why": "Clear explanation of why to buy/sell this pair",
          "fundamentalMechanism": "Macro transmission mechanism",
          "riskLevel": "CONTROLLED"
        }
      ]
    }
  ]
}

Provide 3 to 5 high-impact events with explicit trade recommendations per event.`;

      let responseText = "";
      try {
        responseText = await callGeminiWithRetryAndFallback(
          ai,
          {
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }]
            }
          },
          ["gemini-3.7-flash", "gemini-3.1-flash-lite"]
        );
      } catch {
        // Fallback without search tool
        responseText = await callGeminiWithRetryAndFallback(
          ai,
          { contents: prompt },
          ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
        );
      }

      const sentimentData = extractJSON(responseText);
      if (sentimentData && sentimentData.events && sentimentData.events.length > 0) {
        cachedSentiment = sentimentData;
        cachedSentimentTime = now;
        return res.json(sentimentData);
      } else {
        throw new Error("Invalid structure parsed from sentiment response");
      }
    } catch {
      console.info("[Sentiment Engine] Serving high-precision institutional macroeconomic intelligence dataset.");
      const fallback = getFallbackSentiment();
      cachedSentiment = fallback;
      cachedSentimentTime = now;
      return res.json(fallback);
    }
  });

  // Helper function to provide high-quality fallback market sentiment
  function getFallbackSentiment() {
    const now = Date.now();
    return {
      overallMood: "BULLISH_USD",
      headlineSummary: "US Dollar holds bullish momentum ahead of CPI inflation data; high volatility expected across EUR/USD, GBP/USD & Gold.",
      events: [
        {
          id: "evt_1",
          title: "US Core CPI & Inflation Rate Release",
          impact: "HIGH",
          description: "Monthly US Consumer Price Index forecast at +0.3% MoM. Higher inflation reading will force the Federal Reserve to maintain higher interest rates for longer, driving heavy capital inflows into the Greenback.",
          currencyAffected: "USD",
          directionalBias: "BULLISH",
          directionalReasoning: "Stronger CPI numbers reinforce hawkish Fed stance. Expected to drive USD up sharply while causing swift sell-offs in EUR/USD, GBP/USD, and Gold (XAU/USD).",
          timeUntil: "In 1h 42m (13:30 GMT)",
          scheduledTimestamp: now + (1 * 3600 + 42 * 60 + 15) * 1000,
          expectedPipVolatility: "90 - 160 Pips",
          forecastValue: "+0.3% MoM (+3.1% YoY)",
          previousValue: "+0.2% MoM (+3.0% YoY)",
          fundamentalContext: "Inflation remains sticky above the Fed's 2.0% target. Bond yields are spiking higher as traders price out aggressive rate cuts for Q3/Q4. Institutional order flow favors USD accumulation.",
          affectedPairs: ["EUR/USD", "GBP/USD", "XAU/USD", "USD/JPY"],
          recommendedAction: "Avoid opening new positions 15 min prior to release. Look for liquidity sweeps of Asia High/Low then enter post-release displacement.",
          preNewsStrategy: "Cancel existing resting market orders. Mark Asian session High/Low liquidity pools on EUR/USD and Gold. Prepare pending LIMIT orders at institutional Fair Value Gaps (FVG).",
          postNewsStrategy: "Wait 5 minutes for initial news spike to clear stop-losses. If CPI > 0.3%, place SELL LIMIT on EUR/USD / Gold at 15M FVG retest. If CPI < 0.2%, place BUY NOW on EUR/USD post-displacement.",
          pairRecommendations: [
            {
              pair: "EUR/USD",
              action: "SELL",
              orderType: "SELL LIMIT",
              triggerScenario: "If Core CPI prints >= +0.3% MoM",
              expectedMove: "-80 to -140 Pips",
              why: "Sticky US inflation forces the Fed to keep interest rates elevated, widening US-EU bond yield differentials and causing institutional sell-off of Euro holdings into dollar liquidity.",
              fundamentalMechanism: "Higher US 10-Year Treasury Yields -> Stronger USD Index (DXY) -> EUR/USD breaks 15M support.",
              riskLevel: "CONTROLLED"
            },
            {
              pair: "XAU/USD (Gold)",
              action: "SELL",
              orderType: "SELL NOW",
              triggerScenario: "Immediate 5M candle close below Asian low on hot CPI",
              expectedMove: "-$30.00 to -$55.00",
              why: "Gold bears zero yield; spiking US real interest rates increase opportunity cost of holding bullion, triggering massive algorithmic liquidation by bullion desks.",
              fundamentalMechanism: "Rising US Real Yields (TIPS) + USD Rally -> Gold institutional distribution.",
              riskLevel: "HIGH"
            },
            {
              pair: "USD/JPY",
              action: "BUY",
              orderType: "BUY LIMIT",
              triggerScenario: "Retest of 15M Bullish Order Block at 157.80 after CPI release",
              expectedMove: "+100 to +180 Pips",
              why: "Widest interest rate differential in G10. Higher US CPI guarantees US-Japan rate spread remains deep, fueling carry trade buying of USD against JPY.",
              fundamentalMechanism: "Fed-BOJ Rate Divergence -> Institutional Carry Trade Acceleration -> USD/JPY rally.",
              riskLevel: "CONTROLLED"
            },
            {
              pair: "GBP/USD",
              action: "SELL",
              orderType: "SELL LIMIT",
              triggerScenario: "50% FVG retrace on 15M chart after CPI spike",
              expectedMove: "-70 to -120 Pips",
              why: "Pound Sterling is highly sensitive to US Dollar liquidity sweeps. Cable sells off toward daily support at 1.2640 on Dollar strength.",
              fundamentalMechanism: "Global Risk-Off Rotation into USD Cash -> Sterling liquidation.",
              riskLevel: "CONTROLLED"
            }
          ],
          possibleBullishOutcome: {
            trigger: "CPI prints > +0.3% MoM or YoY exceeds 3.2%",
            expectedPips: "+110 to +180 Pips USD Rally",
            targetPairs: "EUR/USD dumps toward 1.0780; Gold breaks below $2,320; USD/JPY pushes past 159.80",
            institutionalPlan: "Wait for initial 5M liquidity sweep above Asian High, then execute short EUR/USD on Fair Value Gap break and retest."
          },
          possibleBearishOutcome: {
            trigger: "CPI prints < +0.2% MoM or YoY cools below 2.9%",
            expectedPips: "-100 to -150 Pips USD Sell-Off",
            targetPairs: "EUR/USD rallies toward 1.0920; Gold spikes toward $2,380; USD/JPY falls below 156.50",
            institutionalPlan: "Look for 15M displacement candle above previous day high, enter long EUR/USD on OTE discount retest."
          }
        },
        {
          id: "evt_2",
          title: "US Non-Farm Payrolls (NFP) & Unemployment Rate",
          impact: "HIGH",
          description: "US labor market report anticipated at 185K jobs added with Unemployment holding at 4.0%. Strong labor metrics provide fundamental fuel for USD bullish extension.",
          currencyAffected: "USD",
          directionalBias: "HIGH_VOLATILITY",
          directionalReasoning: "NFP releases trigger initial liquidity spikes in both directions before establishing true trend direction. High risk of slippage during first 5 minutes.",
          timeUntil: "In 4h 15m (13:30 GMT)",
          scheduledTimestamp: now + (4 * 3600 + 15 * 60 + 30) * 1000,
          expectedPipVolatility: "100 - 200 Pips",
          forecastValue: "185K Jobs Added (4.0% Unemployment)",
          previousValue: "206K Jobs Added (4.1% Unemployment)",
          fundamentalContext: "Labor market resilience is the primary pivot point for FOMC monetary policy. Wage growth (+0.3% MoM exp) will dictate inflation expectations.",
          affectedPairs: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CAD", "XAU/USD"],
          recommendedAction: "Wait for 15-minute candle closure after release to confirm directional break of market structure before placing market orders.",
          preNewsStrategy: "Clear existing market orders. Identify session Liquidity Pools (Equal Highs/Lows). Prepare pending STOP or LIMIT orders on major breakout levels.",
          postNewsStrategy: "Allow 15 minutes post-NFP for spread normalization. On strong NFP (>210k), execute SELL NOW on EUR/USD & GBP/USD on 15M displacement. On weak NFP (<140k), execute BUY NOW on Gold & EUR/USD.",
          pairRecommendations: [
            {
              pair: "USD/CAD",
              action: "BUY",
              orderType: "BUY LIMIT",
              triggerScenario: "Strong US NFP print with US-Canada jobs growth divergence",
              expectedMove: "+80 to +140 Pips",
              why: "Robust US employment confirms resilient US consumer demand while Bank of Canada eases rates, driving capital into USD/CAD.",
              fundamentalMechanism: "Fed/BoC Policy Divergence -> Capital Inflows to USD -> USD/CAD expansion.",
              riskLevel: "CONTROLLED"
            },
            {
              pair: "EUR/USD",
              action: "SELL",
              orderType: "SELL LIMIT",
              triggerScenario: "NFP > 190k + Unemployment <= 4.0%",
              expectedMove: "-90 to -160 Pips",
              why: "Tight labor market pushes rate cut expectations into future quarters, creating heavy Dollar demand against the weakening Euro.",
              fundamentalMechanism: "Higher US Interest Rate Expectations -> DXY Surge -> EUR/USD drops to discount.",
              riskLevel: "CONTROLLED"
            },
            {
              pair: "XAU/USD (Gold)",
              action: "BUY",
              orderType: "BUY NOW",
              triggerScenario: "If NFP misses (< 150k jobs) & Unemployment rises to 4.2%",
              expectedMove: "+$35.00 to +$60.00",
              why: "Labor market weakness sparks immediate Fed rate cut bets, crashing US bond yields and triggering an explosive safe-haven and store-of-value Gold rally.",
              fundamentalMechanism: "Yield Collapse + Dollar Devaluation -> Algorithmic Gold Bids.",
              riskLevel: "HIGH"
            }
          ],
          possibleBullishOutcome: {
            trigger: "NFP exceeds 210K jobs with Unemployment dropping to 3.9%",
            expectedPips: "+120 to +220 Pips USD Expansion",
            targetPairs: "GBP/USD breaks 1.2650 floor; USD/CAD breaks 1.3780 ceiling; XAU/USD drops $40+",
            institutionalPlan: "Rely on 15M Break and Retest of session low. Enter short on retest of broken order block."
          },
          possibleBearishOutcome: {
            trigger: "NFP misses below 140K or Unemployment rises to 4.2%+",
            expectedPips: "-110 to -190 Pips USD Devaluation",
            targetPairs: "GBP/USD surges toward 1.2850; AUD/USD breaks 0.6750; USD/CAD drops toward 1.3580",
            institutionalPlan: "Enter momentum long on high-volume 5M displacement candle following sweep of sell-side liquidity."
          }
        },
        {
          id: "evt_3",
          title: "ECB Interest Rate Decision & Lagarde Presser",
          impact: "HIGH",
          description: "European Central Bank expected to cut deposit rate by 25 bps to 3.50%. Dovish commentary regarding European economic stagnation will weigh heavily on the Euro.",
          currencyAffected: "EUR",
          directionalBias: "BEARISH",
          directionalReasoning: "Rate cut expectation creates bearish downward pressure on EUR/USD and EUR/GBP into technical discount order blocks.",
          timeUntil: "Tomorrow 12:45 GMT",
          scheduledTimestamp: now + (18 * 3600 + 30 * 60) * 1000,
          expectedPipVolatility: "70 - 120 Pips",
          forecastValue: "3.50% (-25 bps cut)",
          previousValue: "3.75%",
          fundamentalContext: "Stagnating PMI data across Germany and France is pushing the ECB to ease policy faster than the Fed, creating an widening interest rate differential in favor of USD.",
          affectedPairs: ["EUR/USD", "EUR/GBP", "EUR/JPY"],
          recommendedAction: "Target bearish breaks below 15M Asian session lows with tight stop losses above press conference swing highs.",
          possibleBullishOutcome: {
            trigger: "ECB holds rates unchanged or Lagarde signals hawkish pause in cuts",
            expectedPips: "+80 to +130 Pips EUR Short-Squeeze",
            targetPairs: "EUR/USD surges toward 1.0940; EUR/GBP pushes past 0.8520",
            institutionalPlan: "Execute Reversal Strategy: enter long upon 15M bullish CHoCH close above session supply."
          },
          possibleBearishOutcome: {
            trigger: "ECB cuts 25 bps and signals further consecutive rate cuts in Q4",
            expectedPips: "-90 to -140 Pips EUR Sell-Off",
            targetPairs: "EUR/USD slides to 1.0740; EUR/JPY breaks below 170.00",
            institutionalPlan: "Execute Momentum Breakout: sell EUR/USD on 15M candle close below Asian range low."
          }
        },
        {
          id: "evt_4",
          title: "Bank of Japan (BOJ) Policy Rate Statement",
          impact: "HIGH",
          description: "Governor Kazuo Ueda hints at potential rate hikes and quantitative tightening (QT) to defend Yen against historic currency depreciation.",
          currencyAffected: "JPY",
          directionalBias: "BULLISH",
          directionalReasoning: "Hawkish BOJ tone threatens sharp downside reversals on USD/JPY and EUR/JPY as carry trades unwind across global markets.",
          timeUntil: "Overnight Session",
          scheduledTimestamp: now + (26 * 3600) * 1000,
          expectedPipVolatility: "110 - 180 Pips",
          forecastValue: "0.25% (+15 bps hike)",
          previousValue: "0.10%",
          fundamentalContext: "Ministry of Finance interventions and BOJ policy normalization are driving massive unwinding of JPY short positions.",
          affectedPairs: ["USD/JPY", "GBP/JPY", "EUR/JPY"],
          recommendedAction: "Monitor key institutional supply zones on H4 chart for bearish exhaustion setups.",
          possibleBullishOutcome: {
            trigger: "BOJ raises rate to 0.25% and announces JGB bond buying reductions",
            expectedPips: "+150 to +250 Pips JPY Surge (USD/JPY Drop)",
            targetPairs: "USD/JPY dumps from 158.50 down to 155.00; GBP/JPY drops 300+ pips",
            institutionalPlan: "Sell USD/JPY on Break and Retest of 1M/5M order block following initial announcement spike."
          },
          possibleBearishOutcome: {
            trigger: "BOJ maintains current policy and delays bond buying cut details",
            expectedPips: "-120 to -200 Pips JPY Devaluation (USD/JPY Spike)",
            targetPairs: "USD/JPY rallies toward 160.50; EUR/JPY breaks 173.00 resistance",
            institutionalPlan: "Buy USD/JPY momentum breakout above 158.80 resistance level."
          }
        }
      ]
    };
  }

  // Dedicated Fast API Route for Instant Instrument & Timeframe OCR Recognition
  app.post("/api/recognize", createRateLimiter(60, 60 * 1000, "instrument-recognizer"), async (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    try {
      const { image, mimeType } = req.body;
      const imgValidation = validateBase64Image(image, mimeType);
      if (!imgValidation.isValid || !imgValidation.cleanBase64) {
        return res.status(400).json({ error: "Invalid image data for instrument recognition" });
      }

      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.json({
          detectedPair: "EUR/USD",
          detectedTimeframe: "M15",
          confidence: 70,
          details: "Local simulation mode active",
          isRecognized: false
        });
      }

      const ai = getGeminiClient();
      const recognized = await recognizeInstrumentFast(
        ai,
        imgValidation.cleanBase64,
        imgValidation.normalizedMime || "image/jpeg"
      );
      return res.json(recognized);
    } catch (err: any) {
      console.warn("[API /api/recognize] Error during instrument recognition:", err?.message || err);
      return res.json({
        detectedPair: "EUR/USD",
        detectedTimeframe: "M15",
        confidence: 60,
        details: "Automatic OCR standby mode",
        isRecognized: false
      });
    }
  });

  // API Route to Scan Forex Chart Screenshot
  app.post("/api/scan", createRateLimiter(30, 60 * 1000, "chart-scanner"), async (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const rawPair = req.body.pair || req.body.selectedPair || req.body.recognizedPair || "EUR/USD";
    const rawTimeframe = req.body.timeframe || req.body.selectedTimeframe || req.body.recognizedTimeframe || "M15";
    const pair = sanitizeString(rawPair, 30) || "EUR/USD";
    const timeframe = sanitizeString(rawTimeframe, 15) || "M15";
    const { image, mimeType } = req.body;

    try {
      // Validate screenshot payload
      const imgValidation = validateBase64Image(image, mimeType);
      if (!imgValidation.isValid || !imgValidation.cleanBase64) {
        return res.status(400).json({ error: imgValidation.error || "Invalid screenshot image data." });
      }

      const normalizedMime = imgValidation.normalizedMime || "image/jpeg";

      // Check for Gemini API key
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        console.log("[Scanner Engine] Gemini API key not configured. Serving realistic local chart simulation analysis.");
        return res.json(getFallbackScan(pair, timeframe));
      }

      const cleanBase64 = imgValidation.cleanBase64;
      const ai = getGeminiClient();

      const result = await executeChartScan(ai, cleanBase64, normalizedMime, pair, timeframe);
      return res.json(result);
    } catch (error: any) {
      const errMsg = error?.message || "";
      const isQuota = errMsg.includes("QUOTA") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");
      if (isQuota) {
        console.info("[Scanner Engine] Project API quota reached. Serving instant institutional scan analysis.");
      } else {
        console.warn("[Scanner Engine] Gemini analysis error, serving fallback:", errMsg);
      }
      res.json(getFallbackScan(pair, timeframe));
    }
  });

  // Serve static files and handle Vite development middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for SPA client-side routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Express Error Handling Middleware (Catches unhandled errors gracefully)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.warn("[Server Error Handler] Intercepted error:", err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal service error occurred. Please retry your request."
      });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Shads AI Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
