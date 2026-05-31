/** SeverityChart — donut/pie chart showing alert severity breakdown */
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts'
import type { SeverityBreakdown } from '@/types'

interface SeverityChartProps {
  data: SeverityBreakdown
  loading?: boolean
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#3b82f6',
}

const SEVERITY_LABELS = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
}

export function SeverityChart({ data, loading }: SeverityChartProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-32 h-32 rounded-full border-4 border-bg-elevated border-t-brand animate-spin" />
      </div>
    )
  }

  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: SEVERITY_LABELS[key as keyof typeof SEVERITY_LABELS] || key,
      value,
      color: SEVERITY_COLORS[key as keyof typeof SEVERITY_COLORS] || '#6b7280',
    }))

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        No alerts in selected time window
      </div>
    )
  }

  return (
    <div className="h-48 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="40%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f1629',
              border: '1px solid #1e2d4d',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '12px',
            }}
            formatter={(value) => [value, '']}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ left: '20%' }}>
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary font-mono">{total}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Total</div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-2">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-text-secondary">{d.name}</span>
            <span className="text-text-primary font-mono font-semibold ml-1">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
