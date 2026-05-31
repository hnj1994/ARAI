/**
 * ARIA SOC Platform — WebSocket Hook
 * Connects to /ws/alerts, receives live alerts, reconnects on failure.
 * BUG fix: exponential backoff reconnect (1s, 2s, 4s, 8s, max 30s)
 */

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useSOCStore } from '@/store/socStore'
import type { Alert } from '@/types'

const WS_BASE = import.meta.env.VITE_WS_BASE ?? '/ws'

export function useWebSocket() {
  const { session } = useAuthStore()
  const { addAlert, setWsConnected } = useSOCStore()
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmountedRef = useRef(false)

  useEffect(() => {
    if (!session?.token) return

    unmountedRef.current = false

    function connect() {
      if (unmountedRef.current) return

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const url = `${protocol}//${host}${WS_BASE}/alerts?token=${session!.token}`

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        retriesRef.current = 0
        setWsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const alert = JSON.parse(event.data) as Alert
          addAlert(alert)
        } catch {
          // ignore malformed messages
        }
      }

      ws.onerror = () => {
        setWsConnected(false)
      }

      ws.onclose = () => {
        setWsConnected(false)
        if (unmountedRef.current) return

        // Exponential backoff: 1s, 2s, 4s, 8s … max 30s
        const delay = Math.min(30_000, 1_000 * 2 ** retriesRef.current)
        retriesRef.current++
        timeoutRef.current = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      unmountedRef.current = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      wsRef.current?.close()
      setWsConnected(false)
    }
  }, [session?.token])
}
