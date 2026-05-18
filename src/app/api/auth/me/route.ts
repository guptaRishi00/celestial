import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { ensureUserBillingFields, toPublicUser } from "@/lib/billing";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return Response.json({ user: null });
    }

    const db = await getDb();
    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(payload.userId) },
        { projection: { password: 0 } },
      );

    if (!user) {
      return Response.json({ user: null });
    }

    await ensureUserBillingFields(db, user._id);

    return Response.json({
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return Response.json({ user: null });
  }
}
