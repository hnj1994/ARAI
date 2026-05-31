import apiClient from './client'
import type { AlertDetailResponse, AlertListResponse, DashboardStats } from '@/types'

export const alertsApi = {
  list: async (params?: {
    page?: number
    page_size?: number
    min_level?: number
    time_window?: string
    agent?: string
    severity?: string
  }): Promise<AlertListResponse> => {
    const { data } = await apiClient.get<AlertListResponse>('/alerts', { params })
    return data
  },

  get: async (id: string): Promise<AlertDetailResponse> => {
    const { data } = await apiClient.get<AlertDetailResponse>(`/alerts/${id}`)
    return data
  },

  stats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>('/alerts/stats')
    return data
  },
}
