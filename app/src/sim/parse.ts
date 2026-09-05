export interface ParseResult {
  valid: boolean
  data: number[]
  error: string | null
}

export const MAX_REFERENCES = 64
export const MIN_FRAMES = 1
export const MAX_FRAMES = 8
export const DEFAULT_FRAMES = 3

export function parseReferenceString(input: string): ParseResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { valid: true, data: [], error: null }
  }

  const tokens = trimmed.split(/[\s,]+/)
  const data: number[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token) continue

    // Reject non-integers, floats, negative numbers
    if (!/^\d+$/.test(token)) {
      return {
        valid: false,
        data: [],
        error: `Invalid token "${token}" at position ${i + 1}. Only non-negative integers (0, 1, 2...) are allowed.`,
      }
    }

    const num = parseInt(token, 10)
    if (Number.isNaN(num) || num < 0 || num > 999) {
      return {
        valid: false,
        data: [],
        error: `Page number ${token} is out of supported range (0–999).`,
      }
    }

    data.push(num)
  }

  if (data.length > MAX_REFERENCES) {
    return {
      valid: false,
      data: [],
      error: `Reference string exceeds maximum length of ${MAX_REFERENCES} references (found ${data.length}).`,
    }
  }

  return { valid: true, data, error: null }
}

export function clampFrameCount(count: number): number {
  if (Number.isNaN(count)) return DEFAULT_FRAMES
  return Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, Math.round(count)))
}
