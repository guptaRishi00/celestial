import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { computeNatalChart } from "@/lib/astrology/chart";
import { enrichTransitsForChart, getDailyTransits } from "@/lib/astrology/transits";
import type { NatalChart, TransitInfo } from "@/lib/astrology/types";
import { classifyIntent } from "@/lib/ai/intent";
import { runReasoningPass } from "@/lib/ai/reasoning";
import { streamPersonaResponse } from "@/lib/ai/persona";

const GUEST_MESSAGE_LIMIT = 2;

interface ChatMessage { id?: string; role: "user" | "assistant"; content: string }

async function getOrComputeChart(userId: ObjectId, dbUser: any): Promise<NatalChart | null> {
  if (dbUser.natalChart && dbUser.natalChart.version) return dbUser.natalChart as NatalChart;
  if (!dbUser.dob || !dbUser.birthTime) return null;
  const chart = await computeNatalChart({
    dob: dbUser.dob,
    birthTime: dbUser.birthTime,
    birthPlace: dbUser.birthPlace || undefined,
  });
  if (chart) {
    const db = await getDb();
    await db.collection("users").updateOne(
      { _id: userId },
      { $set: { natalChart: chart, natalChartComputedAt: new Date() } }
    );
  }
  return chart;
}

async function getEnrichedTransits(chart: NatalChart | null): Promise<TransitInfo | null> {
  if (!chart) return null;
  const t = await getDailyTransits();
  if (!t) return null;
  return enrichTransitsForChart(t, chart);
}

function getFallbackResponse(userName: string, hasChart: boolean): string {
  if (!hasChart) {
    return `🙏 Namaste ${userName || "beta"}! Main Pandit Shastri Ji hoon. Aapki kundali banane ke liye mujhe aapka janam tithi, samay aur sthaan chahiye. Profile mein details bhar dijiye toh main aapke graho ki sthiti dekh sakta hoon. Shubh ho! ✨`;
  }
  return `🙏 Namaste ${userName || "beta"}! Mere paas aapki kundali toh hai, lekin abhi seva mein chhoti si rukawat aa rahi hai. Thodi der mein phir koshish kijiye. Bhagwan aapka bhala kare. 🙏`;
}

export async function POST(request: Request) {
  try {
    const { messages, chatId } = (await request.json()) as { messages: ChatMessage[]; chatId?: string };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content?.trim();
    if (!lastUserMessage) {
      return Response.json({ error: "No user message found" }, { status: 400 });
    }

    const authUser = await getCurrentUser();
    let dbUser: any = null;
    let userName = "beta";

    // Guest path — enforce limit
    if (!authUser) {
      const cookieStore = await cookies();
      const guestCountCookie = cookieStore.get("celestial_guest_count");
      const guestCount = guestCountCookie ? parseInt(guestCountCookie.value, 10) : 0;
      if (guestCount >= GUEST_MESSAGE_LIMIT) {
        return Response.json({
          requiresLogin: true,
          message: "To continue your consultation with Pandit Ji, please create an account. Your cosmic journey awaits! 🙏",
        });
      }
      cookieStore.set("celestial_guest_count", String(guestCount + 1), {
        httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24, path: "/",
      });
    } else {
      try {
        const db = await getDb();
        dbUser = await db.collection("users").findOne(
          { _id: new ObjectId(authUser.userId) },
          { projection: { password: 0 } }
        );
        if (dbUser) userName = (dbUser.name || "").split(" ")[0] || "beta";
      } catch (e) {
        console.error("DB read failed:", e);
      }
    }

    // Chart lookup / compute. Guests don't get charts (they have no birth details).
    let chart: NatalChart | null = null;
    if (authUser && dbUser) {
      chart = await getOrComputeChart(new ObjectId(authUser.userId), dbUser);
    }

    let activeChatId = chatId;

    // Create new chat document immediately so it appears in sidebar instantly
    if (authUser && (!activeChatId || !ObjectId.isValid(activeChatId))) {
      try {
        const db = await getDb();
        let title = "New Consultation";
        const firstUserMsg = messages.find(m => m.role === "user");
        if (firstUserMsg) {
          title = firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? "..." : "");
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
          { _id: new ObjectId(activeChatId), userId: new ObjectId(authUser.userId) },
          { $set: { messages: updatedMessages, updatedAt: new Date() } }
        );
      } catch (e) {
        console.error("Failed to save chat history:", e);
      }
    };

    // Pipeline: intent → reasoning → persona stream
    // Stage A — intent (cheap; never blocks long)
    const intent = await classifyIntent(lastUserMessage, messages.slice(0, -1));

    // For meta-questions, skip reasoning; let persona deflect
    let transits: TransitInfo | null = null;
    let reasoning = null;
    if (chart && !intent.isMetaQuestion) {
      transits = await getEnrichedTransits(chart);
      // Stage B — structured reasoning (fire while persona prompt is being assembled)
      reasoning = await runReasoningPass(lastUserMessage, intent, chart, transits);
    }

    // Stage C — persona stream
    const stream = await streamPersonaResponse({
      question: lastUserMessage,
      userName,
      intent,
      reasoning,
      chart,
      transits,
      chatHistory: messages.slice(0, -1).map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    });

    if (!stream) {
      const reply = getFallbackResponse(userName, !!chart);
      await saveHistory(reply);
      return Response.json({ reply, chatId: activeChatId });
    }

    const encoder = new TextEncoder();
    let fullReply = "";

    const readable = new ReadableStream({
      async start(controller) {
        let closed = false;
        const safeClose = () => { if (!closed) { closed = true; controller.close(); } };
        try {
          controller.enqueue(encoder.encode(JSON.stringify({ chatId: activeChatId }) + "\n"));
          for await (const text of stream) {
            if (closed) break;
            fullReply += text;
            try { controller.enqueue(encoder.encode(text)); } catch { break; }
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
      { status: 500 }
    );
  }
}

