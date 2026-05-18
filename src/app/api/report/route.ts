import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import React from "react";
import { AstrologyReport } from "@/components/Report/AstrologyReport";
import { calculateSarvashtakvarga } from "@/lib/astrology/ashtakvarga";
import { computeNatalChart } from "@/lib/astrology/chart";
import { computeDivisionalCharts } from "@/lib/astrology/divisional";
import { getGemstoneRecommendations } from "@/lib/astrology/gemstones";
import { generateAIInterpretations } from "@/lib/astrology/interpretations";
import { getFutureTransits } from "@/lib/astrology/transits";
import type { NatalChart } from "@/lib/astrology/types";
import { getCurrentUser } from "@/lib/auth";
import { ensureUserBillingFields, getUnlockedReports } from "@/lib/billing";
import { getDb } from "@/lib/mongodb";

interface ReportDbUser extends Record<string, unknown> {
  name?: string;
  dob?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  natalChart?: NatalChart;
  unlockedReports?: string[];
}

async function getOrComputeChart(
  userId: ObjectId,
  dbUser: ReportDbUser,
): Promise<NatalChart | null> {
  if (dbUser.natalChart?.version) return dbUser.natalChart;
  if (!dbUser.dob || !dbUser.birthTime) return null;
  const chart = await computeNatalChart({
    dob: dbUser.dob,
    birthTime: dbUser.birthTime,
    birthPlace: dbUser.birthPlace || undefined,
  });
  if (chart) {
    const db = await getDb();
    await db
      .collection("users")
      .updateOne(
        { _id: userId },
        { $set: { natalChart: chart, natalChartComputedAt: new Date() } },
      );
  }
  return chart;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Please sign in to generate your Kundali report." },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    let lang = searchParams.get("lang") as "en" | "hi";
    // Fallback if not specified in search params, check user preferences if any, but default to "en"
    if (!lang) lang = "en";

    const db = await getDb();
    const userId = new ObjectId(authUser.userId);
    await ensureUserBillingFields(db, userId);

    const dbUser = await db
      .collection<ReportDbUser>("users")
      .findOne({ _id: userId }, { projection: { password: 0 } });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!dbUser.dob || !dbUser.birthTime) {
      return NextResponse.json(
        {
          error:
            "Please add your birth details (date, time) in your Profile to generate a Kundali report.",
        },
        { status: 400 },
      );
    }

    const reportUnlockId = searchParams.get("unlockId");
    const unlockedReports = getUnlockedReports(dbUser);
    if (
      unlockedReports.length === 0 ||
      (reportUnlockId && !unlockedReports.includes(reportUnlockId))
    ) {
      return NextResponse.json(
        { error: "Please complete payment to unlock this Kundali report." },
        { status: 402 },
      );
    }

    // Get or compute the natal chart
    const chart = await getOrComputeChart(userId, dbUser);
    if (!chart) {
      return NextResponse.json(
        {
          error:
            "Could not compute your natal chart. Please verify your birth details.",
        },
        { status: 500 },
      );
    }

    const userName = dbUser.name || "Seeker";

    const gemstones = getGemstoneRecommendations(chart);
    const futurePredictions = await getFutureTransits(chart, 6);
    const divisional = computeDivisionalCharts(
      chart.planets,
      chart.ascendant.sign,
      chart.ascendant.degreeInSign,
    );
    const sav = calculateSarvashtakvarga(chart.planets, chart.ascendant.sign);
    const deepInterpretations = await generateAIInterpretations(chart, lang);

    // Build the React PDF document element
    const pdfElement = React.createElement(AstrologyReport, {
      chart,
      userName,
      lang,
      gemstones,
      futurePredictions,
      divisional,
      sav,
      deepInterpretations,
    }) as React.ReactElement<DocumentProps>;

    // renderToBuffer from @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(pdfElement);

    const fileName = `Kundali_Report_${userName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report. Please try again." },
      { status: 500 },
    );
  }
}
