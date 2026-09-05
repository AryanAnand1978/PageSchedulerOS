import { prefersReducedMotion } from '../lib/motion'

export function getRefStripLayoutOptions(durationMs = 250) {
  const isReduced = prefersReducedMotion()
  return {
    duration: isReduced ? 0 : durationMs,
    ease: 'outQuad',
    enterFrom: {
      transform: 'translateY(80px) scale(0.3)',
      opacity: 0,
      duration: isReduced ? 0 : Math.round(durationMs * 1.3),
      ease: 'out(3)',
    },
  }
}

export function getFrameGridLayoutOptions(durationMs = 320) {
  const isReduced = prefersReducedMotion()
  return {
    duration: isReduced ? 0 : durationMs,
    ease: 'outQuad',
    enterFrom: {
      transform: 'translateY(56px) scale(0.8)',
      opacity: 0,
      duration: isReduced ? 0 : Math.round(durationMs * 1.1),
      ease: 'out(3)',
    },
    leaveTo: {
      transform: 'translateY(-64px) scale(0.7)',
      opacity: 0,
      duration: isReduced ? 0 : durationMs,
      ease: 'out(2)',
    },
  }
}
