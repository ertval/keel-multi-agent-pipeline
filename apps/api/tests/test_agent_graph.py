"""Control-flow proofs for the LangGraph multi-agent pipeline.

Every test here drives the real compiled graph. The compiler captures node
functions by object, so a test that replaces a node must call
`reset_agent_pipeline()` first; the `rebuilt_graph` fixture does that.
"""

from __future__ import annotations

import json
import shutil
from datetime import date
from pathlib import Path
from typing import Any, Callable, Dict, Iterator, List, Tuple
from unittest.mock import Mock, patch

import fitz
import pytest
from langgraph.graph import END, StateGraph

import keel_api.pipeline_agents as pa
from keel_api.parsing.models import ParsedDocument
from keel_api.pipeline_agents import (
    PipelineState,
    check_validation_routing,
    create_agent_pipeline,
    reset_agent_pipeline,
    run_agent_pipeline,
)
from keel_api.schemas import CharterpartyTerms, Reconciliation, SOFEvent


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "fixtures" / "voyage_001"

CANONICAL = (187_000, 62_000, 112_000)

# Every document the pipeline will look for. `_write_stub_pdfs` supplies all of
# them, so neither fixture inherits whatever `fixtures/voyage_001/` happens to
# ship: this tree does not, and a checkout that restores the real PDFs must not
# turn these proofs red.
STUB_PDF_NAMES = (
    "charterparty.pdf",
    "sof_owner.pdf",
    "sof_charterer.pdf",
    "claim_owner.pdf",
    "claim_charterer.pdf",
)


@pytest.fixture(autouse=True)
def rebuilt_graph() -> None:
    reset_agent_pipeline()
    yield
    reset_agent_pipeline()


def _cached(name: str) -> Any:
    return json.loads((FIXTURE_DIR / name).read_text())


def _stub_parse(path: Path) -> ParsedDocument:
    return ParsedDocument(path=str(path), pages=[f"stub text for {Path(path).name}"])


def _write_stub_pdfs(dest: Path) -> None:
    """A complete one-page document set, written here rather than copied.

    A real PDF, not the `%PDF-1.4 stub` bytes a caller can fake: the point is
    that the workers take their document-present branch whatever the checkout
    holds, so these proofs cannot pass by accident.
    """
    doc = fitz.open()
    doc.new_page(width=612.0, height=792.0)
    payload = doc.tobytes()
    doc.close()
    for name in STUB_PDF_NAMES:
        (dest / name).write_bytes(payload)


def _broken_fixture(tmp_path: Path) -> Path:
    """voyage_001 with a cached charterparty the validator can never accept.

    The vessel name is emptied and the source PDFs are present, so the retry
    budget is spent on the terms rather than on a missing document: a worker
    that could not find its PDF would return nothing and look the same from the
    outside, which is how these proofs used to inherit the absence of the PDFs
    from `fixtures/`. `unrepairable_extractors` states the unrepairability
    where it is meant.
    """
    dest = tmp_path / "voyage_001"
    shutil.copytree(FIXTURE_DIR, dest)
    _write_stub_pdfs(dest)
    terms = _cached("extracted_charterparty.json")
    terms["vessel"] = ""
    (dest / "extracted_charterparty.json").write_text(json.dumps(terms))
    return dest


def _recoverable_fixture(tmp_path: Path) -> Path:
    """Same broken cache, and the same complete document set to repair it from."""
    return _broken_fixture(tmp_path)


def _valid_cache_fixture(tmp_path: Path) -> Path:
    """`_recoverable_fixture` with the charterparty cache as the fixture ships it."""
    dest = _recoverable_fixture(tmp_path)
    terms = _cached("extracted_charterparty.json")
    (dest / "extracted_charterparty.json").write_text(json.dumps(terms))
    return dest


def _unrepairing_extractors() -> Dict[str, Any]:
    """Extraction stubs that hand back the fixture's own broken terms.

    Whatever they are handed, they return a charterparty with no vessel, so a
    retry has nothing to change and the validator's complaint stands.
    """
    terms = CharterpartyTerms.model_validate(
        _cached("extracted_charterparty.json")
    ).model_copy(update={"vessel": ""})
    owner = [SOFEvent.model_validate(e) for e in _cached("extracted_sof_owner.json")]
    charterer = [SOFEvent.model_validate(e) for e in _cached("extracted_sof_charterer.json")]

    def charterparty_terms(doc: Any, validation_errors: Any = None) -> CharterpartyTerms:
        return terms

    def sof_events(doc: Any, validation_errors: Any = None) -> List[SOFEvent]:
        return owner if Path(doc.path).name == "sof_owner.pdf" else charterer

    return {"charterparty": spy(charterparty_terms), "sof": spy(sof_events)}


@pytest.fixture()
def unrepairable_extractors() -> Iterator[None]:
    """The stubs above, plus a `parse` that always succeeds.

    With the documents present and the workers unable to improve on what they
    read, the only thing left to spend the retry budget on is the terms.
    """
    extractors = _unrepairing_extractors()
    with (
        patch.object(pa, "parse", _stub_parse),
        patch.object(pa, "extract_charterparty_terms", extractors["charterparty"]),
        patch.object(pa, "extract_sof_events", extractors["sof"]),
    ):
        yield


def _initial_state(fixture: Path) -> Dict[str, Any]:
    return {
        "fixture_dir": str(fixture),
        "voyage_id": "voyage_001",
        "cp_text": "",
        "sof_owner_text": "",
        "sof_charterer_text": "",
        "extracted_terms": {},
        "extracted_owner_events": [],
        "extracted_charterer_events": [],
        "owner_claim_usd": 0.0,
        "charterer_claim_usd": 0.0,
        "validation_errors": [],
        "retry_count": 0,
        "owner_calculation": {},
        "charterer_calculation": {},
        "reconciliation": {},
    }


def _trace(fixture: Path) -> Tuple[List[str], Dict[str, Any]]:
    """Run the compiled graph, recording node execution order and final state."""
    executed: List[str] = []
    final: Dict[str, Any] = {}
    for mode, chunk in create_agent_pipeline().stream(
        _initial_state(fixture), stream_mode=["updates", "values"]
    ):
        if mode == "updates":
            executed.extend(chunk)
        else:
            final = chunk
    return executed, final


def _repairing_extractors() -> Dict[str, Callable[..., Any]]:
    """Extraction stubs that return the canonical voyage_001 facts."""
    terms = CharterpartyTerms.model_validate(_cached("extracted_charterparty.json"))
    owner = [SOFEvent.model_validate(e) for e in _cached("extracted_sof_owner.json")]
    charterer = [SOFEvent.model_validate(e) for e in _cached("extracted_sof_charterer.json")]

    def charterparty_terms(doc: Any, validation_errors: Any = None) -> CharterpartyTerms:
        return terms

    def sof_events(doc: Any, validation_errors: Any = None) -> List[SOFEvent]:
        return owner if Path(doc.path).name == "sof_owner.pdf" else charterer

    return {"charterparty": charterparty_terms, "sof": sof_events}


def _cached_claim(doc: Any) -> float:
    """The claim amount the fixture's cache already holds for `doc`'s party."""
    return float(
        _cached(
            "extracted_owner_claim_amount.json"
            if Path(doc.path).name == "claim_owner.pdf"
            else "extracted_charterer_claim_amount.json"
        )
    )


def spy(fn: Callable[..., Any]) -> Mock:
    return Mock(side_effect=fn)


def _assert_canonical(result: Dict[str, Any]) -> None:
    reconciliation = Reconciliation.model_validate(result["reconciliation"])
    assert (
        reconciliation.owner_total_usd,
        reconciliation.charterer_total_usd,
        reconciliation.reconciled_total_usd,
    ) == CANONICAL


# ─── check_validation_routing ─────────────────────────────────────────────────

def test_check_validation_routing_retries_when_errors_and_budget_left() -> None:
    state = {
        "validation_errors": ["missing vessel"],
        "retry_count": 1,
    }
    assert check_validation_routing(state) == "retry"  # type: ignore[arg-type]


def test_check_validation_routing_calculates_when_retries_exhausted() -> None:
    state = {
        "validation_errors": ["missing vessel"],
        "retry_count": 3,
    }
    assert check_validation_routing(state) == "calculate"  # type: ignore[arg-type]


def test_check_validation_routing_calculates_when_clean() -> None:
    state = {
        "validation_errors": [],
        "retry_count": 0,
    }
    assert check_validation_routing(state) == "calculate"  # type: ignore[arg-type]


def test_check_validation_routing_retries_on_the_last_available_budget() -> None:
    state = {
        "validation_errors": ["still broken"],
        "retry_count": 2,
    }
    assert check_validation_routing(state) == "retry"  # type: ignore[arg-type]


# ─── The join, structurally ───────────────────────────────────────────────────

def test_validator_enters_through_a_single_list_edge_join() -> None:
    """`add_edge([...], "validator")` is stored as one waiting edge."""
    assert create_agent_pipeline().builder.waiting_edges == {
        (("cp_worker", "sof_worker"), "validator")
    }


def test_join_is_not_two_independent_edges_into_the_validator() -> None:
    """The two worker→validator edges must not exist as plain edges."""
    edges = set(create_agent_pipeline().builder.edges)
    assert ("cp_worker", "validator") not in edges
    assert ("sof_worker", "validator") not in edges


def test_retry_fanout_stays_two_independent_edges() -> None:
    """Retry is a fan-out, not a join: both workers are re-entered directly."""
    edges = set(create_agent_pipeline().builder.edges)
    assert ("retry_fanout", "cp_worker") in edges
    assert ("retry_fanout", "sof_worker") in edges


def test_plain_edge_set_is_exactly_the_fanout_topology() -> None:
    """Edge accounting: the join contributes zero plain edges.

    The validator's two targets are conditional, so they live in `branches`,
    not `edges`. Every entry here is an unconditional edge.
    """
    builder = create_agent_pipeline().builder
    assert set(builder.edges) == {
        ("__start__", "orchestrator"),
        ("orchestrator", "cp_worker"),
        ("orchestrator", "sof_worker"),
        ("retry_fanout", "cp_worker"),
        ("retry_fanout", "sof_worker"),
        ("laytime_engine", "adjudicator"),
        ("adjudicator", END),
    }
    assert builder.branches["validator"]["check_validation_routing"].ends == {
        "retry": "retry_fanout",
        "calculate": "laytime_engine",
    }


def test_join_assertion_discriminates_two_independent_edges() -> None:
    """The structural check must fail on the topology it guards against.

    The two-independent-edges graph compiles to a byte-identical
    `get_graph().edges` set, which is why the rendered edges cannot be the
    assertion. `waiting_edges` is the only thing that separates the two.
    """
    mutant = StateGraph(PipelineState)
    for name in ("orchestrator", "cp_worker", "sof_worker", "validator",
                 "retry_fanout", "laytime_engine", "adjudicator"):
        mutant.add_node(name, lambda state: {})
    mutant.set_entry_point("orchestrator")
    mutant.add_edge("orchestrator", "cp_worker")
    mutant.add_edge("orchestrator", "sof_worker")
    mutant.add_edge("cp_worker", "validator")
    mutant.add_edge("sof_worker", "validator")
    mutant.add_conditional_edges(
        "validator",
        check_validation_routing,
        {"retry": "retry_fanout", "calculate": "laytime_engine"},
    )
    mutant.add_edge("retry_fanout", "cp_worker")
    mutant.add_edge("retry_fanout", "sof_worker")
    mutant.add_edge("laytime_engine", "adjudicator")
    mutant.add_edge("adjudicator", END)
    mutant_graph = mutant.compile()

    real = create_agent_pipeline()
    assert {(e.source, e.target) for e in real.get_graph().edges} == {
        (e.source, e.target) for e in mutant_graph.get_graph().edges
    }
    assert real.builder.waiting_edges == {(("cp_worker", "sof_worker"), "validator")}
    assert mutant_graph.builder.waiting_edges == set()
    assert ("cp_worker", "validator") in set(mutant_graph.builder.edges)
    assert ("sof_worker", "validator") in set(mutant_graph.builder.edges)


# ─── Cache-only first pass ────────────────────────────────────────────────────

def test_run_agent_pipeline_voyage_001_cache_only() -> None:
    """Fixture dir has extracted_*.json — first pass must use cache (no LLM)."""
    with (
        patch("keel_api.pipeline_agents.extract_charterparty_terms") as cp,
        patch("keel_api.pipeline_agents.extract_sof_events") as sof,
        patch("keel_api.pipeline_agents.extract_claim_amount") as claim,
    ):
        result = run_agent_pipeline(FIXTURE_DIR, "voyage_001")
    cp.assert_not_called()
    sof.assert_not_called()
    claim.assert_not_called()
    reconciliation = Reconciliation.model_validate(result["reconciliation"])

    assert reconciliation.owner_total_usd == 187_000
    assert reconciliation.charterer_total_usd == 62_000
    assert reconciliation.reconciled_total_usd == 112_000
    assert reconciliation.rule_authority == "BIMCO_2013"

    by_date = {item.disputed_date: item for item in reconciliation.disputed_items}
    assert by_date[date(2026, 6, 14)].verdict.winner == "owner"
    assert by_date[date(2026, 6, 15)].verdict.winner == "owner"
    assert by_date[date(2026, 6, 16)].verdict.winner == "charterer"


def test_clean_first_pass_never_enters_the_retry_loop() -> None:
    seen, _ = _trace(FIXTURE_DIR)
    assert "retry_fanout" not in seen
    assert seen.count("validator") == 1
    assert seen.count("cp_worker") == 1
    assert seen.count("sof_worker") == 1


def test_clean_first_pass_reports_no_validation_errors() -> None:
    result = run_agent_pipeline(FIXTURE_DIR, "voyage_001")
    assert result["validation_errors"] == []
    assert result["retry_count"] == 0


# ─── Retry fan-out ────────────────────────────────────────────────────────────

def test_retry_re_enters_both_workers_and_stops_at_three(
    tmp_path: Path, unrepairable_extractors: None
) -> None:
    fixture = _broken_fixture(tmp_path)
    seen, result = _trace(fixture)

    assert seen.count("validator") == 3
    assert seen.count("cp_worker") == 3
    assert seen.count("sof_worker") == 3
    assert seen.count("retry_fanout") == 2
    assert result["retry_count"] == 3


def test_retry_loop_terminates_instead_of_recursing(
    tmp_path: Path, unrepairable_extractors: None
) -> None:
    fixture = _broken_fixture(tmp_path)
    seen, _ = _trace(fixture)
    assert seen[-2:] == ["laytime_engine", "adjudicator"]


def test_both_worker_functions_are_really_invoked_on_every_retry(
    tmp_path: Path, unrepairable_extractors: None
) -> None:
    """Counts node invocations, not rendered labels, to prove the fan-out."""
    fixture = _broken_fixture(tmp_path)
    counter: Dict[str, int] = {"cp": 0, "sof": 0}
    original_cp = pa.cp_worker_node
    original_sof = pa.sof_worker_node

    def counting_cp(state: PipelineState) -> Dict[str, Any]:
        counter["cp"] += 1
        return original_cp(state)

    def counting_sof(state: PipelineState) -> Dict[str, Any]:
        counter["sof"] += 1
        return original_sof(state)

    with (
        patch.object(pa, "cp_worker_node", counting_cp),
        patch.object(pa, "sof_worker_node", counting_sof),
    ):
        reset_agent_pipeline()
        run_agent_pipeline(fixture, "voyage_001")

    assert counter == {"cp": 3, "sof": 3}


def test_patching_a_node_without_clearing_the_cache_does_nothing() -> None:
    """Guards the trap the other node-patching tests depend on."""
    counter = {"n": 0}
    original = pa.cp_worker_node

    def counting(state: PipelineState) -> Dict[str, Any]:
        counter["n"] += 1
        return original(state)

    run_agent_pipeline(FIXTURE_DIR, "voyage_001")
    with patch.object(pa, "cp_worker_node", counting):
        run_agent_pipeline(FIXTURE_DIR, "voyage_001")
    assert counter["n"] == 0


# ─── Errors survive three failures; calculation still runs ─────────────────────

def test_validation_errors_remain_on_state_after_retries_exhausted(
    tmp_path: Path, unrepairable_extractors: None
) -> None:
    fixture = _broken_fixture(tmp_path)
    result = run_agent_pipeline(fixture, "voyage_001")
    issues = result["validation_errors"]
    assert issues
    assert {i["document"] for i in issues} == {"charterparty"}
    assert {i["field"] for i in issues} == {"vessel"}
    assert all("Vessel name is missing" in i["message"] for i in issues)


def test_reconciliation_is_produced_after_three_failed_validations(
    tmp_path: Path, unrepairable_extractors: None
) -> None:
    fixture = _broken_fixture(tmp_path)
    result = run_agent_pipeline(fixture, "voyage_001")
    assert result["reconciliation"]
    _assert_canonical(result)


def test_laytime_calculations_run_after_three_failed_validations(
    tmp_path: Path, unrepairable_extractors: None
) -> None:
    fixture = _broken_fixture(tmp_path)
    result = run_agent_pipeline(fixture, "voyage_001")
    assert result["owner_calculation"]["demurrage_due_usd"] > 0
    assert result["charterer_calculation"]["demurrage_due_usd"] > 0


# ─── Cache bypass and money stability on retry ────────────────────────────────

def test_first_pass_uses_the_cache_and_does_not_extract(tmp_path: Path) -> None:
    """A usable cache is read, and nothing is extracted — not even the claims.

    The cache is complete, the extracted terms validate, and the source PDFs
    are on disk, so there is no absent document for a worker to bail out on and
    no validation error for it to route around the cache with. The extractors
    can then only stay uncalled because `cp_worker_node`/`sof_worker_node` took
    their cache branch. This assertion was previously satisfied by the
    absent-PDF early return in `cp_worker_node`, which is a different code path
    entirely; the broken-cache case has its own test below.
    """
    fixture = _valid_cache_fixture(tmp_path)
    extractors = _repairing_extractors()
    with (
        patch.object(pa, "parse", _stub_parse),
        patch.object(pa, "extract_charterparty_terms", spy(extractors["charterparty"])) as cp,
        patch.object(pa, "extract_sof_events", spy(extractors["sof"])) as sof,
        patch.object(pa, "extract_claim_amount") as claim,
    ):
        result = run_agent_pipeline(fixture, "voyage_001")

    assert result["validation_errors"] == []
    assert result["retry_count"] == 0
    cp.assert_not_called()
    sof.assert_not_called()
    claim.assert_not_called()
    _assert_canonical(result)


def test_a_broken_cache_cannot_repair_itself(tmp_path: Path) -> None:
    """The broken-cache case, stated on its own terms.

    The documents are present and the cache is read anyway, so the workers do
    reach their extractors on each retry — and spend the whole budget because
    the terms they are handed still carry no vessel. The claim amounts are
    never re-read, so the dollars cannot drift while the retries run.
    """
    fixture = _broken_fixture(tmp_path)
    extractors = _unrepairing_extractors()
    with (
        patch.object(pa, "parse", _stub_parse),
        patch.object(pa, "extract_charterparty_terms", extractors["charterparty"]) as cp,
        patch.object(pa, "extract_sof_events", extractors["sof"]) as sof,
        patch.object(pa, "extract_claim_amount") as claim,
    ):
        result = run_agent_pipeline(fixture, "voyage_001")

    assert result["retry_count"] == 3
    assert {i["field"] for i in result["validation_errors"]} == {"vessel"}
    assert cp.call_count == 2
    assert sof.call_count == 4
    claim.assert_not_called()
    _assert_canonical(result)


def test_incomplete_cache_is_not_used_at_all(tmp_path: Path) -> None:
    """The cache decision is all-or-nothing across the five extracted files."""
    fixture = _recoverable_fixture(tmp_path)
    (fixture / "extracted_sof_owner.json").unlink()
    extractors = _repairing_extractors()
    with (
        patch.object(pa, "parse", _stub_parse),
        patch.object(pa, "extract_charterparty_terms", spy(extractors["charterparty"])) as cp,
        patch.object(pa, "extract_sof_events", spy(extractors["sof"])) as sof,
        patch.object(pa, "extract_claim_amount", spy(_cached_claim)) as claim,
    ):
        result = run_agent_pipeline(fixture, "voyage_001")

    assert cp.call_count == 1
    assert sof.call_count == 2
    assert claim.call_count == 2


def test_complete_cache_is_used_even_when_source_pdfs_are_present(
    tmp_path: Path,
) -> None:
    fixture = _valid_cache_fixture(tmp_path)
    extractors = _repairing_extractors()
    with (
        patch.object(pa, "parse", _stub_parse),
        patch.object(pa, "extract_charterparty_terms", spy(extractors["charterparty"])) as cp,
        patch.object(pa, "extract_sof_events", spy(extractors["sof"])) as sof,
    ):
        result = run_agent_pipeline(fixture, "voyage_001")

    assert result["validation_errors"] == []
    assert result["retry_count"] == 0
    assert cp.call_count == 0
    assert sof.call_count == 0


def test_retry_bypasses_the_extraction_cache(tmp_path: Path) -> None:
    fixture = _recoverable_fixture(tmp_path)
    extractors = _repairing_extractors()
    with (
        patch.object(pa, "parse", _stub_parse),
        patch.object(pa, "extract_charterparty_terms", spy(extractors["charterparty"])) as cp,
        patch.object(pa, "extract_sof_events", spy(extractors["sof"])) as sof,
    ):
        result = run_agent_pipeline(fixture, "voyage_001")

    assert result["retry_count"] == 1
    assert result["validation_errors"] == []
    assert cp.call_count == 1
    assert sof.call_count == 2
    assert cp.call_args.kwargs["validation_errors"] == [
        "Validation Error: Vessel name is missing in Charterparty extraction."
    ]
    assert sof.call_args.kwargs["validation_errors"] is None


def test_retry_does_not_reread_the_cached_claim_amounts(tmp_path: Path) -> None:
    fixture = _recoverable_fixture(tmp_path)
    extractors = _repairing_extractors()
    with (
        patch.object(pa, "parse", _stub_parse),
        patch.object(pa, "extract_charterparty_terms", extractors["charterparty"]),
        patch.object(pa, "extract_sof_events", extractors["sof"]),
        patch.object(pa, "extract_claim_amount") as claim,
    ):
        result = run_agent_pipeline(fixture, "voyage_001")

    assert result["retry_count"] == 1
    claim.assert_not_called()


def test_claim_amounts_survive_a_retry_unchanged(tmp_path: Path) -> None:
    fixture = _recoverable_fixture(tmp_path)
    extractors = _repairing_extractors()
    with (
        patch.object(pa, "parse", _stub_parse),
        patch.object(pa, "extract_charterparty_terms", extractors["charterparty"]),
        patch.object(pa, "extract_sof_events", extractors["sof"]),
        patch.object(
            pa, "extract_claim_amount", side_effect=AssertionError("re-rolled")
        ) as claim,
    ):
        result = run_agent_pipeline(fixture, "voyage_001")

    assert result["retry_count"] == 1
    claim.assert_not_called()
    assert result["owner_claim_usd"] == _cached("extracted_owner_claim_amount.json")
    assert result["charterer_claim_usd"] == _cached("extracted_charterer_claim_amount.json")
    _assert_canonical(result)


def test_repaired_retry_still_reconciles_to_the_canonical_dollars(
    tmp_path: Path,
) -> None:
    fixture = _recoverable_fixture(tmp_path)
    extractors = _repairing_extractors()
    with (
        patch.object(pa, "parse", _stub_parse),
        patch.object(pa, "extract_charterparty_terms", extractors["charterparty"]),
        patch.object(pa, "extract_sof_events", extractors["sof"]),
    ):
        result = run_agent_pipeline(fixture, "voyage_001")

    assert result["retry_count"] == 1
    _assert_canonical(result)
