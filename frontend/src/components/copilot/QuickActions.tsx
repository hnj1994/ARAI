/** QuickActions — preset question buttons for the copilot */
import { Zap } from 'lucide-react'

interface QuickActionsProps {
  onAction: (prompt: string) => void
  disabled?: boolean
}

const QUICK_ACTIONS = [
  { label: 'Critical alerts today',       prompt: 'What are the most critical alerts in the last 24 hours?' },
  { label: 'Brute force detection',        prompt: 'Are there any brute force or credential stuffing attacks?' },
  { label: 'Unusual network activity',     prompt: 'Describe any unusual network activity or lateral movement.' },
  { label: 'Most at-risk agent',           prompt: 'Which agent has the most alerts? What should I investigate first?' },
  { label: 'MITRE techniques in use',      prompt: 'Which MITRE ATT&CK techniques are most represented in recent alerts?' },
  { label: 'Recommended next steps',       prompt: 'What are the top 3 things I should investigate right now?' },
]

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="p-4 border-b border-bg-border">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-3.5 h-3.5 text-brand-glow" />
        <span className="text-xs text-text-muted uppercase tracking-wider">Quick Actions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            disabled={disabled}
            className="text-xs px-3 py-1.5 rounded-lg bg-bg-elevated border border-bg-border text-text-secondary
                       hover:border-brand/40 hover:text-brand-glow hover:bg-brand/5
                       transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
