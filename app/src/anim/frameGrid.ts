import { createLayout } from 'animejs'
import type { AlgorithmId } from '../sim'
import type { SimState } from '../store/useSimStore'
import { speedToDelayMs, getLayoutDuration, prefersReducedMotion } from '../lib/motion'

export interface FrameGridOptions {
  variant?: 'main' | 'mini'
  fixedAlgorithm?: AlgorithmId // For compare view mini grids
  handOverlayEl?: HTMLElement | null
  captionEl?: HTMLElement | null
}

export interface FrameGridController {
  sync: (state: SimState) => void
  destroy: () => void
}

export function createFrameGrid(
  rootEl: HTMLElement,
  options: FrameGridOptions = {}
): FrameGridController {
  const { variant = 'main', fixedAlgorithm, handOverlayEl, captionEl } = options
  const isMini = variant === 'mini'

  let layout: any = null
  let prevStep = -1
  let prevAlgo = ''
  let prevFrameCount = -1

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
      children: '.page-card',
      duration: isReduced ? 0 : duration,
      ease: 'outQuad',
      enterFrom: {
        transform: isMini ? 'translateY(24px) scale(0.9)' : 'translateY(48px) scale(0.85)',
        opacity: 0,
        duration: isReduced ? 0 : Math.round(duration * 1.1),
        ease: 'out(3)',
      },
      leaveTo: {
        transform: isMini ? 'translateY(-24px) scale(0.8)' : 'translateY(-48px) scale(0.75)',
        opacity: 0,
        duration: isReduced ? 0 : duration,
        ease: 'out(2)',
      },
    })
  }

  initLayout(320)

  function buildGridStructure(frameCount: number) {
    rootEl.innerHTML = ''
    // Tight edge-to-edge contiguous memory strip with hairline 1px divider between slots
    rootEl.className = `frame-grid-root grid w-full items-stretch divide-x divide-[#434C5E] border border-[#434C5E] rounded-[3px] overflow-hidden bg-[#2E3440]`
    rootEl.style.gridTemplateColumns = `repeat(${frameCount}, minmax(0, 1fr))`

    for (let f = 0; f < frameCount; f++) {
      const slot = document.createElement('div')
      slot.className = `frame-slot relative flex flex-col justify-between bg-[#3B4252] transition-colors ${
        isMini ? 'h-[72px] p-1.5' : 'h-[118px] p-2.5'
      }`
      slot.dataset.slotIndex = String(f)

      const header = document.createElement('div')
      header.className = `slot-header flex items-center justify-between font-sans text-[#78839b] font-normal ${
        isMini ? 'text-[10px]' : 'text-xs'
      }`
      const frameLabel = document.createElement('span')
      frameLabel.textContent = isMini ? `F${f}` : `Frame ${f}`
      header.appendChild(frameLabel)

      const host = document.createElement('div')
      host.className = 'card-host relative w-full h-full flex items-center justify-center overflow-hidden'
      host.dataset.slotHost = String(f)

      const emptyText = document.createElement('span')
      emptyText.className = `empty-placeholder font-sans text-[#4C566A] select-none ${
        isMini ? 'text-[10px]' : 'text-xs'
      }`
      emptyText.textContent = isMini ? '—' : 'empty'
      host.appendChild(emptyText)

      slot.appendChild(header)
      slot.appendChild(host)
      rootEl.appendChild(slot)
    }
  }

  function createCardElement(
    page: number,
    slotIdx: number,
    refBit: 0 | 1 | null = null,
    algo: AlgorithmId = 'FIFO',
    meta: any = null
  ): HTMLElement {
    const card = document.createElement('div')
    card.dataset.layoutId = `page-${page}`
    card.dataset.page = String(page)
    card.dataset.slot = String(slotIdx)

    if (isMini) {
      card.className =
        'page-card absolute inset-0 flex items-center justify-center bg-[#3B4252] font-mono select-none border border-transparent'
      const span = document.createElement('span')
      span.className = 'text-base font-bold text-[#ECEFF4] font-mono tracking-tight'
      span.textContent = String(page)
      card.appendChild(span)
      return card
    }

    card.className =
      'page-card absolute inset-0 flex flex-col items-center justify-between p-2 bg-[#3B4252] font-mono select-none text-[#ECEFF4] border border-transparent transition-colors'

    const topInfo = document.createElement('div')
    topInfo.className = 'w-full flex items-center justify-between text-[11px] text-[#78839b] font-sans'
    const pageTag = document.createElement('span')
    pageTag.textContent = `Page`
    topInfo.appendChild(pageTag)

    if (algo === 'CLOCK' && refBit !== null) {
      const bitTag = document.createElement('span')
      bitTag.className = `px-1 py-0.2 rounded-[2px] text-[10px] font-mono ${
        refBit === 1 ? 'text-[#88C0D0] bg-[#434C5E]' : 'text-[#4C566A]'
      }`
      bitTag.textContent = `R:${refBit}`
      topInfo.appendChild(bitTag)
    } else if (algo === 'LRU' && meta?.recency) {
      const rank = meta.recency.indexOf(page)
      if (rank !== -1) {
        const rankTag = document.createElement('span')
        rankTag.className = 'text-[10px] text-[#78839b] font-sans'
        rankTag.textContent = rank === 0 ? 'MRU' : rank === meta.recency.length - 1 ? 'LRU' : `#${rank + 1}`
        topInfo.appendChild(rankTag)
      }
    } else if (algo === 'OPTIMAL' && meta?.nextUse) {
      const next = meta.nextUse[page]
      const nextTag = document.createElement('span')
      nextTag.className = 'text-[10px] text-[#78839b] font-sans'
      nextTag.textContent = next === null || next === undefined ? 'next: ∞' : `next: #${next}`
      topInfo.appendChild(nextTag)
    }

    const centerNum = document.createElement('div')
    centerNum.className = 'text-3xl font-bold font-mono tracking-tight text-[#ECEFF4] my-auto'
    const numSpan = document.createElement('span')
    numSpan.textContent = String(page)
    centerNum.appendChild(numSpan)

    card.appendChild(topInfo)
    card.appendChild(centerNum)
    return card
  }

  function updateClockHand(handPos: number | undefined, frameCount: number) {
    if (!handOverlayEl) return
    if (handPos === undefined || handPos < 0 || handPos >= frameCount) {
      handOverlayEl.style.display = 'none'
      return
    }

    const targetSlot = rootEl.querySelector(`[data-slot-index="${handPos}"]`) as HTMLElement
    if (!targetSlot) {
      handOverlayEl.style.display = 'none'
      return
    }

    handOverlayEl.style.display = 'flex'
    const rect = targetSlot.getBoundingClientRect()
    const parentRect = handOverlayEl.parentElement?.getBoundingClientRect() ?? { left: 0, top: 0 }

    const left = rect.left - parentRect.left + rect.width / 2 - 12
    const top = rect.top - parentRect.top - 20

    handOverlayEl.style.transform = `translate(${left}px, ${top}px)`
  }

  function clearActiveStates() {
    rootEl.querySelectorAll('.frame-slot').forEach(el => {
      el.classList.remove('ring-1', 'ring-[#88C0D0]', 'bg-[#434C5E]')
    })
  }

  function snapTo(state: SimState) {
    const algo = fixedAlgorithm ?? state.algorithm
    const stepIdx = state.stepIndex
    const simResult = state.results[algo]
    const steps = simResult?.steps ?? []
    const frameCount = state.frameCount

    if (frameCount !== prevFrameCount || rootEl.children.length !== frameCount) {
      buildGridStructure(frameCount)
      prevFrameCount = frameCount
    }

    clearActiveStates()

    // Clear any previous leaving or animating classes
    rootEl.querySelectorAll('.is-hit, .is-fault, .is-hidden').forEach(el => {
      el.classList.remove('is-hit', 'is-fault', 'is-hidden')
    })

    const step = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null
    const currentFrames = step ? step.frames : Array(frameCount).fill(null)
    const refBits = step?.meta?.refBits ?? []

    for (let f = 0; f < frameCount; f++) {
      const host = rootEl.querySelector(`[data-slot-host="${f}"]`) as HTMLElement
      if (!host) continue

      host.innerHTML = ''
      const page = currentFrames[f]
      if (page !== null && page !== undefined) {
        const bit = refBits[f] ?? null
        const card = createCardElement(page, f, bit, algo, step?.meta)
        host.appendChild(card)
      } else {
        const emptyText = document.createElement('span')
        emptyText.className = `empty-placeholder font-sans text-[#4C566A] select-none ${
          isMini ? 'text-[10px]' : 'text-xs'
        }`
        emptyText.textContent = isMini ? '—' : 'empty'
        host.appendChild(emptyText)
      }
    }

    if (step) {
      // Highlight active frame touched this step with frost blue tint
      const activeFrame = step.hit ? step.hitFrame : step.loadedFrame
      if (activeFrame !== null && activeFrame !== undefined) {
        const slot = rootEl.querySelector(`[data-slot-index="${activeFrame}"]`)
        if (slot) {
          slot.classList.add('ring-1', 'ring-[#88C0D0]', 'bg-[#434C5E]')
        }
      }
    }

    if (algo === 'CLOCK' && step?.meta?.hand !== undefined) {
      updateClockHand(step.meta.hand, frameCount)
    } else {
      updateClockHand(undefined, frameCount)
    }

    if (captionEl) {
      captionEl.textContent = step ? step.reason : 'Ready — memory is unallocated.'
    }

    prevStep = stepIdx
    prevAlgo = algo
  }

  function sync(state: SimState) {
    const algo = fixedAlgorithm ?? state.algorithm
    const stepIdx = state.stepIndex
    const frameCount = state.frameCount
    const simResult = state.results[algo]
    const steps = simResult?.steps ?? []

    // Rebuild immediately if frameCount or algorithm changed, or scrub/reset
    if (frameCount !== prevFrameCount || algo !== prevAlgo || Math.abs(stepIdx - prevStep) !== 1) {
      snapTo(state)
      return
    }

    // If step went backwards by 1, snap directly
    if (stepIdx === prevStep - 1) {
      snapTo(state)
      return
    }

    // Step forward by 1: animate transition
    if (stepIdx === prevStep + 1 && stepIdx >= 0 && stepIdx < steps.length) {
      const step = steps[stepIdx]
      const delayMs = speedToDelayMs(state.speed)
      const duration = getLayoutDuration(delayMs)

      clearActiveStates()

      // Clean old flash classes before starting new step
      rootEl.querySelectorAll('.is-hit, .is-fault').forEach(el => {
        el.classList.remove('is-hit', 'is-fault')
      })

      if (captionEl) {
        captionEl.textContent = step.reason
      }

      if (step.hit) {
        // HIT: no cards enter or leave. Highlight the hit card with muted green flash
        const hitSlot = rootEl.querySelector(`[data-slot-index="${step.hitFrame}"]`)
        if (hitSlot) {
          hitSlot.classList.add('ring-1', 'ring-[#88C0D0]', 'bg-[#434C5E]')
        }

        const hitCard = rootEl.querySelector(
          `[data-slot-host="${step.hitFrame}"] .page-card`
        ) as HTMLElement
        if (hitCard) {
          hitCard.classList.remove('is-hit')
          void hitCard.offsetWidth
          hitCard.classList.add('is-hit')
        }

        if (algo === 'CLOCK' && step.meta.hand !== undefined) {
          updateClockHand(step.meta.hand, frameCount)
        }
        prevStep = stepIdx
        return
      }

      // FAULT: page loaded, possibly evicting an existing page
      const loadedSlot = step.loadedFrame
      const victimSlot = step.victimFrame

      // Highlight the loaded frame slot with active frost blue tint
      if (loadedSlot !== null && loadedSlot !== undefined) {
        const slot = rootEl.querySelector(`[data-slot-index="${loadedSlot}"]`)
        if (slot) {
          slot.classList.add('ring-1', 'ring-[#88C0D0]', 'bg-[#434C5E]')
        }
      }

      if (layout && duration > 0) {
        layout
          .update(() => {
            // If eviction: mark old card as leaving via display:none (.is-hidden)
            if (victimSlot !== null && victimSlot !== undefined) {
              const oldHost = rootEl.querySelector(`[data-slot-host="${victimSlot}"]`)
              const oldCard = oldHost?.querySelector('.page-card')
              if (oldCard) {
                oldCard.classList.add('is-hidden')
              }
            }

            // Append new card to loaded slot
            if (loadedSlot !== null && loadedSlot !== undefined) {
              const newHost = rootEl.querySelector(`[data-slot-host="${loadedSlot}"]`) as HTMLElement
              if (newHost) {
                const placeholder = newHost.querySelector('.empty-placeholder')
                if (placeholder) placeholder.remove()

                const bit = step.meta?.refBits ? step.meta.refBits[loadedSlot] ?? null : null
                const newCard = createCardElement(step.page, loadedSlot, bit, algo, step.meta)
                newCard.classList.add('is-fault') // Muted red fault flash
                newHost.appendChild(newCard)
              }
            }
          })
          .then(() => {
            if (layout && layout.leaving) {
              layout.leaving.forEach(($el: HTMLElement) => {
                if ($el && $el.remove) $el.remove()
              })
            }
          })
      } else {
        // Direct update for reduced motion / 0 duration
        if (victimSlot !== null && victimSlot !== undefined) {
          const oldHost = rootEl.querySelector(`[data-slot-host="${victimSlot}"]`)
          const oldCard = oldHost?.querySelector('.page-card')
          if (oldCard) oldCard.remove()
        }
        if (loadedSlot !== null && loadedSlot !== undefined) {
          const newHost = rootEl.querySelector(`[data-slot-host="${loadedSlot}"]`) as HTMLElement
          if (newHost) {
            const placeholder = newHost.querySelector('.empty-placeholder')
            if (placeholder) placeholder.remove()
            const bit = step.meta?.refBits ? step.meta.refBits[loadedSlot] ?? null : null
            const newCard = createCardElement(step.page, loadedSlot, bit, algo, step.meta)
            newCard.classList.add('is-fault')
            newHost.appendChild(newCard)
          }
        }
      }

      if (algo === 'CLOCK' && step.meta.hand !== undefined) {
        updateClockHand(step.meta.hand, frameCount)
      }

      prevStep = stepIdx
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
