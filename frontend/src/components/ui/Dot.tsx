/** Dot — small coloured status indicator circle */
import { cn } from '@/lib/utils'

interface DotProps {
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange'
  pulse?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const colors: Record<string, string> = {
  green:  'bg-accent-emerald shadow-[0_0_6px_#10b981]',
  red:    'bg-severity-critical shadow-[0_0_6px_#ef4444]',
  yellow: 'bg-severity-medium shadow-[0_0_6px_#eab308]',
  blue:   'bg-brand shadow-[0_0_6px_#3b82f6]',
  orange: 'bg-severity-high shadow-[0_0_6px_#f97316]',
  gray:   'bg-text-muted',
}

export function Dot({ color = 'gray', pulse = false, size = 'sm', className }: DotProps) {
  return (
    <span
      className={cn(
        'rounded-full inline-block flex-shrink-0',
        size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
        colors[color],
        pulse && 'animate-pulse-slow',
        className,
      )}
    />
  )
}
