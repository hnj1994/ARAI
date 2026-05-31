"""
ARIA SOC Platform — Agent Pydantic Models
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AgentStatus(str, Enum):
    """Wazuh agent connection status."""
    active = "active"
    disconnected = "disconnected"
    never_connected = "never_connected"
    pending = "pending"


class AgentOS(BaseModel):
    """Operating system details for an agent."""
    platform: str | None = None
    name: str | None = None
    version: str | None = None
    arch: str | None = None


class Agent(BaseModel):
    """
    Normalised Wazuh agent record.
    Used by GET /api/agents and embedded in alert context.
    """
    id: str
    name: str
    status: AgentStatus = AgentStatus.never_connected
    ip: str | None = None
    manager: str | None = None
    version: str | None = None
    os: AgentOS = Field(default_factory=AgentOS)
    last_keepalive: datetime | None = None
    date_add: datetime | None = None
    group: list[str] = Field(default_factory=list)
    node_name: str | None = None


class AgentListResponse(BaseModel):
    """Paginated agent list returned by GET /api/agents."""
    total: int
    agents: list[Agent]


# ─── Normalisation helper ─────────────────────────────────────────────────────

def normalise_wazuh_agent(raw: dict[str, Any]) -> Agent:
    """Convert a raw Wazuh agent record into a typed Agent."""

    os_raw = raw.get("os", {})
    os = AgentOS(
        platform=os_raw.get("platform"),
        name=os_raw.get("name"),
        version=os_raw.get("version"),
        arch=os_raw.get("arch"),
    )

    def parse_dt(val: str | None) -> datetime | None:
        if not val:
            return None
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except Exception:
            return None

    status_raw = raw.get("status", "never_connected")
    try:
        status = AgentStatus(status_raw)
    except ValueError:
        status = AgentStatus.never_connected

    group_val = raw.get("group", [])
    if isinstance(group_val, str):
        group_val = [group_val]

    return Agent(
        id=str(raw.get("id", "")),
        name=raw.get("name", "unknown"),
        status=status,
        ip=raw.get("ip"),
        manager=raw.get("manager"),
        version=raw.get("version"),
        os=os,
        last_keepalive=parse_dt(raw.get("lastKeepAlive")),
        date_add=parse_dt(raw.get("dateAdd")),
        group=group_val,
        node_name=raw.get("node_name"),
    )
