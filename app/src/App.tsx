import { useEffect, useRef } from 'react'
import { useSimStore } from '@/store/useSimStore'
import { speedToDelayMs } from '@/lib/motion'
import { playAppIntro } from '@/anim/gsapIntro'
import { Header } from '@/components/Header'
import { ConfigPanel } from '@/components/controls/ConfigPanel'
import { PlaybackControls } from '@/components/controls/PlaybackControls'
import { StatsBar } from '@/components/viz/StatsBar'
import { FrameGrid } from '@/components/viz/FrameGrid'
import { ReferenceStrip } from '@/components/viz/ReferenceStrip'
import { CompareGrids } from '@/components/compare/CompareGrids'
import { ComparisonTable } from '@/components/compare/ComparisonTable'
import { FaultBarChart } from '@/components/compare/FaultBarChart'
import { BeladyPanel } from '@/components/compare/BeladyPanel'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp, LayoutGrid } from 'lucide-react'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    playing,
    setPlaying,
    stepForward,
    stepIndex,
    speed,
    results,
    algorithm,
    mode,
  } = useSimStore()

  const totalSteps = results[algorithm]?.steps.length ?? 0
  const stepDelayMs = speedToDelayMs(speed)

  // GSAP Intro Timeline on Mount
  useEffect(() => {
    if (containerRef.current) {
      const cleanup = playAppIntro(containerRef.current)
      return cleanup
    }
  }, [])

  // Playback timer driver
  useEffect(() => {
    if (!playing) return
    if (stepIndex >= totalSteps - 1) {
      setPlaying(false)
      return
    }
    const timerId = window.setTimeout(stepForward, stepDelayMs)
    return () => window.clearTimeout(timerId)
  }, [playing, stepIndex, stepDelayMs, totalSteps, stepForward, setPlaying])

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="min-h-screen bg-[#2E3440] text-[#ECEFF4] flex flex-col items-center selection:bg-[#88C0D0]/25 font-sans"
      >
        <Header />

        <main className="w-full max-w-6xl px-4 py-5 flex flex-col gap-4">
          {/* Top Running Counters */}
          <StatsBar />

          {/* Config & Workload Panel */}
          <ConfigPanel />

          {/* Playback Controls & Timeline Scrubber */}
          <PlaybackControls />

          {/* Main Visualization Section */}
          <div className="gsap-viz w-full flex flex-col gap-3.5">
            {mode === 'focus' ? (
              <div className="w-full rounded-[3px] border border-[#434C5E] bg-[#3B4252] p-5 flex flex-col items-center gap-4">
                <div className="w-full flex items-center justify-between border-b border-[#434C5E] pb-3">
                  <div>
                    <h2 className="text-sm font-sans font-medium tracking-tight text-[#ECEFF4] flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-[#88C0D0]" />
                      Physical Frame Allocation (RAM Slots)
                    </h2>
                    <p className="text-xs text-[#78839b] font-sans">
                      Contiguous physical frame memory — incoming pages load into slots, evictions leave
                    </p>
                  </div>
                  <span className="text-xs font-sans font-medium text-[#88C0D0] bg-[#434C5E] border border-[#434C5E] px-2 py-0.5 rounded-[2px]">
                    Active: {algorithm}
                  </span>
                </div>

                {/* Main Frame Grid Imperative Island */}
                <FrameGrid variant="main" />
              </div>
            ) : (
              /* 4-Way Synced Lockstep Grids */
              <CompareGrids />
            )}

            {/* Reference History Strip Imperative Island */}
            <ReferenceStrip />
          </div>

          {/* Analytics & Comparison Tabs */}
          <div className="w-full mt-1">
            <Tabs defaultValue="matrix" className="w-full flex flex-col gap-3">
              <TabsList className="grid grid-cols-2 max-w-md h-8 font-sans text-xs bg-[#3B4252] border border-[#434C5E] rounded-[3px] p-0.5">
                <TabsTrigger
                  value="matrix"
                  className="gap-1.5 rounded-[2px] data-[state=active]:bg-[#434C5E] data-[state=active]:text-[#ECEFF4] text-[#78839b]"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Algorithm Matrix & Faults
                </TabsTrigger>
                <TabsTrigger
                  value="belady"
                  className="gap-1.5 rounded-[2px] data-[state=active]:bg-[#434C5E] data-[state=active]:text-[#ECEFF4] text-[#78839b]"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Bélády Anomaly Analysis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matrix" className="mt-0 flex flex-col gap-3.5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                  <div className="lg:col-span-7">
                    <ComparisonTable />
                  </div>
                  <div className="lg:col-span-5">
                    <FaultBarChart />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="belady" className="mt-0">
                <BeladyPanel />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
