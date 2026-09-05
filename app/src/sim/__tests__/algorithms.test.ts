import { describe, expect, it } from 'vitest'
import {
  simulateFifo,
  runAll,
  beladySweep,
  parseReferenceString,
  clampFrameCount,
  ALGORITHM_IDS,
} from '../index'

describe('Page Replacement Simulation Golden Tests', () => {
  const silberschatzRefs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]

  it('matches canonical textbook figures for Silberschatz 20-ref string at 3 frames', () => {
    const frameCount = 3
    const results = runAll(silberschatzRefs, frameCount)

    // FIFO: 15 faults, 5 hits
    expect(results.FIFO.faults).toBe(15)
    expect(results.FIFO.hits).toBe(5)
    expect(results.FIFO.hitRatio).toBeCloseTo(5 / 20)

    // LRU: 12 faults, 8 hits
    expect(results.LRU.faults).toBe(12)
    expect(results.LRU.hits).toBe(8)
    expect(results.LRU.hitRatio).toBeCloseTo(8 / 20)

    // OPTIMAL: 9 faults, 11 hits
    expect(results.OPTIMAL.faults).toBe(9)
    expect(results.OPTIMAL.hits).toBe(11)
    expect(results.OPTIMAL.hitRatio).toBeCloseTo(11 / 20)

    // CLOCK: 14 faults, 6 hits (refBit=1 on load convention)
    expect(results.CLOCK.faults).toBe(14)
    expect(results.CLOCK.hits).toBe(6)
    expect(results.CLOCK.hitRatio).toBeCloseTo(6 / 20)
  })

  it("reproduces Bélády's Anomaly exactly under FIFO (3 frames: 9 faults, 4 frames: 10 faults)", () => {
    const beladyRefs = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]

    const fifo3 = simulateFifo(beladyRefs, 3)
    const fifo4 = simulateFifo(beladyRefs, 4)

    expect(fifo3.faults).toBe(9)
    expect(fifo4.faults).toBe(10)
    expect(fifo4.faults).toBeGreaterThan(fifo3.faults)

    // Verify sweep detects this anomaly
    const sweep = beladySweep(beladyRefs, 5)
    const fifoAnomaly = sweep.anomalies.find(
      a => a.algorithm === 'FIFO' && a.smallerFrames === 3 && a.largerFrames === 4
    )
    expect(fifoAnomaly).toBeDefined()
    expect(fifoAnomaly?.smallerFaults).toBe(9)
    expect(fifoAnomaly?.largerFaults).toBe(10)
  })
})

describe('Structural Invariants across all algorithms', () => {
  const testStrings = [
    [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
    [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
    [0, 1, 2, 3, 4, 0, 1, 2, 3, 4],
    [4, 3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1],
  ]

  const testFrameCounts = [1, 2, 3, 4, 5]

  testStrings.forEach((refs, sIdx) => {
    testFrameCounts.forEach(frames => {
      ALGORITHM_IDS.forEach(algId => {
        it(`${algId} string #${sIdx} @ ${frames} frames satisfies all structural invariants`, () => {
          const res = runAll(refs, frames)[algId]

          // 1. Total refs invariant
          expect(res.faults + res.hits).toBe(refs.length)
          expect(res.steps.length).toBe(refs.length)

          // 2. Frame length and uniqueness invariant
          res.steps.forEach((step, stepIdx) => {
            expect(step.frames.length).toBe(frames)
            expect(step.index).toBe(stepIdx)
            expect(step.page).toBe(refs[stepIdx])

            const nonNullPages = step.frames.filter((p): p is number => p !== null)
            const uniquePages = new Set(nonNullPages)
            expect(uniquePages.size).toBe(nonNullPages.length) // No duplicate resident page

            // 3. Hit vs fault field contracts
            if (step.hit) {
              expect(step.hitFrame).not.toBeNull()
              expect(step.loadedFrame).toBeNull()
              expect(step.victimFrame).toBeNull()
              expect(step.victimPage).toBeNull()
            } else {
              expect(step.hitFrame).toBeNull()
              expect(step.loadedFrame).not.toBeNull()
              // If eviction happened, victimFrame and victimPage must both be non-null
              if (step.victimFrame !== null) {
                expect(step.victimPage).not.toBeNull()
              }
            }
          })
        })
      })
    })
  })

  it('verifies Optimal is a theoretical lower bound (Optimal faults <= min other faults)', () => {
    // Property test with diverse reference strings
    const randomStrings = [
      [1, 3, 0, 3, 5, 6, 3, 2, 4, 6, 1, 2, 3, 4, 5, 0],
      [2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2],
      [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2],
      [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
    ]

    for (const refs of randomStrings) {
      for (let f = 1; f <= 5; f++) {
        const results = runAll(refs, f)
        const opt = results.OPTIMAL.faults
        const fifo = results.FIFO.faults
        const lru = results.LRU.faults
        const clock = results.CLOCK.faults

        expect(opt).toBeLessThanOrEqual(fifo)
        expect(opt).toBeLessThanOrEqual(lru)
        expect(opt).toBeLessThanOrEqual(clock)
      }
    }
  })
})

describe('Input Parser & Sanitizer', () => {
  it('parses space, comma, newline delimited strings', () => {
    const res = parseReferenceString('7, 0, 1\n2 0\t3,4')
    expect(res.valid).toBe(true)
    expect(res.data).toEqual([7, 0, 1, 2, 0, 3, 4])
    expect(res.error).toBeNull()
  })

  it('handles empty input gracefully without throwing', () => {
    const res = parseReferenceString('   \n\t  ')
    expect(res.valid).toBe(true)
    expect(res.data).toEqual([])
    expect(res.error).toBeNull()
  })

  it('rejects negative numbers and characters with clear error message', () => {
    const res1 = parseReferenceString('7 0 -1 2')
    expect(res1.valid).toBe(false)
    expect(res1.error).toContain('Invalid token "-1"')

    const res2 = parseReferenceString('7 0 A 2')
    expect(res2.valid).toBe(false)
    expect(res2.error).toContain('Invalid token "A"')

    const res3 = parseReferenceString('7 0 1.5 2')
    expect(res3.valid).toBe(false)
    expect(res3.error).toContain('Invalid token "1.5"')
  })

  it('clamps frame counts between 1 and 8', () => {
    expect(clampFrameCount(0)).toBe(1)
    expect(clampFrameCount(-5)).toBe(1)
    expect(clampFrameCount(9)).toBe(8)
    expect(clampFrameCount(3.7)).toBe(4)
    expect(clampFrameCount(3)).toBe(3)
  })
})
