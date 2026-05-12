import { getDb } from "@/lib/mongodb";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

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
