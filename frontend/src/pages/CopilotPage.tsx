/**
 * ARIA SOC Platform — Copilot Page
 */

import { useOllamaChat } from '@/hooks/useOllamaChat'
import { useSOCStore } from '@/store/socStore'
import { ChatWindow } from '@/components/copilot/ChatWindow'
import { ChatInput } from '@/components/copilot/ChatInput'
import { QuickActions } from '@/components/copilot/QuickActions'
import { Trash2 } from 'lucide-react'

export function CopilotPage() {
  const { chatMessages, isLoading, sendMessage } = useOllamaChat()
  const clearChat = useSOCStore((s) => s.clearChat)

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)] -m-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-bg-border bg-bg-surface flex-shrink-0">
        <div>
          <h2 className="text-text-primary font-semibold text-sm">ARIA Copilot</h2>
          <p className="text-[10px] text-text-muted">Powered by llama3.2 — local inference only</p>
        </div>
        {chatMessages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-severity-critical transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Quick actions */}
      {chatMessages.length === 0 && (
        <QuickActions onAction={sendMessage} disabled={isLoading} />
      )}

      {/* Chat window */}
      <ChatWindow messages={chatMessages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  )
}
