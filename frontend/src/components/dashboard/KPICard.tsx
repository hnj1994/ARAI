/** KPICard — key metric display card for the dashboard */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  variant?: 'default' | 'critical' | 'warning' | 'success'
  loading?: boolean
}

const variants = {
  default:  'border-bg-border',
  critical: 'border-severity-critical/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]',
  warning:  'border-severity-high/40 shadow-[0_0_20px_rgba(249,115,22,0.1)]',
  success:  'border-accent-emerald/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
}

const trendColors = {
  up:     'text-severity-critical',
  down:   'text-accent-emerald',
  stable: 'text-text-muted',
}

export function KPICard({
  title, value, subtitle, icon, trend, trendValue, variant = 'default', loading
}: KPICardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className={cn('card p-5 transition-all duration-200 hover:border-brand/30', variants[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-bg-elevated rounded animate-pulse" />
          ) : (
            <div className="text-3xl font-bold text-text-primary font-mono">{value}</div>
          )}
          {subtitle && (
            <p className="text-xs text-text-muted mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trendColors[trend])}>
              <TrendIcon className="w-3 h-3" />
              {trendValue}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-lg bg-bg-elevated border border-bg-border text-text-muted">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
