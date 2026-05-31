/** Tag — small labelled badge, e.g. rule groups, MITRE tactics */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TagProps {
  children: ReactNode
  variant?: 'default' | 'blue' | 'purple' | 'cyan' | 'orange' | 'red' | 'green'
  size?: 'sm' | 'xs'
  className?: string
}

const variants: Record<string, string> = {
  default: 'bg-bg-elevated text-text-secondary border-bg-border',
  blue:    'bg-brand/15 text-brand-glow border-brand/30',
  purple:  'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
  cyan:    'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
  orange:  'bg-severity-high/15 text-severity-high border-severity-high/30',
  red:     'bg-severity-critical/15 text-severity-critical border-severity-critical/30',
  green:   'bg-accent-emerald/15 text-accent-emerald border-accent-emerald/30',
}

export function Tag({ children, variant = 'default', size = 'sm', className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border rounded font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-px text-[10px]',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
