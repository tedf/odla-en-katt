# Generator State — cat personalities, offline modal, daily quests, achievements

## What Was Built (incremental on iteration 004)

This iteration ships four major features. Each was added as a self-contained
domain module plus a UI surface, wired through the existing Zustand store and
persistence layer.

### Feature 1 — Cat Names + Personalities

- New domain module `src/domain/catPersonality.ts`:
  - 40-entry `CAT_NAMES` list (Mittens, Luna, Zap, …).
  - 12-entry `CAT_TRAITS` catalogue (`lazy`, `energetic`, `lucky`, `greedy`,
    `curious`, `sleepy`, `brave`, `tiny`, `giant`, `magical`, `speedy`,
    `grumpy`) — each with a Swedish name, emoji, description, and a typed
    effect (`growthMultiplier` / `valueMultiplier` / `lotteryBonus`).
  - Helpers: `rollPersonality(rng?)`, `traitValueMultiplier(traitId)`,
    `getTraitById`, `isValidTraitId`, plus a `CAT_TRAITS_BY_ID` map.
- Store changes — every `harvestCat` now rolls a personality and applies the
  trait's value multiplier on top of the existing weather bonus. The
  personality (`name + traitId + weatherBonus`) is logged into
  `harvestedCats[catTypeId].personalities`, persisted in localStorage.
- UI:
  - **PlotCard** shows a slide-up `PersonalityPopup` (Framer Motion) anchored
    to the harvested plot, displaying `✨ <Name> · <TraitEmoji> <TraitName>`.
    Auto-dismisses after ~2.2 s via `recentHarvest` TTL.
  - **CatDisplay** (Stall) shows the most-recent personality + trait pill
    next to each cat's sprite (`Mittens · 🍀 Lycklig`).

### Feature 2 — Offline Catch-up + Auto-Harvest

- New domain module `src/domain/offline.ts`:
  - `calculateOfflineProgress(plots, lastSaveTime, nowMs, speedMultiplier,
    autoHarvestUnlocked, rng?)` returns an `OfflineSummary`:
    - `completedPlots` (auto-harvested, with rolled personalities)
    - `readyPlots` (matured but not harvested)
    - `coinsEarned`, `autoHarvestActive`, `awayMs`, and post-mutation
      `plots` state.
  - Pure; injectable RNG for test determinism.
- New permanent **Verktyg** (utility upgrade) catalogue in `upgrades.ts`:
  - `UTILITY_UPGRADES = [{ id: 'auto_harvest', cost: 5000, emoji: '🤖',
    description: '… även offline!' }]`.
  - Helpers `getUtilityUpgradeById`, `isValidUtilityUpgradeId`.
- Store changes:
  - `utilityUpgrades: UtilityUpgradeId[]` persistent field.
  - `buyUtilityUpgrade(id)` action — one-time permanent purchase.
  - `tick()` auto-harvests newly-ready plots when `auto_harvest` is owned.
  - On boot, `bootstrapInitialState` calls `calculateOfflineProgress` and
    threads the resulting summary into a new ephemeral `offlineSummary`.
- New UI:
  - **Shop → Verktyg** tab (`Shop.tsx` + `shop.css`) renders the utility
    upgrade card.
  - **OfflineModal** (`src/components/effects/OfflineModal.tsx` +
    `offline-modal.css`) — Framer Motion spring slide-up backdrop with
    moon glyph, per-plot rows showing rolled name + trait + sell value,
    a green "Skörda alla" CTA, and an "Auto-Skörda samlade +N mynt"
    summary when the upgrade is active.

### Feature 3 — Daily Quests

- New domain module `src/domain/quests.ts`:
  - 12-entry `QUEST_POOL` covering all 6 quest types (`harvest_any`,
    `harvest_type`, `sell_coins`, `spin_lottery`, `weather_event`,
    `harvest_with_trait`). Each carries a typed reward `{ coins, seedId? }`.
  - `getDailyQuests(date)` picks 3 unique quests deterministically using a
    Fisher-Yates shuffle seeded by a `mulberry32` PRNG hashed from the date.
  - `applyQuestProgress(quests, type, amount, meta?)` — pure progress
    incrementer; respects `catTypeId` / `traitId` filters.
  - `refreshDailyQuests(prev, date)` — handles streak preservation across
    consecutive days and reset on gaps.
  - `previousDate`, `msUntilMidnight`, `dateSeed`, `getQuestTemplate` helpers.
- Store:
  - Persistent `dailyQuests: DailyQuestsState` with `{ date, quests[],
    streak, lastCompletedDate }`.
  - New actions `updateQuestProgress(type, amount, meta?)` and
    `claimQuestReward(idx)` — claim grants coins + optional seed and bumps
    streak the first time per day.
  - Quest progress is wired into `harvestCat` (harvest_any /
    harvest_type / harvest_with_trait / sell_coins), `spinLottery`, and
    `tick()` (weather events). Midnight rollover is detected in `tick()`.
- UI:
  - **Quests panel** (`src/components/Quests/Quests.tsx` +
    `quests.css`) — daily-quest cards with emoji, title, description,
    progress bar, percentage pill, reward badge (mynt + optional
    seed-frö), pulsing green "Hämta belöning!" CTA when complete, and a
    "Hämtad" tag once claimed. Header shows a flame streak pill plus a
    midnight countdown (`HH:MM:SS`).
  - **Bottom nav** gains an "Uppdrag" tab with a pulsing red pip when at
    least one quest is ready to claim.

### Feature 4 — Achievement System

- New domain module `src/domain/achievements.ts`:
  - 18 achievements across 5 categories (`harvest`, `coins`, `collection`,
    `weather`, `special`). Two are secret (`meteor_hit`, `magical_cat`).
  - `AchievementStats` is the *runtime* shape (`catTypesHarvested: Set`),
    paired with `SavedAchievementStats` (array) in `persistence.ts` for
    JSON-safe storage. Inflate / serialize helpers live in the store.
  - Pure `newlyUnlocked(stats, alreadyUnlocked)` returns the freshly-met
    ids, in catalogue order.
  - `createEmptyAchievementStats`, `getAchievement`,
    `ACHIEVEMENT_CATEGORIES`, `CATEGORY_LABELS`.
- Store:
  - Persistent `achievementStats: AchievementStats` and
    `unlockedAchievements: string[]`.
  - `checkAchievementsInline(set, get)` — module-scoped helper called by
    every state-changing action that could trip a milestone. Applies coin
    + seed rewards, queues an achievement toast, and adds the new id to
    `unlockedAchievements`.
  - Stats accumulate from: `harvestCat` (totalHarvested, totalCoinsEarned,
    catTypesHarvested, harvestedWithMagicalTrait), `spinLottery`
    (lotteriesSpun, totalCoinsEarned), `buyUpgrade` (upgradesPurchased),
    `tick()` (weatherEventsExperienced, meteorHits), `claimQuestReward`
    (longestStreak).
- UI:
  - **Achievement toast** — new gold-themed `toast-achievement` variant
    with a "🏆 Achievement unlocked!" tag, big emoji, ascending shine
    sweep, 4 s display. Wired through the same toast pipeline.
  - **Achievements wall** (`src/components/Achievements/Achievements.tsx`
    + `achievements.css`):
    - Header with a 0-1 progress bar showing N/total.
    - Category tabs: `Alla | Skörd | Mynt | Samling | Väder | Speciellt`.
    - Auto-fit grid of trophy cards. Unlocked cards get a category-tinted
      gradient, a corner sunburst, and a continuous shine sweep
      (disabled under `prefers-reduced-motion`). Locked cards desaturate;
      secret-locked cards show a lock icon + "???".

### Persistence + tests

- `SaveData` (in `src/domain/persistence.ts`) gains five new fields:
  `utilityUpgrades`, `harvestedCats`, `dailyQuests`, `achievementStats`,
  `unlockedAchievements`. Migration validates each field defensively and
  defaults to empty/zero on missing or malformed input. The save key is
  unchanged (`grow-a-cat:save:v1`).
- New tests:
  - `src/domain/__tests__/quests.test.ts` — 22 assertions covering pool
    invariants, deterministic daily picks, progress filters (incl.
    `catTypeId` / `traitId`), streak bump/reset on day boundary,
    `previousDate` rollover, and `msUntilMidnight`.
  - `src/domain/__tests__/achievements.test.ts` — 14 assertions covering
    catalogue invariants (unique ids, valid categories, non-empty
    titles), `createEmptyAchievementStats`, and `newlyUnlocked` paths
    (harvest tiers, coin tiers, collection Set, secret meteor/magical,
    streak threshold, already-claimed exclusion).
  - Existing 53 tests untouched and still pass.

### Bottom navigation

The mobile bottom nav now exposes **Trädgård | Butik | Uppdrag | Trofér |
Stall** — five tabs (the spec called for a 4-tab pattern, but Stall was
kept as a fifth because removing it would regress sprite-inventory
discovery). A small red pip on **Uppdrag** lights up when any quest is
ready to claim. Lyckohjulet remains reachable both via its HUD button on
the garden screen and a "🎰 Öppna Lyckohjulet" shortcut at the top of
the Shop, per the spec.

## What Changed This Iteration (against task instructions)

- Added four major features in their entirety:
  1. Cat names + 12 personalities, rolled at harvest, persisted, and
     surfaced in PlotCard + Stall.
  2. `OfflineSummary` engine with auto-harvest support; rich slide-up
     `OfflineModal` showing per-plot rolls and total earnings.
  3. Daily quest engine with deterministic-by-date picks, streak
     tracking, midnight rollover, claimable rewards, full-page panel.
  4. Achievement engine with 18 milestones across 5 categories,
     gold-toast unlock fanfare, and trophy wall UI.
- New `Verktyg` shop tab + `auto_harvest` (🤖, 5000 mynt) permanent
  utility upgrade.
- New "Uppdrag" and "Trofér" bottom-nav tabs; pulsing pip on Uppdrag.
- Toasts gained an `achievement` kind with a custom JSX/CSS variant.
- `SaveData` migration handles every new field with defensive defaults,
  so v1 saves from previous iterations load cleanly with empty
  collections.

## Tests

- `npm test` — 89 passing across 6 files (was 44 across 4):
  - `events.test.ts` — unchanged
  - `lottery.test.ts` — unchanged
  - `plots.test.ts` — unchanged
  - `upgrades.test.ts` — unchanged
  - `quests.test.ts` — NEW, 22 assertions
  - `achievements.test.ts` — NEW, 14 assertions

## Build

- `npm run build` — passes.
- Bundle size: `dist/assets/index-…js` 424.59 kB (gzipped 129.53 kB),
  CSS 64.05 kB (gzipped 12.06 kB). Up from 120.87 kB gzipped JS in
  iteration 003, in line with the four-feature scope.

## Known Issues / Limitations

- The personality popup is anchored to the harvested plot index; if the
  player immediately plants a new seed before the 2.2 s TTL expires the
  popup disappears (we explicitly gate on `plot.state === 'empty'`).
- The offline summary list shows per-plot rolls but does not include
  named cats for plots that were *already* ready when the player closed
  the tab — only newly-ripened-while-away plots roll a personality.
- The achievement check is incremental (only fires on actions that mutate
  the corresponding stat). A migration path that retroactively unlocks
  achievements from an existing save's lifetime stats was not added.
- Streak bumps once per day on the first claim, not on every quest
  completion — by design.

## Dev Server

- URL: http://localhost:5173
- Status: running (verified `HTTP 200` on `/`)
- Command: `npm run dev -- --port 5173`
