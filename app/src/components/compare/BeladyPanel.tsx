import { memo, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { useSimStore } from '@/store/useSimStore'
import { beladySweep } from '@/sim'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const BeladyPanel = memo(function BeladyPanel() {
  const { parsedReferences, loadPreset } = useSimStore()

  const { chartData, anomalies } = useMemo(() => {
    return beladySweep(parsedReferences, 8)
  }, [parsedReferences])

  return (
    <div className="w-full rounded-[3px] border border-[#434C5E] bg-[#3B4252] p-4 flex flex-col gap-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-sm font-sans tracking-tight text-[#ECEFF4] flex items-center gap-2">
            <span>Bélády's Anomaly Sweep (1–8 Frames)</span>
            {anomalies.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-[#EBCB8B] font-sans bg-[#2E3440] border border-[#EBCB8B]/40 px-2 py-0.5 rounded-[2px]">
                <AlertTriangle className="w-3 h-3 text-[#EBCB8B]" /> Anomaly Detected
              </span>
            )}
          </h3>
          <p className="text-xs text-[#78839b] font-sans">
            Evaluation of page faults across physical frame allocation capacity
          </p>
        </div>

        {anomalies.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPreset('belady')}
            className="text-xs font-sans h-7 rounded-[2px] border-[#434C5E] bg-[#2E3440] hover:bg-[#434C5E] text-[#ECEFF4] gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#88C0D0]" />
            Load Belady Example
          </Button>
        )}
      </div>

      {/* Explicit Anomaly Callout Banner */}
      {anomalies.length > 0 && (
        <div className="rounded-[2px] border border-[#EBCB8B] bg-[#2E3440] p-3 flex flex-col gap-1.5 text-[#ECEFF4]">
          <div className="flex items-center gap-2 font-sans font-medium text-sm text-[#EBCB8B]">
            <AlertTriangle className="w-4 h-4 text-[#EBCB8B] flex-shrink-0" />
            Bélády's Anomaly Demonstrated
          </div>
          <div className="text-xs font-sans space-y-1 text-[#ECEFF4]">
            {anomalies.map((a, idx) => (
              <p key={idx}>
                • <strong className="text-[#ECEFF4]">{a.algorithm}</strong>: Increasing physical allocation from{' '}
                <span className="font-mono text-[#88C0D0]">{a.smallerFrames} frames</span> ({a.smallerFaults} faults) to{' '}
                <span className="font-mono text-[#88C0D0]">{a.largerFrames} frames</span> paradoxically increased faults to{' '}
                <strong className="font-mono text-[#BF616A]">{a.largerFaults} faults</strong>!
              </p>
            ))}
          </div>
          <p className="text-[11px] text-[#78839b] font-sans mt-0.5">
            Stack algorithms (such as LRU and Optimal) can mathematically never exhibit this pathology because the set of pages in N frames is always a subset of pages in N+1 frames.
          </p>
        </div>
      )}

      {/* Sweep Line Chart */}
      <div className="w-full h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="frames"
              stroke="#78839b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit=" frames"
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
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-[2px] border border-[#434C5E] bg-[#2E3440] p-2.5 text-xs text-[#ECEFF4]">
                      <div className="font-sans font-medium mb-1 border-b border-[#434C5E] pb-1">
                        Frame Allocation: {label} frames
                      </div>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 py-0.5" style={{ color: entry.color }}>
                          <span className="font-sans">{entry.name}:</span>
                          <span className="font-mono font-bold">{entry.value} faults</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif', paddingTop: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="FIFO"
              stroke="#D08770"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="LRU"
              stroke="#A3BE8C"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="OPTIMAL"
              stroke="#B48EAD"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="CLOCK"
              stroke="#88C0D0"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
