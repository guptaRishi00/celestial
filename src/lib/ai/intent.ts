import { chatComplete, isAIConfigured } from "./client";

export type Topic =
  | "career"
  | "marriage"
  | "health"
  | "wealth"
  | "education"
  | "family"
  | "children"
  | "travel"
  | "spirituality"
  | "property"
  | "litigation"
  | "general";

export interface IntentResult {
  topic: Topic;
  subTopic: string | null;
  timeframe: "past" | "current" | "near_future" | "long_term" | "unspecified";
  isFollowUp: boolean;
  isBirthDetailsRequest: boolean;
  isMetaQuestion: boolean; // user asking about AI/the system itself
}

const VALID_TOPICS: Topic[] = [
  "career",
  "marriage",
  "health",
  "wealth",
  "education",
  "family",
  "children",
  "travel",
  "spirituality",
  "property",
  "litigation",
  "general",
];

const SYSTEM_PROMPT = `You are an intent classifier for an astrology chat. Given a user message and recent context, output ONE compact JSON object:
{
  "topic": one of ${VALID_TOPICS.map((t) => `"${t}"`).join(", ")},
  "subTopic": short phrase or null (e.g. "promotion", "job change", "second marriage"),
  "timeframe": "past"|"current"|"near_future"|"long_term"|"unspecified",
  "isFollowUp": true if the user is following up on a previous response in the same thread,
  "isBirthDetailsRequest": true ONLY if the user is providing or being asked for birth date/time/place,
  "isMetaQuestion": true if the user is questioning whether you are AI, asking about the system, or asking unrelated meta things
}
Output ONLY the JSON. No prose, no markdown fence.`;

function fallbackIntent(message: string): IntentResult {
  const m = message.toLowerCase();
  const map: [RegExp, Topic][] = [
    [/career|job|kaam|work|business|promotion|salary|naukri/, "career"],
    [
      /marriage|wife|husband|shaadi|love|relationship|partner|rishta|divorce/,
      "marriage",
    ],
    [/health|bimari|illness|disease|body|tabiyat/, "health"],
    [/wealth|money|paisa|finance|rich|loan|debt|invest/, "wealth"],
    [/child|baccha|santaan|pregnancy|bachhe/, "children"],
    [/study|exam|college|school|padhai|education|degree/, "education"],
    [/property|ghar|home|house|makaan|land|zameen/, "property"],
    [/travel|videsh|foreign|abroad|yatra/, "travel"],
    [/spirit|moksha|temple|puja|guru|sadhana|mantra/, "spirituality"],
    [/case|court|legal|mukadma/, "litigation"],
    [/family|maa|papa|parents|ghar wale|bhai|behen/, "family"],
  ];
  let topic: Topic = "general";
  for (const [re, t] of map) {
    if (re.test(m)) {
      topic = t;
      break;
    }
  }
  return {
    topic,
    subTopic: null,
    timeframe: "unspecified",
    isFollowUp: false,
    isBirthDetailsRequest:
      /\b(dob|birth|janam|date of birth|jagah|time)\b/.test(m),
    isMetaQuestion:
      /\b(are you ai|chatbot|gpt|claude|robot|computer|real person)\b/.test(m),
  };
}

export async function classifyIntent(
  message: string,
  recentMessages: { role: string; content: string }[] = [],
): Promise<IntentResult> {
  if (!isAIConfigured()) return fallbackIntent(message);

  const recent = recentMessages
    .slice(-4)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  try {
    const res = await chatComplete({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Recent context:\n${recent || "(none)"}\n\nLatest user message: ${message}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });
    if (!res) return fallbackIntent(message);
    const raw = res.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw);
    const topic = VALID_TOPICS.includes(parsed.topic)
      ? parsed.topic
      : "general";
    return {
      topic,
      subTopic: typeof parsed.subTopic === "string" ? parsed.subTopic : null,
      timeframe: [
        "past",
        "current",
        "near_future",
        "long_term",
        "unspecified",
      ].includes(parsed.timeframe)
        ? parsed.timeframe
        : "unspecified",
      isFollowUp: !!parsed.isFollowUp,
      isBirthDetailsRequest: !!parsed.isBirthDetailsRequest,
      isMetaQuestion: !!parsed.isMetaQuestion,
    };
  } catch (e) {
    console.warn("Intent classification failed, using fallback:", e);
    return fallbackIntent(message);
  }
}
