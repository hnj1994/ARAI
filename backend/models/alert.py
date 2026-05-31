"""
ARIA SOC Platform — Alert Pydantic Models
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AlertLevel(int, Enum):
    """Wazuh alert severity levels mapped to human-readable labels."""
    LOW = 3
    MEDIUM = 7
    HIGH = 10
    CRITICAL = 13


class AlertSeverity(str, Enum):
    """Normalised severity label used in the UI."""
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


def level_to_severity(level: int) -> AlertSeverity:
    """Convert a Wazuh numeric level (1-15) to a severity label."""
    if level >= 13:
        return AlertSeverity.critical
    if level >= 10:
        return AlertSeverity.high
    if level >= 7:
        return AlertSeverity.medium
    return AlertSeverity.low


class MITREInfo(BaseModel):
    """MITRE ATT&CK mapping for an alert."""
    tactic: str | None = None
    technique: str | None = None
    technique_id: str | None = None


class RuleInfo(BaseModel):
    """Wazuh rule metadata embedded in an alert."""
    id: str | None = None
    level: int = Field(default=0, ge=0, le=15)
    description: str = ""
    groups: list[str] = Field(default_factory=list)
    mitre: MITREInfo = Field(default_factory=MITREInfo)
    gdpr: list[str] = Field(default_factory=list)
    hipaa: list[str] = Field(default_factory=list)
    nist_800_53: list[str] = Field(default_factory=list)
    pci_dss: list[str] = Field(default_factory=list)


class AgentRef(BaseModel):
    """Minimal agent reference embedded in an alert."""
    id: str | None = None
    name: str = "unknown"
    ip: str | None = None


class AlertData(BaseModel):
    """Arbitrary alert data payload (source IP, process, user, etc.)."""
    srcip: str | None = None
    dstip: str | None = None
    process: str | None = None
    command: str | None = None
    protocol: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)


class Alert(BaseModel):
    """
    Normalised ARIA alert — derived from a raw Wazuh alert document.
    All fields that the UI depends on are guaranteed to exist.
    """
    id: str
    timestamp: datetime
    severity: AlertSeverity
    rule: RuleInfo
    agent: AgentRef
    data: AlertData = Field(default_factory=AlertData)
    full_log: str | None = None
    manager_name: str | None = None
    raw: dict[str, Any] = Field(
        default_factory=dict,
        description="Original raw document from OpenSearch/Wazuh",
    )

    model_config = {"populate_by_name": True}


class AlertListResponse(BaseModel):
    """Paginated alert list returned by GET /api/alerts."""
    total: int
    alerts: list[Alert]
    page: int = 1
    page_size: int = 50


class AlertDetailResponse(BaseModel):
    """Single alert with optional AI triage attached."""
    alert: Alert
    triage: dict[str, Any] | None = None


# ─── Normalisation helper ─────────────────────────────────────────────────────

def normalise_wazuh_alert(raw: dict[str, Any]) -> Alert:
    """
    Convert a raw Wazuh/OpenSearch hit into a typed Alert.

    OpenSearch hit structure (Wazuh index):
      _id, _source.id, _source.timestamp, _source.rule.*, _source.agent.*, ...
    """
    src: dict[str, Any] = raw.get("_source", raw)

    rule_raw = src.get("rule", {})
    mitre_raw = rule_raw.get("mitre", {})
    mitre_tactics: list[str] = mitre_raw.get("tactic", [])
    mitre_ids: list[str] = mitre_raw.get("id", [])
    mitre_techniques: list[str] = mitre_raw.get("technique", [])

    mitre = MITREInfo(
        tactic=mitre_tactics[0] if mitre_tactics else None,
        technique=mitre_techniques[0] if mitre_techniques else None,
        technique_id=mitre_ids[0] if mitre_ids else None,
    )

    rule = RuleInfo(
        id=str(rule_raw.get("id", "")),
        level=int(rule_raw.get("level", 0)),
        description=rule_raw.get("description", ""),
        groups=rule_raw.get("groups", []),
        mitre=mitre,
        gdpr=rule_raw.get("gdpr", []),
        hipaa=rule_raw.get("hipaa", []),
        nist_800_53=rule_raw.get("nist_800_53", []),
        pci_dss=rule_raw.get("pci_dss", []),
    )

    agent_raw = src.get("agent", {})
    agent = AgentRef(
        id=str(agent_raw.get("id", "")),
        name=agent_raw.get("name", "unknown"),
        ip=agent_raw.get("ip"),
    )

    data_raw = src.get("data", {})
    net_info = src.get("network", {})

    alert_data = AlertData(
        srcip=data_raw.get("srcip") or net_info.get("srcip"),
        dstip=data_raw.get("dstip") or net_info.get("dstip"),
        process=data_raw.get("process") or src.get("process", {}).get("name"),
        command=data_raw.get("command"),
        protocol=data_raw.get("protocol"),
        extra={k: v for k, v in data_raw.items() if k not in ("srcip", "dstip", "process", "command", "protocol")},
    )

    raw_timestamp = src.get("timestamp") or src.get("@timestamp") or ""
    try:
        ts = datetime.fromisoformat(raw_timestamp.replace("Z", "+00:00"))
    except Exception:
        ts = datetime.utcnow()

    alert_id = raw.get("_id") or src.get("id") or ""

    return Alert(
        id=alert_id,
        timestamp=ts,
        severity=level_to_severity(rule.level),
        rule=rule,
        agent=agent,
        data=alert_data,
        full_log=src.get("full_log"),
        manager_name=src.get("manager", {}).get("name"),
        raw=src,
    )
