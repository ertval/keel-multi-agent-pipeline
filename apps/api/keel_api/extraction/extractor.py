"""LLM extraction layer — OpenAI-compatible API with strict json_schema output.

Extracts structured data from parsed PDF text. All arithmetic is
intentionally excluded here; the engine does math, the LLM does reading.

Reads three env vars:
  OPENAI_API_KEY   — required (nvapi-... for NVIDIA, sk-... for OpenAI)
  OPENAI_BASE_URL  — optional, defaults to OpenAI; set to NVIDIA endpoint
  OPENAI_MODEL     — optional, defaults to gpt-4o
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

from openai import OpenAI

log = logging.getLogger(__name__)

_MAX_RETRIES = 3
_RETRY_DELAY = 2.0  # seconds between retries

from keel_api.parsing.models import ParsedDocument
from keel_api.schemas import CharterpartyTerms, SOFEvent

_client: OpenAI | None = None

_DEFAULT_MODEL = "gpt-4o"


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        kwargs: dict[str, Any] = {
            "api_key": os.environ["OPENAI_API_KEY"],
            "timeout": 30.0,  # fail fast instead of hanging
        }
        base_url = os.environ.get("OPENAI_BASE_URL")
        if base_url:
            kwargs["base_url"] = base_url
        _client = OpenAI(**kwargs)
    return _client


def _model() -> str:
    return os.environ.get("OPENAI_MODEL", _DEFAULT_MODEL)


def _page_text(doc: ParsedDocument, max_chars: int = 12_000) -> str:
    text = "\n\n---PAGE BREAK---\n\n".join(doc.pages)
    return text[:max_chars]


def _llm_call(**kwargs: Any) -> Any:
    """Call the LLM with automatic retry on timeout or transient error."""
    last_exc: Exception | None = None
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            return _get_client().chat.completions.create(**kwargs)
        except Exception as exc:
            last_exc = exc
            log.warning("LLM attempt %d/%d failed: %s", attempt, _MAX_RETRIES, exc)
            if attempt < _MAX_RETRIES:
                time.sleep(_RETRY_DELAY)
    raise RuntimeError(f"LLM call failed after {_MAX_RETRIES} attempts") from last_exc


# ---------------------------------------------------------------------------
# Charterparty extraction
# ---------------------------------------------------------------------------

_CHARTERPARTY_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "vessel": {"type": "string"},
        "charterer": {"type": "string"},
        "owner": {"type": "string"},
        "load_port": {"type": "string"},
        "load_port_lat": {"type": "number"},
        "load_port_lon": {"type": "number"},
        "laytime_allowance_hours": {"type": "number"},
        "demurrage_rate_per_day_usd": {"type": "number"},
        "despatch_rate_per_day_usd": {"type": "number"},
        "nor_turn_time_hours": {"type": "number"},
        "laytime_exception": {"type": "string", "enum": ["SHEX", "FHEX", "SHINC"]},
        "weather_clause": {"type": "string", "enum": ["WWD", "WWDSHEX", "none"]},
        "rule_authority": {"type": "string", "enum": ["BIMCO_2013", "VOYLAYRULES_93", "custom"]},
        "clauses": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "page": {"type": "integer"},
                    "bbox": {
                        "type": "array",
                        "items": {"type": "number"},
                        "minItems": 4,
                        "maxItems": 4,
                    },
                    "text": {"type": "string"},
                },
                "required": ["page", "bbox", "text"],
                "additionalProperties": False,
            },
        },
    },
    "required": [
        "vessel", "charterer", "owner", "load_port",
        "load_port_lat", "load_port_lon",
        "laytime_allowance_hours", "demurrage_rate_per_day_usd",
        "despatch_rate_per_day_usd", "nor_turn_time_hours",
        "laytime_exception", "weather_clause", "rule_authority", "clauses",
    ],
    "additionalProperties": False,
}

_CHARTERPARTY_SYSTEM = """\
You are a maritime contract parser. Extract the charterparty terms from the \
document text below. Return ONLY valid JSON matching the schema. \
For bbox values where not available use [0.0, 0.0, 0.0, 0.0]. \
Do not invent numbers — extract only what is explicitly stated."""


def extract_charterparty_terms(doc: ParsedDocument) -> CharterpartyTerms:
    text = _page_text(doc)
    response = _llm_call(
        model=_model(),
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "CharterpartyTerms",
                "strict": True,
                "schema": _CHARTERPARTY_SCHEMA,
            },
        },
        messages=[
            {"role": "system", "content": _CHARTERPARTY_SYSTEM},
            {"role": "user", "content": text},
        ],
        temperature=0,
    )
    raw = json.loads(response.choices[0].message.content)
    return CharterpartyTerms.model_validate(raw)


# ---------------------------------------------------------------------------
# SOF extraction
# ---------------------------------------------------------------------------

_SOF_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "events": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "timestamp": {"type": "string", "description": "ISO 8601 datetime"},
                    "event_type": {
                        "type": "string",
                        "enum": [
                            "NOR_TENDERED", "NOR_ACCEPTED", "LOADING_START",
                            "LOADING_END", "WEATHER_DELAY_START", "WEATHER_DELAY_END",
                            "SHIFTING", "COMPLETED",
                        ],
                    },
                    "description": {"type": "string"},
                    "source": {
                        "type": "object",
                        "properties": {
                            "page": {"type": "integer"},
                            "bbox": {
                                "type": "array",
                                "items": {"type": "number"},
                                "minItems": 4,
                                "maxItems": 4,
                            },
                            "row_text": {"type": "string"},
                        },
                        "required": ["page", "bbox", "row_text"],
                        "additionalProperties": False,
                    },
                },
                "required": ["timestamp", "event_type", "description", "source"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["events"],
    "additionalProperties": False,
}

_SOF_SYSTEM = """\
You are a maritime Statement of Facts (SOF) parser. Extract every timestamped \
event from the document. Map each row to the closest event_type from the \
allowed enum. For bbox values where not available use [0.0, 0.0, 0.0, 0.0]. \
Timestamps must be ISO 8601 format (e.g. 2026-06-14T10:00:00). \
Return ONLY valid JSON matching the schema."""


def extract_sof_events(doc: ParsedDocument) -> list[SOFEvent]:
    text = _page_text(doc)
    response = _llm_call(
        model=_model(),
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "SOFEvents",
                "strict": True,
                "schema": _SOF_SCHEMA,
            },
        },
        messages=[
            {"role": "system", "content": _SOF_SYSTEM},
            {"role": "user", "content": text},
        ],
        temperature=0,
    )
    raw = json.loads(response.choices[0].message.content)
    return [SOFEvent.model_validate(e) for e in raw["events"]]


# ─── Claim amount extraction ──────────────────────────────────────────────────

_CLAIM_AMOUNT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "total_usd": {
            "type": "number",
            "description": "The total claimed amount in USD (numeric value only, e.g. 187000.00)",
        },
    },
    "required": ["total_usd"],
    "additionalProperties": False,
}

_CLAIM_AMOUNT_SYSTEM = """You are given structured rows pre-extracted from a claim document.
Each row is a list of cells. One row is labeled as the total.

Your job is INTERPRETATION ONLY:
- Identify which row represents the final "Total" claim amount.
- Return the dollar amount from that row.
- Do NOT compute, sum, or derive anything. The number is already in the data.
- Return only what is literally written in the matching cell."""


def _extract_total_rows(doc: ParsedDocument) -> list[list[str]]:
    """Return table rows that contain a 'total'-like label (pre-filtered by pdfplumber)."""
    rows_by_key: dict[tuple[int, int], list[tuple[int, str]]] = {}
    for cell in doc.table_cells:
        rows_by_key.setdefault((cell.page, cell.row), []).append((cell.col, cell.text))

    total_rows: list[list[str]] = []
    for cells in rows_by_key.values():
        row = [text for _, text in sorted(cells)]
        if any("total" in c.lower() for c in row):
            total_rows.append(row)
    return total_rows


def _grep_total_lines(doc: ParsedDocument) -> list[str]:
    """Fallback: grep raw text lines containing 'total' (for prose-only docs)."""
    lines: list[str] = []
    for page in doc.pages:
        for line in page.split("\n"):
            if "total" in line.lower():
                lines.append(line.strip())
    return lines


def extract_claim_amount(doc: ParsedDocument) -> float:
    """Extract the stated total claim amount.

    Strategy: use pdfplumber's structured table extraction to pull only rows
    that contain a 'total' label, then pass that minimal structured data to
    the LLM. The LLM never sees the prose calculation breakdown — it only
    interprets which cell holds the final amount.
    """
    total_rows = _extract_total_rows(doc)

    if total_rows:
        # Pass structured rows as JSON — no prose, no hours/rates context
        structured = json.dumps({"total_rows": total_rows}, indent=2)
        user_content = (
            f"The following rows were extracted from a claim document table.\n"
            f"Identify which row is the final total and return its dollar amount.\n\n"
            f"{structured}"
        )
    else:
        # Fallback: grep lines mentioning 'total'
        lines = _grep_total_lines(doc)
        if not lines:
            lines = [doc.pages[0][:2000]] if doc.pages else [""]
        user_content = (
            "The following lines mention 'total'. Return the final claim amount in USD.\n\n"
            + "\n".join(lines)
        )

    response = _llm_call(
        model=_model(),
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "ClaimAmount",
                "strict": True,
                "schema": _CLAIM_AMOUNT_SCHEMA,
            },
        },
        messages=[
            {"role": "system", "content": _CLAIM_AMOUNT_SYSTEM},
            {"role": "user", "content": user_content},
        ],
        temperature=0,
    )
    raw = json.loads(response.choices[0].message.content)
    amount = float(raw["total_usd"])
    log.info(f"Extracted claim amount: ${amount:,.2f} (from {len(total_rows)} table rows)")
    return amount
