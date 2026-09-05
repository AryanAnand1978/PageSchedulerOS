import { useSimStore } from '@/store/useSimStore'
import { ALGORITHMS, ALGORITHM_IDS, MIN_FRAMES, MAX_FRAMES } from '@/sim'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PresetMenu } from './PresetMenu'
import { AlertCircle } from 'lucide-react'

export function ConfigPanel() {
  const {
    input,
    setInput,
    parseError,
    parsedReferences,
    frameCount,
    setFrameCount,
    algorithm,
    setAlgorithm,
    mode,
  } = useSimStore()

  return (
    <div className="gsap-config w-full rounded-[3px] border border-[#434C5E] bg-[#3B4252] p-4 flex flex-col gap-3.5">
      {/* Preset shortcuts */}
      <PresetMenu />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Reference String Input */}
        <div className="md:col-span-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="ref-input" className="text-xs font-sans font-medium text-[#ECEFF4] flex items-center gap-1.5">
              <span>Reference String</span>
              <span className="text-[#78839b] font-normal">({parsedReferences.length} pages)</span>
            </Label>
            {parseError && (
              <span className="text-[11px] text-[#BF616A] font-sans flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Error
              </span>
            )}
          </div>
          <Input
            id="ref-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. 7 0 1 2 0 3 0 4 2 3"
            className={`font-mono text-sm tracking-wide bg-[#2E3440] border-[#434C5E] text-[#ECEFF4] rounded-[2px] ${
              parseError ? 'border-[#BF616A] focus-visible:ring-[#BF616A]' : 'focus-visible:ring-[#88C0D0]'
            }`}
          />
          {parseError ? (
            <p className="text-xs text-[#BF616A] font-sans mt-0.5">{parseError}</p>
          ) : (
            <p className="text-[11px] text-[#78839b] font-sans">
              Space, comma, or newline separated page numbers (0–999, max 64 items)
            </p>
          )}
        </div>

        {/* Physical Frames Allocation */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-sans font-medium text-[#ECEFF4]">
              Physical Frames
            </Label>
            <span className="text-xs font-mono font-bold text-[#ECEFF4] bg-[#2E3440] px-2 py-0.5 rounded-[2px] border border-[#434C5E]">
              {frameCount} Frames
            </span>
          </div>
          <div className="pt-2">
            <Slider
              min={MIN_FRAMES}
              max={MAX_FRAMES}
              step={1}
              value={[frameCount]}
              onValueChange={vals => setFrameCount(Array.isArray(vals) ? vals[0] : (vals as number))}
            />
          </div>
          <div className="flex justify-between text-[10px] font-sans text-[#78839b]">
            <span>{MIN_FRAMES} min</span>
            <span>{MAX_FRAMES} max</span>
          </div>
        </div>

        {/* Algorithm Selector */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <Label className="text-xs font-sans font-medium text-[#ECEFF4]">
            Algorithm {mode === 'compare' ? '(Primary Focus)' : ''}
          </Label>
          <Select value={algorithm} onValueChange={v => setAlgorithm(v as any)}>
            <SelectTrigger className="font-sans text-xs bg-[#2E3440] border-[#434C5E] text-[#ECEFF4] rounded-[2px]">
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent className="bg-[#3B4252] border-[#434C5E] text-[#ECEFF4] rounded-[2px]">
              {ALGORITHM_IDS.map(id => (
                <SelectItem key={id} value={id} className="font-sans text-xs focus:bg-[#434C5E] focus:text-[#ECEFF4]">
                  {ALGORITHMS[id].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-[#78839b] font-sans line-clamp-1">
            {ALGORITHMS[algorithm].description}
          </p>
        </div>
      </div>
    </div>
  )
}
