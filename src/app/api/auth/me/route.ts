import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return Response.json({ user: null });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(payload.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return Response.json({ user: null });
    }

    return Response.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        dob: user.dob || null,
        birthTime: user.birthTime || null,
        birthPlace: user.birthPlace || null,
        gender: user.gender || null,
        createdAt: user.createdAt || null,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return Response.json({ user: null });
  }
}
