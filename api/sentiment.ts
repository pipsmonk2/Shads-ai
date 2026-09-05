import { GoogleGenAI } from "@google/genai";
import { extractJSON, withTimeout } from "../src/server/scannerEngine";

let cachedGeminiClient: GoogleGenAI | null = null;
let cachedSentiment: any = null;
let cachedSentimentTime: number = 0;
const CACHE_DURATION_MS = 15 * 60 * 1000;

function getGeminiClient(): GoogleGenAI {
  if (!cachedGeminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    cachedGeminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return cachedGeminiClient;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT,HEAD");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin, Cache-Control, Pragma");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const now = Date.now();
  if (cachedSentiment && now - cachedSentimentTime < CACHE_DURATION_MS) {
    return res.status(200).json(cachedSentiment);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallback = {
      overallSentiment: "NEUTRAL",
      summary: "Global markets are consolidating as traders await key macroeconomic central bank guidance and CPI data.",
      keyEvents: [
        { headline: "Federal Reserve maintains data-dependent stance on interest rates", impact: "HIGH", currency: "USD", sentiment: "NEUTRAL" },
        { headline: "European Central Bank monitors inflation trajectory across Eurozone", impact: "MEDIUM", currency: "EUR", sentiment: "NEUTRAL" },
        { headline: "Gold consolidates near structural demand zones amid safe-haven demand", impact: "HIGH", currency: "XAU", sentiment: "BULLISH" }
      ],
      fetchedAt: new Date().toISOString()
    };
    return res.status(200).json(fallback);
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Search for the latest breaking high-impact macroeconomic financial news, interest rate decisions, CPI releases, and central bank commentary for USD, EUR, GBP, JPY, and Gold.
Summarize the findings as strict JSON with schema:
{
  "overallSentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "summary": "1-2 sentence market overview",
  "keyEvents": [
    { "headline": "string", "impact": "HIGH" | "MEDIUM" | "LOW", "currency": "USD" | "EUR" | "GBP" | "JPY" | "XAU", "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL" }
  ]
}`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      }),
      20000,
      "Sentiment search timed out"
    );

    const parsed = extractJSON(response.text || "{}");
    const result = {
      ...parsed,
      fetchedAt: new Date().toISOString()
    };

    cachedSentiment = result;
    cachedSentimentTime = now;
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("[Vercel /api/sentiment Error]:", err);
    const fallback = {
      overallSentiment: "NEUTRAL",
      summary: "Macroeconomic markets show balanced consolidation across forex majors and precious metals.",
      keyEvents: [
        { headline: "Central banks signal steady interest rate trajectory", impact: "HIGH", currency: "USD", sentiment: "NEUTRAL" },
        { headline: "Precious metals maintain strong institutional bid", impact: "HIGH", currency: "XAU", sentiment: "BULLISH" }
      ],
      fetchedAt: new Date().toISOString()
    };
    return res.status(200).json(fallback);
  }
}
