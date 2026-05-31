/** Card — glass-effect surface container */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  glow?: boolean
  onClick?: () => void
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({ children, className, padding = 'md', glow = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'card transition-all duration-200',
        paddings[padding],
        glow && 'shadow-glow border-brand/40',
        onClick && 'cursor-pointer hover:border-brand/40 hover:shadow-card',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-text-primary font-semibold text-sm', className)}>
      {children}
    </h3>
  )
}
