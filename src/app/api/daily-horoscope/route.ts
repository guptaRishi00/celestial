import { NextResponse } from "next/server";
import { getDailyHoroscopes } from "@/lib/horoscope";

export const dynamic = "force-dynamic"; // Always check DB for fresh data

export async function GET() {
  try {
    const horoscopes = await getDailyHoroscopes();

    if (!horoscopes) {
      return NextResponse.json(
        { error: "Failed to fetch horoscope" },
        { status: 500 }
      );
    }

    return NextResponse.json(horoscopes);
  } catch (error) {
    console.error("Daily Horoscope API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch horoscope" },
      { status: 500 }
    );
  }
}
