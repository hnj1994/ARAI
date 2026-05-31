"""
ARIA SOC Platform — Agents Router
GET /api/agents       — list all active Wazuh agents
GET /api/agents/{id}  — get a single agent by ID
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from middleware.auth import CurrentUser
from models import Agent, AgentListResponse, normalise_wazuh_agent
from services import wazuh as wazuh_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=AgentListResponse)
async def list_agents(
    current_user: CurrentUser,
    status_filter: Annotated[str, Query(alias="status")] = "active",
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> AgentListResponse:
    """
    Return a list of Wazuh agents.
    Default: active agents only.
    """
    try:
        raw_agents = await wazuh_client.get_agents(
            status=status_filter,
            limit=limit,
            offset=offset,
        )
    except Exception as exc:
        logger.error(f"Agent list failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Wazuh agent query failed: {exc}",
        )

    agents: list[Agent] = []
    for raw in raw_agents:
        try:
            agents.append(normalise_wazuh_agent(raw))
        except Exception as exc:
            logger.warning(f"Skipping malformed agent {raw.get('id')}: {exc}")

    return AgentListResponse(total=len(agents), agents=agents)


@router.get("/{agent_id}", response_model=Agent)
async def get_agent(
    agent_id: str,
    current_user: CurrentUser,
) -> Agent:
    """Return a single Wazuh agent by its ID."""
    try:
        raw = await wazuh_client.get_agent(agent_id)
    except Exception as exc:
        logger.error(f"Agent fetch failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Wazuh agent fetch failed: {exc}",
        )

    if raw is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id!r} not found",
        )

    return normalise_wazuh_agent(raw)
