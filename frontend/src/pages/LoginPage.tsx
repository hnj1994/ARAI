/**
 * ARIA SOC Platform — Login Page
 */

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import type { LoginResponse } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [username, setUsername] = useState('wazuh')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username || !password) return

    setIsLoading(true)
    setError('')

    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', {
        username,
        password,
      })
      setSession(data)
      navigate('/')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Login failed. Check your credentials.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4"
         style={{
           backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.05) 0%, transparent 60%)',
         }}>
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20"
           style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-accent-purple shadow-glow mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">ARIA</h1>
          <p className="text-text-muted text-sm mt-1">Automated Response Intelligence Analyst</p>
          <p className="text-text-muted text-xs mt-0.5">Self-hosted SOC Platform</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-text-primary font-semibold text-lg mb-6">Sign in to your SOC</h2>

          {error && (
            <div className="flex items-center gap-2 bg-severity-critical/10 border border-severity-critical/30 rounded-lg px-4 py-3 mb-4">
              <AlertCircle className="w-4 h-4 text-severity-critical flex-shrink-0" />
              <p className="text-severity-critical text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-base w-full"
                placeholder="wazuh"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-text-muted mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base w-full pr-10"
                  placeholder="Wazuh API password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              disabled={isLoading || !password}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-bg-border text-center">
            <p className="text-[10px] text-text-muted">
              Credentials are validated against the Wazuh API.
              <br />
              No data is sent outside your network.
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-text-muted mt-4">
          ARIA v1.0.0 — Powered by Wazuh + OpenSearch + Ollama
        </p>
      </div>
    </div>
  )
}
