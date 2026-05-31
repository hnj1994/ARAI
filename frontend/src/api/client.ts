/**
 * ARIA SOC Platform — Axios Client
 * Configured with base URL, token injection, and 401 redirect.
 * BUG #2 FIX: Checks token expiry before every request.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: inject JWT + check expiry ────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { session, clearSession } = useAuthStore.getState()

    if (!session) return config

    // BUG #2 FIX: reject expired tokens before they hit the server
    const expiresAt = new Date(session.expiresAt)
    const isExpired = expiresAt < new Date(Date.now() + 60_000) // 60s grace

    if (isExpired) {
      clearSession()
      window.location.href = '/login'
      return Promise.reject(new Error('Session expired')) as never
    }

    config.headers.Authorization = `Bearer ${session.token}`
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor: handle 401 ─────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
