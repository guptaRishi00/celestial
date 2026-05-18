import { ObjectId } from "mongodb";
import { computeNatalChart } from "@/lib/astrology/chart";
import { getCurrentUser } from "@/lib/auth";
import { ensureUserBillingFields, toPublicUser } from "@/lib/billing";
import { getDb } from "@/lib/mongodb";

async function recomputeChartIfBirthChanged(
  userId: ObjectId,
  existing: {
    dob?: string | null;
    birthTime?: string | null;
    birthPlace?: string | null;
  } | null,
  incoming: {
    dob?: string | null;
    birthTime?: string | null;
    birthPlace?: string | null;
  },
) {
  const newDob = incoming.dob ?? existing?.dob ?? null;
  const newTime = incoming.birthTime ?? existing?.birthTime ?? null;
  const newPlace = incoming.birthPlace ?? existing?.birthPlace ?? null;
  if (!newDob || !newTime) return;

  const birthChanged =
    (incoming.dob !== undefined && incoming.dob !== existing?.dob) ||
    (incoming.birthTime !== undefined &&
      incoming.birthTime !== existing?.birthTime) ||
    (incoming.birthPlace !== undefined &&
      incoming.birthPlace !== existing?.birthPlace);

  if (!birthChanged) return;

  try {
    const chart = await computeNatalChart({
      dob: newDob,
      birthTime: newTime,
      birthPlace: newPlace || undefined,
    });
    if (!chart) return;
    const db = await getDb();
    await db
      .collection("users")
      .updateOne(
        { _id: userId },
        { $set: { natalChart: chart, natalChartComputedAt: new Date() } },
      );
  } catch (e) {
    console.error("Chart recompute failed:", e);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, dob, birthTime, birthPlace, gender } = await request.json();

    const db = await getDb();
    const userId = new ObjectId(payload.userId);
    await ensureUserBillingFields(db, userId);

    // Read existing values so we can detect if birth details actually changed
    const before = await db
      .collection("users")
      .findOne(
        { _id: userId },
        { projection: { dob: 1, birthTime: 1, birthPlace: 1 } },
      );

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (dob !== undefined) updateData.dob = dob || null;
    if (birthTime !== undefined) updateData.birthTime = birthTime || null;
    if (birthPlace !== undefined) updateData.birthPlace = birthPlace || null;
    if (gender !== undefined) updateData.gender = gender || null;
    updateData.updatedAt = new Date();

    await db
      .collection("users")
      .updateOne({ _id: userId }, { $set: updateData });

    // Recompute chart in background if any birth detail changed
    void recomputeChartIfBirthChanged(
      userId,
      before
        ? {
            dob: before.dob,
            birthTime: before.birthTime,
            birthPlace: before.birthPlace,
          }
        : null,
      { dob, birthTime, birthPlace },
    );

    const updatedUser = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(payload.userId) },
        { projection: { password: 0 } },
      );

    return Response.json({
      success: true,
      user: updatedUser ? toPublicUser(updatedUser) : null,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
