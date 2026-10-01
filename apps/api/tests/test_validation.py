"""Unit tests for the validator node, its error routing, and the feedback channel.

Every test here calls a function directly with hand-built state: no graph
invocation, no network, no LLM, no sleeps.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest

from keel_api import pipeline_agents
from keel_api.extraction import extractor
from keel_api.extraction.extractor import (
    extract_charterparty_terms,
    extract_claim_amount,
    extract_sof_events,
)
from keel_api.parsing.models import ParsedDocument
from keel_api.pipeline_agents import (
    _errors_for,
    check_validation_routing,
    cp_worker_node,
    sof_worker_node,
    validator_node,
)
from keel_api.schemas import CharterpartyTerms


REPO_ROOT = Path(__file__).resolve().parents[3]
CP_FIXTURE_JSON = REPO_ROOT / "fixtures" / "voyage_001" / "extracted_charterparty.json"

CP_TERMS_JSON: dict[str, Any] = json.loads(CP_FIXTURE_JSON.read_text())

VALID_TERMS: dict[str, Any] = {
    "vessel": "MV Hellenic Pioneer",
    "charterer": "Mediterranean Grains Ltd.",
    "owner": "Aegean Shipping Co.",
    "load_port": "Piraeus, Greece",
    "load_port_lat": 37.942,
    "load_port_lon": 23.647,
    "laytime_allowance_hours": 72.0,
    "demurrage_rate_per_day_usd": 50000.0,
    "despatch_rate_per_day_usd": 25000.0,
    "nor_turn_time_hours": 6.0,
    "laytime_exception": "SHEX",
    "weather_clause": "WWD",
    "rule_authority": "BIMCO_2013",
    "clauses": [],
}

DOC_TAGS = ("charterparty", "sof_owner", "sof_charterer", "claim_owner", "claim_charterer")


def _terms(**overrides: Any) -> dict[str, Any]:
    return {**VALID_TERMS, **overrides}


def _terms_without(*keys: str) -> dict[str, Any]:
    terms = dict(VALID_TERMS)
    for key in keys:
        terms.pop(key, None)
    return terms


def _validate(terms: dict[str, Any], retry_count: int = 0) -> dict[str, Any]:
    return validator_node({"extracted_terms": terms, "retry_count": retry_count})


def _issue(message: str, document: str, field: str) -> dict[str, str]:
    return {"message": message, "document": document, "field": field}


def _doc(path: str = "doc.pdf") -> ParsedDocument:
    return ParsedDocument(path=path, pages=["NOR TENDERED 2026-06-13T06:00:00"])


def _fake_dir(tmp_path: Path, *names: str) -> Path:
    for name in names:
        (tmp_path / name).write_bytes(b"%PDF-1.4\n")
    return tmp_path


# ─── validator_node ───────────────────────────────────────────────────────────


def test_validator_flags_missing_vessel() -> None:
    issues = _validate(_terms(vessel=""))["validation_errors"]

    assert len(issues) == 1
    assert "vessel" in issues[0]["message"].lower()
    assert issues[0]["field"] == "vessel"
    assert issues[0]["document"] == "charterparty"


@pytest.mark.parametrize("vessel", ["", None], ids=["empty-string", "null"])
def test_validator_flags_vessel_falsy_values(vessel: Any) -> None:
    assert len(_validate(_terms(vessel=vessel))["validation_errors"]) == 1


def test_validator_flags_vessel_key_absent() -> None:
    assert len(_validate(_terms_without("vessel"))["validation_errors"]) == 1


def test_validator_flags_kept_valid_vessel() -> None:
    assert _validate(_terms(vessel="MV Hellenic Pioneer"))["validation_errors"] == []


@pytest.mark.parametrize("key", ["load_port_lat", "load_port_lon"], ids=["lat-absent", "lon-absent"])
def test_validator_flags_absent_coordinate_key(key: str) -> None:
    """A coordinate key that is absent must be reported, not defaulted into range."""
    issues = _validate(_terms_without(key))["validation_errors"]

    assert len(issues) == 1
    assert "coordinate" in issues[0]["message"].lower()
    assert issues[0]["document"] == "charterparty"


@pytest.mark.parametrize("key", ["load_port_lat", "load_port_lon"], ids=["lat-null", "lon-null"])
def test_validator_flags_null_coordinate_value(key: str) -> None:
    assert len(_validate(_terms(**{key: None}))["validation_errors"]) == 1


def test_validator_flags_both_coordinates_absent_once() -> None:
    assert len(_validate(_terms_without("load_port_lat", "load_port_lon"))["validation_errors"]) == 1


def test_validator_accepts_explicit_null_island_coordinates() -> None:
    """0.0/0.0 is a real position, not a stand-in for a missing one."""
    assert _validate(_terms(load_port_lat=0.0, load_port_lon=0.0))["validation_errors"] == []


def test_validator_accepts_coordinates_at_range_bounds() -> None:
    for lat, lon in ((90.0, 180.0), (-90.0, -180.0), (0.0, -180.0), (90.0, 0.0)):
        result = _validate(_terms(load_port_lat=lat, load_port_lon=lon))
        assert result["validation_errors"] == [], (lat, lon)


@pytest.mark.parametrize("lat", [91.0, -91.0, 1e6], ids=["north-of-pole", "south-of-pole", "absurd"])
def test_validator_flags_out_of_range_latitude(lat: float) -> None:
    issues = _validate(_terms(load_port_lat=lat))["validation_errors"]

    assert len(issues) == 1
    assert "out of bounds" in issues[0]["message"].lower()


@pytest.mark.parametrize("lon", [180.5, -180.5, 1e6], ids=["east-of-antimeridian", "west-of-antimeridian", "absurd"])
def test_validator_flags_out_of_range_longitude(lon: float) -> None:
    issues = _validate(_terms(load_port_lon=lon))["validation_errors"]

    assert len(issues) == 1
    assert "out of bounds" in issues[0]["message"].lower()


def test_validator_flags_vessel_and_coordinates_independently() -> None:
    issues = _validate(_terms_without("vessel", "load_port_lat"))["validation_errors"]

    assert {issue["field"] for issue in issues} == {"vessel", "load_port_lat"}


def test_validator_accepts_real_fixture_terms() -> None:
    terms = CharterpartyTerms.model_validate(CP_TERMS_JSON).model_dump(mode="json")

    result = validator_node({"extracted_terms": terms, "retry_count": 0})

    assert result["validation_errors"] == []
    assert "retry_count" not in result


def test_validator_does_not_touch_retry_count_when_clean() -> None:
    result = validator_node({"extracted_terms": dict(VALID_TERMS), "retry_count": 2})

    assert result == {"validation_errors": []}


def test_validator_increments_retry_count_by_exactly_one() -> None:
    result = _validate(_terms(vessel=""), retry_count=0)

    assert result["retry_count"] == 1


def test_validator_keeps_incrementing_across_retries() -> None:
    result = _validate(_terms(load_port_lat=91.0), retry_count=2)

    assert result["retry_count"] == 3


def test_validator_issues_are_tagged_and_json_serialisable() -> None:
    result = _validate(_terms_without("vessel", "load_port_lat"))

    for issue in result["validation_errors"]:
        assert set(issue) == {"message", "document", "field"}
        assert all(isinstance(value, str) for value in issue.values())

    assert json.loads(json.dumps(result["validation_errors"])) == result["validation_errors"]


# ─── error routing ────────────────────────────────────────────────────────────


def test_errors_for_returns_only_the_addressed_document() -> None:
    issues = [
        _issue("vessel missing", "charterparty", "vessel"),
        _issue("owner NOR missing", "sof_owner", "timestamp"),
    ]

    assert _errors_for(issues, "charterparty") == ["vessel missing"]
    assert _errors_for(issues, "sof_owner") == ["owner NOR missing"]
    assert _errors_for(issues, "sof_charterer") == []


def test_errors_for_preserves_order_and_emits_plain_strings() -> None:
    issues = [
        _issue("second", "charterparty", "b"),
        _issue("first", "charterparty", "a"),
    ]

    routed = _errors_for(issues, "charterparty")

    assert routed == ["second", "first"]
    assert isinstance(routed, list)
    assert all(isinstance(message, str) for message in routed)
    assert all(not isinstance(message, dict) for message in routed)


def test_errors_for_returns_empty_list_for_unknown_document() -> None:
    issues = [_issue("vessel missing", "charterparty", "vessel")]

    for tag in ("claim_owner", "claim_charterer", "some_future_document"):
        assert _errors_for(issues, tag) == []


def test_validator_never_emits_an_issue_a_claim_extractor_could_act_on() -> None:
    broken = [
        _terms_without("vessel"),
        _terms(vessel=""),
        _terms_without("load_port_lat"),
        _terms(load_port_lat=91.0),
        _terms(load_port_lon=-180.5),
        _terms_without("vessel", "load_port_lon"),
    ]

    for terms in broken:
        issues = _validate(terms)["validation_errors"]
        assert issues
        for tag in ("claim_owner", "claim_charterer"):
            assert _errors_for(issues, tag) == []


def _feedback_kwarg(mock: Any) -> Any:
    assert mock.call_count == 1, mock.call_args_list
    return mock.call_args.kwargs.get("validation_errors")


def test_cp_worker_forwards_charterparty_feedback_to_the_charterparty_extractor(tmp_path: Path) -> None:
    fixture_dir = _fake_dir(tmp_path, "charterparty.pdf")
    state = {
        "fixture_dir": str(fixture_dir),
        "validation_errors": [_issue("vessel missing", "charterparty", "vessel")],
    }

    with (
        patch.object(pipeline_agents, "parse", return_value=_doc("charterparty.pdf")),
        patch.object(pipeline_agents, "extract_charterparty_terms") as extract,
    ):
        extract.return_value = CharterpartyTerms.model_validate(CP_TERMS_JSON)
        result = cp_worker_node(state)  # type: ignore[arg-type]

    routed = _feedback_kwarg(extract)
    assert routed == ["vessel missing"]
    assert all(isinstance(message, str) for message in routed)
    assert result["extracted_terms"]["vessel"] == CP_TERMS_JSON["vessel"]


def test_cp_worker_sends_no_sof_feedback_to_the_charterparty_extractor(tmp_path: Path) -> None:
    fixture_dir = _fake_dir(tmp_path, "charterparty.pdf")
    state = {
        "fixture_dir": str(fixture_dir),
        "validation_errors": [_issue("owner NOR missing", "sof_owner", "timestamp")],
    }

    with (
        patch.object(pipeline_agents, "parse", return_value=_doc("charterparty.pdf")),
        patch.object(pipeline_agents, "extract_charterparty_terms") as extract,
    ):
        extract.return_value = CharterpartyTerms.model_validate(CP_TERMS_JSON)
        cp_worker_node(state)  # type: ignore[arg-type]

    assert not _feedback_kwarg(extract)


def test_cp_worker_sends_no_feedback_when_validator_was_clean(tmp_path: Path) -> None:
    fixture_dir = _fake_dir(tmp_path, "charterparty.pdf")
    state = {"fixture_dir": str(fixture_dir), "validation_errors": []}

    with (
        patch.object(pipeline_agents, "parse", return_value=_doc("charterparty.pdf")),
        patch.object(pipeline_agents, "extract_charterparty_terms") as extract,
    ):
        extract.return_value = CharterpartyTerms.model_validate(CP_TERMS_JSON)
        cp_worker_node(state)  # type: ignore[arg-type]

    assert not _feedback_kwarg(extract)


def test_sof_worker_forwards_each_chronology_its_own_feedback(tmp_path: Path) -> None:
    fixture_dir = _fake_dir(tmp_path, "sof_owner.pdf", "sof_charterer.pdf")
    state = {
        "fixture_dir": str(fixture_dir),
        "validation_errors": [_issue("owner NOR missing", "sof_owner", "timestamp")],
    }

    with (
        patch.object(pipeline_agents, "parse", return_value=_doc("sof.pdf")),
        patch.object(pipeline_agents, "extract_sof_events", return_value=[]) as extract,
    ):
        sof_worker_node(state)  # type: ignore[arg-type]

    assert extract.call_count == 2
    owner_kwargs, charterer_kwargs = extract.call_args_list
    assert owner_kwargs.kwargs.get("validation_errors") == ["owner NOR missing"]
    assert not charterer_kwargs.kwargs.get("validation_errors")


def test_sof_worker_never_reextracts_claim_amounts_on_a_retry(tmp_path: Path) -> None:
    fixture_dir = _fake_dir(
        tmp_path, "sof_owner.pdf", "sof_charterer.pdf", "claim_owner.pdf", "claim_charterer.pdf"
    )
    validator_issues = _validate(_terms_without("vessel"))["validation_errors"]
    state = {
        "fixture_dir": str(fixture_dir),
        "validation_errors": validator_issues,
    }

    with (
        patch.object(pipeline_agents, "parse", return_value=_doc("sof.pdf")),
        patch.object(pipeline_agents, "extract_sof_events", return_value=[]) as sof,
        patch.object(pipeline_agents, "extract_claim_amount") as claim,
    ):
        result = sof_worker_node(state)  # type: ignore[arg-type]

    assert validator_issues
    assert sof.call_count == 2
    claim.assert_not_called()
    assert "owner_claim_usd" not in result


def test_sof_worker_never_passes_feedback_to_the_claim_amount_extractor(tmp_path: Path) -> None:
    fixture_dir = _fake_dir(
        tmp_path, "sof_owner.pdf", "sof_charterer.pdf", "claim_owner.pdf", "claim_charterer.pdf"
    )

    issue_sets: list[list[Any]] = [[], ["legacy bare string"]]
    issue_sets += [
        [_issue("total unreadable", tag, "total_usd")] for tag in DOC_TAGS
    ]
    issue_sets.append([_issue("owner NOR missing", "sof_owner", "timestamp")])

    for issues in issue_sets:
        state = {"fixture_dir": str(fixture_dir), "validation_errors": issues}
        with (
            patch.object(pipeline_agents, "parse", return_value=_doc("sof.pdf")),
            patch.object(pipeline_agents, "extract_sof_events", return_value=[]),
            patch.object(pipeline_agents, "extract_claim_amount", return_value=187000.0) as claim,
        ):
            sof_worker_node(state)  # type: ignore[arg-type]

        for call in claim.call_args_list:
            assert not call.kwargs.get("validation_errors")


# ─── backward compatibility of the error channel ──────────────────────────────


def test_bare_string_errors_route_without_a_type_error() -> None:
    legacy = ["Validation Error: Vessel name is missing in Charterparty extraction."]

    for tag in DOC_TAGS:
        routed = _errors_for(legacy, tag)
        assert routed == legacy
        assert all(isinstance(message, str) for message in routed)


def test_bare_string_errors_still_drive_the_retry_router() -> None:
    for retry_count in (0, 1, 2):
        state = {"validation_errors": ["missing vessel"], "retry_count": retry_count}
        assert check_validation_routing(state) == "retry"  # type: ignore[arg-type]
    exhausted = {"validation_errors": ["missing vessel"], "retry_count": 3}
    assert check_validation_routing(exhausted) == "calculate"  # type: ignore[arg-type]


def test_bare_string_errors_serialise_and_reach_the_charterparty_extractor(tmp_path: Path) -> None:
    fixture_dir = _fake_dir(tmp_path, "charterparty.pdf")
    legacy = ["Validation Error: Vessel name is missing in Charterparty extraction."]
    state = {
        "fixture_dir": str(fixture_dir),
        "validation_errors": json.loads(json.dumps(legacy)),
    }

    with (
        patch.object(pipeline_agents, "parse", return_value=_doc("charterparty.pdf")),
        patch.object(pipeline_agents, "extract_charterparty_terms") as extract,
    ):
        extract.return_value = CharterpartyTerms.model_validate(CP_TERMS_JSON)
        cp_worker_node(state)  # type: ignore[arg-type]

    routed = _feedback_kwarg(extract)
    assert routed == legacy
    assert all(isinstance(message, str) for message in routed)


def test_bare_string_errors_do_not_crash_the_sof_worker(tmp_path: Path) -> None:
    fixture_dir = _fake_dir(tmp_path, "sof_owner.pdf", "sof_charterer.pdf")
    state = {
        "fixture_dir": str(fixture_dir),
        "validation_errors": ["Validation Error: charterer NOR missing."],
    }

    with (
        patch.object(pipeline_agents, "parse", return_value=_doc("sof.pdf")),
        patch.object(pipeline_agents, "extract_sof_events", return_value=[]) as extract,
    ):
        result = sof_worker_node(state)  # type: ignore[arg-type]

    assert extract.call_count == 2
    for call in extract.call_args_list:
        routed = call.kwargs.get("validation_errors")
        assert routed == ["Validation Error: charterer NOR missing."]
        assert all(isinstance(message, str) for message in routed)
    assert "extracted_owner_events" in result


def test_structured_and_bare_string_issues_travel_the_same_channel() -> None:
    message = "vessel missing"
    structured = [_issue(message, "charterparty", "vessel")]

    assert _errors_for(structured, "charterparty") == _errors_for([message], "charterparty")


# ─── extractor feedback behaviour ─────────────────────────────────────────────


class _FakeMessage:
    def __init__(self, content: str) -> None:
        self.content = content


class _FakeChoice:
    def __init__(self, content: str) -> None:
        self.message = _FakeMessage(content)


class _FakeResponse:
    def __init__(self, content: str) -> None:
        self.choices = [_FakeChoice(content)]


def _capture_user_messages(monkeypatch: pytest.MonkeyPatch, payload: dict[str, Any]) -> list[str]:
    captured: list[str] = []

    def fake_llm_call(**kwargs: Any) -> _FakeResponse:
        user = next(m for m in kwargs["messages"] if m["role"] == "user")
        captured.append(user["content"])
        return _FakeResponse(json.dumps(payload))

    monkeypatch.setattr(extractor, "_llm_call", fake_llm_call)
    return captured


EXTRACTOR_CASES = [
    pytest.param(extract_charterparty_terms, CP_TERMS_JSON, id="charterparty"),
    pytest.param(extract_sof_events, {"events": []}, id="sof"),
    pytest.param(extract_claim_amount, {"total_usd": 187000.0}, id="claim-amount"),
]


@pytest.mark.parametrize("extract, payload", EXTRACTOR_CASES)
def test_every_extractor_forwards_feedback_into_its_user_prompt(
    monkeypatch: pytest.MonkeyPatch, extract: Any, payload: dict[str, Any]
) -> None:
    captured = _capture_user_messages(monkeypatch, payload)

    extract(_doc(), validation_errors=["vessel missing", "latitude missing"])

    assert len(captured) == 1
    user_message = captured[0]
    assert "Previous extraction failed these checks." in user_message
    assert "Do not invent amounts, dates, or vessel names that are not in the document." in user_message
    assert "vessel missing" in user_message
    assert "latitude missing" in user_message


@pytest.mark.parametrize("extract, payload", EXTRACTOR_CASES)
def test_every_extractor_treats_empty_list_and_none_as_no_feedback(
    monkeypatch: pytest.MonkeyPatch, extract: Any, payload: dict[str, Any]
) -> None:
    captured = _capture_user_messages(monkeypatch, payload)

    extract(_doc(), validation_errors=[])
    extract(_doc())
    extract(_doc(), validation_errors=None)

    assert len(captured) == 3
    assert captured[0] == captured[1] == captured[2]
    assert "Previous extraction failed these checks." not in captured[0]


def test_charterparty_extractor_parses_its_result_while_feedback_is_supplied(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _capture_user_messages(monkeypatch, CP_TERMS_JSON)

    terms = extract_charterparty_terms(_doc(), validation_errors=["vessel missing"])

    assert terms == CharterpartyTerms.model_validate(CP_TERMS_JSON)
