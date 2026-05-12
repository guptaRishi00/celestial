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

// Model identifiers (OpenRouter slugs)
export const MODELS = {
  INTENT: "deepseek/deepseek-chat",       // ultra cheap, fast classifier
  REASONING: "deepseek/deepseek-chat",    // structured JSON output
  PERSONA: "moonshotai/kimi-k2",          // long-form Hinglish persona
  PERSONA_FALLBACK: "deepseek/deepseek-chat",
} as const;
