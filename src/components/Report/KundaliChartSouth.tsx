import React from 'react';
import {
  View,
  Svg,
  Line,
  Rect,
  Text as PdfText,
  StyleSheet,
} from '@react-pdf/renderer';

import type { PlanetPosition } from '@/lib/astrology/types';

interface KundaliChartSouthProps {
  planets: PlanetPosition[];
  ascendantSign: number;
  size?: number;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },

  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 220,
    height: 220,
  },

  planetText: {
    position: 'absolute',
    fontSize: 7,
    color: '#111111',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    width: 40,
  },

  ascText: {
    position: 'absolute',
    fontSize: 7,
    color: '#111111',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'left',
    width: 30,
  },

  rashiText: {
    position: 'absolute',
    fontSize: 10,
    color: '#CCCCCC',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    width: 60,
  },
});

const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

const signToBox: Record<number, { x: number; y: number }> = {
  12: { x: 0, y: 0 },
  1: { x: 75, y: 0 },
  2: { x: 150, y: 0 },
  3: { x: 225, y: 0 },
  4: { x: 225, y: 75 },
  5: { x: 225, y: 150 },
  6: { x: 225, y: 225 },
  7: { x: 150, y: 225 },
  8: { x: 75, y: 225 },
  9: { x: 0, y: 225 },
  10: { x: 0, y: 150 },
  11: { x: 0, y: 75 },
};

export const KundaliChartSouth = ({
  planets,
  ascendantSign,
  size = 220,
}: KundaliChartSouthProps) => {
  const scale = size / 300;

  const planetsBySign: Record<number, string[]> = {};

  for (const p of planets) {
    if (!p?.sign) continue;

    if (!planetsBySign[p.sign]) {
      planetsBySign[p.sign] = [];
    }

    planetsBySign[p.sign].push(
      PLANET_ABBR[p.name] || p.name.slice(0, 2)
    );
  }

  return (
    <View
      style={{
        ...styles.container,
        width: size,
        height: size,
      }}
    >
      {/* SVG BASE */}
      <Svg
        width={size}
        height={size}
        viewBox="0 0 300 300"
      >
        <Rect x="0" y="0" width="300" height="300" stroke="#222" strokeWidth="1" fill="none" />
        
        <Line x1="75" y1="0" x2="75" y2="300" stroke="#222" strokeWidth="1" />
        <Line x1="150" y1="0" x2="150" y2="75" stroke="#222" strokeWidth="1" />
        <Line x1="150" y1="225" x2="150" y2="300" stroke="#222" strokeWidth="1" />
        <Line x1="225" y1="0" x2="225" y2="300" stroke="#222" strokeWidth="1" />

        <Line x1="0" y1="75" x2="300" y2="75" stroke="#222" strokeWidth="1" />
        <Line x1="0" y1="150" x2="75" y2="150" stroke="#222" strokeWidth="1" />
        <Line x1="225" y1="150" x2="300" y2="150" stroke="#222" strokeWidth="1" />
        <Line x1="0" y1="225" x2="300" y2="225" stroke="#222" strokeWidth="1" />

        <Line x1="75" y1="75" x2="225" y2="75" stroke="#222" strokeWidth="1" />
        <Line x1="75" y1="225" x2="225" y2="225" stroke="#222" strokeWidth="1" />
        <Line x1="75" y1="75" x2="75" y2="225" stroke="#222" strokeWidth="1" />
        <Line x1="225" y1="75" x2="225" y2="225" stroke="#222" strokeWidth="1" />
      </Svg>

      {/* TEXT OVERLAY */}
      <View style={styles.overlayContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((sign) => {
          const box = signToBox[sign];
          if (!box) return null;

          const isAscendant = sign === ascendantSign;
          const pl = planetsBySign[sign] || [];

          return (
            <React.Fragment key={sign}>
              {isAscendant ? (
                <PdfText
                  style={{
                    ...styles.ascText,
                    left: (box.x + 5) * scale,
                    top: (box.y + 5) * scale,
                  }}
                >
                  Asc
                </PdfText>
              ) : null}

              {pl.map((planet, idx) => (
                <PdfText
                  key={idx}
                  style={{
                    ...styles.planetText,
                    left: (box.x + 17.5) * scale,
                    top: (box.y + 20 + idx * 12) * scale,
                  }}
                >
                  {planet}
                </PdfText>
              ))}
            </React.Fragment>
          );
        })}

        {/* Center label */}
        <PdfText
          style={{
            ...styles.rashiText,
            left: 120 * scale,
            top: 144 * scale,
          }}
        >
          Rashi
        </PdfText>
      </View>
    </View>
  );
};
