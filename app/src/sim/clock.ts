import type { SimulationResult, TraceStep } from './types'

export const REF_BIT_ON_LOAD: 0 | 1 = 1

export function simulateClock(references: number[], frameCount: number): SimulationResult {
  const frames: (number | null)[] = Array(frameCount).fill(null)
  const refBits: (0 | 1 | null)[] = Array(frameCount).fill(null)
  const steps: TraceStep[] = []
  let hand = 0
  let faults = 0
  let hits = 0

  for (let i = 0; i < references.length; i++) {
    const page = references[i]
    const hitFrameIndex = frames.indexOf(page)

    if (hitFrameIndex !== -1) {
      // HIT: set reference bit to 1, do NOT move hand
      hits++
      refBits[hitFrameIndex] = 1

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
        reason: `Hit — page ${page} resident in frame ${hitFrameIndex} (ref bit set to 1; hand stays at frame ${hand})`,
        meta: {
          hand,
          refBits: [...refBits],
          handSweep: [],
        },
      })
    } else {
      // FAULT
      faults++
      const emptyFrameIndex = frames.indexOf(null)

      if (emptyFrameIndex !== -1) {
        // Compulsory miss: load into empty frame
        frames[emptyFrameIndex] = page
        refBits[emptyFrameIndex] = REF_BIT_ON_LOAD
        const placedIndex = emptyFrameIndex
        // Advance hand past the loaded frame
        hand = (placedIndex + 1) % frameCount

        steps.push({
          index: i,
          page,
          hit: false,
          frames: [...frames],
          hitFrame: null,
          loadedFrame: placedIndex,
          victimFrame: null,
          victimPage: null,
          faultsSoFar: faults,
          hitsSoFar: hits,
          reason: `Fault (compulsory miss) — loaded page ${page} into frame ${placedIndex} (ref bit = 1; hand advanced to ${hand})`,
          meta: {
            hand,
            refBits: [...refBits],
            handSweep: [],
          },
        })
      } else {
        // Second chance sweep
        const handSweep: number[] = []

        while (refBits[hand] === 1) {
          refBits[hand] = 0
          handSweep.push(hand)
          hand = (hand + 1) % frameCount
        }

        // Now refBits[hand] is 0 -> evict this frame
        handSweep.push(hand)
        const victimFrame = hand
        const victimPage = frames[victimFrame]!

        frames[victimFrame] = page
        refBits[victimFrame] = REF_BIT_ON_LOAD
        // Advance hand to (victimFrame + 1) % frameCount
        hand = (victimFrame + 1) % frameCount

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
          reason: `Fault — hand swept frames [${handSweep.join(', ')}]; evicting frame ${victimFrame} (page ${victimPage}, ref bit was 0) → loaded ${page}; hand advanced to ${hand}`,
          meta: {
            hand,
            refBits: [...refBits],
            handSweep,
          },
        })
      }
    }
  }

  return {
    algorithm: 'CLOCK',
    frameCount,
    references,
    steps,
    faults,
    hits,
    hitRatio: references.length > 0 ? hits / references.length : 0,
  }
}
