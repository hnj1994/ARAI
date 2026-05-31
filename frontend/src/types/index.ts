/**
 * ARIA SOC Platform — TypeScript Types
 * All shared interfaces and types used across the frontend.
 */

// ── Alert types ───────────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'
export type AlertVerdict =
  | 'true_positive'
  | 'false_positive'
  | 'likely_fp'
  | 'needs_investigation'

export interface MITREInfo {
  tactic?: string
  technique?: string
  technique_id?: string
}

export interface RuleInfo {
  id?: string
  level: number
  description: string
  groups: string[]
  mitre: MITREInfo
  gdpr?: string[]
  hipaa?: string[]
  nist_800_53?: string[]
  pci_dss?: string[]
}

export interface AgentRef {
  id?: string
  name: string
  ip?: string
}

export interface AlertData {
  srcip?: string
  dstip?: string
  process?: string
  command?: string
  protocol?: string
  extra?: Record<string, unknown>
}

export interface Alert {
  id: string
  timestamp: string  // ISO 8601
  severity: AlertSeverity
  rule: RuleInfo
  agent: AgentRef
  data: AlertData
  full_log?: string
  manager_name?: string
}

export interface AlertListResponse {
  total: number
  alerts: Alert[]
  page: number
  page_size: number
}

export interface AlertDetailResponse {
  alert: Alert
  triage?: TriageResult
}

// ── Agent types ───────────────────────────────────────────────────────────────

export type AgentStatus = 'active' | 'disconnected' | 'never_connected' | 'pending'

export interface AgentOS {
  platform?: string
  name?: string
  version?: string
  arch?: string
}

export interface Agent {
  id: string
  name: string
  status: AgentStatus
  ip?: string
  manager?: string
  version?: string
  os: AgentOS
  last_keepalive?: string
  date_add?: string
  group: string[]
  node_name?: string
}

export interface AgentListResponse {
  total: number
  agents: Agent[]
}

// ── AI / Chat types ───────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  is_streaming?: boolean
}

export interface TriageMITRE {
  tactic?: string
  technique?: string
}

export interface TriageResult {
  verdict: AlertVerdict
  severity: AlertSeverity
  confidence: number
  risk_score: number
  summary: string
  threat_type: string
  mitre: TriageMITRE
  immediate_actions: string[]
  investigation_steps: string[]
  escalate_to_human: boolean
  escalation_reason?: string
  alert_id?: string
}

export interface HuntQueryItem {
  description: string
  opensearch_logic: string
  expected_hit: string
  false_positive: string
}

export interface HuntPlan {
  hypothesis: string
  mitre_techniques: string[]
  hunting_queries: HuntQueryItem[]
  artifacts_to_collect: string[]
  pivot_points: string[]
  estimated_time: string
}

export interface NLSearchResult {
  question: string
  dsl_query: Record<string, unknown>
  results: Record<string, unknown>[]
  total: number
  raw_dsl?: string
}

// ── Dashboard types ───────────────────────────────────────────────────────────

export interface SeverityBreakdown {
  critical: number
  high: number
  medium: number
  low: number
}

export interface TopHost {
  agent: string
  count: number
}

export interface MITRETechnique {
  technique: string
  count: number
}

export interface MITRETactic {
  tactic: string
  count: number
  techniques: MITRETechnique[]
}

export interface DashboardStats {
  total_24h: number
  severity_breakdown: SeverityBreakdown
  top_hosts: TopHost[]
  mitre_heatmap: MITRETactic[]
}

// ── Health check types ────────────────────────────────────────────────────────

export type ServiceStatus = 'ok' | 'unavailable' | 'degraded'

export interface HealthResponse {
  status: ServiceStatus
  version: string
  services: {
    wazuh: ServiceStatus
    opensearch: ServiceStatus
    ollama: ServiceStatus
    redis: ServiceStatus
  }
}

// ── Auth types ────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  expires_in: number
  token_type: string
  username: string
}

// BUG #2 FIX: Track expiry client-side
export interface Session {
  token: string
  username: string
  expiresAt: Date
}

// ── Search types ──────────────────────────────────────────────────────────────

export interface SearchRequest {
  index?: string
  query: Record<string, unknown>
}

export interface SearchResponse {
  total: number
  hits: Record<string, unknown>[]
  took_ms: number
}

// ── API response wrapper ──────────────────────────────────────────────────────

export interface ApiError {
  detail: string
  status?: number
}
