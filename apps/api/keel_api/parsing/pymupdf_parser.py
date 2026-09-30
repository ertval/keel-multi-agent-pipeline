"""Parse narrative PDFs (charterparty) with PyMuPDF.

Extracts plain text per page plus every text line with its real position on the
page. No table extraction — charterparty is prose with numbered clauses, not
tabular. Page count and inflated output are both capped.
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

from keel_api.parsing.limits import (
    MAX_EXTRACTED_CHARS,
    MAX_PDF_PAGES,
    MAX_TEXT_LINES,
    DocumentTooLarge,
)
from keel_api.parsing.models import BBox, ParsedDocument, TextLine


def parse_with_pymupdf(path: Path) -> ParsedDocument:
    doc = ParsedDocument(path=str(path))
    extracted_chars = 0

    with fitz.open(str(path)) as pdf:
        if pdf.page_count > MAX_PDF_PAGES:
            raise DocumentTooLarge(
                f"{path.name}: {pdf.page_count} pages exceeds the "
                f"{MAX_PDF_PAGES}-page limit for one document"
            )

        for page_num, page in enumerate(pdf, start=1):
            text = page.get_text("text")
            extracted_chars += len(text)
            if extracted_chars > MAX_EXTRACTED_CHARS:
                raise DocumentTooLarge(
                    f"{path.name}: extracted text exceeds {MAX_EXTRACTED_CHARS} characters"
                )
            doc.pages.append(text)

            line_index = 0
            for block in page.get_text("dict").get("blocks", []):
                if block.get("type") != 0:
                    continue
                for line in block.get("lines", []):
                    line_text = "".join(span.get("text", "") for span in line.get("spans", []))
                    if not line_text.strip():
                        continue
                    x0, y0, x1, y1 = line["bbox"]
                    doc.lines.append(
                        TextLine(
                            page=page_num,
                            index=line_index,
                            text=line_text,
                            bbox=BBox(page=page_num, x0=x0, y0=y0, x1=x1, y1=y1),
                        )
                    )
                    line_index += 1

            if len(doc.lines) > MAX_TEXT_LINES:
                raise DocumentTooLarge(f"{path.name}: more than {MAX_TEXT_LINES} text lines")

    return doc
