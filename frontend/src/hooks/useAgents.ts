import { useQuery } from '@tanstack/react-query'
import { agentsApi } from '@/api/agents'

export function useAgents(params?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => agentsApi.list(params),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useAgent(id: string | null) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentsApi.get(id!),
    enabled: !!id,
    staleTime: 60_000,
  })
}
