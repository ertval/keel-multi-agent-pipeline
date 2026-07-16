from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class BBox:
    page: int
    x0: float
    y0: float
    x1: float
    y1: float

    def as_tuple(self) -> tuple[float, float, float, float]:
        return (self.x0, self.y0, self.x1, self.y1)


@dataclass
class TableCell:
    page: int
    row: int
    col: int
    text: str
    bbox: BBox


@dataclass
class ParsedDocument:
    path: str
    pages: list[str] = field(default_factory=list)
    table_cells: list[TableCell] = field(default_factory=list)
