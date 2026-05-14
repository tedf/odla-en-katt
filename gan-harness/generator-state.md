# Generator State — Iteration 005 (UX audit fixes)

## What Was Built / Changed This Iteration

Applied the top-10 fixes from `gan-harness/screenshots/ux-audit/AUDIT.md`
to tame the page gradient, calm the locked plots, give the Kattpedia
real information density, fix the lottery wheel readability, add empty
states, bump contrast, and align tokens.

### Fix 1 — Tame the background gradient
- `src/components/effects/SkyBackground.tsx`: appended an opaque
  `<div className="sky-ground-overlay" />` inside the sky container.
- `src/components/effects/sky-background.css`: new `.sky-ground-overlay`
  rule fades from transparent at 30% viewport height to
  `rgba(255, 244, 230, 1)` at 80%, so panels sit on warm cream rather
  than raw orange-magenta gradient.
- `src/App.css`: `.app-body` now has a warm cream wash; at desktop
  breakpoints it gains a `--radius-lg` corner radius and an 8/12/12px
  margin, replacing the prior "panels floating on rainbow" feel.

### Fix 2 — Locked plot card visual hierarchy
- `src/components/Garden/garden.css`:
  - `.plot-card.locked`: `min-height: 140px`, `opacity: 0.72`,
    `padding: 10px` (was 200/210px and full opacity).
  - Desktop `min-height` override at 900px (140px) and 1280px (150px).
  - `.plot-locked .lock-icon`: 28×28 (was 40), translucent white
    background, smaller shadow.
  - `.plot-locked-sub`: 0.78rem at `--color-text` weight 600 (legible).
  - New `empty-plot-pulse` keyframe on `.plot-card.is-empty .plus-circle`
    draws the eye to the action; respects `prefers-reduced-motion`.

### Fix 3 — Kattpedia: rarity groups + unlock teaser + tint
- `src/components/Kattpedia/Kattpedia.tsx`:
  - Added `RARITY_ORDER` and `RARITY_SILHOUETTE_TINT` constants.
  - Grouped the flat grid into per-rarity sections with section
    headers showing "Vanlig 1/3", "Ovanlig 0/4", etc.
  - Added an `unlockHint(cat)` helper that returns "Låses upp vid X
    mynt" or "Sälj X Gräskatter" derived from `CAT_TYPES[id].unlock`,
    rendered as `.kattpedia-card-hint` under each locked card.
  - Each card now passes `--card-silhouette-tint` so locked silhouettes
    tint in the rarity's accent rather than appearing identical-grey.
- `src/components/Kattpedia/kattpedia.css`:
  - New `.kattpedia-groups`, `.kattpedia-group-head`,
    `.kattpedia-group-label` styles. Group label uses per-rarity
    background colours (mythic = pink→purple gradient).
  - Rarity badges bumped to 0.72rem, weight 800, full-saturation
    backgrounds (`#c8e6c9` common, `#b3e5fc` uncommon, `#ce93d8` rare,
    `#ffa726` epic, `#ffd54f` legendary, mythic = gradient).
  - Added `.kattpedia-card-hint` legibility rule.

### Fix 4 — Lottery wheel labels readable
- `src/components/LotteryWheel/LotteryWheel.tsx`:
  - Wheel labels are now SHORT only: coin amount or 🌱 (no truncated
    Swedish prize names colliding on the rim).
  - Bumped SVG `fontSize` to 15, weight 800.
  - Added a `.wheel-legend` UL below the spin button — a 2-column grid
    of coloured dots + full prize names ("100 mynt", "Mysteriefrö").
- `src/components/LotteryWheel/lottery-wheel.css`: new `.wheel-legend*`
  styles (warm panel, ellipsis overflow, dot keyed to sector colour).

### Fix 5 — Empty state for Mina frön (Stall) tab
- `src/components/Shop/Shop.tsx`: extracted `<StallTab>` component.
  When the player owns only `graskatt` (the infinite freebie) the tab
  shows a 🌱 illustration + "Inga sällsynta frön ännu" + a one-line
  pointer to Butik/Lyckohjulet, instead of a near-empty list floating
  on gradient.
- `src/components/Shop/shop.css`: new `.shop-empty-state*` styles.

### Fix 6 — Drop redundant 0% chip on quests
- `src/components/Quests/Quests.tsx`: the `.quest-progress-pill` is now
  only rendered when `pct > 0` (was always shown). The bar + N/M label
  already communicates 0/2 / 0% — three duplicates was visual noise.

### Fix 7 — Tab pill contrast (WCAG AA)
- `src/App.css`:
  - `.desktop-tab-bar` background opacity → 0.88 (was 0.6).
  - `.tab-pill` colour → `--color-text` (was `--color-text-soft`).
  Active state still uses the pink primary gradient.

### Fix 8 — Compact mobile header + HUD
- `src/App.css`: at <=480px the subtitle is hidden, the brand mark
  shrinks to 36px, the title drops to 1.2rem, padding tightens.
- `src/components/HUD/hud.css`: new `@media (max-width: 480px)` block
  tightens HUD padding, shrinks action buttons, and hides the
  `.hud-hint` progress bar (it duplicates the garden-section unlock
  progress that lives below the garden grid on mobile).

### Fix 9 — Token consistency
- `src/styles/tokens.css`:
  - New `--radius-card: 18px`.
  - New `--shadow-tile` and `--shadow-tab-active`.
- `border-radius: 18px;` replaced with `var(--radius-card)` across
  `kattpedia.css` and `garden.css` (sed-replaced, 7 callsites).

### Fix 10 — Thicker, always-visible progress bars
- `src/components/Garden/garden.css`: `.plot-bar` height 6→8px with
  `inset 0 1px 3px rgba(58,45,79,0.10)` so the empty track is always
  visible against the warm card background.

## Tests
- `npm run build` — passes with zero TypeScript errors.
  Bundle: 473 kB JS (143 kB gzipped), 106 kB CSS (20 kB gzipped).
- `npm test` — all 92 tests passing across 6 files.
- `npx tsc --noEmit` — clean.

## Known Issues / Notes
- Pre-existing ESLint react-hooks/purity + react-hooks/refs warnings
  in `LotteryWheel.tsx` (line 39, 154) were already present before this
  iteration and are not introduced by the changes here.
- The lottery wheel legend uses a 2-column auto-fill grid, so at very
  narrow panel widths (<300px) it may stack to one column. Labels use
  ellipsis overflow as a safety net.
- The Kattpedia rarity groups produce 5–6 small sections on a fresh
  game; once cats are discovered the silhouette tinting + group counts
  give scannable progress feedback.

## Dev Server
- URL: `http://localhost:5173`
- Status: running (HTTP 200 on /).
- Command: `npm run dev`.
