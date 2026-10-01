"""Weather-exception evaluator for a claimed weather period.

Source: Laytime Definitions for Charter Parties 2013 (BIMCO Special Circular
No. 8, 10 September 2013; drafted by BIMCO, the Baltic Exchange, CMI and
FONASBA). Its weather provisions are definitions 15 to 18, not clauses:

  15  WEATHER WORKING DAY: the interruption is counted by reference to the
      ratio which its duration bears to the time which would have or could have
      been worked but for it, the reference period being 24 hours — a two hour
      stoppage in an eight hour working day is pro-rated to six hours, and to
      four hours in a twelve hour working day. No deductions are made for rain
      outside normal working hours.
  16  WWD OF 24 CONSECUTIVE HOURS: the period during which the weather
      interrupted or would have interrupted work is excluded, at any time,
      during or outside normal working hours and including periods on turn.
  17  WWD OF 24 HOURS: a period of 24 hours made up of one or more Working
      Days; laytime is suspended for stoppages.
  18  (WORKING DAY) WEATHER PERMITTING has the same meaning as WEATHER WORKING
      DAY OF 24 CONSECUTIVE HOURS, i.e. the same as definition 16.

Those definitions fix how an excluded period is measured. They set no numeric
weather threshold: the Laytime Definitions contain no wind force and no
precipitation figure, so the Beaufort and precipitation figures applied here are
the particular charterparty's own weather-working threshold, read from the
charterparty text and supplied by the caller.

The measurement basis applied here is definition 16's actual period, which is
what the engine strikes off for every weather clause (see
engine.state_machine.weather_basis, and the limitation recorded there). The
*share* of hours that must meet the charterparty threshold is a different thing
and is not drawn from the Laytime Definitions at all: the strict-majority test
applied here is this product's own policy, reading the charterparty clause that
says the threshold must be recorded "for a majority of the hours of the period
claimed". No sustained-period test is applied.

  rule_id           = _RULE_ID           the test this product applied
  measurement_basis = _MEASUREMENT_BASIS the source that fixes the measure
  threshold         = the charterparty's own term, or Keel's configured default
                       with its unverified provenance stated in the justification
  rule_authority    = "custom"           no source document is the authority for
                       this test or for the threshold
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from keel_api.schemas import WeatherCitation, WeatherObservation

# Keel's configured default weather-working thresholds, used only when the
# charterparty states no figure of its own. No ruleset prescribes them; a
# justification produced from these values says so on its face.
BEAUFORT_THRESHOLD = 6
PRECIPITATION_THRESHOLD_MM = 2.0  # mm/h

# The test, named as a test. It is not a citation into any document, so it names
# no source and no definition number: `measurement_basis` carries the source.
_RULE_ID = "CP_WEATHER.MAJORITY_OF_HOURS"
_MEASUREMENT_BASIS = "Laytime Definitions for Charter Parties 2013, definition 16"

# The authority for this test is this product's own policy against the
# charterparty's clause. It is not BIMCO 2013, which is the authority for
# neither the threshold nor the share of hours that must meet it.
_RULE_AUTHORITY = "custom"


@dataclass
class WWDResult:
    valid: bool
    rule_id: str
    measurement_basis: str
    rule_authority: str
    hours_at_threshold: float
    total_hours: float
    operations_prevented: bool
    justification: str
    citations: list[WeatherCitation]


def _threshold_figures(
    beaufort_threshold: int | None,
    precipitation_threshold_mm: float | None,
) -> tuple[int, float]:
    """Resolve the figures to test against, falling back to Keel's defaults."""
    return (
        BEAUFORT_THRESHOLD if beaufort_threshold is None else beaufort_threshold,
        PRECIPITATION_THRESHOLD_MM
        if precipitation_threshold_mm is None
        else precipitation_threshold_mm,
    )


def _threshold_phrase(beaufort: int, precipitation: float, threshold_source: str | None) -> str:
    """Describe the threshold, and where the figure came from.

    `threshold_source` names the charterparty clause the figures were read from,
    so the phrase can attribute them to the contract. With no source the phrase
    says the figure is Keel's own configured default and has not been checked
    against the charterparty text, rather than implying the contract says it.
    """
    figures = f"Beaufort Force {beaufort} (or precipitation of {precipitation:g} mm/h)"
    if threshold_source:
        return f"the charterparty's weather-working threshold of {figures}, stated in {threshold_source}"
    return (
        f"Keel's configured default weather-working threshold of {figures}, which has "
        f"not been verified against the charterparty text"
    )


def _share_phrase(hours_at_threshold: float, total_hours: float) -> str:
    """State the qualifying share in words, and a tie as a tie.

    Exactly half the hours is not a majority, and the charterparty clause this
    test reads says "a majority of the hours" without saying whether half
    qualifies, so a tie is reported as a tie rather than as a shortfall.
    """
    if hours_at_threshold == total_hours:
        return f"all {total_hours:.0f} of the {total_hours:.0f} observed hours"
    if hours_at_threshold * 2 == total_hours:
        return (
            f"half of the observed hours ({hours_at_threshold:.0f} of "
            f"{total_hours:.0f})"
        )
    return f"{hours_at_threshold:.0f} of the {total_hours:.0f} observed hours"


def evaluate_wwd_exception(
    observations: list[WeatherObservation],
    disputed_start: datetime,
    disputed_end: datetime,
    *,
    beaufort_threshold: int | None = None,
    precipitation_threshold_mm: float | None = None,
    threshold_source: str | None = None,
) -> WWDResult:
    """Evaluate a weather exception against the charterparty's weather clause.

    Args:
        observations: Hourly weather records covering the disputed window.
        disputed_start: Start of the claimed exception window.
        disputed_end: End of the claimed exception window.
        beaufort_threshold: The Beaufort figure the charterparty states, or
            None to use `BEAUFORT_THRESHOLD`.
        precipitation_threshold_mm: The mm/h figure the charterparty states, or
            None to use `PRECIPITATION_THRESHOLD_MM`.
        threshold_source: Where the figures were read — the citation of the
            charterparty clause stating them. None says nothing was read from the
            charterparty, and the justification then reports the figures as
            Keel's unverified default rather than as the contract's own term.

    Returns:
        WWDResult with valid=True if the exception is upheld. The exception is
        upheld when a strict majority of the observed hours meet or exceed the
        threshold and at least one *qualifying* observation records that
        operations were prevented.
    """
    if not observations:
        return WWDResult(
            valid=False,
            rule_id=_RULE_ID,
            measurement_basis=_MEASUREMENT_BASIS,
            rule_authority=_RULE_AUTHORITY,
            hours_at_threshold=0.0,
            total_hours=0.0,
            operations_prevented=False,
            justification=(
                "No weather observations available for the disputed window, so the "
                "charterparty's weather exception cannot be evidenced on this claim. "
                f"The measurement basis for an excepted period is {_MEASUREMENT_BASIS}."
            ),
            citations=[],
        )

    beaufort, precipitation = _threshold_figures(
        beaufort_threshold, precipitation_threshold_mm
    )
    threshold_phrase = _threshold_phrase(beaufort, precipitation, threshold_source)
    qualifying = [
        o for o in observations
        if o.wind_force_beaufort >= beaufort
        or o.precipitation_mm_per_hour >= precipitation
    ]
    # Only an hour that met the threshold can be one "during which the weather
    # interrupted work" (definition 16), so an hour flagged as preventing
    # operations while below the threshold cannot support the claim.
    ops_prevented = any(o.operations_prevented for o in qualifying)
    hours_at_threshold = float(len(qualifying))
    total_hours = float(len(observations))
    majority = hours_at_threshold / total_hours > 0.5
    share = _share_phrase(hours_at_threshold, total_hours)

    valid = majority and ops_prevented

    if valid:
        justification = (
            f"Weather records show {share} met or exceeded {threshold_phrase}, and at "
            f"least one of those hours records that loading operations were prevented. "
            f"The whole of the claimed period is therefore excepted from laytime, "
            f"because a majority of the observed hours met the threshold — that "
            f"share test is this product's own policy against the charterparty "
            f"clause, and it is not a test drawn from the Laytime Definitions, so a "
            f"majority of hours is not a finding that every claimed hour was an "
            f"interrupted period. The measurement basis for the excluded period is "
            f"{_MEASUREMENT_BASIS}."
        )
    elif not majority:
        max_force = max(o.wind_force_beaufort for o in observations)
        justification = (
            f"Weather records show {share} at or above {threshold_phrase} "
            f"(peak: Force {max_force}) — short of a majority. The strict-majority "
            f"test applied here is this product's own policy reading the "
            f"charterparty clause, not a test drawn from the Laytime Definitions. "
            f"The measurement basis for an excepted period is "
            f"{_MEASUREMENT_BASIS}."
        )
    else:
        justification = (
            f"Weather records show {share} at or above {threshold_phrase}, a "
            f"majority, but none of those hours records that loading operations "
            f"were prevented. {_MEASUREMENT_BASIS} counts the period during which "
            f"the weather interrupted or would have interrupted work, so "
            f"operational impact has to be evidenced, not read off the wind or "
            f"rain figure alone."
        )

    # Cite first and last qualifying observations as evidence
    citations = []
    if qualifying:
        citations.append(qualifying[0].citation)
        if len(qualifying) > 1:
            citations.append(qualifying[-1].citation)

    return WWDResult(
        valid=valid,
        rule_id=_RULE_ID,
        measurement_basis=_MEASUREMENT_BASIS,
        rule_authority=_RULE_AUTHORITY,
        hours_at_threshold=hours_at_threshold,
        total_hours=total_hours,
        operations_prevented=ops_prevented,
        justification=justification,
        citations=citations,
    )
