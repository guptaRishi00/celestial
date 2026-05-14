import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { computeNatalChart, buildChartDigest } from "@/lib/astrology/chart";
import { enrichTransitsForChart, getDailyTransits } from "@/lib/astrology/transits";
import type { NatalChart, TransitInfo } from "@/lib/astrology/types";
import { SIGNS_VEDIC, PLANETS_VEDIC, NAKSHATRAS, HOUSE_MEANINGS } from "@/lib/astrology/constants";
import { jsPDF } from "jspdf";

// ─── Helpers ───────────────────────────────────────────────────────────
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

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

function formatTime(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  } catch { return timeStr; }
}

function suffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

// ─── PDF Generation ─────────────────────────────────────────────────────
// Colors
const COLORS = {
  accent:    [196, 161, 255] as [number, number, number],  // hero-accent purple
  warm:      [255, 169, 142] as [number, number, number],  // hero-warm
  cool:      [126, 200, 227] as [number, number, number],
  gold:      [218, 185, 107] as [number, number, number],
  dark:      [15, 14, 12]    as [number, number, number],
  darkCard:  [25, 24, 22]    as [number, number, number],
  text:      [230, 228, 222] as [number, number, number],
  textDim:   [150, 148, 142] as [number, number, number],
  auspicious:[120, 200, 120] as [number, number, number],
  challenging:[255, 130, 110] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
};

class KundaliPDF {
  private doc: jsPDF;
  private y: number = 0;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 20;
  private contentWidth: number;
  private pageNum = 0;

  constructor() {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.newPage();
  }

  private newPage() {
    if (this.pageNum > 0) this.doc.addPage();
    this.pageNum++;
    this.y = this.margin;

    // Dark background
    this.doc.setFillColor(...COLORS.dark);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, "F");

    // Subtle border
    this.doc.setDrawColor(...COLORS.accent);
    this.doc.setLineWidth(0.3);
    this.doc.rect(8, 8, this.pageWidth - 16, this.pageHeight - 16);

    // Corner decorations
    this.drawCornerOrn(12, 12);
    this.drawCornerOrn(this.pageWidth - 12, 12, true);

    // Footer
    this.doc.setFontSize(7);
    this.doc.setTextColor(...COLORS.textDim);
    this.doc.text(
      `Celestial Kundali Report  |  Page ${this.pageNum}  |  Generated ${new Date().toLocaleDateString("en-IN")}`,
      this.pageWidth / 2, this.pageHeight - 10,
      { align: "center" }
    );

    this.y = this.margin + 8;
  }

  private drawCornerOrn(x: number, y: number, flip = false) {
    const s = flip ? -1 : 1;
    this.doc.setDrawColor(...COLORS.gold);
    this.doc.setLineWidth(0.5);
    this.doc.line(x, y, x + s * 12, y);
    this.doc.line(x, y, x, y + 12);
  }

  private checkPageBreak(needed: number) {
    if (this.y + needed > this.pageHeight - 18) {
      this.newPage();
    }
  }

  private sectionHeader(title: string, emoji = "✦") {
    this.checkPageBreak(14);
    this.y += 4;

    // Accent line
    this.doc.setDrawColor(...COLORS.accent);
    this.doc.setLineWidth(0.6);
    this.doc.line(this.margin, this.y, this.margin + this.contentWidth, this.y);
    this.y += 5;

    this.doc.setFontSize(13);
    this.doc.setTextColor(...COLORS.accent);
    this.doc.text(`${emoji}  ${title}`, this.margin, this.y);
    this.y += 7;
  }

  private subHeader(title: string) {
    this.checkPageBreak(10);
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.gold);
    this.doc.text(title, this.margin + 2, this.y);
    this.y += 5;
  }

  private bodyText(text: string, indent = 0) {
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.text);
    const lines = this.doc.splitTextToSize(text, this.contentWidth - indent);
    for (const line of lines) {
      this.checkPageBreak(5);
      this.doc.text(line, this.margin + indent, this.y);
      this.y += 4.2;
    }
  }

  private dimText(text: string, indent = 0) {
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.textDim);
    const lines = this.doc.splitTextToSize(text, this.contentWidth - indent);
    for (const line of lines) {
      this.checkPageBreak(4.5);
      this.doc.text(line, this.margin + indent, this.y);
      this.y += 3.8;
    }
  }

  private bulletPoint(text: string, color?: [number, number, number]) {
    this.checkPageBreak(5);
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...(color || COLORS.text));
    const bullet = "  •  ";
    const lines = this.doc.splitTextToSize(text, this.contentWidth - 10);
    this.doc.text(bullet + lines[0], this.margin + 3, this.y);
    this.y += 4.2;
    for (let i = 1; i < lines.length; i++) {
      this.checkPageBreak(4.2);
      this.doc.text(lines[i], this.margin + 13, this.y);
      this.y += 4.2;
    }
  }

  private tableRow(cols: string[], widths: number[], isHeader = false) {
    this.checkPageBreak(6);
    const rowY = this.y;

    if (isHeader) {
      this.doc.setFillColor(...COLORS.darkCard);
      this.doc.rect(this.margin, rowY - 3.5, this.contentWidth, 5.5, "F");
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(...COLORS.gold);
    } else {
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(...COLORS.text);
    }

    let x = this.margin + 2;
    for (let i = 0; i < cols.length; i++) {
      const w = widths[i];
      const truncated = cols[i].length > Math.floor(w / 1.8) ? cols[i].substring(0, Math.floor(w / 1.8)) + ".." : cols[i];
      this.doc.text(truncated, x, rowY);
      x += w;
    }
    this.y += 4.5;
  }

  // ─── Public build method ───────────────────────────────────────────────
  build(
    userName: string,
    dbUser: any,
    chart: NatalChart,
    digest: ReturnType<typeof buildChartDigest>,
    transits: TransitInfo | null
  ): ArrayBuffer {
    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 1 — TITLE & PERSONAL DETAILS
    // ═══════════════════════════════════════════════════════════════════════
    this.y = 30;

    // Title area
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.textDim);
    this.doc.text("✦ CELESTIAL ✦", this.pageWidth / 2, this.y, { align: "center" });
    this.y += 10;

    this.doc.setFontSize(24);
    this.doc.setTextColor(...COLORS.accent);
    this.doc.text("Kundali Report", this.pageWidth / 2, this.y, { align: "center" });
    this.y += 8;

    this.doc.setFontSize(14);
    this.doc.setTextColor(...COLORS.warm);
    this.doc.text(userName, this.pageWidth / 2, this.y, { align: "center" });
    this.y += 5;

    // Decorative line
    this.doc.setDrawColor(...COLORS.gold);
    this.doc.setLineWidth(0.4);
    const lineCenter = this.pageWidth / 2;
    this.doc.line(lineCenter - 30, this.y, lineCenter + 30, this.y);
    this.y += 8;

    // Personal details card
    const moonPl = chart.planets.find(p => p.name === "Moon")!;
    const moonRashi = SIGNS_VEDIC[chart.moonSign - 1];
    const moonRashiEn = chart.planets.find(p => p.name === "Moon")!.signName;
    const moonNakName = NAKSHATRAS[moonPl.nakshatraIndex].name;
    const lagnaName = `${SIGNS_VEDIC[chart.ascendant.sign - 1]} (${chart.ascendant.signName})`;

    this.doc.setFillColor(...COLORS.darkCard);
    this.doc.roundedRect(this.margin, this.y, this.contentWidth, 44, 2, 2, "F");
    this.doc.setDrawColor(50, 50, 48);
    this.doc.roundedRect(this.margin, this.y, this.contentWidth, 44, 2, 2, "S");

    const cardY = this.y + 7;
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.textDim);

    const colW = this.contentWidth / 3;
    const infoItems = [
      ["Date of Birth", formatDate(chart.input.dob)],
      ["Time of Birth", formatTime(chart.input.birthTime)],
      ["Birth Place", chart.input.birthPlace || dbUser.birthPlace || "Not specified"],
    ];

    for (let i = 0; i < infoItems.length; i++) {
      const x = this.margin + 6 + i * colW;
      this.doc.text(infoItems[i][0], x, cardY);
      this.doc.setFontSize(10);
      this.doc.setTextColor(...COLORS.white);
      this.doc.text(infoItems[i][1], x, cardY + 6);
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.textDim);
    }

    // Second row — Rashi, Nakshatra, Lagna
    const cardY2 = cardY + 14;
    const infoItems2 = [
      ["Rashi (Moon Sign)", `${moonRashi} (${moonRashiEn})`],
      ["Nakshatra", `${moonNakName}, Pada ${moonPl.nakshatraPada}`],
      ["Lagna (Ascendant)", lagnaName],
    ];
    for (let i = 0; i < infoItems2.length; i++) {
      const x = this.margin + 6 + i * colW;
      this.doc.text(infoItems2[i][0], x, cardY2);
      this.doc.setFontSize(10);
      this.doc.setTextColor(...COLORS.white);
      this.doc.text(infoItems2[i][1], x, cardY2 + 6);
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.textDim);
    }

    // Third row — Ayanamsha, House System, Gender
    const cardY3 = cardY2 + 14;
    const infoItems3 = [
      ["Ayanamsha", chart.ayanamsha ? chart.ayanamsha.charAt(0).toUpperCase() + chart.ayanamsha.slice(1) : "Lahiri"],
      ["House System", "Whole Sign (Rashi)"],
      ["Gender", dbUser.gender || "Not specified"],
    ];
    for (let i = 0; i < infoItems3.length; i++) {
      const x = this.margin + 6 + i * colW;
      this.doc.text(infoItems3[i][0], x, cardY3);
      this.doc.setFontSize(10);
      this.doc.setTextColor(...COLORS.white);
      this.doc.text(infoItems3[i][1], x, cardY3 + 6);
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.textDim);
    }

    this.y += 50;

    // ═══════════════════════════════════════════════════════════════════════
    // ASCENDANT & IDENTITY
    // ═══════════════════════════════════════════════════════════════════════
    this.sectionHeader("Lagna (Ascendant) & Identity", "🕉");

    const ascVedic = SIGNS_VEDIC[chart.ascendant.sign - 1];
    this.bodyText(`Lagna: ${ascVedic} (${chart.ascendant.signName}) at ${chart.ascendant.degreeInSign.toFixed(1)}°`);

    const moonP = chart.planets.find(p => p.name === "Moon")!;
    const sunP = chart.planets.find(p => p.name === "Sun")!;
    this.bodyText(`Chandra Rashi (Moon Sign): ${SIGNS_VEDIC[chart.moonSign - 1]} (${moonP.signName}) — Nakshatra: ${NAKSHATRAS[moonP.nakshatraIndex].name}, Pada ${moonP.nakshatraPada}`);
    this.bodyText(`Surya Rashi (Sun Sign): ${SIGNS_VEDIC[chart.sunSign - 1]} (${sunP.signName}) — Nakshatra: ${NAKSHATRAS[sunP.nakshatraIndex].name}, Pada ${sunP.nakshatraPada}`);
    this.y += 2;

    // ═══════════════════════════════════════════════════════════════════════
    // PLANETARY POSITIONS TABLE
    // ═══════════════════════════════════════════════════════════════════════
    this.sectionHeader("Graha Sthiti (Planetary Positions)", "🪐");

    const colWidths = [22, 22, 22, 14, 14, 28, 12, 14, 22];
    this.tableRow(
      ["Graha", "Vedic", "Rashi", "Bhava", "Deg", "Nakshatra", "Pada", "Lord", "Status"],
      colWidths,
      true
    );

    for (const p of chart.planets) {
      const vedicName = PLANETS_VEDIC[p.name] || p.name;
      const vedicSign = SIGNS_VEDIC[p.sign - 1];
      const nak = NAKSHATRAS[p.nakshatraIndex];
      const status = p.retrograde ? "Vakri" : "Direct";

      this.tableRow(
        [
          p.name,
          vedicName,
          vedicSign,
          `${p.house}`,
          `${p.degreeInSign.toFixed(1)}`,
          nak.name,
          `${p.nakshatraPada}`,
          nak.lord,
          status,
        ],
        colWidths
      );
    }
    this.y += 2;

    // ═══════════════════════════════════════════════════════════════════════
    // BHAVA (HOUSE) ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════
    this.sectionHeader("Bhava Vivaran (House Analysis)", "🏛");

    for (const line of digest.houseSummary) {
      this.bulletPoint(line);
    }
    this.y += 2;

    // ═══════════════════════════════════════════════════════════════════════
    // YOGAS
    // ═══════════════════════════════════════════════════════════════════════
    this.sectionHeader("Yogas (Planetary Combinations)", "🌟");

    if (chart.yogas.length === 0) {
      this.dimText("No notable classical yogas detected in this chart.");
    } else {
      for (const yoga of chart.yogas) {
        const color = yoga.type === "auspicious" ? COLORS.auspicious : yoga.type === "challenging" ? COLORS.challenging : COLORS.text;
        this.checkPageBreak(12);
        this.doc.setFontSize(9.5);
        this.doc.setTextColor(...color);
        this.doc.text(`${yoga.name}  [${yoga.type.toUpperCase()} — ${yoga.strength}]`, this.margin + 4, this.y);
        this.y += 4.5;
        this.dimText(yoga.description, 6);
        this.dimText(`Involves: ${yoga.involves.join(", ")}`, 6);
        this.y += 2;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DOSHAS
    // ═══════════════════════════════════════════════════════════════════════
    this.sectionHeader("Doshas (Afflictions)", "⚠");

    const activeDoshas = chart.doshas.filter(d => d.present);
    if (activeDoshas.length === 0) {
      this.dimText("No significant doshas detected. This is a positive indication.");
    } else {
      for (const dosha of activeDoshas) {
        this.checkPageBreak(14);
        const sevColor = dosha.severity === "high" ? COLORS.challenging :
          dosha.severity === "cancelled" ? COLORS.auspicious : COLORS.warm;
        this.doc.setFontSize(9.5);
        this.doc.setTextColor(...sevColor);
        this.doc.text(`${dosha.name}  [Severity: ${dosha.severity.toUpperCase()}]`, this.margin + 4, this.y);
        this.y += 4.5;
        this.dimText(dosha.description, 6);
        if (dosha.cancellation) {
          this.doc.setFontSize(8);
          this.doc.setTextColor(...COLORS.auspicious);
          const cancelLines = this.doc.splitTextToSize(`Cancellation: ${dosha.cancellation}`, this.contentWidth - 8);
          for (const line of cancelLines) {
            this.checkPageBreak(4);
            this.doc.text(line, this.margin + 6, this.y);
            this.y += 3.8;
          }
        }
        this.y += 2;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DASHA ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════
    this.sectionHeader("Vimshottari Dasha (Planetary Periods)", "🔮");

    const maha = chart.dashas.current.maha;
    const antar = chart.dashas.current.antar;
    const prat = chart.dashas.current.pratyantar;

    this.subHeader("Current Dasha Periods");
    this.bodyText(`Mahadasha: ${PLANETS_VEDIC[maha.lord]} (${maha.lord}) — ${formatDate(maha.startDate)} to ${formatDate(maha.endDate)} (${maha.years} years)`);
    this.bodyText(`Antardasha: ${PLANETS_VEDIC[antar.lord]} (${antar.lord}) — ${formatDate(antar.startDate)} to ${formatDate(antar.endDate)}`);
    if (prat) {
      this.bodyText(`Pratyantar Dasha: ${PLANETS_VEDIC[prat.lord]} (${prat.lord}) — ${formatDate(prat.startDate)} to ${formatDate(prat.endDate)}`);
    }
    this.y += 2;

    if (chart.dashas.upcomingMaha.length > 0) {
      this.subHeader("Upcoming Mahadashas");
      for (const d of chart.dashas.upcomingMaha) {
        this.bulletPoint(`${PLANETS_VEDIC[d.lord]} (${d.lord}) — ${formatDate(d.startDate)} to ${formatDate(d.endDate)} (${d.years} years)`);
      }
    }
    this.y += 2;

    // ═══════════════════════════════════════════════════════════════════════
    // ASPECTS
    // ═══════════════════════════════════════════════════════════════════════
    this.sectionHeader("Graha Drishti (Planetary Aspects)", "👁");

    if (chart.aspects.length === 0) {
      this.dimText("No special aspects detected.");
    } else {
      for (const asp of chart.aspects) {
        const target = asp.toPlanets.length > 0
          ? `${asp.toHouse}${suffix(asp.toHouse)} bhava (affecting ${asp.toPlanets.join(", ")})`
          : `${asp.toHouse}${suffix(asp.toHouse)} bhava`;
        this.bulletPoint(
          `${PLANETS_VEDIC[asp.from]} (${asp.from}) aspects the ${target} — ${asp.type === "special" ? "Special aspect" : "7th aspect"}`
        );
      }
    }
    this.y += 2;

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSITS
    // ═══════════════════════════════════════════════════════════════════════
    if (digest.notableTransits.length > 0) {
      this.sectionHeader("Gochar (Current Transits)", "🌍");
      for (const t of digest.notableTransits) {
        this.bulletPoint(t);
      }
      this.y += 2;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GENERAL REMEDIES
    // ═══════════════════════════════════════════════════════════════════════
    this.sectionHeader("Samanya Upaay (General Remedies)", "🙏");

    const remedies = [
      "Recite the Gayatri Mantra (Om Bhur Bhuva Swaha...) 108 times daily at sunrise for overall spiritual protection and mental clarity.",
      "Wear a natural, untreated gemstone appropriate to your weakest benefic planet after consulting a qualified Jyotishi for specific recommendations.",
      "Perform Surya Namaskar at dawn to strengthen the Sun's positive influence in your chart.",
      "Light a ghee diya (lamp) every evening at your home temple or prayer area — this is a powerful general remedy for removing negative energies.",
      "Donate food to the needy on Saturdays (for Saturn), Tuesdays (for Mars), or Thursdays (for Jupiter) based on which graha needs strengthening.",
      "Practice regular meditation or pranayama (breathing exercises) to calm the mind and align with cosmic rhythms.",
    ];

    for (const r of remedies) {
      this.bulletPoint(r, COLORS.cool);
    }
    this.y += 4;

    // ═══════════════════════════════════════════════════════════════════════
    // CLOSING
    // ═══════════════════════════════════════════════════════════════════════
    this.checkPageBreak(20);
    this.doc.setDrawColor(...COLORS.gold);
    this.doc.setLineWidth(0.4);
    this.doc.line(this.margin + 30, this.y, this.pageWidth - this.margin - 30, this.y);
    this.y += 6;

    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.textDim);
    const closingText = "This report is generated based on Vedic Jyotish (sidereal) calculations using the Lahiri Ayanamsha. For personalized consultations and detailed analysis, please chat with Pandit Shastri Ji on Celestial. Om Shanti.";
    const closingLines = this.doc.splitTextToSize(closingText, this.contentWidth - 20);
    for (const line of closingLines) {
      this.checkPageBreak(4.5);
      this.doc.text(line, this.pageWidth / 2, this.y, { align: "center" });
      this.y += 4;
    }

    return this.doc.output("arraybuffer");
  }
}

// ─── Route Handler ──────────────────────────────────────────────────────
export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return Response.json(
        { error: "Please sign in to generate your Kundali report." },
        { status: 401 }
      );
    }

    const db = await getDb();
    const dbUser = await db.collection("users").findOne(
      { _id: new ObjectId(authUser.userId) },
      { projection: { password: 0 } }
    );

    if (!dbUser) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    if (!dbUser.dob || !dbUser.birthTime) {
      return Response.json(
        { error: "Please add your birth details (date, time) in your Profile to generate a Kundali report." },
        { status: 400 }
      );
    }

    // Get or compute the natal chart
    const chart = await getOrComputeChart(new ObjectId(authUser.userId), dbUser);
    if (!chart) {
      return Response.json(
        { error: "Could not compute your natal chart. Please verify your birth details." },
        { status: 500 }
      );
    }

    // Build digest & transits
    let transits: TransitInfo | null = null;
    try {
      const rawTransits = await getDailyTransits();
      if (rawTransits) transits = enrichTransitsForChart(rawTransits, chart);
    } catch { /* transits are optional */ }

    const digest = buildChartDigest(chart, transits);

    // Generate PDF
    const pdfBuilder = new KundaliPDF();
    const pdfBuffer = pdfBuilder.build(
      dbUser.name || "Seeker",
      dbUser,
      chart,
      digest,
      transits
    );

    const fileName = `Kundali_Report_${(dbUser.name || "User").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return Response.json(
      { error: "Failed to generate report. Please try again." },
      { status: 500 }
    );
  }
}
