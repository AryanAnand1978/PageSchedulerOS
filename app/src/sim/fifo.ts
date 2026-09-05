import type { SimulationResult, TraceStep } from './types'

export function simulateFifo(references: number[], frameCount: number): SimulationResult {
  const frames: (number | null)[] = Array(frameCount).fill(null)
  const frameQueue: number[] = [] // indices of frames in arrival order
  const steps: TraceStep[] = []
  let faults = 0
  let hits = 0

  for (let i = 0; i < references.length; i++) {
    const page = references[i]
    const hitFrameIndex = frames.indexOf(page)

    if (hitFrameIndex !== -1) {
      // HIT
      hits++
      steps.push({
        index: i,
        page,
        hit: true,
        frames: [...frames],
        hitFrame: hitFrameIndex,
        loadedFrame: null,
        victimFrame: null,
        victimPage: null,
        faultsSoFar: faults,
        hitsSoFar: hits,
        reason: `Hit — page ${page} already resident in frame ${hitFrameIndex}`,
        meta: {
          queue: frameQueue.map(f => frames[f] as number),
        },
      })
    } else {
      // FAULT
      faults++
      const emptyFrameIndex = frames.indexOf(null)

      if (emptyFrameIndex !== -1) {
        // Cold start compulsory miss
        frames[emptyFrameIndex] = page
        frameQueue.push(emptyFrameIndex)

        steps.push({
          index: i,
          page,
          hit: false,
          frames: [...frames],
          hitFrame: null,
          loadedFrame: emptyFrameIndex,
          victimFrame: null,
          victimPage: null,
          faultsSoFar: faults,
          hitsSoFar: hits,
          reason: `Fault (compulsory miss) — loaded page ${page} into empty frame ${emptyFrameIndex}`,
          meta: {
            queue: frameQueue.map(f => frames[f] as number),
          },
        })
      } else {
        // Eviction needed: pop oldest frame from queue
        const victimFrameIndex = frameQueue.shift()!
        const victimPage = frames[victimFrameIndex]!
        frames[victimFrameIndex] = page
        frameQueue.push(victimFrameIndex)

        steps.push({
          index: i,
          page,
          hit: false,
          frames: [...frames],
          hitFrame: null,
          loadedFrame: victimFrameIndex,
          victimFrame: victimFrameIndex,
          victimPage,
          faultsSoFar: faults,
          hitsSoFar: hits,
          reason: `Fault — frame ${victimFrameIndex} held page ${victimPage} (oldest in FIFO queue) → evicted, loaded page ${page}`,
          meta: {
            queue: frameQueue.map(f => frames[f] as number),
          },
        })
      }
    }
  }

  return {
    algorithm: 'FIFO',
    frameCount,
    references,
    steps,
    faults,
    hits,
    hitRatio: references.length > 0 ? hits / references.length : 0,
  }
}
