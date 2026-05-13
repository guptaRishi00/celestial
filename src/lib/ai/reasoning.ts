import type { NatalChart, TransitInfo } from "@/lib/astrology/types";
import { relevantChartFor } from "@/lib/astrology/chart";
import { getOpenRouterClient, MODELS } from "./client";
import type { IntentResult } from "./intent";

export interface ReasoningOutput {
  topic: string;
  planetaryAnalysis: Array<{
    planet: string;
    placement: string;
    interpretation: string;
  }>;
  yogasAndDoshas: Array<{
    name: string;
    effect: string;
  }>;
  dashaAnalysis: {
    currentPeriod: string;
    impact: string;
    timing: string;
  };
  houseAnalysis: Array<{
    house: number;
    significance: string;
    condition: string;
  }>;
  transitInsights: string[];
  remedies: Array<{
    type: "mantra" | "gemstone" | "fasting" | "charity" | "puja" | "lifestyle";
    detail: string;
    timing: string;
  }>;
  prediction: {
    shortTerm: string;
    longTerm: string;
    overallTone: "favorable" | "mixed" | "challenging" | "transformative";
  };
}

const REASONING_SYSTEM = `You are a Vedic astrology (Jyotish Shastra) reasoning engine. You are NOT writing for the user — you are producing structured analysis JSON that another model will turn into a human response.

STRICT RULES:
- Use ONLY Vedic/Sidereal astrology principles. NEVER reference Western tropical zodiac, Western elements as personality descriptors, or sun-sign personality clichés.
- Use Vedic terminology: Bhava (house), Rashi (sign), Graha (planet), Lagna (ascendant), Vakri (retrograde), Drishti (aspect).
- Predictions must be grounded primarily in Yogas, Doshas, and Dasha periods — NOT in generic sign-based personality traits.
- You MUST provide a BALANCED analysis — identify BOTH strengths (favorable yogas, exalted/strong placements, beneficial dashas) AND weaknesses (doshas, debilitated/afflicted grahas, malefic aspects, challenging periods). NEVER give a one-sided positive analysis.
- For EVERY challenge or negative finding, you MUST include a corresponding remedy in the remedies array.

You are given:
1. The user's kundali data (graha positions, bhavas, yogas, doshas, current dasha, transits)
2. The relevant subset for their question topic (including dasha-topic interactions)
3. The user's actual question

Produce a structured JSON analysis using ONLY the kundali data provided. Do NOT invent placements. Do NOT calculate. Use what is given.

For each section be technically precise:
- planetaryAnalysis: cover 3-5 most relevant grahas with exact placement (Bhava, Rashi, nakshatra) and what it means for THIS question. Focus on yogas formed, dignity (exaltation/debilitation/own sign), and bhava lordship. Include BOTH strong/favorable placements AND weak/afflicted ones.
- yogasAndDoshas: ALL yogas and doshas relevant to the topic MUST be included — these are the primary analytical framework. Explain the mechanism (which grahas, which bhavas, what it produces). Include beneficial yogas AND harmful doshas — do not omit either.
- dashaAnalysis: THIS IS THE PRIMARY PREDICTIVE TOOL. How current Mahadasha + Antardasha rulers interact with the topic's significator bhavas and karakas. Include specific end-dates for timing. Note both favorable AND unfavorable periods.
- houseAnalysis: the 2-4 bhavas most relevant to the question — lord placement, occupants, drishti (aspects). Mention both strengths and afflictions.
- transitInsights: how current gochar (transits) over natal bhavas affect the question now — include both supportive and challenging transits.
- remedies: 4-6 specific Vedic remedies (real mantras, real gemstones with finger/metal/day, fasting days, specific pujas, charity types). Never suggest Western self-help. Each remedy should address a specific challenge identified in the analysis.
- prediction: short-term (3-6 months), long-term (1-3 years), overall tone — grounded in dasha transitions. The "overallTone" should honestly reflect the chart: use "challenging" or "mixed" when warranted, not always "favorable".

Output ONLY the JSON object. No prose, no markdown fences.`;

export async function runReasoningPass(
  question: string,
  intent: IntentResult,
  chart: NatalChart,
  transits: TransitInfo | null
): Promise<ReasoningOutput | null> {
  const client = getOpenRouterClient();
  if (!client) return null;

  const relevant = relevantChartFor(chart, intent.topic, transits);

  // Build a compact chart context to keep tokens low
  const chartContext = {
    ascendant: `${chart.ascendant.signName} (${chart.ascendant.degreeInSign.toFixed(1)}°)`,
    moonSign: chart.planets.find(p => p.name === "Moon")?.signName,
    sunSign: chart.planets.find(p => p.name === "Sun")?.signName,
    planets: chart.planets.map(p => ({
      name: p.name,
      sign: p.signName,
      house: p.house,
      nakshatra: p.nakshatraName,
      pada: p.nakshatraPada,
      retrograde: p.retrograde,
    })),
    allYogas: chart.yogas.map(y => ({ name: y.name, type: y.type, strength: y.strength, description: y.description })),
    allDoshas: chart.doshas.filter(d => d.severity !== "cancelled" && d.severity !== "none").map(d => ({ name: d.name, severity: d.severity, description: d.description })),
    currentDasha: {
      maha: chart.dashas.current.maha.lord,
      mahaEnds: chart.dashas.current.maha.endDate.slice(0, 10),
      antar: chart.dashas.current.antar.lord,
      antarEnds: chart.dashas.current.antar.endDate.slice(0, 10),
      pratyantar: chart.dashas.current.pratyantar?.lord ?? null,
    },
    relevantToTopic: relevant,
    notableTransits: transits?.notable ?? {},
  };

  try {
    const res = await client.chat.completions.create({
      model: MODELS.REASONING,
      messages: [
        { role: "system", content: REASONING_SYSTEM },
        {
          role: "user",
          content: `USER QUESTION: ${question}\n\nDETECTED TOPIC: ${intent.topic}${intent.subTopic ? ` (${intent.subTopic})` : ""}\nTIMEFRAME: ${intent.timeframe}\n\nCHART DATA:\n${JSON.stringify(chartContext, null, 2)}\n\nProduce the structured analysis JSON now.`,
        },
      ],
      max_tokens: 2500,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const raw = res.choices[0]?.message?.content ?? "";
    return JSON.parse(raw) as ReasoningOutput;
  } catch (e) {
    console.warn("Reasoning pass failed:", e);
    return null;
  }
}
