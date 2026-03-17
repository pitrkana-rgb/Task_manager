# IMPLEMENTATION_PLAN_V1 — Premium Visual Upgrade

Goal: make FlowTask look **professional + premium** with consistent depth, motion, and micro-interactions across all pages (Dashboard, Kanban, Weekly plan, Weekly challenges, Projects, Settings, Profile, Modals, Evaluation).

Scope: visuals only (CSS + minimal JS for motion triggers), keep existing UX and data behavior intact.

---

## 0) Design principles (what “premium” means here)
- **Consistency**: one elevation system, one motion system, one spacing system.
- **Depth with restraint**: fewer borders, more soft shadows + subtle gradients.
- **Micro-interactions**: hover/press/focus states that communicate “clickable”.
- **Clarity**: typography hierarchy + reduced visual noise.
- **Accessibility**: focus rings, reduced motion support, readable contrast.

---

## 1) Foundations (tokens + system-level polish)
### 1.1 Add a motion system (CSS variables)
- Add `--ease-out`, `--ease-spring`, `--dur-1/2/3` tokens.
- Add reusable classes for: `hover-lift`, `press`, `focus-ring`.
- Respect `@media (prefers-reduced-motion: reduce)` (disable transforms + long transitions).

### 1.2 Add an elevation/glow system
- Define a small set of shadows: `--elev-1/2/3`.
- Define glow helpers per accent: `--glow-accent`, `--glow-green`, `--glow-purple`.
- Replace ad-hoc shadows with tokens (avoid mixed shadow styles).

### 1.3 Typography and spacing consistency
- Normalize page title spacing; align section headings.
- Normalize chip/pill radii (use consistent `--r` and `--rs`).
- Reduce “hard borders” where depth already communicates separation.

### 1.4 Focus states (premium + accessible)
- Add visible focus ring for buttons, inputs, chips, tabs.
- Ensure focus styles don’t rely solely on color.

---

## 2) Component upgrades (cross-page)
### 2.1 Buttons (Primary/Secondary/Destructive)
- Add pressed state (scale + shadow drop).
- Improve disabled state (opacity + cursor).
- Add subtle gloss gradient on primary (very low opacity).

### 2.2 Cards (stat, list items, goal cards, week cards)
- Standardize padding and border radius.
- Add soft hover elevation + border tint.
- Add “active/selected” state for interactive cards.

### 2.3 Chips / tabs / toggles
- Tabs (workspace, evaluation metric): smoother active pill transition.
- Recurring chips: consistent selected state + focus ring.

### 2.4 Modals
- Add open/close animation (fade + slight slide).
- Add backdrop blur polish + stronger depth separation.
- Ensure scrollbars look consistent.

### 2.5 Lists (Today tasks, Upcoming, Project lists)
- Reduce border heaviness; add subtle dividers and hover affordances.
- Improve density: consistent vertical rhythm.

---

## 3) Page-by-page visual upgrades
### 3.1 Přehled dne (Dashboard)
- Hero: refine gradient + add soft highlight blobs with better opacity.
- Progress bar: refine track/filled gradient, add subtle inner shadow for track.
- Collapsibles: smoother expand/collapse (height + opacity), better toggle affordance.
- Weekly challenges panel: consistent row spacing and ring contrast.

### 3.2 Správce úkolů (Kanban)
- Columns: consistent header background and sticky headers (optional).
- Drag/drop: stronger “drop zone” highlight + animated placeholder.
- Task cards: clearer hierarchy (title > meta > checklist).
- Workspace badges: aligned and less visually “loud”.

### 3.3 Týdenní plán
- Day stats card: clearer KPI typography, unify pie styling.
- Day columns: lighten borders, improve scroll area feel.
- Activity rows: match task row styling (same shadow + radius).

### 3.4 Týdenní výzvy
- Goal type badge: premium badge style (icon + pill).
- Progress bar: smoother fill gradient + subtle glow based on performance.
- Inputs (numeric): better focus/hover; consistent sizes on mobile.

### 3.5 Vyhodnocení
- Hero KPI grid: consistent alignment and spacing.
- Chart: soften grid lines, add gradient under main line, smooth transitions on toggle.
- Weekly performance cards: stronger color-coding + premium hover.

### 3.6 Projekty & Nastavení
- Sidebar list items: consistent hover/active states.
- Section headers: reduce noise; align typography.
- Inputs/buttons: consistent focus and spacing.

### 3.7 Profile screen
- Make entry feel “app-like”: subtle background pattern, improved button glow.

---

## 4) Animation checklist (what to add)
- Hover lift for interactive cards (`transform: translateY(-2px)` + shadow).
- Press feedback for buttons and chips (`transform: translateY(0)` + scale).
- Modal open/close (opacity + translate + scale, 160–220ms).
- Collapsible bodies (max-height + opacity + translate).
- Kanban drag: scale/tilt + shadow, drop zone pulse.

---

## 5) Mobile & responsive polish
- Ensure single-column layouts don’t feel “stretched”: adjust paddings and font sizes.
- Larger tap targets for toggles and chips.
- Reduce shadows slightly on mobile to avoid muddy UI.

---

## 6) Implementation order (lowest risk → highest impact)
1) Foundations: motion/elevation tokens, focus rings, reduced motion.
2) Buttons + chips + tabs (global consistency).
3) Card system + list items.
4) Modals + overlays.
5) Dashboard polish.
6) Kanban polish + drag/drop.
7) Weekly plan polish.
8) Weekly challenges polish.
9) Evaluation polish (chart + cards).
10) Projects/settings/profile finishing touches.

---

## Progress checklist
Use this as the tracking checklist during implementation.

### Foundations
- [ ] Add motion tokens + reduced motion support
- [ ] Add elevation/glow tokens and standardize shadows
- [ ] Add unified focus ring styles
- [ ] Normalize typography spacing (titles/sections)

### Global components
- [ ] Buttons: hover/press/disabled polish
- [ ] Chips/tabs/toggles: smooth active transitions + focus
- [ ] Card system: standard hover elevation + border tint
- [ ] Modals: open/close animation + backdrop polish
- [ ] Lists: density + hover + dividers

### Pages
- [ ] Dashboard: hero + progress bar + collapsibles + weekly panel polish
- [ ] Kanban: columns + drag/drop + task cards polish
- [ ] Weekly plan: day stats card + day columns polish
- [ ] Weekly challenges: badge + progress bar + inputs polish
- [ ] Evaluation: hero KPIs + chart polish + weekly cards polish
- [ ] Projects + Settings: lists/sections polish
- [ ] Profile screen: premium entry polish

### Mobile
- [ ] Mobile spacing + tap targets + shadow reduction

