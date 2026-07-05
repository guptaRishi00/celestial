import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { classifyIntent } from "@/lib/ai/intent";
import { streamPersonaResponse } from "@/lib/ai/persona";
import { CHART_VERSION, computeNatalChart } from "@/lib/astrology/chart";
import {
  enrichTransitsForChart,
  getDailyTransits,
} from "@/lib/astrology/transits";
import type { NatalChart, TransitInfo } from "@/lib/astrology/types";
import { getCurrentUser } from "@/lib/auth";
import {
  CHAT_MESSAGE_TOKEN_COST,
  ensureUserBillingFields,
  getChatTokens,
  type UserBillingDocument,
} from "@/lib/billing";
import { getDb } from "@/lib/mongodb";

const GUEST_MESSAGE_LIMIT = 2;

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatDbUser extends UserBillingDocument {
  name?: string;
  dob?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  natalChart?: NatalChart;
}

async function getOrComputeChart(
  userId: ObjectId,
  dbUser: ChatDbUser,
): Promise<NatalChart | null> {
  // Compare against the current CHART_VERSION, not just truthiness — otherwise a
  // stale cached chart from an older computation (e.g. pre-bugfix) is served forever.
  if (dbUser.natalChart?.version === CHART_VERSION) return dbUser.natalChart;

  // 🔍 DEBUG LOGS: Check if fields are actually available
  console.log("=== PANDIT JI KUNDALI DEBUG ===");
  console.log("User DB Document:", JSON.stringify(dbUser, null, 2));
  console.log("DOB found:", dbUser.dob);
  console.log("Birth Time found:", dbUser.birthTime);

  if (!dbUser.dob || !dbUser.birthTime) {
    console.warn(
      "❌ Kundali skipped: dob or birthTime is missing in DB record!",
    );
    return null;
  }

  const chart = await computeNatalChart({
    dob: dbUser.dob,
    birthTime: dbUser.birthTime,
    birthPlace: dbUser.birthPlace || undefined,
  });

  if (!chart) {
    console.error(
      "❌ computeNatalChart returned NULL! Check your ASTROLOGY_API_KEY or coordinates calculation.",
    );
  } else {
    console.log("✅ Kundali computed successfully for Chat context!");
    const db = await getDb();
    await db
      .collection("users")
      .updateOne(
        { _id: userId },
        { $set: { natalChart: chart, natalChartComputedAt: new Date() } },
      );
  }
  return chart;
}

async function getEnrichedTransits(
  chart: NatalChart | null,
): Promise<TransitInfo | null> {
  if (!chart) return null;
  const t = await getDailyTransits();
  if (!t) return null;
  return enrichTransitsForChart(t, chart);
}

function getFallbackResponse(
  userName: string,
  hasChart: boolean,
  lang?: string,
): string {
  if (lang === "hi") {
    if (!hasChart) {
      return `नमस्ते ${userName || "बेटा"}! मैं पंडित शास्त्री जी हूँ। आपकी कुंडली बनाने के लिए मुझे आपकी जन्म तिथि, समय और स्थान चाहिए। प्रोफ़ाइल में विवरण भर दीजिए तो मैं आपके ग्रहों की स्थिति देख सकता हूँ। शुभ हो!`;
    }
    return `नमस्ते ${userName || "बेटा"}! मेरे पास आपकी कुंडली तो है, लेकिन अभी सेवा में छोटी सी रुकावट आ रही है। थोड़ी देर में फिर कोशिश कीजिए। भगवान आपका भला करे।`;
  }

  if (!hasChart) {
    return `Namaste ${userName || "beta"}! Main Pandit Shastri Ji hoon. Aapki kundali banane ke liye mujhe aapka janam tithi, samay aur sthaan chahiye. Profile mein details bhar dijiye toh main aapke graho ki sthiti dekh sakta hoon. Shubh ho!`;
  }
  return `Namaste ${userName || "beta"}! Mere paas aapki kundali toh hai, lekin abhi seva mein chhoti si rukawat aa rahi hai. Thodi der mein phir koshish kijiye. Bhagwan aapka bhala kare.`;
}

export async function POST(request: Request) {
  try {
    const { messages, chatId, lang } = (await request.json()) as {
      messages: ChatMessage[];
      chatId?: string;
      lang?: string;
    };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user")
      ?.content?.trim();
    if (!lastUserMessage) {
      return Response.json({ error: "No user message found" }, { status: 400 });
    }

    const authUser = await getCurrentUser();
    let dbUser: ChatDbUser | null = null;
    let userName = "beta";

    if (!authUser) {
      const cookieStore = await cookies();
      const guestCountCookie = cookieStore.get("celestial_guest_count");
      const guestCount = guestCountCookie
        ? parseInt(guestCountCookie.value, 10)
        : 0;
      if (guestCount >= GUEST_MESSAGE_LIMIT) {
        return Response.json({
          requiresLogin: true,
          message:
            "To continue your consultation with Pandit Ji, please create an account. Your cosmic journey awaits.",
        });
      }
      cookieStore.set("celestial_guest_count", String(guestCount + 1), {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    } else {
      try {
        const db = await getDb();
        const userId = new ObjectId(authUser.userId);
        await ensureUserBillingFields(db, userId);

        // Atomic check and 10 token deduction
        dbUser = await db
          .collection<ChatDbUser>("users")
          .findOneAndUpdate(
            { _id: userId, chatTokens: { $gte: CHAT_MESSAGE_TOKEN_COST } },
            { $inc: { chatTokens: -CHAT_MESSAGE_TOKEN_COST } },
            { projection: { password: 0 }, returnDocument: "after" },
          );

        if (!dbUser) {
          const existingUser = await db
            .collection("users")
            .findOne({ _id: userId }, { projection: { chatTokens: 1 } });

          return Response.json(
            {
              error: "No chat tokens remaining",
              requiresRecharge: true,
              chatTokens: existingUser ? (existingUser.chatTokens ?? 0) : 0,
            },
            { status: 402 },
          );
        }

        userName = (dbUser.name || "").split(" ")[0] || "beta";
      } catch (e) {
        console.error("DB read failed:", e);
        return Response.json(
          { error: "Could not verify chat tokens. Please try again." },
          { status: 500 },
        );
      }
    }

    let chart: NatalChart | null = null;
    if (authUser && dbUser) {
      chart = await getOrComputeChart(new ObjectId(authUser.userId), dbUser);
    }

    let activeChatId = chatId;

    if (authUser && (!activeChatId || !ObjectId.isValid(activeChatId))) {
      try {
        const db = await getDb();
        let title = "New Consultation";
        const firstUserMsg = messages.find((m) => m.role === "user");
        if (firstUserMsg) {
          title =
            firstUserMsg.content.substring(0, 40) +
            (firstUserMsg.content.length > 40 ? "..." : "");
        }
        const newChat = await db.collection("chats").insertOne({
          userId: new ObjectId(authUser.userId),
          title,
          messages: [...messages],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        activeChatId = newChat.insertedId.toString();
      } catch (e) {
        console.error("Failed to create chat:", e);
      }
    }

    const saveHistory = async (replyText: string) => {
      if (!authUser || !activeChatId) return;
      try {
        const db = await getDb();
        const updatedMessages = [
          ...messages,
          { id: Date.now().toString(), role: "assistant", content: replyText },
        ];
        await db.collection("chats").updateOne(
          {
            _id: new ObjectId(activeChatId),
            userId: new ObjectId(authUser.userId),
          },
          { $set: { messages: updatedMessages, updatedAt: new Date() } },
        );
      } catch (e) {
        console.error("Failed to save chat history:", e);
      }
    };

    const [intent, transits] = await Promise.all([
      classifyIntent(lastUserMessage, messages.slice(0, -1)),
      chart ? getEnrichedTransits(chart) : Promise.resolve(null),
    ]);

    const reasoning = null;

    const stream = await streamPersonaResponse({
      question: lastUserMessage,
      userName,
      intent,
      reasoning,
      chart,
      transits,
      chatHistory: messages.slice(0, -1).map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      lang: lang as "en" | "hi",
    });

    if (!stream) {
      const reply = getFallbackResponse(userName, !!chart, lang);
      await saveHistory(reply);
      return Response.json({
        reply,
        chatId: activeChatId,
        chatTokens: dbUser ? getChatTokens(dbUser) : undefined,
      });
    }

    const encoder = new TextEncoder();
    let fullReply = "";

    const readable = new ReadableStream({
      async start(controller) {
        let closed = false;
        const safeClose = () => {
          if (!closed) {
            closed = true;
            controller.close();
          }
        };
        try {
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                chatId: activeChatId,
                chatTokens: dbUser ? getChatTokens(dbUser) : undefined,
              })}\n`,
            ),
          );
          for await (const text of stream) {
            if (closed) break;
            fullReply += text;
            try {
              controller.enqueue(encoder.encode(text));
            } catch {
              break;
            }
          }
          if (fullReply) await saveHistory(fullReply);
          safeClose();
        } catch (e) {
          console.error("Stream error:", e);
          safeClose();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { error: "Pandit Ji is momentarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
