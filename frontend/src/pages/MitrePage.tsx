/**
 * ARIA SOC Platform — MITRE ATT&CK Page
 */

import { useAlertStats } from '@/hooks/useAlerts'
import { MitreHeatmap } from '@/components/mitre/MitreHeatmap'
import { TacticDetail } from '@/components/mitre/TacticDetail'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Grid2x2 } from 'lucide-react'

export function MitrePage() {
  const { data: stats, isLoading } = useAlertStats()
  const heatmap = stats?.mitre_heatmap ?? []

  const topTactics = [...heatmap]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  return (
    <div className="max-w-screen-xl space-y-6">
      <div>
        <h1 className="text-text-primary font-bold text-xl flex items-center gap-2">
          <Grid2x2 className="w-5 h-5 text-brand-glow" />
          MITRE ATT&CK
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Alert coverage mapped to the MITRE ATT&CK framework (last 30 days).
          Darker tiles = more activity.
        </p>
      </div>

      {/* Heatmap */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Tactic Coverage Heatmap</CardTitle>
          <span className="text-xs text-text-muted">{heatmap.length} tactics detected</span>
        </CardHeader>
        <MitreHeatmap data={heatmap} loading={isLoading} />
      </Card>

      {/* Top tactics detail */}
      {topTactics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
            Top Active Tactics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topTactics.map((tactic) => (
              <TacticDetail key={tactic.tactic} tactic={tactic} />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card p-4">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          MITRE ATT&CK Tactic Order
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            'Reconnaissance', 'Resource Development', 'Initial Access',
            'Execution', 'Persistence', 'Privilege Escalation',
            'Defense Evasion', 'Credential Access', 'Discovery',
            'Lateral Movement', 'Collection', 'Command and Control',
            'Exfiltration', 'Impact',
          ].map((tactic, i) => (
            <div key={tactic} className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <span className="w-4 h-4 rounded bg-bg-elevated border border-bg-border flex items-center justify-center text-[8px] font-bold">
                {i + 1}
              </span>
              {tactic}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
