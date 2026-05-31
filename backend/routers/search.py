"""
ARIA SOC Platform — Search Router
POST /api/search — proxy OpenSearch DSL queries (from frontend Log Explorer)
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from middleware.auth import CurrentUser
from services import opensearch as os_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"])


class SearchRequest(BaseModel):
    """Raw DSL query passthrough for the Log Explorer page."""
    index: str = "wazuh-alerts-*"
    query: dict[str, Any]


class SearchResponse(BaseModel):
    total: int
    hits: list[dict[str, Any]]
    took_ms: int


@router.post("", response_model=SearchResponse)
async def run_search(
    body: SearchRequest,
    current_user: CurrentUser,
) -> SearchResponse:
    """
    Execute an OpenSearch DSL query and return hits.
    Used by the Log Explorer page for raw log access.
    """
    try:
        result = await os_client.run_query(body.index, query=body.query)
    except Exception as exc:
        logger.error(f"Search failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenSearch query failed: {exc}",
        )

    hits_raw = result.get("hits", {})
    total_val = hits_raw.get("total", {})
    if isinstance(total_val, dict):
        total = total_val.get("value", 0)
    else:
        total = int(total_val)

    return SearchResponse(
        total=total,
        hits=hits_raw.get("hits", []),
        took_ms=result.get("took", 0),
    )
