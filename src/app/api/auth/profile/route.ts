import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request: Request) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { name, dob, birthTime, birthPlace, gender } = await request.json();

    const db = await getDb();
    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (dob !== undefined) updateData.dob = dob || null;
    if (birthTime !== undefined) updateData.birthTime = birthTime || null;
    if (birthPlace !== undefined) updateData.birthPlace = birthPlace || null;
    if (gender !== undefined) updateData.gender = gender || null;
    updateData.updatedAt = new Date();

    await db.collection("users").updateOne(
      { _id: new ObjectId(payload.userId) },
      { $set: updateData }
    );

    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(payload.userId) },
      { projection: { password: 0 } }
    );

    return Response.json({
      success: true,
      user: {
        id: updatedUser?._id.toString(),
        name: updatedUser?.name,
        email: updatedUser?.email,
        dob: updatedUser?.dob || null,
        birthTime: updatedUser?.birthTime || null,
        birthPlace: updatedUser?.birthPlace || null,
        gender: updatedUser?.gender || null,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
