# Evaluation Rubric: Grow a Cat

> Use this rubric to score the Generator's output. Each category produces a 0–10 score; final score is the weighted sum (max 10).

## Scoring Method

For each criterion below, assign a score from 0 to 10:
- **0–2**: Missing or broken
- **3–4**: Present but flawed
- **5–6**: Functional but unremarkable
- **7–8**: Polished and correct
- **9–10**: Genuinely impressive, exceeds spec

Final score = `(functionality * 0.40) + (visualDesign * 0.25) + (gameFeel * 0.20) + (codeQuality * 0.15)`

---

## 1. Functionality (weight: 0.40)

Test each item; the score reflects how many work correctly and how robustly.

### Core Loop
- [ ] Can plant Gräskatt from empty plot (free, infinite)
- [ ] Gräskatt grows in ~30 seconds (allow ±2s drift)
- [ ] Ready Gräskatt can be harvested for 10 coins
- [ ] Coin balance updates and persists

### All 8 Cat Types
Verify each is plantable (after unlock) and respects spec balance:
- [ ] Gräskatt — 30s, 10 coins, free seed
- [ ] Morotskatt — 2 min, 35 coins, 25-coin seed
- [ ] Blåbärskatt — 5 min, 80 coins, 60-coin seed
- [ ] Jordgubbskatt — 10 min, 150 coins, 110-coin seed
- [ ] Citruskatt — 15 min, 220 coins, 160-coin seed
- [ ] Regnbågskatt — 30 min, 500 coins, 350-coin seed
- [ ] Stjärnkatt — 1 hr, 1200 coins, 800-coin seed
- [ ] Rymkatt — 3 hr, 5000 coins, 3000-coin seed

(For testing high-tier cats, the Generator may expose a debug fast-forward; full real-time test optional but timer math must verifiably be correct.)

### Plot Unlocks (lifetime earned)
- [ ] Plot 2 unlocks at 200 coins earned
- [ ] Plot 3 unlocks at 800 coins earned
- [ ] Plot 4 unlocks at 3000 coins earned
- [ ] Plot 5 unlocks at 10000 coins earned
- [ ] Plot 6 unlocks at 50000 coins earned
- [ ] Unlock is celebratory (toast/modal, animation)

### Shop
- [ ] Seeds tab shows all 8 with prices and lock states
- [ ] Buying deducts coins, adds to seed inventory
- [ ] Locked seeds cannot be purchased
- [ ] Insufficient funds blocked with visible feedback

### Lottery
- [ ] Daily free spin available on first load
- [ ] Subsequent spins cost 50 coins
- [ ] Free spin resets at local midnight (verifiable by mocking date)
- [ ] Wheel has 8 sectors matching spec
- [ ] Weighted roll respects probabilities (Mythic Rymkatt NOT in lottery)
- [ ] Prize is awarded to inventory/wallet correctly

### Lightning Events
- [ ] Random events trigger during growth (not on empty plots)
- [ ] Bonus is +20% to +50% (rolled at strike time)
- [ ] ⚡ badge appears on affected plot
- [ ] Bonus applies to sell value at harvest
- [ ] Multiple strikes stack additively, capped at +100%

### Persistence
- [ ] State persists across page reload
- [ ] localStorage key matches spec (`grow-a-cat:save:v1`)
- [ ] Save schema includes version field
- [ ] Offline catch-up: closing tab and reopening recomputes growth correctly
- [ ] "While you were away" recap modal shows after meaningful absence

### Robustness
- [ ] No console errors during normal play
- [ ] No crashes on rapid clicks, multiple harvests, etc.
- [ ] Tab visibility change doesn't break timers

---

## 2. Visual Design (weight: 0.25)

### Kawaii Identity
- [ ] Cats are custom SVG/CSS — no clipart, no stock images
- [ ] Each of the 8 cats has a distinct, recognizable visual identity
- [ ] Rarity is communicated visually (palette, shimmer, glow)

### Palette and Typography
- [ ] Uses pastel palette from spec (peach/lavender background, sakura pink primary)
- [ ] Avoids purple-to-blue gradient cliché
- [ ] Avoids pure black text (uses deep plum)
- [ ] Fredoka + Nunito (or equivalent rounded display + readable body)
- [ ] Tabular numerals on coin/timer displays

### Layout
- [ ] Garden is the visual hero, not buried in a sidebar
- [ ] Plots feel dimensional (depth, shadow, lip) — not flat tiles
- [ ] HUD, shop, lottery feel like one cohesive system
- [ ] Mobile layout is genuinely redesigned, not just squished desktop

### Anti-Template
- [ ] Does not look like default Tailwind/shadcn/Material
- [ ] Speech bubbles and tooltips have character (tails, varied shapes)
- [ ] Buttons have layered surfaces (face + 3D base), depress on click
- [ ] Sparkle particles and visual flourishes are present

---

## 3. Game Feel (weight: 0.20)

### Feedback
- [ ] Harvest produces sparkle burst + count-up coin number
- [ ] Coin counter ticks with bounce, not instant jump
- [ ] Plant action has a satisfying micro-animation (seed sinking, sparkles)
- [ ] Buttons depress (transform) on click

### Animation Quality
- [ ] Modals/sheets use spring physics (Framer Motion), not linear ease
- [ ] Plot growth shows 3 distinct visual stages, not a generic progress bar
- [ ] Ready cats have a bounce or glow that draws the eye
- [ ] Lottery wheel decelerates believably (not linear, not jerky)
- [ ] Idle cats have a subtle wiggle loop

### Surprises
- [ ] Lightning event feels like a delightful surprise
- [ ] Plot unlocks feel celebratory (confetti, toast, sparkle)
- [ ] Lottery prize reveal has buildup and payoff

### Accessibility & Restraint
- [ ] Respects `prefers-reduced-motion`
- [ ] Animations never block interaction
- [ ] Visual feedback works without sound (game is sound-less by design)

---

## 4. Code Quality (weight: 0.15)

### Architecture
- [ ] `src/domain/` exists and contains pure logic (no React imports)
- [ ] Domain layer is importable in Node test runner
- [ ] Zustand (or equivalent) is the bridge between domain and UI
- [ ] UI components do not duplicate domain constants

### TypeScript
- [ ] Strict mode enabled (`"strict": true`)
- [ ] No `any` leaks in domain layer
- [ ] Cat types, prices, thresholds in a single typed source of truth

### File Hygiene
- [ ] Files under 400 lines (max 800)
- [ ] Functions under 50 lines
- [ ] Organized by feature (garden/, shop/, lottery/), not by file type

### Persistence
- [ ] Save schema is versioned with migration hook
- [ ] Save/load functions handle missing or malformed data gracefully

### Tests
- [ ] At least lottery weighted roll, plot growth, and unlock logic have unit tests
- [ ] Tests run cleanly (no flakes, no console noise)

### Build
- [ ] `pnpm build` (or equivalent) succeeds with no errors
- [ ] No unused dependencies in package.json

---

## Disqualifiers (auto-fail to score ≤ 3)

- App does not run / blank page
- Cats are stock images, emoji-only, or clipart
- localStorage save is not implemented at all
- Generic purple-to-blue gradient background dominates
- Core loop is broken (cannot harvest a single cat)
- TypeScript not used or set to non-strict with `any` everywhere

---

## Output Format

The Evaluator should return:

```json
{
  "scores": {
    "functionality": 0,
    "visualDesign": 0,
    "gameFeel": 0,
    "codeQuality": 0
  },
  "weightedTotal": 0.0,
  "highlights": ["..."],
  "issues": [
    { "severity": "CRITICAL|HIGH|MEDIUM|LOW", "area": "...", "description": "..." }
  ],
  "recommendation": "ship | revise | rework"
}
```

- `ship`: weightedTotal ≥ 8.0 and no CRITICAL issues
- `revise`: weightedTotal 6.0–7.9, or one HIGH issue
- `rework`: weightedTotal < 6.0 or any CRITICAL issue
