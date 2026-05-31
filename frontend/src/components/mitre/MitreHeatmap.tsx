/** MitreHeatmap — grid heatmap of MITRE ATT&CK tactics and techniques */
import type { MITRETactic } from '@/types'
import { cn } from '@/lib/utils'

interface MitreHeatmapProps {
  data: MITRETactic[]
  loading?: boolean
}

const TACTIC_ORDER = [
  'Reconnaissance', 'Resource Development', 'Initial Access',
  'Execution', 'Persistence', 'Privilege Escalation',
  'Defense Evasion', 'Credential Access', 'Discovery',
  'Lateral Movement', 'Collection', 'Command and Control',
  'Exfiltration', 'Impact',
]

function heatColor(count: number, max: number): string {
  if (count === 0) return 'bg-bg-elevated text-text-muted'
  const ratio = count / max
  if (ratio > 0.75) return 'bg-severity-critical/80 text-white font-semibold'
  if (ratio > 0.5)  return 'bg-severity-high/70 text-white font-semibold'
  if (ratio > 0.25) return 'bg-severity-medium/60 text-slate-900 font-medium'
  return 'bg-brand/40 text-white'
}

export function MitreHeatmap({ data, loading }: MitreHeatmapProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-20 bg-bg-elevated rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <div className="text-sm text-text-muted text-center py-12">No MITRE data available</div>
  }

  const maxCount = Math.max(...data.map((t) => t.count), 1)

  // Sort by TACTIC_ORDER, put unknown tactics at end
  const sorted = [...data].sort((a, b) => {
    const ai = TACTIC_ORDER.indexOf(a.tactic)
    const bi = TACTIC_ORDER.indexOf(b.tactic)
    if (ai === -1 && bi === -1) return a.tactic.localeCompare(b.tactic)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {sorted.map((tactic) => (
          <div
            key={tactic.tactic}
            className={cn(
              'rounded-lg p-3 cursor-default transition-all duration-200 hover:scale-105',
              heatColor(tactic.count, maxCount),
            )}
            title={`${tactic.tactic}: ${tactic.count} alerts`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide line-clamp-2 mb-1">
              {tactic.tactic}
            </div>
            <div className="text-xl font-bold font-mono">{tactic.count}</div>
            {tactic.techniques.length > 0 && (
              <div className="text-[9px] opacity-70 mt-1 line-clamp-2">
                {tactic.techniques.slice(0, 3).map((t) => t.technique).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Heat legend */}
      <div className="flex items-center gap-3 justify-end text-[10px] text-text-muted">
        <span>Low</span>
        {['bg-brand/40', 'bg-severity-medium/60', 'bg-severity-high/70', 'bg-severity-critical/80'].map((c) => (
          <div key={c} className={cn('w-4 h-4 rounded', c)} />
        ))}
        <span>High</span>
      </div>
    </div>
  )
}
