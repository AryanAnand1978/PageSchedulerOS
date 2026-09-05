import { memo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { useSimStore } from '@/store/useSimStore'
import { ALGORITHM_IDS, ALGORITHMS } from '@/sim'

const ALGORITHM_COLORS: Record<string, string> = {
  FIFO: '#D08770', // Nord Aurora Orange
  LRU: '#A3BE8C', // Nord Aurora Green
  OPTIMAL: '#B48EAD', // Nord Aurora Purple
  CLOCK: '#88C0D0', // Nord Frost Blue
}

export const FaultBarChart = memo(function FaultBarChart() {
  const { results, algorithm, setAlgorithm } = useSimStore()

  const data = ALGORITHM_IDS.map(id => ({
    id,
    name: ALGORITHMS[id].shortName,
    fullName: ALGORITHMS[id].name,
    faults: results[id]?.faults ?? 0,
    hits: results[id]?.hits ?? 0,
    hitRatio: results[id]?.hitRatio ?? 0,
  }))

  return (
    <div className="w-full rounded-[3px] border border-[#434C5E] bg-[#3B4252] p-4 flex flex-col justify-between">
      <div className="mb-3">
        <h3 className="font-medium text-sm font-sans tracking-tight text-[#ECEFF4]">Total Page Faults by Algorithm</h3>
        <p className="text-xs text-[#78839b] font-sans">
          Lower fault counts represent superior memory efficiency
        </p>
      </div>

      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="#78839b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              fontFamily="sans-serif"
            />
            <YAxis
              stroke="#78839b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              fontFamily="monospace"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload
                  return (
                    <div className="rounded-[3px] border border-[#434C5E] bg-[#2E3440] p-2.5 text-xs text-[#ECEFF4]">
                      <div className="font-sans font-medium text-sm mb-1">{item.fullName}</div>
                      <div className="text-[#BF616A] font-mono">Faults: <span className="font-bold">{item.faults}</span></div>
                      <div className="text-[#A3BE8C] font-mono">Hits: <span className="font-bold">{item.hits}</span></div>
                      <div className="text-[#78839b] font-mono">Hit Ratio: {(item.hitRatio * 100).toFixed(1)}%</div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="faults"
              radius={[2, 2, 0, 0]}
              onClick={(entry: any) => {
                if (entry && entry.id) setAlgorithm(entry.id)
              }}
              className="cursor-pointer"
            >
              {data.map(entry => (
                <Cell
                  key={entry.id}
                  fill={ALGORITHM_COLORS[entry.id] || '#4C566A'}
                  opacity={algorithm === entry.id ? 1 : 0.75}
                  stroke={algorithm === entry.id ? '#ECEFF4' : 'transparent'}
                  strokeWidth={1.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
