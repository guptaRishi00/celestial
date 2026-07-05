# Future Dekho — Logo Generation Prompt

Ready-to-paste prompts for an AI image/logo generator (Midjourney, DALL·E 3, Adobe
Firefly, Ideogram, etc.), derived from the live site's design tokens so the logo matches
the product. Brand spec is at the bottom — edit it there and the prompts stay consistent.

> **Name meaning:** "Future Dekho" = *"See the future"* (Hindi). Product = a premium
> Vedic astrology (Jyotiṣa) app: birth charts, Pandit-Ji chat, kundali reports. Tone:
> spiritual heritage meets modern, trustworthy, calm-premium — **not** cartoonish,
> mystical-cliché, or fortune-teller kitsch.

---

## 1. Primary prompt — app icon / emblem (square)

```
A premium app-icon logo for "Future Dekho", a modern Vedic astrology app. A minimalist
celestial emblem: a refined 8-pointed guiding star (sparkle) sitting at the centre of a
delicate thin-line constellation / zodiac ring, rendered as elegant fine line-art. The
star has a soft luminous glow. Set inside a squircle (rounded-square) tile with a subtle
top-lit glass finish. Deep cosmic near-black background (#0F0E0C) scattered with faint
tiny stars. The mark uses a smooth gradient from soft lavender (#C4A1FF) into sky blue
(#7EC8E3) with a small warm peach (#FFA98E) accent highlight. Sophisticated, symmetrical,
geometric, balanced negative space. Flat vector, clean edges, high contrast, luxury
fintech-grade polish, spiritual-modern. Centered, generous padding. --style raw
```

## 2. Horizontal wordmark lockup

```
A horizontal logo lockup for "Future Dekho". Left: the celestial 8-pointed star emblem
inside a small rounded-square gradient tile (lavender #C4A1FF to sky blue #7EC8E3, faint
peach #FFA98E glint), soft glow. Right: the words "Future Dekho" set in an elegant
high-contrast display serif with graceful thick/thin strokes and a refined, slightly
distinctive character (think a modern Didone / editorial serif), in soft lavender
(#C4A1FF) on a deep near-black (#0F0E0C) starfield background. Balanced kerning, premium,
calm, trustworthy, spiritual-modern. Vector, crisp, generous whitespace.
```

## 3. Icon-only, monoline (for favicon / small sizes / stamp)

```
A single-weight monoline icon of an 8-pointed celestial guiding star merged with a thin
crescent and three tiny orbiting dots, inside a clean circular badge. Pure line-art, even
stroke width, no fill, no gradient. Works at 16px. Soft lavender (#C4A1FF) line on
transparent / near-black. Minimal, geometric, symmetrical, sacred-geometry feel without
clutter.
```

## 4. Colour variants to also request (run each on its own)

- **Reverse / light**: same emblem in near-black `#0F0E0C` line-art on an off-white
  `#FFFBFF` background (for light surfaces, print, invoices).
- **Monochrome**: single-colour lavender `#C4A1FF`, and a pure-white version, both on
  transparent — for stamps, watermarks, the PDF kundali report header.
- **Gold accent option**: swap the peach glint for a restrained warm gold `#E8C98A`
  micro-highlight if a more "trust/heritage" read is wanted (test A/B against peach).

## 5. Negative prompt / avoid list

```
no cartoon, no mascot, no human face, no crystal ball, no tarot cards, no zodiac animal
illustrations, no rainbow, no neon, no heavy 3D bevel, no drop-shadow clutter, no
photorealism, no stock clip-art, no cheesy sparkle overload, no text errors / gibberish
letters, no busy background, not skewed, not low-contrast.
```

---

## Brand spec (source of truth — from the live site tokens)

| Element | Value | Where it's used |
|---|---|---|
| **Primary accent** | Lavender `#C4A1FF` (`--color-hero-accent`) | Wordmark, primary star gradient |
| **Secondary warm** | Peach `#FFA98E` (`--color-hero-warm`) | Small accent glint |
| **Secondary cool** | Sky blue `#7EC8E3` (`--color-hero-cool`) | Gradient blend target |
| **Ground (dark)** | Near-black `#0F0E0C` (`--color-inverse-surface`) | Primary background |
| **Ground (light)** | Off-white `#FFFBFF` (`--color-surface`) | Light lockup |
| **Display type** | "Voyage" — elegant high-contrast serif | The existing "Future Dekho" wordmark; match its Didone-like feel |
| **UI type** | "Kobe" — geometric sans | Taglines / secondary text if any |
| **Core motif** | 8-pointed sparkle / guiding star in a gradient squircle tile | Already the site's logo mark (Header) |
| **Supporting motifs** | Thin-line zodiac ring, constellations, faint starfield, fine white line-art engraving style | Hero background & sections |

**Design principles:** minimalist over ornate; symmetrical & geometric; luminous soft
glow not hard neon; premium/trust (fintech-grade cleanliness) fused with Vedic-celestial
warmth; must read at 16px (favicon) and on both dark and light grounds.

**Typography note:** if the generator renders the wordmark text, treat it as a guide only —
final production wordmark should be set in the actual **Voyage** font
(`public/fonts/voyage/`) for pixel-accurate brand match, with the AI output used for the
emblem/mark.
