import type { NatalChart } from "./types";
import { SIGNS_VEDIC } from "./constants";
import { getOpenRouterClient, MODELS } from "@/lib/ai/client";
import { buildChartDigest } from "@/lib/astrology/chart";

export interface DeepInterpretations {
  personality: string;
  profession: string;
  father: string;
}

export function generateDeepInterpretations(chart: NatalChart): DeepInterpretations {
  const ascSign = chart.ascendant.signName;
  const ascLord = chart.houseLords[1];
  const moonSign = chart.planets.find(p => p.name === "Moon")?.signName || "";
  const sunSign = chart.planets.find(p => p.name === "Sun")?.signName || "";

  let personality = `With ${ascSign} rising on the Ascendant, your core approach to life is shaped by the energy of this sign, while your ruling planet ${ascLord} acts as the steering wheel for your physical and mental vitality. Your Moon in ${moonSign} dictates your emotional inner world. Meanwhile, your Sun in ${sunSign} illuminates your ego and soul purpose.`;

  const tenthLord = chart.houseLords[10];
  const planetsIn10th = chart.planets.filter(p => p.house === 10);
  let profession = `The 10th house governs your career. It is ruled by ${tenthLord}. `;
  if (planetsIn10th.length > 0) profession += `The presence of ${planetsIn10th.map(p => p.name).join(" and ")} strongly colours your professional life. `;
  else profession += `The dignity of ${tenthLord} indicates your career trajectory. `;

  const ninthLord = chart.houseLords[9];
  const planetsIn9th = chart.planets.filter(p => p.house === 9);
  const sunPos = chart.planets.find(p => p.name === "Sun");
  let father = `The 9th house is ruled by ${ninthLord}. `;
  if (planetsIn9th.length > 0) father += `The presence of ${planetsIn9th.map(p => p.name).join(" and ")} affects your beliefs and relationship with your father. `;
  if (sunPos) father += `The Sun is in your ${sunPos.house}th house in ${sunPos.signName}, indicating your connection to authority.`;

  return { personality, profession, father };
}

export async function generateAIInterpretations(chart: NatalChart, lang: "en" | "hi"): Promise<DeepInterpretations> {
  const client = getOpenRouterClient();
  if (!client) return generateDeepInterpretations(chart); // Fallback to deterministic

  const digest = buildChartDigest(chart, null);
  const chartContext = {
    identity: digest.identity,
    planets: digest.planets,
    houseSummary: digest.houseSummary,
    yogas: digest.yogas,
    doshas: digest.doshas
  };

  const systemPrompt = `You are an expert Vedic Astrologer creating a PDF report. Analyze the provided Kundali JSON and generate three deep, insightful paragraphs:
1. "personality": Analyze the Lagna, Lagna Lord, Moon, and Sun to describe their inner nature and ego.
2. "profession": Analyze the 10th house, its lord, and any occupants to describe their career karma, status, and power.
3. "father": Analyze the 9th house, its lord, any occupants, and the Sun's dignity to describe their fortune, beliefs, and relationship with their father.

RULES:
- Use ONLY Vedic astrology principles (no Western tropical).
- Write in ${lang === "hi" ? "pure Hindi (Devanagari script)" : "English"}.
- Be profound, highly detailed, and sound like a wise traditional Jyotishi.
- Output ONLY a JSON object with keys "personality", "profession", and "father".`;

  try {
    const res = await client.chat.completions.create({
      model: MODELS.REASONING,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(chartContext, null, 2) }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const raw = res.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw) as DeepInterpretations;
    if (parsed.personality && parsed.profession && parsed.father) {
      return parsed;
    }
  } catch (e) {
    console.error("Failed to generate AI interpretations:", e);
  }

  // Fallback if AI parsing fails
  return generateDeepInterpretations(chart);
}
