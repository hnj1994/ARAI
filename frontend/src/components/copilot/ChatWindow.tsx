/** ChatWindow — scrollable message history for the copilot */
import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/types'
import { ChatBubble } from './ChatBubble'
import { Bot } from 'lucide-react'

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-accent-purple flex items-center justify-center shadow-glow">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-text-primary font-semibold text-lg">ARIA Copilot</h3>
          <p className="text-text-muted text-sm mt-1 max-w-sm">
            Your AI-powered SOC analyst. Ask me about alerts, threat actors, investigation steps,
            or anything related to your security posture.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center max-w-sm">
          {['Powered by llama3.2', 'Local inference', 'No data leaves your server'].map((badge) => (
            <span key={badge} className="text-[10px] bg-bg-elevated border border-bg-border rounded-full px-2.5 py-1 text-text-muted">
              {badge}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
      {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-accent-purple flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="bg-bg-surface border border-bg-border rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
