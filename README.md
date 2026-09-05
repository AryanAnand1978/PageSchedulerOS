# Live Page Replacement Algorithm Visualizer

A web-based console simulating and animating operating system page replacement algorithms (**FIFO**, **LRU**, **Optimal**, and **Clock / Second-Chance**) on a user-supplied reference string and physical frame allocation.

Designed as an interactive educational console for operating systems courses to visualize *eviction decisions live*, explore locality of reference, and directly demonstrate **Bélády's anomaly**.

---

## 🌟 Key Features

1. **Deterministic Multi-Algorithm Simulation**:
   - Pure simulation engine supporting FIFO (queue-based), LRU (recency tracking), Optimal (MIN future lookahead), and Clock (second-chance sweep with reference bits and sweeping hand).
   - Validated against canonical textbook reference traces.

2. **Strict DOM Ownership Architecture**:
   - **React 19**: Manages application shell, configuration controls, playback timeline, stats, comparison tables, and charts.
   - **anime.js v4.5 Layout API (`createLayout`)**: Manages two imperative DOM islands (`FrameGrid` and `ReferenceStrip`) with genuine FLIP transitions for page entry (`enterFrom`), eviction (`leaveTo`), and resident reordering.
   - **GSAP**: Drives mount entrance reveals and direct 60fps numeric counter tweens.
   - **CSS Keyframes**: Hit (`#22D3EE`) and Fault (`#F59E0B`) flashes animate `box-shadow` and `border-color` without interfering with layout tweens.

3. **Bélády's Anomaly Detection**:
   - Automated sweep across 1–8 physical frames detecting any point where increasing physical allocation paradoxically increases page fault counts.
   - Pre-loaded Bélády scenario (`1 2 3 4 1 2 5 1 2 3 4 5`) with explicit anomaly alert.

4. **Compare All Mode**:
   - 4 synchronized mini frame grids stepping in lockstep across FIFO, LRU, Optimal, and Clock, showing frame divergence live.

5. **Theme Support & Accessibility**:
   - Dark console theme (`#0B0F14`) by default with dark/light mode toggle (persisted to `localStorage`).
   - `prefers-reduced-motion` compliance (snaps instantly with 0ms transition duration).

---

## 📊 Golden Test Values (Hand-Verified Benchmark)

Tested on the **Silberschatz 20-reference string**:
`7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1` @ **3 frames**:

| Algorithm | Faults | Hits | Hit Ratio | Note |
|---|---|---|---|---|
| **FIFO** | **15** | 5 | 25.0% | Queue of arrival order |
| **LRU** | **12** | 8 | 40.0% | Evicts least recently used |
| **OPTIMAL** | **9** | 11 | 55.0% | Theoretical lower bound (MIN) |
| **CLOCK** | **14** | 6 | 30.0% | Second-chance sweep (`refBit=1` on load & hit) |

**Bélády's Anomaly Benchmark** (`1 2 3 4 1 2 5 1 2 3 4 5` under FIFO):
- 3 Frames: **9 Faults**
- 4 Frames: **10 Faults** *(Increasing allocation increases faults!)*

---

## 🚀 Running Locally

### Prerequisites
- Node.js ≥ 20.0.0 (tested on Node v25.0.0)
- npm ≥ 10.0.0

### Quick Start

```bash
# Navigate to the app directory
cd app

# Install dependencies
npm install

# Run automated tests (87 tests, 100% pass)
npm test

# Start local development server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173/` in your browser.

---

## 🏗️ Project Architecture

```
PAGE_SCHEDULER/
├─ PRD_Page_Replacement_Visualizer.md
├─ IMPLEMENTATION_PLAN.md
├─ README.md
└─ app/
   ├─ index.html
   ├─ package.json
   ├─ vite.config.ts
   └─ src/
      ├─ main.tsx
      ├─ App.tsx
      ├─ index.css                   # Theme tokens + @keyframes + island styles
      ├─ lib/
      │  ├─ utils.ts                 # cn() class utility
      │  └─ motion.ts                # prefersReducedMotion() & adaptive durations
      ├─ sim/
      │  ├─ types.ts                 # TraceStep, SimulationResult, AlgorithmId
      │  ├─ fifo.ts  lru.ts  optimal.ts  clock.ts
      │  ├─ index.ts                 # Registry, runAll(), beladySweep()
      │  ├─ parse.ts                 # Reference string parser & validator
      │  ├─ presets.ts               # Scenario presets (Silberschatz, Belady, etc.)
      │  └─ __tests__/algorithms.test.ts # 87 golden unit & property tests
      ├─ store/
      │  └─ useSimStore.ts           # Zustand simulation state & actions
      ├─ anim/
      │  ├─ layoutConfig.ts          # anime.js createLayout timing presets
      │  ├─ frameGrid.ts             # Imperative FrameGrid island controller
      │  ├─ refStrip.ts              # Imperative ReferenceStrip island controller
      │  └─ gsapIntro.ts             # GSAP intro reveal & DOM counter tweens
      └─ components/
         ├─ Header.tsx  ThemeToggle.tsx
         ├─ controls/ConfigPanel.tsx  PlaybackControls.tsx  PresetMenu.tsx
         ├─ viz/FrameGrid.tsx  ReferenceStrip.tsx  StatsBar.tsx
         ├─ compare/CompareGrids.tsx  ComparisonTable.tsx
         └─ compare/FaultBarChart.tsx  BeladyPanel.tsx
```
