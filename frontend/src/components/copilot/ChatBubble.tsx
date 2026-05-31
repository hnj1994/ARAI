/** ChatBubble — a single message bubble in the copilot chat */
import { Bot, User } from 'lucide-react'
import type { ChatMessage } from '@/types'
import { cn } from '@/lib/utils'

interface ChatBubbleProps {
  message: ChatMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const isStreaming = message.is_streaming

  return (
    <div className={cn('flex gap-3 animate-fade-in', isUser ? 'flex-row-reverse' : '')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
        isUser
          ? 'bg-brand/20 border border-brand/30'
          : 'bg-gradient-to-br from-brand to-accent-purple',
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-brand-glow" />
          : <Bot className="w-3.5 h-3.5 text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-brand/20 border border-brand/25 text-text-primary rounded-tr-sm'
          : 'bg-bg-surface border border-bg-border text-text-primary rounded-tl-sm',
      )}>
        {message.content || (
          <span className="text-text-muted text-xs">Thinking…</span>
        )}
        {isStreaming && message.content && (
          <span className="inline-block w-0.5 h-4 bg-brand-glow ml-0.5 animate-blink align-middle" />
        )}
      </div>
    </div>
  )
}
