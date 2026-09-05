import { GoogleGenAI } from "@google/genai";
import { validateBase64Image, executeChartScan, getFallbackScan } from "../src/server/scannerEngine";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

let cachedGeminiClient: GoogleGenAI | null = null;

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
  // CORS & Security Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT,HEAD");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin, Cache-Control, Pragma");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { image, mimeType, pair, selectedPair, timeframe, selectedTimeframe } = req.body || {};

    const rawPair = pair || selectedPair || "EUR/USD";
    const rawTimeframe = timeframe || selectedTimeframe || "M15";

    if (!image) {
      return res.status(400).json({ error: "No chart image provided in request body." });
    }

    const validation = validateBase64Image(image, mimeType);
    if (!validation.isValid || !validation.cleanBase64) {
      return res.status(400).json({ error: validation.error || "Invalid screenshot image data." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[Vercel /api/scan] GEMINI_API_KEY not found. Returning simulation.");
      return res.status(200).json(getFallbackScan(rawPair, rawTimeframe));
    }

    const ai = getGeminiClient();
    const result = await executeChartScan(
      ai,
      validation.cleanBase64,
      validation.normalizedMime || "image/jpeg",
      rawPair,
      rawTimeframe
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("[Vercel /api/scan Error]:", error);
    const rawPair = req.body?.pair || req.body?.selectedPair || "EUR/USD";
    const rawTimeframe = req.body?.timeframe || req.body?.selectedTimeframe || "M15";
    const fallback = getFallbackScan(rawPair, rawTimeframe);
    return res.status(200).json(fallback);
  }
}
