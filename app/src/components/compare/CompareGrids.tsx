import { memo } from 'react'
import { useSimStore } from '@/store/useSimStore'
import { ALGORITHM_IDS, ALGORITHMS } from '@/sim'
import { FrameGrid } from '../viz/FrameGrid'
import { Badge } from '@/components/ui/badge'

export const CompareGrids = memo(function CompareGrids() {
  const { results, stepIndex } = useSimStore()

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm font-sans tracking-tight text-[#ECEFF4] flex items-center gap-2">
          <span>Synced Multi-Algorithm Execution</span>
          <Badge variant="outline" className="text-[10px] font-sans rounded-[2px] border-[#434C5E] text-[#78839b] bg-[#3B4252]">
            4-Way Lockstep
          </Badge>
        </h3>
        <span className="text-xs text-[#78839b] font-sans">
          Watch frame contents diverge as decisions differ
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {ALGORITHM_IDS.map(id => {
          const meta = ALGORITHMS[id]
          const res = results[id]
          const steps = res?.steps ?? []
          const currentStep = stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex] : null

          const faults = currentStep ? currentStep.faultsSoFar : 0
          const hits = currentStep ? currentStep.hitsSoFar : 0

          return (
            <div
              key={id}
              className="rounded-[3px] border border-[#434C5E] bg-[#3B4252] p-3 flex flex-col gap-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#434C5E] pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-medium text-sm text-[#ECEFF4]">{meta.shortName}</span>
                  <span className="text-[11px] text-[#78839b] font-sans hidden sm:inline">{meta.name}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  {currentStep && (
                    <span
                      className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-sans font-medium border ${
                        currentStep.hit
                          ? 'border-[#A3BE8C] text-[#A3BE8C] bg-[#2E3440]'
                          : 'border-[#BF616A] text-[#BF616A] bg-[#2E3440]'
                      }`}
                    >
                      {currentStep.hit ? 'HIT' : 'FAULT'}
                    </span>
                  )}
                  <span className="text-[#BF616A] font-semibold">{faults}F</span>
                  <span className="text-[#A3BE8C] font-semibold">{hits}H</span>
                </div>
              </div>

              {/* Mini Frame Grid Island */}
              <div className="w-full py-1">
                <FrameGrid variant="mini" algorithm={id} />
              </div>

              {/* Mini step reason */}
              <div className="text-[11px] font-sans text-[#78839b] line-clamp-1 italic">
                {currentStep ? currentStep.reason : 'Waiting for simulation start...'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
