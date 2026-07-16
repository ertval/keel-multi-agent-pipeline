"""Response adapters — convert internal Pydantic models to the frontend's
expected JSON shape (defined in apps/web/lib/types.ts).
"""

from __future__ import annotations

import re

from keel_api.schemas import (
    AuditEntry,
    CalculationResult,
    CharterpartyTerms,
    DisputedLineItem,
    Reconciliation,
)


def _round_usd_display(amount: float) -> float:
    # Present running totals at the same $1,000 granularity as the headline
    # figures (see pipeline._round_usd) so the audit trace reconciles to the
    # reconciliation totals shown in the UI instead of trailing odd cents.
    return round(amount / 1000) * 1000


def _audit_entry_to_frontend(entry: AuditEntry, idx: int, document: str) -> dict:
    return {
        "step": idx + 1,
        "description": f"{entry.state}: {entry.rule_applied}",
        "value_usd": _round_usd_display(entry.running_total_usd),
        "citation": (
            {
                "document": document,
                "page_number": entry.sof_citation.page,
                "excerpt": entry.sof_citation.row_text,
            }
            if entry.sof_citation
            else None
        ),
    }


def _calc_to_frontend(result: CalculationResult, total_usd: float | None = None) -> dict:
    document = "sof_owner.pdf" if result.party == "owner" else "sof_charterer.pdf"
    return {
        "party": result.party,
        "total_usd": result.demurrage_due_usd if total_usd is None else total_usd,
        "audit_trace": [_audit_entry_to_frontend(e, i, document) for i, e in enumerate(result.trace)],
    }


def _parse_clause_id(text: str, index: int) -> str:
    # Try matching "Clause X.Y" or "Clause X"
    match = re.match(r"^\s*(clause\s+\d+(?:\.\d+)*)", text, re.IGNORECASE)
    if match:
        val = match.group(1).strip()
        if val.lower().startswith("clause"):
            return "Clause" + val[6:]
        return val

    # Fallback to leading number like "4.1" or "42"
    num_match = re.match(r"^\s*(\d+(?:\.\d+)*)", text)
    if num_match:
        return f"Clause {num_match.group(1).strip()}"

    return f"Clause {index + 1}"


def _terms_to_frontend(terms: CharterpartyTerms) -> dict:
    return {
        "vessel_name": terms.vessel,
        "owner_name": terms.owner,
        "charterer_name": terms.charterer,
        "hire_rate_per_day_usd": terms.demurrage_rate_per_day_usd,
        "laytime_allowed_hours": terms.laytime_allowance_hours,
        "demurrage_rate_per_day_usd": terms.demurrage_rate_per_day_usd,
        "despatch_rate_per_day_usd": terms.despatch_rate_per_day_usd,
        "exceptions": [terms.laytime_exception, terms.weather_clause],
        "clauses": [
            {
                "clause_id": _parse_clause_id(c.text, i),
                "clause_text": c.text,
                "source_document": "charterparty.pdf",
                "page_number": c.page,
                "bbox": list(c.bbox),
            }
            for i, c in enumerate(terms.clauses)
        ],
    }



def _extract_weather_snapshot(item: DisputedLineItem, demurrage_rate_per_day_usd: float) -> dict:
    text = f"{item.owner_position} {item.charterer_position} {item.verdict.justification}"
    force_match = re.search(r"(?:Force|Beaufort)\s+(\d+)", text, re.IGNORECASE)
    precip_match = re.search(r"(\d+(?:\.\d+)?)\s*mm", text, re.IGNORECASE)
    rate_per_hour = demurrage_rate_per_day_usd / 24 if demurrage_rate_per_day_usd else 0
    adverse_hours = item.owner_amount_usd / rate_per_hour if rate_per_hour else item.verdict.hours_credited_to_owner

    return {
        "wind_force_beaufort": int(force_match.group(1)) if force_match else 0,
        "precipitation_mm": float(precip_match.group(1)) if precip_match else 0.0,
        "adverse_hours": round(adverse_hours, 1),
        "is_excepted": item.verdict.winner == "charterer",
    }


def _disputed_item_to_day_verdict(
    item: DisputedLineItem,
    demurrage_rate_per_day_usd: float,
) -> dict:
    weather = _extract_weather_snapshot(item, demurrage_rate_per_day_usd)
    return {
        "date": item.disputed_date.isoformat(),
        "owner_position": item.owner_position,
        "charterer_position": item.charterer_position,
        "weather": {
            "date": item.disputed_date.isoformat(),
            "wind_force_beaufort": (
                item.weather_summary.peak_wind_force_beaufort
                if item.weather_summary
                else weather["wind_force_beaufort"]
            ),
            "precipitation_mm": (
                item.weather_summary.peak_precipitation_mm_per_hour
                if item.weather_summary
                else weather["precipitation_mm"]
            ),
            "adverse_hours": (
                item.weather_summary.adverse_hours
                if item.weather_summary
                else weather["adverse_hours"]
            ),
            "is_excepted": item.verdict.winner == "charterer",
        },
        "bimco_clause": {
            "clause_id": item.verdict.rule_id,
            "clause_text": item.verdict.justification,
            "source_document": "charterparty.pdf",
            "page_number": 1,
        },
        "verdict": item.verdict.winner,
        "winner_label": f"{'Owner' if item.verdict.winner == 'owner' else 'Charterer'} wins",
        "dollars_credited_usd": item.verdict.dollars_credited_to_owner_usd,
        "justification": item.verdict.justification,
    }


def reconciliation_to_frontend(
    reconciliation: Reconciliation,
    terms: CharterpartyTerms | None,
    owner_result: CalculationResult | None,
    charterer_result: CalculationResult | None,
) -> dict:
    """Convert internal Reconciliation + context to the frontend VoyageDetailResponse shape."""

    demurrage_rate = terms.demurrage_rate_per_day_usd if terms else 0
    day_verdicts = [
        _disputed_item_to_day_verdict(item, demurrage_rate)
        for item in reconciliation.disputed_items
    ]

    owner_wins = sum(
        item.verdict.dollars_credited_to_owner_usd for item in reconciliation.disputed_items
    )
    math = (
        f"${reconciliation.charterer_total_usd:,.0f} (charterer base)"
        f" + ${owner_wins:,.0f} (owner-win items)"
        f" = ${reconciliation.reconciled_total_usd:,.0f}"
    )

    frontend_terms = _terms_to_frontend(terms) if terms else {
        "vessel_name": reconciliation.voyage_id,
        "owner_name": None,
        "charterer_name": None,
        "hire_rate_per_day_usd": 0,
        "laytime_allowed_hours": 0,
        "demurrage_rate_per_day_usd": 0,
        "despatch_rate_per_day_usd": 0,
        "exceptions": [],
        "clauses": [],
    }

    return {
        "voyage_id": reconciliation.voyage_id,
        "charterparty": frontend_terms,
        "owner_calculation": (
            _calc_to_frontend(owner_result, reconciliation.owner_total_usd)
            if owner_result
            else {"party": "owner", "total_usd": reconciliation.owner_total_usd, "audit_trace": []}
        ),
        "charterer_calculation": (
            _calc_to_frontend(charterer_result, reconciliation.charterer_total_usd)
            if charterer_result
            else {"party": "charterer", "total_usd": reconciliation.charterer_total_usd, "audit_trace": []}
        ),
        "day_verdicts": day_verdicts,
        "reconciled_total_usd": reconciliation.reconciled_total_usd,
        "math_breakdown": math,
    }
