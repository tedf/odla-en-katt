# Generator State — Iteration 003

## What Was Built (incremental on iteration 002)

### Feature 1 — 6 new cat types (8 → 14)

Added in canonical progression order in `src/domain/catTypes.ts`:

- `bamboukatt` — common, 25m grow, 90 coin sell, panda-coloured cat with bamboo stalk on belly + jade-green leaves above ears. Unlocks at 70 totalEarned.
- `kokosnotkatt` — uncommon, 45m grow, 350 coin sell, sand-coloured with dark coconut shell pattern on belly and a palm-leaf tuft above the forehead. Unlocks at 900 totalEarned.
- `isbjornkatt` — rare, 75m grow, 580 coin sell, white-bodied with arctic snowflake speckles and a tiny iceberg crown. Unlocks at 2200 totalEarned.
- `vulkankatt` — rare, 90m grow, 700 coin sell, dark obsidian body with glowing lava cracks across the belly and embers floating above the head. Unlocks at 2800 totalEarned.
- `drakkatt` — epic, 2h grow, 2500 coin sell, dragon-cat with a violet folded wing, golden saw-tooth spinal fin between the ears, and tiny fangs + ember puff. Unlocks at 6000 totalEarned.
- `enhornigskatt` — legendary, 4h grow, 8000 coin sell, pearl-coloured unicorn with a golden spiral horn, pastel rainbow mane along the back, and scattered sparkles. Unlocks at 18000 totalEarned.

All six new types have:
- Unique 4-colour palettes (`body`, `accent`, `shadow`, `glow`) feeding the radial-gradient body fill and accent details.
- Hand-drawn inline SVG badges in `CatSprite.tsx` — no emoji, no clipart. Each one is distinguishable as a stage-2 cat at thumbnail size.
- A matching seed via the existing `SEED_TYPES` derivation (no changes needed there since seeds are generated from `CAT_TYPE_ORDER`).
- Unlock thresholds spaced so the player encounters them naturally between existing tiers.

`CAT_TYPE_ORDER` was reordered so the shop / plant sheet shows cats sorted by progression value (graskatt → bamboukatt → blabarskatt → jordgubbskatt → kokosnotkatt → citruskatt → isbjornkatt → vulkankatt → regnbagskatt → drakkatt → stjarnkatt → enhornigskatt → rymkatt).

### Feature 2 — 12 garden plots (was 6)

`src/domain/plots.ts`:
- `MAX_PLOTS` raised to 12.
- `PLOT_UNLOCK_THRESHOLDS` extended with the spec-mandated values: `[0, 200, 800, 3000, 10000, 50000, 150000, 400000, 1000000, 3000000, 8000000, 20000000]`.
- `padPlots` in `persistence.ts` was reworked to normalize legacy 6-plot saves up to 12 plots while preserving any in-progress growth.
- Plot unlock tests in `plots.test.ts` extended to cover all 12 thresholds.

`src/components/Garden/garden.css`:
- Grid now scales `repeat(auto-fill, minmax(132px, 1fr))` at the smallest size, 2-col at 420px, 3-col at 600px, **4-col at 1200px**. Twelve plots tile cleanly without overflow.

### Feature 3 — Expanded weather event system

New `src/domain/events.ts` (replaces the previous re-export file): a self-contained event catalogue of six weather events — `rain`, `lightning`, `ice`, `snow`, `tornado`, `meteor` — each with its own probability, bonus range, badge colour, sound, cooldown, and `canExceed100` flag matching the spec.

- `WEATHER_EVENTS_BY_ID` — keyed lookup table for any event id.
- `WEATHER_EVENTS` — array in common-to-rare order.
- `rollWeatherBonus(event, rng)` — uniform pick within `[bonusMin, bonusMax]`.
- `rollAnyWeatherEvent(cooldownState, now, rng)` — biased iteration that rolls rare-to-common, respects per-event cooldown, and returns the first event that fires this tick.

Plot state is now richer:

```ts
interface PlotState {
  ...
  /** legacy field, also the sum of all weatherBonusBreakdown values */
  lightningBonus: number;
  weatherEvents: string[];                    // unique event ids that hit this plot
  weatherBonusBreakdown: Record<string, number>; // eventId → additive bonus
}
```

`applyWeatherBonus(plot, eventId, bonus, perEventCap)` stacks events additively. Per-event cap is `1.0` for ordinary events (lightning, ice, rain, snow) and `Infinity` for tornado / meteor. The cross-event total is hard-capped at `WEATHER_BONUS_TOTAL_CAP = 5.0` (+500%) regardless of which events fire. `applyLightningBonus(plot, bonus)` is retained for backwards compatibility and now routes through `applyWeatherBonus` with a +100% per-event cap.

`effectiveSellValue(plot)` multiplies the base sellValue by `(1 + plot.lightningBonus)`, so all bonuses naturally flow through. A graskatt that gets +500% bonus from a meteor pays out 60 coins instead of 10.

### Store integration — `src/store/useGameStore.ts`

- New persisted field `weatherCooldowns: Record<string, number | null>` tracks per-event last-fire timestamps; the legacy `lastStormAt` is kept for back-compat and back-filled into `weatherCooldowns.lightning` on load.
- New ephemeral field `activeStrike: ActiveWeatherStrike | null` carries `{ id, plotIndex, eventId, bonus, triggeredAt }`. Auto-clears after `STRIKE_DISPLAY_MS = 1800ms` inside `tick()`.
- `tick()` was rewritten to roll a single weather event per tick via `rollAnyWeatherEvent`, apply the bonus, push a toast like `"☄ Meteoritregn! Plot 7 fick +260% värde"`, and seed `activeStrike` so the UI can react.

### Persistence + back-compat — `src/domain/persistence.ts`

- `SaveData.weatherCooldowns` added; legacy `lastStormAt` retained but deprecated.
- `padPlots()` and a new `normalizePlot()` helper backfill `weatherEvents` and `weatherBonusBreakdown` to safe defaults for old saves.
- Old 6-plot saves auto-extend to 12 plots (extra plots default to `unlocked: false`).
- Migrate gracefully recovers from missing or malformed fields.

### Visual effects — `src/components/Garden/PlotCard.tsx`

- **Stacked badges**: When a plot has been hit by multiple weather events, each event renders its own pill (emoji + bonus %) in the top-right of the plot card. Pills stack vertically. Colour and background come from the event's `badgeColor` / `badgeBg`.
- **Active strike overlays** (only on the struck plot, only for `STRIKE_DISPLAY_MS`):
  - **Lightning**: yellow electric border via inset box-shadow on `.plot-inner` (`fx-lightning`).
  - **Tornado**: spinning rotate-720° animation on the cat sprite via `.fx-cat-target` (`fx-tornado`).
  - **Ice**: blue-white shimmer border + cool radial highlight on `.plot-inner::before` (`fx-ice`).
  - **Rain**: green-blue outer glow (`fx-rain`).
  - **Snow**: pale white-blue glow + falling particle dots (`fx-snow`).
  - **Meteor**: orange-red intense glow + `meteor-impact` shake + full-screen flash with deep amber/red gradient (`fx-meteor`).
- Each strike spawns a **big emoji burst** rising above the plot card via the `weather-burst` keyframe (`scale 0.3 → 1.2 → 1` while translating −24px and fading).
- Each strike spawns ~8–14 falling **particle dots** (rain droplets are elongated rounded rectangles; snow/ice are circles; meteor uses larger orange dots). Colour comes from the event's badge palette.

### Full-screen flash — `src/components/effects/LightningFlash.tsx` + `App.css`

Now reads `activeStrike` directly. Renders a `data-event={eventId}` overlay whose radial gradient is swapped per event via CSS custom property. Meteor uses a longer 1.1s pulse with a `[0, 1, 0.6, 0]` opacity envelope so the impact reads as a real screen flash, not a polite blink.

### Sound effects — `src/hooks/useSoundEffects.ts`

Added five new generated sounds tied to weather events:
- `playTornado` — low rumbling sawtooth sweep 240Hz→60Hz + noise.
- `playIce` — high crystalline triangle ping at 2.1kHz + a 3.2kHz overtone tail.
- `playRain` — soft 700ms white-noise burst.
- `playSnow` — gentle 3-note bell at 880/1175/1568Hz.
- `playMeteor` — deep impact noise + 60Hz sub-bass thump + 180Hz→880Hz ascending sweep.

`playWeather(eventId)` is a dispatcher that picks the right one for any event id. `App.tsx`'s `useGlobalSoundEffects` watches `activeStrike` (by stable `id`) and calls `playWeather(strike.eventId)` on each new strike — so every event type plays its own audio identity.

### Tests

- `src/domain/__tests__/events.test.ts` — 15 new tests covering: WEATHER_EVENTS catalogue completeness, spec probability values, `canExceed100` flag wiring, `rollWeatherBonus` boundaries, `rollAnyWeatherEvent` respecting cooldowns and producing null on bad rolls, plot-level stacking, duplicate-event handling, per-event caps, and the +500% total cap propagating through `effectiveSellValue`.
- `plots.test.ts` updated to seed PlotState with the new `weatherEvents` / `weatherBonusBreakdown` fields and to assert all 12 plot unlock thresholds.
- Total: **4 test files, 39 tests passing**.

## What Changed This Iteration (against task instructions)

- Feature 1: 6 new cats added with palettes, descriptions, unlock thresholds, and bespoke SVG badges. `CAT_TYPE_ORDER` reordered for progression.
- Feature 2: 12 plot slots, new thresholds applied, padPlots/normalizePlot updated, grid scales to 4-col on wide screens.
- Feature 3:
  - 6-event catalogue with probabilities matching the spec.
  - Multi-event stacking on a single plot, capped at +500% total.
  - Persistent `weatherEvents` + `weatherBonusBreakdown` per plot.
  - Distinct per-event visual: glow / shake / spin / particle pattern / burst emoji / full-screen flash gradient.
  - Distinct per-event audio.
  - Stacked badges on the plot card.

## Known Issues

- Existing 6-plot saves from iteration 002 will auto-extend; the extra 6 plots show as locked. Player progress (coins, totalEarned, seedInventory, etc.) is preserved untouched.
- AudioContext gesture-gating from iteration 002 is unchanged: the first weather event after page load is silent in browsers that require a user gesture before audio plays.
- Tornado spin animation runs on the visible cat sprite; if the plot was already empty when the event hit (impossible currently — rolls only target growing plots), the animation would still try to apply on the `+` icon. Roll logic prevents this.

## Dev Server

- URL: http://localhost:5173
- Status: running
- Command: `npm run dev -- --port 5173`
- Build: `npm run build` passes — 119.75 kB gzipped JS, 8.17 kB gzipped CSS.
- Tests: `npm test` — 39 passing across 4 files.
