import OpenAI from "openai";
import { unstable_cache } from "next/cache";

export const getDailyHoroscopes = unstable_cache(
  async () => {
    try {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterKey) return null;

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
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || "[]";
      // strip markdown if any
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(jsonStr) as { name: string; description: string }[];
    } catch (error) {
      console.error("Daily Horoscope AI Error:", error);
      return null;
    }
  },
  ['daily-horoscope-ai'],
  { revalidate: 86400 } // Cache for 24 hours
);

export const getDetailedHoroscope = async (sign: string) => {
  const fetcher = unstable_cache(
    async (s: string) => {
      try {
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) return null;

        const openai = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: openRouterKey,
          defaultHeaders: {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Astrology App",
          }
        });

        const prompt = `You are an expert Vedic astrologer. Generate a highly detailed, personalized daily horoscope for the zodiac sign ${s} for today.
Provide the reading in a structured JSON format with the following keys:
{
  "general": "A general overview of the day (3-4 sentences).",
  "career": "Insights regarding career, work, and finances.",
  "love": "Insights regarding love, relationships, and family.",
  "health": "Insights regarding health and well-being.",
  "luckyColor": "A specific lucky color",
  "luckyNumber": "A single lucky number"
}
Return ONLY the raw JSON object string without any markdown formatting.`;

        const response = await openai.chat.completions.create({
          model: "deepseek/deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content || "{}";
        const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(jsonStr) as {
          general: string;
          career: string;
          love: string;
          health: string;
          luckyColor: string;
          luckyNumber: string;
        };
      } catch (error) {
        console.error(`Detailed Horoscope AI Error for ${s}:`, error);
        return null;
      }
    },
    [`detailed-horoscope-${sign}`],
    { revalidate: 86400 } // Cache for 24 hours
  );

  return fetcher(sign);
};
