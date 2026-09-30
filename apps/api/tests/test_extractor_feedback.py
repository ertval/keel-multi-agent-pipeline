"""Unit tests for extraction validation-feedback user-message helper."""

from __future__ import annotations

from keel_api.extraction.extractor import _user_content


def test_user_content_unchanged_when_errors_none() -> None:
    assert _user_content("doc text") == "doc text"
    assert _user_content("doc text", None) == "doc text"


def test_user_content_unchanged_when_errors_empty() -> None:
    assert _user_content("doc text", []) == "doc text"


def test_user_content_appends_validation_errors() -> None:
    result = _user_content("doc text", ["missing vessel", "bad date"])
    assert result.startswith("doc text\n\n")
    assert "Previous extraction failed these checks." in result
    assert "Do not invent amounts, dates, or vessel names that are not in the document." in result
    assert "- missing vessel" in result
    assert "- bad date" in result
