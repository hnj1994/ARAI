/**
 * ARIA SOC Platform — SOC Store (Zustand)
 * Global state for alerts, agents, chat messages, and WebSocket.
 */

import { create } from 'zustand'
import type { Alert, Agent, ChatMessage } from '@/types'

interface SOCState {
  // ── Live alerts (from WebSocket) ──────────────────────────────────────────
  liveAlerts: Alert[]
  addAlert: (alert: Alert) => void
  clearLiveAlerts: () => void

  // ── Agents ────────────────────────────────────────────────────────────────
  agents: Agent[]
  setAgents: (agents: Agent[]) => void

  // ── Chat messages ─────────────────────────────────────────────────────────
  chatMessages: ChatMessage[]
  addChatMessage: (msg: ChatMessage) => void
  updateLastMessage: (content: string, streaming?: boolean) => void
  clearChat: () => void

  // ── Selected alert (for detail pane) ─────────────────────────────────────
  selectedAlertId: string | null
  setSelectedAlertId: (id: string | null) => void

  // ── WebSocket state ───────────────────────────────────────────────────────
  wsConnected: boolean
  setWsConnected: (v: boolean) => void
}

export const useSOCStore = create<SOCState>()((set) => ({
  // Alerts
  liveAlerts: [],
  addAlert: (alert) =>
    set((state) => ({
      // Prepend, deduplicate by ID, keep last 200
      liveAlerts: [
        alert,
        ...state.liveAlerts.filter((a) => a.id !== alert.id),
      ].slice(0, 200),
    })),
  clearLiveAlerts: () => set({ liveAlerts: [] }),

  // Agents
  agents: [],
  setAgents: (agents) => set({ agents }),

  // Chat
  chatMessages: [],
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  updateLastMessage: (content, streaming = false) =>
    set((state) => {
      const msgs = [...state.chatMessages]
      if (msgs.length === 0) return {}
      const last = { ...msgs[msgs.length - 1], content, is_streaming: streaming }
      msgs[msgs.length - 1] = last
      return { chatMessages: msgs }
    }),
  clearChat: () => set({ chatMessages: [] }),

  // Selection
  selectedAlertId: null,
  setSelectedAlertId: (id) => set({ selectedAlertId: id }),

  // WebSocket
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),
}))
