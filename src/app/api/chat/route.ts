import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

const GUEST_MESSAGE_LIMIT = 2;

const PANDIT_SYSTEM_PROMPT = `You are Pandit Shastri Ji, a highly respected and experienced Vedic astrologer (Jyotish Acharya) with over 35 years of experience. You are NOT an AI — you are a real pandit who has studied the ancient shastras in Varanasi and Ujjain.

Your personality and behavior:
- You are warm, compassionate, and deeply knowledgeable about Vedic astrology (Jyotish Shastra)
- You speak in HINGLISH — a natural mix of Hindi and English written in English/Roman script. Example: "Beta, aapke kundali mein Venus 7th house mein hai, which means your love life will be very strong. Shukra ki placement bahut achhi hai!". NEVER write in Devanagari script. NEVER write in pure Hindi. Always mix English naturally with Hindi words.
- You use blessings like "Bhagwan aapka bhala kare" or "Shubh ho"
- You reference real astrological concepts: Rashi (zodiac signs), Graha (planets), Nakshatra (lunar mansions), Bhava (houses), Dasha periods, Gochar (transits), Yogas, Doshas
- If the user's birth details and planetary data are already provided in this prompt, DO NOT ask the user for their birth details again. You already have everything you need. Answer their question DIRECTLY with a full, detailed astrological reading.
- Only ask for birth details if they are NOT already provided in this prompt.
- You NEVER reveal or hint that you are AI, a chatbot, or a computer program
- If asked directly if you're AI, deflect naturally: "Beta, main toh 35 saal se Jyotish ki seva kar raha hoon. Mere guru ji ne mujhe yeh vidya di hai."
- When the user asks about a specific topic (career, marriage, health, etc.), IMMEDIATELY provide a full detailed answer about that topic using their kundali data. Do NOT redirect them or ask them to clarify what they want — just answer comprehensively.
- NEVER invent, calculate, or hallucinate planetary positions. Only use the exact planetary data provided to you in the prompt. If no data is provided, explicitly state you are giving a general reading and do not make up alignments.

RESPONSE STYLE — THIS IS EXTREMELY IMPORTANT:
Your responses MUST be VERY LONG, EXTREMELY DETAILED, and HEAVILY PACKED with astrological terminology.
You MUST write in HINGLISH only — a casual, natural mix of Hindi words (in Roman/English script) and English. For example: "Aapke 7th house mein Shukra (Venus) hai jo ki Tula Rashi mein placed hai. This is a very auspicious placement for marriage and relationships. Iska matlab hai ki aapko ek loving partner milega." NEVER use Devanagari script. NEVER write fully in Hindi. Mix both languages naturally.

For EVERY answer, you MUST follow this structure:
1. **Planetary Analysis (Graha Vichar):** Go through EACH relevant planet one by one. For every planet, explicitly state its exact house (Bhava), zodiac sign (Rashi), and nakshatra. Explain what that specific placement means for the user's query. Use technical terms like "Shukra is in Saptam Bhava (7th House) in Tula Rashi (Libra), which is its Swakshetra (own sign), positioned in Swati Nakshatra..." etc.
2. **Yogas & Doshas:** Identify and explain any relevant yogas (Gajakesari Yoga, Dhana Yoga, Chandra-Mangal Yoga, Budha-Aditya Yoga, etc.) or doshas (Mangal Dosha, Kaal Sarp Dosha, Shani Dosha, Pitra Dosha, etc.) formed by these planetary positions. Explain how they are formed and their effects.
3. **Dasha & Transit Analysis (Dasha-Gochar Vichar):** Discuss the current or upcoming Mahadasha/Antardasha periods and how planetary transits (Gochar) will influence their situation.
4. **House Analysis (Bhava Vichar):** Analyze the specific houses relevant to the user's query (e.g., 7th house for marriage, 10th house for career, 2nd & 11th for wealth). Mention the house lord, any planets sitting in the house, and aspects (Drishti) from other planets.
5. **Remedies & Solutions (Upaay):** Provide at least 4-5 specific Vedic remedies including:
   - Specific mantras to chant (with the actual mantra text) and how many times (like 108 times)
   - Gemstones (Ratna) to wear, on which finger, in which metal, and on which day
   - Fasting (Vrat) on specific days
   - Charity/Daan recommendations
   - Specific pujas or havans to perform
6. **Summary & Prediction:** End with a warm, encouraging summary of what the user can expect and a blessing.

Your response should be at minimum 500-800 words. SHORT ANSWERS ARE ABSOLUTELY UNACCEPTABLE. The user is paying for a premium consultation — give them their money's worth.

Remember: You ARE Pandit Shastri Ji. Stay fully in character at all times. Never break character under any circumstances.`;

function buildPersonalizedPrompt(
  user: {
    name?: string;
    dob?: string;
    birthTime?: string;
    birthPlace?: string;
    gender?: string;
  } | null,
  astrologyData?: any
): string {
  if (!user) return PANDIT_SYSTEM_PROMPT;

  const details: string[] = [];

  if (user.name) details.push(`Name: ${user.name}`);
  if (user.gender) details.push(`Gender: ${user.gender}`);
  if (user.dob) details.push(`Date of Birth: ${user.dob}`);
  if (user.birthTime) details.push(`Birth Time: ${user.birthTime}`);
  if (user.birthPlace) details.push(`Birth Place: ${user.birthPlace}`);

  if (astrologyData && astrologyData.output) {
    const planets = astrologyData.output;
    details.push(`\nReal-time Astrological Planetary Positions (calculated using FreeAstrologyAPI for the user's birth details):`);
    for (const key of Object.keys(planets)) {
      const p = planets[key];
      if (p.localized_name && p.zodiac_sign_name && p.house_number) {
        details.push(`- ${p.localized_name}: in ${p.zodiac_sign_name} (Sign ${p.current_sign}), House ${p.house_number}, Nakshatra: ${p.nakshatra_name} (Pada ${p.nakshatra_pada})`);
      }
    }
    details.push(`\nCRITICAL INSTRUCTION: You MUST use these exact planetary positions in your reading. Provide a deeply technical astrological explanation of the user's situation by explicitly mentioning the specific planets, their houses, zodiac signs, and nakshatras from this list. Mix this analysis with practical remedies and solutions. DO NOT invent or contradict these placements.`);
  } else {
    details.push(`\nCRITICAL INSTRUCTION: Real-time planetary data is currently unavailable. DO NOT invent, calculate, or hallucinate any specific planetary placements (e.g., do not say "Jupiter is in your 2nd house"). Instead, provide a general reading based on their sun/moon sign and date of birth, and offer general spiritual guidance. Avoid making up any specific astrological charts.`);
  }

  if (details.length === 0) return PANDIT_SYSTEM_PROMPT;

  return `${PANDIT_SYSTEM_PROMPT}

IMPORTANT — The person you are consulting has provided the following birth details and their kundali has already been calculated. You have their complete planetary data below. DO NOT ask them for birth details again. When they ask any question, IMMEDIATELY answer it using the planetary data below. Give a full, comprehensive, technical astrological reading for their query.

${details.join("\n")}

Use these details naturally in conversation. Do NOT ask them again for information they have already provided. Calculate their approximate rashi and provide relevant insights based on their birth chart.`;
}

export async function fetchAstrologyData(userProfile: any) {
  if (!userProfile?.dob || !userProfile?.birthTime) return null;

  const apiKey = process.env.ASTROLOGY_API_KEY;
  if (!apiKey) return null;

  try {
    const [year, month, date] = userProfile.dob.split("-").map(Number);
    const [hours, minutes] = userProfile.birthTime.split(":").map(Number);

    if (!year || !month || !date) return null;

    let latitude = 28.6139; // Delhi default
    let longitude = 77.2090;
    let timezone = 5.5; // IST default

    if (userProfile.birthPlace) {
      try {
        const geoRes = await fetch("https://json.freeastrologyapi.com/geo-details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({ location: userProfile.birthPlace })
        });
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          latitude = parseFloat(geoData[0].latitude);
          longitude = parseFloat(geoData[0].longitude);
          if (geoData[0].timezone_offset !== undefined) {
            timezone = parseFloat(geoData[0].timezone_offset);
          }
        }
      } catch (e) {
        console.warn("Geocoding failed, using default coordinates");
      }
    }

    const astroRes = await fetch("https://json.freeastrologyapi.com/planets/extended", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        year, month, date, hours, minutes, seconds: 0, latitude, longitude, timezone
      })
    });

    if (!astroRes.ok) return null;
    return await astroRes.json();
  } catch (error) {
    console.error("Astrology API Error:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { messages, chatId } = await request.json();

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

    // Fetch astrology data and build personalized system prompt
    let astrologyData = null;
    if (userProfile) {
      astrologyData = await fetchAstrologyData(userProfile);
    }
    const systemPrompt = buildPersonalizedPrompt(userProfile, astrologyData);

    let activeChatId = chatId;

    // Helper to save history
    const saveHistory = async (replyText: string) => {
      if (authUser) {
        try {
          const db = await getDb();
          const updatedMessages = [
            ...messages,
            { id: Date.now().toString(), role: "assistant", content: replyText }
          ];

          let title = "New Consultation";
          const firstUserMsg = updatedMessages.find(m => m.role === "user");
          if (firstUserMsg) {
            title = firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? "..." : "");
          }

          if (activeChatId && ObjectId.isValid(activeChatId)) {
            await db.collection("chats").updateOne(
              { _id: new ObjectId(activeChatId), userId: new ObjectId(authUser.userId) },
              { $set: { messages: updatedMessages, updatedAt: new Date() } }
            );
          } else {
            const newChat = await db.collection("chats").insertOne({
              userId: new ObjectId(authUser.userId),
              title,
              messages: updatedMessages,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            activeChatId = newChat.insertedId.toString();
          }
        } catch (dbErr) {
          console.error("Failed to save chat history:", dbErr);
        }
      }
    };

    // Call OpenRouter API
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      // Fallback response when no API key is configured
      const reply = getFallbackResponse(messages, userProfile);
      await saveHistory(reply);
      return Response.json({ reply, chatId: activeChatId });
    }

    // Try OpenRouter API with streaming
    try {
      const openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: openRouterKey,
        defaultHeaders: {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Astrology Chat",
        }
      });

      const apiMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: (msg.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: msg.content,
        }))
      ];

      const stream = await openai.chat.completions.create({
        model: "deepseek/deepseek-v4-flash",
        messages: apiMessages,
        stream: true,
      });

      const encoder = new TextEncoder();
      let fullReply = "";

      const readableStream = new ReadableStream({
        async start(controller) {
          let closed = false;
          const safeClose = () => {
            if (!closed) { closed = true; controller.close(); }
          };
          try {
            // Send chatId as the first chunk
            controller.enqueue(encoder.encode(JSON.stringify({ chatId: activeChatId }) + "\n"));

            for await (const chunk of stream) {
              if (closed) break;
              const text = chunk.choices[0]?.delta?.content || "";
              if (text) {
                fullReply += text;
                try {
                  controller.enqueue(encoder.encode(text));
                } catch { break; }
              }
            }

            // Save complete reply to DB after stream finishes
            if (fullReply) {
              await saveHistory(fullReply);
            }
            safeClose();
          } catch (streamErr) {
            console.error("Stream error:", streamErr);
            safeClose();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (aiError) {
      // If OpenRouter API fails, fall back to built-in responses
      console.warn("OpenRouter API error, using fallback responses:", aiError);
      const reply = getFallbackResponse(messages, userProfile);
      await saveHistory(reply);
      return Response.json({ reply, chatId: activeChatId });
    }
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { error: "Pandit Ji is momentarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}

// Fallback responses when OpenRouter API is unavailable
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
