/** HuntPlan — full rendered threat hunt plan */
import type { HuntPlan as HuntPlanType } from '@/types'
import { QueryCard } from './QueryCard'
import { Tag } from '@/components/ui/Tag'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Clock, Archive, GitFork } from 'lucide-react'

interface HuntPlanProps {
  plan: HuntPlanType
}

export function HuntPlan({ plan }: HuntPlanProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-5">
        <h3 className="text-text-primary font-semibold text-base mb-2">Hunt Plan</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{plan.hypothesis}</p>

        <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {plan.estimated_time}
          </div>
          <div className="flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5" />
            {plan.hunting_queries.length} queries
          </div>
        </div>

        {/* MITRE techniques */}
        {plan.mitre_techniques.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {plan.mitre_techniques.map((t) => (
              <Tag key={t} variant="cyan" size="xs">{t}</Tag>
            ))}
          </div>
        )}
      </div>

      {/* Queries */}
      {plan.hunting_queries.length > 0 && (
        <div>
          <SectionLabel>Hunting Queries</SectionLabel>
          <div className="space-y-3">
            {plan.hunting_queries.map((q, i) => (
              <QueryCard key={i} query={q} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Artifacts */}
      {plan.artifacts_to_collect.length > 0 && (
        <div className="card p-4">
          <SectionLabel icon={<Archive className="w-3.5 h-3.5" />}>Artifacts to Collect</SectionLabel>
          <ul className="space-y-1.5">
            {plan.artifacts_to_collect.map((a, i) => (
              <li key={i} className="flex gap-2 text-xs text-text-secondary">
                <span className="text-brand font-bold">→</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pivot points */}
      {plan.pivot_points.length > 0 && (
        <div className="card p-4">
          <SectionLabel icon={<GitFork className="w-3.5 h-3.5" />}>Pivot Points</SectionLabel>
          <ul className="space-y-1.5">
            {plan.pivot_points.map((p, i) => (
              <li key={i} className="flex gap-2 text-xs text-text-secondary">
                <span className="text-accent-purple font-bold">↗</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
