import apiClient from './client'
import type { Agent, AgentListResponse } from '@/types'

export const agentsApi = {
  list: async (params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<AgentListResponse> => {
    const { data } = await apiClient.get<AgentListResponse>('/agents', { params })
    return data
  },

  get: async (id: string): Promise<Agent> => {
    const { data } = await apiClient.get<Agent>(`/agents/${id}`)
    return data
  },
}
