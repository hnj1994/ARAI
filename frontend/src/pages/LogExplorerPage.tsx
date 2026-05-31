/**
 * ARIA SOC Platform — Log Explorer Page
 * Natural language search via AI + raw DSL mode.
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiApi } from '@/api/ai'
import { searchApi } from '@/api/search'
import { ScrollText, Search, Code2, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'nl' | 'dsl'

export function LogExplorerPage() {
  const [mode, setMode] = useState<Mode>('nl')
  const [nlQuestion, setNlQuestion] = useState('')
  const [dslText, setDslText] = useState(JSON.stringify({
    query: { range: { '@timestamp': { gte: 'now-1h' } } },
    sort: [{ '@timestamp': 'desc' }],
    size: 20,
  }, null, 2))
  const [dslError, setDslError] = useState('')

  const nlSearch = useMutation({
    mutationFn: (question: string) => aiApi.nlSearch(question),
  })

  const rawSearch = useMutation({
    mutationFn: (dsl: string) => {
      try {
        const query = JSON.parse(dsl)
        return searchApi.query({ query })
      } catch {
        return Promise.reject(new Error('Invalid JSON'))
      }
    },
  })

  function handleNLSearch() {
    if (!nlQuestion.trim()) return
    nlSearch.mutate(nlQuestion.trim())
  }

  function handleDSLSearch() {
    try {
      JSON.parse(dslText)
      setDslError('')
      rawSearch.mutate(dslText)
    } catch {
      setDslError('Invalid JSON — fix syntax before searching')
    }
  }

  const results = mode === 'nl' ? nlSearch.data?.results : rawSearch.data?.hits
  const total = mode === 'nl' ? nlSearch.data?.total : rawSearch.data?.total
  const isLoading = mode === 'nl' ? nlSearch.isPending : rawSearch.isPending

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-text-primary font-bold text-xl flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-brand-glow" />
          Log Explorer
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Search OpenSearch logs using natural language or raw DSL queries.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-bg-elevated border border-bg-border rounded-xl p-1 w-fit">
        {([['nl', 'AI Natural Language', Sparkles], ['dsl', 'Raw DSL', Code2]] as const).map(([m, label, Icon]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all',
              mode === m
                ? 'bg-brand text-white shadow-glow-sm'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Search area */}
      {mode === 'nl' ? (
        <div className="card p-4 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-glow" />
              <input
                id="nl-search-input"
                type="text"
                value={nlQuestion}
                onChange={(e) => setNlQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNLSearch()}
                placeholder="e.g. failed SSH logins in the last 24 hours from external IPs"
                className="input-base w-full pl-10"
                disabled={isLoading}
              />
            </div>
            <button
              id="btn-nl-search"
              onClick={handleNLSearch}
              disabled={!nlQuestion.trim() || isLoading}
              className="btn-primary flex items-center gap-2 px-5 disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
          {nlSearch.data?.raw_dsl && (
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Generated DSL</p>
              <pre className="text-[10px] font-mono text-accent-cyan bg-bg border border-bg-border rounded-lg p-3 overflow-x-auto max-h-32">
                {nlSearch.data.raw_dsl}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-4 space-y-3">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">
              OpenSearch DSL Query
            </label>
            <textarea
              id="dsl-query-input"
              rows={8}
              value={dslText}
              onChange={(e) => { setDslText(e.target.value); setDslError('') }}
              className={cn('input-base w-full font-mono text-xs text-accent-cyan', dslError && 'border-severity-critical')}
              spellCheck={false}
            />
            {dslError && <p className="text-xs text-severity-critical mt-1">{dslError}</p>}
          </div>
          <button
            id="btn-dsl-search"
            onClick={handleDSLSearch}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Execute Query
          </button>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
            <span className="text-xs text-text-muted">
              <span className="font-mono text-text-primary font-semibold">{total?.toLocaleString()}</span> results
            </span>
          </div>
          <div className="divide-y divide-bg-border max-h-96 overflow-y-auto">
            {results.slice(0, 50).map((hit, i) => {
              const src = (hit as { _source?: Record<string, unknown>; _id?: string })._source ?? hit
              const id = (hit as { _id?: string })._id ?? String(i)
              const timestamp = (src as Record<string, unknown>)['@timestamp'] as string
              const description = ((src as Record<string, unknown>).rule as Record<string, unknown>)?.description as string
              const agentName = ((src as Record<string, unknown>).agent as Record<string, unknown>)?.name as string
              return (
                <div key={id} className="px-4 py-3 hover:bg-bg-elevated transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-text-primary font-medium line-clamp-1">
                        {description ?? 'Unknown event'}
                      </p>
                      <div className="flex gap-3 mt-0.5 text-[10px] text-text-muted font-mono">
                        <span>{agentName}</span>
                        <span>{timestamp ? new Date(timestamp).toLocaleString() : ''}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono flex-shrink-0">{id.slice(0, 12)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {results?.length === 0 && (nlSearch.isSuccess || rawSearch.isSuccess) && (
        <div className="text-center py-12 text-text-muted text-sm">
          No results found
        </div>
      )}
    </div>
  )
}
