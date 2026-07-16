"""A-04 extraction tests.

Unit tests use a mocked OpenAI client so they run without a key.
The integration test (marked 'integration') calls the real API and
requires OPENAI_API_KEY in the environment.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from keel_api.extraction.extractor import extract_charterparty_terms, extract_sof_events
from keel_api.parsing import parse
from keel_api.schemas import CharterpartyTerms, SOFEvent


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_openai_response(payload: dict) -> MagicMock:
    msg = MagicMock()
    msg.content = json.dumps(payload)
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    return resp


_CHARTERPARTY_PAYLOAD = {
    "vessel": "MV Hellenic Pioneer",
    "charterer": "Mediterranean Grains Ltd.",
    "owner": "Aegean Shipping Co.",
    "load_port": "Piraeus",
    "load_port_lat": 37.942,
    "load_port_lon": 23.647,
    "laytime_allowance_hours": 72.0,
    "demurrage_rate_per_day_usd": 50000.0,
    "despatch_rate_per_day_usd": 25000.0,
    "nor_turn_time_hours": 6.0,
    "laytime_exception": "SHEX",
    "weather_clause": "WWD",
    "rule_authority": "BIMCO_2013",
    "clauses": [
        {"page": 1, "bbox": [0.0, 0.0, 0.0, 0.0], "text": "Clause 3.1: WWD weather exception"},
    ],
}

_SOF_PAYLOAD = {
    "events": [
        {
            "timestamp": "2026-06-10T08:00:00",
            "event_type": "NOR_TENDERED",
            "description": "NOR tendered at anchorage",
            "source": {"page": 1, "bbox": [0.0, 0.0, 0.0, 0.0], "row_text": "08:00 NOR tendered"},
        },
        {
            "timestamp": "2026-06-10T14:00:00",
            "event_type": "NOR_ACCEPTED",
            "description": "NOR accepted, laytime commences",
            "source": {"page": 1, "bbox": [0.0, 0.0, 0.0, 0.0], "row_text": "14:00 NOR accepted"},
        },
        {
            "timestamp": "2026-06-14T10:00:00",
            "event_type": "WEATHER_DELAY_START",
            "description": "Weather delay commences",
            "source": {"page": 1, "bbox": [0.0, 0.0, 0.0, 0.0], "row_text": "10:00 weather delay"},
        },
    ]
}


# ---------------------------------------------------------------------------
# Unit tests (mocked)
# ---------------------------------------------------------------------------

def test_extract_charterparty_terms_returns_correct_type() -> None:
    doc = parse(FIXTURE_DIR / "charterparty.pdf")
    mock_resp = _make_openai_response(_CHARTERPARTY_PAYLOAD)

    with patch("keel_api.extraction.extractor._get_client") as mock_client:
        mock_client.return_value.chat.completions.create.return_value = mock_resp
        terms = extract_charterparty_terms(doc)

    assert isinstance(terms, CharterpartyTerms)
    assert terms.demurrage_rate_per_day_usd == 50_000.0
    assert terms.weather_clause == "WWD"
    assert terms.rule_authority == "BIMCO_2013"
    assert terms.laytime_exception == "SHEX"
    assert len(terms.clauses) >= 1


def test_extract_sof_events_returns_list_of_sof_events() -> None:
    doc = parse(FIXTURE_DIR / "sof_owner.pdf")
    mock_resp = _make_openai_response(_SOF_PAYLOAD)

    with patch("keel_api.extraction.extractor._get_client") as mock_client:
        mock_client.return_value.chat.completions.create.return_value = mock_resp
        events = extract_sof_events(doc)

    assert isinstance(events, list)
    assert len(events) == 3
    assert all(isinstance(e, SOFEvent) for e in events)
    types = [e.event_type for e in events]
    assert "NOR_TENDERED" in types
    assert "WEATHER_DELAY_START" in types


def test_extract_sof_events_timestamps_are_datetimes() -> None:
    doc = parse(FIXTURE_DIR / "sof_owner.pdf")
    mock_resp = _make_openai_response(_SOF_PAYLOAD)

    with patch("keel_api.extraction.extractor._get_client") as mock_client:
        mock_client.return_value.chat.completions.create.return_value = mock_resp
        events = extract_sof_events(doc)

    for event in events:
        assert isinstance(event.timestamp, datetime)


# ---------------------------------------------------------------------------
# Integration test (real API, skipped without key)
# ---------------------------------------------------------------------------

@pytest.mark.skipif(
    not os.environ.get("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set",
)
def test_extract_charterparty_live() -> None:
    doc = parse(FIXTURE_DIR / "charterparty.pdf")
    terms = extract_charterparty_terms(doc)
    assert terms.demurrage_rate_per_day_usd == 50_000.0
    assert terms.weather_clause == "WWD"
    assert terms.rule_authority == "BIMCO_2013"
