# Generator State — speed upgrades are time-limited consumables

## What Was Built (incremental on iteration 003)

### Feature — speed upgrades become time-limited consumables

Previously, the four speed upgrades (Gödselvatten / Magisk Jord /
Trollformelsfrö / Tidsmagi) were permanent unlocks: buying tier N hid
all lower tiers from the shop. They are now **one-shot consumables**
with a per-tier active duration. Only one boost can be active at a
time, and re-buying replaces the current boost (resets the timer and
swaps the multiplier).

#### Updated catalogue — `src/domain/upgrades.ts`

| id        | name           | cost  | multiplier | duration |
| --------- | -------------- | ----- | ---------- | -------- |
| `speed_1` | Gödselvatten   | 50    | 1.5x       | 30 min   |
| `speed_2` | Magisk Jord    | 200   | 2.0x       | 1 timme  |
| `speed_3` | Trollformelsfrö| 800   | 3.0x       | 2 timmar |
| `speed_4` | Tidsmagi       | 4000  | 5.0x       | 4 timmar |

The `SpeedUpgrade` interface gains `durationSeconds` and `emoji`. The
old `activeSpeedMultiplier(purchasedIds)` and `nextAvailableUpgrade()`
helpers are removed and replaced with:

- `makeActiveUpgrade(upgradeId, now)` — builds an `ActiveSpeedUpgrade`
  record `{ upgradeId, multiplier, expiresAt }` from a clock value.
- `activeMultiplier(active, now)` — returns the live multiplier (or 1
  if `active === null` / expired).
- `pruneExpired(active, now)` — returns the upgrade if still live,
  else `null`. Used by the store on load and on every tick.
- `isValidUpgradeId(s)` — narrow type guard used by the save migration.

#### Store changes — `src/store/useGameStore.ts`

- New persisted field `activeSpeedUpgrade: ActiveSpeedUpgrade | null`.
  Legacy `purchasedUpgrades: SpeedUpgradeId[]` is retained for save
  back-compat but is now always serialized as `[]`.
- `buyUpgrade(id)` now:
  - Deducts coins (no "already owned" guard — re-buys are allowed).
  - Sets `activeSpeedUpgrade = makeActiveUpgrade(id, now)`.
  - If a boost was already live, surfaces a "Ersatte föregående
    boost" toast; otherwise a normal activation toast.
- `tick()` prunes the expired upgrade *first* and uses the post-prune
  multiplier for the growth math. The first tick after a boost expires
  pushes a friendly toast ("⏰ Tidsmagi har tagit slut") and persists.
- Offline catch-up on load uses the live multiplier if the saved boost
  has not yet expired by `now`; expired boosts contribute 1x. (Strict
  partial-window accounting was intentionally skipped.)

#### Persistence — `src/domain/persistence.ts`

- `SaveData` adds `activeSpeedUpgrade: ActiveSpeedUpgrade | null`.
- Migration reads the field, validates each property with
  `isValidUpgradeId` + finite-number checks, and drops the record if
  `expiresAt <= now` (so timer-elapsed-while-offline restarts correctly).
- `purchasedUpgrades` is migrated to `[]` regardless of input — legacy
  permanent purchases are not converted into a live boost.

#### Shop UI — `src/components/Shop/Shop.tsx` + `shop.css`

- The "Uppgraderingar" tab now ships two banner states:
  - **Empty state** — dashed-border card with `⚡ Ingen aktiv boost` +
    helper text inviting the player to buy a flask.
  - **Active state** — a tier-coloured gradient banner with:
    - Large boost emoji in a circular frame on the left.
    - `AKTIV` pill, name + multiplier chip.
    - Big tabular-numerals countdown (`M:SS` or `H:MM:SS`).
    - 6px progress bar showing elapsed fraction (transitions smoothly).
    - A slowly rotating conic-gradient sheen for atmosphere (disabled
      under `prefers-reduced-motion`).
  - The banner animates in / out via `framer-motion` `AnimatePresence`
    so swapping boosts feels intentional.
- All four upgrade cards are always purchasable. The buy button now
  shows a contextual label:
  - `Starta om` when the same boost is currently active.
  - `Byt boost` when a different boost is active.
  - No label (just the coin cost) when nothing is active.
- A local `useEffect` interval ticks the countdown every second; the
  interval is cleared when no boost is active.
- A small emoji is shown next to each upgrade name in the card list.

#### HUD chip — `src/components/HUD/HUD.tsx` + `hud.css`

- The pre-existing `⚡Nx` chip is replaced by a richer pill that
  shows the upgrade emoji, the multiplier, and the live countdown:
  `💧 1.5x · 12:34`. It pulses gently to flag that something is on a
  timer; the animation respects `prefers-reduced-motion`.
- The HUD's per-second clock is throttled to 1s while a boost is
  active and 5s otherwise (lottery pip refresh).
- `formatCountdown(ms)` is exported from `HUD.tsx` for parity with the
  shop banner.

#### Garden / PlotCard wiring

- Both components now read `activeSpeedUpgrade` and compute
  `speedMult = activeMultiplier(activeSpeedUpgrade, now)`. PlotCard
  re-uses its existing per-250ms `now` interval. Garden adds its own
  1s ticker (only while a boost is active) to keep the heading chip
  accurate.

#### Tests — `src/domain/__tests__/upgrades.test.ts`

Rewritten for the new model. 11 assertions across:

- Catalogue invariants (4 tiers; strictly increasing cost, multiplier,
  duration; emoji present).
- Exact spec values for cost / multiplier / `durationSeconds`.
- `activeMultiplier` boundaries: `null`, mid-window, 1ms before
  expiry, exact expiry, post-expiry.
- `pruneExpired` returns the record while live and `null` once expired.
- `makeActiveUpgrade` computes correct `expiresAt` and returns `null`
  for unknown ids.
- `isValidUpgradeId` accepts the four known ids and rejects others.

## What Changed This Iteration (against task instructions)

- `SPEED_UPGRADES` now has `cost: 50/200/800/4000` (was
  `100/500/2000/10000`) and `durationSeconds: 1800/3600/7200/14400`.
- Per-tier `emoji` and `description` text now match the task spec
  exactly (`💧 / ✨ / 🔮 / ⏰`, "1.5x hastighet i 30 min", etc.).
- Store state migrated from `purchasedUpgrades: string[]` to
  `activeSpeedUpgrade: ActiveSpeedUpgrade | null` while keeping a
  legacy `purchasedUpgrades` field on `SaveData` for back-compat.
- `buyUpgrade` allows re-purchase; same-or-different tier replaces the
  current boost (resets the timer).
- `tick()` auto-expires the boost and pushes an expiry toast.
- Shop UI: prominent active banner with countdown + progress bar; all
  cards remain purchasable; contextual `Starta om` / `Byt boost`
  button labels.
- HUD: chip now shows emoji + multiplier + countdown together.
- Persistence: validates `activeSpeedUpgrade` on load and drops it if
  already expired.
- Tests rewritten — 44 tests passing across 4 files (was 39).

## Known Issues

- Offline catch-up math is approximate: if a boost expired *during*
  the away window, we treat the whole away window as un-boosted. This
  was a deliberate KISS choice; a strict implementation would split
  the away window into "boosted" and "post-expiry" segments and apply
  the multiplier to only the first segment.
- The expiry toast fires on the first tick *after* `expiresAt`, which
  in practice is within 1 second of the real expiry (tick cadence).
  Visually, the HUD chip and shop banner already disappear at the
  exact second `expiresAt` is reached because they read `now` directly.

## Dev Server

- URL: http://localhost:5173
- Status: running
- Command: `npm run dev -- --port 5173`
- Build: `npm run build` passes — 120.87 kB gzipped JS, 8.83 kB gzipped CSS.
- Tests: `npm test -- --run` — 44 passing across 4 files.
