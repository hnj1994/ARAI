/** TopHostsChart — horizontal bar chart showing most active agents */
import { Bar as RechartsBar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import type { TopHost } from '@/types'

interface TopHostsChartProps {
  data: TopHost[]
  loading?: boolean
}

export function TopHostsChart({ data, loading }: TopHostsChartProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 bg-bg-elevated rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <div className="text-sm text-text-muted text-center py-8">No host data available</div>
  }

  const maxCount = Math.max(...data.map((d) => d.count))

  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((host, i) => {
        const pct = maxCount > 0 ? (host.count / maxCount) * 100 : 0
        return (
          <div key={host.agent} className="flex items-center gap-3 group">
            <span className="text-xs text-text-muted font-mono w-4 text-right">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-secondary font-mono truncate">{host.agent}</span>
                <span className="text-xs text-text-primary font-mono font-semibold ml-2">{host.count}</span>
              </div>
              <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-accent-cyan transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
