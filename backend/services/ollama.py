"""
ARIA SOC Platform — Ollama Client
Async streaming and non-streaming client for Ollama local inference.

Critical: ALWAYS use stream=True (Bug #1 fix).
Chunks arrive immediately instead of waiting 30s for full response.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

import httpx

from config import settings
from prompts.library import SYSTEM

logger = logging.getLogger(__name__)


def _ollama_url(path: str) -> str:
    return f"{settings.ollama_base_url}{path}"


# ─── Streaming client ─────────────────────────────────────────────────────────

async def stream_chat(
    *,
    prompt: str,
    system: str = SYSTEM,
    history: list[dict[str, str]] | None = None,
    temperature: float = 0.7,
    model: str | None = None,
) -> AsyncGenerator[str, None]:
    """
    Stream a chat response from Ollama, yielding text chunks as they arrive.
    Uses stream=True — chunks arrive immediately (Bug #1 fix).

    Yields: incremental text strings (not full JSON, not SSE wrappers)
    """
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model or settings.ollama_model,
        "messages": messages,
        "stream": True,  # CRITICAL — always True (Bug #1 fix)
        "options": {
            "temperature": temperature,
            "num_ctx": 4096,
        },
    }

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(settings.ollama_timeout, connect=10)
        ) as client:
            async with client.stream(
                "POST",
                _ollama_url("/api/chat"),
                json=payload,
            ) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
                        if chunk.get("done"):
                            break
                    except json.JSONDecodeError:
                        logger.debug(f"Non-JSON Ollama line: {line[:100]}")
                        continue

    except httpx.ConnectError:
        logger.error(f"Cannot connect to Ollama at {settings.ollama_base_url}")
        yield "\n[Error: Ollama is not reachable. Is it running on the host?]\n"
    except httpx.TimeoutException:
        logger.error("Ollama request timed out")
        yield "\n[Error: Ollama request timed out. The model may still be loading.]\n"
    except Exception as exc:
        logger.error(f"Ollama streaming error: {exc}")
        yield f"\n[Error: {exc}]\n"


# ─── Non-streaming client (structured JSON responses) ─────────────────────────

async def complete(
    *,
    prompt: str,
    system: str = SYSTEM,
    temperature: float = 0.1,
    model: str | None = None,
) -> str:
    """
    Get a complete response from Ollama (collects all stream chunks).
    Used for triage/hunt/report where we need the full JSON response.
    Still uses stream=True internally for proper delivery.
    """
    full_response = ""
    async for chunk in stream_chat(
        prompt=prompt,
        system=system,
        temperature=temperature,
        model=model,
    ):
        full_response += chunk
    return full_response.strip()


async def complete_json(
    *,
    prompt: str,
    system: str = SYSTEM,
    temperature: float = 0.1,
    model: str | None = None,
) -> dict[str, Any]:
    """
    Get a complete response and parse it as JSON.
    Strips markdown fences if the model adds them (defensive parsing).
    """
    raw = await complete(
        prompt=prompt,
        system=system,
        temperature=temperature,
        model=model,
    )

    # Strip markdown code fences if present
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first line (```json or ```) and last line (```)
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        cleaned = "\n".join(inner).strip()

    # Find first { and last } to extract JSON
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    if start != -1 and end > start:
        cleaned = cleaned[start:end]

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error(f"Ollama JSON parse failed: {exc}\nRaw response:\n{raw[:500]}")
        raise ValueError(f"Ollama returned invalid JSON: {exc}") from exc


# ─── Health check ─────────────────────────────────────────────────────────────

async def health_check() -> bool:
    """Return True if Ollama is reachable and the model is available."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(_ollama_url("/api/tags"))
            if resp.status_code != 200:
                return False
            models = resp.json().get("models", [])
            model_names = [m.get("name", "").split(":")[0] for m in models]
            return settings.ollama_model in model_names
    except Exception as exc:
        logger.debug(f"Ollama health check failed: {exc}")
        return False
