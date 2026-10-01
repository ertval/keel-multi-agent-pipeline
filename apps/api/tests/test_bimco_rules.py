"""Weather-exception evaluator tests, written as propositions about the claims.

The evaluator applies this product's own majority-of-hours test against a
charterparty's own weather-working threshold, and measures an excepted period on
the Laytime Definitions for Charter Parties 2013's definition 16. No source
document supplies the threshold or the share of hours that must meet it, so
nothing here may say otherwise — and these tests say so as propositions rather
than pinning the spelling of a rule id, so renaming a string cannot leave a
false claim standing.

The three canonical disputed days:
  Jun 14: Force 5, threshold not reached  → exception INVALID
  Jun 15: Force 4, threshold not reached  → exception INVALID
  Jun 16-17: Force 7 + heavy rain, operations prevented → exception VALID

There is no sustained-period test: the qualifying test is the share of observed
hours at or above the charterparty threshold, together with confirmed
operational impact in one of those hours.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path

import pytest

from keel_api.rules import evaluate_wwd_exception
from keel_api.rules.evaluators import (
    _MEASUREMENT_BASIS,
    _RULE_AUTHORITY,
    _RULE_ID,
    BEAUFORT_THRESHOLD,
    PRECIPITATION_THRESHOLD_MM,
)
from keel_api.schemas import WeatherCitation, WeatherObservation
from keel_api.weather import FixtureWeatherProvider


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"

# A ruleset name, and the figure that would make attributing a threshold to it a
# fabrication. A sentence may name a source when it disclaims the source (the
# justification does exactly that for the share test); it may never pair one with
# a number the source does not contain.
_SOURCE_NAMES = (
    "bimco",
    "laytime definitions for charter parties",
    "laytime definitions 2013",
    "voyage charter rules",
    "voylayrules",
    "gencon",
    "congencon",
)
_FIGURE = re.compile(r"Force\s*\d+|\d+(?:\.\d+)?\s*mm", re.IGNORECASE)
_SENTENCE_SPLIT = re.compile(r"(?<=[.;])\s+")

_THRESHOLD_SOURCE = "charterparty clause 3.2, page 3"


def _dt(s: str) -> datetime:
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def _obs(hour: int, beaufort: int, mm: float, prevented: bool) -> WeatherObservation:
    return WeatherObservation(
        timestamp=_dt(f"2026-06-15T{hour:02d}:00:00"),
        wind_force_beaufort=beaufort,
        wind_speed_knots=float(beaufort * 4),
        precipitation_mm_per_hour=mm,
        operations_prevented=prevented,
        citation=WeatherCitation(source="synthetic", observation_id=f"obs-{hour}"),
    )


def _all_results() -> list:
    """One result per justification branch: valid, no majority, no ops, no data."""
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    valid = provider.get(0.0, 0.0, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    thin = provider.get(0.0, 0.0, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T21:00:00"))
    no_ops = [_obs(h, 7, 5.6, False) for h in range(4)]
    return [
        evaluate_wwd_exception(
            valid, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"),
            threshold_source=_THRESHOLD_SOURCE,
        ),
        evaluate_wwd_exception(
            thin, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T22:00:00"),
            threshold_source=_THRESHOLD_SOURCE,
        ),
        evaluate_wwd_exception(
            no_ops, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00"),
            threshold_source=_THRESHOLD_SOURCE,
        ),
        evaluate_wwd_exception(
            [], _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00"),
            threshold_source=_THRESHOLD_SOURCE,
        ),
    ]


def _justifications() -> list[str]:
    return [result.justification for result in _all_results()]


# ─── Canonical days ───────────────────────────────────────────────────────────


def test_june_14_threshold_not_reached_exception_invalid() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T21:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T22:00:00"))
    assert result.valid is False
    assert result.hours_at_threshold == 0.0


def test_june_15_threshold_not_reached_exception_invalid() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-15T06:00:00"), _dt("2026-06-15T17:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-15T06:00:00"), _dt("2026-06-15T18:00:00"))
    assert result.valid is False


def test_june_16_storm_exception_valid() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    assert result.valid is True
    assert result.hours_at_threshold == 36.0
    assert result.operations_prevented is True


def test_empty_observations_returns_invalid() -> None:
    result = evaluate_wwd_exception([], _dt("2026-06-14T10:00:00"), _dt("2026-06-14T22:00:00"))
    assert result.valid is False
    assert result.total_hours == 0.0
    assert result.hours_at_threshold == 0.0
    assert result.operations_prevented is False
    assert result.citations == []


def test_invalid_result_has_citations_when_data_present() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    assert len(result.citations) == 2
    assert result.citations[0].observation_id == "PIR-2026-0616-00"
    assert result.citations[-1].observation_id == "PIR-2026-0617-11"


def test_justification_is_nonempty_string() -> None:
    for text in _justifications():
        assert isinstance(text, str)
        assert len(text) > 20


# ─── The test and its authority (C4, C5) ──────────────────────────────────────


def test_weather_verdict_authority_is_this_products_own_policy() -> None:
    """The share test and the threshold are the product's and the contract's, so
    no source document is the authority for either."""
    for result in _all_results():
        assert result.rule_authority == "custom"
    assert _RULE_AUTHORITY == "custom"


def test_rule_id_names_a_test_not_a_source_or_a_definition() -> None:
    """A rule id is not a citation: it must survive being read as one."""
    lowered = _RULE_ID.lower()
    for name in _SOURCE_NAMES:
        assert name not in lowered, _RULE_ID
    assert not re.search(r"\b(def|definition|art|clause|para)\b", lowered), _RULE_ID
    assert not re.search(r"\d", _RULE_ID), _RULE_ID


def test_measurement_basis_is_reported_separately_from_the_rule_id() -> None:
    assert _RULE_ID not in _MEASUREMENT_BASIS
    assert _MEASUREMENT_BASIS == "Laytime Definitions for Charter Parties 2013, definition 16"
    for result in _all_results():
        assert result.rule_id == _RULE_ID
        assert result.measurement_basis == _MEASUREMENT_BASIS
        assert result.rule_id != result.measurement_basis


def test_no_justification_attributes_a_threshold_figure_to_a_source_document() -> None:
    """The 2013 definitions set no weather threshold, so no sentence may pair a
    ruleset name with a Beaufort or precipitation figure."""
    for text in _justifications():
        for sentence in _SENTENCE_SPLIT.split(text):
            lowered = sentence.lower()
            if not any(name in lowered for name in _SOURCE_NAMES):
                continue
            assert not _FIGURE.search(sentence), sentence


def test_no_justification_claims_a_sustained_period_test() -> None:
    for text in _justifications():
        assert "sustained" not in text.lower(), text


def test_justification_attributes_the_threshold_to_the_charterparty_clause() -> None:
    for result in _all_results()[:3]:
        assert "the charterparty's weather-working threshold" in result.justification
        assert _THRESHOLD_SOURCE in result.justification


def test_justification_states_that_the_share_test_is_the_products_own_policy() -> None:
    """The share test decides days, so both share-driven branches say where it
    came from; the third branch turns on operational impact, not on the share."""
    majority, not_majority, _no_ops, _no_data = _all_results()
    for result in (majority, not_majority):
        assert "this product's own policy" in result.justification
    for result in _all_results():
        assert _MEASUREMENT_BASIS in result.justification


# ─── A whole window is excepted because a majority of hours met the threshold ──


def test_valid_justification_does_not_call_the_window_an_interrupted_period() -> None:
    """A majority of hours is not a finding that every claimed hour was
    interrupted, so the justification may not describe the window as one."""
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    result = evaluate_wwd_exception(
        obs, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"),
        threshold_source=_THRESHOLD_SOURCE,
    )
    text = result.justification.lower()
    assert "counted as an actual period" not in text
    assert "the interrupted time is excepted" not in text
    assert "the whole of the claimed period is therefore excepted" in text
    assert "because a majority of the observed hours met the threshold" in text
    assert _MEASUREMENT_BASIS in result.justification


def test_invalid_justification_reports_a_shortfall_not_a_refusal() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T21:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-14T10:00:00"), _dt("2026-06-14T22:00:00"))
    assert result.justification.endswith(_MEASUREMENT_BASIS + ".")


# ─── Threshold provenance (C2) ────────────────────────────────────────────────


def test_extracted_threshold_is_attributed_to_the_clause_it_was_read_from() -> None:
    obs = [_obs(h, 7, 5.6, True) for h in range(4)]
    result = evaluate_wwd_exception(
        obs, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00"),
        beaufort_threshold=7, precipitation_threshold_mm=5.0,
        threshold_source="charterparty clause 3.2, page 3",
    )
    assert "Beaufort Force 7" in result.justification
    assert "stated in charterparty clause 3.2, page 3" in result.justification
    assert "not been verified" not in result.justification


def test_absent_threshold_is_reported_as_an_unverified_default() -> None:
    """Nothing was read from the charterparty, so the figure is Keel's own and the
    letter has to say so rather than let it pass for the counterparty's term."""
    obs = [_obs(h, 7, 5.6, True) for h in range(4)]
    result = evaluate_wwd_exception(
        obs, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00"),
    )
    assert f"Beaufort Force {BEAUFORT_THRESHOLD}" in result.justification
    assert f"precipitation of {PRECIPITATION_THRESHOLD_MM:g} mm/h" in result.justification
    assert "Keel's configured default" in result.justification
    assert "has not been verified against the charterparty text" in result.justification
    assert "charterparty's weather-working threshold" not in result.justification


def test_unverified_default_is_still_the_documented_default() -> None:
    obs = [_obs(h, BEAUFORT_THRESHOLD, 0.0, True) for h in range(4)]
    defaulted = evaluate_wwd_exception(obs, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00"))
    explicit = evaluate_wwd_exception(
        obs, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00"),
        beaufort_threshold=BEAUFORT_THRESHOLD,
        precipitation_threshold_mm=PRECIPITATION_THRESHOLD_MM,
    )
    assert (defaulted.valid, defaulted.hours_at_threshold) == (
        explicit.valid, explicit.hours_at_threshold
    )


# ─── The share test (H4, L2) ──────────────────────────────────────────────────


def test_below_threshold_hour_cannot_evidence_operational_impact() -> None:
    """Definition 16 counts the period during which weather interrupted work, so
    only an hour that met the threshold can evidence it. Every hour here is
    flagged as preventing operations and every one of them is below the
    threshold, so nothing qualifies and nothing can be excepted."""
    obs = [_obs(h, 2, 0.0, True) for h in range(4)]
    result = evaluate_wwd_exception(
        obs, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00"),
        beaufort_threshold=3, precipitation_threshold_mm=99.0,
    )
    assert result.hours_at_threshold == 0.0
    assert result.operations_prevented is False
    assert result.valid is False


def test_impact_in_a_non_qualifying_hour_does_not_rescue_a_bare_minority() -> None:
    """Impact reported only in the hours that missed the threshold is not impact
    within an interrupted period, so it cannot support the claim."""
    obs = [_obs(h, 7, 0.0, False) for h in range(2)] + [
        _obs(h, 1, 0.0, True) for h in range(2, 4)
    ]
    result = evaluate_wwd_exception(
        obs, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00")
    )
    assert result.hours_at_threshold == 2.0
    assert result.operations_prevented is False
    assert result.valid is False


def test_impact_confirmed_in_a_qualifying_hour_is_accepted() -> None:
    obs = [_obs(h, 4, 0.0, h == 3) for h in range(4)]
    result = evaluate_wwd_exception(
        obs, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00"),
        beaufort_threshold=4, precipitation_threshold_mm=99.0,
    )
    assert result.hours_at_threshold == 4.0
    assert result.operations_prevented is True
    assert result.valid is True


def test_qualifying_test_is_a_strict_majority() -> None:
    obs = [_obs(h, 7, 0.0, True) for h in range(2)] + [
        _obs(h, 1, 0.0, True) for h in range(2, 4)
    ]
    result = evaluate_wwd_exception(
        obs, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00")
    )
    assert result.hours_at_threshold == 2.0
    assert result.total_hours == 4.0
    assert result.operations_prevented is True
    assert result.valid is False


def test_a_tie_is_reported_as_a_tie_not_as_a_shortfall() -> None:
    """Exactly half the hours is not "only" half of them, and a clause saying "a
    majority" does not say whether a tie qualifies."""
    obs = [_obs(h, 7, 0.0, True) for h in range(3)] + [
        _obs(h, 1, 0.0, True) for h in range(3, 6)
    ]
    result = evaluate_wwd_exception(
        obs, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T06:00:00")
    )
    assert result.hours_at_threshold == 3.0
    assert result.total_hours == 6.0
    assert result.valid is False
    assert "half of the observed hours (3 of 6)" in result.justification
    assert "short of a majority" in result.justification
    assert "only" not in result.justification


def test_majority_invalidates_the_claim_on_the_peak_figure_alone() -> None:
    obs = [_obs(h, 9, 0.0, False) for h in range(4)]
    result = evaluate_wwd_exception(
        obs, _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00")
    )
    assert result.valid is False
    assert "prevented" in result.justification


# ─── Thresholds are the charterparty's, not a product constant ────────────────


def test_injected_beaufort_threshold_changes_outcome() -> None:
    obs = [_obs(h, 4, 0.0, True) for h in range(4)]
    start, end = _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00")

    default = evaluate_wwd_exception(obs, start, end)
    assert default.valid is False
    assert default.hours_at_threshold == 0.0

    injected = evaluate_wwd_exception(
        obs, start, end, beaufort_threshold=3, threshold_source=_THRESHOLD_SOURCE
    )
    assert injected.valid is True
    assert injected.hours_at_threshold == 4.0
    assert "Beaufort Force 3" in injected.justification


def test_injected_precipitation_threshold_changes_outcome() -> None:
    obs = [_obs(h, 2, 5.6, True) for h in range(4)]
    start, end = _dt("2026-06-15T00:00:00"), _dt("2026-06-15T04:00:00")

    assert evaluate_wwd_exception(obs, start, end).valid is True
    assert evaluate_wwd_exception(obs, start, end, precipitation_threshold_mm=10.0).valid is False


def test_positional_call_signature_still_supported() -> None:
    provider = FixtureWeatherProvider(FIXTURE_DIR)
    obs = provider.get(0.0, 0.0, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    result = evaluate_wwd_exception(obs, _dt("2026-06-16T00:00:00"), _dt("2026-06-17T12:00:00"))
    assert result.valid is True
    assert result.rule_id == _RULE_ID
    assert result.measurement_basis == _MEASUREMENT_BASIS
    assert result.rule_authority == "custom"


@pytest.mark.parametrize("result_index", range(4))
def test_every_result_carries_the_same_rule_and_basis(result_index: int) -> None:
    result = _all_results()[result_index]
    assert (result.rule_id, result.measurement_basis) == (_RULE_ID, _MEASUREMENT_BASIS)
