/**
 * ARIA SOC Platform — Ollama Streaming Chat Hook
 * Manages streaming response state for the Copilot page.
 */

import { useState, useCallback } from 'react'
import { aiApi } from '@/api/ai'
import { useSOCStore } from '@/store/socStore'
import { uuid } from '@/lib/utils'
import type { ChatMessage } from '@/types'

export function useOllamaChat() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { chatMessages, addChatMessage, updateLastMessage } = useSOCStore()

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setError(null)

    // Add user message
    const userMsg: ChatMessage = {
      id: uuid(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    addChatMessage(userMsg)

    // Add placeholder assistant message (streaming)
    const assistantMsg: ChatMessage = {
      id: uuid(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      is_streaming: true,
    }
    addChatMessage(assistantMsg)
    setIsLoading(true)

    // Build history for context (exclude the empty placeholder)
    const history = chatMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      let accumulated = ''
      for await (const chunk of aiApi.streamChat(content, history)) {
        accumulated += chunk
        updateLastMessage(accumulated, true)
      }
      updateLastMessage(accumulated, false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Chat failed'
      setError(msg)
      updateLastMessage(`Error: ${msg}`, false)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, chatMessages, addChatMessage, updateLastMessage])

  return {
    chatMessages,
    isLoading,
    error,
    sendMessage,
  }
}
