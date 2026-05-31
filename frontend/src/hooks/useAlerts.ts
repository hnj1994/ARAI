import { useQuery } from '@tanstack/react-query'
import { alertsApi } from '@/api/alerts'

export function useAlerts(params?: {
  page?: number
  page_size?: number
  min_level?: number
  time_window?: string
  agent?: string
  severity?: string
}) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertsApi.list(params),
    refetchInterval: 30_000,  // Auto-refresh every 30s
    staleTime: 15_000,
  })
}

export function useAlertStats() {
  return useQuery({
    queryKey: ['alert-stats'],
    queryFn: alertsApi.stats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useAlert(id: string | null) {
  return useQuery({
    queryKey: ['alert', id],
    queryFn: () => alertsApi.get(id!),
    enabled: !!id,
    staleTime: 60_000,
  })
}
