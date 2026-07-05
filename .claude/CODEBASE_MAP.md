# Celestial — Codebase Map
_Last updated: 2026-07-05 (astrology-accuracy fixes + classical-text grounding shipped)_

## Identity
Vedic-astrology web app ("Celestial", pkg name `astrology` v0.1.0): landing page, AI astrology
chat, daily horoscopes, and a full PDF kundalī report. TypeScript, **Next.js 16.2.2**
(App Router, React 19.2.4, React Compiler enabled). In-repo astrology engine
(swisseph-wasm) + LLM layer via OpenRouter (Gemini 2.5 Flash).

⚠️ Next.js 16 has breaking changes vs training data — per AGENTS.md, read
`node_modules/next/dist/docs/` before writing Next-specific code.

## Stack & build
- Package manager: **bun** (bun.lock) — npm also works (package-lock.json present).
- Styling: Tailwind CSS v4 (PostCSS), shadcn/radix-ui, motion, three.js (globe hero).
- Lint/format: **Biome** (biome.json), not ESLint/Prettier.
- `postinstall` copies `swisseph.wasm`/`swisseph.data` from node_modules into `public/`.
- Dev server config: `.claude/launch.json` → `celestial-dev`, npm run dev, port 3000.

## Commands
| Action | Command |
|---|---|
| Run dev | `npm run dev` (or `bun dev`) |
| Build | `npm run build` |
| Start prod | `npm start` |
| Lint | `npm run lint` (biome check) |
| Format | `npm run format` (biome format --write) |
| Tests | _none exist_ |

## Bootstrap flow
`src/app/layout.tsx` (root layout, LanguageContext provider) → pages under `src/app/*`.
API routes are Next App Router `route.ts` files under `src/app/api/**`. Auth is a JWT in
an httpOnly cookie (`celestial_token`), set/read via `src/lib/auth.ts`; no middleware —
each route calls `getCurrentUser()` itself.

## Directory layout
- `src/app/` — pages (landing `page.tsx`, `chat/`, `login/`, `profile/`, `horoscope/[sign]/`) + `api/`
- `src/app/components/` — landing-page sections (Hero, Zodiac, Destiny, Footer, globe)
- `src/components/Report/` — PDF report components (`AstrologyReport.tsx`, North/South kundalī charts) rendered server-side via @react-pdf/renderer
- `src/components/ui/` — shadcn-style primitives
- `src/lib/astrology/` — the computation engine: `chart.ts` (orchestrator, exports `CHART_VERSION`=3), `positions-sweph.ts` (swisseph-wasm), `positions.ts` (freeastrologyapi.com fallback + geocoding), `dashas.ts`, `yogas.ts`, `doshas.ts`, `divisional.ts`, `ashtakvarga.ts`, `panchang.ts`, `transits.ts`, `aspects.ts`, `gemstones.ts`, `interpretations.ts` (AI), `constants.ts`, `types.ts`, `classical-grounding.ts` (curated verbatim BPHS/Sārāvalī citations — see below)
- `src/lib/ai/` — chat pipeline: `client.ts` (OpenRouter, MODELS all gemini-2.5-flash), `intent.ts` (classify), `reasoning.ts`, `persona.ts` (streaming response)
- `src/lib/` — `auth.ts` (JWT+bcrypt), `mongodb.ts`, `horoscope.ts` (daily/detailed horoscope gen + cache), `translations.ts` + `LanguageContext.tsx` (i18n EN/HI), `utils.ts`
- `public/` — static assets + copied swisseph wasm/data. **Brand logo: `public/logo.png`** (full zodiac-wheel app-icon; also used for OG image). Header uses it center-cropped to the star.
- **App icon / favicon** — `src/app/icon.png` + `src/app/apple-icon.png` (Next app-router metadata-file convention auto-generates the `<link rel="icon">` / apple-touch tags; the default scaffold `favicon.ico` was removed). Brand source is `branding/logo-prompt.md`.

## Surfaces
| Name | Type | File:Line | Auth | Purpose |
|---|---|---|---|---|
| POST /api/auth/signup | API | src/app/api/auth/signup/route.ts:21 | none | Create user (bcrypt 12), set JWT cookie |
| POST /api/auth/login | API | src/app/api/auth/login/route.ts:4 | none | Verify password, set JWT cookie |
| POST /api/auth/logout | API | src/app/api/auth/logout/route.ts:3 | cookie | Clear cookie |
| GET /api/auth/me | API | src/app/api/auth/me/route.ts:5 | cookie (soft) | Current user or `{user:null}` |
| PUT /api/auth/profile | API | src/app/api/auth/profile/route.ts:40 | cookie | Update profile/birth data |
| POST /api/chat | API | src/app/api/chat/route.ts:55 | cookie **or guest** | AI chat; guests limited to 2 messages (cookie-counted); computes+caches natal chart on user doc |
| GET /api/chat/history | API | src/app/api/chat/history/route.ts:6 | cookie (401) | List chats / one chat by `?chatId=` |
| DELETE /api/chat/history | API | src/app/api/chat/history/route.ts:49 | cookie (401) | Delete a chat |
| GET /api/daily-horoscope | API | src/app/api/daily-horoscope/route.ts:6 | none | 12-sign daily horoscopes (LLM-generated, DB+mem cached, IST-dated) |
| GET /api/report | API | src/app/api/report/route.ts:34 | cookie | Full PDF report: divisionals, sarvāṣṭakavarga, gemstones, transits, AI interpretations → @react-pdf buffer |
| POST /api/payment/create-order | API | src/app/api/payment/create-order/route.ts:31 | cookie | Create Razorpay order (tokens ₹50 / report ₹10) |
| POST /api/payment/verify | API | src/app/api/payment/verify/route.ts:49 | cookie | Verify Razorpay signature; credit tokens / unlock report |
| / | page | src/app/page.tsx | — | Landing (Hero w/ three-globe, zodiac cards) |
| /chat | page | src/app/chat/page.tsx | guest ok | Chat UI (login modal after guest limit) |
| /login | page | src/app/login/page.tsx | — | Login/signup |
| /profile | page | src/app/profile/page.tsx | cookie | Profile + birth details |
| /horoscope/[sign] | page | src/app/horoscope/[sign]/page.tsx | none | Detailed per-sign horoscope |

## Data
MongoDB via `src/lib/mongodb.ts` (`MONGODB_URI`). Collections (no schema/migrations —
shapes are implicit in code): `users` (profile, birth data, cached `natalChart` +
`natalChartComputedAt`, chart invalidated by `CHART_VERSION` in lib/astrology/chart.ts),
`chats` (messages per user), `daily_horoscopes` / `detailed_horoscopes` (per-IST-date
cache of LLM output). Plus in-memory caches in `horoscope.ts`.

## External services
- **LLM provider chain** (`src/lib/ai/client.ts`, added 2026-07-05) — **Groq first, OpenRouter second.**
  `chatComplete()` / `chatCompleteStream()` try each configured provider in order and fall
  through on any thrown error; `isAIConfigured()` replaces the old "is any client truthy"
  check. All 6 call sites (`intent.ts`, `reasoning.ts`, `persona.ts`, `interpretations.ts`,
  `transits.ts`'s `getFutureTransits`, `horoscope.ts`) go through this shared module now —
  `horoscope.ts` previously had its own duplicated OpenRouter-only client, now removed.
  - **Groq** (`GROQ_API_KEY`) — `llama-3.3-70b-versatile` via `https://api.groq.com/openai/v1`.
    Free tier, no paid balance needed. Real constraint: **1,000 requests/day** on this model
    (org-level, not per-key) — will need a paid Groq tier or a smarter chain if usage grows.
  - **OpenRouter** (`OPENROUTER_API_KEY`) — `google/gemini-2.5-flash`, fallback only. Was
    the sole provider before 2026-07-05; hit its credit ceiling (402 on any call requesting
    >~7,843 max_tokens) — this is exactly what broke the horoscope batch call (see below).
  - **DeepSeek** (`DEEPSEEK_API_KEY`) — investigated as a candidate, **not wired in**: the key
    authenticates (200 on `/models`) but real completion calls return `Insufficient Balance`
    — the account needs a top-up at platform.deepseek.com before it's usable. Current model
    IDs are `deepseek-v4-flash`/`deepseek-v4-pro`; the legacy `deepseek-chat`/`deepseek-reasoner`
    aliases (which `horoscope.ts` used to reference, via OpenRouter) deprecate 2026-07-24.
  - `@google/generative-ai` pkg is still installed but unused (would need its own non-OpenAI-
    compatible SDK integration — not attempted; Gemini is currently only reached via OpenRouter).
  - `NVIDIA_API_KEY` also sits in `.env.local`, unexplored, not wired in anywhere.
- **swisseph-wasm is canonical** for positions (`computePositionsSweph`, confirmed via chart.ts:38 — tried first, offline, Moshier ephemeris + Lahiri sidereal). **freeastrologyapi.com** (`ASTROLOGY_API_KEY`, `positions.ts`) is a pure fallback only, used if sweph throws.
- **Geocoding has two independent implementations**: `positions-sweph.ts` calls **Nominatim/OpenStreetMap** directly (free, no key, 1 req/s policy) as its own resolver; `positions.ts` separately calls freeastrologyapi.com's `/geo-details`. Not obviously deduplicated — worth consolidating.
- **MongoDB** (`MONGODB_URI`).
- **Razorpay** (`NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) — payments via `src/lib/razorpay.ts` + `src/lib/billing.ts` (chat-token economy: 20 free tokens, 10/message, ₹50 refill = 100 tokens; report ₹10).
- Env vars: `JWT_SECRET` (⚠️ falls back to hardcoded "celestial-fallback-secret"), `APP_URL`, `NEXT_PUBLIC_SITE_URL`. No `.env.example` in repo.

## Conventions
- Path alias `@/*` → `src/*`. Biome for lint+format (run before commit).
- API errors: `Response.json({ error }, { status })`; try/catch per handler, console.error.
- Auth check per-route via `getCurrentUser()` — there is **no** middleware.ts; new protected routes must check themselves.
- i18n: EN/HI through `translations.ts` + `LanguageContext` (client-side).
- Astrology types centralized in `src/lib/astrology/types.ts`; constants (signs, nakṣatras, lords, ayanāṃśa map) in `constants.ts`.
- Branch style: `fix/...` feature branches; conventional-ish commit messages (`fix:`, `feat:`).

## Where to add a thing
- **New API route**: `src/app/api/<name>/route.ts`, export HTTP-method functions; call `getCurrentUser()` if protected.
- **New astrology computation**: module in `src/lib/astrology/`, wire into `chart.ts` orchestrator (bump `CHART_VERSION` if it changes the cached `NatalChart` shape).
- **New report section**: `src/components/Report/AstrologyReport.tsx` (react-pdf primitives only — no DOM).
- **New landing section**: `src/app/components/<Name>/`.
- **New LLM call site**: use `chatComplete()` / `chatCompleteStream()` from `src/lib/ai/client.ts` — never construct an `OpenAI` client directly in a new file (that's exactly the duplication `horoscope.ts` had until 2026-07-05). To add/reorder a provider in the fallback chain, edit `providerChain()` in `client.ts` only.

## Classical-text grounding (added 2026-07-05)
`classical-grounding.ts` holds curated, verbatim-cited excerpts from BPHS/Sārāvalī
(source: `../vedic-knowledge-base/texts/*.txt`, one level up from this repo) — the
functional benefic/malefic/yogakaraka table for all 12 ascendants (BPHS ch.34), yoga
citations, and a Saturn-Venus antardasha note. `buildChartDigest()` in `chart.ts`
assembles these into `ChartDigest.classicalGrounding` (a `string[]`), which is now fed
into **every** LLM prompt site: `persona.ts` (live chat), `reasoning.ts`, `interpretations.ts`
(PDF report), and `transits.ts`'s `getFutureTransits`. Each prompt is instructed to cite
these verbatim and never fabricate a citation. `yogas.ts` also attaches a `citation` field
directly onto `YogaResult` when one exists. Verified live: a real chat response cited
`[BPHS 34.41-42]` correctly for an Aquarius-ascendant chart (Mars malefic, Venus yogakāraka),
matching the source exactly.

Extending this: to add more classical grounding (e.g. more antardasha combinations, more
yoga citations, house-lord-in-house effects from BPHS ch.24), extract the verse directly
from the `.txt` sources in the knowledge base (don't paraphrase — citations are only
meaningful if verifiable) and add to the relevant table/record in `classical-grounding.ts`.

## Risks & gotchas
- **JWT_SECRET fallback**: auth.ts:5 uses a hardcoded fallback secret if env missing — fine locally, dangerous in prod.
- **Cached natal charts + CHART_VERSION**: `chat/route.ts` and `report/route.ts` now correctly
  compare `dbUser.natalChart?.version === CHART_VERSION` (fixed 2026-07-05 — it previously only
  checked truthiness, so bumping `CHART_VERSION` never actually invalidated old cached charts;
  verified live that a forced stale `version:2` chart gets recomputed to 3 on next chat/report
  call). **Any future change to chart computation logic MUST bump `CHART_VERSION`** in `chart.ts`
  or existing users silently keep their old chart forever.
- **swisseph-wasm files** must exist in `public/` (postinstall copies them) — a fresh clone without install → chart computation breaks.
- **Next 16 / React 19 / Tailwind 4 / Biome**: newer than most training data; check `node_modules/next/dist/docs/` (AGENTS.md rule).
- **No tests, no middleware, no .env.example**; `test.pdf` at repo root is a stray artifact.
- Guest chat limit is enforced via a client cookie count — trivially bypassable.
- **OpenRouter account is low on credits** (402 on any call requesting >~7,843 max_tokens) —
  no longer a live outage since Groq is now tried first (2026-07-05), but OpenRouter is still
  the only fallback, so if Groq's 1,000 req/day cap is hit AND OpenRouter is still low on
  credits, everything breaks with no third option. Topping up OpenRouter or DeepSeek (see
  External services) removes this single point of failure.
- **Groq free-tier ceiling**: `llama-3.3-70b-versatile` is capped at 1,000 requests/day,
  org-wide (not per-key) — each chat message costs 3 requests (intent+reasoning+persona), so
  roughly ~300 conversations/day before Groq itself starts failing over to OpenRouter.

## Open questions
- Deployment target (Vercel?) and where env vars live.
- `@google/generative-ai` dependency appears unused (OpenRouter wraps Gemini) — removable?
- 2026-07-05 audit + fix pass: fixed the Vimshottari antardasha math for the birth mahadasha,
  the Panchang Vara timezone bug, the Ashtakavarga Saturn bindu-table (was 38, now correctly
  39/337 total), the Kemadruma cancellation logic, renamed "Shani-Chandra Affliction" → the
  correct classical "Vish Yoga" (and dropped its incorrectly-invented opposition case), added
  functional-malefic cautions to gemstone recommendations, wired Ashtakavarga bindus into Sade
  Sati severity text, and fixed the CHART_VERSION cache-invalidation bug above. All verified
  live against the running dev server with real signups/chat/report generation, not just unit
  logic. Not yet fixed / still open: stub Avakahada fields (`nameAlphabet` always "A",
  `grahaMaitri` always "Neutral", `paya` methodology questionable) — flagged but out of scope
  for this pass; Sārāvalī Vol II (planets-in-houses) and Bṛhat Jātaka are not yet in the
  knowledge base if deeper grounding is wanted later.
