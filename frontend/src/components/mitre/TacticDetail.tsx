/** TacticDetail — expanded view of a single MITRE tactic */
import type { MITRETactic } from '@/types'
import { Tag } from '@/components/ui/Tag'

interface TacticDetailProps {
  tactic: MITRETactic
}

export function TacticDetail({ tactic }: TacticDetailProps) {
  return (
    <div className="card p-4">
      <h4 className="text-sm font-semibold text-text-primary mb-1">{tactic.tactic}</h4>
      <p className="text-xs text-text-muted mb-3">{tactic.count} alerts</p>
      <div className="flex flex-wrap gap-1.5">
        {tactic.techniques.map((t) => (
          <Tag key={t.technique} variant="cyan" size="xs">
            {t.technique} ({t.count})
          </Tag>
        ))}
      </div>
    </div>
  )
}
