/** HypothesisInput — form to submit a threat hunt hypothesis */
import { useState } from 'react'
import { Crosshair, Loader2 } from 'lucide-react'

interface HypothesisInputProps {
  onSubmit: (hypothesis: string, agentCount: number, osMix: string) => void
  isLoading: boolean
}

const EXAMPLE_HYPOTHESES = [
  'An attacker has established persistence on a Windows endpoint via a scheduled task',
  'Credential dumping is occurring on domain controllers',
  'Lateral movement is happening via PsExec or WMI',
  'Data exfiltration is occurring via DNS tunneling',
]

export function HypothesisInput({ onSubmit, isLoading }: HypothesisInputProps) {
  const [hypothesis, setHypothesis] = useState('')
  const [agentCount, setAgentCount] = useState(10)
  const [osMix, setOsMix] = useState('Windows 10/11, Ubuntu 22.04')

  function handleSubmit() {
    if (!hypothesis.trim() || isLoading) return
    onSubmit(hypothesis.trim(), agentCount, osMix)
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Crosshair className="w-5 h-5 text-brand-glow" />
        <h2 className="text-text-primary font-semibold">Threat Hunt Hypothesis</h2>
      </div>

      <div>
        <label htmlFor="hypothesis" className="block text-xs text-text-muted mb-1.5">
          Describe your hypothesis — what threat are you hunting for?
        </label>
        <textarea
          id="hypothesis"
          rows={3}
          value={hypothesis}
          onChange={(e) => setHypothesis(e.target.value)}
          placeholder="e.g. An attacker has established persistence via a scheduled task…"
          className="input-base w-full text-sm"
          disabled={isLoading}
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {EXAMPLE_HYPOTHESES.map((ex) => (
            <button
              key={ex}
              onClick={() => setHypothesis(ex)}
              className="text-[10px] text-text-muted hover:text-brand-glow bg-bg-elevated border border-bg-border rounded px-2 py-0.5 transition-colors"
            >
              {ex.slice(0, 45)}…
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs text-text-muted mb-1.5">Agent count</label>
          <input
            type="number"
            min={1}
            value={agentCount}
            onChange={(e) => setAgentCount(Number(e.target.value))}
            className="input-base w-full text-sm"
            disabled={isLoading}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-text-muted mb-1.5">OS environment</label>
          <input
            type="text"
            value={osMix}
            onChange={(e) => setOsMix(e.target.value)}
            className="input-base w-full text-sm"
            disabled={isLoading}
            placeholder="Windows 10, Ubuntu…"
          />
        </div>
      </div>

      <button
        id="btn-start-hunt"
        onClick={handleSubmit}
        disabled={!hypothesis.trim() || isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Designing hunt plan…
          </>
        ) : (
          <>
            <Crosshair className="w-4 h-4" />
            Design Hunt Plan
          </>
        )}
      </button>
    </div>
  )
}
