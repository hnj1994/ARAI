"""
ARIA SOC Platform — Alerts Router
GET  /api/alerts           — paginated alert list (from OpenSearch)
GET  /api/alerts/stats     — dashboard aggregation stats
GET  /api/alerts/{id}      — single alert detail
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from middleware.auth import CurrentUser
from models import Alert, AlertDetailResponse, AlertListResponse, normalise_wazuh_alert
from services import opensearch as os_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=AlertListResponse)
async def list_alerts(
    current_user: CurrentUser,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    min_level: Annotated[int, Query(ge=1, le=15)] = 1,
    time_window: Annotated[str, Query()] = "now-24h",
    agent: Annotated[str | None, Query()] = None,
    severity: Annotated[str | None, Query()] = None,
) -> AlertListResponse:
    """
    Return a paginated list of alerts from OpenSearch.
    Supports filtering by level, time window, agent, and severity.
    """
    from_ = (page - 1) * page_size
    try:
        total, hits = await os_client.search_alerts(
            min_level=min_level,
            time_window=time_window,
            agent_name=agent,
            severity=severity,
            size=page_size,
            from_=from_,
        )
    except Exception as exc:
        logger.error(f"Alert search failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenSearch query failed: {exc}",
        )

    alerts: list[Alert] = []
    for hit in hits:
        try:
            alerts.append(normalise_wazuh_alert(hit))
        except Exception as exc:
            logger.warning(f"Skipping malformed alert {hit.get('_id')}: {exc}")

    return AlertListResponse(
        total=total,
        alerts=alerts,
        page=page,
        page_size=page_size,
    )


@router.get("/stats")
async def alert_stats(
    current_user: CurrentUser,
    time_window: Annotated[str, Query()] = "now-24h",
) -> dict:
    """
    Return aggregated statistics for the dashboard:
    - total alert count (24h)
    - severity breakdown
    - top hosts
    - MITRE heatmap
    """
    try:
        return await os_client.get_dashboard_stats()
    except Exception as exc:
        logger.error(f"Stats query failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenSearch stats failed: {exc}",
        )


@router.get("/{alert_id}", response_model=AlertDetailResponse)
async def get_alert(
    alert_id: str,
    current_user: CurrentUser,
) -> AlertDetailResponse:
    """Return a single alert by its OpenSearch document ID."""
    try:
        hit = await os_client.get_alert_by_id(alert_id)
    except Exception as exc:
        logger.error(f"Alert fetch failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenSearch fetch failed: {exc}",
        )

    if hit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id!r} not found",
        )

    alert = normalise_wazuh_alert(hit)
    return AlertDetailResponse(alert=alert)
