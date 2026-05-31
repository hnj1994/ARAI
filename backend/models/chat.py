"""
ARIA SOC Platform — Chat & AI Pydantic Models
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ChatRole(str, Enum):
    """Message roles for the AI chat conversation."""
    user = "user"
    assistant = "assistant"
    system = "system"


class ChatMessage(BaseModel):
    """A single message in the ARIA Copilot conversation."""
    id: str
    role: ChatRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_streaming: bool = False


class ChatRequest(BaseModel):
    """Request body for POST /api/ai/chat."""
    message: str = Field(..., min_length=1, max_length=8000)
    history: list[dict[str, str]] = Field(
        default_factory=list,
        description="Previous messages: [{'role': 'user|assistant', 'content': '...'}]",
    )


class TriageRequest(BaseModel):
    """Request body for POST /api/ai/triage."""
    alert_id: str
    rule: dict[str, Any] = Field(default_factory=dict)
    agent: dict[str, Any] = Field(default_factory=dict)
    data: dict[str, Any] = Field(default_factory=dict)
    full_log: str | None = None


class MITRETriageInfo(BaseModel):
    """MITRE ATT&CK info returned by triage."""
    tactic: str | None = None
    technique: str | None = None


class TriageResult(BaseModel):
    """
    Structured AI triage result.
    Maps 1:1 with the triage prompt JSON schema.
    """
    verdict: str  # true_positive | false_positive | likely_fp | needs_investigation
    severity: str  # critical | high | medium | low
    confidence: int = Field(ge=0, le=100)
    risk_score: int = Field(ge=1, le=10)
    summary: str
    threat_type: str
    mitre: MITRETriageInfo = Field(default_factory=MITRETriageInfo)
    immediate_actions: list[str] = Field(default_factory=list)
    investigation_steps: list[str] = Field(default_factory=list)
    escalate_to_human: bool = False
    escalation_reason: str | None = None
    alert_id: str | None = None
    raw_response: str | None = None


class HuntRequest(BaseModel):
    """Request body for POST /api/ai/hunt."""
    hypothesis: str = Field(..., min_length=10, max_length=2000)
    agent_count: int = Field(default=1, ge=0)
    os_mix: str = Field(default="mixed")


class HuntQueryItem(BaseModel):
    """A single hunting query within a hunt plan."""
    description: str
    opensearch_logic: str
    expected_hit: str
    false_positive: str


class HuntPlan(BaseModel):
    """
    Structured threat hunt plan returned by /api/ai/hunt.
    Maps 1:1 with the hunt prompt JSON schema.
    """
    hypothesis: str
    mitre_techniques: list[str] = Field(default_factory=list)
    hunting_queries: list[HuntQueryItem] = Field(default_factory=list)
    artifacts_to_collect: list[str] = Field(default_factory=list)
    pivot_points: list[str] = Field(default_factory=list)
    estimated_time: str
    raw_response: str | None = None


class NLSearchRequest(BaseModel):
    """Request body for POST /api/ai/nl-search."""
    question: str = Field(..., min_length=3, max_length=500)


class NLSearchResult(BaseModel):
    """DSL query generated from natural language + search results."""
    question: str
    dsl_query: dict[str, Any]
    results: list[dict[str, Any]] = Field(default_factory=list)
    total: int = 0
    raw_dsl: str | None = None
