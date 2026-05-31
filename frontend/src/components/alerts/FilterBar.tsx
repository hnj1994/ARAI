/** FilterBar — alert list filters: severity, time window, agent, level */
import { Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AlertFilters {
  severity: string
  time_window: string
  agent: string
  min_level: number
}

interface FilterBarProps {
  filters: AlertFilters
  onChange: (filters: AlertFilters) => void
}

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high',     label: '🟠 High' },
  { value: 'medium',   label: '🟡 Medium' },
  { value: 'low',      label: '🔵 Low' },
]

const TIME_OPTIONS = [
  { value: 'now-1h',  label: 'Last 1h' },
  { value: 'now-6h',  label: 'Last 6h' },
  { value: 'now-24h', label: 'Last 24h' },
  { value: 'now-7d',  label: 'Last 7d' },
  { value: 'now-30d', label: 'Last 30d' },
]

const SELECT_CLASS = cn(
  'bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5 text-xs text-text-primary',
  'focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors',
)

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const hasFilters = filters.severity || filters.agent || filters.min_level > 1

  function update(partial: Partial<AlertFilters>) {
    onChange({ ...filters, ...partial })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-bg-surface border border-bg-border rounded-xl mb-4">
      {/* Agent search */}
      <div className="relative flex-1 min-w-40">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
        <input
          id="filter-agent"
          type="text"
          placeholder="Filter by agent…"
          value={filters.agent}
          onChange={(e) => update({ agent: e.target.value })}
          className="input-base pl-9 text-xs w-full py-1.5"
        />
      </div>

      {/* Severity */}
      <select
        id="filter-severity"
        className={SELECT_CLASS}
        value={filters.severity}
        onChange={(e) => update({ severity: e.target.value })}
      >
        {SEVERITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Time window */}
      <select
        id="filter-time"
        className={SELECT_CLASS}
        value={filters.time_window}
        onChange={(e) => update({ time_window: e.target.value })}
      >
        {TIME_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Min level */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Level ≥</span>
        <input
          id="filter-level"
          type="number"
          min={1}
          max={15}
          value={filters.min_level}
          onChange={(e) => update({ min_level: Number(e.target.value) })}
          className="input-base w-16 text-xs text-center py-1.5"
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          id="filter-clear"
          onClick={() => onChange({ severity: '', time_window: 'now-24h', agent: '', min_level: 1 })}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}

      <div className="ml-auto flex items-center gap-1.5 text-xs text-text-muted">
        <Filter className="w-3.5 h-3.5" />
        <span>Filters</span>
      </div>
    </div>
  )
}
