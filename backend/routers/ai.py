"""
ARIA SOC Platform — AI Router
POST /api/ai/triage     — structured alert triage via Ollama
POST /api/ai/chat       — streaming ARIA Copilot chat
POST /api/ai/hunt       — threat hunt plan design
POST /api/ai/nl-search  — natural language → OpenSearch DSL + results
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from middleware.auth import CurrentUser
from models import (
    HuntPlan,
    HuntRequest,
    NLSearchRequest,
    NLSearchResult,
    TriageRequest,
    TriageResult,
    ChatRequest,
)
from prompts.library import (
    build_hunt_prompt,
    build_nl_search_prompt,
    build_triage_prompt,
    SYSTEM,
)
from services import ollama as ollama_client
from services import opensearch as os_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ─── Triage ───────────────────────────────────────────────────────────────────

@router.post("/triage", response_model=TriageResult)
async def triage_alert(
    body: TriageRequest,
    current_user: CurrentUser,
) -> TriageResult:
    """
    Send an alert to Ollama for AI triage.
    Returns a structured TriageResult with verdict, severity, MITRE mapping,
    immediate actions, and escalation recommendation.
    Temperature: 0.1 for consistency.
    """
    rule = body.rule or {}
    agent = body.agent or {}
    data = body.data or {}

    prompt = build_triage_prompt(
        rule_description=rule.get("description", "Unknown alert"),
        rule_level=rule.get("level", 0),
        agent_name=agent.get("name", "unknown"),
        agent_ip=agent.get("ip", "unknown"),
        agent_os=agent.get("os", {}).get("name", "unknown") if isinstance(agent.get("os"), dict) else "unknown",
        src_ip=data.get("srcip", "N/A"),
        process=data.get("process", "N/A"),
        username=data.get("user", "N/A"),
        mitre_tactic=rule.get("mitre", {}).get("tactic", "N/A") if isinstance(rule.get("mitre"), dict) else "N/A",
        mitre_technique=rule.get("mitre", {}).get("technique", "N/A") if isinstance(rule.get("mitre"), dict) else "N/A",
        raw_log=body.full_log or "",
    )

    try:
        result_dict = await ollama_client.complete_json(
            prompt=prompt,
            temperature=0.1,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI triage failed: {exc}",
        )
    except Exception as exc:
        logger.error(f"Triage error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ollama is unavailable",
        )

    try:
        mitre_raw = result_dict.get("mitre", {})
        triage = TriageResult(
            verdict=result_dict.get("verdict", "needs_investigation"),
            severity=result_dict.get("severity", "medium"),
            confidence=int(result_dict.get("confidence", 50)),
            risk_score=int(result_dict.get("risk_score", 5)),
            summary=result_dict.get("summary", ""),
            threat_type=result_dict.get("threat_type", "Unknown"),
            mitre={"tactic": mitre_raw.get("tactic"), "technique": mitre_raw.get("technique")},
            immediate_actions=result_dict.get("immediate_actions", []),
            investigation_steps=result_dict.get("investigation_steps", []),
            escalate_to_human=bool(result_dict.get("escalate_to_human", False)),
            escalation_reason=result_dict.get("escalation_reason"),
            alert_id=body.alert_id,
        )
    except Exception as exc:
        logger.error(f"TriageResult construction failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Invalid triage response structure: {exc}",
        )

    return triage


# ─── Chat (streaming) ─────────────────────────────────────────────────────────

@router.post("/chat")
async def chat(
    body: ChatRequest,
    current_user: CurrentUser,
) -> StreamingResponse:
    """
    Stream a response from the ARIA Copilot.
    Returns text/event-stream with data: chunks.
    Frontend reads via EventSource or fetch + ReadableStream.
    """
    async def event_stream():
        async for chunk in ollama_client.stream_chat(
            prompt=body.message,
            system=SYSTEM,
            history=body.history,
            temperature=0.7,
        ):
            # SSE format: "data: <payload>\n\n"
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        },
    )


# ─── Threat hunt ──────────────────────────────────────────────────────────────

@router.post("/hunt", response_model=HuntPlan)
async def design_hunt(
    body: HuntRequest,
    current_user: CurrentUser,
) -> HuntPlan:
    """
    Design a structured threat hunt plan via Ollama.
    Returns hypothesis, MITRE techniques, hunting queries, and pivot points.
    Temperature: 0.2.
    """
    prompt = build_hunt_prompt(
        hypothesis=body.hypothesis,
        agent_count=body.agent_count,
        os_mix=body.os_mix,
    )

    try:
        result_dict = await ollama_client.complete_json(
            prompt=prompt,
            temperature=0.2,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Hunt design failed: {exc}",
        )
    except Exception as exc:
        logger.error(f"Hunt error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ollama is unavailable",
        )

    try:
        queries_raw = result_dict.get("hunting_queries", [])
        hunting_queries = []
        for q in queries_raw:
            hunting_queries.append({
                "description": q.get("description", ""),
                "opensearch_logic": q.get("opensearch_logic", ""),
                "expected_hit": q.get("expected_hit", ""),
                "false_positive": q.get("false_positive", ""),
            })

        plan = HuntPlan(
            hypothesis=result_dict.get("hypothesis", body.hypothesis),
            mitre_techniques=result_dict.get("mitre_techniques", []),
            hunting_queries=hunting_queries,
            artifacts_to_collect=result_dict.get("artifacts_to_collect", []),
            pivot_points=result_dict.get("pivot_points", []),
            estimated_time=result_dict.get("estimated_time", "Unknown"),
        )
    except Exception as exc:
        logger.error(f"HuntPlan construction failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Invalid hunt response structure: {exc}",
        )

    return plan


# ─── NL → OpenSearch DSL ──────────────────────────────────────────────────────

@router.post("/nl-search", response_model=NLSearchResult)
async def nl_search(
    body: NLSearchRequest,
    current_user: CurrentUser,
) -> NLSearchResult:
    """
    Convert a natural language question to OpenSearch DSL and execute it.
    Returns the DSL query + matching alert documents.
    Temperature: 0.1 for deterministic DSL.
    """
    prompt = build_nl_search_prompt(body.question)

    try:
        dsl_query = await ollama_client.complete_json(
            prompt=prompt,
            temperature=0.1,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"DSL generation failed: {exc}",
        )

    # Execute the generated query against OpenSearch
    try:
        result = await os_client.run_query(query=dsl_query)
        hits = result.get("hits", {})
        total_val = hits.get("total", {})
        total = total_val.get("value", 0) if isinstance(total_val, dict) else int(total_val)
        raw_hits = hits.get("hits", [])
    except Exception as exc:
        logger.error(f"NL search execution failed: {exc}")
        # Return the DSL even if execution fails
        return NLSearchResult(
            question=body.question,
            dsl_query=dsl_query,
            results=[],
            total=0,
            raw_dsl=json.dumps(dsl_query, indent=2),
        )

    return NLSearchResult(
        question=body.question,
        dsl_query=dsl_query,
        results=raw_hits,
        total=total,
        raw_dsl=json.dumps(dsl_query, indent=2),
    )
