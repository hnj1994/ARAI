"""
ARIA SOC Platform — Auth Router
POST /api/auth/login  — exchange Wazuh credentials for a JWT
GET  /api/auth/me     — return current user info from token
"""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from config import settings
from middleware.auth import CurrentUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ─── Request / Response models ────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    expires_in: int
    token_type: str = "Bearer"
    username: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    """
    Authenticate against the Wazuh API and return the JWT.
    The token is forwarded directly to the client — it is valid for 28800 seconds
    (8 hours) when configured in /var/ossec/api/configuration/api.yml.
    """
    try:
        async with httpx.AsyncClient(verify=False, timeout=15) as client:
            resp = await client.post(
                f"{settings.wazuh_base_url}/security/user/authenticate",
                auth=(body.username, body.password),
            )

        if resp.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Wazuh credentials",
            )
        if resp.status_code == 403:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied by Wazuh",
            )

        resp.raise_for_status()
        data = resp.json()
        token = data["data"]["token"]

    except HTTPException:
        raise
    except httpx.ConnectError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Cannot reach Wazuh API at {settings.wazuh_base_url}",
        )
    except Exception as exc:
        logger.error(f"Login failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Wazuh authentication error",
        )

    # Wazuh JWT TTL (default 900, configured to 28800)
    expires_in = 28800

    return LoginResponse(
        token=token,
        expires_in=expires_in,
        username=body.username,
    )


@router.get("/me")
async def me(current_user: CurrentUser) -> dict:
    """Return decoded JWT payload for the current user."""
    return {
        "sub": current_user.get("sub"),
        "iss": current_user.get("iss"),
        "exp": current_user.get("exp"),
        "rbac_roles": current_user.get("rbac_roles", []),
        "run_as": current_user.get("run_as", False),
    }
