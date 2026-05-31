/**
 * ARIA SOC Platform — Router Setup
 * Protected routes redirect to /login if not authenticated.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { Layout } from '@/components/layout/Layout'
import { useWebSocket } from '@/hooks/useWebSocket'

// Pages
import { LoginPage }       from '@/pages/LoginPage'
import { DashboardPage }   from '@/pages/DashboardPage'
import { AlertsPage }      from '@/pages/AlertsPage'
import { CopilotPage }     from '@/pages/CopilotPage'
import { ThreatHuntPage }  from '@/pages/ThreatHuntPage'
import { LogExplorerPage } from '@/pages/LogExplorerPage'
import { MitrePage }       from '@/pages/MitrePage'
import { AgentsPage }      from '@/pages/AgentsPage'
import { ConfigPage }      from '@/pages/ConfigPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
    },
  },
})

/** Protected route wrapper — redirects to /login if session is invalid */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Inner app — has access to auth state, mounts WebSocket */
function AppInner() {
  useWebSocket()
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/alerts" element={
        <ProtectedRoute>
          <Layout>
            <AlertsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/copilot" element={
        <ProtectedRoute>
          <Layout>
            <CopilotPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/hunt" element={
        <ProtectedRoute>
          <Layout>
            <ThreatHuntPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/logs" element={
        <ProtectedRoute>
          <Layout>
            <LogExplorerPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/mitre" element={
        <ProtectedRoute>
          <Layout>
            <MitrePage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/agents" element={
        <ProtectedRoute>
          <Layout>
            <AgentsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/config" element={
        <ProtectedRoute>
          <Layout>
            <ConfigPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
