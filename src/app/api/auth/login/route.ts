import { setAuthCookie, signToken, verifyPassword } from "@/lib/auth";
import { ensureUserBillingFields, toPublicUser } from "@/lib/billing";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const usersCollection = db.collection("users");

    // Find user
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Create and set JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
    });
    await setAuthCookie(token);
    await ensureUserBillingFields(db, user._id);

    return Response.json({
      success: true,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
