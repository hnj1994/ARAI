"""
ARIA SOC Platform — OpenSearch Client
Async client using httpx. Provides query building and result normalisation.
"""

from __future__ import annotations

import logging
from base64 import b64decode
from typing import Any

import httpx

from config import settings

logger = logging.getLogger(__name__)

# Default Wazuh alerts index pattern
WAZUH_INDEX = "wazuh-alerts-*"


def _auth_headers() -> dict[str, str]:
    """Return Basic auth headers for OpenSearch."""
    return {
        "Authorization": f"Basic {settings.opensearch_auth}",
        "Content-Type": "application/json",
    }


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=settings.opensearch_base_url,
        headers=_auth_headers(),
        verify=False,  # Wazuh uses a self-signed cert by default
        timeout=30,
    )


# ─── Core query runner ────────────────────────────────────────────────────────

async def run_query(
    index: str = WAZUH_INDEX,
    *,
    query: dict[str, Any],
) -> dict[str, Any]:
    """
    Execute a search query against OpenSearch.
    Returns the raw OpenSearch response dict.
    """
    async with _client() as client:
        resp = await client.post(
            f"/{index}/_search",
            json=query,
        )
        resp.raise_for_status()
        return resp.json()


async def count_docs(
    index: str = WAZUH_INDEX,
    *,
    query: dict[str, Any] | None = None,
) -> int:
    """Return document count matching an optional query."""
    body = {"query": query} if query else {}
    async with _client() as client:
        resp = await client.post(f"/{index}/_count", json=body)
        resp.raise_for_status()
        return resp.json().get("count", 0)


# ─── Pre-built queries ────────────────────────────────────────────────────────

def query_recent_alerts(min_level: int = 7, time_window: str = "now-5m", size: int = 20) -> dict[str, Any]:
    """OpenSearch DSL query for live alerts in the last N minutes."""
    return {
        "query": {
            "bool": {
                "must": [
                    {"range": {"@timestamp": {"gte": time_window}}},
                    {"range": {"rule.level": {"gte": min_level}}},
                ]
            }
        },
        "sort": [{"@timestamp": "desc"}],
        "size": size,
    }


def query_alerts(
    *,
    min_level: int = 1,
    time_window: str = "now-24h",
    agent_name: str | None = None,
    severity: str | None = None,
    size: int = 50,
    from_: int = 0,
) -> dict[str, Any]:
    """Build a filtered alert search query."""
    must: list[dict[str, Any]] = [
        {"range": {"@timestamp": {"gte": time_window}}},
        {"range": {"rule.level": {"gte": min_level}}},
    ]

    if agent_name:
        must.append({"term": {"agent.name": agent_name}})

    if severity:
        level_map = {"critical": 13, "high": 10, "medium": 7, "low": 1}
        level_ceiling = {"critical": 15, "high": 12, "medium": 9, "low": 6}
        lower = level_map.get(severity, 1)
        upper = level_ceiling.get(severity, 15)
        must.append({"range": {"rule.level": {"gte": lower, "lte": upper}}})

    return {
        "query": {"bool": {"must": must}},
        "sort": [{"@timestamp": "desc"}],
        "size": size,
        "from": from_,
        "track_total_hits": True,
    }


def query_severity_histogram(time_window: str = "now-7d") -> dict[str, Any]:
    """Aggregation query: alert counts by severity level (for dashboard charts)."""
    return {
        "query": {"range": {"@timestamp": {"gte": time_window}}},
        "aggs": {
            "by_level": {
                "range": {
                    "field": "rule.level",
                    "ranges": [
                        {"key": "low",      "from": 1,  "to": 7},
                        {"key": "medium",   "from": 7,  "to": 10},
                        {"key": "high",     "from": 10, "to": 13},
                        {"key": "critical", "from": 13, "to": 16},
                    ],
                }
            }
        },
        "size": 0,
    }


def query_top_hosts(time_window: str = "now-24h", size: int = 10) -> dict[str, Any]:
    """Aggregation query: top N agents by alert count."""
    return {
        "query": {"range": {"@timestamp": {"gte": time_window}}},
        "aggs": {
            "top_agents": {
                "terms": {"field": "agent.name", "size": size}
            }
        },
        "size": 0,
    }


def query_mitre_heatmap(time_window: str = "now-30d") -> dict[str, Any]:
    """Aggregation query: alert counts by MITRE tactic and technique."""
    return {
        "query": {
            "bool": {
                "must": [
                    {"range": {"@timestamp": {"gte": time_window}}},
                    {"exists": {"field": "rule.mitre.tactic"}},
                ]
            }
        },
        "aggs": {
            "tactics": {
                "terms": {"field": "rule.mitre.tactic", "size": 20},
                "aggs": {
                    "techniques": {
                        "terms": {"field": "rule.mitre.id", "size": 20}
                    }
                },
            }
        },
        "size": 0,
    }


# ─── Alert fetching helpers ───────────────────────────────────────────────────

async def search_alerts(
    *,
    min_level: int = 1,
    time_window: str = "now-24h",
    agent_name: str | None = None,
    severity: str | None = None,
    size: int = 50,
    from_: int = 0,
) -> tuple[int, list[dict[str, Any]]]:
    """
    Search alerts in OpenSearch.
    Returns (total, list_of_raw_hits).
    """
    dsl = query_alerts(
        min_level=min_level,
        time_window=time_window,
        agent_name=agent_name,
        severity=severity,
        size=size,
        from_=from_,
    )
    result = await run_query(query=dsl)
    hits = result.get("hits", {})
    total_val = hits.get("total", {})
    if isinstance(total_val, dict):
        total = total_val.get("value", 0)
    else:
        total = int(total_val)

    return total, hits.get("hits", [])


async def get_alert_by_id(alert_id: str) -> dict[str, Any] | None:
    """Fetch a single alert document by its OpenSearch _id."""
    async with _client() as client:
        resp = await client.get(f"/{WAZUH_INDEX}/_doc/{alert_id}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        doc = resp.json()
        if not doc.get("found"):
            return None
        return {"_id": doc["_id"], "_source": doc["_source"]}


async def get_dashboard_stats() -> dict[str, Any]:
    """
    Return aggregated stats for the dashboard:
    - severity_breakdown
    - top_hosts
    - mitre_heatmap
    - total_24h
    """
    severity_result = await run_query(query=query_severity_histogram())
    top_hosts_result = await run_query(query=query_top_hosts())
    mitre_result = await run_query(query=query_mitre_heatmap())
    total_24h = await count_docs(query={"range": {"@timestamp": {"gte": "now-24h"}}})

    severity_buckets = (
        severity_result.get("aggregations", {})
        .get("by_level", {})
        .get("buckets", [])
    )
    severity_breakdown = {b["key"]: b["doc_count"] for b in severity_buckets}

    top_agents_buckets = (
        top_hosts_result.get("aggregations", {})
        .get("top_agents", {})
        .get("buckets", [])
    )
    top_hosts = [{"agent": b["key"], "count": b["doc_count"]} for b in top_agents_buckets]

    tactic_buckets = (
        mitre_result.get("aggregations", {})
        .get("tactics", {})
        .get("buckets", [])
    )
    mitre_heatmap = []
    for tactic in tactic_buckets:
        mitre_heatmap.append({
            "tactic": tactic["key"],
            "count": tactic["doc_count"],
            "techniques": [
                {"technique": t["key"], "count": t["doc_count"]}
                for t in tactic.get("techniques", {}).get("buckets", [])
            ],
        })

    return {
        "total_24h": total_24h,
        "severity_breakdown": severity_breakdown,
        "top_hosts": top_hosts,
        "mitre_heatmap": mitre_heatmap,
    }


# ─── Health check ─────────────────────────────────────────────────────────────

async def health_check() -> bool:
    """Return True if OpenSearch is reachable."""
    try:
        async with _client() as client:
            resp = await client.get("/_cluster/health")
            return resp.status_code == 200
    except Exception as exc:
        logger.warning(f"OpenSearch health check failed: {exc}")
        return False
