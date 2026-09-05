import { create } from 'zustand'
import {
  type AlgorithmId,
  type SimulationResult,
  runAll,
  parseReferenceString,
  clampFrameCount,
  PRESETS,
} from '../sim'

export interface SimState {
  // Config state
  input: string
  parsedReferences: number[]
  parseError: string | null
  frameCount: number
  algorithm: AlgorithmId
  mode: 'focus' | 'compare'

  // Playback state
  results: Record<AlgorithmId, SimulationResult>
  stepIndex: number // -1 = unstarted / blank RAM, 0..totalSteps - 1
  playing: boolean
  speed: number // 0.5 to 3.0

  // Actions
  setInput: (input: string) => void
  setFrameCount: (count: number) => void
  setAlgorithm: (algo: AlgorithmId) => void
  setMode: (mode: 'focus' | 'compare') => void
  setSpeed: (speed: number) => void
  setPlaying: (playing: boolean) => void
  togglePlay: () => void
  stepForward: () => void
  stepBack: () => void
  seek: (step: number) => void
  reset: () => void
  loadPreset: (presetId: string) => void
}

const defaultPreset = PRESETS[0]
const initialParsed = parseReferenceString(defaultPreset.referenceString)
const initialRefs = initialParsed.valid ? initialParsed.data : []
const initialFrames = defaultPreset.defaultFrames
const initialResults = runAll(initialRefs, initialFrames)

export const useSimStore = create<SimState>((set, get) => ({
  input: defaultPreset.referenceString,
  parsedReferences: initialRefs,
  parseError: null,
  frameCount: initialFrames,
  algorithm: 'FIFO',
  mode: 'focus',

  results: initialResults,
  stepIndex: -1,
  playing: false,
  speed: 1.0,

  setInput: (rawInput: string) => {
    const { frameCount } = get()
    const parsed = parseReferenceString(rawInput)
    if (parsed.valid) {
      const results = runAll(parsed.data, frameCount)
      set({
        input: rawInput,
        parsedReferences: parsed.data,
        parseError: null,
        results,
        stepIndex: -1,
        playing: false,
      })
    } else {
      set({
        input: rawInput,
        parseError: parsed.error,
        playing: false,
      })
    }
  },

  setFrameCount: (count: number) => {
    const validCount = clampFrameCount(count)
    const { parsedReferences } = get()
    const results = runAll(parsedReferences, validCount)
    set({
      frameCount: validCount,
      results,
      stepIndex: -1,
      playing: false,
    })
  },

  setAlgorithm: (algorithm: AlgorithmId) => {
    set({ algorithm, playing: false })
  },

  setMode: (mode: 'focus' | 'compare') => {
    set({ mode })
  },

  setSpeed: (speed: number) => {
    set({ speed: Math.max(0.5, Math.min(3.0, speed)) })
  },

  setPlaying: (playing: boolean) => {
    const { stepIndex, results, algorithm } = get()
    const totalSteps = results[algorithm]?.steps.length ?? 0
    if (playing && stepIndex >= totalSteps - 1) {
      // If at end and hit play, restart from beginning
      set({ stepIndex: 0, playing: true })
    } else {
      set({ playing })
    }
  },

  togglePlay: () => {
    const { playing, setPlaying } = get()
    setPlaying(!playing)
  },

  stepForward: () => {
    const { stepIndex, results, algorithm, playing } = get()
    const totalSteps = results[algorithm]?.steps.length ?? 0
    if (stepIndex < totalSteps - 1) {
      set({ stepIndex: stepIndex + 1 })
    } else if (playing) {
      set({ playing: false })
    }
  },

  stepBack: () => {
    const { stepIndex } = get()
    if (stepIndex > -1) {
      set({ stepIndex: stepIndex - 1, playing: false })
    }
  },

  seek: (targetStep: number) => {
    const { results, algorithm } = get()
    const totalSteps = results[algorithm]?.steps.length ?? 0
    const clamped = Math.max(-1, Math.min(totalSteps - 1, targetStep))
    set({ stepIndex: clamped, playing: false })
  },

  reset: () => {
    set({ stepIndex: -1, playing: false })
  },

  loadPreset: (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) return
    const parsed = parseReferenceString(preset.referenceString)
    const refs = parsed.valid ? parsed.data : []
    const results = runAll(refs, preset.defaultFrames)

    set({
      input: preset.referenceString,
      parsedReferences: refs,
      parseError: null,
      frameCount: preset.defaultFrames,
      results,
      stepIndex: -1,
      playing: false,
    })
  },
}))
