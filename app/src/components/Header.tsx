import { useSimStore } from '@/store/useSimStore'
import { ThemeToggle } from './ThemeToggle'
import { LayoutGrid, SplitSquareVertical, Eye } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Header() {
  const { mode, setMode } = useSimStore()

  return (
    <header className="gsap-header w-full border-b border-[#434C5E] bg-[#2E3440] sticky top-0 z-30 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 w-full md:w-auto">
        <div className="text-[#88C0D0] flex items-center justify-center">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-medium font-sans tracking-tight text-[#ECEFF4]">
            Page Replacement Visualizer
          </h1>
          <p className="text-xs text-[#78839b] font-sans">
            Virtual Memory & Eviction Simulator — FIFO · LRU · Optimal · Clock
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        <Tabs
          value={mode}
          onValueChange={v => setMode(v as 'focus' | 'compare')}
          className="w-auto"
        >
          <TabsList className="grid grid-cols-2 h-8 font-sans text-xs bg-[#3B4252] border border-[#434C5E] rounded-[3px] p-0.5">
            <TabsTrigger
              value="focus"
              className="gap-1.5 text-xs font-sans rounded-[2px] data-[state=active]:bg-[#434C5E] data-[state=active]:text-[#ECEFF4] text-[#78839b]"
            >
              <Eye className="w-3.5 h-3.5" />
              Focus Mode
            </TabsTrigger>
            <TabsTrigger
              value="compare"
              className="gap-1.5 text-xs font-sans rounded-[2px] data-[state=active]:bg-[#434C5E] data-[state=active]:text-[#ECEFF4] text-[#78839b]"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              Compare All
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center border-l border-[#434C5E] pl-2.5">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
