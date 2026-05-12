import OpenAI from "openai";
import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache for 24 hours (Next.js App Router cache)

export async function GET() {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: "No API key configured" }, { status: 500 });
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openRouterKey,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Astrology App",
      }
    });

    const prompt = `You are an expert Vedic astrologer. Generate today's daily horoscope for all 12 zodiac signs. 
Return ONLY a valid JSON array where each item has this exact structure:
[
  {
    "name": "Aries",
    "description": "Today's horoscope text here... (around 2 sentences)"
  },
  ...
]
Do not include any markdown formatting blocks like \`\`\`json. Just return the raw JSON array string. Ensure all 12 signs are included exactly as: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces.`;

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat", // standard deepseek model for reliable JSON
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "[]";
    // strip markdown if any
    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Daily Horoscope Error:", error);
    return NextResponse.json({ error: "Failed to fetch horoscope" }, { status: 500 });
  }
}
