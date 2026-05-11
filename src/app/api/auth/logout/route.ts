import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearAuthCookie();
    return Response.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
