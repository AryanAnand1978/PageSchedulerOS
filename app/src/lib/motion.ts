export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Maps speed value (0.5x to 3.0x) to step delay in ms [180ms to 1600ms]
 */
export function speedToDelayMs(speed: number): number {
  // 1x = 750ms. 0.5x = 1500ms. 3x = 250ms.
  const base = 750
  const delay = Math.round(base / speed)
  return Math.max(180, Math.min(1600, delay))
}

/**
 * Calculates anime.js layout animation duration based on step delay
 * Rule: never outrun the tick -> duration = Math.min(420, stepDelayMs * 0.55)
 */
export function getLayoutDuration(stepDelayMs: number): number {
  if (prefersReducedMotion()) return 0
  return Math.min(420, Math.max(80, Math.round(stepDelayMs * 0.55)))
}
