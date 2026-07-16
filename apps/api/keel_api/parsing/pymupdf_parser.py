"""Parse narrative PDFs (charterparty) with PyMuPDF.

Extracts plain text per page. No table extraction — charterparty is
prose with numbered clauses, not tabular.
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

from keel_api.parsing.models import ParsedDocument


def parse_with_pymupdf(path: Path) -> ParsedDocument:
    doc = ParsedDocument(path=str(path))

    with fitz.open(str(path)) as pdf:
        for page in pdf:
            text = page.get_text("text")
            doc.pages.append(text)

    return doc
