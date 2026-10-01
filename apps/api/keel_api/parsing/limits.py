"""Resource ceilings for turning one untrusted document into text.

A charterparty runs to a few tens of pages and a Statement of Facts to one or
two, so a document that needs more than any of these is not large, it is
hostile. What a document costs is not its page count but the characters on it:
pdfplumber keeps a geometry object per character for the whole document, and on
this tree that measured ~2 kB of address space per extracted character over a
~150 MB interpreter-and-library floor.

    200 pages,  25 lines each ( 80k characters)   0.31 GB    6 s
     40 pages,  55 lines each (179k characters)   0.51 GB   13 s
    200 pages,  55 lines each (894k characters)   2.03 GB   43-68 s

The two 200-page documents differ by 6x in address space and 4x in time, so the
ceilings are stated in the unit the cost is actually paid in.
`MAX_EXTRACTED_CHARS` is what `DEFAULT_ADDRESS_SPACE_BYTES` is sized to admit:
150 MB plus 2 kB for every character the text ceiling allows stays inside the
address space, so the address space is the backstop for the document that gets
under the text ceiling rather than the thing that refuses a real one.
`MAX_PDF_PAGES` is checked before any page is expanded, which is the only check
that happens first; the text and line ceilings are read as the pages are, so they
bound how far the expansion has already gone.
"""

from __future__ import annotations

MAX_PDF_PAGES = 200
MAX_EXTRACTED_CHARS = 1_200_000
MAX_TEXT_LINES = 200_000
MAX_TABLE_CELLS = 100_000

# Address space granted to the parser child process, in bytes. 150 MB + 2 kB per
# extracted character is 2.55 GB at MAX_EXTRACTED_CHARS, so the text ceiling is
# the binding one and this is the backstop under it; the densest 200-page
# document measured above needed 2.03 GB, so it is admitted with room to spare.
DEFAULT_ADDRESS_SPACE_BYTES = 3_000_000_000

# Wall clock granted to one document before the child is abandoned. The same
# 200-page document took 43-68 s, so this is roughly 2x a legal parse.
DEFAULT_PARSE_TIMEOUT_SECONDS = 120.0


class DocumentTooLarge(ValueError):
    """A document exceeded a parsing ceiling, or ran out of its address space."""


class DocumentParseError(RuntimeError):
    """The isolated parser process ended without a usable result."""
