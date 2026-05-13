# Generator State — Iteration 002

## What Was Built (incremental on iteration 001)

### New domain modules
- `src/domain/upgrades.ts` — `SPEED_UPGRADES` const (4 tiers: Gödselvatten 1.5x/100, Magisk Jord 2x/500, Trollformelsfrö 3x/2000, Tidsmagi 5x/10000), `activeSpeedMultiplier(purchasedIds[])` returning the highest tier multiplier (non-stacking), `nextAvailableUpgrade`, and `getUpgradeById`.
- `src/domain/__tests__/upgrades.test.ts` — 8 unit tests (cost/multiplier monotonicity, activeSpeedMultiplier semantics, next-tier discovery, unknown-id safety).

### New hook
- `src/hooks/useSoundEffects.ts` — Web Audio API based synth. No audio files. Exposes `playHarvest` (C5→E5→G5 arpeggio), `playCoinEarn` (880Hz blip + 1320Hz tail), `playPlant` (200→120Hz dip), `playLightning` (noise burst + sawtooth dive), `playLotteryWin(rare?)` (3-note for common, 5-note + sparkle tail for rare), `playLotterySpin` (sawtooth 200→800Hz over 4s), `playBuyUpgrade` (C5→E5 squares), `playUnlockPlot` (4-note triangle ascent), `playButton`. Reads `settings.soundMuted` from store to gate playback. AudioContext is lazy + shared.

### New UI components
- `src/components/effects/FloatingCoins.tsx` — consumes the `floatingCoins` store queue and renders "+N mynt" pills floating up with framer-motion `AnimatePresence`. Auto-clears via `onAnimationComplete`. Horizontal offset varies per plotIndex so multi-harvest pills don't overlap.

### Store changes
- `useGameStore.ts`
  - Added persisted fields `purchasedUpgrades: SpeedUpgradeId[]` and `settings.soundMuted: boolean`.
  - `tick()` now reads `activeSpeedMultiplier(purchasedUpgrades)` and passes it into `isMature(plot, now, speedMult)` — growth ripens proportionally faster.
  - Offline catch-up (`applyOfflineCatchup`) also takes the speed multiplier, so coming back after time away rewards upgrades retroactively.
  - New actions: `buyUpgrade(id)` (validates funds + dedup, persists, toast), `toggleSoundMuted()` (persists), `notifyPointerBounce()` (UI-only signal).
  - `spinLottery` keeps `spinAngle` for backwards compat but the component computes the real visible delta from the current rotation (see Lottery section).

### Lottery wheel — pointer alignment fix
- **Old bug:** pointer SVG was rotated 180° via CSS but the geometry resulted in the chevron tip floating above the wheel stage, never actually touching the winning sector. Visually disconnected.
- **New pointer SVG:** teardrop with tip at the bottom (`d="M17 42 L4 12 Q17 0 30 12 Z"`, viewBox 34×44). Positioned `top: -20px` so the tip pokes 22px into the wheel circle.
- **New rotation math:** computed in the component using the current rotation:
  ```
  sectorCenter = i * segAngle + segAngle/2
  targetMod = ((-sectorCenter + jitter) % 360 + 360) % 360
  delta = (targetMod - currentMod + 360) % 360
  rotation += 5 * 360 + delta
  ```
  Guarantees the winning sector's center lands exactly under the pointer no matter where the wheel previously rested. Tiny in-sector jitter prevents the pointer from sitting on a separator line.
- **Win confirmation:** pointer plays a `pointer-bounce` keyframe (cubic-bezier-back rotate + small vertical hop) when the wheel stops.
- **Winning sector highlight:** other sectors dim to 45% opacity and the winning sector gets a deep stroke + drop-shadow halo while the prize modal is open.

### Sound integration points
- `App.tsx` mounts a `useGlobalSoundEffects` watcher that plays `playLightning` when `activeStormPlot` flips, `playCoinEarn` when `coinPulseKey` increments, `playUnlockPlot` when `unlockedCatTypes.length` grows.
- `PlotCard.tsx` plays `playPlant` on successful plant and `playHarvest` on successful harvest.
- `Garden.tsx` plays `playHarvest` for the "Skörda alla" button.
- `LotteryWheel.tsx` plays `playLotterySpin` on spin start, `playLotteryWin(isRare)` on win (rare = 500-coin prize or rare-seed prize), and `playCoinEarn` shortly after for coin wins.
- `Shop.tsx` plays `playBuyUpgrade` for upgrade purchases and `playButton` for seed purchases.
- HUD adds a mute toggle button (speaker icon) in the header. State persists in `settings.soundMuted` via `toggleSoundMuted`.

### Mobile + onboarding polish
- `.app-main` and `.app-header` horizontal padding tightened to `clamp(0.5rem, 3vw, 3rem)`. `.section-card` padding drops to `--space-md` at <420px. `garden-grid` switches to `repeat(auto-fill, minmax(140px, 1fr))` on narrow screens; 2-col at 420px+; 3-col at 600px+.
- Locked plot's lock icon now has a 3px white halo + harder stroke for contrast.
- `PlantSheet` rows show silhouette + "???" + "Lås upp i butiken" for locked seeds, mirroring the shop.
- Plot 0 onboarding bubble: shows "Klicka för att plantera en Gräskatt!" when `totalEarned === 0 && plot.index === 0 && state === 'empty'`. White card with sakura-pink border, tail pointing down, gentle bob keyframe.
- Empty plots get three SVG-tuft grass elements that sway with `grass-sway` keyframe (4s alternate; respects reduced-motion).

### Speed multiplier visibility
- HUD shows a "⚡Nx" chip next to "Totalt intjänat" when active.
- Garden section header shows a "⚡Nx" chip.
- Each growing plot card shows an "⚡Nx" badge in its top-left corner.
- Growing time label uses speed-adjusted remaining time (e.g. with 2x, a 30s Gräskatt shows ~15s remaining).

### Initial-state fix (spec compliance)
- `createInitialSave` now starts the player at 10 coins, 1 unlocked plot, 0 prefilled Gräskatt seeds (Gräskatt is infinite via the flag, so the player can plant freely). Matches spec.

### Test runner
- `npm i -D vitest` (added).
- `package.json` scripts: `"test": "vitest run"`.
- 3 test files, 24 tests passing (lottery.test.ts, plots.test.ts, upgrades.test.ts).

### Coin shake feedback
- HUD coin pill shakes when the player tries to spend (clicks any disabled `.seed-card-buy`, `.upgrade-buy`, or `.lottery-spin-btn`) while coins=0.

## What Changed This Iteration (against feedback-001.md)
- HIGH: Tests are runnable — added vitest devdep + test script; 24 tests pass.
- HIGH: Initial state matches spec — 10 coins, 0 graskatt seeds (infinite flag).
- HIGH: Mobile overflow fixed — narrower padding clamps + auto-fill grid at <420px.
- HIGH: FloatingCoins rendered via new component + animated +N pill.
- HIGH: Lottery pointer/rotation alignment fixed via redesigned pointer + delta-aware rotation math.
- HIGH: Speed upgrades shop tab + HUD badge + applied multiplier in tick + persisted.
- HIGH: Sound effects across plant, harvest, coin earn, lightning, unlock, lottery (spin + win, with rare variant), upgrade. Mute toggle in header.
- MEDIUM: Plant sheet masks locked-seed names + stats.
- MEDIUM: Onboarding speech bubble on plot 0 when totalEarned === 0.
- MEDIUM: Locked-plot icon contrast bumped.
- MEDIUM: Free-spin pip refresh interval tightened from 30s → 5s.
- LOW: Idle grass-sway animation on empty plots.
- LOW: Coin counter shakes on insufficient funds clicks.

## Known Issues
- AudioContext requires a user gesture before any sound plays in some browsers. Sound is silent until the player's first interaction; this matches typical web audio behavior and we don't pre-emptively prompt the user.
- The existing local storage save from iteration 001 (10 coins + 3 graskatt seeds) will load as-is; the new initial state only affects fresh players. This is intentional — we don't wipe existing player progress.

## Dev Server
- URL: http://localhost:5173
- Status: running
- Command: `npm run dev`
- Build: `npm run build` passes; 116.73 kB gzipped JS, 7.39 kB gzipped CSS.
- Tests: `npm test` — 24 passing across 3 files.
