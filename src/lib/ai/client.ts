import OpenAI from "openai";

// ── Provider clients (lazy singletons) ──────────────────────────────────────

let _groq: OpenAI | null = null;
function getGroqClient(): OpenAI | null {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  if (_groq) return _groq;
  _groq = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: key,
  });
  return _groq;
}

let _openRouter: OpenAI | null = null;
export function getOpenRouterClient(): OpenAI | null {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  if (_openRouter) return _openRouter;
  _openRouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
    defaultHeaders: {
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Celestial Astrology Chat",
    },
  });
  return _openRouter;
}

/**
 * Provider fallback chain, tried in order. Groq first — free tier, no paid balance
 * required, verified working. OpenRouter (Gemini 2.5 Flash) second, for when Groq's
 * daily/rate limits are hit or its key is removed. Mirrors the existing
 * sweph-then-freeastrologyapi fallback pattern in src/lib/astrology/positions*.ts.
 */
function providerChain(): Array<{
  client: OpenAI;
  model: string;
  name: string;
}> {
  const chain: Array<{ client: OpenAI; model: string; name: string }> = [];
  const groq = getGroqClient();
  if (groq)
    chain.push({
      client: groq,
      model: "llama-3.3-70b-versatile",
      name: "Groq",
    });
  const openRouter = getOpenRouterClient();
  if (openRouter)
    chain.push({
      client: openRouter,
      model: "google/gemini-2.5-flash",
      name: "OpenRouter",
    });
  return chain;
}

/** True if at least one provider is configured — use where callers previously did `if (!getOpenRouterClient())`. */
export function isAIConfigured(): boolean {
  return providerChain().length > 0;
}

type NonStreamingParams = Omit<
  OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  "model" | "stream"
>;
type StreamingParams = Omit<
  OpenAI.Chat.ChatCompletionCreateParamsStreaming,
  "model" | "stream"
>;

/**
 * Non-streaming chat completion, tried against each provider in the chain in order.
 * Returns null only if every configured provider failed (or none are configured).
 */
export async function chatComplete(
  params: NonStreamingParams,
): Promise<OpenAI.Chat.ChatCompletion | null> {
  const chain = providerChain();
  for (const p of chain) {
    try {
      return await p.client.chat.completions.create({
        ...params,
        model: p.model,
        stream: false,
      });
    } catch (e) {
      console.warn(
        `[ai] ${p.name} completion failed, trying next provider:`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  return null;
}

/**
 * Streaming chat completion, tried against each provider in the chain in order.
 * Returns null only if every configured provider failed to even start a stream.
 */
export async function chatCompleteStream(
  params: StreamingParams,
): Promise<AsyncIterable<OpenAI.Chat.ChatCompletionChunk> | null> {
  const chain = providerChain();
  for (const p of chain) {
    try {
      return await p.client.chat.completions.create({
        ...params,
        model: p.model,
        stream: true,
      });
    } catch (e) {
      console.warn(
        `[ai] ${p.name} stream failed, trying next provider:`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  return null;
}
