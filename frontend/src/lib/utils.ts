/** cn utility — merges Tailwind class names */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Severity to Tailwind color mapping */
export function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-severity-critical'
    case 'high':     return 'text-severity-high'
    case 'medium':   return 'text-severity-medium'
    case 'low':      return 'text-severity-low'
    default:         return 'text-text-secondary'
  }
}

export function severityBg(severity: string): string {
  switch (severity) {
    case 'critical': return 'severity-critical'
    case 'high':     return 'severity-high'
    case 'medium':   return 'severity-medium'
    case 'low':      return 'severity-low'
    default:         return ''
  }
}

export function severityDotColor(severity: string): 'red' | 'orange' | 'yellow' | 'blue' | 'gray' {
  switch (severity) {
    case 'critical': return 'red'
    case 'high':     return 'orange'
    case 'medium':   return 'yellow'
    case 'low':      return 'blue'
    default:         return 'gray'
  }
}

/** Format a UTC ISO timestamp to readable local time */
export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}

/** Relative time (e.g., "2m ago") */
export function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const s = Math.floor(diff / 1000)
    if (s < 60) return `${s}s ago`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch {
    return ''
  }
}

/** Truncate text to N chars */
export function truncate(text: string, n: number): string {
  return text.length > n ? text.slice(0, n) + '…' : text
}

/** Generate a simple UUID v4 */
export function uuid(): string {
  return crypto.randomUUID()
}
