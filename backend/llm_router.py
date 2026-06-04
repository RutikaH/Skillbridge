"""
LLM Provider Router for SkillBridge.

Design goals
------------
* The application MUST start successfully even if `OPENAI_API_KEY` is absent.
* The application MUST start successfully even if `GROQ_API_KEY` is absent.
* The application MUST start successfully even if NEITHER key is set
  (it will then return a clear runtime error the first time a model is
  requested, instead of crashing the import chain).
* When `OPENAI_API_KEY` is set, OpenAI (GPT-4o) is the primary provider and
  Groq (Llama 3.1 8B Instant) is the runtime fallback.
* When `OPENAI_API_KEY` is NOT set and `GROQ_API_KEY` IS set, Groq becomes
  the primary (and only) provider — i.e. the application can run in
  Groq-only mode with no OpenAI dependency.
* OpenAI / Groq clients are constructed lazily and defensively. A client is
  only created if its API key is present, and any construction error is
  caught and logged so import never fails.

Environment variables consumed
------------------------------
* `OPENAI_API_KEY` (optional) — enables OpenAI as primary.
* `GROQ_API_KEY`  (optional) — enables Groq. Becomes primary when
  `OPENAI_API_KEY` is missing.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

# OpenAI / Groq are imported lazily so a missing package (or an
# environment without one of the SDKs) cannot crash the whole backend.
try:  # pragma: no cover - trivial import
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

try:  # pragma: no cover - trivial import
    from groq import Groq  # type: ignore
except Exception:  # pragma: no cover
    Groq = None  # type: ignore

load_dotenv()

OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY") or None
GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY") or None

# Models used for each provider.
OPENAI_PRIMARY_MODEL = "gpt-4o"
GROQ_MODEL = "llama-3.1-8b-instant"


def _safe_build_openai_client(api_key: Optional[str]):
    """Construct an OpenAI client, or return None if the key/SDK is missing."""
    if not api_key or OpenAI is None:
        return None
    try:
        return OpenAI(api_key=api_key)
    except Exception as exc:  # pragma: no cover - defensive
        print(
            f"[llm_router] WARNING: Failed to initialise OpenAI client: {exc}",
            flush=True,
        )
        return None


def _safe_build_groq_client(api_key: Optional[str]):
    """Construct a Groq client, or return None if the key/SDK is missing."""
    if not api_key or Groq is None:
        return None
    try:
        return Groq(api_key=api_key)
    except Exception as exc:  # pragma: no cover - defensive
        print(
            f"[llm_router] WARNING: Failed to initialise Groq client: {exc}",
            flush=True,
        )
        return None


# Lazy / conditional initialisation. The application starts in every
# combination of environment variables — clients are only constructed when
# their corresponding API key is present.
openai_client = _safe_build_openai_client(OPENAI_API_KEY)
groq_client = _safe_build_groq_client(GROQ_API_KEY)


def _log_startup_banner() -> None:
    """Print a single, easy-to-read banner describing active LLM providers."""
    openai_status = "ENABLED" if openai_client is not None else "disabled"
    groq_status = "ENABLED" if groq_client is not None else "disabled"

    if openai_client is not None and groq_client is not None:
        mode = "OpenAI (primary) + Groq (fallback)"
    elif openai_client is not None and groq_client is None:
        mode = "OpenAI only (no fallback configured)"
    elif openai_client is None and groq_client is not None:
        mode = "Groq only (no OpenAI dependency)"
    else:
        mode = "NO PROVIDER CONFIGURED — model calls will fail at runtime"

    print("=" * 64, flush=True)
    print("[llm_router] LLM provider status", flush=True)
    print(f"[llm_router]   OPENAI_API_KEY: {openai_status}", flush=True)
    print(f"[llm_router]   GROQ_API_KEY : {groq_status}", flush=True)
    print(f"[llm_router]   Mode         : {mode}", flush=True)
    print("=" * 64, flush=True)


_log_startup_banner()


def get_active_provider() -> str:
    """Return a short, human-readable description of the active LLM provider.

    Used by the `/health` endpoint and startup logs so operators can verify
    which provider is in use without reading the code.
    """
    if openai_client is not None and groq_client is not None:
        return "OpenAI (primary) with Groq fallback"
    if openai_client is not None:
        return "OpenAI only"
    if groq_client is not None:
        return "Groq only"
    return "none"


def get_provider_info() -> Dict[str, Any]:
    """Return a structured view of the LLM configuration (safe to expose)."""
    return {
        "openai_configured": openai_client is not None,
        "groq_configured": groq_client is not None,
        "active_provider": get_active_provider(),
    }


class ModelRouter:
    """Routes chat completion requests to the appropriate LLM provider.

    Provider selection rules
    ------------------------
    1. If `OPENAI_API_KEY` is present -> use OpenAI as the primary provider.
       If a call to OpenAI raises at runtime, automatically fall back to
       Groq (when configured). This preserves the original behaviour for
       deployments that supply both keys.
    2. If `OPENAI_API_KEY` is missing and `GROQ_API_KEY` is present ->
       use Groq as the primary (and only) provider. This is the
       Groq-only deployment mode.
    3. If neither key is set -> raise a clear `RuntimeError` on first use.
    """

    @staticmethod
    def generate(messages: List[Dict[str, str]]) -> Dict[str, Any]:
        # ----------------------------------------------------------------
        # Groq-only mode: OPENAI_API_KEY is absent.
        # Use Groq as the primary (and only) provider.
        # ----------------------------------------------------------------
        if openai_client is None:
            if groq_client is None:
                raise RuntimeError(
                    "No LLM provider available. Set OPENAI_API_KEY or "
                    "GROQ_API_KEY in the environment."
                )
            response = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
            )
            return {
                "content": response.choices[0].message.content,
                "provider": "Groq (Primary)",
            }

        # ----------------------------------------------------------------
        # Primary: OpenAI GPT-4o
        # ----------------------------------------------------------------
        try:
            response = openai_client.chat.completions.create(
                model=OPENAI_PRIMARY_MODEL,
                messages=messages,
                temperature=0.7,
            )
            return {
                "content": response.choices[0].message.content,
                "provider": "GPT-4o",
            }

        # ----------------------------------------------------------------
        # Fallback: Groq (only reached if OpenAI call fails at runtime)
        # ----------------------------------------------------------------
        except Exception as exc:
            print(f"[llm_router] GPT-4o failed: {exc}", flush=True)

            if groq_client is None:
                raise RuntimeError(
                    "OpenAI request failed and no Groq fallback is "
                    f"configured: {exc}"
                )

            print("[llm_router] Switching to Groq fallback", flush=True)
            response = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
            )
            return {
                "content": response.choices[0].message.content,
                "provider": "Groq Fallback Active",
            }
