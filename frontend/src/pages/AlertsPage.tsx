/**
 * ARIA SOC Platform — Alerts Page
 */

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAlerts } from '@/hooks/useAlerts'
import { AlertTable } from '@/components/alerts/AlertTable'
import { AlertDetail } from '@/components/alerts/AlertDetail'
import { FilterBar, type AlertFilters } from '@/components/alerts/FilterBar'
import { useSOCStore } from '@/store/socStore'

export function AlertsPage() {
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get('selected')
  )
  const [filters, setFilters] = useState<AlertFilters>({
    severity: '',
    time_window: 'now-24h',
    agent: '',
    min_level: 1,
  })

  const { data, isLoading, isRefetching, refetch } = useAlerts({
    page,
    page_size: 50,
    min_level: filters.min_level || undefined,
    time_window: filters.time_window,
    agent: filters.agent || undefined,
    severity: filters.severity || undefined,
  })

  function handleSelect(id: string) {
    setSelectedId(id === selectedId ? null : id)
  }

  function handleFilterChange(newFilters: AlertFilters) {
    setFilters(newFilters)
    setPage(1) // Reset to page 1 on filter change
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Main table */}
      <div className="flex-1 min-w-0 space-y-0">
        <FilterBar filters={filters} onChange={handleFilterChange} />
        <AlertTable
          data={data}
          isLoading={isLoading}
          isRefetching={isRefetching}
          selectedId={selectedId}
          onSelect={handleSelect}
          page={page}
          onPageChange={setPage}
          onRefresh={refetch}
          pageSize={50}
        />
      </div>

      {/* Detail pane */}
      {selectedId && (
        <div className="w-96 flex-shrink-0 card overflow-hidden">
          <AlertDetail
            alertId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  )
}
