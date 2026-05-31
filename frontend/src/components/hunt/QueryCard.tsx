/** QueryCard — a single hunting query within the hunt plan */
import { Copy, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import type { HuntQueryItem } from '@/types'

interface QueryCardProps {
  query: HuntQueryItem
  index: number
}

export function QueryCard({ query, index }: QueryCardProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(query.opensearch_logic)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand/20 text-brand-glow text-[10px] font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <h4 className="text-sm font-medium text-text-primary">{query.description}</h4>
        </div>
      </div>

      {/* OpenSearch logic */}
      <div className="relative">
        <pre className="text-xs text-accent-cyan font-mono bg-bg border border-bg-border rounded-lg p-3 overflow-x-auto">
          {query.opensearch_logic}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 bg-bg-elevated rounded text-text-muted hover:text-text-primary transition-colors"
          title="Copy query"
        >
          {copied ? <CheckCheck className="w-3 h-3 text-accent-emerald" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-accent-emerald uppercase tracking-wider block mb-1">Expected Hit</span>
          <p className="text-text-secondary">{query.expected_hit}</p>
        </div>
        <div>
          <span className="text-[10px] text-severity-medium uppercase tracking-wider block mb-1">False Positive</span>
          <p className="text-text-secondary">{query.false_positive}</p>
        </div>
      </div>
    </div>
  )
}
