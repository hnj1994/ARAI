/**
 * ARIA SOC Platform — Dashboard Page
 */

import { ShieldAlert, Monitor, AlertTriangle, TrendingUp } from 'lucide-react'
import { useAlertStats, useAlerts } from '@/hooks/useAlerts'
import { useAgents } from '@/hooks/useAgents'
import { KPICard } from '@/components/dashboard/KPICard'
import { SeverityChart } from '@/components/dashboard/SeverityChart'
import { TopHostsChart } from '@/components/dashboard/TopHostsChart'
import { RecentAlerts } from '@/components/dashboard/RecentAlerts'
import { ServiceHealth } from '@/components/dashboard/ServiceHealth'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { MitreHeatmap } from '@/components/mitre/MitreHeatmap'

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAlertStats()
  const { data: alerts, isLoading: alertsLoading } = useAlerts({ page_size: 10, time_window: 'now-24h' })
  const { data: agents } = useAgents()

  const severity = stats?.severity_breakdown ?? { critical: 0, high: 0, medium: 0, low: 0 }
  const totalAlerts = stats?.total_24h ?? 0
  const criticalCount = severity.critical ?? 0
  const highCount = severity.high ?? 0
  const agentCount = agents?.total ?? 0

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Alerts (24h)"
          value={totalAlerts.toLocaleString()}
          icon={<ShieldAlert className="w-4 h-4" />}
          loading={statsLoading}
          variant={totalAlerts > 100 ? 'warning' : 'default'}
        />
        <KPICard
          title="Critical Alerts"
          value={criticalCount}
          icon={<AlertTriangle className="w-4 h-4" />}
          loading={statsLoading}
          variant={criticalCount > 0 ? 'critical' : 'default'}
          trend={criticalCount > 0 ? 'up' : 'stable'}
          trendValue={criticalCount > 0 ? 'Requires attention' : 'All clear'}
        />
        <KPICard
          title="High Severity"
          value={highCount}
          icon={<TrendingUp className="w-4 h-4" />}
          loading={statsLoading}
          variant={highCount > 10 ? 'warning' : 'default'}
        />
        <KPICard
          title="Active Agents"
          value={agentCount}
          icon={<Monitor className="w-4 h-4" />}
          variant="success"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Severity breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Severity (24h)</CardTitle>
          </CardHeader>
          <SeverityChart
            data={severity}
            loading={statsLoading}
          />
        </Card>

        {/* Top hosts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Hosts by Alerts</CardTitle>
          </CardHeader>
          <TopHostsChart
            data={stats?.top_hosts ?? []}
            loading={statsLoading}
          />
        </Card>

        {/* Service health */}
        <Card>
          <CardHeader>
            <CardTitle>Service Health</CardTitle>
          </CardHeader>
          <ServiceHealth />
        </Card>
      </div>

      {/* MITRE heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>MITRE ATT&CK Coverage (30d)</CardTitle>
        </CardHeader>
        <MitreHeatmap
          data={stats?.mitre_heatmap ?? []}
          loading={statsLoading}
        />
      </Card>

      {/* Recent alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <a href="/alerts" className="text-xs text-brand hover:text-brand-glow transition-colors">
            View all →
          </a>
        </CardHeader>
        <RecentAlerts
          alerts={alerts?.alerts ?? []}
          loading={alertsLoading}
        />
      </Card>
    </div>
  )
}
