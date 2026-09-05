import { memo, useLayoutEffect, useRef } from 'react'
import { useSimStore } from '@/store/useSimStore'
import { createCounterTween, type CounterTweenController } from '@/anim/gsapIntro'

export const StatsBar = memo(function StatsBar() {
  const faultsRef = useRef<HTMLSpanElement>(null)
  const hitsRef = useRef<HTMLSpanElement>(null)
  const hitRatioRef = useRef<HTMLSpanElement>(null)
  const stepCountRef = useRef<HTMLSpanElement>(null)

  const faultsTween = useRef<CounterTweenController | null>(null)
  const hitsTween = useRef<CounterTweenController | null>(null)
  const ratioTween = useRef<CounterTweenController | null>(null)

  useLayoutEffect(() => {
    if (faultsRef.current) {
      faultsTween.current = createCounterTween(faultsRef.current, 0, v => String(Math.round(v)))
    }
    if (hitsRef.current) {
      hitsTween.current = createCounterTween(hitsRef.current, 0, v => String(Math.round(v)))
    }
    if (hitRatioRef.current) {
      ratioTween.current = createCounterTween(
        hitRatioRef.current,
        0,
        v => `${(v * 100).toFixed(1)}%`
      )
    }

    const unsub = useSimStore.subscribe(state => {
      const steps = state.results[state.algorithm]?.steps ?? []
      const totalSteps = steps.length
      const stepIdx = state.stepIndex
      const currentStep = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null

      const faults = currentStep ? currentStep.faultsSoFar : 0
      const hits = currentStep ? currentStep.hitsSoFar : 0
      const processed = faults + hits
      const ratio = processed > 0 ? hits / processed : 0

      faultsTween.current?.update(faults)
      hitsTween.current?.update(hits)
      ratioTween.current?.update(ratio)

      if (stepCountRef.current) {
        stepCountRef.current.textContent =
          stepIdx === -1
            ? `0 / ${totalSteps}`
            : `${stepIdx + 1} / ${totalSteps}`
      }
    })

    return () => {
      unsub()
      faultsTween.current?.kill()
      hitsTween.current?.kill()
      ratioTween.current?.kill()
    }
  }, [])

  return (
    <div className="stats-bar w-full rounded-[3px] border border-[#434C5E] bg-[#3B4252] grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#434C5E]">
      {/* Progress */}
      <div className="flex flex-col items-center justify-center py-3.5 px-3">
        <span
          ref={stepCountRef}
          className="text-2xl font-bold font-mono tracking-tight text-[#ECEFF4]"
        >
          0 / 0
        </span>
        <span className="text-xs font-sans text-[#78839b] mt-0.5">
          Progress
        </span>
      </div>

      {/* Faults */}
      <div className="flex flex-col items-center justify-center py-3.5 px-3">
        <span
          ref={faultsRef}
          className="text-2xl font-bold font-mono tracking-tight text-[#BF616A]"
        >
          0
        </span>
        <span className="text-xs font-sans text-[#78839b] mt-0.5">
          Page Faults
        </span>
      </div>

      {/* Hits */}
      <div className="flex flex-col items-center justify-center py-3.5 px-3">
        <span
          ref={hitsRef}
          className="text-2xl font-bold font-mono tracking-tight text-[#A3BE8C]"
        >
          0
        </span>
        <span className="text-xs font-sans text-[#78839b] mt-0.5">
          Page Hits
        </span>
      </div>

      {/* Hit Ratio */}
      <div className="flex flex-col items-center justify-center py-3.5 px-3">
        <span
          ref={hitRatioRef}
          className="text-2xl font-bold font-mono tracking-tight text-[#ECEFF4]"
        >
          0.0%
        </span>
        <span className="text-xs font-sans text-[#78839b] mt-0.5">
          Hit Ratio
        </span>
      </div>
    </div>
  )
})
