/**
 * ARIA SOC Platform — Top Bar
 */

import { Bell, LogOut, User, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useSOCStore } from '@/store/socStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { Dot } from '@/components/ui/Dot'

const PAGE_TITLES: Record<string, string> = {
  '/':        'Security Overview',
  '/alerts':  'Alert Management',
  '/copilot': 'ARIA Copilot',
  '/hunt':    'Threat Hunting',
  '/logs':    'Log Explorer',
  '/mitre':   'MITRE ATT&CK',
  '/agents':  'Agent Registry',
  '/config':  'Configuration',
}

export function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, clearSession } = useAuthStore()
  const liveAlerts = useSOCStore((s) => s.liveAlerts)
  const wsConnected = useSOCStore((s) => s.wsConnected)

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'ARIA'
  const now = new Date()

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-bg-surface border-b border-bg-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Page title */}
      <div>
        <h1 className="text-text-primary font-semibold">{pageTitle}</h1>
        <div className="text-[10px] text-text-muted font-mono">
          {now.toLocaleString(undefined, {
            weekday: 'short', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false,
          })}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Live alert indicator */}
        {liveAlerts.length > 0 && (
          <button
            className="flex items-center gap-2 bg-severity-critical/10 border border-severity-critical/30 rounded-lg px-3 py-1.5 text-xs text-severity-critical hover:bg-severity-critical/20 transition-colors"
            onClick={() => navigate('/alerts')}
            title="New live alerts"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="font-mono font-semibold">{liveAlerts.length}</span>
          </button>
        )}

        {/* WebSocket status */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Dot color={wsConnected ? 'green' : 'gray'} pulse={wsConnected} size="sm" />
          <span className="hidden sm:inline">{wsConnected ? 'Live' : 'Offline'}</span>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5">
          <User className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs text-text-secondary font-medium">
            {session?.username ?? 'Analyst'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-text-muted hover:text-severity-critical hover:bg-severity-critical/10 rounded-lg transition-colors"
          title="Logout"
          id="btn-logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
