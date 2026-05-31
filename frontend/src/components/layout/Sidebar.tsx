/**
 * ARIA SOC Platform — Sidebar Navigation
 */

import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldAlert,
  Bot,
  Crosshair,
  ScrollText,
  Grid2x2,
  Monitor,
  Settings,
  Zap,
} from 'lucide-react'
import { useSOCStore } from '@/store/socStore'
import { Dot } from '@/components/ui/Dot'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Overview'     },
  { to: '/alerts',   icon: ShieldAlert,     label: 'Alerts'       },
  { to: '/copilot',  icon: Bot,             label: 'AI Copilot'   },
  { to: '/hunt',     icon: Crosshair,       label: 'Threat Hunt'  },
  { to: '/logs',     icon: ScrollText,      label: 'Log Explorer' },
  { to: '/mitre',    icon: Grid2x2,         label: 'MITRE ATT&CK' },
  { to: '/agents',   icon: Monitor,         label: 'Agents'       },
  { to: '/config',   icon: Settings,        label: 'Config'       },
]

export function Sidebar() {
  const location = useLocation()
  const wsConnected = useSOCStore((s) => s.wsConnected)
  const liveAlerts = useSOCStore((s) => s.liveAlerts)

  return (
    <aside className="w-64 flex-shrink-0 bg-bg-surface border-r border-bg-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-bg-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-accent-cyan flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-text-primary tracking-wide gradient-text text-lg">
              ARIA
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest">
              SOC Platform
            </div>
          </div>
        </div>
      </div>

      {/* Live status */}
      <div className="px-4 py-3 border-b border-bg-border">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Dot color={wsConnected ? 'green' : 'gray'} pulse={wsConnected} />
            <span>{wsConnected ? 'Live Stream' : 'Offline'}</span>
          </div>
          {liveAlerts.length > 0 && (
            <span className="bg-severity-critical/20 text-severity-critical text-[10px] px-1.5 py-0.5 rounded font-mono">
              {liveAlerts.length}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)

            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-brand/15 text-brand-glow border border-brand/25 shadow-glow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 flex-shrink-0 transition-colors',
                    isActive ? 'text-brand-glow' : 'text-text-muted group-hover:text-text-secondary',
                  )}
                />
                {label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-bg-border">
        <div className="text-[10px] text-text-muted text-center">
          ARIA v1.0.0 — Self-hosted SOC
        </div>
      </div>
    </aside>
  )
}
