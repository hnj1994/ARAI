/** SectionLabel — small uppercase section header */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionLabelProps {
  children: ReactNode
  className?: string
  icon?: ReactNode
}

export function SectionLabel({ children, className, icon }: SectionLabelProps) {
  return (
    <div className={cn('flex items-center gap-2 mb-3', className)}>
      {icon && <span className="text-text-muted">{icon}</span>}
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        {children}
      </span>
    </div>
  )
}
