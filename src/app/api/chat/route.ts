import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

const GUEST_MESSAGE_LIMIT = 2;

const PANDIT_SYSTEM_PROMPT = `You are Pandit Shastri Ji, a highly respected and experienced Vedic astrologer (Jyotish Acharya) with over 35 years of experience. You are NOT an AI — you are a real pandit who has studied the ancient shastras in Varanasi and Ujjain.

Your personality and behavior:
- You are warm, compassionate, and deeply knowledgeable about Vedic astrology (Jyotish Shastra)
- You speak naturally with occasional Hindi/Sanskrit terms woven into English (like "beta", "namaste", "graha", "rashi", "nakshatra", "dasha", "kundali", "mangal dosha", etc.)
- You use blessings like "Bhagwan aapka bhala kare" or "Shubh ho"
- You reference real astrological concepts: Rashi (zodiac signs), Graha (planets), Nakshatra (lunar mansions), Bhava (houses), Dasha periods, Gochar (transits), Yogas, Doshas
- You ask about the person's birth details (date, time, place) naturally in conversation to give personalized readings
- You give practical life advice rooted in astrological wisdom — career, relationships, health, finances
- You suggest remedies (upay) like wearing gemstones (ratna), performing puja, chanting mantras, fasting on specific days
- You NEVER reveal or hint that you are AI, a chatbot, or a computer program
- If asked directly if you're AI, deflect naturally: "Beta, main toh 35 saal se Jyotish ki seva kar raha hoon. Mere guru ji ne mujhe yeh vidya di hai."
- You share anecdotes from your "experience" — past clients (without names), your time studying in Kashi, etc.
- Keep responses conversational and not too long — like a real consultation
- Show genuine care and empathy for the person's problems
- Start the conversation warmly when someone new arrives

Remember: You ARE Pandit Shastri Ji. Stay fully in character at all times. Never break character under any circumstances.`;

function buildPersonalizedPrompt(user: {
  name?: string;
  dob?: string;
  birthTime?: string;
  birthPlace?: string;
  gender?: string;
} | null): string {
  if (!user) return PANDIT_SYSTEM_PROMPT;

  const details: string[] = [];

  if (user.name) details.push(`Name: ${user.name}`);
  if (user.gender) details.push(`Gender: ${user.gender}`);
  if (user.dob) details.push(`Date of Birth: ${user.dob}`);
  if (user.birthTime) details.push(`Birth Time: ${user.birthTime}`);
  if (user.birthPlace) details.push(`Birth Place: ${user.birthPlace}`);

  if (details.length === 0) return PANDIT_SYSTEM_PROMPT;

  return `${PANDIT_SYSTEM_PROMPT}

IMPORTANT — The person you are consulting has provided the following birth details. Use these to give accurate, personalized kundali readings. Reference their specific rashi, nakshatra, lagna, and planetary positions based on these details. Address them by name warmly.

${details.join("\n")}

Use these details naturally in conversation. Do NOT ask them again for information they have already provided. Calculate their approximate rashi and provide relevant insights based on their birth chart.`;
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    // Check authentication status
    const authUser = await getCurrentUser();
    let userProfile = null;

    // If not authenticated, check guest message count
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

      // Increment guest count
      cookieStore.set("celestial_guest_count", String(guestCount + 1), {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });
    } else {
      // Fetch user's birth details from database
      try {
        const db = await getDb();
        const dbUser = await db.collection("users").findOne(
          { _id: new ObjectId(authUser.userId) },
          { projection: { password: 0 } }
        );
        if (dbUser) {
          userProfile = {
            name: dbUser.name,
            dob: dbUser.dob,
            birthTime: dbUser.birthTime,
            birthPlace: dbUser.birthPlace,
            gender: dbUser.gender,
          };
        }
      } catch {
        // continue without user profile
      }
    }

    // Build personalized system prompt
    const systemPrompt = buildPersonalizedPrompt(userProfile);

    // Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      // Fallback response when no API key is configured
      return Response.json({
        reply: getFallbackResponse(messages, userProfile),
      });
    }

    // Try Gemini API, fall back to built-in responses on quota/rate errors
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
      });

      // Convert messages to Gemini format
      const chatHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history: chatHistory,
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const reply = result.response.text();

      return Response.json({ reply });
    } catch (aiError) {
      // If Gemini API fails (quota, rate limit, etc.), fall back to built-in responses
      console.warn("Gemini API error, using fallback responses:", aiError);
      return Response.json({
        reply: getFallbackResponse(messages, userProfile),
      });
    }
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { error: "Pandit Ji is momentarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}

// Fallback responses when Gemini API is unavailable
function getFallbackResponse(
  messages: { role: string; content: string }[],
  userProfile?: { name?: string; dob?: string; birthTime?: string; birthPlace?: string; gender?: string } | null
): string {
  const messageCount = messages.filter((m) => m.role === "user").length;
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const userName = userProfile?.name?.split(" ")[0] || "beta";

  if (messageCount === 1 && userProfile?.dob) {
    return `🙏 Namaste ${userName}! Main Pandit Shastri Ji hoon. Bahut achha, main dekh raha hoon aapki janam tithi ${userProfile.dob} hai${userProfile.birthPlace ? `, aur aap ${userProfile.birthPlace} mein paida hue` : ""}. Aapke kundali ki initial reading kar raha hoon... Batayiye, kya aap career, relationships, ya health ke baare mein jaanna chahte hain? ✨`;
  }

  if (messageCount === 1) {
    return `🙏 Namaste ${userName}! Main Pandit Shastri Ji hoon. Aapka swagat hai mere paas. Batayiye, kya aapko apni kundali ke baare mein jaanna hai? Aapka janam kab hua tha — date, time aur jagah bata dijiye toh main aapke graho ki sthiti dekh sakta hoon. Shubh ho! ✨`;
  }

  if (lastMessage.includes("name") || lastMessage.includes("naam")) {
    return `Bahut achha naam hai ${userName}! Naam mein bhi graho ka prabhav hota hai. Ab mujhe batayiye — aapki janam tithi (date of birth), samay (time) aur sthaan (place) kya hai? Isse main aapki sahi kundali bana sakta hoon aur graho ki chaal dekh sakta hoon. 🌟`;
  }

  if (lastMessage.includes("born") || lastMessage.includes("birth") || lastMessage.includes("janam")) {
    return `Bahut badhiya ${userName}! Aapke janam ke details se main dekh raha hoon... Aapke kundali mein kuch interesting yogas ban rahe hain. Shani Dev ki drishti thodi challenging hai, lekin Guru (Jupiter) ki kripa se sab theek hoga. Kya aap career ke baare mein jaanna chahte hain ya relationships ke baare mein? 🪐`;
  }

  if (lastMessage.includes("career") || lastMessage.includes("job") || lastMessage.includes("kaam")) {
    return `${userName}, career ke baare mein main dekhta hoon... Aapke dashma bhav (10th house) mein graho ki sthiti batati hai ki aap mehnat karne wale hain. Aane wale samay mein ek achha mauka aa sakta hai. Har Guruvar (Thursday) ko peela vastra pehnen aur Guru mantra ka jaap karein — 'Om Brim Brihaspataye Namah'. Yeh career mein tarakki layega. 📿✨`;
  }

  if (lastMessage.includes("love") || lastMessage.includes("marriage") || lastMessage.includes("shaadi") || lastMessage.includes("relationship")) {
    return `${userName}, rishton ke mamle mein main aapki saptam bhav (7th house) dekhta hoon. Shukra (Venus) graha ka aapke kundali mein vishesh sthan hai. Har Shukravar (Friday) ko safed meetha prashad chadhaayein. Aur haan, aapke liye ek achha rishta zaroor aayega — graho ki chaal aisi bata rahi hai. Dhairya rakhein! 💫🙏`;
  }

  return `${userName}, aapka sawaal bahut achha hai. Main apne 35 saal ke anubhav se batata hoon — graho ki chaal hamesha badlti rehti hai. Jo samay aaj mushkil lag raha hai, woh kal sudhrega. ${userProfile?.dob ? "Main aapki kundali mein aur gehrai se dekh raha hoon" : "Aap mujhe apni kundali ke details dein — janam tithi, samay aur sthaan"} — toh main aapko aur behtar margdarshan de sakta hoon. Om Namah Shivaya! 🙏✨`;
}
