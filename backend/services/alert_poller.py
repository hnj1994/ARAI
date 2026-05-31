"""
ARIA SOC Platform — Alert Poller (Background Task)
Polls Wazuh every N seconds, normalises alerts, publishes to Redis pub/sub.
The WebSocket manager subscribes to Redis and pushes to connected clients.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

import redis.asyncio as aioredis

from config import settings
from models import normalise_wazuh_alert
from services import wazuh as wazuh_client

logger = logging.getLogger(__name__)

REDIS_CHANNEL = "soc:alerts"


async def poll_and_publish() -> None:
    """
    Continuously poll Wazuh for new alerts and publish them to Redis.
    Tracks the last seen timestamp to avoid re-publishing duplicates.
    On error: logs and retries after poll_interval.
    """
    redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    last_timestamp: str | None = None
    consecutive_errors = 0
    max_consecutive_errors = 10

    logger.info(
        f"Alert poller started (interval={settings.poll_interval}s, "
        f"min_level={settings.min_alert_level})"
    )

    while True:
        try:
            raw_alerts = await wazuh_client.get_alerts(
                since=last_timestamp,
                min_level=settings.min_alert_level,
                limit=50,
            )

            published = 0
            for raw in raw_alerts:
                try:
                    alert = normalise_wazuh_alert(raw)
                    payload = alert.model_dump_json()
                    await redis.publish(REDIS_CHANNEL, payload)
                    published += 1
                    # Track latest timestamp
                    ts_str = alert.timestamp.isoformat()
                    if last_timestamp is None or ts_str > last_timestamp:
                        last_timestamp = ts_str
                except Exception as exc:
                    logger.warning(f"Skipping malformed alert: {exc}")

            if published:
                logger.info(f"Published {published} new alert(s) to Redis")

            consecutive_errors = 0

        except Exception as exc:
            consecutive_errors += 1
            logger.error(
                f"Poller error ({consecutive_errors}/{max_consecutive_errors}): {exc}"
            )
            if consecutive_errors >= max_consecutive_errors:
                logger.critical(
                    "Max consecutive poller errors reached. "
                    "Check Wazuh connectivity and credentials."
                )
                consecutive_errors = 0  # Reset and keep trying

        await asyncio.sleep(settings.poll_interval)
