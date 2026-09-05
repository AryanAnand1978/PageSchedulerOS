import { createLayout } from 'animejs'
import type { SimState } from '../store/useSimStore'
import { speedToDelayMs, getLayoutDuration, prefersReducedMotion } from '../lib/motion'

export interface RefStripController {
  sync: (state: SimState) => void
  destroy: () => void
}

export function createRefStrip(rootEl: HTMLElement): RefStripController {
  let layout: any = null
  let prevStep = -1
  let prevAlgo = ''
  let prevInput = ''

  function initLayout(duration: number) {
    if (layout) {
      try {
        layout.revert()
      } catch {
        // ignore
      }
    }

    const isReduced = prefersReducedMotion()
    layout = createLayout(rootEl, {
      duration: isReduced ? 0 : duration,
      ease: 'outQuad',
      enterFrom: {
        transform: 'translateY(60px) scale(0.3)',
        opacity: 0,
        duration: isReduced ? 0 : Math.round(duration * 1.3),
        ease: 'out(3)',
      },
    })
  }

  initLayout(250)

  function makeCard(stepIdx: number, page: number, hit: boolean, isLatest: boolean): HTMLElement {
    const card = document.createElement('div')
    card.id = `ref-card-${stepIdx}`
    card.className = `ref-card flex flex-col items-center justify-between min-w-[50px] w-[50px] h-[66px] px-1.5 py-1 rounded-[3px] border select-none flex-shrink-0 transition-colors ${
      isLatest
        ? 'border-[#88C0D0] bg-[#434C5E]'
        : 'border-[#434C5E] bg-[#3B4252]'
    }`

    const topRow = document.createElement('div')
    topRow.className = 'flex items-center justify-between w-full text-[10px] font-sans'
    const idxSpan = document.createElement('span')
    idxSpan.className = 'text-[#78839b] font-sans'
    idxSpan.textContent = `#${stepIdx}`
    const tagSpan = document.createElement('span')
    tagSpan.className = `font-medium ${hit ? 'text-[#A3BE8C]' : 'text-[#BF616A]'}`
    tagSpan.textContent = hit ? 'HIT' : 'MISS'
    topRow.appendChild(idxSpan)
    topRow.appendChild(tagSpan)

    const numDiv = document.createElement('div')
    numDiv.className = 'text-xl font-bold font-mono tracking-tight text-[#ECEFF4]'
    const numSpan = document.createElement('span')
    numSpan.textContent = String(page)
    numDiv.appendChild(numSpan)

    card.appendChild(topRow)
    card.appendChild(numDiv)
    return card
  }

  function snapTo(state: SimState) {
    rootEl.innerHTML = ''
    const steps = state.results[state.algorithm]?.steps ?? []
    const targetStep = state.stepIndex

    if (targetStep >= 0 && targetStep < steps.length) {
      for (let i = 0; i <= targetStep; i++) {
        const s = steps[i]
        rootEl.appendChild(makeCard(s.index, s.page, s.hit, i === targetStep))
      }
    }
    rootEl.scrollLeft = rootEl.scrollWidth
    prevStep = targetStep
    prevAlgo = state.algorithm
    prevInput = state.input
  }

  function sync(state: SimState) {
    const steps = state.results[state.algorithm]?.steps ?? []
    const currStep = state.stepIndex
    const currAlgo = state.algorithm
    const currInput = state.input

    if (currAlgo !== prevAlgo || currInput !== prevInput) {
      snapTo(state)
      return
    }

    if (currStep === prevStep + 1 && currStep >= 0 && currStep < steps.length) {
      const step = steps[currStep]
      const delayMs = speedToDelayMs(state.speed)
      const duration = getLayoutDuration(delayMs)

      const prevLatest = rootEl.querySelector(`#ref-card-${prevStep}`)
      if (prevLatest) {
        prevLatest.classList.remove('border-[#88C0D0]', 'bg-[#434C5E]')
        prevLatest.classList.add('border-[#434C5E]', 'bg-[#3B4252]')
      }

      if (layout && duration > 0) {
        layout.update(() => {
          rootEl.appendChild(makeCard(step.index, step.page, step.hit, true))
        }).then(() => {
          rootEl.scrollTo({ left: rootEl.scrollWidth, behavior: 'smooth' })
        })
      } else {
        rootEl.appendChild(makeCard(step.index, step.page, step.hit, true))
        rootEl.scrollLeft = rootEl.scrollWidth
      }

      prevStep = currStep
      return
    }

    if (currStep === prevStep - 1 && prevStep >= 0) {
      const lastChild = rootEl.lastElementChild
      if (lastChild) {
        lastChild.remove()
      }
      const newLatest = rootEl.querySelector(`#ref-card-${currStep}`)
      if (newLatest) {
        newLatest.classList.remove('border-[#434C5E]', 'bg-[#3B4252]')
        newLatest.classList.add('border-[#88C0D0]', 'bg-[#434C5E]')
      }
      prevStep = currStep
      return
    }

    snapTo(state)
  }

  function destroy() {
    if (layout) {
      try {
        layout.revert()
      } catch {
        // ignore
      }
      layout = null
    }
  }

  return { sync, destroy }
}
