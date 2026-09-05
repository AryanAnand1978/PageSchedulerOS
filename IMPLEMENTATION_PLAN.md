# Implementation Plan — Live Page Replacement Algorithm Visualizer

> Build spec for the implementing agent. Companion to `PRD_Page_Replacement_Visualizer.md`.
> Everything in "Locked decisions" was settled with the project owner — treat those as given, not as open questions.

## Context

`PAGE_SCHEDULER/` currently contains only `PRD_Page_Replacement_Visualizer.md` and this file. There is no code, no git repo, no `package.json`. This document takes the project from empty directory to demo-ready app.

**What we're building and why:** an OS-course teaching tool that simulates FIFO, LRU, Optimal, and Clock page replacement on a user-supplied reference string, animates the frame state step-by-step, and compares the four algorithms on fault count. The pedagogical payload is making *eviction decisions* visible — students normally see only a static end-state table, which hides *why* LRU beats FIFO and makes Belady's anomaly look like a typo. Target audience is a course evaluator watching a live demo plus the student narrating it, so animation legibility matters as much as correctness.

**Why the stack is what it is:** the PRD asks for React + client-side-only. The project owner additionally requires shadcn/ui for components, GSAP for animation, and specifically anime.js's `createLayout` Layout API (v4.3.0+) for the frame-grid enter animation. That last requirement drives the single non-obvious architecture decision here — see [Architecture](#architecture-the-one-decision-that-matters). Read that section before writing any component.

---

## Locked decisions

| Decision | Choice |
|---|---|
| App location | `PAGE_SCHEDULER/app/` — subfolder, so `create-vite` never hits its "directory not empty" prompt |
| Language | TypeScript |
| Theme | Dark console (`#0B0F14` base, mono page numbers, cyan `#22D3EE` hit / amber `#F59E0B` fault) + light toggle |
| Optional scope IN | Compare-all: four synced mini frame grids stepping in lockstep |
| Optional scope OUT | Disk/backing-store bin, dedicated per-step "why" explainer panel, keyboard-shortcut layer + `aria-live` step narration |

Baseline accessibility (form labels, `focus-visible` rings, `prefers-reduced-motion`) is still included — that's standard quality, not the deferred feature. The deferred item is specifically the shortcut system and live-region narration.

---

## Verified library facts

All versions resolved from npm on 2026-09-05. Node v25.0.0, npm 11.12.1 confirmed present on the machine.

| Package | Version | Note |
|---|---|---|
| `animejs` | **4.5.0** | `createLayout` requires ≥ 4.3.0. Confirmed `./layout` export subpath with types. |
| `gsap` | 3.15.0 | |
| `react` / `react-dom` | 19.2.8 | |
| `vite` | 8.2.2 | |
| `tailwindcss` + `@tailwindcss/vite` | 4.3.3 | Tailwind v4 — no `tailwind.config.js`, no PostCSS step |
| `recharts` | 3.10.1 | Peer-supports React 19. Declares `react-is` as a peer — add explicitly if npm warns. |
| `zustand` | 5.0.15 | |
| `lucide-react` | 1.41.0 | Peer-supports React 19 (shadcn's icon dep) |
| `vitest` | 5.0.0 | Peers: `vite ^8`, `@types/node ^22 \|\| >=24` — both satisfied |
| `jsdom` | 30.0.1 | Only if a DOM test is added; sim tests are pure and need no environment |
| `@vitejs/plugin-react` | 6.1.1 | |
| `@types/node` | 26.4.1 | Needed for `path`/`__dirname` in `vite.config.ts` |

**Do not manually pin or upgrade TypeScript.** npm's `latest` for `typescript` is currently `7.0.2`, a major rewrite with uneven tooling compatibility. Use whatever version the `react-ts` template pins and leave it alone.

### anime.js Layout API — the contract (verified against the official docs)

```ts
import { createLayout } from 'animejs'   // or 'animejs/layout'
```

- **Settings:** `children`, `delay`, `duration`, `ease`, `properties`
- **State params:** `enterFrom` (default `{ opacity: 0 }`), `leaveTo` (default `{ opacity: 0 }`), `swapAt`. Each also accepts its own `delay`/`duration`/`ease`, which override the layout-level values *for that group only*.
- **Methods:** `record()` → returns the instance · `animate(params?)` → returns a **Timeline, not a promise** · `update(cb)` → thenable · `revert()`
- **Properties:** `layout.root`, `layout.leaving` (array of exiting nodes)

**`record()` + mutate + `animate()` is a documented public pattern**, with its own reference page and official example; `update()` is the convenience wrapper around it. This is the framework escape hatch if you ever need React to perform the mutation.

**Exit semantics — the critical one.** An element "leaves" when it becomes `display: none` or `visibility: hidden` during an update. It is **not** removed. anime.js keeps it rendered so `leaveTo` can play, collects it in `layout.leaving`, and leaves removal to you *after* the transition:

```js
layout.update(({ root }) => { el.classList.add('is-hidden') })   // display:none
     .then(() => layout.leaving.forEach($el => $el.remove()))
```

### Gotchas that will silently break this build

1. **Transform shorthands are ignored** in `enterFrom` / `leaveTo` / `swapAt`. `{ x: 100 }` and `{ scale: 0 }` do nothing. Always pass a full string: `{ transform: 'translateY(60px) scale(0.8)' }`.
2. **SVG is never tracked.** "Only HTML elements are tracked and animated." Frame cards must be HTML divs. Any SVG (Recharts, icons) must live outside layout roots.
3. **The layout root's own position is never animated** (by design — its siblings aren't tracked and would jump). If the grid itself needs to move, make its *parent* the root.
4. **Elements adjacent to bare text nodes don't move.** Wrap every loose text run in a `<span>`.
5. **Descendants not matched by a `children` selector fade out and back** at 50% progress. If a `children` selector is used, either include the descendants in it or set `swapAt: { opacity: 1 }`.
6. Fixed frame count means fixed grid geometry — no unexpected reflow, which keeps FLIP measurements clean.

---

## Architecture: the one decision that matters

React unmounts nodes when state removes them. anime.js `leaveTo` requires the node to **persist as `display:none`** until the tween finishes. These are directly incompatible: if React owns the frame cards, eviction animations cannot work.

**Resolution — a hard ownership split:**

| Owner | Surface |
|---|---|
| **React** | App shell, header, config panel, playback controls, stats readouts, comparison table, Recharts charts, theme toggle |
| **anime.js Layout** | Two imperative DOM islands: the **frame grid** and the **reference-history strip**. React renders an empty `<div ref>` and *never* renders children into it. |
| **GSAP** | Mount/intro reveals, numeric counter tweens, the reference-strip playhead marker. **Never touches a node inside a layout root.** |

### Island contract (non-negotiable — put this comment at the top of each island file)

```tsx
// FrameGrid.tsx — React renders the container ONCE. All children are created,
// moved, hidden, and removed by anim/frameGrid.ts. Adding JSX children here
// will break leaveTo eviction animations.
const FrameGrid = memo(function FrameGrid() {
  const rootRef = useRef<HTMLDivElement>(null)
  const ctrlRef = useRef<FrameGridController | null>(null)

  useLayoutEffect(() => {
    const ctrl = createFrameGrid(rootRef.current!)
    ctrlRef.current = ctrl
    // Subscribe imperatively — this component must never re-render on step change.
    const unsub = useSimStore.subscribe(s => ctrl.sync(s))
    ctrl.sync(useSimStore.getState())
    return () => { unsub(); ctrl.destroy() }   // destroy() calls layout.revert()
  }, [])

  return <div ref={rootRef} className="frame-grid" />
})
```

The store subscription is imperative on purpose: the island must not re-render when `stepIndex` changes, or React would fight anime.js for the same nodes.

### Flash/highlight rule

Hit/fault flashes land on anime.js-owned nodes, so they must **not** use GSAP or anime.js — those would collide with the layout tweens on `transform`/`opacity`. Use **CSS `@keyframes` toggled by class** (`.is-hit`, `.is-fault`), animating only `box-shadow`, `border-color`, `background-color`. Never `transform` or `opacity`.

### Animate vs. snap

The island's `sync()` must distinguish:

- **Adjacent step** (`|new - old| === 1`) → animate via `layout.update(...)`
- **Anything else** (scrub, reset, algorithm switch, frame-count change, initial render) → rebuild instantly with `duration: 0`

Skipping this makes scrubbing the timeline queue up dozens of overlapping tweens.

---

## File tree

```
PAGE_SCHEDULER/
├─ PRD_Page_Replacement_Visualizer.md
├─ IMPLEMENTATION_PLAN.md            ← this file
└─ app/
   ├─ index.html
   ├─ package.json
   ├─ vite.config.ts                 ← react + tailwindcss plugins, @ alias, vitest block
   ├─ tsconfig.json / tsconfig.app.json / tsconfig.node.json
   ├─ components.json                ← shadcn
   └─ src/
      ├─ main.tsx
      ├─ App.tsx
      ├─ index.css                   ← @import "tailwindcss" + theme tokens + island CSS
      ├─ lib/
      │  ├─ utils.ts                 ← shadcn cn()
      │  └─ motion.ts                ← prefersReducedMotion(), speed→duration mapping
      ├─ sim/
      │  ├─ types.ts
      │  ├─ fifo.ts  lru.ts  optimal.ts  clock.ts
      │  ├─ index.ts                 ← ALGORITHMS registry, runAll(), beladySweep()
      │  ├─ parse.ts                 ← reference-string parsing + validation
      │  ├─ presets.ts
      │  └─ __tests__/algorithms.test.ts
      ├─ store/useSimStore.ts
      ├─ anim/
      │  ├─ layoutConfig.ts          ← shared createLayout settings
      │  ├─ frameGrid.ts             ← imperative controller (main + mini variants)
      │  ├─ refStrip.ts              ← imperative controller
      │  └─ gsapIntro.ts             ← intro timeline, counter tween
      └─ components/
         ├─ ui/                      ← shadcn generated
         ├─ Header.tsx  ThemeToggle.tsx
         ├─ controls/ConfigPanel.tsx  PlaybackControls.tsx  PresetMenu.tsx
         ├─ viz/FrameGrid.tsx  ReferenceStrip.tsx  StatsBar.tsx
         ├─ compare/CompareGrids.tsx  ComparisonTable.tsx
         └─ compare/FaultBarChart.tsx  BeladyPanel.tsx
```

---

## Data model (`src/sim/types.ts`)

Every algorithm is a **pure function** `(references: number[], frameCount: number) => SimulationResult`. No DOM, no React, no side effects — this is what makes the golden tests possible.

```ts
export type AlgorithmId = 'FIFO' | 'LRU' | 'OPTIMAL' | 'CLOCK'

export interface TraceStep {
  index: number                  // position in the reference string
  page: number                   // page being referenced
  hit: boolean
  frames: (number | null)[]      // frame contents AFTER this step; length === frameCount
  hitFrame: number | null        // frame index of the hit, else null
  loadedFrame: number | null     // frame index the page was placed into, else null
  victimFrame: number | null     // frame index evicted, else null
  victimPage: number | null      // page evicted, else null
  faultsSoFar: number
  hitsSoFar: number
  reason: string                 // e.g. "Fault — frame 0 held page 7 (oldest, loaded at step 0) → evicted"
  meta: {
    queue?: number[]             // FIFO: resident pages, oldest first
    recency?: number[]           // LRU: MRU → LRU
    nextUse?: Record<number, number | null>   // OPTIMAL: page → next use index (null = never again)
    hand?: number                // CLOCK: hand position after the step
    refBits?: (0 | 1 | null)[]   // CLOCK: reference bit per frame after the step
    handSweep?: number[]         // CLOCK: frames the hand passed over during this eviction
  }
}

export interface SimulationResult {
  algorithm: AlgorithmId
  frameCount: number
  references: number[]
  steps: TraceStep[]
  faults: number
  hits: number
  hitRatio: number    // hits / references.length
}
```

`meta` is nearly free to produce (the algorithms already maintain this state) and has two consumers in scope: a one-line caption under the frame grid, and the CLOCK hand marker + reference-bit dot rendered onto the frame cards. CLOCK is illegible without those, so they count as visualizing the algorithm, not as the deferred explainer panel. Do **not** build a separate state-inspection panel.

---

## Algorithm specifications

Cold start counts as a fault (compulsory miss) and the page loads into the **lowest-index free frame**.

| Algorithm | Eviction rule | Tie-break |
|---|---|---|
| **FIFO** | Queue of frame indices in load order; evict `queue.shift()` | Queue order is total — no ties |
| **LRU** | Track `lastUsed[page]` (updated on hit *and* load); evict smallest | Impossible — indices are unique |
| **OPTIMAL** | For each resident page find next occurrence `> current`; evict farthest, treating "never again" as ∞ | Multiple ∞ → **lowest frame index** |
| **CLOCK** | Second-chance sweep: while `refBit[hand] === 1` set it to `0` and advance; else evict `frames[hand]`, place new page with `refBit = 1`, advance hand | Sweep order is total |

**CLOCK conventions — pin these explicitly, they change the fault count:**
1. On load, `refBit = 1` (Silberschatz/Tanenbaum: bringing a page in *is* a reference). Export as a named constant so it can be flipped if the course uses the other convention.
2. On hit, set `refBit = 1`; **do not** move the hand.
3. After placing a page (free frame or eviction), advance the hand to `(placedIndex + 1) % frameCount`.

Record `handSweep` during the eviction loop so the sweep is animatable.

`parse.ts` must accept space-, comma-, and newline-separated input, reject non-negative-integer tokens with a specific message, cap length at ~64 references and frames at 1–8, and never throw on partial input while typing.

---

## Golden test values (hand-verified — trust these)

These were traced by hand during planning. If an implementation disagrees, the implementation is wrong.

**Silberschatz string** `7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1` (20 refs) @ **3 frames**:

| Algorithm | Faults | Hits |
|---|---|---|
| FIFO | **15** | 5 |
| LRU | **12** | 8 |
| OPTIMAL | **9** | 11 |
| CLOCK | **14** | 6 |

FIFO/LRU/Optimal are the canonical textbook figures. **CLOCK = 14 is specific to the `refBit = 1`-on-load convention above** — if the implementation gets a different number, check the convention before assuming the test is wrong. 14 sitting between FIFO's 15 and LRU's 12 is also the pedagogical story ("Clock approximates LRU, beats FIFO"), so it's a useful signal.

**Belady string** `1 2 3 4 1 2 5 1 2 3 4 5` under **FIFO**:

| Frames | Faults |
|---|---|
| 3 | **9** |
| 4 | **10** |

More frames → more faults. This is the anomaly and it must reproduce exactly.

**Structural invariants to assert for every algorithm × frame count:**
- `faults + hits === references.length`
- `steps.length === references.length`
- every `step.frames.length === frameCount`
- resident pages are unique within a step (no page in two frames)
- `hit === true` ⟺ `victimFrame === null && loadedFrame === null`
- `OPTIMAL.faults <= min(FIFO, LRU, CLOCK).faults` for any input (Optimal is a lower bound — strong property test; assert over a handful of random strings)

---

## Phased build

### Phase 0 — Scaffold

```bash
cd "C:/Users/Aryan Anand/OneDrive/Desktop/PAGE_SCHEDULER"
npm create vite@latest app -- --template react-ts
cd app && npm install
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
```

Then per the official shadcn Vite guide: replace `src/index.css` with `@import "tailwindcss";`, add `baseUrl`/`paths` `{"@/*": ["./src/*"]}` to **both** `tsconfig.json` and `tsconfig.app.json`, and write `vite.config.ts` with `react()` + `tailwindcss()` plugins and the `@` alias via `path.resolve(__dirname, "./src")`.

```bash
npx shadcn@latest init
npx shadcn@latest add button card input label slider select tabs table badge tooltip separator switch
npm install animejs gsap recharts zustand
npm install -D vitest
```

Add a `test` script and a `test: { environment: 'node', include: ['src/**/*.test.ts'] }` block to `vite.config.ts`. Verify `npm run dev` boots and a shadcn `<Button>` renders before continuing.

### Phase 1 — Simulation core (do this first, fully, with tests)

Write `types.ts`, the four algorithms, `parse.ts`, `presets.ts`, `index.ts` (registry + `runAll` + `beladySweep(references, maxFrames)` returning `{ frames, faults }[]` per algorithm plus detected anomaly pairs), and `__tests__/algorithms.test.ts` with the golden table above plus the structural invariants.

**Gate: `npm test` must be fully green before any UI work.** Everything downstream assumes the trace is correct; debugging an algorithm through an animation is miserable.

Presets: Silberschatz classic, Belady anomaly, a high-locality string (LRU wins big), a sequential scan (all algorithms do badly).

### Phase 2 — Store + playback driver

`useSimStore` (zustand): `input`, `frameCount`, `algorithm`, `mode: 'focus' | 'compare'`, `results`, `stepIndex`, `playing`, `speed`, plus actions `run()`, `stepForward()`, `stepBack()`, `seek(i)`, `reset()`, `togglePlay()`.

Playback driver — one `useEffect` in `App.tsx`:

```ts
useEffect(() => {
  if (!playing) return
  if (stepIndex >= totalSteps - 1) { setPlaying(false); return }
  const id = window.setTimeout(stepForward, stepDelayMs)
  return () => window.clearTimeout(id)
}, [playing, stepIndex, stepDelayMs, totalSteps])
```

Layout duration derives from playback speed so animation never outruns the tick: `duration = Math.min(420, stepDelayMs * 0.55)`. Speed slider maps to `stepDelayMs` ∈ [180, 1600].

### Phase 3 — anime.js Layout islands

**`anim/refStrip.ts`** — the docs' `addItem` pattern verbatim, which is exactly the snippet the project owner asked for. Each processed reference appends one card:

```ts
const layout = createLayout(rootEl, {
  duration: 250,
  ease: 'outQuad',
  enterFrom: {
    transform: 'translateY(100px) scale(.25)',   // full string — shorthands are ignored
    opacity: 0,
    duration: 350,
    ease: 'out(3)',
  },
})

layout.update(({ root }) => { root.appendChild(makeRefCard(step)) })
```

Build this island first — it's purely additive, has no eviction complexity, and proves the Layout wiring works.

**`anim/frameGrid.ts`** — `createFrameGrid(rootEl, opts)` returning `{ sync(state), destroy() }`. N persistent frame *slots* (fixed geometry); page cards enter, leave, and reorder inside them.

- Enter (page loaded): `enterFrom: { transform: 'translateY(56px) scale(.8)', opacity: 0, duration: 320, ease: 'out(3)' }` — rises from the reference strip below into RAM.
- Leave (eviction): `leaveTo: { transform: 'translateY(-64px) scale(.7)', opacity: 0, duration: 300, ease: 'out(2)' }`. Hide with `display:none` inside `update()`, then `.then(() => layout.leaving.forEach($el => $el.remove()))`. **Never remove inside the callback.**
- Reorder (LRU recency / FIFO queue order): re-append children in the new order inside `update()` — DOM-order change animation handles the motion.
- Assign ``data-layout-id = `page-${page}` `` so identity survives moving between slots.
- CLOCK: a hand marker element positioned per `meta.hand`, and a reference-bit dot per card from `meta.refBits`. Keep the marker **outside** the layout root (sibling overlay) or it becomes a tracked child.
- Hit/fault flash: toggle `.is-hit` / `.is-fault`, CSS keyframes on `box-shadow`/`border-color` only.
- `destroy()` calls `layout.revert()`.

Honor `prefersReducedMotion()` by forcing `duration: 0` throughout.

### Phase 4 — GSAP layer

- Intro timeline on mount: header, config card, control bar staggered in.
- Counter tweens for faults / hits / hit-ratio — tween a proxy object, write to a ref'd DOM node in `onUpdate`, so React doesn't re-render 60×/sec.
- Playhead marker that travels along the reference strip to the active card's x-offset. Lives in a **sibling overlay div**, not inside the strip's layout root.
- Panel transitions when switching focus ↔ compare mode.
- Kill all GSAP tweens on unmount (`gsap.context()` scoped to the app root is cleanest).

Boundary check before finishing this phase: grep the GSAP call sites and confirm none target a selector inside `.frame-grid` or `.ref-strip`.

### Phase 5 — Comparison view

- `ComparisonTable` — shadcn `Table`: algorithm × faults × hits × hit ratio, best row badged.
- `FaultBarChart` — Recharts `BarChart` of fault counts across the four algorithms. Recharts animates bars internally; GSAP only reveals the wrapper.
- `BeladyPanel` — Recharts `LineChart` of faults vs. frame count (1–8) per algorithm, plus an explicit callout rendered whenever `beladySweep` detects `faults[n+1] > faults[n]`, naming the algorithm and the exact frame pair ("FIFO: 3 frames → 9 faults, 4 frames → 10 faults").

### Phase 6 — Compare-all synced grids

Four mini `FrameGrid` islands (FIFO / LRU / Optimal / Clock), each its own `createLayout` instance, all reading the same `stepIndex` from the store. Reuse `createFrameGrid` with a `variant: 'mini'` option — smaller cards, no CLOCK hand detail, no reorder animation (keeps four simultaneous layouts cheap). One shared playback driver, so divergence between algorithms is visible live.

### Phase 7 — Polish

Theme tokens + light/dark toggle (persist to `localStorage`); empty/invalid input states; responsive down to ~1024px (demo laptop, not phones); `focus-visible` rings; labelled inputs; `prefers-reduced-motion`; a README with run instructions and the golden-value table.

---

## Verification

**Automated:**
```bash
cd app && npm test
```
Golden table + structural invariants + the Optimal-lower-bound property test. Must be green.

```bash
cd app && npx tsc --noEmit && npm run build
```
Clean types, clean production build.

**Manual, in the browser (`npm run dev`):**
1. Load the Silberschatz preset @ 3 frames, run each algorithm, confirm the on-screen fault counts match **15 / 12 / 9 / 14**.
2. Load the Belady preset, set 3 frames → 9 faults; set 4 frames → 10 faults; confirm the anomaly callout fires and names FIFO.
3. Play at slowest speed and watch one eviction end-to-end: outgoing card must visibly rise and fade *before* being removed — if it vanishes instantly, the `leaveTo` hide-then-remove flow is wrong.
4. Watch a page load: incoming card must rise from below with the `enterFrom` transform, not just fade in — a plain fade means the transform shorthand gotcha bit.
5. Scrub the timeline rapidly, then jump to step 0: no queued/overlapping tweens, no stuck ghost cards, no duplicate page in two frames.
6. Switch algorithm mid-playback and change frame count mid-playback: grid rebuilds instantly and stays consistent with the stats.
7. Compare mode: all four grids step in lockstep; Optimal is never worse than the others.
8. Toggle light/dark; enable OS "reduce motion" and confirm steps snap instantly with no animation.
9. Console must be clean — no React key warnings, no anime.js warnings, no "node not found" errors from island removals.

---

## Out of scope

Per the PRD's non-goals and the scope decisions above: no backend or persistence (beyond the theme in `localStorage`), no TLB/multi-level page tables, no multi-process contention, no working-set or thrashing simulation, no disk/backing-store bin, no dedicated per-step explainer panel, no keyboard-shortcut layer or `aria-live` step narration, no mobile layout below ~1024px.
