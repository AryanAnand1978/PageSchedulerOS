import { memo, useLayoutEffect, useRef } from 'react'
import { useSimStore } from '@/store/useSimStore'
import { createRefStrip, type RefStripController } from '@/anim/refStrip'

interface ReferenceStripProps {
  className?: string
}

// ReferenceStrip.tsx — React renders the container ONCE. All children are created,
// moved, and removed by anim/refStrip.ts. Adding JSX children here
// will break enterFrom animations.
export const ReferenceStrip = memo(function ReferenceStrip({ className = '' }: ReferenceStripProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const ctrlRef = useRef<RefStripController | null>(null)

  useLayoutEffect(() => {
    if (!rootRef.current) return

    const ctrl = createRefStrip(rootRef.current)
    ctrlRef.current = ctrl

    // Subscribe imperatively — island must never re-render on step change
    const unsub = useSimStore.subscribe(state => ctrl.sync(state))
    ctrl.sync(useSimStore.getState())

    return () => {
      unsub()
      ctrl.destroy()
    }
  }, [])

  return (
    <div className={`relative w-full rounded-[3px] border border-[#434C5E] bg-[#3B4252] p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-sans font-medium text-[#78839b] flex items-center gap-1.5">
          Processed Reference History
        </span>
        <span className="text-[11px] text-[#4C566A] font-sans">
          auto-scrolls on tick
        </span>
      </div>

      {/* Imperative anime.js Layout Root */}
      <div
        ref={rootRef}
        className="ref-strip-root flex items-center gap-1.5 overflow-x-auto min-h-[76px] py-1 px-0.5 scrollbar-thin scrollbar-thumb-[#434C5E]"
        style={{ scrollBehavior: 'smooth' }}
      />
    </div>
  )
})
