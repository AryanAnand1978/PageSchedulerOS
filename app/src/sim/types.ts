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
  reason: string                 // Human-readable summary of the step decision
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
  hitRatio: number               // hits / references.length
}
