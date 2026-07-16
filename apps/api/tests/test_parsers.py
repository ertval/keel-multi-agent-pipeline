"""A-03 smoke tests — parsers return non-empty output for all fixture PDFs."""

from __future__ import annotations

from pathlib import Path

import pytest

from keel_api.parsing import parse


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"

PDF_FIXTURES = [
    "charterparty.pdf",
    "sof_owner.pdf",
    "sof_charterer.pdf",
    "claim_owner.pdf",
    "claim_charterer.pdf",
]


@pytest.mark.parametrize("name", PDF_FIXTURES)
def test_parse_returns_nonempty_pages(name: str) -> None:
    doc = parse(FIXTURE_DIR / name)
    assert len(doc.pages) >= 1
    assert any(p.strip() for p in doc.pages), f"all pages empty for {name}"


def test_charterparty_has_text_content() -> None:
    doc = parse(FIXTURE_DIR / "charterparty.pdf")
    full_text = "\n".join(doc.pages)
    assert "demurrage" in full_text.lower()
    assert "BIMCO" in full_text or "bimco" in full_text.lower()


def test_sof_owner_has_table_rows() -> None:
    doc = parse(FIXTURE_DIR / "sof_owner.pdf")
    assert len(doc.table_cells) >= 1, "expected at least one table row in sof_owner.pdf"


def test_sof_charterer_has_table_rows() -> None:
    doc = parse(FIXTURE_DIR / "sof_charterer.pdf")
    assert len(doc.table_cells) >= 1, "expected at least one table row in sof_charterer.pdf"


def test_parse_clause_id() -> None:
    from keel_api.adapters import _parse_clause_id
    assert _parse_clause_id("Clause 2.1. Laytime allowed...", 0) == "Clause 2.1"
    assert _parse_clause_id("  clause 3.2: weather threshold", 1) == "Clause 3.2"
    assert _parse_clause_id("Clause 42 Time lost...", 2) == "Clause 42"
    assert _parse_clause_id("4.1. Once on demurrage...", 3) == "Clause 4.1"
    assert _parse_clause_id("Some other clause text...", 4) == "Clause 5"

