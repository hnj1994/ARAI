/** AlertRow — single row in the alert table */
import type { Alert } from '@/types'
import { Dot } from '@/components/ui/Dot'
import { Tag } from '@/components/ui/Tag'
import { relativeTime, severityDotColor, truncate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface AlertRowProps {
  alert: Alert
  selected?: boolean
  onClick: () => void
}

export function AlertRow({ alert, selected, onClick }: AlertRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-bg-border cursor-pointer transition-colors text-sm',
        selected
          ? 'bg-brand/10 border-l-2 border-l-brand'
          : 'hover:bg-bg-elevated',
      )}
    >
      {/* Severity dot */}
      <td className="py-3 px-4 w-10">
        <Dot
          color={severityDotColor(alert.severity)}
          pulse={alert.severity === 'critical'}
        />
      </td>

      {/* Level badge */}
      <td className="py-3 px-2 w-16">
        <span className={cn(
          'text-xs font-mono font-semibold',
          alert.severity === 'critical' ? 'text-severity-critical' :
          alert.severity === 'high' ? 'text-severity-high' :
          alert.severity === 'medium' ? 'text-severity-medium' :
          'text-severity-low',
        )}>
          {alert.rule.level}
        </span>
      </td>

      {/* Description */}
      <td className="py-3 px-4 max-w-xs">
        <div className="text-text-primary font-medium line-clamp-1">
          {truncate(alert.rule.description, 70)}
        </div>
        {alert.rule.mitre?.tactic && (
          <span className="text-[10px] text-text-muted">{alert.rule.mitre.tactic}</span>
        )}
      </td>

      {/* Agent */}
      <td className="py-3 px-4 w-36">
        <span className="text-xs text-text-secondary font-mono">{alert.agent.name}</span>
        {alert.agent.ip && (
          <div className="text-[10px] text-text-muted font-mono">{alert.agent.ip}</div>
        )}
      </td>

      {/* Source IP */}
      <td className="py-3 px-4 w-32 hidden md:table-cell">
        <span className="text-xs text-text-muted font-mono">{alert.data.srcip ?? '—'}</span>
      </td>

      {/* Time */}
      <td className="py-3 px-4 w-28 text-right hidden lg:table-cell">
        <span className="text-xs text-text-muted">{relativeTime(alert.timestamp)}</span>
      </td>

      {/* Severity tag */}
      <td className="py-3 px-4 w-24 text-right">
        <Tag
          variant={
            alert.severity === 'critical' ? 'red' :
            alert.severity === 'high' ? 'orange' :
            alert.severity === 'medium' ? 'default' : 'blue'
          }
          size="xs"
        >
          {alert.severity.toUpperCase()}
        </Tag>
      </td>
    </tr>
  )
}
