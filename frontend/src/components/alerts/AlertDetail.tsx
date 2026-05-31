/** AlertDetail — right-pane detail view for a selected alert, with AI triage */
import { useState } from 'react'
import { X, Bot, Shield, Network, Clock, Copy, CheckCheck, AlertTriangle } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { alertsApi } from '@/api/alerts'
import { aiApi } from '@/api/ai'
import type { Alert, TriageResult } from '@/types'
import { Tag } from '@/components/ui/Tag'
import { Dot } from '@/components/ui/Dot'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { formatTimestamp, severityDotColor, cn } from '@/lib/utils'

interface AlertDetailProps {
  alertId: string
  onClose: () => void
}

function TriagePanel({ result }: { result: TriageResult }) {
  const verdictColor = {
    true_positive: 'red',
    false_positive: 'green',
    likely_fp: 'blue',
    needs_investigation: 'orange',
  }[result.verdict] as 'red' | 'green' | 'blue' | 'orange' | 'default'

  return (
    <div className="space-y-4">
      {/* Verdict */}
      <div className="flex items-center justify-between">
        <Tag variant={verdictColor === 'red' ? 'red' : verdictColor === 'green' ? 'green' : verdictColor === 'orange' ? 'orange' : 'blue'}>
          {result.verdict.replace(/_/g, ' ').toUpperCase()}
        </Tag>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>Confidence:</span>
          <span className="font-mono font-semibold text-text-primary">{result.confidence}%</span>
          <span>Risk:</span>
          <span className="font-mono font-semibold text-severity-critical">{result.risk_score}/10</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-text-primary leading-relaxed bg-bg-elevated rounded-lg p-3">
        {result.summary}
      </p>

      {/* MITRE */}
      {(result.mitre.tactic || result.mitre.technique) && (
        <div className="flex gap-2 flex-wrap">
          {result.mitre.tactic && <Tag variant="purple">{result.mitre.tactic}</Tag>}
          {result.mitre.technique && <Tag variant="cyan">{result.mitre.technique}</Tag>}
        </div>
      )}

      {/* Immediate actions */}
      {result.immediate_actions.length > 0 && (
        <div>
          <SectionLabel>Immediate Actions</SectionLabel>
          <ul className="space-y-1.5">
            {result.immediate_actions.map((action, i) => (
              <li key={i} className="flex gap-2 text-xs text-text-secondary">
                <span className="text-severity-critical font-bold flex-shrink-0">{i + 1}.</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Investigation steps */}
      {result.investigation_steps.length > 0 && (
        <div>
          <SectionLabel>Investigation Steps</SectionLabel>
          <ul className="space-y-1.5">
            {result.investigation_steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs text-text-secondary">
                <span className="text-brand font-bold flex-shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Escalation */}
      {result.escalate_to_human && (
        <div className="flex items-start gap-2 bg-severity-critical/10 border border-severity-critical/30 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-severity-critical flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-severity-critical">Escalation Required</p>
            {result.escalation_reason && (
              <p className="text-xs text-text-secondary mt-0.5">{result.escalation_reason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function AlertDetail({ alertId, onClose }: AlertDetailProps) {
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['alert', alertId],
    queryFn: () => alertsApi.get(alertId),
  })

  const triage = useMutation({
    mutationFn: (alert: Alert) => aiApi.triage({
      alert_id: alert.id,
      rule: alert.rule as Record<string, unknown>,
      agent: alert.agent as Record<string, unknown>,
      data: alert.data as Record<string, unknown>,
      full_log: alert.full_log,
    }),
  })

  const alert = data?.alert

  function handleCopyLog() {
    if (alert?.full_log) {
      navigator.clipboard.writeText(alert.full_log)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-bg-elevated rounded animate-pulse" style={{ width: `${80 - i * 5}%` }} />
        ))}
      </div>
    )
  }

  if (!alert) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-bg-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Dot color={severityDotColor(alert.severity)} pulse={alert.severity === 'critical'} />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Alert Detail</h3>
            <span className="text-[10px] text-text-muted font-mono">{alert.id.slice(0, 20)}…</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors" id="btn-close-detail">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Rule info */}
        <div>
          <SectionLabel icon={<Shield className="w-3.5 h-3.5" />}>Rule</SectionLabel>
          <p className="text-sm text-text-primary font-medium">{alert.rule.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Tag variant="red">Level {alert.rule.level}</Tag>
            {alert.rule.groups.slice(0, 3).map((g) => (
              <Tag key={g} variant="default" size="xs">{g}</Tag>
            ))}
          </div>
        </div>

        {/* Agent & network */}
        <div>
          <SectionLabel icon={<Network className="w-3.5 h-3.5" />}>Agent & Network</SectionLabel>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Agent', alert.agent.name],
              ['Agent IP', alert.agent.ip ?? '—'],
              ['Src IP', alert.data.srcip ?? '—'],
              ['Dst IP', alert.data.dstip ?? '—'],
              ['Process', alert.data.process ?? '—'],
              ['Manager', alert.manager_name ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-text-muted">{label}: </span>
                <span className="text-text-primary font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MITRE */}
        {(alert.rule.mitre.tactic || alert.rule.mitre.technique_id) && (
          <div>
            <SectionLabel>MITRE ATT&CK</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {alert.rule.mitre.tactic && <Tag variant="purple">{alert.rule.mitre.tactic}</Tag>}
              {alert.rule.mitre.technique_id && <Tag variant="cyan">{alert.rule.mitre.technique_id}</Tag>}
              {alert.rule.mitre.technique && <Tag variant="default" size="xs">{alert.rule.mitre.technique}</Tag>}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div>
          <SectionLabel icon={<Clock className="w-3.5 h-3.5" />}>Time</SectionLabel>
          <span className="text-xs text-text-secondary font-mono">{formatTimestamp(alert.timestamp)}</span>
        </div>

        {/* Raw log */}
        {alert.full_log && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel className="mb-0">Raw Log</SectionLabel>
              <button
                onClick={handleCopyLog}
                className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary transition-colors"
              >
                {copied ? <CheckCheck className="w-3 h-3 text-accent-emerald" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-[10px] text-text-muted font-mono bg-bg leading-relaxed overflow-x-auto p-3 rounded-lg border border-bg-border max-h-32">
              {alert.full_log}
            </pre>
          </div>
        )}

        {/* AI Triage */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel icon={<Bot className="w-3.5 h-3.5" />} className="mb-0">
              AI Triage
            </SectionLabel>
            {!triage.data && (
              <button
                id="btn-run-triage"
                onClick={() => triage.mutate(alert)}
                disabled={triage.isPending}
                className="btn-primary text-xs py-1 px-3"
              >
                {triage.isPending ? 'Analysing…' : 'Run Triage'}
              </button>
            )}
          </div>

          {triage.isPending && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <div className="w-3 h-3 border border-brand border-t-transparent rounded-full animate-spin" />
              ARIA is analysing this alert…
            </div>
          )}

          {triage.error && (
            <p className="text-xs text-severity-critical">
              Triage failed: {String(triage.error)}
            </p>
          )}

          {triage.data && <TriagePanel result={triage.data} />}
        </div>
      </div>
    </div>
  )
}
