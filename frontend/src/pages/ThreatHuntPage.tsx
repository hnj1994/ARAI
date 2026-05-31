/**
 * ARIA SOC Platform — Threat Hunting Page
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiApi } from '@/api/ai'
import { useAgents } from '@/hooks/useAgents'
import type { HuntPlan as HuntPlanType } from '@/types'
import { HypothesisInput } from '@/components/hunt/HypothesisInput'
import { HuntPlan } from '@/components/hunt/HuntPlan'

export function ThreatHuntPage() {
  const [plan, setPlan] = useState<HuntPlanType | null>(null)
  const { data: agents } = useAgents()
  const agentCount = agents?.total ?? 0

  const mutation = useMutation({
    mutationFn: ({ hypothesis, agentCount, osMix }: {
      hypothesis: string
      agentCount: number
      osMix: string
    }) => aiApi.hunt({ hypothesis, agent_count: agentCount, os_mix: osMix }),
    onSuccess: (data) => setPlan(data),
  })

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-text-primary font-bold text-xl">Threat Hunting</h1>
        <p className="text-text-muted text-sm mt-1">
          Describe your hypothesis and ARIA will design a structured hunt plan with OpenSearch queries.
        </p>
      </div>

      <HypothesisInput
        onSubmit={(hypothesis, agentCount, osMix) =>
          mutation.mutate({ hypothesis, agentCount, osMix })
        }
        isLoading={mutation.isPending}
      />

      {mutation.isError && (
        <div className="card p-4 border-severity-critical/30">
          <p className="text-severity-critical text-sm">
            Hunt plan failed: {String(mutation.error)}
          </p>
        </div>
      )}

      {plan && <HuntPlan plan={plan} />}
    </div>
  )
}
