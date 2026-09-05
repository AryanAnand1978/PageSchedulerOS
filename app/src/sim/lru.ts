import type { SimulationResult, TraceStep } from './types'

export function simulateLru(references: number[], frameCount: number): SimulationResult {
  const frames: (number | null)[] = Array(frameCount).fill(null)
  const lastUsed = new Map<number, number>() // page -> step index when last referenced
  const steps: TraceStep[] = []
  let faults = 0
  let hits = 0

  const getRecencyOrder = (): number[] => {
    return (frames.filter(p => p !== null) as number[])
      .sort((a, b) => (lastUsed.get(b) ?? -1) - (lastUsed.get(a) ?? -1))
  }

  for (let i = 0; i < references.length; i++) {
    const page = references[i]
    const hitFrameIndex = frames.indexOf(page)

    if (hitFrameIndex !== -1) {
      // HIT
      hits++
      lastUsed.set(page, i)

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
        reason: `Hit — page ${page} resident in frame ${hitFrameIndex} (marked as MRU)`,
        meta: {
          recency: getRecencyOrder(),
        },
      })
    } else {
      // FAULT
      faults++
      const emptyFrameIndex = frames.indexOf(null)

      if (emptyFrameIndex !== -1) {
        // Compulsory miss
        frames[emptyFrameIndex] = page
        lastUsed.set(page, i)

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
            recency: getRecencyOrder(),
          },
        })
      } else {
        // Evict LRU page
        let lruFrame = 0
        let oldestTime = Infinity

        for (let f = 0; f < frameCount; f++) {
          const residentPage = frames[f]!
          const time = lastUsed.get(residentPage) ?? -1
          if (time < oldestTime) {
            oldestTime = time
            lruFrame = f
          }
        }

        const victimPage = frames[lruFrame]!
        frames[lruFrame] = page
        lastUsed.set(page, i)

        steps.push({
          index: i,
          page,
          hit: false,
          frames: [...frames],
          hitFrame: null,
          loadedFrame: lruFrame,
          victimFrame: lruFrame,
          victimPage,
          faultsSoFar: faults,
          hitsSoFar: hits,
          reason: `Fault — frame ${lruFrame} held page ${victimPage} (least recently used, last accessed at step ${oldestTime}) → evicted, loaded page ${page}`,
          meta: {
            recency: getRecencyOrder(),
          },
        })
      }
    }
  }

  return {
    algorithm: 'LRU',
    frameCount,
    references,
    steps,
    faults,
    hits,
    hitRatio: references.length > 0 ? hits / references.length : 0,
  }
}
