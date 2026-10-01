"""Parse tabular PDFs (SOF, claims) with pdfplumber.

Extracts text per page, every text line with its real position on the page, and
all table cells with the cell's own bounding box. Used for structured documents
where table layout matters.

Page count and inflated output are both capped: pdfplumber builds per-character
geometry, so page count is a direct multiplier on peak memory.
"""

from __future__ import annotations

from pathlib import Path

import pdfplumber

from keel_api.parsing.limits import (
    MAX_EXTRACTED_CHARS,
    MAX_PDF_PAGES,
    MAX_TABLE_CELLS,
    MAX_TEXT_LINES,
    DocumentTooLarge,
)
from keel_api.parsing.models import BBox, ParsedDocument, TableCell, TextLine

_TABLE_SETTINGS: dict = {"explicit_vertical_lines": [], "explicit_horizontal_lines": []}


def parse_with_pdfplumber(path: Path) -> ParsedDocument:
    doc = ParsedDocument(path=str(path))
    extracted_chars = 0

    with pdfplumber.open(path) as pdf:
        if len(pdf.pages) > MAX_PDF_PAGES:
            raise DocumentTooLarge(
                f"{path.name}: {len(pdf.pages)} pages exceeds the "
                f"{MAX_PDF_PAGES}-page limit for one document"
            )

        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            extracted_chars += len(text)
            if extracted_chars > MAX_EXTRACTED_CHARS:
                raise DocumentTooLarge(
                    f"{path.name}: extracted text exceeds {MAX_EXTRACTED_CHARS} characters"
                )
            doc.pages.append(text)

            page_lines = sorted(
                page.extract_text_lines(),
                key=lambda line: (round(line["top"], 1), line["x0"]),
            )
            for line_index, line in enumerate(page_lines):
                if not line["text"].strip():
                    continue
                doc.lines.append(
                    TextLine(
                        page=page_num,
                        index=line_index,
                        text=line["text"],
                        bbox=BBox(
                            page=page_num,
                            x0=line["x0"],
                            y0=line["top"],
                            x1=line["x1"],
                            y1=line["bottom"],
                        ),
                    )
                )
            if len(doc.lines) > MAX_TEXT_LINES:
                raise DocumentTooLarge(
                    f"{path.name}: more than {MAX_TEXT_LINES} text lines"
                )

            for table in page.find_tables(_TABLE_SETTINGS):
                for row_idx, (row, cells) in enumerate(zip(table.rows, table.extract())):
                    for col_idx, cell_text in enumerate(cells):
                        if cell_text is None:
                            continue
                        cell_text = cell_text.strip()
                        if not cell_text:
                            continue
                        cell_bbox = row.cells[col_idx] if col_idx < len(row.cells) else None
                        doc.table_cells.append(
                            TableCell(
                                page=page_num,
                                row=row_idx,
                                col=col_idx,
                                text=cell_text,
                                bbox=(
                                    BBox(
                                        page=page_num,
                                        x0=cell_bbox[0],
                                        y0=cell_bbox[1],
                                        x1=cell_bbox[2],
                                        y1=cell_bbox[3],
                                    )
                                    if cell_bbox
                                    else None
                                ),
                            )
                        )
                if len(doc.table_cells) > MAX_TABLE_CELLS:
                    raise DocumentTooLarge(
                        f"{path.name}: more than {MAX_TABLE_CELLS} table cells"
                    )

    return doc
