/** Bar — horizontal progress/metric bar */
import { cn } from '@/lib/utils'

interface BarProps {
  value: number          // 0-100
  color?: 'blue' | 'red' | 'orange' | 'yellow' | 'green'
  size?: 'sm' | 'md'
  showLabel?: boolean
  label?: string
  className?: string
}

const colors: Record<string, string> = {
  blue:   'bg-brand',
  red:    'bg-severity-critical',
  orange: 'bg-severity-high',
  yellow: 'bg-severity-medium',
  green:  'bg-accent-emerald',
}

export function Bar({ value, color = 'blue', size = 'sm', showLabel = false, label, className }: BarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showLabel && <span className="text-xs text-text-muted">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-bg-elevated rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
