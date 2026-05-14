import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenRouterClient(): OpenAI | null {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  if (_client) return _client;
  _client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
    defaultHeaders: {
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Celestial Astrology Chat",
    },
  });
  return _client;
}

export const MODELS = {
  INTENT: "google/gemini-2.5-flash",
  REASONING: "google/gemini-2.5-flash",
  PERSONA: "google/gemini-2.5-flash",
  PERSONA_FALLBACK: "google/gemini-2.5-flash",
} as const;
