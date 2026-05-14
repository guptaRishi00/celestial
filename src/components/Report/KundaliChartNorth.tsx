import React from 'react';
import {
  View,
  Svg,
  Line,
  Polygon,
  Text as PdfText,
  StyleSheet,
} from '@react-pdf/renderer';

import type { PlanetPosition } from '@/lib/astrology/types';

interface KundaliChartNorthProps {
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

  signText: {
    position: 'absolute',
    fontSize: 6,
    color: '#666666',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    width: 20,
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

export const KundaliChartNorth = ({
  planets,
  ascendantSign,
  size = 220,
}: KundaliChartNorthProps) => {
  const scale = size / 300;

  const planetsByHouse: Record<number, string[]> = {};

  for (const p of planets) {
    if (!p?.house) continue;

    if (!planetsByHouse[p.house]) {
      planetsByHouse[p.house] = [];
    }

    planetsByHouse[p.house].push(
      PLANET_ABBR[p.name] || p.name.slice(0, 2)
    );
  }

  const housePositions = {
    1: { x: 150, y: 78 },
    2: { x: 68, y: 28 },
    3: { x: 22, y: 72 },
    4: { x: 72, y: 145 },
    5: { x: 22, y: 220 },
    6: { x: 68, y: 262 },
    7: { x: 150, y: 212 },
    8: { x: 228, y: 262 },
    9: { x: 265, y: 220 },
    10: { x: 220, y: 145 },
    11: { x: 265, y: 72 },
    12: { x: 228, y: 28 },
  };

  const signPositions = {
    1: { x: 150, y: 120 },
    2: { x: 102, y: 10 },
    3: { x: 8, y: 100 },
    4: { x: 120, y: 150 },
    5: { x: 8, y: 195 },
    6: { x: 102, y: 280 },
    7: { x: 150, y: 170 },
    8: { x: 198, y: 280 },
    9: { x: 282, y: 195 },
    10: { x: 170, y: 150 },
    11: { x: 282, y: 100 },
    12: { x: 198, y: 10 },
  };

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
        {/* OUTER SQUARE */}
        <Line
          x1="0"
          y1="0"
          x2="300"
          y2="0"
          stroke="#222"
          strokeWidth="1"
        />

        <Line
          x1="300"
          y1="0"
          x2="300"
          y2="300"
          stroke="#222"
          strokeWidth="1"
        />

        <Line
          x1="300"
          y1="300"
          x2="0"
          y2="300"
          stroke="#222"
          strokeWidth="1"
        />

        <Line
          x1="0"
          y1="300"
          x2="0"
          y2="0"
          stroke="#222"
          strokeWidth="1"
        />

        {/* DIAGONALS */}
        <Line
          x1="0"
          y1="0"
          x2="300"
          y2="300"
          stroke="#222"
          strokeWidth="1"
        />

        <Line
          x1="300"
          y1="0"
          x2="0"
          y2="300"
          stroke="#222"
          strokeWidth="1"
        />

        {/* INNER DIAMOND */}
        <Polygon
          points="150,0 300,150 150,300 0,150"
          stroke="#222"
          strokeWidth="1"
          fill="none"
        />
      </Svg>

      {/* TEXT OVERLAY */}
      <View style={styles.overlayContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((house) => {
          const pos =
            housePositions[
            house as keyof typeof housePositions
            ];

          const signPos =
            signPositions[
            house as keyof typeof signPositions
            ];

          const signForHouse =
            ((ascendantSign - 1 + house - 1) % 12) + 1;

          const planetsText = planetsByHouse[house]
            ? planetsByHouse[house].join(', ')
            : '';

          return (
            <React.Fragment key={house}>
              {/* PLANETS */}
              {planetsText ? (
                <PdfText
                  style={{
                    ...styles.planetText,

                    left: pos.x * scale - 20,
                    top: pos.y * scale - 6,
                  }}
                >
                  {planetsText}
                </PdfText>
              ) : null}

              {/* SIGN NUMBER */}
              <PdfText
                style={{
                  ...styles.signText,

                  left: signPos.x * scale - 10,
                  top: signPos.y * scale - 5,
                }}
              >
                {String(signForHouse)}
              </PdfText>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};