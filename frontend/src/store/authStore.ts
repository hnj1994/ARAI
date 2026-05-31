/**
 * ARIA SOC Platform — Auth Store (Zustand)
 * Manages login state, JWT token, and expiry.
 * BUG #2 FIX: stores expiresAt and checks before requests.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, LoginResponse } from '@/types'

interface AuthState {
  session: Session | null
  setSession: (response: LoginResponse) => void
  clearSession: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,

      setSession: (response: LoginResponse) => {
        const expiresAt = new Date(Date.now() + response.expires_in * 1000)
        set({
          session: {
            token: response.token,
            username: response.username,
            expiresAt,
          },
        })
      },

      clearSession: () => set({ session: null }),

      // BUG #2 FIX: always check expiry, not just token existence
      isAuthenticated: () => {
        const { session } = get()
        if (!session) return false
        return new Date(session.expiresAt) > new Date(Date.now() + 60_000)
      },
    }),
    {
      name: 'aria-auth',
      // Rehydrate expiresAt as a Date object (JSON serialises as string)
      onRehydrateStorage: () => (state) => {
        if (state?.session?.expiresAt) {
          state.session.expiresAt = new Date(state.session.expiresAt)
        }
      },
    },
  ),
)
