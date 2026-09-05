import type { SimulationResult, TraceStep } from './types'

export function simulateOptimal(references: number[], frameCount: number): SimulationResult {
  const frames: (number | null)[] = Array(frameCount).fill(null)
  const steps: TraceStep[] = []
  let faults = 0
  let hits = 0

  const computeNextUse = (currentStep: number): Record<number, number | null> => {
    const nextUseMap: Record<number, number | null> = {}
    for (const p of frames) {
      if (p === null) continue
      let nextIdx: number | null = null
      for (let j = currentStep + 1; j < references.length; j++) {
        if (references[j] === p) {
          nextIdx = j
          break
        }
      }
      nextUseMap[p] = nextIdx
    }
    return nextUseMap
  }

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
        reason: `Hit — page ${page} resident in frame ${hitFrameIndex}`,
        meta: {
          nextUse: computeNextUse(i),
        },
      })
    } else {
      // FAULT
      faults++
      const emptyFrameIndex = frames.indexOf(null)

      if (emptyFrameIndex !== -1) {
        // Compulsory miss
        frames[emptyFrameIndex] = page

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
            nextUse: computeNextUse(i),
          },
        })
      } else {
        // Evict page with farthest next reference (tie break: lowest frame index)
        let victimFrame = 0
        let maxDistance = -1

        for (let f = 0; f < frameCount; f++) {
          const residentPage = frames[f]!
          let nextRef = Infinity
          for (let j = i + 1; j < references.length; j++) {
            if (references[j] === residentPage) {
              nextRef = j
              break
            }
          }

          // If strictly greater distance, pick it.
          // Tie-break: lowest frame index is preserved because loop runs 0..frameCount-1 and uses '>'
          if (nextRef > maxDistance) {
            maxDistance = nextRef
            victimFrame = f
          }
        }

        const victimPage = frames[victimFrame]!
        frames[victimFrame] = page

        steps.push({
          index: i,
          page,
          hit: false,
          frames: [...frames],
          hitFrame: null,
          loadedFrame: victimFrame,
          victimFrame,
          victimPage,
          faultsSoFar: faults,
          hitsSoFar: hits,
          reason: `Fault — frame ${victimFrame} held page ${victimPage} (next use: ${maxDistance === Infinity ? 'never' : `step ${maxDistance}`}, farthest) → evicted, loaded page ${page}`,
          meta: {
            nextUse: computeNextUse(i),
          },
        })
      }
    }
  }

  return {
    algorithm: 'OPTIMAL',
    frameCount,
    references,
    steps,
    faults,
    hits,
    hitRatio: references.length > 0 ? hits / references.length : 0,
  }
}
