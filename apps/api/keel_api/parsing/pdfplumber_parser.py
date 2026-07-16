"""Parse tabular PDFs (SOF, claims) with pdfplumber.

Extracts text per page plus all table cells with bounding boxes.
Used for structured documents where table layout matters.
"""

from __future__ import annotations

from pathlib import Path

import pdfplumber

from keel_api.parsing.models import BBox, ParsedDocument, TableCell


def parse_with_pdfplumber(path: Path) -> ParsedDocument:
    doc = ParsedDocument(path=str(path))

    with pdfplumber.open(path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            doc.pages.append(text)

            tables = page.extract_tables({"explicit_vertical_lines": [], "explicit_horizontal_lines": []})
            if not tables:
                continue

            for table in tables:
                for row_idx, row in enumerate(table):
                    for col_idx, cell_text in enumerate(row):
                        if cell_text is None:
                            continue
                        cell_text = cell_text.strip()
                        if not cell_text:
                            continue
                        # pdfplumber doesn't give per-cell bbox easily from extract_tables;
                        # use page bbox as fallback — precise bbox comes from word-level search
                        px0, py0, px1, py1 = page.bbox
                        bbox = BBox(page=page_num, x0=px0, y0=py0, x1=px1, y1=py1)
                        doc.table_cells.append(
                            TableCell(
                                page=page_num,
                                row=row_idx,
                                col=col_idx,
                                text=cell_text,
                                bbox=bbox,
                            )
                        )

    return doc
