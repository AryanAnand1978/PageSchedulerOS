import gsap from 'gsap'
import { prefersReducedMotion } from '../lib/motion'

/**
 * Mount intro animation: header, config, controls, viz staggered in.
 * Scoped to container using gsap.context.
 */
export function playAppIntro(container: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {}

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from('.gsap-header', {
      y: -20,
      opacity: 0,
      duration: 0.6,
    })
      .from(
        '.gsap-config',
        {
          y: 20,
          opacity: 0,
          duration: 0.5,
        },
        '-=0.3'
      )
      .from(
        '.gsap-controls',
        {
          y: 15,
          opacity: 0,
          duration: 0.5,
        },
        '-=0.3'
      )
      .from(
        '.gsap-viz',
        {
          opacity: 0,
          scale: 0.98,
          duration: 0.5,
        },
        '-=0.2'
      )
  }, container)

  return () => ctx.revert()
}

export interface CounterTweenController {
  update: (targetValue: number, format?: (v: number) => string) => void
  kill: () => void
}

/**
 * High-performance numeric counter tween targeting a direct DOM node.
 * Bypasses React state to avoid 60 re-renders per second.
 */
export function createCounterTween(
  node: HTMLElement,
  initialValue = 0,
  defaultFormat: (v: number) => string = Math.round as any
): CounterTweenController {
  const proxy = { val: initialValue }
  let activeTween: gsap.core.Tween | null = null

  node.textContent = defaultFormat(initialValue)

  function update(targetValue: number, format = defaultFormat) {
    if (prefersReducedMotion()) {
      proxy.val = targetValue
      node.textContent = format(targetValue)
      return
    }

    if (activeTween) activeTween.kill()

    activeTween = gsap.to(proxy, {
      val: targetValue,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate: () => {
        node.textContent = format(proxy.val)
      },
      onComplete: () => {
        proxy.val = targetValue
        node.textContent = format(targetValue)
      },
    })
  }

  function kill() {
    if (activeTween) {
      activeTween.kill()
      activeTween = null
    }
  }

  return { update, kill }
}
