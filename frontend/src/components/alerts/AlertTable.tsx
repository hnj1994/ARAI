/** AlertTable — full paginated alert table with sorting */
import type { Alert, AlertListResponse } from '@/types'
import { AlertRow } from './AlertRow'
import { ChevronLeft, ChevronRight, RefreshCw, ShieldOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertTableProps {
  data: AlertListResponse | undefined
  isLoading: boolean
  isRefetching: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  page: number
  onPageChange: (page: number) => void
  onRefresh: () => void
  pageSize?: number
}

const TABLE_HEADERS = ['', 'Lvl', 'Rule Description', 'Agent', 'Src IP', 'Time', 'Severity']

export function AlertTable({
  data, isLoading, isRefetching, selectedId, onSelect,
  page, onPageChange, onRefresh, pageSize = 50,
}: AlertTableProps) {
  const total = data?.total ?? 0
  const alerts = data?.alerts ?? []
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="card overflow-hidden">
      {/* Table header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            <span className="font-mono text-text-primary font-semibold">{total.toLocaleString()}</span>
            {' '}alerts
          </span>
          {isRefetching && (
            <RefreshCw className="w-3 h-3 text-text-muted animate-spin" />
          )}
        </div>
        <button
          id="btn-refresh-alerts"
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isRefetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bg-border">
              {TABLE_HEADERS.map((h) => (
                <th key={h} className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-bg-border animate-pulse">
                  {TABLE_HEADERS.map((h, j) => (
                    <td key={j} className="py-3 px-4">
                      <div className="h-3 bg-bg-elevated rounded" style={{ width: j === 2 ? '70%' : '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={TABLE_HEADERS.length} className="py-16 text-center">
                  <ShieldOff className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-text-muted text-sm">No alerts match your filters</p>
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  selected={alert.id === selectedId}
                  onClick={() => onSelect(alert.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-bg-border">
          <span className="text-xs text-text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              id="btn-prev-page"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-next-page"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
