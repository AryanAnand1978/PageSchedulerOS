import { PRESETS } from '@/sim'
import { useSimStore } from '@/store/useSimStore'
import { Button } from '@/components/ui/button'

export function PresetMenu() {
  const { loadPreset, input } = useSimStore()

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs font-sans text-[#78839b] mr-1">
        Presets:
      </span>
      {PRESETS.map(preset => {
        const isCurrent = input === preset.referenceString

        return (
          <Button
            key={preset.id}
            variant="outline"
            size="sm"
            onClick={() => loadPreset(preset.id)}
            className={`h-6 px-2 text-xs font-sans rounded-[3px] border transition-colors ${
              isCurrent
                ? 'border-[#88C0D0] text-[#ECEFF4] bg-[#434C5E]'
                : 'border-[#434C5E] text-[#78839b] bg-[#3B4252] hover:text-[#ECEFF4] hover:bg-[#434C5E]'
            }`}
            title={preset.description}
          >
            {preset.name.split(' (')[0]}
          </Button>
        )
      })}
    </div>
  )
}
