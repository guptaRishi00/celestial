import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { computeNatalChart } from "@/lib/astrology/chart";
import type { NatalChart } from "@/lib/astrology/types";
import { getGemstoneRecommendations } from "@/lib/astrology/gemstones";
import { getFutureTransits } from "@/lib/astrology/transits";
import { computeDivisionalCharts } from "@/lib/astrology/divisional";
import { calculateSarvashtakvarga } from "@/lib/astrology/ashtakvarga";
import { generateAIInterpretations } from "@/lib/astrology/interpretations";
import { renderToBuffer } from "@react-pdf/renderer";
import { AstrologyReport } from "@/components/Report/AstrologyReport";
import React from "react";

async function getOrComputeChart(userId: ObjectId, dbUser: any): Promise<NatalChart | null> {
  if (dbUser.natalChart && dbUser.natalChart.version) return dbUser.natalChart as NatalChart;
  if (!dbUser.dob || !dbUser.birthTime) return null;
  const chart = await computeNatalChart({
    dob: dbUser.dob,
    birthTime: dbUser.birthTime,
    birthPlace: dbUser.birthPlace || undefined,
  });
  if (chart) {
    const db = await getDb();
    await db.collection("users").updateOne(
      { _id: userId },
      { $set: { natalChart: chart, natalChartComputedAt: new Date() } }
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
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    let lang = (searchParams.get("lang") as "en" | "hi");
    // Fallback if not specified in search params, check user preferences if any, but default to "en"
    if (!lang) lang = "en";

    const db = await getDb();
    const dbUser = await db.collection("users").findOne(
      { _id: new ObjectId(authUser.userId) },
      { projection: { password: 0 } }
    );

    if (!dbUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!dbUser.dob || !dbUser.birthTime) {
      return NextResponse.json(
        { error: "Please add your birth details (date, time) in your Profile to generate a Kundali report." },
        { status: 400 }
      );
    }

    // Get or compute the natal chart
    const chart = await getOrComputeChart(new ObjectId(authUser.userId), dbUser);
    if (!chart) {
      return NextResponse.json(
        { error: "Could not compute your natal chart. Please verify your birth details." },
        { status: 500 }
      );
    }

    const userName = dbUser.name || "Seeker";

    const gemstones = getGemstoneRecommendations(chart);
    const futurePredictions = await getFutureTransits(chart, 6);
    const divisional = computeDivisionalCharts(chart.planets, chart.ascendant.sign, chart.ascendant.degreeInSign);
    const sav = calculateSarvashtakvarga(chart.planets, chart.ascendant.sign);
    const deepInterpretations = await generateAIInterpretations(chart, lang);

    // Build the React PDF document element
    const pdfElement = React.createElement<any>(AstrologyReport, { 
      chart, 
      userName, 
      lang,
      gemstones,
      futurePredictions,
      divisional,
      sav,
      deepInterpretations
    });

    // renderToBuffer from @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(pdfElement);

    const fileName = `Kundali_Report_${userName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(pdfBuffer as any, {
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
      { status: 500 }
    );
  }
}
