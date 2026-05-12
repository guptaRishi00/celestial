import { getDb } from "@/lib/mongodb";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { computeNatalChart } from "@/lib/astrology/chart";
import { ObjectId } from "mongodb";

async function computeAndStoreChart(userId: ObjectId, dob: string, birthTime: string, birthPlace?: string | null) {
  if (!dob || !birthTime) return;
  try {
    const chart = await computeNatalChart({ dob, birthTime, birthPlace: birthPlace || undefined });
    if (!chart) return;
    const db = await getDb();
    await db.collection("users").updateOne(
      { _id: userId },
      { $set: { natalChart: chart, natalChartComputedAt: new Date() } }
    );
  } catch (e) {
    console.error("Chart compute failed:", e);
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, password, dob, birthTime, birthPlace, gender } = await request.json();

    if (!name || !email || !password) {
      return Response.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const result = await usersCollection.insertOne({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      dob: dob || null,
      birthTime: birthTime || null,
      birthPlace: birthPlace || null,
      gender: gender || null,
      createdAt: new Date(),
    });

    // Create and set JWT token
    const token = signToken({
      userId: result.insertedId.toString(),
      email: email.toLowerCase(),
    });
    await setAuthCookie(token);

    // Compute natal chart in the background — does not block signup response.
    // Chart will be ready by the time user starts chatting (usually 1-2 seconds).
    if (dob && birthTime) {
      void computeAndStoreChart(result.insertedId, dob, birthTime, birthPlace);
    }

    return Response.json({
      success: true,
      user: {
        name,
        email: email.toLowerCase(),
        dob: dob || null,
        birthTime: birthTime || null,
        birthPlace: birthPlace || null,
        gender: gender || null,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again.", details: error.message || String(error) },
      { status: 500 }
    );
  }
}
