"""
ARIA SOC Platform — Wazuh API Client
Async client using httpx. Handles authentication, token refresh, and data normalisation.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

import httpx

from config import settings
from models import Alert, Agent, normalise_wazuh_alert, normalise_wazuh_agent

logger = logging.getLogger(__name__)

# ─── Token cache ─────────────────────────────────────────────────────────────

_wazuh_token: str | None = None
_token_expires_at: datetime = datetime.utcnow()


async def _get_wazuh_token() -> str:
    """
    Return a valid Wazuh JWT.
    Re-authenticates when within 60 seconds of expiry.
    Token TTL is set to 28800 seconds (8 hours) in Wazuh API config.
    """
    global _wazuh_token, _token_expires_at

    if _wazuh_token and datetime.utcnow() < (_token_expires_at - timedelta(seconds=60)):
        return _wazuh_token

    logger.info("Authenticating with Wazuh API…")
    async with httpx.AsyncClient(verify=False, timeout=30) as client:
        resp = await client.post(
            f"{settings.wazuh_base_url}/security/user/authenticate",
            auth=(settings.wazuh_user, settings.wazuh_pass),
        )
        resp.raise_for_status()
        data = resp.json()
        _wazuh_token = data["data"]["token"]
        # Wazuh default TTL is 900s; we set 28800 in api.yml
        _token_expires_at = datetime.utcnow() + timedelta(seconds=28800)
        logger.info("Wazuh authentication successful")
        return _wazuh_token


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ─── Alert fetching ───────────────────────────────────────────────────────────

async def get_alerts(
    *,
    since: str | None = None,
    min_level: int | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """
    Fetch alerts from the Wazuh API.
    Returns raw dicts — caller is responsible for normalisation.
    """
    token = await _get_wazuh_token()
    params: dict[str, Any] = {
        "limit": limit,
        "offset": offset,
        "sort": "-timestamp",
    }
    if min_level is not None:
        params["level"] = f"{min_level}-15"
    if since:
        params["q"] = f"timestamp>{since}"

    async with httpx.AsyncClient(verify=False, timeout=30) as client:
        resp = await client.get(
            f"{settings.wazuh_base_url}/alerts",
            headers=_auth_headers(token),
            params=params,
        )
        resp.raise_for_status()
        body = resp.json()
        return body.get("data", {}).get("affected_items", [])


async def get_alert_count(min_level: int | None = None) -> int:
    """Return total alert count from Wazuh."""
    token = await _get_wazuh_token()
    params: dict[str, Any] = {"limit": 1}
    if min_level is not None:
        params["level"] = f"{min_level}-15"

    async with httpx.AsyncClient(verify=False, timeout=30) as client:
        resp = await client.get(
            f"{settings.wazuh_base_url}/alerts",
            headers=_auth_headers(token),
            params=params,
        )
        resp.raise_for_status()
        return resp.json().get("data", {}).get("total_affected_items", 0)


# ─── Agent fetching ───────────────────────────────────────────────────────────

async def get_agents(
    *,
    status: str = "active",
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """Fetch agents from the Wazuh API."""
    token = await _get_wazuh_token()
    params: dict[str, Any] = {
        "status": status,
        "limit": limit,
        "offset": offset,
    }
    async with httpx.AsyncClient(verify=False, timeout=30) as client:
        resp = await client.get(
            f"{settings.wazuh_base_url}/agents",
            headers=_auth_headers(token),
            params=params,
        )
        resp.raise_for_status()
        return resp.json().get("data", {}).get("affected_items", [])


async def get_agent(agent_id: str) -> dict[str, Any] | None:
    """Fetch a single agent by ID."""
    token = await _get_wazuh_token()
    async with httpx.AsyncClient(verify=False, timeout=30) as client:
        resp = await client.get(
            f"{settings.wazuh_base_url}/agents/{agent_id}",
            headers=_auth_headers(token),
        )
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        items = resp.json().get("data", {}).get("affected_items", [])
        return items[0] if items else None


# ─── Active response ──────────────────────────────────────────────────────────

async def run_active_response(
    *,
    agent_id: str,
    command: str,
    arguments: list[str] | None = None,
) -> dict[str, Any]:
    """
    Trigger an active-response action on a Wazuh agent.
    Supported commands: restart-wazuh, firewall-drop, disable-account, etc.
    """
    token = await _get_wazuh_token()
    payload: dict[str, Any] = {
        "command": command,
        "arguments": arguments or [],
        "agent_list": [agent_id],
    }
    async with httpx.AsyncClient(verify=False, timeout=30) as client:
        resp = await client.put(
            f"{settings.wazuh_base_url}/active-response",
            headers=_auth_headers(token),
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


# ─── Health check ─────────────────────────────────────────────────────────────

async def health_check() -> bool:
    """Return True if the Wazuh API is reachable."""
    try:
        await _get_wazuh_token()
        return True
    except Exception as exc:
        logger.warning(f"Wazuh health check failed: {exc}")
        return False
