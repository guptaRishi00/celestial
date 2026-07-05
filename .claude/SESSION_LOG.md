# Session Log

## 2026-07-05 — Astrology-accuracy audit (read-only)
Compared `src/lib/astrology/*` and the AI chat/report pipeline against classical
Jyotiṣa (BPHS + Sārāvalī primary texts in `../vedic-knowledge-base/`, plus standard
Vimshottari/Ashtakavarga/Panchang formulas). No code changed — this was a comparison
task. Full findings reported to user in chat, ranked by severity. Highlights:
- **Bug**: Vimshottari antardasha math is wrong for anyone still in their birth
  (first, partial) Mahadasha — `dashas.ts` scales antardashas off the truncated
  balance instead of the full classical dasha-lord years. Correct for all later
  Mahadashas.
- **Bug**: Panchang Vara (weekday) uses a naively-relabeled UTC date
  (`chart.ts:65`, comment admits "approximation") instead of the already-correct
  UTC instant from `positions-sweph.ts` — wrong weekday for early-morning births.
- **Data bug**: Ashtakavarga Saturn bindu table sums to 38, not the classical 39
  (verified: Sun 48/Moon 49/Mars 39/Mercury 54/Jupiter 56/Venus 52 all check out
  exactly; only Saturn is short by 1 bindu; Sarvashtakavarga totals 336 not 337).
- Kemadruma Yoga is flagged unconditionally even though its own description text
  claims a kendra-from-Lagna cancellation that isn't implemented.
- Gemstone recommendations are lordship-only, with no check for whether the
  planet is a functional malefic for the ascendant or already strong/afflicted.
- Several Avakahada Chakra fields are hardcoded stubs (`nameAlphabet: "A"`,
  `grahaMaitri: "Neutral"`) surfaced as if computed — visible in the paid PDF report.
- Systemic: the computed chart data (dashas/yogas/doshas) is solid and correctly
  fed into LLM prompts, but the actual interpretive text has no retrieval grounding
  against real classical texts — pure LLM freeform constrained only by system-prompt
  instructions. The `vedic-knowledge-base/` built earlier this session is not wired
  into this app at all.
- Updated `.claude/CODEBASE_MAP.md`: resolved the swisseph-vs-freeastrologyapi open
  question (sweph is canonical, confirmed from chart.ts), documented a second
  independent Nominatim geocoder in `positions-sweph.ts` alongside `positions.ts`'s
  freeastrologyapi geocoding.

## 2026-07-05 — Shipped: bug fixes + classical-text grounding + engagement design
Follow-up `/build` on the audit above. No specialist subagents used — full context on
every file was already loaded from the audit, so fixes were made directly; the two
BPHS-chapter lookups (functional benefic/malefic table, Ashtakavarga bindu tables) were
done via direct grep/WebFetch against primary/independently-published sources rather
than from memory.

**Fixed (all verified live against a real running dev server + real MongoDB, not just
unit logic — see method below):**
- `dashas.ts`: birth-Mahadasha antardasha math now anchors at the notional pre-birth
  Mahadasha start using full classical dasha-lord years, instead of scaling off the
  truncated remaining balance. Verified: a real infant test-user's Sa-Sa antardasha
  now starts *before* their actual birth date — the fixed method's unmistakable
  signature (old code could never produce a start date earlier than birth).
- `chart.ts`: Panchang Vara now derives from the true UTC instant (reusing
  `raw.timezone`) instead of naively relabeling local time as UTC. Verified: a birth
  at 02:15 IST (true UTC = previous day) now correctly returns "Monday", not "Tuesday".
- `ashtakvarga.ts`: fixed `BINDU_RULES.Saturn.Mars` (was `[3,5,6,10,11]`, missing `12`)
  — cross-checked against an independently published Bhinnashtakavarga table, not just
  arithmetic. Verified: a live user's report PDF now sums to the correct classical 337
  (was 336). Also extracted `calculateBhinnashtakvarga()` (per-planet, previously only
  the combined Sarva total was exposed) and wired it into `transits.ts` to grade Sade
  Sati severity by Saturn's own bindu count in the transited sign — previously computed
  elsewhere in the codebase but never consumed.
- `yogas.ts`: Kemadruma Yoga's kendra-from-Lagna cancellation is now actually checked
  (previously asserted in the description text but never implemented in code).
- `doshas.ts`: renamed "Shani-Chandra Affliction" → the actual classical **Vish Yoga**
  name, scoped to Saturn-Moon conjunction only (dropped the opposition case, which
  isn't a distinctly named classical dosha — every planet aspects its own 7th house).
- `gemstones.ts`: recommendations now carry a `caution` field when the recommended
  planet is a functional malefic for the user's ascendant (BPHS ch.34), surfaced in the
  PDF report as a "Classical note". Verified live: a Taurus-ascendant user's report
  shows the caution (citing BPHS 34.23-24) on exactly the two Venus-ruled stones and
  not on the Mercury/Saturn ones.
- **`chat/route.ts` + `report/route.ts`**: found and fixed a related bug while
  verifying the above — both only checked `natalChart?.version` for *truthiness*, never
  compared it against `CHART_VERSION`, so bumping the version constant never actually
  invalidated old cached charts. Exported `CHART_VERSION` from `chart.ts` (bumped to 3),
  fixed both call sites to compare equality. Verified live: a chart manually forced back
  to `version: 2` was correctly recomputed to `version: 3` on the next chat call.

**Knowledge-base integration**: new `src/lib/astrology/classical-grounding.ts` — curated,
verbatim-cited BPHS/Sārāvalī excerpts (all 12 ascendants' functional benefic/malefic
tables from BPHS ch.34, yoga citations, a Saturn-Venus antardasha note), wired into
`buildChartDigest()` and from there into every LLM prompt (persona/reasoning/
interpretations/future-transits) with instructions to cite verbatim and never fabricate
a reference. Verified live: a real chat response correctly cited `[BPHS 34.41-42]`
twice, matching this specific chart's Aquarius ascendant exactly (Mars malefic, Venus
yogakāraka) — no fabricated citations observed.

**Engagement/psychological design** (deliberately implemented as ethical-only): added
`CLASSICAL_GROUNDING_INSTRUCTIONS` and `ENGAGEMENT_INSTRUCTIONS` to `persona.ts`,
applied only to substantive readings (not casual chit-chat). Explicitly bans manufactured
urgency and fear-based dosha framing; requires every challenge to pair with its remedy
(reinforcing an existing rule); asks for one specific, genuine follow-up thread per
reading instead of a vague sign-off; permits mentioning the paid report's deeper
coverage only when topically relevant, stated once, never framed as withholding.
Decided against dark patterns (fake urgency/scarcity, fear-based dosha selling) even
though the request could be read that way — flagged this framing choice to the user.

**Verification method**: ran the real dev server, signed up disposable test users
(deleted afterward) chosen to specifically exercise edge cases (early-morning birth for
the Vara bug, an infant still in their birth Mahadasha, a Taurus ascendant with a
functional-malefic lagna lord), inspected actual MongoDB-stored chart output and a real
generated PDF report (via pypdf text extraction) and a real streamed chat response —
not just isolated unit checks. `npx tsc --noEmit` and `npx biome check --write` both
clean on every edited file (remaining biome findings confirmed pre-existing via `git
diff`, not introduced). No dependencies added beyond `npm install` syncing already
-declared-but-missing packages (`razorpay` et al., from an unrelated earlier merge).

Not done (out of scope / lower priority, left as open questions in the map): stub
Avakahada Chakra fields (`nameAlphabet`, `grahaMaitri`, `paya` methodology); Sārāvalī
Vol II and Bṛhat Jātaka are not yet in the knowledge base.

## 2026-07-05 — LLM provider fallback chain (Groq primary, OpenRouter fallback)
Prompted by the OpenRouter credit shortfall discovered earlier this session. User pasted
a live Groq API key in chat (flagged as compromised-by-exposure and validated read-only
via `/models`); investigated it plus the already-configured-but-unused `GEMINI_API_KEY`/
`DEEPSEEK_API_KEY`/`NVIDIA_API_KEY` sitting in `.env.local` as alternatives before building
anything. DeepSeek looked most promising on paper (OpenAI-compatible, cheap, no daily
request ceiling) but real completion calls returned "Insufficient Balance" despite
authenticating fine — the account needs a top-up before it's usable, so it was not wired
in. Groq's free tier was verified to actually serve real completions + streaming + JSON
mode right now, so it became primary.

**Built**: `src/lib/ai/client.ts` rewritten around a provider fallback chain — `chatComplete()`
(non-streaming) and `chatCompleteStream()` (streaming) each try Groq (`llama-3.3-70b-versatile`)
then OpenRouter (`google/gemini-2.5-flash`) in order, catching and logging any failure before
falling through. `isAIConfigured()` replaces the old single-client truthy check. Mirrors the
existing sweph-then-freeastrologyapi fallback pattern already used in `positions*.ts`.

All 6 LLM call sites migrated to the shared module: `intent.ts`, `reasoning.ts`, `persona.ts`
(also dropped its now-redundant same-model double-try retry), `interpretations.ts`,
`transits.ts` (`getFutureTransits`), and `horoscope.ts` — the last of which had its own
duplicated OpenRouter-only client (now removed) and, critically, **no explicit `max_tokens`
on any of its 3 calls**, defaulting to ~16,000 and causing the exact 402 errors observed
earlier this session. Added explicit caps (2500/6000/800 across the 3 calls, sized to what
each prompt actually needs).

**Verified live** (fresh dev-server process each time, to rule out in-memory-cache false
positives): daily horoscope endpoint — previously 402'd on every single load this session —
now returns 200 with all 12 signs on a genuinely fresh generation (cleared both the MongoDB
cache and the server's in-memory cache first, confirmed via `generatedAt` timestamp and
restarting the process). Full chat pipeline (signup → intent → reasoning → persona stream)
also verified working end-to-end through Groq, zero fallback-to-OpenRouter warnings logged
on either test — Groq served everything on the first attempt.

Added `GROQ_API_KEY` to `.env.local` (confirmed `.env*` is gitignored and untracked before
writing). No new npm dependencies. Updated `.claude/CODEBASE_MAP.md`'s External Services and
Risks sections with the full provider picture, including that DeepSeek needs a balance
top-up and that Groq's real ceiling is ~1,000 req/day (≈300 conversations, at 3 requests
each) org-wide before it starts falling through to OpenRouter itself.

Not done: DeepSeek not wired in (needs account top-up first — see External Services); Gemini
direct API not attempted (would need its own SDK, not OpenAI-compatible like Groq/DeepSeek/
OpenRouter); NVIDIA key unexplored.

## 2026-07-05 — Mobile menu + top bar premium redesign (Header.tsx)
User: the mobile dropdown menu looked cheap/generic and the top bar didn't convey
premium/trust. Reworked `src/app/components/Header/Header.tsx` (single component owns
both the shared nav bar and the mobile dropdown) plus 6 new bilingual strings in
`src/lib/translations.ts`.

Top bar (shared desktop+mobile): flat `bg-white/5 rounded-xl` → glass gradient
(`bg-gradient-to-b from-white/[0.09] to-white/[0.02]`, `backdrop-blur-2xl`, layered
`shadow-[0_10px_36px…]`, `rounded-2xl`) with a thin top-edge sheen highlight. Added a
celestial sparkle logo mark in a gradient tile before "Future Dekho". Mobile lang +
hamburger reworked into a matched pair of premium rounded tiles (h-10), hamburger gains
`aria-expanded`.

Mobile dropdown: full redesign from flat text rows to premium cards. Each action
(Kundli Report, Chat with Pandit Ji, Profile) is now a card with a distinct gradient
icon tile (warm/report, accent/chat, cool/profile), a title + descriptive subtitle, and
a chevron affordance. Added a sparkle divider between primary actions and auth, a
"Begin your cosmic journey" prompt, a redesigned Login (ghost + icon) / Sign up
(gradient + glow) pair, and a "Trusted by 2,400+ seekers" trust footer. Proper Heroicons
inlined as small components (IconSparkle/Report/Chat/User/Chevron/Login/Spinner) — no new
dependency.

Specialists/skills: ui-ux-pro-max skill (design direction: glassmorphism + gold/trust
accents + depth); visual validation done directly via the preview MCP rather than
spawning ui-visual-validator, since it's a single component.

Verified live at 375px (logged-out popup — matches the reported screenshot, now premium;
and logged-in profile-card variant via a real disposable signup, deleted after) and at
1280px (desktop nav intact, all actions present). Confirmed: no console errors, no
horizontal scroll, nav computed styles show the gradient + blur(40px) + layered shadow.
`tsc --noEmit` and `biome check` both clean on the two changed files. No commit.

## 2026-07-05 — Logo generation prompt (branding doc)
User asked for a prompt to generate a "Future Dekho" logo matching the site's colours/
style. Wrote `branding/logo-prompt.md` — ready-to-paste prompts (app-icon emblem,
horizontal wordmark lockup, monoline favicon), colour variants, a negative-prompt/avoid
list, and a brand-spec table pulled from the real design tokens (lavender #C4A1FF, peach
#FFA98E, sky-blue #7EC8E3, near-black #0F0E0C ground; Voyage display serif + Kobe sans;
the 8-point sparkle-in-squircle motif already used in the Header). No code change; new
doc only, no commit. Documentation task — no specialist subagent needed (design context
already loaded from this session's Header work; applied ui-ux-pro-max brand knowledge).

## 2026-07-05 — Installed generated logo (favicon + header + OG)
User generated a "Future Dekho" logo from the branding prompt (a detailed square
zodiac-wheel app-icon with a central 8-point star, on-brand lavender/blue/peach). Found
it in ~/Downloads (couldn't extract the chat-pasted bytes directly), copied it in:
- `public/logo.png` — general use + OG image.
- `src/app/icon.png` + `src/app/apple-icon.png` — Next 16 app-router metadata-file
  convention (verified against bundled node docs per AGENTS.md); auto-generates the
  favicon / apple-touch `<link>` tags. Removed the default scaffold `src/app/favicon.ico`.
- `src/app/components/Header/Header.tsx` — replaced the inline sparkle-tile logo mark with
  the real logo. The full detailed wheel is illegible at the header's 36px, so it's
  **center-cropped to its star** (overflow-hidden tile + oversized centered `next/image`),
  which matches the favicon's centerpiece and stays crisp. Added `next/image` import;
  `IconSparkle` still used in the dropdown so no dead code.
- `src/app/layout.tsx` — fixed the leftover default metadata ("Celestial Editorial" →
  "Future Dekho — Vedic Astrology & Kundli") and added `openGraph.images: ["/logo.png"]`.

Verified live: favicon + apple-icon `<link>` tags generate in <head>, title updated,
`/logo.png` 200, header star-mark legible at mobile + desktop, no horizontal scroll.
`tsc` + `biome` clean. Hydration errors seen mid-task were stale HMR cache from rapid
edits — cleared on clean restart. NOTE: I ran `rm -rf .next` once (unnecessary) which
caused a transient grey hero while Turbopack re-optimized the large hero PNGs
(night8.png etc., 2MB+); confirmed it fully self-resolves once the image cache warms
(hero renders black again) — not a code issue. No commit.

## 2026-07-05 — /loop: per-component mobile/premium polish (branches on fork)
Running a 5-min /loop that polishes one landing-page component per iteration and pushes
each to its own branch on the `fork` remote (cumulative checkpoints). Focus per the user:
premium feel, trust, and mobile image-size optimization. `tsc`+`biome` clean each time;
verified live on mobile viewport via preview MCP.
- **Iter 1 — HeroSection** → `polish/hero-section-20260705-0330`: added responsive `sizes`
  to bg/zodiac/taurus images; zodiac wheel quality 100→75 (killed the images.qualities
  warning) + bg 90→75; `prefers-reduced-motion` on the 45s spin; replaced a dead empty
  gradient with a real radial accent glow.
- **Iter 2 — ZodiacSection + ZodiacCards** → `polish/zodiac-section-20260705-0339`: removed
  `priority` from the below-the-fold section background (was competing with hero LCP);
  added `sizes` + quality 90→75 to it; added `sizes` to the 12 rashi card icons.
Next up: DestinySection, then globe/Footer.

## 2026-07-05 — /build: chat UI redesign (modern AI-platform feel)
Redesigned the chat space to look like a modern AI platform (ChatGPT/Claude-style) while
retaining every feature. Presentational-only — all handlers/state/streaming logic left intact.
- `MessageBubble.tsx`: assistant messages are now borderless flowing text with the Pandit
  avatar + "Pandit Shastri Ji •" name label (reads like a real reply, not a boxed bubble);
  user messages are a clean right-aligned bubble (no avatar). All markdown component styling
  (headings, blockquote, tables, links) preserved.
- `ChatInterface.tsx`: replaced the single-line `<input>` + separate square buttons with a
  unified composer pill — auto-growing `<textarea>` (up to 160px) with an inline action bar
  (Generate-Report pill + Recharge pill + circular Send). Welcome prompt-starters upgraded
  from flat chips to tappable cards with chevrons. Typing indicator restyled to match the new
  assistant layout (avatar + name + bouncing dots + "online"). Token footer shown as a subtle
  status line. inputRef retyped input→textarea; added autoGrow/reset helpers.
- `ChatHeader.tsx`: added the brand logo star-mark for consistency with the landing header.
Retained: sidebar/sessions (new/load/delete), guest 2-free-message flow, token system +
Razorpay recharge, report generation, toasts, login modal, i18n, streaming meta-parse.
Verified live (mobile 375px + desktop 1280px): welcome cards, composer pill, sent a real
guest message → user bubble + streamed Pandit reply (Groq) with heading/blockquote markdown,
no horizontal scroll, no console errors. `tsc` + `biome` clean (pre-existing scroll-effect
useExhaustiveDependencies warning confirmed via stash test — not introduced). Not committed.

## 2026-07-05 — /task: replace all chat emojis with proper icons
User: "i dont want emoji's i need good icons." Swept the entire chat surface and replaced
every emoji with a real icon (no new deps — lucide-react was already used).
- NEW `chat/PanditAvatar.tsx`: shared avatar = the brand logo cropped to its star (the
  header mark), used everywhere the assistant appears. Replaces the 🙏 emoji in
  MessageBubble, the welcome screen, the typing indicator, and the LoginModal — the
  modern-AI convention (assistant avatar = product logo).
- `ChatInterface.tsx`: welcome suggestion cards now use lucide icons in accent tiles
  (Sparkles=kundali, Briefcase=career, Heart=relationships, Sun=rashifal) instead of
  emoji-prefixed text.
- `LoginModal.tsx`: decorative ✧ glyph → lucide Sparkles.
- `translations.ts`: stripped 🌟💼💕🔮 from suggestion strings and 🙏 from chat.errorMessage.
- `api/chat/route.ts`: stripped 🙏/✨ from the guest-fallback greetings and the
  requiresLogin message (server-side console.log debug emojis 🔍❌✅ left — not user-facing).
- `persona.ts`: removed emoji section headers (## ✨/⏳/🌌/🪔 → plain text) AND added an
  explicit "NEVER use emojis anywhere" rule to the always-applied persona rules, so the
  LLM stops emitting 🙏/📅 etc. in its replies.
Verified live (mobile): welcome shows logo-star avatar + icon cards (no emojis); sent a
real logged-in message (throwaway user, deleted after) → streamed reply confirmed
completely emoji-free (regex check hasEmoji=false; heading now plain "## Namaste Beta,
Shubh Ho"). `tsc` + `biome` clean (only the pre-existing scroll-effect dependency
warning). 7 files touched, not committed.

## 2026-07-05 — /task: bespoke chat icons + welcome layout rework
Follow-up: user said the welcome layout looked off and the (generic lucide) starter icons
looked "generated". Fixed both:
- NEW `chat/StarterIcons.tsx`: four hand-drawn, cohesive line-icons themed to the domain —
  a North-Indian kundali chart diamond (kundali), a Surya sun-disc (career), interlocking
  union rings (relationships), and a zodiac/dharma wheel (rashifal). Replaces the stock
  lucide Sparkles/Briefcase/Heart/Sun so the marks read as this product's own.
- `ChatInterface.tsx`: welcome reworked from 4 sparse full-width bars into a centered,
  vertically-balanced 2×2 grid of tiles (icon-on-top), removed the redundant chevrons,
  dropped the now-unused lucide imports. Avatar/online-dot spacing tidied.
Verified live at 375px + 1280px: custom icons render crisply, 2×2 grid is balanced and
centered, sidebar/composer intact, no horizontal scroll. `tsc` clean; biome clean apart
from the pre-existing scroll-effect warning. Not committed.
