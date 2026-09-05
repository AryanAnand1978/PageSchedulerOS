import type { AlgorithmId, SimulationResult } from './types'
import { simulateFifo } from './fifo'
import { simulateLru } from './lru'
import { simulateOptimal } from './optimal'
import { simulateClock } from './clock'

export * from './types'
export * from './fifo'
export * from './lru'
export * from './optimal'
export * from './clock'
export * from './parse'
export * from './presets'

export interface AlgorithmMetadata {
  id: AlgorithmId
  name: string
  shortName: string
  description: string
  simulate: (references: number[], frameCount: number) => SimulationResult
}

export const ALGORITHMS: Record<AlgorithmId, AlgorithmMetadata> = {
  FIFO: {
    id: 'FIFO',
    name: 'First-In, First-Out',
    shortName: 'FIFO',
    description: 'Evicts the page that has been in memory the longest, regardless of recent usage.',
    simulate: simulateFifo,
  },
  LRU: {
    id: 'LRU',
    name: 'Least Recently Used',
    shortName: 'LRU',
    description: 'Evicts the page that has not been referenced for the longest period of time.',
    simulate: simulateLru,
  },
  OPTIMAL: {
    id: 'OPTIMAL',
    name: "Optimal (Belady's MIN)",
    shortName: 'OPT',
    description: 'Evicts the page that will not be used for the longest period of time in the future (theoretical lower bound).',
    simulate: simulateOptimal,
  },
  CLOCK: {
    id: 'CLOCK',
    name: 'Clock (Second Chance)',
    shortName: 'Clock',
    description: 'Approximates LRU using a circular buffer with reference bits and a sweeping hand.',
    simulate: simulateClock,
  },
}

export const ALGORITHM_IDS: AlgorithmId[] = ['FIFO', 'LRU', 'OPTIMAL', 'CLOCK']

export function runAll(references: number[], frameCount: number): Record<AlgorithmId, SimulationResult> {
  return {
    FIFO: simulateFifo(references, frameCount),
    LRU: simulateLru(references, frameCount),
    OPTIMAL: simulateOptimal(references, frameCount),
    CLOCK: simulateClock(references, frameCount),
  }
}

export interface BeladyAnomaly {
  algorithm: AlgorithmId
  smallerFrames: number
  largerFrames: number
  smallerFaults: number
  largerFaults: number
}

export interface BeladySweepResult {
  chartData: Array<{
    frames: number
    FIFO: number
    LRU: number
    OPTIMAL: number
    CLOCK: number
  }>
  anomalies: BeladyAnomaly[]
}

export function beladySweep(references: number[], maxFrames = 8): BeladySweepResult {
  const chartData: BeladySweepResult['chartData'] = []
  const anomalies: BeladyAnomaly[] = []

  if (references.length === 0) {
    return { chartData: [], anomalies: [] }
  }

  const prevFaults: Partial<Record<AlgorithmId, number>> = {}

  for (let f = 1; f <= maxFrames; f++) {
    const fifo = simulateFifo(references, f).faults
    const lru = simulateLru(references, f).faults
    const opt = simulateOptimal(references, f).faults
    const clock = simulateClock(references, f).faults

    chartData.push({
      frames: f,
      FIFO: fifo,
      LRU: lru,
      OPTIMAL: opt,
      CLOCK: clock,
    })

    const currFaults: Record<AlgorithmId, number> = {
      FIFO: fifo,
      LRU: lru,
      OPTIMAL: opt,
      CLOCK: clock,
    }

    if (f > 1) {
      for (const alg of ALGORITHM_IDS) {
        const prev = prevFaults[alg]
        const curr = currFaults[alg]
        if (prev !== undefined && curr > prev) {
          anomalies.push({
            algorithm: alg,
            smallerFrames: f - 1,
            largerFrames: f,
            smallerFaults: prev,
            largerFaults: curr,
          })
        }
      }
    }

    for (const alg of ALGORITHM_IDS) {
      prevFaults[alg] = currFaults[alg]
    }
  }

  return { chartData, anomalies }
}
