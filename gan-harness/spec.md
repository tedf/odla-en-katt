# Product Specification: Grow a Cat (Odla en Katt)

> Generated from brief: "Idle/clicker web game for ages 10-16 where players grow cats from seeds in a garden, harvest them for coins, and unlock progressively rarer breeds."

## Vision

Grow a Cat is a cozy idle-garden game where impossibly cute cats sprout from seeds planted in colorful garden plots. Players water the soil with anticipation, watch a Gräskatt (grass cat) bloom in 30 seconds, then chase the dream of unlocking the legendary Rymkatt (space cat) that takes three hours to mature. The feel is kawaii-cottagecore: pastel mornings, sparkle particles, soft bounces, and a daily lottery wheel that rewards just showing up.

## Design Direction

- **Color palette**:
  - Background sky: `#FFF4E6` (peach cream) fading to `#E8D5F2` (lavender mist)
  - Grass/garden soil: `#A8D8B9` (soft mint) with `#7BA67C` shadow
  - Primary action (plant/harvest): `#FF8FA3` (sakura pink)
  - Secondary action (shop/lottery): `#A8C5FF` (cornflower)
  - Coin gold: `#FFD56B` with `#E8A93C` shadow
  - Rarity tints: Common `#C8E6C9`, Uncommon `#B3E5FC`, Rare `#D1C4E9`, Epic `#FFCCBC`, Legendary `#FFE082`, Mythic `#F8BBD0`
  - Text: `#3A2D4F` (deep plum) — never pure black
  - Lightning event accent: `#FFEB3B` over `#7E57C2` storm wash
- **Typography**:
  - Display: "Fredoka" (rounded, friendly) 700/600 weight for headings, cat names
  - Body: "Nunito" 400/600 for descriptions, prices, timers
  - Numerals: tabular-nums on all coin/timer displays so digits don't jitter
  - Sizes: hero coin counter `clamp(2rem, 1.5rem + 2vw, 3rem)`, cat names `1.25rem`, body `0.95rem`
- **Layout philosophy**: Single-page garden-first dashboard. The 2x3 plot grid is the hero, occupying ~60% of viewport. Coin/level HUD pinned top. Shop and lottery as side panels or modal sheets that slide in with spring physics. Mobile: plots stack 2-wide, panels become bottom sheets.
- **Visual identity**:
  - Every cat is a chubby, blob-bodied chibi with oversized eyes (3/4 of head height), tiny triangle ears, and a species-defining color/pattern
  - Soil plots are isometric-ish rounded squares with a subtle shadow under the "lip" — they look like little terrariums, not flat icons
  - Sparkle particles emit on every harvest, plant, and coin gain (CSS animations, not heavy WebGL)
  - Idle cats wiggle on a 4s loop (transform: rotate -2deg → 2deg)
  - Speech bubble tooltips with a tail, never generic rounded rectangles
  - Lightning event uses a full-screen flash overlay + a tiny storm cloud sprite hovering over the affected plot
- **Inspiration**: Neko Atsume's restraint, Stardew Valley's cozy palette, Cookie Clicker's juicy number feedback, Duolingo's bouncy micro-interactions, Animal Crossing's UI chrome.

### Anti-AI-slop Directives

- NO purple-to-blue gradient backgrounds
- NO generic glassmorphism cards stacked vertically
- NO stock cat clipart or photos — all cats are SVG/CSS or canvas-drawn shapes
- NO "Lorem ipsum" or filler text — every string must feel Swedish-cozy
- NO uniform 8px shadows on every card — use directional, varied depth
- NO Material Design defaults — buttons must have at least 2 layered surfaces (face + 3D base) and depress on click

## Game Concept and Core Loop

**One-line pitch**: Plant seed → wait → harvest cat → sell for coins → buy rarer seed → repeat with bigger garden.

**Core loop (target ~45 seconds for first full cycle)**:
1. Player has 0 coins, 1 plot, 1 free Gräskatt seed
2. Click empty plot → seed-picker modal appears → click Gräskatt seed → plant animation (sparkle burst, seed sinks into soil)
3. Timer starts (30s); plot shows seedling sprite, then sapling sprite, then ready-cat sprite
4. Ready cat bounces and shows a glowing "!" indicator
5. Click ready cat → harvest animation (cat leaps into a coin pouch) → coins added to wallet with a count-up number
6. Open shop → buy a Morotskatt seed for 25 coins (or replant another Gräskatt — free)
7. As total coins earned crosses thresholds, new plots unlock with a celebratory modal

**Idle-friendly**: Timers continue in real time. If player closes tab and returns, cats are ready. A "while you were away" recap shows on reload if any plots completed offline.

## Cat Types (Balance Table)

| # | Name | Rarity | Grow Time | Sell Value | Seed Cost | Unlock Condition |
|---|------|--------|-----------|------------|-----------|------------------|
| 1 | Gräskatt (Grass Cat) | Common | 30s | 10 | 0 (free, infinite) | Available from start |
| 2 | Morotskatt (Carrot Cat) | Uncommon | 2 min | 35 | 25 | Sell 3 Gräskatts |
| 3 | Blåbärskatt (Blueberry Cat) | Uncommon | 5 min | 80 | 60 | Total earned ≥ 150 |
| 4 | Jordgubbskatt (Strawberry Cat) | Rare | 10 min | 150 | 110 | Total earned ≥ 500 |
| 5 | Citruskatt (Citrus Cat) | Rare | 15 min | 220 | 160 | Total earned ≥ 1200 |
| 6 | Regnbågskatt (Rainbow Cat) | Epic | 30 min | 500 | 350 | Total earned ≥ 3500 |
| 7 | Stjärnkatt (Star Cat) | Legendary | 1 hr | 1200 | 800 | Total earned ≥ 9000 |
| 8 | Rymkatt (Space Cat) | Mythic | 3 hr | 5000 | 3000 | Total earned ≥ 35000 |

**Visual differentiation**:
- Gräskatt: pale green fur, clover sprig on head
- Morotskatt: orange-and-cream, tiny carrot-leaf ears tuft
- Blåbärskatt: blue-purple, berry cluster on tail
- Jordgubbskatt: white-pink, seeded strawberry pattern
- Citruskatt: yellow with white belly, lemon-peel collar
- Regnbågskatt: rainbow gradient stripes, holographic shimmer (CSS conic-gradient)
- Stjärnkatt: deep navy fur, glowing star constellation pattern on back, soft halo
- Rymkatt: cosmic black with nebula swirl, floats slightly above its plot, orbiting moonlet particle

**Margin / coins-per-second analysis** (for design QA — Generator should verify these intuitions):
- Gräskatt: 10 coins / 30s = 0.33 cps (profit margin: 10 since free)
- Morotskatt: (35-25) / 120s = 0.083 cps (profit: 10 per cycle)
- Blåbärskatt: (80-60) / 300s = 0.067 cps (profit: 20)
- Jordgubbskatt: (150-110) / 600s = 0.067 cps (profit: 40)
- Citruskatt: (220-160) / 900s = 0.067 cps (profit: 60)
- Regnbågskatt: (500-350) / 1800s = 0.083 cps (profit: 150)
- Stjärnkatt: (1200-800) / 3600s = 0.111 cps (profit: 400)
- Rymkatt: (5000-3000) / 10800s = 0.185 cps (profit: 2000)

Higher-tier cats give better cps, rewarding progression. Gräskatt remains a safety net (always free, fast cycle).

## Seed System

- Player starts with 1 free Gräskatt seed slot (infinite uses — Gräskatt is the free starter)
- Other seeds are purchased one-at-a-time from the shop and consumed on plant
- Seed inventory shows count badges (e.g., "Morotskatt x3")
- Unlock conditions are revealed in the shop as silhouettes with the unlock hint ("Sell 3 Gräskatts to unlock")
- Buying a locked seed is impossible — button is grayed and shows lock icon

## Garden System

- Plot 1: unlocked from start
- Plot 2: unlocks at 200 total coins earned (lifetime)
- Plot 3: unlocks at 800 total coins earned
- Plot 4: unlocks at 3000 total coins earned
- Plot 5: unlocks at 10000 total coins earned
- Plot 6: unlocks at 50000 total coins earned

**Plot states**:
- Empty: dashed-outline soil, "+" icon on hover
- Planted (growing): shows seedling/sapling/ready sprite based on % of grow time elapsed (33% / 66% / 100%)
- Ready: bouncing cat with glow ring and "!" indicator, click to harvest
- Locked: shows padlock + unlock threshold ("Unlock at 800 coins earned")

**Plot unlock animation**: new plot pops in with a soft bounce, garden re-flows with FLIP animation, celebratory toast: "Ny trädgårdsruta!" + sparkle confetti.

## Shop

Two tabs:
- **Frön (Seeds)**: grid of all 8 seeds with sprite preview, name, price, "Köp" button. Locked seeds show silhouette + hint.
- **Sälj katter (Sell cats)**: not used in MVP — cats auto-sell on harvest. Tab reserved for future "stash" feature; for MVP, this tab can be omitted.

Coin balance pinned to top of shop drawer. Insufficient funds: button greys, brief shake animation on click attempt.

## Lottery Wheel (Lyckohjulet)

- Accessible via a sparkly button in the HUD with a daily "free spin available" pip indicator
- Spin cost: 0 coins for the daily free spin, then 50 coins per subsequent spin (same day)
- Daily free spin resets at local midnight (use `Date` comparison against last-free-spin timestamp)
- Wheel has 8 sectors with these prizes and weights (weights normalize to probabilities):

| Sector | Prize | Weight |
|--------|-------|--------|
| 1 | 10 coins | 20 |
| 2 | 25 coins | 18 |
| 3 | 100 coins | 12 |
| 4 | Free Morotskatt seed | 15 |
| 5 | Free Blåbärskatt seed | 10 |
| 6 | Free Jordgubbskatt seed | 6 |
| 7 | 500 coins | 4 |
| 8 | Mystery prize (free Regnbågskatt seed) | 2 |

Total weight: 87 → Mythic Rymkatt seed NOT in lottery (must be earned).

**Spin animation**: wheel rotates with eased deceleration (4–5s), pointer ticks audibly-implied via tick particles, landing sector pulses, prize modal with confetti. Wheel uses Framer Motion `animate` with `type: "tween", ease: [0.16, 1, 0.3, 1]`.

## Weather / Lightning Events

- Random chance each tick: any currently-growing plot has a `0.5%` chance per second (rate-limited so at most 1 storm globally per 30s) of triggering a lightning event
- Visual: full-screen lavender flash (150ms), tiny storm cloud appears over affected plot, lightning bolt SVG strike with shake
- Effect: the affected cat's sell value gets a `+20% to +50%` random multiplier (rolled at strike time), persistent for that cat
- The plot shows a permanent ⚡ badge until harvest; tooltip reads "Blixtbonus: +X%"
- After harvest, badge clears and storm cloud dissipates

Edge case: if lightning strikes the same plot twice before harvest, multipliers stack additively (max +100% to keep balance reasonable). Cap value at +100%.

## Persistence (localStorage)

Key: `grow-a-cat:save:v1`

Schema (JSON, versioned):

```ts
type SaveData = {
  version: 1;
  coins: number;
  totalEarned: number; // lifetime, drives plot unlocks
  plots: Array<{
    index: number;          // 0..5
    unlocked: boolean;
    state: "empty" | "growing" | "ready";
    catType: CatTypeId | null;
    plantedAt: number | null; // epoch ms
    lightningBonus: number;   // 0..1.0
  }>;
  seedInventory: Record<CatTypeId, number>; // Gräskatt always treated as infinite
  unlockedCatTypes: CatTypeId[];
  catsSoldByType: Record<CatTypeId, number>;
  lottery: {
    lastFreeSpinAt: number | null; // epoch ms
    spinsToday: number;
    spinsTodayDate: string; // "YYYY-MM-DD" local
  };
  settings: {
    reducedMotion: boolean;
  };
  lastTickAt: number; // epoch ms, for offline catch-up
};
```

**Save cadence**:
- On every meaningful action (plant, harvest, buy, spin, plot unlock)
- Plus a throttled save every 5s while tab is active
- On `visibilitychange` → hidden, force-save
- On `beforeunload`, force-save

**Offline catch-up**:
- On load, compare `lastTickAt` to `Date.now()`
- For each `growing` plot, if `plantedAt + growMs ≤ now`, mark as `ready`
- Show a "Medan du var borta..." recap modal listing ready plots

**Versioning**: a migration function checks `version` field; current is `1`. Future migrations can transform old saves.

## Tech Stack

- **Build**: Vite 5 (React + TypeScript template)
- **Framework**: React 18 with function components + hooks
- **Language**: TypeScript strict mode (`"strict": true`, `noUncheckedIndexedAccess": true`)
- **State**: Zustand with `persist` middleware for save game; selectors via `useShallow` to avoid re-renders
- **Animation**: Framer Motion for layout/spring animations, CSS keyframes for ambient idle wiggles, custom CSS particles for sparkles
- **Styling**: CSS Modules + design tokens in `src/styles/tokens.css`. No Tailwind, no UI kit. Use OKLCH where supported with HSL fallback.
- **Testing**: Vitest for domain logic, React Testing Library for component smoke tests, Playwright for one E2E happy-path
- **Linting**: ESLint (typescript-eslint, react-hooks), Prettier
- **No backend**: pure client-side. Could add a leaderboard later but not in MVP.

## File Architecture

```text
grow-a-cat/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── domain/                    # PURE LOGIC — no React imports
    │   ├── catTypes.ts            # CAT_TYPES const, types, helpers
    │   ├── plots.ts               # plot state machine, growth %, unlock logic
    │   ├── economy.ts             # buy/sell/unlock math
    │   ├── lottery.ts             # weighted roll, daily spin reset logic
    │   ├── lightning.ts           # storm roll, multiplier application
    │   ├── persistence.ts         # save/load/migrate, schema types
    │   ├── time.ts                # tick scheduler, offline catch-up
    │   └── __tests__/             # Vitest tests for all the above
    ├── store/
    │   ├── gameStore.ts           # Zustand store, wires domain to UI
    │   └── selectors.ts
    ├── components/
    │   ├── garden/
    │   │   ├── Garden.tsx
    │   │   ├── Plot.tsx
    │   │   ├── CatSprite.tsx
    │   │   ├── PlantSeedSheet.tsx
    │   │   └── garden.module.css
    │   ├── hud/
    │   │   ├── Hud.tsx
    │   │   ├── CoinCounter.tsx
    │   │   ├── ShopButton.tsx
    │   │   ├── LotteryButton.tsx
    │   │   └── hud.module.css
    │   ├── shop/
    │   │   ├── Shop.tsx
    │   │   ├── SeedCard.tsx
    │   │   └── shop.module.css
    │   ├── lottery/
    │   │   ├── LotteryWheel.tsx
    │   │   ├── PrizeModal.tsx
    │   │   └── lottery.module.css
    │   ├── effects/
    │   │   ├── Sparkles.tsx
    │   │   ├── LightningOverlay.tsx
    │   │   ├── CountUpNumber.tsx
    │   │   └── effects.module.css
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Sheet.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Tooltip.tsx
    │   │   └── ui.module.css
    │   └── recap/
    │       └── AwayRecapModal.tsx
    ├── hooks/
    │   ├── useGameTick.ts         # rAF/setInterval main loop
    │   ├── useReducedMotion.ts
    │   └── useLocalStorageSync.ts
    ├── lib/
    │   ├── format.ts              # number formatting, time formatting
    │   └── random.ts              # seeded PRNG helper for testability
    └── styles/
        ├── tokens.css
        ├── reset.css
        └── global.css
```

**Architectural rule**: anything in `src/domain/` must be importable in a Node test runner without DOM/React. UI components import from `store` and `domain`, but `domain` never imports UI.

## User Flows

### Flow A: First-time player (0 → first harvest)
1. Lands on page → cozy hero, garden visible with 1 plot + 5 locked plots faded
2. Onboarding tooltip points to plot: "Klicka för att plantera en Gräskatt!"
3. Click plot → seed sheet slides up from bottom (spring) → only Gräskatt is selectable
4. Click Gräskatt → sheet dismisses, sparkle burst on plot, seed sprite sinks
5. 30s timer; player can watch sprite morph through 3 stages
6. Ready: cat bounces with glow ring
7. Click → harvest animation, "+10" floats up, coin counter ticks 0→10 with bounce
8. Toast: "Du tjänade 10 mynt!"

### Flow B: Buying a new seed
1. Coin balance ≥ 25 and player has sold 3 Gräskatts → Morotskatt unlocked
2. Click shop button → drawer slides in from right
3. Morotskatt card lights up with a "Ny!" badge
4. Click "Köp 25" → button depresses, coins deduct with count-down, seed count +1
5. Drawer can stay open; close via X or backdrop click

### Flow C: Lottery daily spin
1. HUD shows pulsing dot on lottery button → click
2. Wheel modal opens, "Gratis snurr tillgänglig!" CTA
3. Click spin → wheel accelerates, decelerates over 4–5s
4. Lands on "100 mynt" → confetti burst, prize modal shows reward
5. Click "Ta emot" → coins added, modal closes
6. Lottery button no longer pulses; next free spin tomorrow at local midnight

### Flow D: Offline return
1. Player closes tab with 2 Stjärnkatts growing (1hr each)
2. Returns 3 hours later → save loads, growth recomputed
3. Both plots are `ready` → recap modal: "Medan du var borta växte 2 katter klart!"
4. Click "Skörda allt" → both auto-harvest in sequence with staggered animation

## Visual States Checklist

- **Empty state**: brand-new garden with onboarding tooltip
- **Loading state**: brief sun-rising splash (≤300ms), not a generic spinner
- **Locked plots**: padlock + threshold, slight desaturation
- **Insufficient funds**: shake + red coin icon flash, no error toast spam
- **Lightning bonus active**: ⚡ badge on plot, tooltip on hover
- **All plots full**: no idle prompt, but lottery and shop still accessible
- **Reduced motion**: respects `prefers-reduced-motion: reduce` — disables wiggle, replaces spring with instant snap, keeps sparkles as static SVG bursts

## Responsive Behavior

- 320px: single-column plot stack, HUD compresses (icons only), bottom sheets full-width
- 768px: 2-column plot grid, HUD shows full text
- 1024px+: 3-column 2-row plot grid, shop as right-side drawer (420px wide)
- 1440px+: garden gets max-width 1200px, centered, with decorative side fauna

## Accessibility

- All buttons have visible focus rings (3px sakura outline with 2px offset)
- Plots are keyboard-navigable (tab order = plot 1..6, then HUD, then panels)
- Enter/Space activates plot
- ARIA live region announces coin changes and plot state changes
- Color is never the only indicator (lock icon, "!" indicator complement color cues)
- Color contrast ≥ 4.5:1 for all text on its background

## Evaluation Criteria

### Functionality (weight: 0.40)

**Core loop works end-to-end**:
- Can plant Gräskatt, wait 30s, harvest, receive 10 coins
- Can buy Morotskatt seed for 25 coins after meeting unlock condition
- Can plant and harvest all 8 cat types (timers must match spec; tests can mock time)
- Plots unlock at correct lifetime-earned thresholds (200, 800, 3000, 10000, 50000)
- Lottery wheel: daily free spin works, second spin costs 50 coins, daily reset at local midnight
- Lightning event: triggers randomly during growth, applies +20–50% bonus, badge persists until harvest
- localStorage save persists across reload; offline catch-up recomputes growth correctly
- No console errors during normal play

### Visual Design (weight: 0.25)

**Kawaii style, not a template**:
- Custom SVG/CSS cats — no clipart, no generic icons
- Distinct visual identity per cat tier (palette, accents, sparkle behavior)
- Pastel palette matches spec; no purple-to-blue gradient slop
- Plots feel like little terrariums (depth, shadow, lip), not flat tiles
- Typography pairs Fredoka + Nunito with real hierarchy
- HUD, shop, and lottery feel like one cohesive system
- Both light backgrounds and any dark accents look intentional
- Mobile layout is not a desktop layout squished

### Game Feel (weight: 0.20)

**Satisfying feedback without sound**:
- Harvest produces a sparkle burst + count-up coin number
- Buttons depress on click (transform, not just color change)
- Spring animations on modal/sheet entrances (Framer Motion)
- Plot growth has visible 3 stages, not just a progress bar
- Lottery wheel decelerates believably (not linear)
- Lightning event feels like a fun surprise, not annoying interruption
- Idle cats wiggle subtly on a loop
- Empty/locked/ready states each have distinct visual treatment
- Respects `prefers-reduced-motion`

### Code Quality (weight: 0.15)

**Clean architecture**:
- `src/domain/` is pure, no React imports — verifiable by running domain tests in node
- TypeScript strict mode passes with no `any` leaks in domain layer
- Zustand store is the only bridge between domain and UI
- Cat types, prices, and thresholds live in a single source of truth (`catTypes.ts`)
- File sizes under 400 lines; no file over 800
- Functions under 50 lines
- No hardcoded magic numbers in components — read from domain constants
- Save schema is versioned with a migration hook
- At least the lottery weighted roll, plot growth %, and unlock logic have unit tests

## Sprint Plan

### Sprint 1: Foundation
- Goals: project scaffold, domain layer, design tokens, garden grid renders
- Features: Vite + React + TS setup, `catTypes.ts`, `plots.ts`, `economy.ts`, design tokens CSS, basic `Plot` component renders empty/locked states, Zustand store wired
- Definition of done: `pnpm dev` shows 6 plots (1 unlocked, 5 locked) with correct thresholds visible

### Sprint 2: Core Loop
- Goals: plant → grow → harvest cycle works for Gräskatt
- Features: seed-picker sheet, planting flow, growth ticker (`useGameTick`), 3-stage sprite, ready glow, harvest animation, coin counter, count-up number, persistence v1
- Definition of done: can plant Gräskatt, see it grow, harvest, receive coins; reloading page preserves state

### Sprint 3: Progression
- Goals: all 8 cats playable, plot unlocks, shop
- Features: all `CatSprite` variants, shop drawer with seed cards, unlock conditions, plot unlock celebrations, offline catch-up + recap modal
- Definition of done: player can earn enough coins to unlock plot 2 and buy a Morotskatt seed

### Sprint 4: Delight Systems
- Goals: lottery wheel, lightning events, polish
- Features: `LotteryWheel` with weighted roll and animation, daily free spin logic, lightning event system, ⚡ badge, prize/storm modals, sparkle particle system
- Definition of done: lottery and lightning both functional and feel exciting

### Sprint 5: Polish & A11y
- Goals: animations refined, reduced-motion, keyboard nav, responsive QA
- Features: focus rings, ARIA live regions, prefers-reduced-motion path, mobile bottom-sheet conversion, empty/error/edge states
- Definition of done: Lighthouse a11y ≥ 95, plays well on 320px and 1440px, no console errors

### Sprint 6: Hardening
- Goals: tests, performance, save migration scaffold
- Features: Vitest tests for domain, one Playwright happy-path, performance pass (compositor-only animations, bundle audit), version migration stub
- Definition of done: domain test coverage ≥ 80%, bundle < 200kb gzipped, build clean
