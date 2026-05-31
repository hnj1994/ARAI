import apiClient from './client'
import type { HuntPlan, HuntRequest, NLSearchResult, TriageRequest, TriageResult } from '@/types'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api'

export const aiApi = {
  triage: async (body: TriageRequest): Promise<TriageResult> => {
    const { data } = await apiClient.post<TriageResult>('/ai/triage', body)
    return data
  },

  hunt: async (body: HuntRequest): Promise<HuntPlan> => {
    const { data } = await apiClient.post<HuntPlan>('/ai/hunt', body)
    return data
  },

  nlSearch: async (question: string): Promise<NLSearchResult> => {
    const { data } = await apiClient.post<NLSearchResult>('/ai/nl-search', { question })
    return data
  },

  /**
   * Streaming chat — returns an async generator of text chunks.
   * Uses fetch + ReadableStream for SSE (not axios, which buffers).
   */
  streamChat: async function* (
    message: string,
    history: Array<{ role: string; content: string }> = [],
  ): AsyncGenerator<string> {
    const session = useAuthStore.getState().session
    const token = session?.token ?? ''

    const response = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, history }),
    })

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') return
        try {
          const obj = JSON.parse(payload)
          if (obj.chunk) yield obj.chunk
        } catch {
          // ignore malformed lines
        }
      }
    }
  },
}
