# PRD: Live Page Replacement Algorithm Visualizer

## 1. Overview
A web-based console that simulates and visually animates page replacement algorithms (FIFO, LRU, Optimal, Clock) used by an operating system's virtual memory manager to decide which memory page to evict on a page fault. The tool takes a user-defined page reference string and frame count, runs each algorithm, and animates the frame state, hits, and faults live — then compares algorithms side by side on fault count.

## 2. Problem Statement
Page replacement is core to how an OS manages limited physical memory (RAM) against a larger virtual address space. Students typically learn this through static tables. This project makes the decision process visible and interactive, letting a user directly observe *why* one algorithm outperforms another on the same workload — including demonstrating Belady's anomaly, where increasing frame count paradoxically increases faults under FIFO.

## 3. Goals
- Simulate FIFO, LRU, Optimal, and Clock page replacement algorithms on a common input
- Animate frame state changes step-by-step (not just a static end result)
- Report hit/fault counts and hit ratio per algorithm
- Demonstrate Belady's anomaly with a pre-loaded example case
- Present results in a way that's demo-friendly for evaluation

## 4. Non-Goals
- No real OS-level memory management (no actual paging hardware/TLB simulation)
- No multi-process/multi-program memory contention modeling
- No persistence — this is a single-session interactive demo, not a saved tool

## 5. Users
Course evaluator/teacher watching a live demo; the student presenting, using it as a teaching aid during explanation.

## 6. Functional Requirements

### 6.1 Input
- User enters a page reference string (e.g. `7 0 1 2 0 3 0 4 2 3`)
- User sets number of physical frames (e.g. 3)
- User selects which algorithm(s) to run — single algorithm or "compare all"
- Preset button to load the classic Belady's anomaly example string

### 6.2 Simulation
- For each algorithm, step through the reference string one page at a time
- At each step, determine: hit or fault; if fault, which page is evicted (if any) and which page enters
- Track full frame-state history across all steps for animation replay

### 6.3 Live Visualization
- Animate frame contents updating step-by-step with a short delay per step (adjustable speed / play-pause/step controls)
- Highlight the current page being processed
- Color-code hit vs. fault visually
- Running counters for faults/hits update live during animation

### 6.4 Comparison
- After running "compare all," show a summary table: algorithm vs. total faults vs. hit ratio
- Bar chart comparing fault counts across algorithms
- Explicit callout when Belady's anomaly is demonstrated (FIFO faults increase with more frames)

## 7. Technical Approach
- Frontend: single-page web app (React) — all simulation logic runs client-side in JavaScript, no backend needed
- Core simulation: a pure function per algorithm that takes (reference string, frame count) and returns a step-by-step trace array
- Animation: driven by stepping through the trace array on a timer/interval, updating rendered frame state each tick
- Visualization: custom animated frame grid + a bar chart (e.g. Recharts) for the comparison view

## 8. Tech Stack
- React (UI + state management)
- JavaScript (algorithm implementations: FIFO via queue, LRU via recency tracking, Optimal via future lookahead, Clock via circular buffer + reference bit)
- Recharts or Chart.js (comparison bar chart)
- No backend/database required — fully client-side, deployable as a static page

## 9. OS Concepts Demonstrated
- Virtual memory and demand paging
- Page faults and frame allocation
- Belady's anomaly (FIFO-specific pathology)
- Locality of reference (why LRU tends to perform well)
- Approximation of LRU in real systems (Clock algorithm, used in Linux)
- Optimal (MIN) algorithm as a theoretical lower bound, not implementable in practice (needs future knowledge)

## 10. Success Criteria
- All four algorithms produce correct fault/hit sequences, verified against known textbook examples
- Belady's anomaly example reproduces the expected result (more frames → more faults for FIFO)
- Live animation runs smoothly and is understandable to someone unfamiliar with the algorithm
- Comparison view clearly shows relative performance across algorithms

## 11. Timeline
Single-session build: core simulation logic → animated visualization → comparison view → polish. Target: demo-ready same day.
