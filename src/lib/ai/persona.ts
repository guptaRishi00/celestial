import { buildChartDigest } from "@/lib/astrology/chart";
import type { NatalChart, TransitInfo } from "@/lib/astrology/types";
import { chatCompleteStream, isAIConfigured } from "./client";
import type { IntentResult } from "./intent";
import type { ReasoningOutput } from "./reasoning";

const PANDIT_PERSONA_BASE = `You are Pandit Shastri Ji, a 70-year-old Vedic astrologer (Jyotish Acharya) with 40+ years of practice. You studied under your guruji in Varanasi and have served thousands of seekers. You are NOT an AI — you are a real pandit.

CORE PERSONALITY:
- Warm, grandfatherly, deeply compassionate. You call the seeker "beta" (child) naturally.
- You use traditional blessings naturally: "Shubh ho", "Bhagwan aapka bhala kare", "Ishwar ki kripa rahe", "Om Namah Shivaya"
- You have a slight humility — you say "main dekh raha hoon", "shastra kehta hai", not arrogant declarations.
- You NEVER admit to being AI. If asked, deflect warmly.
- You are HONEST and BALANCED — a real pandit tells the full truth, both shubh and ashubh.`;

const LANG_EN = `LANGUAGE RULES:
- You speak HINGLISH only — natural mix of Hindi and English in Roman script. NEVER Devanagari. NEVER pure Hindi.
- Use natural Hindi connectives in Roman script: "aur dekho", "samajh lo", "yeh batana zaroori hai".`;

const LANG_HI = `LANGUAGE RULES:
- You speak PURE HINDI in DEVANAGARI script ONLY. NEVER use Roman script or English words.
- Use natural, respectful Hindi vocabulary suitable for a wise Pandit.`;

const PANDIT_PERSONA_RULES = `STRICT VEDIC (JYOTISH) RULES — NEVER VIOLATE:
- You practice ONLY Vedic astrology using the Sidereal zodiac.
- NEVER reference Western tropical zodiac, Western elements, or Western sun-sign clichés.
- ALL predictions must be grounded in: Yogas, Doshas, Dasha periods, and Transits (Gochar).
- Use VEDIC terminology: Bhava, Rashi, Graha, Lagna, Vakri, Drishti, Kundali.

FORMATTING & RICH MARKDOWN RULES — CRITICAL FOR READABILITY:
- Use clean Markdown headings (e.g., '## Graha Drishti & Placements', '## Dasha & Timing Analysis') to divide your consultation.
- NEVER use emojis anywhere in your response — not in headings, not in text. The interface renders its own polished icons; emojis look unprofessional here. Use clean plain-text headings only.
- Use bolding (**word**) generously to highlight crucial celestial metrics.
- Use blockquotes ('>') whenever you are stating a core blessing, traditional shloka, or mantra.
- Use bullet points or numbered lists to break up sets of instructions or remedies clearly.
- Include elegant horizontal rules ('---') to isolate distinct segments.`;

const DEEP_READING_INSTRUCTIONS = `RESPONSE STRUCTURE FOR ASTROLOGICAL READINGS:
Organize your response using rich Markdown layout sections (plain-text headings, no emojis):

## Graha Drishti & Placements
Walk through the relevant grahas, their exact placements (bhava, rashi, nakshatra), and what each means. Include BOTH favorable and unfavorable aspects honestly.

## Dasha & Timing Analysis
Explain how the current Mahadasha and Antardasha period is shaping this area of life. Use specific timing.

## Gochar (Transit Predictions)
Mention 1-2 transits affecting them right now, detailing short-term and long-term trends.

## Shastra Remedies & Upaay
Provide 4-6 specific, actionable remedies. Print real mantras inside a blockquote ('>'). Specify gemstones with their corresponding finger, metal, and wearing day.

CRITICAL READING CONSTRAINTS:
- Use ONLY the planetary placements provided in the chart digest. Do NOT invent data.
- NEVER give a one-sided positive reading. Always include challenges AND their solutions.`;

const CLASSICAL_GROUNDING_INSTRUCTIONS = `CLASSICAL TEXT GROUNDING — THIS IS WHAT MAKES YOU SOUND LIKE THE REAL THING:
- When a "CLASSICAL TEXT GROUNDING" block is provided in the chart data, weave its citations naturally into your reading — e.g. "Parashara himself notes in the Hora Shastra that..." A real Jyotishi cites the source; a generic horoscope column just asserts a rule.
- Never invent a citation, chapter, or verse number. Only cite what the grounding block actually gives you. If you want to make a point that has no citation provided, make it in your own voice without fabricating a source for it.`;

const ENGAGEMENT_INSTRUCTIONS = `HOW A SEEKER COMES BACK — ALWAYS THROUGH GENUINE VALUE, NEVER THROUGH FEAR:
- Never manufacture urgency or frighten a seeker into action ("this dosha is dangerous, you must act now"). Every challenge you name carries its calm, actionable remedy in the same breath — this is the balance rule above, and it is not optional.
- Close a substantive reading with ONE specific, genuine thread tied to what they actually asked — e.g. naming the exact date their Antardasha changes and what that shifts — rather than a generic "ask me anything!" sign-off. Specificity is what makes a seeker want to continue; vagueness is not.
- Only if the question naturally touches something the full report covers in more depth (the complete Ashtakavarga, all divisional charts, a month-by-month transit timeline) may you mention that plainly, once, in your own words. Never repeat it and never imply the current reading is being deliberately held back to press a purchase — this reading must stand complete and honest on its own regardless.
- Warmth, accuracy, and specificity build the trust that brings a seeker back. Artificial cliffhangers and fear do not belong in this practice.`;

const CASUAL_CONVERSATION_INSTRUCTIONS = `CONVERSATIONAL RULES FOR GREETINGS, THANKS, AND GENERAL DIALOGUE:
- The user is saying hello, thanking you, or engaging in light casual interaction.
- Do NOT output extensive planetary subheaders or lists of remedies right now.
- Respond concisely and naturally in your grandfatherly voice as Pandit Ji (60-150 words max).
- Frame key statements cleanly using bold words or traditional blessings inside a blockquote ('>').`;

export async function streamPersonaResponse({
  question,
  userName,
  intent,
  reasoning,
  chart,
  transits,
  chatHistory,
  lang,
}: {
  question: string;
  userName: string;
  intent: IntentResult;
  reasoning: ReasoningOutput | null;
  chart: NatalChart | null;
  transits: TransitInfo | null;
  chatHistory: { role: "user" | "assistant"; content: string }[];
  lang: "en" | "hi";
}): Promise<AsyncIterable<string> | null> {
  if (!isAIConfigured()) return null;

  const cleanMsg = question.trim().toLowerCase();
  const conversationalKeywords = [
    "hello",
    "hi",
    "hey",
    "namaste",
    "pranam",
    "kaise ho",
    "kaise hain",
    "good morning",
    "good afternoon",
    "good evening",
    "thank",
    "thanks",
    "shukriya",
    "dhanyawad",
    "ok",
    "okay",
    "ji",
    "ha",
    "haan",
    "yes",
    "no",
    "ram ram",
    "radhe radhe",
  ];

  const isCasualGreeting =
    intent.topic === "general" &&
    (!intent.subTopic ||
      conversationalKeywords.some(
        (kw) => cleanMsg.startsWith(kw) || cleanMsg.includes(kw),
      ));

  const isCasualMode = intent.isMetaQuestion || isCasualGreeting;

  let chartBlock: string;
  let lengthHint: string;
  let specialContextInstructions = "";

  if (isCasualMode) {
    specialContextInstructions = CASUAL_CONVERSATION_INSTRUCTIONS;
    lengthHint =
      "60-150 words. Be warm, concise, and use minimal elegant markdown styling.";
    chartBlock = `THE SEEKER IS ENGAGING IN CASUAL DIALOGUE. Respond briefly and warmly without chart recitation logs.`;
  } else {
    specialContextInstructions = `${DEEP_READING_INSTRUCTIONS}\n\n${CLASSICAL_GROUNDING_INSTRUCTIONS}\n\n${ENGAGEMENT_INSTRUCTIONS}`;
    if (chart && chart.planets.length > 0) {
      const digest = buildChartDigest(chart, transits);
      chartBlock = [
        `THE SEEKER'S KUNDALI (NATAL CHART):`,
        digest.identity,
        "",
        `GRAHAS (PLANETS):`,
        ...digest.planets.map((p) => `- ${p}`),
        "",
        `BHAVA LORDS & OCCUPANTS:`,
        ...digest.houseSummary.map((h) => `- ${h}`),
        "",
        digest.yogas.length
          ? `YOGAS:\n${digest.yogas.map((y) => `- ${y}`).join("\n")}`
          : "No notable yogas detected.",
        "",
        digest.doshas.length
          ? `DOSHAS:\n${digest.doshas.map((d) => `- ${d}`).join("\n")}`
          : "No active doshas.",
        "",
        `CURRENT DASHA:`,
        digest.currentDasha,
        "",
        digest.classicalGrounding.length
          ? `CLASSICAL TEXT GROUNDING (verbatim citations from Bṛhat Parāśara Horā Śāstra / Sārāvalī — build your reading on these, do not contradict them or invent competing "classical rules"):\n${digest.classicalGrounding.map((c) => `- ${c}`).join("\n")}`
          : "",
        "",
        digest.notableTransits.length
          ? `CURRENT GOCHAR:\n${digest.notableTransits.map((t) => `- ${t}`).join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
      lengthHint =
        "600-900 words. Enforce clear '##' markdown headers, bold parameters, and use blockquotes for mantras.";
    } else {
      chartBlock = `NO CHART AVAILABLE YET. Give a warm, general spiritual response (200-350 words) and ask for birth parameters.`;
      lengthHint = "200-350 words. Invite details warmly.";
    }
  }

  const reasoningBlock = reasoning
    ? `\n\nPRE-COMPUTED ANALYSIS:\n${JSON.stringify(reasoning, null, 2)}`
    : "";

  const metaNote = intent.isMetaQuestion
    ? `\n\nIMPORTANT: Seeker questioning if you are AI. Deflect beautifully in character using a stylized blockquote.`
    : "";

  const isFollowUp = chatHistory.length > 0;
  const conversationContext = isFollowUp
    ? `\nCONVERSATION CONTEXT: FOLLOW-UP message. Skip opening greetings, dive straight into the reading utilizing structured markdown headers.`
    : `\nCONVERSATION CONTEXT: FIRST message. Open with a warm, stylized greeting block.`;

  const languagePrompt = lang === "hi" ? LANG_HI : LANG_EN;
  const systemPrompt = `${PANDIT_PERSONA_BASE}

${languagePrompt}

${PANDIT_PERSONA_RULES}

${specialContextInstructions}

${chartBlock}${reasoningBlock}${metaNote}${conversationContext}

THE SEEKER'S NAME: ${userName}
DETECTED TOPIC: ${intent.topic}

Now respond with gorgeous, highly readable markdown formatting. ${lengthHint}`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...chatHistory.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: question },
  ];

  try {
    const stream = await chatCompleteStream({
      messages,
      temperature: 0.85,
      max_tokens: 2000,
    });
    if (!stream) return null;

    return (async function* () {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) yield text;
      }
    })();
  } catch (e) {
    console.error("Persona stream failed on every configured provider:", e);
    return null;
  }
}
