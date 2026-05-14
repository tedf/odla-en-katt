# Grow a Cat — UX Audit (1440x900 desktop + 375x812 mobile)

Captured: 13 screenshots in `gan-harness/screenshots/ux-audit/`.
Test build: `http://localhost:5173` (live dev).

---

## 1. First-impression snapshot

The 3-panel desktop layout works conceptually, but the page-wide orange-pink-magenta gradient that fills every gap between cards is doing far too much work and is the single largest "AI-slop" tell on the page. It bleeds through every section gutter (visible on `desktop-1440-initial.png`, `desktop-shop-sell.png`, `desktop-lottery.png`, and the mobile full-page screenshot) and makes the otherwise quite-pleasant cream `--color-surface-warm` cards feel marooned. Sub-panels like Mina fron with only one item leave 60% of the panel showing raw gradient.

Other immediate problems:
- Plot cards (especially locked ones) waste 50-60% of their vertical space.
- The lottery wheel labels overlap and become unreadable on some segments.
- Kattpedia is a wall of identical grey "??? Okand katt" silhouettes with effectively no information density.
- The "0/3 klara" + reward chip + "0%" + empty progress bar inside each quest is FOUR redundant zero-state indicators.

---

## 2. Layout and spacing issues (with selectors + measured values)

### 2.1 Plot card internal spacing — too much, in the wrong places
- File: `src/components/Garden/garden.css`
- Selector: `.plot-card` (lines 172-189) — `padding: 14px 12px 16px;` plus `display: grid; place-items: center;` and `min-height: 200px` (line 90) / `210px` at 1280+ (line 101).
- Inside, `.plot-inner` (lines 248-259) adds ANOTHER `padding: 6px` on top of the outer 14/12/16. That stacks to ~20px on each side before any content.
- Locked plot content (`.plot-locked`, lines 296-304) is only ~120px tall (40px lock icon + 6px gap + ~18px price + ~14px sub-label). On a 210px-tall card, that leaves ~85px of empty soil gradient.
- Fix: drop `.plot-card` `min-height` to ~150-160px when the card is `.locked`, or re-layout locked cards to show price + a tiny progress meter ("8 / 200 mynt") so they don't look identical except for the number. Concrete patch:
  ```css
  .plot-card.locked { min-height: 150px; padding: 12px; }
  .plot-card.locked .plot-locked { gap: 8px; }
  ```

### 2.2 Garden grid gap too generous given the soil colour
- Selector: `.garden-grid` (lines 62-67, 82-103). At 1440 desktop it's `gap: 20px; padding: 18px;` (lines 94-99).
- The 20px gap is fine on light surfaces, but here every gap reveals the orange-to-pink page gradient between purple-tinted locked plots — it visually fragments the grid.
- Fix: Wrap `.garden-grid` in a softer panel surface. Add a subtle inner card:
  ```css
  .garden-section { background: var(--color-surface-warm); border-radius: var(--radius-lg); }
  ```
  Or reduce gap to 12px at 1440 and add `background: rgba(255,255,255,0.4); border-radius: 18px;` to `.garden-grid`.

### 2.3 Center panel "Sell" tab (`Mina fron`) is 80% empty gradient
- File: `src/components/Shop/Shop.tsx` (lines 123-145) renders just `Graskatt | Obegransat | infinity` in `.shop-stall-row`.
- The `.shop-list` (`shop.css` line 48) is `flex-direction: column` with no min-height, so the single row leaves the rest of the panel showing the body gradient.
- Fix: Give `.panel-center` (or the `.section-card` inside it) a continuous warm background that doesn't disappear when content is short. Add to `App.css` near `.section-card`:
  ```css
  .panel-center .section-card { min-height: 100%; }
  ```
  Plus an empty-state illustration when only Graskatt is owned: "Skorda och salj sallsynta katter for att fylla ditt stall."

### 2.4 Desktop right column (`.panel-right`) too narrow
- File: `src/App.css` lines 171, 216: `grid-template-columns: minmax(0, 1fr) minmax(360px, 0.8fr) minmax(240px, 0.55fr);` then `minmax(280px, 0.55fr)` at 1280+.
- At 1440 the right rail is ~260px. SideStats content (font-size 1.1rem stat values, 0.9rem labels) is cramped — labels truncate or wrap to 2 lines.
- Fix: Bump to `minmax(300px, 0.6fr)` at the 1280+ breakpoint and `minmax(280px, 0.55fr)` at 900-1279, while reducing the center column max:
  ```css
  /* App.css line 171 */
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.78fr) minmax(280px, 0.5fr);
  /* line 216 */
  grid-template-columns: minmax(0, 1.15fr) minmax(380px, 0.78fr) minmax(300px, 0.5fr);
  ```

### 2.5 Section-card padding doubles up inside the center panel
- `.section-card` (`App.css` line 414) has `padding: var(--space-lg);` (= 1.5rem = 24px).
- `.panel-center-content` adds `padding-right: 4px;` (line 309), and `.shop-list` adds its own `gap: 8px;`. Net effect: outer 24px + inner card spacing = a lot of inner space, which is why seed cards feel like they're floating with airy whitespace on three sides.
- Fix: Use `--space-md` (16px) for `.section-card` inside the center column, keep `--space-lg` only on the Quests/Achievements panels where it earns its keep.

### 2.6 Mobile bottom tabbar — 5 tabs at 375px is jammed
- File: `src/App.css` line 332+. At 375px each tab gets ~70px including 12px gap; `font-size: 0.9rem` on `.app-tabbar button` (line 356). Visible in `mobile-375-garden.png` — labels (Tradgard, Trofer) are right at the edge of overflow.
- Fix: Already partially handled at `max-width: 420px` (line 398) by dropping to `font-size: 0.74rem`. Apply the same compression at `max-width: 480px` to give breathing room at 375-420. Consider iconography under the label.

### 2.7 Desktop tab bar wraps the "Speciellt" filter onto a second row
- Visible in `desktop-achievements.png`: the rarity-filter pill "Speciellt" sits on a new row by itself, while Alla / Skord / Mynt / Samling / Vader fit on row 1.
- File: `src/components/Achievements/achievements.css` line 60+. Filter pills use `flex-wrap: wrap; gap: 8px;`. At the center panel's ~430px usable width and pill font-size 0.85rem with `padding: 6px 12px 7px`, 6 pills won't fit.
- Fix: Either reduce padding to `5px 10px 6px`, or use a `flex: 1 1 auto` row that scrolls horizontally with `overflow-x: auto; -webkit-overflow-scrolling: touch;` and `scroll-snap-type: x mandatory`.

### 2.8 Quest cards have a redundant "0%" pill next to the progress bar
- File: `src/components/Quests/Quests.tsx` and `quests.css`. Visible in `desktop-quests.png`.
- A 0% pink chip sits to the right of the reward; below it the explicit `0/2` and an empty bar already communicate progress. Three of the same datum.
- Fix: Drop the `0%` chip (or use it only when progress > 0). Keep the bar + `0/2` since they're complementary.

---

## 3. Visual hierarchy issues

### 3.1 Locked plots are visually heavier than unlocked plots
- The lock icon (`.plot-locked .lock-icon`, garden.css line 306) is a 40px white circle with bright box-shadow; the price text below is bold and prominent. On a fresh page with 1 active plot and ~17 locked plots, the eye lands on the locks, not the action.
- Fix: Decrease the prominence of locked plots: drop `.lock-icon` to 28x28, change background to `rgba(255,255,255,0.6)` instead of opaque white, and add `opacity: 0.65` to `.plot-card.locked`.

### 3.2 The "Plantera fro" plus button is not loud enough to win against the soil background
- `.plus-circle` (garden.css 270-283): 56x56, white circle, primary pink "+". Looks fine, but inside a saturated brown soil card the contrast is muted.
- Fix: Add a pulsing halo (already used for `.plot-ready-cta`):
  ```css
  .plot-card:not(.locked):not(.is-ready) .plus-circle {
    animation: empty-plot-pulse 2.4s ease-in-out infinite;
  }
  @keyframes empty-plot-pulse {
    0%,100% { box-shadow: 0 4px 0 rgba(58,45,79,0.15), 0 0 0 0 rgba(255,143,163,0.5); }
    50%    { box-shadow: 0 4px 0 rgba(58,45,79,0.15), 0 0 0 10px rgba(255,143,163,0); }
  }
  ```

### 3.3 Rarity colours read as decoration, not hierarchy
- Seed cards (shop.css 67-101): 5px left stripe in pastel rarity colour. The pastels (`#c8e6c9` common, `#b3e5fc` uncommon, `#d1c4e9` rare) are so similar and low-saturation that on a casual glance there's no visible difference.
- Kattpedia "VANLIG" green chip vs "OVANLIG" blue chip — both pastel, both at `font-size: 0.66rem; padding: 3px 10px;` (kattpedia.css 181-185). They communicate but barely register.
- Fix: Step up saturation for the chip backgrounds and bump font-size to 0.72rem with `font-weight: 700; letter-spacing: 0.1em`. Replace single 5px stripe on `.seed-card` with a corner ribbon or a left-edge gradient (16px wide, fading to transparent) so the rarity bleeds visually into the card.

### 3.4 Lottery wheel — biggest payouts disappear into the rim
- `LotteryWheel.tsx` lines 272-283: `fontSize="11"` on the SVG text, truncated at 12 chars. "Morotsraddari blubbsr..." appears as a meaningless string in `desktop-lottery.png` and the curved orientation makes the text hard to parse.
- Fix: Drop the truncate (12 -> 9 chars), bump SVG `fontSize` to 12, and reserve labels for amounts only. Move prize titles (Mysteriefro, Morotsraddare) to a legend below the wheel. Alternatively, rotate each label tangentially with a max-width:
  ```tsx
  fontSize="12"
  letterSpacing="-0.02em"
  ```
  and use two `<text>` lines per sector ("100" on top, "mynt" below).

### 3.5 Kattpedia — locked cards have no hierarchy
- All locked cards show the identical `?` silhouette. The only distinguishing data is the rarity chip.
- Fix: Add a one-line teaser (e.g. "Las upp vid 500 mynt" or "Salj 3 Graskatter") to every locked card, even when the unlock condition isn't yet visible. Source the data from `CAT_TYPES[id].unlock` (already inspected at `Shop.tsx` line 668). Add to `kattpedia.css`:
  ```css
  .kattpedia-card.is-locked .kattpedia-card-hint {
    font-size: 0.7rem;
    color: var(--color-text-mute);
    line-height: 1.3;
  }
  ```

### 3.6 The page background gradient overwhelms every component
- The orange-pink-magenta SkyBackground vignette (visible bleeding through gutters and below short panels) is too saturated to function as a neutral page surface. It competes with the pink primary brand colour, the yellow coin, and the warm cream cards.
- Fix: Add a translucent cream blanket behind `.app-body` to soften the gradient, OR desaturate `--color-sky-bottom` from `#f3dff2` and the implicit sunset stops. A `radial-gradient` keeping the orange only in the top 30% of the viewport, then fading to `var(--color-surface-warm)` for the lower 70%, would calm the entire page.

---

## 4. Clarity and legibility issues

### 4.1 Sub-labels under prices are tiny and decorative
- `.plot-locked-sub` (garden.css 325-328): `font-size: var(--text-micro)` = **0.7rem ~ 11.2px**, colour `var(--color-text-soft)` (#6c5b8a) on the lavender locked plot background.
- That falls below the 12-14px minimum body legibility threshold and the contrast (~4.3:1 against the light lavender) is borderline.
- Fix: Bump to 0.78rem and darken to `var(--color-text)`:
  ```css
  .plot-locked-sub { font-size: 0.78rem; color: var(--color-text); font-weight: 600; }
  ```

### 4.2 Progress bars are too thin
- `.plot-bar` (garden.css 368-375): `height: 6px;`. `.garden-unlock-bar` (line 141): `height: 8px;`. Quest progress bars look similar.
- 6px is fine ornamentally but the empty state (`background: rgba(0,0,0,0.08)`) is barely a hairline against the warm card; at 0% fill it disappears.
- Fix: Use `height: 8px;` everywhere, and add a 1px inner shadow so the empty track is always visible:
  ```css
  .plot-bar { height: 8px; box-shadow: inset 0 1px 2px rgba(58,45,79,0.08); }
  ```

### 4.3 Tab pill text loses contrast in the inactive state
- `.tab-pill` (`App.css` line 261): inactive colour `var(--color-text-soft)` (#6c5b8a) on `background: rgba(255,255,255,0.6)`. Against the orange page gradient BEHIND a 60% white pill the effective background is roughly `#f6d2bc`, giving a measured contrast ratio of ~4.0:1 — just below WCAG AA for normal text.
- Fix: Raise the `.desktop-tab-bar` background opacity to `0.85` or darken inactive tab text to `var(--color-text)`:
  ```css
  .desktop-tab-bar { background: rgba(255,255,255,0.82); }
  .tab-pill { color: var(--color-text); }
  ```

### 4.4 SVG wheel labels overlap and are illegible on long prize names
- See 3.4 above. Add: `desktop-lottery.png` shows a slice rendering "Morotsraddari blubbsr/Drgubbsr 1000 mynt" — the prize-label string from sectors collides because they're not collision-tested.

### 4.5 The HUD coin badge is too small relative to its importance
- Visible at top of `desktop-1440-initial.png` and inside the Shop header (`shop.css .shop-balance` 9-20): `padding: 6px 12px;` and a small coin icon. For the game's primary resource, it's no louder than a button.
- Fix: Use `--text-coin` (clamp 1.75-2.5rem from tokens.css line 53) on the HUD coin number, and let the SideStats version stay compact.

### 4.6 Touch target size on filter pills, sub-tabs, and lottery hub
- `.shop-tabs button` (shop.css 31-40): `padding: 8px 12px;` with font-size 0.9rem ~ 33px tall. Below the 44px minimum.
- `.kattpedia-rarity-badge`: 3px 10px padding ~ 18px tall — never tappable; OK if purely informational.
- Fix: Raise `.shop-tabs button` to `padding: 10px 14px 11px;` and `min-height: 44px;` on mobile (`@media (max-width: 899px)`).

### 4.7 Mobile header text — "EN MYSIG KATTRADGARD" is illegible
- `.app-branding-sub` (`App.css` 129-135) is uppercase, 0.825rem, weight 600, letter-spacing 0.04em, in `var(--color-text-mute)` (#9a8eb0). Visible in `mobile-375-initial.png` overlapping the bright orange header background — contrast ~2.8:1.
- Fix: Hide subtitle below 480px or darken to `var(--color-text-soft)` and add a subtle text-shadow:
  ```css
  @media (max-width: 480px) {
    .app-branding-sub { display: none; }
  }
  ```

---

## 5. Consistency issues

### 5.1 Border-radius drift
Used values across the codebase:
- `--radius-xs: 6px`, `--radius-sm: 10px`, `--radius-md: 16px`, `--radius-lg: 22px`, `--radius-pill: 999px` (tokens.css 61-65).
- BUT: `.kattpedia-card { border-radius: 18px; }` (kattpedia.css 95) — hard-coded
- `.plot-card::before { border-radius: 18px; }` (garden.css 212) — hard-coded
- `.achievement-emoji { border-radius: 16px; }` is fine (it's `--radius-md`).
- `.kattpedia-card-sprite::after` uses 50%.
- Fix: Replace all `border-radius: 18px;` with `var(--radius-lg)` (22px) or introduce `--radius-card: 18px;` if 18 is the intended value. Audit grep for `border-radius: \d+px` and align everything to tokens.

### 5.2 Shadow depths inconsistent
- `--shadow-card`, `--shadow-plot`, `--shadow-button`, `--shadow-floating` are defined (tokens.css 67-84) — good.
- BUT components freely create one-off shadows:
  - `.desktop-tab-bar` (App.css 247): custom `inset 0 2px 0 ..., 0 4px 12px -4px ...`
  - `.shop-tabs button.active`: `0 2px 8px rgba(58,45,79,0.15)` (shop.css 45) — bespoke
  - `.kattpedia-card`: `inset 0 1px 0 ..., 0 4px 12px -6px ...` (kattpedia.css 102-104)
  - `.achievement-card`: `0 1px 0 ..., 0 8px 18px -12px ...` (achievements.css 105-107)
- Fix: Define `--shadow-tile` and `--shadow-tab-active` tokens; replace ad-hoc shadows.

### 5.3 Card backgrounds inconsistent
- Seed card: `var(--color-surface)` (#ffffff).
- Kattpedia card: gradient `rgba(255,255,255,0.85) -> rgba(255,245,234,0.95)`.
- Achievement card: `white` with category gradient overlays.
- Quest card / shop upgrade card: warm cream from `.section-card`.
- Fix: Pick one "tile" surface (e.g. solid white with a 1px warm border) and apply it uniformly; reserve gradients for the UNLOCKED-state treatment.

### 5.4 Color usage drift
- The page header uses an orange-pink gradient sky.
- The HUD bar background is white with a yellow coin.
- The center panel uses a warm cream card.
- The seed card row "Gratis infinity" pill uses green.
- The lottery "Snurra gratis!" button uses pink primary.
- Calls to action are inconsistent between green (Gratis) and pink (Snurra).
- Fix: Reserve green for "available/free" (and only the `Gratis` chip), use pink for the PRIMARY CTA in each panel, use coin yellow for purchases. Document in a comment in `tokens.css`.

---

## 6. Specific problem areas — detail

### 6.1 Plot card internal spacing
- Selector chain: `.garden-grid .plot-card` (1 / 1 aspect ratio dropped at >=900px in favour of `min-height: 200/210px`).
- Outer padding `14/12/16` + `.plot-inner` 6px padding + 10px gap.
- Empty state (visible in `plot-card-close.png`): contents are `plus-circle (56) + 4px gap + label (~16)` = 76px stacked content centered in a 210px-tall card. **134px wasted vertically**.
- Locked state: `lock-icon (40) + 6px + threshold (~19) + sub (~14)` = 79px. **131px wasted vertically**.
- Fix: Pre-cited in 1.1. Additionally, fill the wasted space with a tiny "what unlocks here" pictogram or the next cat silhouette outlined behind the lock — useful and atmospheric.

### 6.2 Shop panel readability on desktop
- Panel width clipping per `App.css` line 171: `minmax(360px, 0.8fr)` ~ 430-470px at 1440 viewport.
- `.seed-card` (shop.css 60): `grid-template-columns: 64px 1fr auto` with 10px 12px padding. The "Graskatt VANLIG" line has weight 700 name + small VANLIG chip — chip floats next to the name, looks like ALL CAPS metadata rather than a category badge.
- Fix: Move the rarity chip to a second line under the cat name (already minor at this width), and make the buy-action area (`auto` column on the right) reserve at least 88px so "Gratis infinity" and "1000 mynt" buttons don't size differently across rows.

### 6.3 Lottery wheel prize display
- Already discussed in 3.4 & 4.4. Additional fix: the gold rim circle (`circle r={r+6} fill="#3a2d4f"`) is purely decorative — at the wheel's ~280px diameter that becomes a 12px dark band. Replace with a subtle 4px ring so labels have more room:
  ```tsx
  // LotteryWheel.tsx line 236
  <circle cx={cx} cy={cy} r={r + 4} fill="#3a2d4f" />
  ```

### 6.4 Achievement cards in grid
- 2-column grid at 474px panel width (`minmax(200px, 1fr)` + 12px gap -> exactly 2 cards). At narrower panels (<=420px) it collapses to 1 col (line 266-268).
- The "category accent" — coloured border for unlocked harvest/coins/etc. categories — works visually. But the `desktop-achievements.png` shows ALL achievements as locked-style (greyed, no accent). Locked achievements have nothing differentiating them except text — the visual hierarchy collapses.
- Fix: Show a small category icon-chip on locked cards in their category colour at 30% opacity, so the user still grasps the category split before unlocking.

### 6.5 Kattpedia card layout
- `desktop-kattpedia.png` shows 22 identical locked cards with only the rarity chip varying. This is the largest "AI-generated dashboard" tell on the page.
- Fix:
  1. Show a silhouette SHAPE hint per cat (a chubby outline vs a tall outline vs a tiny outline).
  2. Add unlock-condition teaser under each locked card (see 3.5).
  3. Group by rarity with section headers ("Vanlig 1/3", "Ovanlig 0/4", ...) instead of a flat grid.
  4. Use the rarity colour as the silhouette's accent tint (e.g. `<circle fill="rgba(168, 197, 255, 0.35)">` for ovanlig).

---

## 7. Mobile-specific (375x812)

- Header takes 60+ px before the user sees any game element. At 812 viewport height that's 7%.
  - Compact header to one row: small logo + game title only. Move sound + animation toggles into a settings sheet behind a gear icon.
- HUD card height ~130px (coin + tagline + Butik + Lyckohjulet). Cuts garden visibility to the first row.
- Bottom tabbar consumes ~70px — 5 buttons.
- Net: garden has ~480px of vertical space, ~3 plot cards tall, which is fine, but combined with the HUD it pushes the third row off-screen on first paint.
- Fix: Collapse HUD into a sticky 56px bar with just `mynt | Butik | Hjulet` icons. Move "Nasta ruta oppnas vid 200 mynt" to the bottom of the Garden section where the unlock progress already lives.

---

## 8. Top 10 fixes by impact

| # | Fix | File / Selector | Impact | Effort |
|---|-----|-----------------|--------|--------|
| 1 | Replace page gradient with localised sunset (top 30% only, then warm cream) so panels don't sit on raw rainbow | `App.css` `.app-shell::after` / `SkyBackground.tsx` | Removes the dominant AI-slop tell; lifts perceived quality across EVERY screenshot | Medium |
| 2 | Locked plot card visual hierarchy + min-height reduction | `garden.css` `.plot-card.locked`, `.plot-locked` | Garden goes from "wall of locks" to "1 active + 17 quiet placeholders"; recovers ~30% screen real estate | Low |
| 3 | Kattpedia: silhouette differentiation + unlock teaser + rarity grouping | `Kattpedia.tsx`, `kattpedia.css` | Turns identical-card-wall into a real collection tease; biggest single content-quality lift | Medium |
| 4 | Lottery wheel labels: drop curving + truncation, use 2-line straight labels, move long titles to legend | `LotteryWheel.tsx` lines 265-286 | Wheel becomes readable; right now it looks broken | Medium |
| 5 | Empty-state design for `Mina fron` and any panel with one row | `Shop.tsx` `tab === 'stall'` + `.panel-center .section-card { min-height: 100%; }` | Removes the giant gradient-fills-the-panel issue on the Sell tab | Low |
| 6 | Consolidate redundant quest progress indicators (drop 0% chip when progress is 0) | `Quests.tsx`, `quests.css` | Cleaner card; saves ~8% of card width | Low |
| 7 | Rarity badge saturation + contrast bump | `kattpedia.css` `.kattpedia-rarity-badge.*`, `shop.css` `.seed-card.rarity-*` | Rarity becomes scannable in 0.3s instead of 2s | Low |
| 8 | Sticky compact mobile header (remove subtitle, fold toggles into gear menu) | `App.tsx` `<header>`, `App.css` `.app-header` | Adds ~80px of viewport — third garden row appears above the fold | Medium |
| 9 | Token-ize shadows and radii; replace `border-radius: 18px;` and one-off shadows with tokens | `kattpedia.css`, `garden.css`, `achievements.css`, `tokens.css` | Cross-component consistency; future-proofs theming | Low |
| 10 | Tab pill contrast bump (active panel-tab background opacity 0.82, inactive text to `--color-text`) | `App.css` `.desktop-tab-bar`, `.tab-pill` | WCAG AA pass on primary navigation | Low |

---

## 9. What is genuinely good (so the next iteration doesn't break it)

- The seed card 5px rarity stripe with a faint per-rarity gradient on legendary/mythic is a tasteful touch — keep it (`shop.css` lines 67-101).
- The drop-shadow stack (`shadow-button` with a flat colour shadow + a soft blur shadow) gives buttons proper depth without looking generic.
- The phase-chip with per-phase gradients (`App.css` 62-84) is a strong, opinionated detail.
- The active plant card's "speech bubble" onboarding tip (`plot-onboarding-bubble`, garden.css 626+) with the 4px coloured drop shadow + tail pointing at the active plot is good craft.
- Spacing tokens are defined and MOSTLY used; the framework is in place — most of the issues above are short surgical fixes rather than refactors.

---

## Screenshots reference

| File | Size | Notes |
|------|------|-------|
| `desktop-1440-initial.png` | 1440x900 | Full 3-panel layout; visible orange-pink gradient bleed between panels |
| `desktop-garden.png` | 585x681 | Garden panel — locked plots dominate, dead vertical space inside cards |
| `desktop-shop-buy.png` | 474x681 | Fron tab — multiple locked seeds, 5px rarity stripes |
| `desktop-shop-sell.png` | 474x681 | Mina fron tab — single row, 65% panel is raw gradient |
| `desktop-shop-upgrades.png` | 474x681 | Active Godselvatten upgrade highlighted; clear locked items |
| `desktop-shop-tools.png` | 474x681 | Auto-Skorda + 3 mystery locked tools |
| `desktop-quests.png` | 474x681 | 3 quest cards; 0% chip is redundant with progress bar |
| `desktop-achievements.png` | 474x681 | "Speciellt" filter wraps to row 2; all 6 visible achievements are locked-style |
| `desktop-kattpedia.png` | 474x681 | Wall of identical "??? Okand katt" cards — biggest design problem |
| `desktop-lottery.png` | 474x681 | Wheel labels overlap/garble on long prize names ("Morotsraddari blubbsr") |
| `mobile-375-initial.png` | 750x1624 (2x DPR) | Compressed header + HUD ~240px before first plot |
| `mobile-375-garden.png` | 750x... full scroll | Full mobile vertical scroll; bottom tabbar with 5 tabs |
| `plot-card-close.png` | 210x210 | Single empty plot card — shows ~134px vertical dead space |
