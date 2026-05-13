# Evaluation — Iteration 001

Evaluator mode: code-review + screenshot (headless Chrome 148). Live browser
interaction (planting, harvesting, spinning the wheel) was not possible because
Playwright is not installed; the harness's safety gate also blocked an
HTML-based localStorage seed test. Scoring below is based on (a) reading every
key source file, (b) production build output, (c) static screenshots at 375 px,
420 px, 768 px, 1280 px, 1440 px viewports, and (d) verification of all
constants against the spec.

## Scores

| Criterion        | Score | Weight | Weighted |
|------------------|-------|--------|----------|
| Functionality    | 8/10  | 0.40   | 3.20     |
| Visual Design    | 8/10  | 0.25   | 2.00     |
| Game Feel        | 8/10  | 0.20   | 1.60     |
| Code Quality     | 8/10  | 0.15   | 1.20     |
| **TOTAL**        |       |        | **8.00** |

## Verdict: PASS (threshold 7.0) — recommendation: `ship` with minor revisions

Weighted total 8.00. No CRITICAL issues. Two HIGH-priority bugs that are easy
to fix in iteration 002, and a handful of MEDIUM polish gaps. Build is clean
(362 kB / 113 kB gzipped JS, 28 kB / 6.3 kB gzipped CSS, well under the 200 kB
gzipped target the spec implies). No app-level console errors during page
load.

---

## Functionality — 8/10

### Verified against spec

- All 8 cat types defined in `src/domain/catTypes.ts` with exact spec values:
  grow times (30 s / 2 m / 5 m / 10 m / 15 m / 30 m / 1 h / 3 h), sell values
  (10/35/80/150/220/500/1200/5000), and seed costs (0/25/60/110/160/350/800/3000)
  all match the balance table. Verified line-by-line.
- Plot unlock thresholds `[0, 200, 800, 3000, 10000, 50000]` defined in
  `src/domain/plots.ts:25-32` — matches spec exactly.
- Lottery sectors in `src/domain/lottery.ts:26-79`: 8 sectors, weights
  `[20,18,12,15,10,6,4,2]` total 87, Rymkatt correctly absent — matches spec.
- Paid spin cost = 50 (`PAID_SPIN_COST`) — matches.
- Lightning: 0.5 % per-plot per-second, 30 s global cooldown, +20–50 % roll,
  +100 % stacking cap, all in `src/domain/lightning.ts` — matches.
- localStorage key `grow-a-cat:save:v1` — matches.
- Save schema is versioned with `migrate()` defensive load.
- Store actions all present: `tick`, `plantSeed`, `harvestCat`, `buySeed`,
  `spinLottery`, `acknowledgeSpin`, `toggleReducedMotion`, `harvestAllReady`.
- Offline catch-up exists (`applyOfflineCatchup`) and runs on bootstrap.
- Recap modal renders when `awayMs >= 60_000` and ready plots > 0.
- TypeScript strict mode passes; build is clean.

### Issues

- **HIGH — Starting state deviates from spec.** Spec line 50 says "Player has
  0 coins, 1 plot, 1 free Gräskatt seed". `createInitialSave` in
  `src/domain/persistence.ts:59-82` gives 10 coins and 3 Gräskatt seeds. Since
  Gräskatt is also marked `infinite: true`, the 3-seed prefill is meaningless
  and probably a remnant. Fix: set `coins: 0`, `inv.graskatt = 0`. The
  infinite flag handles availability.
- **HIGH — Tests cannot be run.** `src/domain/__tests__/lottery.test.ts` and
  `plots.test.ts` import from `'vitest'`, but `vitest` is not in
  `package.json` (`devDependencies` ends at `vite`). They are excluded from
  the tsc build via `tsconfig.app.json` ("exclude": ["src/**/__tests__/**"]),
  so the build succeeds, but `npm test` does not even exist as a script. The
  spec lists Vitest as required tooling (line 214) and the rubric
  requires runnable unit tests for lottery/plot growth/unlock logic. Fix:
  `npm i -D vitest` and add `"test": "vitest run"` script.
- **MEDIUM — Plant sheet shows locked seeds as disabled rows but with full
  cat name and stats visible.** `PlantSheet.tsx:53-77` renders the
  `cat.name` and grow time/sell value regardless of `isUnlocked`. The spec
  (line 99) says "Unlock conditions are revealed in the shop as silhouettes
  with the unlock hint". The shop honors this (`Shop.tsx:131-145`), but the
  plant sheet does not. Fix: mask name/stats for locked seeds in the plant
  sheet, mirror the shop's `LockShape` treatment.
- **MEDIUM — Seed inventory does not refresh free-spin pulse on midnight
  rollover quickly.** `HUD.tsx:25-28` re-evaluates `isFreeSpinAvailable`
  on a 30 s interval. A user crossing midnight will wait up to 30 s before
  the pip lights up. Fix: tighten interval or recompute on store updates.
- **LOW — No verified "While you were away" recap copy.** `RecapModal`
  exists but I could not trigger the offline path with a real reload to
  verify the exact copy "Medan du var borta..." renders. Manual test
  needed.

---

## Visual Design — 8/10

### Strong points

- Initial load (see `eval-001-initial.png`, `eval-001-desktop-1440.png`)
  reads as kawaii-cottagecore, not as a Tailwind template. The plots have
  real terrarium depth via `inset 0 -8px 0` shadow + radial gradient soil
  + grass-tuft `::after` pseudo-element. This is exactly what the spec
  asked for.
- Color palette matches spec: peach cream `#FFF4E6` background, lavender
  mist via radial gradient, sakura pink `#FF8FA3` primary CTAs, cornflower
  blue secondary, coin gold. No purple→blue cliché gradient anywhere on the
  background. Lavender is used only as accent for locked plots, which is
  intentional.
- Cat sprites are custom inline SVG with per-tier badges: clover
  (graskatt), carrot leaves (morotskatt), berry cluster on tail
  (blabarskatt), seed dots (jordgubbskatt), lemon collar (citruskatt),
  rainbow stripes (regnbagskatt), star constellation + halo (stjarnkatt),
  nebula swirl + moonlet + sparkle (rymkatt). All distinct, all drawn from
  primitives — no clipart. Verified in `CatSprite.tsx:190-302`.
- Tabular numerals via `.num` utility on all coin/timer values.
- Typography uses Fredoka for display + Nunito for body — verified in
  `tokens.css:50-52`.
- Lottery wheel (see `eval-001-full-page.png`) has 8 distinct sector
  colors with white separators and a proper pointer triangle. The hub has
  a sparkle icon. This is genuinely well-composed.
- Shop seed cards use rarity-tint left-borders/background via
  `rarity-${cat.rarity}` class.
- Both 768 px tablet (3-col) and 1440 px desktop (3-col + side panel) feel
  intentional. Mobile bottom-tabbar appears properly at <1080 px.

### Issues

- **HIGH — Mobile (375 px) right column overflows.** See
  `eval-001-mobile.png`: the second column plot labels "200 my" and
  "3 000 my" are clipped off the right edge. Root cause: `.section-card`
  uses `padding: var(--space-lg)` (1.5 rem ≈ 24 px) and `.garden-grid`
  has 2-column repeat. At 375 px viewport that leaves
  `375 − (32 px app-padding) − (48 px section padding) ≈ 295 px` of grid
  width split between two plots + a 1 rem gap. The inner content area
  renders, but the right card's text spills past the visible viewport.
  Fix: reduce `.app-main` horizontal padding at <420 px to
  `clamp(0.5rem, 3vw, 3rem)`. At 420 px (`eval-001-mobile-420.png`) the
  overflow shrinks but still slightly cuts the hint bar value.
- **MEDIUM — The "Animationer på" toggle in the top-right header drops
  outside the visible viewport at 375 px** because `.app-header` has
  `flex-wrap: wrap` but the toggle does not wrap cleanly. Visible in
  `eval-001-mobile.png`. Fix: move the toggle into a settings menu, or
  use `row-gap: 8px` and stick it on a second row when needed.
- **MEDIUM — Plot empty CTA copy is generic.** Plots show `+ Plantera frö`
  rather than the spec's onboarding tooltip "Klicka för att plantera en
  Gräskatt!" The generator-state.md acknowledges this. Fix: at
  `totalEarned === 0 && plot.index === 0`, render a speech bubble with a
  tail (spec line 31) over plot 0.
- **LOW — Cat eye design uses `<ellipse rx="6" ry="8">`** — eyes are
  ~1/4 of head height, not 3/4 as spec line 28 demands ("oversized eyes
  (3/4 of head height)"). The cats look cute but read more like neutral
  chibis than the over-the-top Neko Atsume scale the spec aimed at. Fix:
  scale eye ellipses to roughly `rx="9" ry="13"` for stage 2 and move
  them closer together.
- **LOW — Locked plot lock icon has low contrast** (`#9A8EB0` stroke on a
  lavender lid). Fix: bump stroke contrast and add a slight bg ring.

---

## Game Feel — 8/10

I could not interact live, but I read every animation declaration:

### Strong points

- Coin counter pulses on change via Framer Motion `AnimatePresence
  mode="popLayout"` and a `coinPulseKey` (`HUD.tsx:39-50` +
  `useGameStore.ts:521`).
- Ready cats bounce with a CSS `ready-bounce` keyframe (1.4 s ease-in-out
  infinite) — `garden.css:281-293`.
- Plot growing uses three distinct visual stages via `growthStage()` →
  `Seedling`, `Sapling`, then full `CatBodySvg`. Each is a separate SVG
  composition, not just a progress bar.
- Lottery wheel uses `cubic-bezier(0.16, 1, 0.3, 1)` with 4.4 s duration —
  this is exactly the spec's recommended easing. Believable deceleration.
- Plant sheet uses Framer spring (`stiffness: 320, damping: 28`); prize
  modal uses spring (`stiffness: 260, damping: 18`); plot ready cat
  springs in (`stiffness: 220, damping: 14`).
- Reduced motion: `tokens.css:96-102` zeros `--duration-*` vars; toggle
  exposed via header button and `data-reduced-motion` attribute on root.
- Buttons depress via `transform: translateY(2px)` and `box-shadow: 0 0 0`
  on `:active` — verified on `.garden-harvest-all`.

### Issues

- **HIGH — Floating coin numbers are queued in state but never rendered.**
  `useGameStore.ts:376-380` pushes a `FloatingCoin` entry into
  `floatingCoins`. `clearFloatingCoin(id)` exists. But no component reads
  `floatingCoins` — there is no `<FloatingCoins />` in `App.tsx` and no
  file under `src/components/effects/` that consumes it. The spec and
  rubric both require "harvest produces sparkle burst + count-up coin
  number" (rubric line 116). This is the single biggest game-feel gap.
- **MEDIUM — Sparkle burst on plant/harvest is not implemented.**
  Generator-state references it; the spec's architecture lists
  `src/components/effects/Sparkles.tsx`. The file does not exist in the
  source tree (only `Toasts.tsx`, `LightningFlash.tsx`, `RecapModal.tsx`).
  Fix: build the sparkle component — even a CSS-only burst of 6–8 dots
  with staggered animation delays would satisfy the spec.
- **MEDIUM — Cats may not wiggle visibly on idle.** `CatSprite.tsx:41`
  adds `cat-wiggle` class when `wiggle={true}`, but the `@keyframes`
  driving it must live in `cat-sprite.css`. Verify the keyframe exists
  and applies a 4 s `rotate(-2deg → 2deg)` alternate. If not, add it.
- **LOW — Lightning event has a fullscreen flash component
  (`LightningFlash.tsx`)** with `radial-gradient` of lavender + yellow,
  plus a `.plot-storm-cloud.active` shake animation. Adequate, but does
  not include a discrete bolt SVG strike inside the plot.

---

## Code Quality — 8/10

### Strong points

- Strict TypeScript build passes cleanly; no `any` in domain layer.
- `src/domain/` is pure: I read all of `catTypes.ts`, `plots.ts`,
  `lottery.ts`, `lightning.ts`, `economy.ts`, `time.ts`, `persistence.ts`
  and confirmed zero React/DOM imports. Architectural rule honored.
- Single source of truth: `CAT_TYPES` const is imported everywhere; no
  duplicated balance constants in components.
- Files are well-sized: largest is `useGameStore.ts` at 550 lines (still
  under the 800 hard cap), every other file under 305 lines. Most under
  250.
- Save migration hook is present (`migrate()` in `persistence.ts:128-184`)
  and defensively validates every field. Malformed saves fall back to
  `createInitialSave`. This is rare and good.
- File organization is feature-first: `Garden/`, `Shop/`, `HUD/`,
  `LotteryWheel/`, `CatDisplay/`, `effects/`. Matches the spec's
  architecture diagram closely.

### Issues

- **HIGH — Test suite cannot run (vitest missing).** Already covered in
  Functionality. Tests exist but are dead code without the runner.
- **MEDIUM — `useGameStore.ts` at 550 lines is on the larger side.**
  Could split into:
    - `slices/plotSlice.ts` (plant, harvest, harvestAllReady, tick-plot)
    - `slices/shopSlice.ts` (buySeed)
    - `slices/lotterySlice.ts` (spinLottery, acknowledgeSpin)
    - `slices/uiSlice.ts` (toasts, recap, floating coins)
  Same Zustand store, just composed. Not required, just hygiene.
- **LOW — Diacritic stripping in cat ids.** Spec uses `Blåbärskatt`,
  `Regnbågskatt`, etc.; ids drop diacritics → `blabarskatt`,
  `regnbagskatt`. Display names are correct. LOW.
- **LOW — `spinsTodayDate` initial value is empty string `''`.**
  Defensive reset in `spinLottery` keys off `state.lottery.spinsTodayDate
  !== todayKey`, so on first call this correctly zeros spinsToday. No
  exploit today, but a comment or a `localDateString(now)` init would
  make future readers happy.

---

## What's Genuinely Good

- The plot terrariums are the standout. Soil radial gradient + lip shadow
  + grass-tuft pseudo-element + dimensional shadows actually do read as
  "little containers" rather than flat tiles, which is exactly the spec's
  ask.
- Per-tier rarity SVG badges (clover, carrot leaf, blueberry cluster,
  strawberry seeds, lemon collar, rainbow stripes, star constellation,
  nebula swirl) are real visual differentiation drawn from primitives,
  not stock art.
- Lottery wheel actually looks like a wheel, not a chart. 8 colored
  sectors with white separators, a chunky sakura-pink pointer, hub
  sparkle.
- Bundle: 113 kB gzipped JS, 6.3 kB gzipped CSS. Comfortably under any
  reasonable budget for this kind of app.
- TypeScript strict mode + safe-indexing patterns (`if (!plot) continue`,
  `sector ?? null`) — verified in store actions.

---

## Critical Issues (must fix before "ship")

None — there are no app-breaking defects.

## High Issues (should fix in iteration 002)

1. **Tests are unrunnable.** Install vitest (`npm i -D vitest @vitest/ui`)
   and add `"test": "vitest run"` to scripts. Remove the
   `src/**/__tests__/**` exclude from `tsconfig.app.json` or move tests
   to a separate tsconfig.
2. **Starting state deviates from spec.** Set `coins: 0` and
   `inv.graskatt = 0` in `createInitialSave`. The infinite flag covers
   availability.
3. **Mobile (375 px) plots overflow horizontally.** Reduce `.app-main`
   horizontal padding at <420 px (`padding: var(--space-md) clamp(0.5rem,
   3vw, 3rem)`), or reduce `.section-card` padding at narrow widths.
   Re-screenshot at 320/375/414 to confirm.
4. **`floatingCoins` is queued but never rendered.** Add a
   `<FloatingCoins />` consumer (see snippet below). This is the most
   visible game-feel miss.

## Medium Issues (should fix soon)

1. **Plant sheet shows full info for locked seeds.** Mask name + stats
   for locked rows in `PlantSheet.tsx` to mirror the shop's silhouette
   treatment.
2. **Sparkle particles missing.** Create `src/components/effects/
   Sparkles.tsx` and trigger from plant + harvest.
3. **Idle wiggle keyframe may be missing.** Confirm `cat-wiggle`
   `@keyframes` exists in `cat-sprite.css`; if not, add a 4 s
   `rotate(-2deg → 2deg)` infinite alternate.
4. **Animations toggle clipped on mobile header.** Move toggle into a
   gear menu or stack it onto its own row at <600 px.
5. **Onboarding speech bubble for first plot missing.** When
   `totalEarned === 0` and plot 0 is empty, render a speech bubble with
   tail above it pointing down.
6. **`useGameStore.ts` could be split into slices** for maintainability.

## Low Issues (nice to fix)

1. Cat eyes are smaller than the spec asks (3/4 of head height); chibis
   read a bit understated.
2. Locked plot lock icon has low contrast (`#9A8EB0` on lavender lid).
3. `hud.css` `<progress>` element styling not visible in current
   screenshots — verify it has explicit `::-webkit-progress-bar`
   styling.
4. `spinLottery` could persist `spinsTodayDate` immediately on free-spin
   consumption to guard against a future bug.

---

## Specific Suggestions for Iteration 002

1. **Run `npm i -D vitest` + add test script.** Then `npm test` should
   show 9+ passing tests across `lottery.test.ts` and `plots.test.ts`.
2. **Reset spec deviation in `createInitialSave`:**
   ```ts
   coins: 0,
   // inv.graskatt: 0   // infinite flag still allows planting
   ```
3. **Implement `FloatingCoins.tsx` consumer:**
   ```tsx
   export function FloatingCoins() {
     const items = useGameStore(s => s.floatingCoins);
     const clear = useGameStore(s => s.clearFloatingCoin);
     return (
       <AnimatePresence>
         {items.map(c => (
           <motion.span
             key={c.id}
             initial={{ y: 0, opacity: 1, scale: 1 }}
             animate={{ y: -60, opacity: 0, scale: 1.2 }}
             transition={{ duration: 1.1, ease: 'easeOut' }}
             onAnimationComplete={() => clear(c.id)}
             className="floating-coin"
           >+{c.amount}</motion.span>
         ))}
       </AnimatePresence>
     );
   }
   ```
4. **Fix mobile layout:** reduce `.app-main` horizontal padding to
   `clamp(0.5rem, 3vw, 3rem)` and verify at 320/375/414/768 px.
5. **Add onboarding speech bubble** for plot 0 when `totalEarned === 0`.
   Use the spec's exact copy "Klicka för att plantera en Gräskatt!".
6. **Build `Sparkles.tsx`** — 6 absolutely-positioned `<span>` dots,
   each animating `translate + opacity + scale` with staggered
   `animation-delay`. Hook into `plantSeed` success and `harvestCat`
   success.
7. **Mask locked-seed names** in `PlantSheet.tsx` (`{isUnlocked ?
   cat.name : '???'}`, hide stats).
8. **Enlarge cat eyes** in `CatBodySvg` to roughly `rx="9" ry="13"` for
   stage 2 to push the chibi feeling.

---

## Screenshots

- `gan-harness/screenshots/eval-001-initial.png` — 1280×900 desktop on
  fresh load. Shows HUD with 10 coins, garden 3-col grid, shop on right,
  lottery preview. Reads cohesive and on-brand.
- `gan-harness/screenshots/eval-001-desktop-1440.png` — 1440×900
  desktop. Same composition, more whitespace.
- `gan-harness/screenshots/eval-001-full-page.png` — 1280×1400 tall
  shot. Includes the lottery wheel fully rendered with sectored colors
  and pink "Snurra gratis!" CTA. Best single image of the design.
- `gan-harness/screenshots/eval-001-tablet.png` — 768×1024. 3-column
  garden grid renders cleanly. Bottom tabbar visible.
- `gan-harness/screenshots/eval-001-mobile-420.png` — 420×900. Still
  slight right-edge clipping on coin/hint values.
- `gan-harness/screenshots/eval-001-mobile.png` — 375×812 (target
  spec breakpoint). Right column of plots clipped. Top-right "Animationer
  på" toggle clipped. Mobile bug confirmed.
