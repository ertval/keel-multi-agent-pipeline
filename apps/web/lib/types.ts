/**
 * TypeScript types mirroring the JSON the Keel API actually serves.
 *
 * `keel_api/schemas.py` holds the *internal* Pydantic contracts, but the
 * browser never sees those. Two modules produce the wire shapes:
 *   - `keel_api/adapters.py::reconciliation_to_frontend` → the `reconciliation`
 *     key of `GET /voyages/{id}` (`VoyageDetailResponse`).
 *   - `keel_api/store.py::list_voyages` → the rows behind `GET /voyages`
 *     (`VoyageSummary`) and `GET /reconciliations` (`ReconciliationSummary`).
 * Hand-written — no codegen.
 */

// ─── Enum mirrors (schemas.py) ────────────────────────────────────────────────

/**
 * `schemas.RuleAuthority` — a ruleset a charterparty expressly incorporates by
 * name. The two places it appears answer different questions, and neither is
 * the authority for the rules this product applied:
 *   - on a **verdict** it is always `"custom"`: the threshold is the
 *     charterparty's own term and the share of hours that must meet it is this
 *     product's own policy (rules/evaluators.py), so no source document is the
 *     authority for either.
 *   - on a **reconciliation** it is the ruleset the charterparty incorporates,
 *     which governs how its clauses are read — not what was applied.
 *
 * The internal Pydantic field is `rule_authority`; no wire shape currently
 * carries it, so nothing in the app reads it.
 */
export type RuleAuthority = "BIMCO_2013" | "VOYLAYRULES_93" | "custom";

/** `schemas.CharterpartyTerms.laytime_exception`. */
export type LaytimeException = "SHEX" | "FHEX" | "SHINC";

/** `schemas.WEATHER_CLAUSE_VALUES` — gained `WWDSHINC` alongside WWD/WWDSHEX/none. */
export type WeatherClause = "WWD" | "WWDSHEX" | "WWDSHINC" | "none";

// ─── Core domain types ────────────────────────────────────────────────────────

export interface ClauseCitation {
  /**
   * Two different things, so it is never read as a citation on its own:
   *   - on `charterparty.clauses` this is the clause's own number in the
   *     document ("Clause 3").
   *   - on `DayVerdict.bimco_clause` it names the **test the engine applied**
   *     and nothing else — it is not a citation into any source document and
   *     carries no definition number. `clause_text` beside it is the
   *     charterparty wording the test was read from, and
   *     `DayVerdict.measurement_basis` is the separate source that fixes how an
   *     excepted period is measured.
   */
  clause_id: string;
  /**
   * `null` on `DayVerdict.bimco_clause` when no charterparty clause was matched
   * to the weather exception (adapters.py:150) — the adjudicator matched none,
   * so there is no text to quote.
   */
  clause_text: string | null;
  /** `null` alongside a `null` `clause_text` (adapters.py:152). */
  source_document: string | null;
  /** `null` alongside a `null` `clause_text` (adapters.py:153). */
  page_number: number | null;
  /**
   * [x0, y0, x1, y1] in PDF points, or `null` when the parser could not locate
   * the row on the page. Present on `charterparty.clauses` (adapters.py:97),
   * absent on `DayVerdict.bimco_clause` (adapters.py:149).
   */
  bbox?: [number, number, number, number] | null;
}

export interface SourceCitation {
  /** `null` when the pipeline could not name the source file (adapters.py:41). */
  document: string | null;
  /** `null` when the parser could not place the excerpt on a page. */
  page_number: number | null;
  excerpt: string;
  /** `null` for the same reason as `ClauseCitation.bbox`. */
  bbox?: [number, number, number, number] | null;
}

export interface CharterpartyTerms {
  vessel_name: string;
  /** `null` in the terms-less fallback (adapters.py:174). */
  owner_name: string | null;
  charterer_name: string | null;
  /**
   * `null` when the pipeline never extracted a hire rate (adapters.py:82) —
   * the charterparty terms carry none, and a demurrage rate is not one.
   */
  hire_rate_per_day_usd: number | null;
  laytime_allowed_hours: number;
  demurrage_rate_per_day_usd: number;
  despatch_rate_per_day_usd: number;
  /**
   * `[laytime_exception, weather_clause]` (adapters.py:77) — a LaytimeException
   * and a WeatherClause in one array, so it stays `string[]` rather than a
   * union of the two enums.
   */
  exceptions: string[];
  clauses: ClauseCitation[];
}

// ─── Calculation / audit trace ────────────────────────────────────────────────

export type Party = "owner" | "charterer";

export interface AuditTraceEntry {
  step: number;
  description: string;
  value_usd: number;
  /** Explicit `null` (not absent) when the entry has no SOF citation. */
  citation?: SourceCitation | null;
  /**
   * The charterparty clause this step was measured against, as a sibling of
   * `citation` — the SOF row the step came from and the charterparty wording it
   * was read against are different documents. Explicit `null` on every step that
   * cites no clause (adapters.py:65); always present, so nothing may be read
   * from it unguarded.
   */
  clause_citation: SourceCitation | null;
}

export interface PartyCalculation {
  party: Party;
  total_usd: number;
  audit_trace: AuditTraceEntry[];
}

// ─── Weather ──────────────────────────────────────────────────────────────────

export interface WeatherRecord {
  date: string; // ISO 8601
  /** `null` when no Beaufort force appears in the weather record (adapters.py:110). */
  wind_force_beaufort: number | null;
  /** `null` when no precipitation rate was recorded (adapters.py:111). */
  precipitation_mm: number | null;
  adverse_hours: number;
  is_excepted: boolean;
}

// ─── Per-day reconciliation ───────────────────────────────────────────────────

export type Verdict = "owner" | "charterer" | "split";

export interface DayVerdict {
  date: string; // "YYYY-MM-DD"
  owner_position: string;
  charterer_position: string;
  weather: WeatherRecord;
  bimco_clause: ClauseCitation;
  /**
   * The source that fixes how an excepted period is *measured*, named on its
   * own so it is never read as the authority for the test or the threshold
   * (adapters.py:177). Always present, e.g. "Laytime Definitions for Charter
   * Parties 2013, definition 16".
   */
  measurement_basis: string;
  verdict: Verdict;
  winner_label: string; // "Owner position better supported" | "Charterer position better supported"
  dollars_credited_usd: number;
  justification: string;
}

// ─── Top-level reconciliation ─────────────────────────────────────────────────

export interface Reconciliation {
  voyage_id: string;
  charterparty: CharterpartyTerms;
  owner_calculation: PartyCalculation;
  charterer_calculation: PartyCalculation;
  day_verdicts: DayVerdict[];
  reconciled_total_usd: number;
  /**
   * Human-readable math breakdown, e.g. "$62,000 (charterer base) + $50,000
   * (items favouring the owner's position) = $112,000"
   */
  math_breakdown: string;
}

// ─── API response wrappers ────────────────────────────────────────────────────

/** `POST /voyages` — the pipeline runs in a background task, so this is always "processing". */
export interface UploadResponse {
  voyage_id: string;
  status: "processing" | "ready" | "error";
  message?: string;
}

/** `GET /voyages/{id}` (main.py:176). */
export interface VoyageDetailResponse {
  reconciliation: Reconciliation;
  pdf_urls: Record<string, string>; // document name → API-relative URL
}

// ─── Dashboard summaries ─────────────────────────────────────────────────────

/**
 * Every value the store persists for a human-readable state: "Processing" /
 * "Error" come from the pipeline task, the other four are the statuses
 * `PATCH /voyages/{id}/status` accepts (main.py:194).
 */
export type VoyageStatus = "Reconciled" | "In Review" | "Pending" | "Processing" | "Closed" | "Error";

/**
 * The subset of `VoyageStatus` a client may write. `PATCH /voyages/{id}/status`
 * rejects "Processing" and "Error" with a 422 (main.py:194-196) — those two are
 * written by the pipeline background task, not by the UI.
 */
export type SettableVoyageStatus = "Reconciled" | "In Review" | "Pending" | "Closed";

/**
 * `GET /voyages` — includes the "Processing" stub rows written by
 * `POST /voyages`, which carry the totals as `null` and no vessel/party names
 * at all (store.py:139).
 */
export interface VoyageSummary {
  voyage_id: string;
  created_at: string;
  vessel_name?: string | null;
  owner_name?: string | null;
  charterer_name?: string | null;
  status?: VoyageStatus;
  owner_total_usd?: number | null;
  charterer_total_usd?: number | null;
  reconciled_total_usd?: number | null;
  disputed_count?: number | null;
}

/**
 * `GET /reconciliations` — the same store row, filtered to "Reconciled" /
 * "In Review" / "Closed" (main.py:218). The filter removes processing stubs but
 * not rows whose pipeline produced no extracted terms: those carry
 * `vessel_name: null` and `*_total_usd: null` (store.py:139), so every field
 * below is nullable even though the endpoint always emits the keys.
 */
export interface ReconciliationSummary {
  voyage_id: string;
  created_at: string;
  vessel_name: string | null;
  owner_name: string | null;
  charterer_name: string | null;
  status: VoyageStatus;
  owner_total_usd: number | null;
  charterer_total_usd: number | null;
  reconciled_total_usd: number | null;
  disputed_count: number | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
