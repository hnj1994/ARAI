"""
ARIA SOC Platform — Ollama Prompt Library
All prompts live here. Import from this module — never hardcode prompts elsewhere.
"""

from __future__ import annotations

# ─── System prompt ────────────────────────────────────────────────────────────
# Used in every Ollama request as the system message.

SYSTEM = """You are ARIA (Automated Response Intelligence Analyst), a Tier-1 SOC \
analyst AI embedded in a Wazuh SIEM. You analyse security alerts with precision \
and brevity. You think like a seasoned threat hunter. You never hallucinate IOCs, \
CVEs, or threat actor names. Acknowledge uncertainty explicitly when confidence \
is low. For triage requests respond ONLY in valid JSON — no markdown, no preamble. \
For chat respond naturally but concisely as a security expert."""


# ─── Triage prompt ────────────────────────────────────────────────────────────
# Temperature: 0.1  — low for consistency
# Returns: strict JSON matching TriageResult model

TRIAGE_PROMPT = """Analyse this Wazuh alert. Return ONLY this JSON — no markdown, no preamble:
{{
  "verdict": "true_positive"|"false_positive"|"likely_fp"|"needs_investigation",
  "severity": "critical"|"high"|"medium"|"low",
  "confidence": <0-100>,
  "risk_score": <1-10>,
  "summary": "<one sentence — what is actually happening>",
  "threat_type": "<specific threat category>",
  "mitre": {{"tactic": "<tactic>", "technique": "<T####.###>"}},
  "immediate_actions": ["<specific executable action>"],
  "investigation_steps": ["<what to look for next>"],
  "escalate_to_human": true|false,
  "escalation_reason": "<reason or null>"
}}

Alert: {rule_description} (Level {rule_level}/15)
Agent: {agent_name} ({agent_ip}) — OS: {agent_os}
Source IP: {src_ip} | Process: {process} | User: {username}
MITRE: {mitre_tactic} — {mitre_technique}
Raw log: {raw_log_truncated_to_800_chars}"""


def build_triage_prompt(
    *,
    rule_description: str,
    rule_level: int,
    agent_name: str,
    agent_ip: str,
    agent_os: str,
    src_ip: str,
    process: str,
    username: str,
    mitre_tactic: str,
    mitre_technique: str,
    raw_log: str,
) -> str:
    """Build a triage prompt from alert fields."""
    truncated_log = raw_log[:800] if raw_log else "N/A"
    return TRIAGE_PROMPT.format(
        rule_description=rule_description or "Unknown",
        rule_level=rule_level,
        agent_name=agent_name or "unknown",
        agent_ip=agent_ip or "unknown",
        agent_os=agent_os or "unknown",
        src_ip=src_ip or "N/A",
        process=process or "N/A",
        username=username or "N/A",
        mitre_tactic=mitre_tactic or "N/A",
        mitre_technique=mitre_technique or "N/A",
        raw_log_truncated_to_800_chars=truncated_log,
    )


# ─── NL → OpenSearch DSL prompt ───────────────────────────────────────────────
# Temperature: 0.1  — must produce deterministic DSL

NL_SEARCH_PROMPT = """Convert this question to OpenSearch DSL JSON.
Return ONLY the JSON query object. No explanation. No markdown.

Index: wazuh-alerts-*
Fields: rule.level(int 1-15), rule.description(text),
        rule.groups(keyword[]), rule.mitre.tactic(keyword),
        rule.mitre.id(keyword), agent.name(keyword),
        data.srcip(ip), @timestamp(date)

Examples:
"failed logins last 24h" →
{{"query":{{"bool":{{"must":[{{"match":{{"rule.groups":"authentication_failed"}}}},{{"range":{{"@timestamp":{{"gte":"now-24h"}}}}}}]}}}},"sort":[{{"@timestamp":"desc"}}],"size":50}}

"powershell on WORKSTATION-04" →
{{"query":{{"bool":{{"must":[{{"wildcard":{{"rule.description":"*powershell*"}}}},{{"term":{{"agent.name":"WORKSTATION-04"}}}}]}}}},"size":50}}

Question: "{question}" """


def build_nl_search_prompt(question: str) -> str:
    """Build the NL-to-DSL conversion prompt."""
    return NL_SEARCH_PROMPT.format(question=question)


# ─── Threat hunt design prompt ────────────────────────────────────────────────
# Temperature: 0.2  — slightly creative for diverse query ideas

HUNT_PROMPT = """Design a structured threat hunt. Return ONLY this JSON:
{{
  "hypothesis": "<restate clearly>",
  "mitre_techniques": ["T####"],
  "hunting_queries": [
    {{
      "description": "<what this finds>",
      "opensearch_logic": "<field:value AND field:value>",
      "expected_hit": "<what positive looks like>",
      "false_positive": "<what benign looks like>"
    }}
  ],
  "artifacts_to_collect": ["<specific artifact>"],
  "pivot_points": ["<if X then look for Y>"],
  "estimated_time": "<realistic duration>"
}}

Hypothesis: "{hypothesis}"
Environment: {agent_count} agents, OS: {os_mix}"""


def build_hunt_prompt(
    *,
    hypothesis: str,
    agent_count: int,
    os_mix: str,
) -> str:
    """Build a threat hunt design prompt."""
    return HUNT_PROMPT.format(
        hypothesis=hypothesis,
        agent_count=agent_count,
        os_mix=os_mix,
    )


# ─── Daily report prompt ──────────────────────────────────────────────────────
# Temperature: 0.3  — slightly higher for narrative quality

DAILY_REPORT_PROMPT = """Write a professional SOC daily briefing. Return ONLY this JSON:
{{
  "report_date": "{date}",
  "executive_summary": "<4 sentences: posture, top threat, action taken, outlook>",
  "top_threats": [{{"threat":"","count":0,"trend":"increasing|stable|decreasing","comment":""}}],
  "notable_incidents": [{{"title":"","severity":"","status":"","summary":"","action":""}}],
  "recommended_actions": [{{"priority":"immediate|this_week","action":"","owner":"SOC|IT"}}],
  "metrics": {{
    "total": {total}, "critical": {critical}, "high": {high},
    "true_positives": {tp}, "false_positives": {fp}
  }}
}}

Stats: {stats_json}
Top 10 alerts: {alerts_json}"""


def build_daily_report_prompt(
    *,
    date: str,
    total: int,
    critical: int,
    high: int,
    tp: int,
    fp: int,
    stats_json: str,
    alerts_json: str,
) -> str:
    """Build the daily SOC report prompt."""
    return DAILY_REPORT_PROMPT.format(
        date=date,
        total=total,
        critical=critical,
        high=high,
        tp=tp,
        fp=fp,
        stats_json=stats_json,
        alerts_json=alerts_json,
    )
