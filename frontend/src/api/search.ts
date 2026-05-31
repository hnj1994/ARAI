import apiClient from './client'
import type { SearchRequest, SearchResponse } from '@/types'

export const searchApi = {
  query: async (body: SearchRequest): Promise<SearchResponse> => {
    const { data } = await apiClient.post<SearchResponse>('/search', body)
    return data
  },
}
