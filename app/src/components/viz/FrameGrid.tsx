import { memo, useLayoutEffect, useRef } from 'react'
import { useSimStore } from '@/store/useSimStore'
import { createFrameGrid, type FrameGridController } from '@/anim/frameGrid'
import type { AlgorithmId } from '@/sim'

interface FrameGridProps {
  variant?: 'main' | 'mini'
  algorithm?: AlgorithmId
  className?: string
}

// FrameGrid.tsx — React renders the container ONCE. All children are created,
// moved, hidden, and removed by anim/frameGrid.ts. Adding JSX children here
// will break leaveTo eviction animations.
export const FrameGrid = memo(function FrameGrid({
  variant = 'main',
  algorithm,
  className = '',
}: FrameGridProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const handOverlayRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLParagraphElement>(null)
  const ctrlRef = useRef<FrameGridController | null>(null)

  useLayoutEffect(() => {
    if (!rootRef.current) return

    const ctrl = createFrameGrid(rootRef.current, {
      variant,
      fixedAlgorithm: algorithm,
      handOverlayEl: handOverlayRef.current,
      captionEl: captionRef.current,
    })
    ctrlRef.current = ctrl

    // Subscribe imperatively — this component must never re-render on step change.
    const unsub = useSimStore.subscribe(state => ctrl.sync(state))
    ctrl.sync(useSimStore.getState())

    return () => {
      unsub()
      ctrl.destroy()
    }
  }, [variant, algorithm])

  if (variant === 'mini') {
    return (
      <div className={`frame-grid-mini-container relative w-full ${className}`}>
        <div ref={rootRef} className="frame-grid-root" />
      </div>
    )
  }

  return (
    <div className={`frame-grid-wrapper relative w-full flex flex-col items-center gap-3.5 ${className}`}>
      {/* Visual Clock Hand Overlay (Sibling to layout root, never tracked by anime.js) */}
      <div
        ref={handOverlayRef}
        style={{ display: 'none' }}
        className="clock-hand-overlay absolute z-20 pointer-events-none transition-transform duration-300 ease-out items-center justify-center flex flex-col"
      >
        <span className="bg-[#434C5E] text-[#88C0D0] border border-[#88C0D0] px-1.5 py-0.5 rounded-[2px] text-[10px] font-sans font-medium uppercase tracking-wider">
          HAND ▼
        </span>
      </div>

      {/* anime.js Layout DOM root — NO JSX children ever placed inside */}
      <div
        ref={rootRef}
        className="frame-grid-root w-full min-h-[120px] flex items-center justify-center"
      />

      {/* One-line step explanation caption */}
      <p
        ref={captionRef}
        className="text-xs text-[#ECEFF4] font-sans bg-[#3B4252] border border-[#434C5E] px-3.5 py-2 rounded-[3px] text-center w-full max-w-2xl min-h-[34px] flex items-center justify-center"
      >
        Ready — memory is unallocated.
      </p>
    </div>
  )
})
