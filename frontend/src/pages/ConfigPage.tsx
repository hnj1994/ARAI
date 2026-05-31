/**
 * ARIA SOC Platform — Config Page
 * Shows current environment configuration and connection status.
 */

import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import type { HealthResponse } from '@/types'
import { Settings, Server, Bot, Database, Activity } from 'lucide-react'
import { Dot } from '@/components/ui/Dot'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { SectionLabel } from '@/components/ui/SectionLabel'

function StatusRow({ name, status, url }: { name: string; status: string; url?: string }) {
  const isOk = status === 'ok'
  return (
    <div className="flex items-center justify-between py-3 border-b border-bg-border last:border-0">
      <div className="flex items-center gap-3">
        <Dot color={isOk ? 'green' : 'red'} pulse={isOk} />
        <div>
          <span className="text-sm text-text-primary">{name}</span>
          {url && <div className="text-[10px] text-text-muted font-mono">{url}</div>}
        </div>
      </div>
      <span className={`text-xs font-semibold uppercase ${isOk ? 'text-accent-emerald' : 'text-severity-critical'}`}>
        {status}
      </span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-bg-border last:border-0">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs text-text-primary font-mono">{value}</span>
    </div>
  )
}

export function ConfigPage() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health-config'],
    queryFn: async () => {
      const { data } = await apiClient.get<HealthResponse>('/health')
      return data
    },
    refetchInterval: 30_000,
  })

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-text-primary font-bold text-xl flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-glow" />
          Configuration
        </h1>
        <p className="text-text-muted text-sm mt-1">
          ARIA platform status and connection information. All values loaded from environment variables.
        </p>
      </div>

      {/* Platform status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-glow" />
            Service Status
          </CardTitle>
          {health && (
            <span className={`text-xs font-bold uppercase ${health.status === 'ok' ? 'text-accent-emerald' : 'text-severity-medium'}`}>
              {health.status}
            </span>
          )}
        </CardHeader>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-bg-elevated rounded animate-pulse" />
            ))}
          </div>
        ) : health ? (
          <div>
            <StatusRow name="Wazuh SIEM" status={health.services.wazuh} url="https://wazuh:55000" />
            <StatusRow name="OpenSearch" status={health.services.opensearch} url="https://opensearch:9200" />
            <StatusRow name="Ollama AI" status={health.services.ollama} url="http://ollama:11434" />
            <StatusRow name="Redis" status={health.services.redis} url="redis://redis:6379" />
          </div>
        ) : (
          <p className="text-text-muted text-sm">Unable to load health data</p>
        )}
      </Card>

      {/* Platform info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-glow" />
            Platform Information
          </CardTitle>
        </CardHeader>
        <InfoRow label="ARIA Version" value={health?.version ?? '1.0.0'} />
        <InfoRow label="AI Model" value="llama3.2 (Ollama)" />
        <InfoRow label="SIEM" value="Wazuh 4.x" />
        <InfoRow label="Search Backend" value="OpenSearch 2.x" />
        <InfoRow label="Cache" value="Redis 7" />
      </Card>

      {/* Security notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-brand-glow" />
            Security Architecture
          </CardTitle>
        </CardHeader>
        <div className="space-y-3 text-xs text-text-secondary">
          {[
            '✅ All API calls proxied through FastAPI — browser never contacts Wazuh, OpenSearch, or Ollama directly',
            '✅ OpenSearch credentials injected server-side by Nginx — never exposed to browser',
            '✅ JWT tokens expire after 8 hours with client-side expiry check',
            '✅ TLS encryption on all external endpoints via Nginx',
            '✅ AI inference runs 100% locally — no data sent to external services',
            '✅ Firewall (UFW) blocks direct access to internal service ports',
          ].map((note) => (
            <p key={note} className="leading-relaxed">{note}</p>
          ))}
        </div>
      </Card>

      {/* Environment note */}
      <div className="text-xs text-text-muted bg-bg-elevated border border-bg-border rounded-xl p-4">
        <p className="font-semibold text-text-secondary mb-1">Configuration is environment-driven</p>
        <p>All sensitive values (Wazuh password, OpenSearch credentials, JWT secret) are loaded from the
        <code className="mx-1 px-1.5 py-0.5 bg-bg rounded font-mono text-brand-glow">.env</code>
        file on the server. Never hardcode credentials in source code.</p>
      </div>
    </div>
  )
}
