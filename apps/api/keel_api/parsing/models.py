from __future__ import annotations

from dataclasses import dataclass, field


NO_BBOX: tuple[float, float, float, float] = (0.0, 0.0, 0.0, 0.0)


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
class TextLine:
    page: int
    index: int
    text: str
    bbox: BBox

    @property
    def anchor(self) -> str:
        return f"p{self.page}L{self.index}"


@dataclass
class TableCell:
    page: int
    row: int
    col: int
    text: str
    bbox: BBox | None


@dataclass
class ParsedDocument:
    path: str
    pages: list[str] = field(default_factory=list)
    table_cells: list[TableCell] = field(default_factory=list)
    lines: list[TextLine] = field(default_factory=list)
