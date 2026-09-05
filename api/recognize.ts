import { GoogleGenAI } from "@google/genai";
import { validateBase64Image, recognizeInstrumentFast } from "../src/server/scannerEngine";

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
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { image, mimeType } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: "No image provided for instrument recognition." });
    }

    const validation = validateBase64Image(image, mimeType);
    if (!validation.isValid || !validation.cleanBase64) {
      return res.status(400).json({ error: "Invalid image data." });
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
    const result = await recognizeInstrumentFast(
      ai,
      validation.cleanBase64,
      validation.normalizedMime || "image/jpeg"
    );

    return res.json(result);
  } catch (error: any) {
    console.warn("[Vercel API /api/recognize] Recognition error:", error?.message || error);
    return res.json({
      detectedPair: "EUR/USD",
      detectedTimeframe: "M15",
      confidence: 60,
      details: "Automatic OCR standby mode",
      isRecognized: false
    });
  }
}
