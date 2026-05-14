import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import path from 'path';

import type { NatalChart } from '@/lib/astrology/types';
import type { ChartGemstones } from '@/lib/astrology/gemstones';
import type { MonthlyPrediction } from '@/lib/astrology/transits';
import type { DivisionalCharts } from '@/lib/astrology/divisional';
import type { SarvashtakvargaResult } from '@/lib/astrology/ashtakvarga';
import type { DeepInterpretations } from '@/lib/astrology/interpretations';

import { KundaliChartNorth } from './KundaliChartNorth';
import { KundaliChartSouth } from './KundaliChartSouth';

Font.register({
  family: 'Hind',
  src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/hind/Hind-Regular.ttf',
});

// Devanagari script support — required for the cover-page "ॐ" glyph and any
// Hindi content rendered in the PDF. Without this Font.register the renderer
// throws "Font family not registered" and the whole report build fails.
Font.register({
  family: 'Noto Sans Devanagari',
  fonts: [
    {
      src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf',
      fontWeight: 'normal',
    },
  ],
});

const THEME = {
  primary: '#4A1E1E',
  accent: '#C8A96B',
  background: '#F8F4EC',
  surface: '#FFFDF8',
  text: '#2A2A2A',
  muted: '#6B6B6B',
  border: '#E6D8BD',
};

const DICT = {
  en: {
    title: 'Sacred Kundali Report',
    brand: 'Future Dekho',
    dob: 'Date of Birth',
    time: 'Time of Birth',
    place: 'Place of Birth',
    chartsTitle: 'Divisional Charts',
    d1Chart: 'D1 Natal Chart',
    moonChart: 'Moon Chart',
    chalitChart: 'Bhava Chalit Chart',
    d9Chart: 'D9 Navamsa Chart',
    d10Chart: 'D10 Dasamamsa Chart',
    gemstonesTitle: 'Gemstones & Rudraksha',
    lifeStone: 'Life Stone',
    luckyStone: 'Lucky Stone',
    fortuneStone: 'Fortune Stone',
    dashaStone: 'Current Dasha Stone',
    rudraksha: 'Recommended Rudraksha',
    metal: 'Metal',
    finger: 'Finger',
    day: 'Wearing Day',
    planets: 'Planetary Positions',
    savTitle: 'Sarvashtakvarga',
    predictionsTitle: 'Future Predictions',
    interpretations: 'Astrological Interpretations',
    personality: 'Personality',
    profession: 'Profession',
    father: 'Father & Fortune',
  },

  hi: {
    title: 'पवित्र जन्म कुंडली',
    brand: 'सेलेस्टियल एडिटोरियल',
    dob: 'जन्म तिथि',
    time: 'जन्म समय',
    place: 'जन्म स्थान',
    chartsTitle: 'वर्ग कुंडलियां',
    d1Chart: 'D1 लग्न कुंडली',
    moonChart: 'चंद्र कुंडली',
    chalitChart: 'भाव चलित कुंडली',
    d9Chart: 'D9 नवमांश कुंडली',
    d10Chart: 'D10 दशमांश कुंडली',
    gemstonesTitle: 'रत्न एवं रुद्राक्ष',
    lifeStone: 'जीवन रत्न',
    luckyStone: 'भाग्य रत्न',
    fortuneStone: 'भाग्य रत्न',
    dashaStone: 'वर्तमान दशा रत्न',
    rudraksha: 'अनुशंसित रुद्राक्ष',
    metal: 'धातु',
    finger: 'उंगली',
    day: 'पहनने का दिन',
    planets: 'ग्रह स्थिति',
    savTitle: 'सर्वाष्टकवर्ग',
    predictionsTitle: 'भविष्यवाणियां',
    interpretations: 'ज्योतिषीय रहस्योद्घाटन',
    personality: 'व्यक्तित्व',
    profession: 'व्यवसाय',
    father: 'धर्म एवं भाग्य',
  },
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: THEME.background,
    paddingTop: 45,
    paddingBottom: 45,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    position: 'relative',
  },

  pageHindi: {
    backgroundColor: THEME.background,
    paddingTop: 45,
    paddingBottom: 45,
    paddingHorizontal: 40,
    fontFamily: 'Hind',
    position: 'relative',
  },

  fullBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },

  contentWrapper: {
    flexGrow: 1,
  },

  brandTitle: {
    fontSize: 14,
    color: THEME.accent,
    letterSpacing: 4,
    marginBottom: 16,
    textTransform: 'uppercase',
  },

  reportTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
  },

  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  coverOm: {
    fontSize: 72,
    color: THEME.primary,
    marginBottom: 24,
  },

  detailsContainer: {
    marginTop: 32,
    paddingVertical: 22,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    backgroundColor: THEME.surface,
    width: '80%',
  },

  detailText: {
    fontSize: 13,
    color: THEME.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.primary,
    marginBottom: 14,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.accent,
    letterSpacing: 1,
  },

  divider: {
    width: 80,
    height: 1,
    backgroundColor: THEME.accent,
    alignSelf: 'center',
    marginVertical: 14,
  },

  subTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.primary,
    marginBottom: 12,
    textAlign: 'center',
  },

  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },

  chartCol: {
    width: '48%',
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    backgroundColor: THEME.surface,
    alignItems: 'center',
  },

  card: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.primary,
    marginBottom: 10,
  },

  textBlock: {
    fontSize: 11.5,
    lineHeight: 1.4,
    color: THEME.text,
  },

  table: {
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 12,
    borderRadius: 6,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },

  tableHeader: {
    backgroundColor: '#F1E7D0',
  },

  tableColSm: {
    width: '20%',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: THEME.border,
  },

  tableColLg: {
    width: '40%',
    padding: 8,
  },

  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.primary,
    textAlign: 'center',
  },

  tableCell: {
    fontSize: 10.5,
    color: THEME.text,
    textAlign: 'center',
  },

  savContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  savCard: {
    width: '30%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    backgroundColor: THEME.surface,
    padding: 12,
    alignItems: 'center',
  },

  savLabel: {
    fontSize: 11,
    color: THEME.primary,
    marginBottom: 8,
    fontWeight: 'bold',
  },

  savValue: {
    fontSize: 18,
    color: THEME.accent,
    fontWeight: 'bold',
  },
});

const getAssetPath = (filename: string) => {
  return path.join(process.cwd(), 'public', filename);
};

const ReportPage = ({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: 'en' | 'hi';
}) => {
  const pageStyle = lang === 'hi' ? styles.pageHindi : styles.page;

  return (
    <Page size="A4" style={pageStyle}>
      <Image
        src={getAssetPath('mandala-bg.png')}
        style={styles.fullBgImage}
        fixed
      />

      <View style={styles.contentWrapper}>{children}</View>
    </Page>
  );
};

const Divider = () => <View style={styles.divider} />;

interface AstrologyReportProps {
  chart: NatalChart;
  userName?: string;
  lang?: 'en' | 'hi';
  gemstones: ChartGemstones;
  futurePredictions: MonthlyPrediction[];
  divisional: DivisionalCharts;
  sav: SarvashtakvargaResult;
  deepInterpretations: DeepInterpretations;
}

export const AstrologyReport = ({
  chart,
  userName = 'Native',
  lang = 'en',
  gemstones,
  futurePredictions,
  divisional,
  sav,
  deepInterpretations,
}: AstrologyReportProps) => {
  const t = DICT[lang];

  return (
    <Document>
      {/* COVER */}
      <ReportPage lang={lang}>
        <View style={styles.coverContainer}>
          <Text
            style={{
              ...styles.coverOm,
              fontFamily: 'Noto Sans Devanagari',
              fontSize: 90,
              color: THEME.primary,
              marginBottom: 18,
            }}
          >
            ॐ
          </Text>

          <Text style={styles.brandTitle}>{t.brand}</Text>

          <Text style={styles.reportTitle}>{t.title}</Text>

          <Divider />

          <View style={styles.detailsContainer}>
            <Text
              style={{
                ...styles.detailText,
                fontSize: 18,
                fontWeight: 'bold',
                color: THEME.primary,
              }}
            >
              {userName}
            </Text>

            <Text style={styles.detailText}>
              {t.dob}: {chart.input.dob}
            </Text>

            <Text style={styles.detailText}>
              {t.time}: {chart.input.birthTime}
            </Text>

            {!!chart.input.birthPlace && (
              <Text style={styles.detailText}>
                {t.place}: {chart.input.birthPlace}
              </Text>
            )}
          </View>
        </View>
      </ReportPage>

      {/* CHARTS */}
      <ReportPage lang={lang}>
        <Text style={styles.sectionTitle}>{t.chartsTitle}</Text>

        <Text style={styles.subTitle}>{t.d1Chart}</Text>

        <View style={styles.chartRow}>
          <View style={styles.chartCol}>
            <KundaliChartNorth
              planets={chart.planets}
              ascendantSign={chart.ascendant.sign}
              size={180}
            />
          </View>

          <View style={styles.chartCol}>
            <KundaliChartSouth
              planets={chart.planets}
              ascendantSign={chart.ascendant.sign}
              size={180}
            />
          </View>
        </View>

        <Divider />

        <Text style={styles.subTitle}>{t.moonChart}</Text>

        <View style={styles.chartRow}>
          <View style={styles.chartCol}>
            <KundaliChartNorth
              planets={divisional.moonChart.planets}
              ascendantSign={divisional.moonChart.ascendantSign}
              size={180}
            />
          </View>

          <View style={styles.chartCol}>
            <KundaliChartSouth
              planets={divisional.moonChart.planets}
              ascendantSign={divisional.moonChart.ascendantSign}
              size={180}
            />
          </View>
        </View>
      </ReportPage>

      {/* D9 + D10 */}
      <ReportPage lang={lang}>
        <Text style={styles.sectionTitle}>
          {t.chartsTitle} II
        </Text>

        <Text style={styles.subTitle}>{t.d9Chart}</Text>

        <View style={styles.chartRow}>
          <View style={styles.chartCol}>
            <KundaliChartNorth
              planets={divisional.d9.planets}
              ascendantSign={divisional.d9.ascendantSign}
              size={180}
            />
          </View>

          <View style={styles.chartCol}>
            <KundaliChartSouth
              planets={divisional.d9.planets}
              ascendantSign={divisional.d9.ascendantSign}
              size={180}
            />
          </View>
        </View>

        <Divider />

        <Text style={styles.subTitle}>{t.d10Chart}</Text>

        <View style={styles.chartRow}>
          <View style={styles.chartCol}>
            <KundaliChartNorth
              planets={divisional.d10.planets}
              ascendantSign={divisional.d10.ascendantSign}
              size={180}
            />
          </View>

          <View style={styles.chartCol}>
            <KundaliChartSouth
              planets={divisional.d10.planets}
              ascendantSign={divisional.d10.ascendantSign}
              size={180}
            />
          </View>
        </View>
      </ReportPage>

      {/* SAV */}
      <ReportPage lang={lang}>
        <Text style={styles.sectionTitle}>{t.savTitle}</Text>

        <View style={styles.savContainer}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => (
            <View key={s} style={styles.savCard}>
              <Text style={styles.savLabel}>Sign {s}</Text>
              <Text style={styles.savValue}>{sav[s]}</Text>
            </View>
          ))}
        </View>
      </ReportPage>

      {/* INTERPRETATIONS */}
      <ReportPage lang={lang}>
        <Text style={styles.sectionTitle}>
          {t.interpretations}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t.personality}
          </Text>

          <Text style={styles.textBlock}>
            {deepInterpretations.personality}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t.profession}
          </Text>

          <Text style={styles.textBlock}>
            {deepInterpretations.profession}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t.father}
          </Text>

          <Text style={styles.textBlock}>
            {deepInterpretations.father}
          </Text>
        </View>
      </ReportPage>

      {/* GEMSTONES */}
      <ReportPage lang={lang}>
        <Text style={styles.sectionTitle}>
          {t.gemstonesTitle}
        </Text>

        {[
          gemstones.lifeStone,
          gemstones.luckyStone,
          gemstones.fortuneStone,
          gemstones.dashaStone,
        ].map((stone, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.cardTitle}>
              {stone.stone} ({stone.planet})
            </Text>

            <Text style={styles.textBlock}>
              {stone.purpose}
            </Text>

            <Text
              style={{
                ...styles.textBlock,
                marginTop: 10,
                color: THEME.muted,
              }}
            >
              {t.metal}: {stone.metal} | {t.finger}:{' '}
              {stone.finger} | {t.day}: {stone.day}
            </Text>
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t.rudraksha}
          </Text>

          <Text style={styles.textBlock}>
            {gemstones.rudraksha}
          </Text>
        </View>
      </ReportPage>

      {/* PLANETS */}
      <ReportPage lang={lang}>
        <Text style={styles.sectionTitle}>
          {t.planets}
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableColSm}>
              <Text style={styles.tableCellHeader}>
                Planet
              </Text>
            </View>

            <View style={styles.tableColSm}>
              <Text style={styles.tableCellHeader}>
                Sign
              </Text>
            </View>

            <View style={styles.tableColSm}>
              <Text style={styles.tableCellHeader}>
                Degree
              </Text>
            </View>

            <View style={styles.tableColLg}>
              <Text style={styles.tableCellHeader}>
                Nakshatra
              </Text>
            </View>
          </View>

          {chart.planets.map((planet, index) => (
            <View
              key={index}
              style={{
                ...styles.tableRow,
                backgroundColor:
                  index % 2 === 0
                    ? '#FCF8F0'
                    : THEME.surface,
              }}
            >
              <View style={styles.tableColSm}>
                <Text style={styles.tableCell}>
                  {planet.name}
                </Text>
              </View>

              <View style={styles.tableColSm}>
                <Text style={styles.tableCell}>
                  {planet.signName}
                </Text>
              </View>

              <View style={styles.tableColSm}>
                <Text style={styles.tableCell}>
                  {planet.degreeInSign.toFixed(2)}°
                </Text>
              </View>

              <View style={styles.tableColLg}>
                <Text style={styles.tableCell}>
                  {planet.nakshatraName} (
                  {planet.nakshatraPada})
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ReportPage>

      {/* FUTURE */}
      <ReportPage lang={lang}>
        <Text style={styles.sectionTitle}>
          {t.predictionsTitle}
        </Text>

        {futurePredictions.map((pred, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.cardTitle}>
              {pred.month}
            </Text>

            <Text style={styles.textBlock}>
              {pred.description}
            </Text>
          </View>
        ))}
      </ReportPage>
    </Document>
  );
};