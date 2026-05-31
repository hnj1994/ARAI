/** ServiceHealth — shows the health status of each integrated service */
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import type { HealthResponse } from '@/types'
import { Dot } from '@/components/ui/Dot'

function statusDotColor(s: string): 'green' | 'red' | 'gray' {
  if (s === 'ok') return 'green'
  if (s === 'unavailable' || s === 'degraded') return 'red'
  return 'gray'
}

function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await apiClient.get<HealthResponse>('/health')
      return data
    },
    refetchInterval: 30_000,
  })
}

export function ServiceHealth() {
  const { data, isLoading } = useHealth()

  const services = data ? [
    { name: 'Wazuh SIEM',   status: data.services.wazuh },
    { name: 'OpenSearch',   status: data.services.opensearch },
    { name: 'Ollama AI',    status: data.services.ollama },
    { name: 'Redis',        status: data.services.redis },
  ] : []

  return (
    <div className="space-y-2">
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between animate-pulse">
            <div className="h-3 bg-bg-elevated rounded w-24" />
            <div className="h-3 bg-bg-elevated rounded w-12" />
          </div>
        ))
      ) : (
        services.map(({ name, status }) => (
          <div key={name} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Dot color={statusDotColor(status)} pulse={status === 'ok'} />
              <span className="text-xs text-text-secondary">{name}</span>
            </div>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${
              status === 'ok' ? 'text-accent-emerald' : 'text-severity-critical'
            }`}>
              {status}
            </span>
          </div>
        ))
      )}

      {data && (
        <div className="mt-3 pt-3 border-t border-bg-border flex items-center justify-between">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Platform</span>
          <span className={`text-[10px] font-semibold uppercase ${
            data.status === 'ok' ? 'text-accent-emerald' : 'text-severity-medium'
          }`}>
            {data.status}
          </span>
        </div>
      )}
    </div>
  )
}
