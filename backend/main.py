"""
ARIA SOC Platform — FastAPI Application Entry Point
Wires together all routers, middleware, CORS, startup events, and WebSocket.
"""

from __future__ import annotations

import asyncio
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routers import auth, alerts, agents, search

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("aria")


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: launch background tasks (alert poller, WebSocket manager).
    Shutdown: cancel background tasks cleanly.
    """
    tasks: list[asyncio.Task] = []

    # Start alert poller (publishes to Redis)
    try:
        from services.alert_poller import poll_and_publish
        tasks.append(asyncio.create_task(poll_and_publish(), name="alert_poller"))
        logger.info("Alert poller started")
    except Exception as exc:
        logger.warning(f"Alert poller not started: {exc}")

    # Start WebSocket manager (subscribes Redis, pushes to WS clients)
    try:
        from services.websocket_manager import manager
        tasks.append(asyncio.create_task(manager.start_redis_listener(), name="ws_manager"))
        logger.info("WebSocket manager started")
    except Exception as exc:
        logger.warning(f"WebSocket manager not started: {exc}")

    logger.info(f"ARIA SOC Platform v{settings.app_version} ready")
    yield

    # Cleanup
    for task in tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    logger.info("ARIA shutdown complete")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ARIA SOC Platform",
    description="Automated Response Intelligence Analyst — AI-powered SOC dashboard",
    version=settings.app_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(alerts.router)
app.include_router(agents.router)
app.include_router(search.router)

# AI router (Phase 2)
try:
    from routers import ai as ai_router
    app.include_router(ai_router.router)
    logger.info("AI router registered")
except ImportError:
    logger.info("AI router not yet available (Phase 2)")


# ─── Health endpoint (unauthenticated) ────────────────────────────────────────

@app.get("/api/health", tags=["system"])
async def health() -> dict:
    """Health check — returns service status for all integrated services."""
    from services import wazuh as wazuh_client
    from services import opensearch as os_client

    wazuh_ok = await wazuh_client.health_check()
    opensearch_ok = await os_client.health_check()

    # Ollama health (optional)
    ollama_ok = False
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.ollama_base_url}/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        pass

    # Redis health (optional)
    redis_ok = False
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.redis_url)
        await r.ping()
        await r.aclose()
        redis_ok = True
    except Exception:
        pass

    overall = wazuh_ok and opensearch_ok

    return {
        "status": "ok" if overall else "degraded",
        "version": settings.app_version,
        "services": {
            "wazuh": "ok" if wazuh_ok else "unavailable",
            "opensearch": "ok" if opensearch_ok else "unavailable",
            "ollama": "ok" if ollama_ok else "unavailable",
            "redis": "ok" if redis_ok else "unavailable",
        },
    }


# ─── WebSocket endpoint ───────────────────────────────────────────────────────

@app.websocket("/ws/alerts")
async def ws_alerts(websocket: WebSocket):
    """
    WebSocket endpoint for live alert streaming.
    Clients must pass ?token=JWT as a query parameter.
    New alerts published to Redis are forwarded here within seconds.
    """
    # Validate token from query param
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    from middleware.auth import _decode_token
    try:
        _decode_token(token)
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Register with WebSocket manager
    try:
        from services.websocket_manager import manager
        await manager.connect(websocket)
        try:
            # Keep connection alive — the manager pushes data
            while True:
                await websocket.receive_text()  # handle ping/pong or client messages
        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(websocket)
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")
        try:
            await websocket.close(code=1011)
        except Exception:
            pass


# ─── Global exception handler ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )
