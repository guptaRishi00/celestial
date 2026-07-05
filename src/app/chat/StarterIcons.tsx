/**
 * Bespoke line-icons for the chat prompt-starters — hand-drawn, cohesive celestial
 * style (thin stroke, 24×24). Deliberately domain-specific (a real kundali chart, a
 * Surya disc, a union of two rings, a zodiac wheel) so they read as this product's own
 * marks rather than generic icon-library glyphs.
 */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** North-Indian birth chart (kundali) — square with diagonals + midpoint diamond. */
export function KundaliIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
      <path d="M3.5 3.5 20.5 20.5M20.5 3.5 3.5 20.5" />
      <path d="M12 3.5 20.5 12 12 20.5 3.5 12Z" />
    </svg>
  );
}

/** Surya (Sun) — governs career, status, the soul. Disc + eight rays. */
export function SuryaIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </svg>
  );
}

/** Union of two rings — partnership, marriage, relationships. */
export function UnionIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </svg>
  );
}

/** Zodiac / dharma wheel — the daily turning of the rashis (rashifal). */
export function ZodiacWheelIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 3v3.2M12 17.8V21M3 12h3.2M17.8 12H21M5.6 5.6l2.3 2.3M16.1 16.1l2.3 2.3M18.4 5.6l-2.3 2.3M7.9 16.1l-2.3 2.3" />
    </svg>
  );
}
