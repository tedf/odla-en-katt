# Generator State — Iteration 003 (shop bug fix + 8 cats / 8 boosts / 8 tools)

## What Was Built This Iteration

### Bug fix — Shop / center panel stacking context

`src/App.css`:

- `.panel-center` (desktop) now uses `position: relative`,
  `isolation: isolate`, `z-index: 0`. Establishes a contained stacking
  context so the upgrade-active banner's conic-gradient glow + any future
  modal/sheet cannot escape to document root.
- `.panel-right` mirrors the same `position: relative; z-index: 0`.
- `.panel-center-content` keeps `overflow-y: auto / overflow-x: hidden`
  and now has explicit `min-height: 0` so flex children scroll instead of
  overflowing.

The shop already used `position: absolute` only for the inner
`.upgrade-active-glow` (clipped by its parent's `overflow: hidden`), so
the new isolate boundary fully scopes everything to its grid column.

### Feature 1 — 8 new cats (total 22, including a Mythic tier)

`src/domain/catTypes.ts`:

- Added `lavendercat`, `honeycat` (uncommon), `crystalcat`, `ghostcat`
  (rare), `phoenixcat`, `tidekatt` (epic), `thundercat` (legendary), and
  `cosmiccat` (mythic). Mythic tier was already in the rarity union;
  Rymkatt and Kosmisk Katt both share it now.
- `CAT_TYPE_ORDER` rewritten so the shop list flows by progression /
  unlock threshold (1700, 2000, 2200, 2800, 3200, 3400, 3500, 6000, 7500,
  8200, 9000, 18000, 25000, 35000, 100000).
- Unlock thresholds chosen so the new cats slot between existing tiers
  without disrupting the original tuning curve.

`src/components/CatDisplay/CatSprite.tsx`:

- New SVG badges for every new cat, drawn from primitives:
  - **Lavendelkatt** — 5-flower crown with stems and a soft scent glow.
  - **Honingskatt** — three honeycomb hex cells on the belly + a bumbling
    bee above the head with striped body and wings.
  - **Kristallkatt** — three pointed crystal shards on the head + a
    faceted belly diamond with refraction highlights.
  - **Spökkatt** — translucent veil overlay, dot eyes, double wiggly
    ghost tail along the lower body, ambient aura ring.
  - **Fenixkatt** — flame wings on both sides, burning crest on top,
    ember dots flanking the tail.
  - **Tidvattenkatt** — wave curl band across the back + falling water
    droplets with highlight.
  - **Åskkatt** — three-cloud storm crown, large yellow lightning bolt
    centered between the ears, body crackle lines.
  - **Kosmisk Katt** — spiral galaxy on the belly with a rotating CSS
    animation, plus 8 floating cosmic particles drifting in CSS-driven
    staggered delays.

`src/components/CatDisplay/cat-sprite.css`:

- New `cosmic-spin` (galaxy rotation, 18 s) and `cosmic-drift`
  (particles, 4.5-7 s with per-particle delays) keyframes.
- `prefers-reduced-motion` override disables both.

`src/components/Shop/shop.css`:

- `seed-card.rarity-mythic` now uses an animated bordered card
  (`mythic-border` keyframe, 6 s) plus an intense magenta glow with
  shadow + inset rim.

### Feature 2 — 8 boost tiers (was 4)

`src/domain/upgrades.ts`:

- `SPEED_UPGRADES` expanded to 8 tiers: 1.5x / 2x / 3x / 5x / 8x / 12x /
  20x / 50x. Costs scale 50 → 1,000,000; durations 30 min → 24 h.
  Emojis cover potion → tornado → portal → cosmos → explosion → stop.
- New `SpeedUpgradeId` union now includes `speed_5..8`.
- New pure helper `classifySpeedUpgrades(coins)` returns each upgrade
  tagged as `affordable`, `next`, or `locked`. The shop uses this to
  show all affordable boosts plus the next aspirational one, and renders
  far-away boosts as locked previews.

`src/components/Shop/Shop.tsx`:

- `UpgradesTab` iterates `classifySpeedUpgrades(coins)`; far-out tiers
  become a `LockedUpgradePreview` row with a lock badge and hint copy;
  the next-affordable boost gets a "Nästa mål" pill.
- `UpgradeCard` accepts the new `status` prop and applies a
  `next-goal` class (subtle gold-tint background, gold "Nästa mål"
  pill) when the boost is the next aspirational tier.

### Feature 3 — 8 utility tools (was 1)

`src/domain/upgrades.ts`:

- `UTILITY_UPGRADES` expanded from 1 to 8 entries. Each now carries an
  `unlockThreshold: number` (lifetime-earned coins required before the
  tool is revealed in the shop).
- New derived helpers:
  - `seedInventoryCap(owned)` — 5 base, 10 with `extra_seed_slot`
  - `weatherProbabilityMultipliers(owned)` — 2x for all events with
    `lightning_rod`; 3x for meteor + tornado with `cosmic_antenna`
    (multiplicative)
  - `sellValueMultiplier(owned)` — 1.10 with `golden_watering_can`
  - `offlineTimeMultiplier(owned)` — 2 with `time_capsule`
  - `luckyMagicalBias(owned)` — 0.15 with `lucky_soil`
  - `hasCatWhisperer(owned)` — true with `cat_whisperer`

`src/store/useGameStore.ts` (wiring):

- `tick()` now passes `weatherProbabilityMultipliers(state.utilityUpgrades)`
  into `rollAnyWeatherEvent`.
- `harvestCat()` reads the owner's utilities and:
  - rolls personality with `luckyMagicalBias` and optional
    `rollExtraTrait` (cat_whisperer)
  - stacks the extra trait's `traitValueMultiplier` multiplicatively
  - applies `sellValueMultiplier` for `golden_watering_can` on every
    sale.
- `buySeed()` honors `seedInventoryCap`. Trying to buy past the cap
  yields a toast ("Fröpåsen är full") instead of silently subtracting
  coins.
- `bootstrapInitialState()` multiplies the offline-time speed by
  `offlineTimeMultiplier(save.utilityUpgrades)` before feeding it into
  `calculateOfflineProgress`.

`src/domain/events.ts`:

- `rollAnyWeatherEvent` accepts an optional 4th `probabilityMultipliers`
  argument. Adjusted probability is capped at 1.0 per event.

`src/domain/catPersonality.ts`:

- `rollPersonality` now accepts a 2nd `options` argument
  (`{luckyMagicalBias, rollExtraTrait}`). When bias > 0 and the roll
  fires, the trait is forced to `lucky` or `magical` (50/50). When
  `rollExtraTrait` is true, an `extraTraitId` is included in the result.

`src/components/Shop/Shop.tsx`:

- `UtilityTab` classifies every tool as `owned` (green ✓), `affordable`
  (active purple buy button), `locked-cost` (locked icon + cost, shake
  on click), or `mystery` (shown as "???" with hashed background until
  the threshold is reached). A "Nästa verktyg låses upp vid X mynt
  intjänat" hint appears below the list whenever there is a hidden tool.

### Tests

`src/domain/__tests__/upgrades.test.ts`:

- Updated `SPEED_UPGRADES` length assertion to 8.
- Added per-tier spec checks for tiers 5 and 8.
- New `describe('classifySpeedUpgrades')` block with three cases:
  wealthy player (all affordable), partial wealth (1 affordable, 1
  next, rest locked), broke (tier 1 marked as next).

All 92 tests pass; previous tests untouched.

## What Changed This Iteration

- Cat count: 14 → 22 (8 new across uncommon/rare/epic/legendary/mythic).
- Speed boosts: 4 → 8 tiers.
- Utility tools: 1 → 8.
- Shop's Upgrades tab now uses a "show next aspirational + lock distant"
  display strategy.
- Shop's Verktyg tab now uses unlock thresholds with mystery (???) rows
  for unreached tools.
- The shop / center panel is now wrapped in its own stacking context so
  nothing inside can escape to the document root.

## Known Issues / Limitations

- The `cat_whisperer` extra trait only affects sell value (multiplied
  in via `traitValueMultiplier`). Growth-time traits from the second
  roll are not applied because the cat is already fully grown by the
  time we roll a personality. This matches the spec's framing of
  personality as a post-harvest trait.
- Mythic gradient border uses `-webkit-mask` / `mask-composite`.
  Verified to render on Chrome / Safari / Firefox in the production
  build.
- Cosmic-cat galaxy animation uses a transform-translate keyframe so it
  composites correctly even though it lives inside an SVG `<g>` whose
  parent already has a translate. The keyframe re-applies the
  translation explicitly.

## Tests

- `npm test` — 92 passing across 6 files.
- `npm run build` — passes. Bundle: 454 kB JS (137 kB gzipped),
  86 kB CSS (16 kB gzipped).

## Dev Server

- URL: `http://localhost:5173`
- Status: running (verified `HTTP 200` on `/`).
- Command: `npm run dev`.
