"""Route a PDF to the right parser based on filename convention.

- charterparty.pdf  → pymupdf (prose narrative)
- sof_*.pdf         → pdfplumber (tabular SOF)
- claim_*.pdf       → pdfplumber (tabular claim)
- fallback          → pdfplumber
"""

from __future__ import annotations

from pathlib import Path

from keel_api.parsing.models import ParsedDocument
from keel_api.parsing.pdfplumber_parser import parse_with_pdfplumber
from keel_api.parsing.pymupdf_parser import parse_with_pymupdf

_PYMUPDF_NAMES = {"charterparty.pdf"}


def parse(path: Path) -> ParsedDocument:
    if path.name in _PYMUPDF_NAMES:
        return parse_with_pymupdf(path)
    return parse_with_pdfplumber(path)
