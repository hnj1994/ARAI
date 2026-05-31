/** RecentAlerts — compact list of the most recent alerts on the dashboard */
import { useNavigate } from 'react-router-dom'
import type { Alert } from '@/types'
import { Dot } from '@/components/ui/Dot'
import { Tag } from '@/components/ui/Tag'
import { relativeTime, severityDotColor, truncate } from '@/lib/utils'

interface RecentAlertsProps {
  alerts: Alert[]
  loading?: boolean
}

export function RecentAlerts({ alerts, loading }: RecentAlertsProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-bg-elevated mt-1.5" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-bg-elevated rounded w-3/4" />
              <div className="h-2.5 bg-bg-elevated rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-sm text-text-muted text-center py-8">
        No recent alerts
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {alerts.slice(0, 8).map((alert) => (
        <button
          key={alert.id}
          onClick={() => navigate(`/alerts?selected=${alert.id}`)}
          className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-bg-elevated transition-colors text-left group"
        >
          <Dot
            color={severityDotColor(alert.severity)}
            pulse={alert.severity === 'critical'}
            className="mt-1 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary group-hover:text-brand-glow transition-colors line-clamp-1">
              {truncate(alert.rule.description, 60)}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-text-muted font-mono">{alert.agent.name}</span>
              <span className="text-[10px] text-text-muted">·</span>
              <span className="text-[10px] text-text-muted">{relativeTime(alert.timestamp)}</span>
            </div>
          </div>
          <Tag
            variant={alert.severity === 'critical' ? 'red' : alert.severity === 'high' ? 'orange' : 'default'}
            size="xs"
          >
            L{alert.rule.level}
          </Tag>
        </button>
      ))}
    </div>
  )
}
