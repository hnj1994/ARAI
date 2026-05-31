"""
ARIA SOC Platform — WebSocket Manager
Subscribes to the Redis pub/sub channel and pushes new alerts to all
connected WebSocket clients. Handles connect/disconnect gracefully.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Set

import redis.asyncio as aioredis
from fastapi import WebSocket

from config import settings

logger = logging.getLogger(__name__)

REDIS_CHANNEL = "soc:alerts"


class WebSocketManager:
    """
    Manages all active WebSocket connections.
    Redis subscriber runs as a background task (started in lifespan).
    When a message arrives on soc:alerts, it is broadcast to all clients.
    """

    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection and register it."""
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        logger.info(
            f"WebSocket connected. Total connections: {len(self._connections)}"
        )

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket from the registry."""
        self._connections.discard(websocket)
        logger.info(
            f"WebSocket disconnected. Total connections: {len(self._connections)}"
        )

    async def broadcast(self, message: str) -> None:
        """
        Send a message to all connected WebSocket clients.
        Removes clients that have disconnected.
        """
        if not self._connections:
            return

        dead: list[WebSocket] = []
        async with self._lock:
            connections_snapshot = list(self._connections)

        for ws in connections_snapshot:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)

        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections.discard(ws)
            logger.info(f"Removed {len(dead)} dead WebSocket connection(s)")

    async def start_redis_listener(self) -> None:
        """
        Subscribe to Redis soc:alerts channel.
        Runs indefinitely as a background task.
        Reconnects automatically on failure.
        """
        backoff = 1
        while True:
            try:
                redis = aioredis.from_url(settings.redis_url, decode_responses=True)
                pubsub = redis.pubsub()
                await pubsub.subscribe(REDIS_CHANNEL)
                logger.info(f"Redis listener subscribed to '{REDIS_CHANNEL}'")
                backoff = 1  # Reset on successful connection

                async for message in pubsub.listen():
                    if message["type"] == "message":
                        await self.broadcast(message["data"])

            except asyncio.CancelledError:
                logger.info("Redis listener cancelled")
                return
            except Exception as exc:
                logger.error(f"Redis listener error: {exc}. Reconnecting in {backoff}s…")
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)  # Exponential backoff, max 30s


# Singleton instance shared across the application
manager = WebSocketManager()
