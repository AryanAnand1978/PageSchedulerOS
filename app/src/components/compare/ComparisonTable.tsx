import { memo } from 'react'
import { useSimStore } from '@/store/useSimStore'
import { ALGORITHMS, ALGORITHM_IDS } from '@/sim'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const ComparisonTable = memo(function ComparisonTable() {
  const { results, algorithm, setAlgorithm } = useSimStore()

  // Find lowest faults among practical algorithms (FIFO, LRU, CLOCK)
  let minPracticalFaults = Infinity
  for (const id of ['FIFO', 'LRU', 'CLOCK'] as const) {
    const f = results[id]?.faults ?? Infinity
    if (f < minPracticalFaults) minPracticalFaults = f
  }

  return (
    <div className="w-full rounded-[3px] border border-[#434C5E] bg-[#3B4252] overflow-hidden">
      <div className="p-3.5 border-b border-[#434C5E] flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm font-sans tracking-tight text-[#ECEFF4]">Algorithm Performance Matrix</h3>
          <p className="text-xs text-[#78839b] font-sans">
            Direct comparison on current workload and frame count
          </p>
        </div>
        <Badge variant="outline" className="font-sans text-[10px] rounded-[2px] border-[#434C5E] text-[#78839b] bg-[#2E3440]">
          {ALGORITHM_IDS.length} Algorithms
        </Badge>
      </div>

      <Table>
        <TableHeader className="bg-[#2E3440]/50 border-b border-[#434C5E]">
          <TableRow className="hover:bg-transparent border-[#434C5E]">
            <TableHead className="font-sans text-xs text-[#78839b]">Algorithm</TableHead>
            <TableHead className="font-sans text-xs text-right text-[#78839b]">Faults</TableHead>
            <TableHead className="font-sans text-xs text-right text-[#78839b]">Hits</TableHead>
            <TableHead className="font-sans text-xs text-right text-[#78839b]">Hit Ratio</TableHead>
            <TableHead className="font-sans text-xs text-center text-[#78839b]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ALGORITHM_IDS.map(id => {
            const res = results[id]
            const meta = ALGORITHMS[id]
            const isSelected = algorithm === id
            const isOptimal = id === 'OPTIMAL'
            const isBestPractical = !isOptimal && res?.faults === minPracticalFaults

            return (
              <TableRow
                key={id}
                onClick={() => setAlgorithm(id)}
                className={`cursor-pointer transition-colors border-[#434C5E] ${
                  isSelected ? 'bg-[#434C5E]/70 font-semibold' : 'hover:bg-[#434C5E]/30'
                }`}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-[#88C0D0]' : 'bg-[#4C566A]'}`} />
                    <div>
                      <div className="font-medium text-sm font-sans text-[#ECEFF4]">{meta.name}</div>
                      <div className="text-xs text-[#78839b] font-sans font-normal line-clamp-1">{meta.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-right text-[#BF616A] font-bold">
                  {res?.faults ?? 0}
                </TableCell>
                <TableCell className="font-mono text-right text-[#A3BE8C] font-bold">
                  {res?.hits ?? 0}
                </TableCell>
                <TableCell className="font-mono text-right font-medium text-[#ECEFF4]">
                  {res ? `${(res.hitRatio * 100).toFixed(1)}%` : '0.0%'}
                </TableCell>
                <TableCell className="text-center">
                  {isOptimal ? (
                    <Badge variant="outline" className="border-[#B48EAD] text-[#B48EAD] bg-[#2E3440] font-sans text-[10px] rounded-[2px]">
                      Theoretical Best
                    </Badge>
                  ) : isBestPractical ? (
                    <Badge variant="outline" className="border-[#A3BE8C] text-[#A3BE8C] bg-[#2E3440] font-sans text-[10px] rounded-[2px]">
                      Best Practical
                    </Badge>
                  ) : isSelected ? (
                    <Badge variant="outline" className="border-[#88C0D0] text-[#88C0D0] bg-[#434C5E] font-sans text-[10px] rounded-[2px]">
                      Active
                    </Badge>
                  ) : (
                    <span className="text-xs text-[#4C566A] font-sans">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
})
