import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import sharp from "sharp";

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
]);

export interface ImageValidationResult {
  isValid: boolean;
  cleanBase64?: string;
  error?: string;
  normalizedMime?: string;
  hash?: string;
  sizeBytes?: number;
}

/**
 * Validates base64 image data payload and computes fingerprint
 */
export function validateBase64Image(data: any, mimeType?: any): ImageValidationResult {
  if (!data || typeof data !== "string") {
    return { isValid: false, error: "Image data must be a valid non-empty string." };
  }

  // Cap base64 string length at 15MB to prevent memory exhaustion / DoS
  const MAX_BASE64_LENGTH = 15 * 1024 * 1024;
  if (data.length > MAX_BASE64_LENGTH) {
    return { isValid: false, error: "Image payload exceeds maximum allowed size (15MB)." };
  }

  // Clean data URL prefix if present
  let detectedMime = typeof mimeType === "string" ? mimeType.toLowerCase().trim() : "";
  const prefixMatch = data.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/i);
  if (prefixMatch && prefixMatch[1]) {
    detectedMime = prefixMatch[1].toLowerCase();
  }

  const cleanBase64 = data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/i, "").trim();
  if (cleanBase64.length === 0) {
    return { isValid: false, error: "Image payload contains no base64 data." };
  }

  // Verify valid base64 character structure
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!base64Regex.test(cleanBase64.slice(0, 1000))) {
    return { isValid: false, error: "Image payload contains invalid base64 encoding." };
  }

  const normalizedMime = detectedMime && ALLOWED_MIME_TYPES.has(detectedMime) ? detectedMime : "image/jpeg";
  const hash = crypto.createHash("sha256").update(cleanBase64).digest("hex").slice(0, 12);
  const sizeBytes = Math.round(cleanBase64.length * 0.75);

  return {
    isValid: true,
    cleanBase64,
    normalizedMime,
    hash,
    sizeBytes
  };
}

/**
 * Extracts and parses JSON from Gemini text response
 */
export function extractJSON(text: string): any {
  if (!text || typeof text !== "string") {
    throw new Error("Empty text provided for JSON extraction");
  }
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(clean.substring(start, end + 1));
    }
    throw new Error("Failed to extract valid JSON from response");
  }
}

/**
 * Timeout wrapper for async promises
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise
  ]);
}

/**
 * Extracts high-resolution focused crops of the top-left symbol header and right price scale
 * to maximize OCR accuracy for Gemini vision models without compression artifacts.
 */
export async function extractChartCrops(cleanBase64: string): Promise<{
  headerCropBase64?: string;
  priceAxisCropBase64?: string;
}> {
  try {
    const buffer = Buffer.from(cleanBase64, "base64");
    const meta = await sharp(buffer).metadata();
    const w = meta.width || 1200;
    const h = meta.height || 800;

    // 1. Top-Left Header Crop (Ticker, Broker, Timeframe, Interval)
    const topW = Math.min(w, Math.max(300, Math.round(w * 0.45)));
    const topH = Math.min(h, Math.max(120, Math.round(h * 0.25)));
    const topCropBuffer = await sharp(buffer)
      .extract({ left: 0, top: 0, width: topW, height: topH })
      .jpeg({ quality: 92 })
      .toBuffer();

    // 2. Right Price Scale Axis Crop (Vertical price scale numbers)
    const priceW = Math.min(w, Math.max(140, Math.round(w * 0.20)));
    const priceH = Math.min(h, Math.max(250, Math.round(h * 0.85)));
    const priceLeft = Math.max(0, w - priceW);
    const priceTop = Math.round(h * 0.05);
    const priceCropBuffer = await sharp(buffer)
      .extract({ left: priceLeft, top: priceTop, width: priceW, height: priceH })
      .jpeg({ quality: 92 })
      .toBuffer();

    return {
      headerCropBase64: topCropBuffer.toString("base64"),
      priceAxisCropBase64: priceCropBuffer.toString("base64")
    };
  } catch (err) {
    console.warn("[Chart Crops] Note: Could not extract crops from screenshot:", err);
    return {};
  }
}

/**
 * Calibrates detected asset pair and timeframe using OCR vision analysis and price levels
 */
export function normalizeDetectedTimeframe(rawTf?: string, fallback: string = "M15"): string {
  if (!rawTf) return fallback;
  const cleaned = String(rawTf).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!cleaned || ["UNKNOWN", "UNKNOWN_TIMEFRAME", "NA", "NONE", "NULL", "UNDEFINED"].includes(cleaned)) {
    return fallback;
  }
  if (/^(1M|M1|1MIN|1MINUTE)$/i.test(cleaned)) return "M1";
  if (/^(3M|M3|3MIN|3MINUTE)$/i.test(cleaned)) return "M3";
  if (/^(5M|M5|5MIN|5MINUTE)$/i.test(cleaned)) return "M5";
  if (/^(15M|M15|15MIN|15MINUTE)$/i.test(cleaned)) return "M15";
  if (/^(30M|M30|30MIN|30MINUTE)$/i.test(cleaned)) return "M30";
  if (/^(45M|M45|45MIN|45MINUTE)$/i.test(cleaned)) return "M45";
  if (/^(1H|H1|60M|60|1HOUR|60MIN)$/i.test(cleaned)) return "H1";
  if (/^(2H|H2|120M|120|2HOUR|120MIN)$/i.test(cleaned)) return "H2";
  if (/^(3H|H3|180M|180|3HOUR|180MIN)$/i.test(cleaned)) return "H3";
  if (/^(4H|H4|240M|240|4HOUR|240MIN)$/i.test(cleaned)) return "H4";
  if (/^(1D|D1|D|DAILY|1DAY)$/i.test(cleaned)) return "D1";
  if (/^(1W|W1|W|WEEKLY|1WEEK)$/i.test(cleaned)) return "W1";
  if (/^(1MO|MN|MONTHLY|1MONTH|M)$/i.test(cleaned)) return "MN";
  return cleaned.length <= 4 ? cleaned : fallback;
}

export function calibrateAssetPairByPrice(analysis: any, fallbackPair: string = "EUR/USD"): any {
  if (!analysis) return analysis;

  const rawDetected = analysis.detectedPair ? String(analysis.detectedPair).trim() : (analysis.pair ? String(analysis.pair).trim() : "");
  const cleanUpper = rawDetected
    .toUpperCase()
    .replace(/^(OANDA|FXCM|BINANCE|COINBASE|BYBIT|INDEX|TVC|FOREXCOM|PEPPERSTONE|ICMARKETS|CAPITALCOM|EIGHTCAP|BITFINEX|KRAKEN|KUCOIN):/i, "")
    .replace(/\.(RAW|PRO|ECN|R|M|MICRO|MINI|STD|VIP|CASH|A|B|SB)/gi, "")
    .replace(/[_#+!.-]([A-Z0-9]+)$/gi, "")
    .replace(/[^A-Z0-9/() _-]/g, "")
    .trim();

  // Extract all numeric price levels from response (handles commas, currency symbols, ranges)
  const extractNumbers = (val: any): number[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.flatMap(extractNumbers);
    if (typeof val === "number") return [val];
    if (typeof val !== "string") return [];
    const sanitized = val.replace(/,/g, "").replace(/[$€£¥]/g, "");
    const matches = sanitized.match(/\d+(?:\.\d+)?/g);
    return matches ? matches.map(n => parseFloat(n)).filter(n => !isNaN(n) && n > 0) : [];
  };

  const prices = [
    ...extractNumbers(analysis.entryPrice),
    ...extractNumbers(analysis.stopLoss),
    ...extractNumbers(analysis.takeProfit1),
    ...extractNumbers(analysis.takeProfit2),
    ...extractNumbers(analysis.takeProfit3),
    ...extractNumbers(analysis.takeProfit4),
    ...extractNumbers(analysis.takeProfit5),
    ...extractNumbers(analysis.takeProfit6),
  ];

  const validPrices = prices.filter(p => p > 0);
  const avgPrice = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : null;

  const isGoldTicker = /\b(XAU|XAUUSD|XAU_USD|GOLD|SPOTGOLD|GC)\b/i.test(cleanUpper) || cleanUpper.includes("XAU/USD") || cleanUpper.includes("GOLD");
  const isBtcTicker = /\b(BTC|BTCUSD|BTC_USD|BITCOIN|XBT|BTCUSDT)\b/i.test(cleanUpper) || cleanUpper.includes("BTC/USD") || cleanUpper.includes("BITCOIN");
  const isEthTicker = /\b(ETH|ETHUSD|ETH_USD|ETHEREUM|ETHER|ETHUSDT)\b/i.test(cleanUpper) || cleanUpper.includes("ETH/USD") || cleanUpper.includes("ETHEREUM");
  const isSolTicker = /\b(SOL|SOLUSD|SOL_USD|SOLANA)\b/i.test(cleanUpper) || cleanUpper.includes("SOL/USD");
  const isUs30Ticker = /\b(US30|DOW|DJI|WALLSTREET|DJ30)\b/i.test(cleanUpper);
  const isNasTicker = /\b(NAS100|NASDAQ|NDX|USTEC|US100)\b/i.test(cleanUpper);
  const isSpxTicker = /\b(SPX500|SP500|US500|SPX)\b/i.test(cleanUpper);
  const isDaxTicker = /\b(GER40|GER30|DAX|GERMANY40)\b/i.test(cleanUpper);
  const isOilTicker = /\b(USOIL|WTI|CRUDE|OIL|BRENT|UKOIL)\b/i.test(cleanUpper);
  const isSilverTicker = /\b(XAG|XAGUSD|SILVER)\b/i.test(cleanUpper);

  let finalPair = cleanUpper;

  // 1. Price-Scale Ground Truth Cross-Verification
  if (avgPrice !== null) {
    // Gold ($1,800 - $3,800)
    if (avgPrice >= 1800 && avgPrice <= 3800) {
      if (isEthTicker && !isGoldTicker) {
        finalPair = "ETH/USD (Ethereum)";
      } else {
        finalPair = "XAU/USD (Gold)";
      }
    }
    // Bitcoin & US30 ($35,000+)
    else if (avgPrice >= 35000) {
      if (isUs30Ticker || (avgPrice >= 35000 && avgPrice < 48000 && !isBtcTicker)) {
        finalPair = "US30 (Dow Jones)";
      } else {
        finalPair = "BTC/USD (Bitcoin)";
      }
    }
    // Indices: Nasdaq & DAX (14,000 - 25,000)
    else if (avgPrice >= 14000 && avgPrice <= 25000) {
      if (isDaxTicker) {
        finalPair = "GER40 (DAX)";
      } else {
        finalPair = "NAS100 (Nasdaq)";
      }
    }
    // S&P 500 (4,500 - 6,800)
    else if (avgPrice >= 4500 && avgPrice <= 6800) {
      finalPair = "SPX500 (S&P 500)";
    }
    // JPY Crosses (120 - 225)
    else if (avgPrice >= 120 && avgPrice <= 225) {
      if (cleanUpper.includes("GBP") && cleanUpper.includes("JPY")) finalPair = "GBP/JPY";
      else if (cleanUpper.includes("EUR") && cleanUpper.includes("JPY")) finalPair = "EUR/JPY";
      else if (cleanUpper.includes("AUD") && cleanUpper.includes("JPY")) finalPair = "AUD/JPY";
      else if (cleanUpper.includes("CAD") && cleanUpper.includes("JPY")) finalPair = "CAD/JPY";
      else if (cleanUpper.includes("CHF") && cleanUpper.includes("JPY")) finalPair = "CHF/JPY";
      else if (cleanUpper.includes("NZD") && cleanUpper.includes("JPY")) finalPair = "NZD/JPY";
      else if (cleanUpper.includes("JPY")) finalPair = cleanUpper.length === 6 ? `${cleanUpper.slice(0, 3)}/${cleanUpper.slice(3)}` : "USD/JPY";
    }
    // Silver ($18 - $45)
    else if (avgPrice >= 18 && avgPrice <= 45) {
      finalPair = "XAG/USD (Silver)";
    }
    // WTI Crude Oil ($50 - $115)
    else if (avgPrice >= 50 && avgPrice <= 115) {
      finalPair = "USOIL (WTI Crude)";
    }
    // Forex Majors and Minors (0.50 - 1.80)
    else if (avgPrice >= 0.50 && avgPrice <= 1.80) {
      if (cleanUpper.includes("EUR") && cleanUpper.includes("USD")) finalPair = "EUR/USD";
      else if (cleanUpper.includes("GBP") && cleanUpper.includes("USD")) finalPair = "GBP/USD";
      else if (cleanUpper.includes("AUD") && cleanUpper.includes("USD")) finalPair = "AUD/USD";
      else if (cleanUpper.includes("USD") && cleanUpper.includes("CAD")) finalPair = "USD/CAD";
      else if (cleanUpper.includes("USD") && cleanUpper.includes("CHF")) finalPair = "USD/CHF";
      else if (cleanUpper.includes("NZD") && cleanUpper.includes("USD")) finalPair = "NZD/USD";
      else if (cleanUpper.includes("EUR") && cleanUpper.includes("GBP")) finalPair = "EUR/GBP";
      else if (cleanUpper.includes("EUR") && cleanUpper.includes("AUD")) finalPair = "EUR/AUD";
      else if (cleanUpper.includes("GBP") && cleanUpper.includes("AUD")) finalPair = "GBP/AUD";
    }
  }

  // 2. Direct Ticker Formatting
  if (isGoldTicker) finalPair = "XAU/USD (Gold)";
  else if (isBtcTicker && (avgPrice === null || avgPrice >= 35000)) finalPair = "BTC/USD (Bitcoin)";
  else if (isEthTicker) finalPair = "ETH/USD (Ethereum)";
  else if (isSolTicker) finalPair = "SOL/USD (Solana)";
  else if (isUs30Ticker) finalPair = "US30 (Dow Jones)";
  else if (isNasTicker) finalPair = "NAS100 (Nasdaq)";
  else if (isSpxTicker) finalPair = "SPX500 (S&P 500)";
  else if (isDaxTicker) finalPair = "GER40 (DAX)";
  else if (isOilTicker) finalPair = "USOIL (WTI Crude)";
  else if (isSilverTicker) finalPair = "XAG/USD (Silver)";

  // 3. Format standard 6-letter currency codes (e.g. EURUSD -> EUR/USD, GBPJPY -> GBP/JPY)
  const lettersOnly = finalPair.replace(/[^A-Z]/g, "");
  if (lettersOnly.length === 6 && !finalPair.includes("/")) {
    finalPair = `${lettersOnly.substring(0, 3)}/${lettersOnly.substring(3)}`;
  }

  // 4. Fallback if empty or invalid
  if (!finalPair || ["UNKNOWN", "UNKNOWN_PAIR", "NULL", "N/A", "NOT_DETECTED"].includes(finalPair.toUpperCase())) {
    finalPair = fallbackPair || "EUR/USD";
  }

  analysis.detectedPair = finalPair;
  analysis.pair = finalPair;
  analysis.detectedTimeframe = normalizeDetectedTimeframe(analysis.detectedTimeframe || analysis.timeframe, "M15");
  analysis.timeframe = analysis.detectedTimeframe;

  return analysis;
}

/**
 * Fast dedicated OCR recognition engine to extract instrument symbol and timeframe in ~1s
 */
export async function recognizeInstrumentFast(
  ai: GoogleGenAI,
  cleanBase64: string,
  mimeType: string = "image/jpeg"
): Promise<{
  detectedPair: string;
  detectedTimeframe: string;
  confidence: number;
  details: string;
  isRecognized: boolean;
}> {
  const hash = crypto.createHash("sha256").update(cleanBase64).digest("hex").slice(0, 8);
  const crops = await extractChartCrops(cleanBase64);

  const prompt = `You are a high-speed financial chart OCR scanner.
Analyze this screenshot and the zoomed crops of the top-left header and right price scale.
TASK: Automatically identify the exact financial asset/instrument and chart timeframe.

INSTRUCTIONS:
1. Examine the Top-Left Header crop: Read the exact symbol ticker (e.g. XAUUSD, EURUSD, GBPUSD, USDJPY, GBPJPY, EURJPY, US30, NAS100, SPX500, BTCUSD, ETHUSD, SOLUSD, AUDUSD, USDCAD, USDCHF, NZDUSD, GER40, USOIL, XAGUSD).
2. Examine the Right Price Scale crop: Read the visible price digits to verify:
   - $2,000 - $3,500 = XAU/USD (Gold)
   - 120 - 225 = JPY cross (USD/JPY, GBP/JPY, etc.)
   - $35,000 - $46,000 = US30 (Dow Jones)
   - 16,000 - 24,000 = NAS100 (Nasdaq)
   - 4,800 - 6,500 = SPX500 (S&P 500)
   - $45,000 - $120,000+ = BTC/USD (Bitcoin)
   - 0.50 - 1.60 = Forex Major (EUR/USD, GBP/USD, etc.)
3. Examine the Timeframe interval (e.g. 1m, 3m, 5m, 15m, 30m, 1h, 4h, D, W).

Return strictly JSON matching this structure:
{
  "detectedPair": "string (e.g. XAU/USD (Gold), EUR/USD, GBP/USD, USD/JPY, US30 (Dow Jones), NAS100 (Nasdaq), BTC/USD (Bitcoin))",
  "detectedTimeframe": "string (e.g. M1, M5, M15, M30, H1, H4, D1, W1)",
  "confidence": 95,
  "details": "string (e.g. OCR verified 'XAUUSD, 15' in top-left header and price scale around 2684.50)"
}`;

  const contents: any[] = [
    {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: cleanBase64
      }
    }
  ];

  if (crops.headerCropBase64) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: crops.headerCropBase64
      }
    });
  }

  if (crops.priceAxisCropBase64) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: crops.priceAxisCropBase64
      }
    });
  }

  contents.push({ text: prompt });

  const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"];

  for (const model of candidateModels) {
    try {
      console.log(`[Fast Recognition] Scanning instrument with model ${model} for image ${hash}...`);
      const res = await withTimeout(
        ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                detectedPair: { type: "STRING" },
                detectedTimeframe: { type: "STRING" },
                confidence: { type: "INTEGER" },
                details: { type: "STRING" }
              },
              required: ["detectedPair", "detectedTimeframe", "confidence", "details"]
            }
          }
        }),
        8000,
        `Fast instrument recognition timeout after 8s for model ${model}`
      );

      const text = res?.text?.trim();
      if (text) {
        const parsed = extractJSON(text);
        const calibrated = calibrateAssetPairByPrice(parsed, "EUR/USD");
        console.log(`[Fast Recognition] ✅ Detected Instrument: "${calibrated.detectedPair}", Timeframe: "${calibrated.detectedTimeframe}" (Confidence: ${parsed.confidence}%)`);
        return {
          detectedPair: calibrated.detectedPair,
          detectedTimeframe: calibrated.detectedTimeframe,
          confidence: parsed.confidence || 90,
          details: parsed.details || "Identified via chart header and price scale OCR",
          isRecognized: true
        };
      }
    } catch (err: any) {
      console.info(`[Fast Recognition] Model ${model} cascade:`, err?.message || err);
    }
  }

  return {
    detectedPair: "EUR/USD",
    detectedTimeframe: "M15",
    confidence: 60,
    details: "Standard market structure active",
    isRecognized: false
  };
}

/**
 * Execute fresh, non-cached Gemini Vision scan on uploaded chart
 */
export async function executeChartScan(
  ai: GoogleGenAI,
  cleanBase64: string,
  mimeType: string,
  fallbackPair: string = "EUR/USD",
  fallbackTimeframe: string = "M15"
): Promise<any> {
  const hash = crypto.createHash("sha256").update(cleanBase64).digest("hex").slice(0, 12);
  const sizeKb = ((cleanBase64.length * 0.75) / 1024).toFixed(1);
  console.log(`[Gemini Vision Engine] 📸 Preparing fresh chart scan | Size: ${sizeKb} KB | MIME: ${mimeType} | Hash: ${hash} | Timestamp: ${new Date().toISOString()}`);

  const systemInstruction = `You are "Shads AI", a world-class Forex and multi-asset financial market chart scanner and Smart Money Concepts analyst.
Analyze the chart screenshot across 24 strategy engines. Return clean JSON matching schema.
Decide strictly between "BUY", "SELL", or "NO_TRADE".

CRITICAL REQUIREMENT - MARKET STRUCTURE BASED STOP LOSS & TAKE PROFIT:
- "stopLoss": MUST be anchored strictly to market structure invalidation levels:
  - For BUY: Placed below the confirmed swing low, discount order block base, demand zone, or liquidity sweep low.
  - For SELL: Placed above the confirmed swing high, premium order block ceiling, supply zone, or liquidity sweep high.
- "structureSLNote": Short 1-sentence explanation of the exact structural invalidation point (e.g. "Structure Invalidation: Protected below M15 Swing Low & Discount OB").
- "takeProfit1" - "takeProfit6": MUST be based on market structure liquidity targets:
  - TP1: Nearest internal market structure high/low, recent swing high/low, or opposing Fair Value Gap (FVG).
  - TP2: External range liquidity pool (Equal Highs/Lows, major swing extreme).
  - TP3-TP6: Higher timeframe structural extensions (1.272 / 1.618 Fib) and macro liquidity pools.
- "structureTP1Note": Short description of TP1 structural target (e.g. "Internal Liquidity Target: Recent Swing High & FVG").
- "structureTP2Note": Short description of TP2 structural target (e.g. "External Liquidity Target: Equal Highs / Buy-Side Liquidity Pool").

CRITICAL REQUIREMENT - ORDER EXECUTION TYPE RECOMMENDATION (MARKET VS LIMIT VS STOP):
You MUST specify the exact order execution recommendation for the trader:
- "orderType": Choose explicitly from "BUY NOW", "SELL NOW", "BUY LIMIT", "SELL LIMIT", "BUY STOP", "SELL STOP", or "WAIT".
  - Use "BUY NOW" or "SELL NOW" if price has ALREADY broken structure / displaced and immediate market execution is required.
  - Use "BUY LIMIT" or "SELL LIMIT" if price is currently extended into premium/discount and the trader should place a pending limit order at an Order Block, FVG, or 0.618 OTE level to capture a superior Risk-to-Reward ratio.
  - Use "BUY STOP" or "SELL STOP" if a breakout entry above/below a key range high/low is required.
- "orderTypeCategory": "MARKET" | "LIMIT" | "STOP" | "WAIT".
- "orderExecutionReason": Detailed 1-2 sentence explanation of WHY this specific order type is recommended over others.
- "orderTriggerZone": Exact price coordinates or zone where the execution occurs or limit is placed.

CRITICAL REQUIREMENT - AUTOMATIC ASSET PAIR & TIMEFRAME OCR DETECTION:
1. Thoroughly scan the ENTIRE chart screenshot for all text, watermarks, symbols, and labels:
   - Asset/Pair: Look at top-left ticker (e.g., EURUSD, GBPUSD, USDJPY, XAUUSD, GOLD, ETHUSD, SOLUSD, US30, NAS100, SPX500, GER30, AUDUSD, USDCAD, NZDUSD, USDCHF, EURJPY, GBPJPY, EURGBP, XAGUSD, USOIL, WTI).
   - Timeframe: Check timeframe interval (e.g., 1m, 3m, 5m, 15m, 30m, 45m, 1h, 2h, 4h, D, 1D, W, 1W, M1, M5, M15, M30, H1, H4, D1, W1).

2. PRICE SCALE SANITY RULES (CRITICAL):
   - Forex Majors (EUR/USD, GBP/USD, AUD/USD, USD/CAD, USD/CHF, NZD/USD): Vertical prices are between 0.50 and 1.80.
   - JPY Pairs (USD/JPY, GBP/JPY, EUR/JPY, AUD/JPY): Vertical prices are between 120 and 220.
   - XAU/USD (Gold): Price scale is in the $2,000 - $3,500 range (e.g. 2500, 2650, 2700, 2750, 2900, 3000). NEVER label a $2,000-$3,500 chart as BTC/USD!
   - NAS100 (Nasdaq): Price scale is in the 16,000 - 24,000 range.
   - US30 (Dow Jones): Price scale is in the 35,000 - 46,000 range.
   - SPX500 (S&P 500): Price scale is in the 4,800 - 6,500 range.
   - BTC/USD (Bitcoin): Price scale is ONLY in the $45,000 - $120,000+ range. DO NOT default or guess BTC/USD for standard forex, commodities, or metal charts.

3. Set "detectedPair" to the cleanly formatted name (e.g. "EUR/USD", "GBP/USD", "XAU/USD (Gold)", "USD/JPY", "NAS100", "US30", "AUD/USD", "USD/CAD", "NZD/USD", "USD/CHF", "EUR/JPY", "GBP/JPY", "ETH/USD (Ethereum)", "BTC/USD (Bitcoin)").
4. Set "detectedTimeframe" to standard notation (e.g. "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1").

Calculate exact Entry Price range, Stop Loss (SL), and 6 Take Profit targets (TP1-TP6) matching the chart's exact visible price numbers based on market structure. Provide comprehensive institutional reasoning across SMC, Market Structure, Technicals, Harmonics/Wyckoff, and Volume. Keep voiceSummary concise (1 sentence).`;

  const promptText = `Analyze this financial chart screenshot with utmost precision:
1. IDENTIFY THE ASSET / PAIR & TIMEFRAME:
   - Check the top-left chart header, TradingView/MetaTrader symbol label, watermark in the center/background, browser tab, or price axis.
   - PRICE SCALE CHECK: If the vertical price numbers are in the 2,000 - 3,500 range (e.g. 2600.00, 2750.00), this is XAU/USD (Gold). Do NOT confuse with Bitcoin ($60,000+).
   - Detect exact pair (e.g. EUR/USD, GBP/USD, XAU/USD (Gold), USD/JPY, NAS100, US30, AUD/USD, USD/CAD, NZD/USD, USD/CHF, EUR/JPY, GBP/JPY, ETH/USD, BTC/USD, etc.) and timeframe (e.g. M1, M5, M15, M30, H1, H4, D1, W1).
2. CALCULATE ENTRY, STRUCTURE-BASED STOP LOSS, AND TAKE PROFIT (TP1-TP6):
   - Anchor Stop Loss strictly behind the most recent swing high/low, order block, or liquidity sweep.
   - Specify whether immediate execution ("BUY NOW" / "SELL NOW") or a pending order ("BUY LIMIT" / "SELL LIMIT" / "BUY STOP" / "SELL STOP") is optimal.
3. CONDUCT 24-STRATEGY INSTITUTIONAL CONFLUENCE:
   - SMC, Market Structure Shifts, Liquidity Sweeps, Order Blocks, FVGs, Trendlines, Fib OTE (0.618-0.786), and Volume.
Return strictly valid JSON adhering to the schema.`;

  const crops = await extractChartCrops(cleanBase64);

  const contents: any[] = [
    {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: cleanBase64
      }
    }
  ];

  if (crops.headerCropBase64) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: crops.headerCropBase64
      }
    });
  }

  if (crops.priceAxisCropBase64) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: crops.priceAxisCropBase64
      }
    });
  }

  contents.push({ text: promptText });

  const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      console.log(`[Gemini Vision Engine] Calling model ${model} for image ${hash}...`);
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                signal: { type: "STRING" },
                orderType: { type: "STRING" },
                orderTypeCategory: { type: "STRING" },
                orderExecutionReason: { type: "STRING" },
                orderTriggerZone: { type: "STRING" },
                confidence: { type: "INTEGER" },
                detectedPair: { type: "STRING" },
                detectedTimeframe: { type: "STRING" },
                entryPrice: { type: "STRING" },
                stopLoss: { type: "STRING" },
                structureSLNote: { type: "STRING" },
                takeProfit1: { type: "STRING" },
                structureTP1Note: { type: "STRING" },
                takeProfit2: { type: "STRING" },
                structureTP2Note: { type: "STRING" },
                takeProfit3: { type: "STRING" },
                takeProfit4: { type: "STRING" },
                takeProfit5: { type: "STRING" },
                takeProfit6: { type: "STRING" },
                riskRewardRatio: { type: "STRING" },
                marketStructure: { type: "STRING" },
                smcAnalysis: {
                  type: "OBJECT",
                  properties: {
                    orderBlocks: { type: "STRING" },
                    liquiditySweeps: { type: "STRING" },
                    marketImbalance: { type: "STRING" },
                    rejectionBlocks: { type: "STRING" },
                    mitigationBlocks: { type: "STRING" },
                    displacement: { type: "STRING" }
                  },
                  required: ["orderBlocks", "liquiditySweeps", "marketImbalance"]
                },
                technicalAnalysis: {
                  type: "OBJECT",
                  properties: {
                    supportResistance: { type: "STRING" },
                    supplyDemand: { type: "STRING" },
                    trendlines: { type: "STRING" },
                    chartPatterns: { type: "STRING" },
                    candlestickPattern: { type: "STRING" }
                  },
                  required: ["supportResistance", "trendlines", "candlestickPattern"]
                },
                marketStructureAnalysis: {
                  type: "OBJECT",
                  properties: {
                    marketStructureShift: { type: "STRING" },
                    breakOfStructure: { type: "STRING" },
                    changeOfCharacter: { type: "STRING" },
                    breakoutStrategy: { type: "STRING" },
                    pullbackStrategy: { type: "STRING" },
                    sessionKillZones: { type: "STRING" }
                  }
                },
                harmonicWaveAnalysis: {
                  type: "OBJECT",
                  properties: {
                    fibonacciRetracement: { type: "STRING" },
                    elliottWaves: { type: "STRING" },
                    harmonicPatterns: { type: "STRING" },
                    wyckoffMethod: { type: "STRING" }
                  }
                },
                volumeSessionAnalysis: {
                  type: "OBJECT",
                  properties: {
                    volumeProfile: { type: "STRING" },
                    vwapAnalysis: { type: "STRING" },
                    sessionBreakouts: { type: "STRING" }
                  }
                },
                strategiesMatrix: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      id: { type: "STRING" },
                      name: { type: "STRING" },
                      category: { type: "STRING" },
                      status: { type: "STRING" },
                      confidence: { type: "INTEGER" },
                      details: { type: "STRING" }
                    },
                    required: ["id", "name", "category", "status", "confidence", "details"]
                  }
                },
                reasoning: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                voiceSummary: { type: "STRING" }
              },
              required: [
                "signal",
                "confidence",
                "detectedPair",
                "detectedTimeframe",
                "entryPrice",
                "stopLoss",
                "takeProfit1",
                "takeProfit2",
                "takeProfit3",
                "takeProfit4",
                "takeProfit5",
                "takeProfit6",
                "riskRewardRatio",
                "marketStructure",
                "smcAnalysis",
                "technicalAnalysis",
                "reasoning",
                "voiceSummary"
              ]
            }
          }
        }),
        25000,
        `Gemini vision request timed out after 25s for model ${model}`
      );

      const text = response?.text?.trim();
      if (text && text.length > 0) {
        const parsed = extractJSON(text);
        const calibrated = calibrateAssetPairByPrice(parsed, fallbackPair);
        console.log(`[Gemini Vision Engine] ✅ Model ${model} successfully recognized: Pair="${calibrated.detectedPair}", Timeframe="${calibrated.detectedTimeframe}", Signal="${calibrated.signal}"`);
        return {
          ...calibrated,
          isSimulation: false,
          imageHash: hash,
          modelUsed: model,
          scannedAt: Date.now()
        };
      }
      throw new Error(`Empty response text from model ${model}`);
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isQuota = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
      if (isQuota) {
        console.info(`[Gemini Vision Engine] Model ${model} rate threshold reached. Cascading to next candidate...`);
      } else {
        console.info(`[Gemini Vision Engine] Model ${model} unavailable. Cascading to next candidate...`);
      }
    }
  }

  throw lastError || new Error("All Gemini vision model candidates completed.");
}

/**
 * High-quality fallback simulation generator when API key is missing or models are exhausted
 */
export function getFallbackScan(pair: string = "EUR/USD", timeframe: string = "M15") {
  const finalPair = (pair || "EUR/USD").toUpperCase();
  const finalTimeframe = (timeframe || "M15").toUpperCase();

  let basePrice = 1.08520;
  let decimals = 5;
  let isCrypto = false;
  let isGold = false;

  if (finalPair.includes("JPY")) {
    basePrice = 158.45;
    decimals = 3;
  } else if (finalPair.includes("XAU") || finalPair.includes("GOLD")) {
    basePrice = 2685.50;
    decimals = 2;
    isGold = true;
  } else if (finalPair.includes("BTC")) {
    basePrice = 64250.00;
    decimals = 2;
    isCrypto = true;
  } else if (finalPair.includes("ETH")) {
    basePrice = 3450.00;
    decimals = 2;
    isCrypto = true;
  } else if (finalPair.includes("SOL")) {
    basePrice = 148.50;
    decimals = 2;
    isCrypto = true;
  } else if (finalPair.includes("GBP") && finalPair.includes("USD")) {
    basePrice = 1.2740;
    decimals = 4;
  } else if (finalPair.includes("AUD") && finalPair.includes("USD")) {
    basePrice = 0.6650;
    decimals = 4;
  } else if (finalPair.includes("USD") && finalPair.includes("CAD")) {
    basePrice = 1.3680;
    decimals = 4;
  } else if (finalPair.includes("USD") && finalPair.includes("CHF")) {
    basePrice = 0.8950;
    decimals = 4;
  } else if (finalPair.includes("NZD") && finalPair.includes("USD")) {
    basePrice = 0.6120;
    decimals = 4;
  } else if (finalPair.includes("US30") || finalPair.includes("DOW")) {
    basePrice = 39850.00;
    decimals = 1;
  } else if (finalPair.includes("NAS") || finalPair.includes("USTEC")) {
    basePrice = 19450.00;
    decimals = 1;
  } else if (finalPair.includes("SPX") || finalPair.includes("US500")) {
    basePrice = 5820.00;
    decimals = 1;
  } else if (finalPair.includes("GER") || finalPair.includes("DAX")) {
    basePrice = 18650.00;
    decimals = 1;
  } else if (finalPair.includes("OIL") || finalPair.includes("WTI") || finalPair.includes("CRUDE")) {
    basePrice = 77.40;
    decimals = 2;
  } else if (finalPair.includes("XAG") || finalPair.includes("SILVER")) {
    basePrice = 31.85;
    decimals = 3;
  }

  const signal = Math.random() > 0.4 ? "BUY" : "SELL";
  const confidence = Math.floor(Math.random() * 12) + 78;
  const p = (val: number) => val.toFixed(decimals);

  let entryPrice = "";
  let stopLoss = "";
  let takeProfit1 = "";
  let takeProfit2 = "";
  let takeProfit3 = "";
  let takeProfit4 = "";
  let takeProfit5 = "";
  let takeProfit6 = "";
  const riskRewardRatio = "1:4.9";

  let structureSLNote = "";
  let structureTP1Note = "";
  let structureTP2Note = "";
  let structureTP3Note = "";
  let structureTP4Note = "";

  if (signal === "BUY") {
    const entryLow = basePrice * 0.9995;
    const entryHigh = basePrice * 1.0002;
    entryPrice = `${p(entryLow)} - ${p(entryHigh)}`;
    
    const slVal = basePrice * (isCrypto ? 0.985 : isGold ? 0.993 : 0.9975);
    stopLoss = p(slVal);
    structureSLNote = `Structure Invalidation: Protected below ${finalTimeframe} Swing Low & Discount Order Block at ${stopLoss}`;
    
    takeProfit1 = p(basePrice * (isCrypto ? 1.02 : isGold ? 1.008 : 1.004));
    structureTP1Note = `Internal Structure Target: Nearest Swing High & Fair Value Gap (FVG) at ${takeProfit1}`;
    
    takeProfit2 = p(basePrice * (isCrypto ? 1.05 : isGold ? 1.018 : 1.009));
    structureTP2Note = `External Liquidity Target: Equal Highs (EQH) Buy-Side Liquidity Pool at ${takeProfit2}`;

    takeProfit3 = p(basePrice * (isCrypto ? 1.08 : isGold ? 1.028 : 1.014));
    structureTP3Note = `Macro Structure Expansion: 1.272 Fibonacci Structural Extension at ${takeProfit3}`;

    takeProfit4 = p(basePrice * (isCrypto ? 1.11 : isGold ? 1.038 : 1.019));
    structureTP4Note = `HTF Expansion: Major Daily Key Resistance Pool at ${takeProfit4}`;

    takeProfit5 = p(basePrice * (isCrypto ? 1.14 : isGold ? 1.048 : 1.024));
    takeProfit6 = p(basePrice * (isCrypto ? 1.17 : isGold ? 1.058 : 1.029));
  } else {
    const entryLow = basePrice * 0.9998;
    const entryHigh = basePrice * 1.0005;
    entryPrice = `${p(entryLow)} - ${p(entryHigh)}`;
    
    const slVal = basePrice * (isCrypto ? 1.015 : isGold ? 1.007 : 1.0025);
    stopLoss = p(slVal);
    structureSLNote = `Structure Invalidation: Protected above ${finalTimeframe} Swing High & Premium Order Block at ${stopLoss}`;
    
    takeProfit1 = p(basePrice * (isCrypto ? 0.98 : isGold ? 0.992 : 0.996));
    structureTP1Note = `Internal Structure Target: Nearest Swing Low & Imbalance Floor at ${takeProfit1}`;
    
    takeProfit2 = p(basePrice * (isCrypto ? 0.95 : isGold ? 0.982 : 0.991));
    structureTP2Note = `External Liquidity Target: Equal Lows (EQL) Sell-Side Liquidity Pool at ${takeProfit2}`;

    takeProfit3 = p(basePrice * (isCrypto ? 0.92 : isGold ? 0.972 : 0.986));
    structureTP3Note = `Macro Structure Expansion: 1.272 Fibonacci Structural Extension at ${takeProfit3}`;

    takeProfit4 = p(basePrice * (isCrypto ? 0.89 : isGold ? 0.962 : 0.981));
    structureTP4Note = `HTF Expansion: Major Daily Key Demand Floor at ${takeProfit4}`;

    takeProfit5 = p(basePrice * (isCrypto ? 0.86 : isGold ? 0.952 : 0.976));
    takeProfit6 = p(basePrice * (isCrypto ? 0.83 : isGold ? 0.942 : 0.971));
  }

  const marketStructure = signal === "BUY"
    ? `Bullish (Market Structure Shift detected on ${finalTimeframe})`
    : `Bearish (Break of Structure confirmed on ${finalTimeframe})`;

  const smcAnalysis = {
    orderBlocks: signal === "BUY"
      ? `Validated ${finalTimeframe} Bullish Mitigation Block at ${p(basePrice * 0.999)} with institutional buy-side liquidity injection.`
      : `Confirmed ${finalTimeframe} Bearish Order Block at ${p(basePrice * 1.001)} displaying strong sell-side displacement.`,
    liquiditySweeps: signal === "BUY"
      ? `Clean sweep of retail sell-stops below key swing low at ${p(basePrice * 0.998)} before impulsive rebound.`
      : `Clean raid on buy-side buy-stops above local equal highs before heavy distribution.`,
    marketImbalance: signal === "BUY"
      ? `Fair Value Gap (FVG) open between ${p(basePrice * 1.0005)} and ${p(basePrice * 1.0015)} on ${finalTimeframe}.`
      : `Bearish Fair Value Gap (FVG) detected between ${p(basePrice * 0.9985)} and ${p(basePrice * 0.9995)}.`,
    rejectionBlocks: signal === "BUY"
      ? `Institutional wick rejection at ${p(basePrice * 0.9978)} absorbing retail panic selling.`
      : `Upper shadow rejection block at ${p(basePrice * 1.0022)} where smart money rejected higher prices.`,
    mitigationBlocks: signal === "BUY"
      ? `Failed swing high mitigated at ${p(basePrice * 0.9992)}, flipping previous supply into new support.`
      : `Unmitigated demand block broken and retested at ${p(basePrice * 1.0008)} as fresh supply.`,
    displacement: signal === "BUY"
      ? `High-velocity 3-candle bullish displacement leg expanding +1.4% with heavy institutional momentum.`
      : `Aggressive downward expansion breaking 2 key lows with +1.6% institutional momentum.`
  };

  const technicalAnalysis = {
    supportResistance: signal === "BUY"
      ? `Primary support pivot holding solid at ${p(basePrice * 0.9975)}. Upside targets open to daily resistance at ${p(basePrice * 1.012)}.`
      : `Major resistance cap holding strong at ${p(basePrice * 1.003)}. Downside targets open to primary daily support at ${p(basePrice * 0.988)}.`,
    supplyDemand: signal === "BUY"
      ? `Unfilled Institutional Demand Zone active at ${p(basePrice * 0.9988)} to ${p(basePrice * 0.9995)}.`
      : `Fresh Supply Zone active at ${p(basePrice * 1.0005)} to ${p(basePrice * 1.0012)} with heavy ask order stack.`,
    trendlines: `Respected ascending support line on high-timeframe structural charts.`,
    chartPatterns: signal === "BUY"
      ? `Inverse Head and Shoulders neckline break at ${p(basePrice * 1.0002)} with target extension at TP4.`
      : `Double Top reversal pattern confirmed at ${p(basePrice * 1.0025)} with breakdown projection to TP4.`,
    candlestickPattern: signal === "BUY"
      ? `Bullish Rejection Candle (Pin bar) + confirmation close inside local discount area.`
      : `Bearish Engulfing Candle forming at key premium liquidity pool boundary.`
  };

  const isMarketExecution = Math.random() > 0.45;
  const orderType = signal === "BUY"
    ? (isMarketExecution ? "BUY NOW" : "BUY LIMIT")
    : (isMarketExecution ? "SELL NOW" : "SELL LIMIT");
  const orderTypeCategory = isMarketExecution ? "MARKET" : "LIMIT";

  let orderExecutionReason = "";
  let orderTriggerZone = "";

  if (signal === "BUY") {
    if (orderType === "BUY NOW") {
      orderExecutionReason = `Direct Market Execution (BUY NOW): Price has confirmed a decisive Market Structure Shift and 5-minute displacement candle.`;
      orderTriggerZone = `Execute BUY NOW at current market price (${entryPrice})`;
    } else {
      orderExecutionReason = `Pending Limit Order (BUY LIMIT): Place a pending BUY LIMIT order at the 0.618 OTE discount zone.`;
      orderTriggerZone = `Place BUY LIMIT at ${p(basePrice * 0.9995)}`;
    }
  } else {
    if (orderType === "SELL NOW") {
      orderExecutionReason = `Direct Market Execution (SELL NOW): Clean sweep of buy-side equal highs followed by an aggressive displacement candle breaking structure downward.`;
      orderTriggerZone = `Execute SELL NOW at current market price (${entryPrice})`;
    } else {
      orderExecutionReason = `Pending Limit Order (SELL LIMIT): Set a pending SELL LIMIT order at the Bearish Mitigation Block / Premium 50% FVG retrace.`;
      orderTriggerZone = `Place SELL LIMIT at ${p(basePrice * 1.0008)}`;
    }
  }

  const cleanPairNameForSpeech = finalPair.replace("/", " ");
  const voiceSummary = signal === "BUY"
    ? `${cleanPairNameForSpeech} indicates a ${orderType} setup on the ${finalTimeframe} chart. All 24 trading engines validate the bullish signal. Target TP1 through TP6 up to ${takeProfit6} with stop loss at ${stopLoss}.`
    : `${cleanPairNameForSpeech} indicates a ${orderType} setup on the ${finalTimeframe} chart. Bearish order flow confirms the short signal. Target TP1 through TP6 down to ${takeProfit6} with stop loss at ${stopLoss}.`;

  return {
    signal,
    orderType,
    orderTypeCategory,
    orderExecutionReason,
    orderTriggerZone,
    confidence,
    detectedPair: finalPair,
    detectedTimeframe: finalTimeframe,
    entryPrice,
    stopLoss,
    structureSLNote,
    takeProfit1,
    structureTP1Note,
    takeProfit2,
    structureTP2Note,
    takeProfit3,
    structureTP3Note,
    takeProfit4,
    structureTP4Note,
    takeProfit5,
    takeProfit6,
    riskRewardRatio,
    marketStructure,
    smcAnalysis,
    technicalAnalysis,
    reasoning: [
      `Structure on ${finalTimeframe} shifted ${signal === "BUY" ? "bullish" : "bearish"} following liquidity sweep.`,
      `Smart money displacement leg created a clean Fair Value Gap.`,
      `Entry aligns with 0.618 Fibonacci zone and institutional volume profile.`,
      `24-Strategy confluence confirms 1:4.9 Risk-to-Reward.`
    ],
    voiceSummary,
    isSimulation: true
  };
}
