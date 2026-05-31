/**
 * ARIA SOC Platform — Agents Page
 */

import { useAgents } from '@/hooks/useAgents'
import { Dot } from '@/components/ui/Dot'
import { Tag } from '@/components/ui/Tag'
import { Monitor, RefreshCw } from 'lucide-react'
import { formatTimestamp } from '@/lib/utils'
import type { Agent, AgentStatus } from '@/types'

function statusColor(s: AgentStatus): 'green' | 'red' | 'yellow' | 'gray' {
  switch (s) {
    case 'active': return 'green'
    case 'disconnected': return 'red'
    case 'pending': return 'yellow'
    default: return 'gray'
  }
}

function AgentRow({ agent }: { agent: Agent }) {
  return (
    <tr className="border-b border-bg-border hover:bg-bg-elevated transition-colors">
      <td className="py-3 px-4 w-10">
        <Dot color={statusColor(agent.status)} pulse={agent.status === 'active'} />
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-text-primary font-medium">{agent.name}</div>
        <div className="text-[10px] text-text-muted font-mono">{agent.id}</div>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-text-secondary font-mono">{agent.ip ?? '—'}</span>
      </td>
      <td className="py-3 px-4">
        <Tag variant={agent.status === 'active' ? 'green' : agent.status === 'disconnected' ? 'red' : 'default'} size="xs">
          {agent.status}
        </Tag>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <span className="text-xs text-text-muted">
          {agent.os.name ? `${agent.os.name} ${agent.os.version ?? ''}`.trim() : '—'}
        </span>
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <span className="text-xs text-text-muted">{agent.manager ?? '—'}</span>
      </td>
      <td className="py-3 px-4 hidden xl:table-cell text-right">
        <span className="text-xs text-text-muted font-mono">
          {agent.last_keepalive ? formatTimestamp(agent.last_keepalive) : '—'}
        </span>
      </td>
    </tr>
  )
}

export function AgentsPage() {
  const { data, isLoading, isRefetching, refetch } = useAgents({ status: 'all', limit: 200 })
  const agents = data?.agents ?? []
  const active = agents.filter((a) => a.status === 'active').length
  const disconnected = agents.filter((a) => a.status === 'disconnected').length

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Header stats */}
      <div className="flex items-center gap-4">
        <h1 className="text-text-primary font-bold text-xl flex items-center gap-2">
          <Monitor className="w-5 h-5 text-brand-glow" />
          Agent Registry
        </h1>
        <div className="flex gap-2 ml-auto">
          <Tag variant="green">{active} active</Tag>
          {disconnected > 0 && <Tag variant="red">{disconnected} disconnected</Tag>}
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bg-border">
              {['', 'Agent Name', 'IP', 'Status', 'OS', 'Manager', 'Last Seen'].map((h) => (
                <th key={h} className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-bg-border animate-pulse">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="py-3 px-4">
                      <div className="h-3 bg-bg-elevated rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-text-muted text-sm">
                  No agents found
                </td>
              </tr>
            ) : (
              agents.map((agent) => <AgentRow key={agent.id} agent={agent} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
