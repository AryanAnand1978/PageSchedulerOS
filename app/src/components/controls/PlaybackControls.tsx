import { useSimStore } from '@/store/useSimStore'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Gauge,
} from 'lucide-react'

export function PlaybackControls() {
  const {
    playing,
    togglePlay,
    stepForward,
    stepBack,
    reset,
    seek,
    stepIndex,
    results,
    algorithm,
    speed,
    setSpeed,
  } = useSimStore()

  const totalSteps = results[algorithm]?.steps.length ?? 0
  const isAtStart = stepIndex <= -1
  const isAtEnd = totalSteps > 0 && stepIndex >= totalSteps - 1

  return (
    <div className="gsap-controls w-full rounded-[3px] border border-[#434C5E] bg-[#3B4252] p-4 flex flex-col gap-3.5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Reset */}
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            title="Reset to beginning"
            className="h-8 w-8 rounded-[3px] border-[#434C5E] bg-[#2E3440] text-[#ECEFF4] hover:bg-[#434C5E]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          {/* Step Back */}
          <Button
            variant="outline"
            size="icon"
            onClick={stepBack}
            disabled={isAtStart}
            title="Step Back"
            className="h-8 w-8 rounded-[3px] border-[#434C5E] bg-[#2E3440] text-[#ECEFF4] hover:bg-[#434C5E] disabled:opacity-35"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Play / Pause */}
          <Button
            variant="outline"
            size="default"
            onClick={togglePlay}
            disabled={totalSteps === 0}
            className={`font-sans text-xs font-medium gap-1.5 min-w-[85px] h-8 rounded-[3px] border transition-colors ${
              playing
                ? 'border-[#88C0D0] bg-[#434C5E] text-[#88C0D0]'
                : 'border-[#434C5E] bg-[#2E3440] text-[#ECEFF4] hover:bg-[#434C5E]'
            }`}
          >
            {playing ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> {isAtEnd ? 'Replay' : 'Play'}
              </>
            )}
          </Button>

          {/* Step Forward */}
          <Button
            variant="outline"
            size="icon"
            onClick={stepForward}
            disabled={isAtEnd}
            title="Step Forward"
            className="h-8 w-8 rounded-[3px] border-[#434C5E] bg-[#2E3440] text-[#ECEFF4] hover:bg-[#434C5E] disabled:opacity-35"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-sans text-[#78839b] whitespace-nowrap">
            <Gauge className="w-3.5 h-3.5" />
            <span>Speed: <span className="font-mono text-[#ECEFF4]">{speed.toFixed(1)}x</span></span>
          </div>
          <div className="w-28 sm:w-32">
            <Slider
              min={0.5}
              max={3.0}
              step={0.1}
              value={[speed]}
              onValueChange={vals => setSpeed(Array.isArray(vals) ? vals[0] : (vals as number))}
            />
          </div>
        </div>
      </div>

      {/* Scrub Timeline */}
      <div className="flex flex-col gap-1 pt-0.5">
        <div className="flex items-center justify-between text-[11px] font-sans text-[#78839b]">
          <span>Start (Empty RAM)</span>
          <span className="font-mono text-[#ECEFF4] font-medium">
            {stepIndex === -1 ? 'Idle / Ready' : `Step ${stepIndex + 1} of ${totalSteps}`}
          </span>
          <span>End ({totalSteps} steps)</span>
        </div>
        <Slider
          min={-1}
          max={Math.max(0, totalSteps - 1)}
          step={1}
          value={[stepIndex]}
          onValueChange={vals => seek(Array.isArray(vals) ? vals[0] : (vals as number))}
          className="cursor-pointer"
        />
      </div>
    </div>
  )
}
