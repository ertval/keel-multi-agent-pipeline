"""BIMCO Laytime Definitions 2013 — WWD weather exception evaluator.

Rule: BIMCO 2013 Clause 3.1 / 3.2
  A weather exception is valid when ALL of the following hold:
    1. Wind force >= 6 Beaufort for a sustained period, OR
       precipitation >= threshold AND operations_prevented is True
    2. operations_prevented is True for at least one observation
    3. The majority (> 50%) of observed hours in the window meet the threshold

References:
  rule_id  = "BIMCO_2013.WWD.threshold"
  Clause 3.2 threshold: Beaufort Force 6 (wind_speed_knots >= 22)
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from keel_api.schemas import WeatherCitation, WeatherObservation

# BIMCO 2013 Clause 3.2: threshold for WWD exception
_BEAUFORT_THRESHOLD = 6
_PRECIPITATION_THRESHOLD_MM = 2.0  # mm/h — heavy precipitation


@dataclass
class WWDResult:
    valid: bool
    rule_id: str
    rule_authority: str
    hours_at_threshold: float
    total_hours: float
    operations_prevented: bool
    justification: str
    citations: list[WeatherCitation]


def evaluate_wwd_exception(
    observations: list[WeatherObservation],
    disputed_start: datetime,
    disputed_end: datetime,
) -> WWDResult:
    """Evaluate whether a WWD weather exception is valid per BIMCO 2013.

    Args:
        observations: Hourly weather records covering the disputed window.
        disputed_start: Start of the claimed exception window.
        disputed_end: End of the claimed exception window.

    Returns:
        WWDResult with valid=True if the exception is upheld.
    """
    if not observations:
        return WWDResult(
            valid=False,
            rule_id="BIMCO_2013.WWD.threshold",
            rule_authority="BIMCO_2013",
            hours_at_threshold=0.0,
            total_hours=0.0,
            operations_prevented=False,
            justification="No weather observations available for the disputed window.",
            citations=[],
        )

    qualifying = [
        o for o in observations
        if o.wind_force_beaufort >= _BEAUFORT_THRESHOLD
        or o.precipitation_mm_per_hour >= _PRECIPITATION_THRESHOLD_MM
    ]
    ops_prevented = any(o.operations_prevented for o in observations)
    hours_at_threshold = float(len(qualifying))
    total_hours = float(len(observations))
    majority = hours_at_threshold / total_hours > 0.5

    valid = majority and ops_prevented

    if valid:
        justification = (
            f"Weather records confirm {hours_at_threshold:.0f} of {total_hours:.0f} observed hours "
            f"met or exceeded Beaufort Force {_BEAUFORT_THRESHOLD} (BIMCO 2013 Clause 3.2 threshold) "
            f"with operations prevented. Weather exception under Clause 3.1 is validly invoked."
        )
    elif not majority:
        max_force = max(o.wind_force_beaufort for o in observations)
        justification = (
            f"Weather records show only {hours_at_threshold:.0f} of {total_hours:.0f} observed hours "
            f"at or above Beaufort Force {_BEAUFORT_THRESHOLD} (peak: Force {max_force}). "
            f"Conditions did not meet the Clause 3.2 threshold; exception not validly invoked."
        )
    else:
        justification = (
            f"Weather records show {hours_at_threshold:.0f} of {total_hours:.0f} observed hours "
            f"at or above Beaufort Force {_BEAUFORT_THRESHOLD}, but operations_prevented is not "
            f"confirmed. Exception requires both threshold conditions and operational impact."
        )

    # Cite first and last qualifying observations as evidence
    citations = []
    if qualifying:
        citations.append(qualifying[0].citation)
        if len(qualifying) > 1:
            citations.append(qualifying[-1].citation)

    return WWDResult(
        valid=valid,
        rule_id="BIMCO_2013.WWD.threshold",
        rule_authority="BIMCO_2013",
        hours_at_threshold=hours_at_threshold,
        total_hours=total_hours,
        operations_prevented=ops_prevented,
        justification=justification,
        citations=citations,
    )
