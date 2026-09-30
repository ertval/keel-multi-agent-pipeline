/**
 * API client for the Keel backend (FastAPI on port 8000).
 *
 * Every function below targets a route that exists in keel_api/main.py; the
 * mock branches are kept for offline work and are unreachable while
 * `USE_MOCK` is false.
 */

import type {
  UploadResponse,
  VoyageDetailResponse,
  Reconciliation,
  VoyageSummary,
  SettableVoyageStatus,
  ReconciliationSummary,
  PaginatedResponse,
  Verdict,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

/** Toggle this to false at the J-02 checkpoint to use the real API. */
export const USE_MOCK = false;

// ─── Offline data (reachable only while `USE_MOCK` is true) ───────────────────

/**
 * Verbatim capture of `GET /voyages/voyage_001` as the corrected API serves it,
 * including every `null` the engine emits rather than inventing a value.
 * Re-record it if the pipeline output changes; do not hand-edit the figures.
 *
 * The list mocks below share every field with this capture except `created_at`.
 * That one field is a wall-clock instant the API stamps on the row, so it is a
 * fresh value on every seed and no fixed mock can be a capture of it: the rows
 * carry a fixed stand-in in the wire's own format, with the fraction zeroed, so
 * a stand-in is never mistaken for a recorded reading.
 */
export const MOCK_RECONCILIATION: Reconciliation = {
  voyage_id: "voyage_001",
  charterparty: {
    vessel_name: "MV Hellenic Pioneer",
    owner_name: "Aegean Shipping Co.",
    charterer_name: "Mediterranean Grains Ltd.",
    hire_rate_per_day_usd: null,
    laytime_allowed_hours: 72.0,
    demurrage_rate_per_day_usd: 50000.0,
    despatch_rate_per_day_usd: 25000.0,
    exceptions: [
      "SHEX",
      "WWD",
    ],
    clauses: [
      {
        clause_id: "Clause 1",
        clause_text: "Laytime allowed for loading shall be  72 running hours, Sundays and Holidays excepted (SHEX).",
        source_document: "charterparty.pdf",
        page_number: 2,
        bbox: null,
      },
      {
        clause_id: "Clause 2",
        clause_text: "The demurrage rate is USD 50,000 per running day and pro rata, payable by the Charterer for time used in excess of the laytime allowance.",
        source_document: "charterparty.pdf",
        page_number: 2,
        bbox: null,
      },
      {
        clause_id: "Clause 3",
        clause_text: "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations. This clause is to be interpreted in accordance with the BIMCO Laytime Definitions for Charter Parties, 2013.",
        source_document: "charterparty.pdf",
        page_number: 3,
        bbox: null,
      },
      {
        clause_id: "Clause 4",
        clause_text: "The threshold for invocation of the weather exception under Clause 3.1 shall be conditions of Beaufort Force 6 or above, or precipitation of 2.0 mm/h or above, recorded for a majority of the hours of the period claimed, together with actual prevention of loading operations.",
        source_document: "charterparty.pdf",
        page_number: 3,
        bbox: null,
      },
      {
        clause_id: "Clause 5",
        clause_text: "Once on demurrage, the vessel shall remain on demurrage continuously until completion of loading, save only where the weather exception under Clause 3.1 is validly invoked in accordance with the threshold in Clause 3.2.",
        source_document: "charterparty.pdf",
        page_number: 4,
        bbox: null,
      },
      {
        clause_id: "Clause 6",
        clause_text: "NOR may be tendered upon arrival at the port limits, whether in berth or not, and shall be deemed accepted six (6) hours after tender.",
        source_document: "charterparty.pdf",
        page_number: 5,
        bbox: null,
      },
    ],
  },
  owner_calculation: {
    party: "owner",
    total_usd: 187000.0,
    audit_trace: [
        {
          step: 1,
          description: "BEFORE_NOR: NOR tendered",
          value_usd: 0,
          citation: {
            document: "sof_owner.pdf",
            page_number: 1,
            excerpt: "NOR Tendered Master tendered Notice of Readiness on arrival at Piraeus (UTC) 08:00 port limits.",
            bbox: null,
          },
          clause_citation: null,
        },
        {
          step: 2,
          description: "BEFORE_NOR: NOR accepted; laytime starts at 2026-06-10T20:00:00",
          value_usd: 0,
          citation: {
            document: "sof_owner.pdf",
            page_number: 1,
            excerpt: "NOR Accepted NOR accepted by port authority. 14:00",
            bbox: null,
          },
          clause_citation: null,
        },
        {
          step: 3,
          description: "ON_LAYTIME: Laytime commenced",
          value_usd: 0,
          citation: {
            document: "sof_owner.pdf",
            page_number: 1,
            excerpt: "Loading Vessel alongside Berth 7. First grab into Hold 1. Laytime Commenced commenced. 20:00",
            bbox: null,
          },
          clause_citation: null,
        },
        {
          step: 4,
          description: "ON_DEMURRAGE: LOADING_END",
          value_usd: 0,
          citation: {
            document: "sof_owner.pdf",
            page_number: 1,
            excerpt: "Laytime Expired Laytime allowance of 72 hours fully consumed. Vessel on demurrage from this time. 20:00",
            bbox: null,
          },
          clause_citation: null,
        },
        {
          step: 5,
          description: "ON_DEMURRAGE: LOADING_END",
          value_usd: 187000,
          citation: {
            document: "sof_owner.pdf",
            page_number: 1,
            excerpt: "Loading All hatches closed. Final draft survey complete. Vessel ready to sail. 13:46",
            bbox: null,
          },
          clause_citation: null,
        },
    ],
  },
  charterer_calculation: {
    party: "charterer",
    total_usd: 62000.0,
    audit_trace: [
        {
          step: 1,
          description: "BEFORE_NOR: NOR tendered",
          value_usd: 0,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "NOR Tendered Notice of Readiness tendered at port limits.",
            bbox: null,
          },
          clause_citation: null,
        },
        {
          step: 2,
          description: "BEFORE_NOR: NOR accepted; laytime starts at 2026-06-10T20:00:00",
          value_usd: 0,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "NOR accepted by port authority.",
            bbox: null,
          },
          clause_citation: null,
        },
        {
          step: 3,
          description: "ON_LAYTIME: Laytime commenced",
          value_usd: 0,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "Berth 7. First cargo into Hold 1. Laytime commenced.",
            bbox: null,
          },
          clause_citation: null,
        },
        {
          step: 4,
          description: "ON_DEMURRAGE: LOADING_END",
          value_usd: 0,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "72-hour laytime allowance consumed. Vessel on demurrage.",
            bbox: null,
          },
          clause_citation: null,
        },
        {
          step: 5,
          description: "WEATHER_PAUSE: Weather delay commenced",
          value_usd: 29000,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "Loading hampered by adverse weather. Foreman halted Commenced shore equipment.",
            bbox: null,
          },
          clause_citation: {
            document: "charterparty.pdf",
            page_number: 3,
            excerpt: "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations. This clause is to be interpreted in accordance with the BIMCO Laytime Definitions for Charter Parties, 2013.",
            bbox: null,
          },
        },
        {
          step: 6,
          description: "ON_DEMURRAGE: Weather delay ended; ACTUAL_PERIOD basis",
          value_usd: 29000,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "Conditions moderated. 12 hours weather delay logged.",
            bbox: null,
          },
          clause_citation: {
            document: "charterparty.pdf",
            page_number: 3,
            excerpt: "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations. This clause is to be interpreted in accordance with the BIMCO Laytime Definitions for Charter Parties, 2013.",
            bbox: null,
          },
        },
        {
          step: 7,
          description: "WEATHER_PAUSE: Weather delay commenced",
          value_usd: 46000,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "Crane operations suspended. Commenced",
            bbox: null,
          },
          clause_citation: {
            document: "charterparty.pdf",
            page_number: 3,
            excerpt: "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations. This clause is to be interpreted in accordance with the BIMCO Laytime Definitions for Charter Parties, 2013.",
            bbox: null,
          },
        },
        {
          step: 8,
          description: "ON_DEMURRAGE: Weather delay ended; ACTUAL_PERIOD basis",
          value_usd: 46000,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "12 hours weather delay logged.",
            bbox: null,
          },
          clause_citation: {
            document: "charterparty.pdf",
            page_number: 3,
            excerpt: "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations. This clause is to be interpreted in accordance with the BIMCO Laytime Definitions for Charter Parties, 2013.",
            bbox: null,
          },
        },
        {
          step: 9,
          description: "WEATHER_PAUSE: Weather delay commenced",
          value_usd: 58000,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "Severe gale, Force 7, heavy rain. Loading suspended on Master's instruction.",
            bbox: null,
          },
          clause_citation: {
            document: "charterparty.pdf",
            page_number: 3,
            excerpt: "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations. This clause is to be interpreted in accordance with the BIMCO Laytime Definitions for Charter Parties, 2013.",
            bbox: null,
          },
        },
        {
          step: 10,
          description: "ON_DEMURRAGE: Weather delay ended; ACTUAL_PERIOD basis",
          value_usd: 58000,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "Conditions moderated. 36 hours heavy weather logged.",
            bbox: null,
          },
          clause_citation: {
            document: "charterparty.pdf",
            page_number: 3,
            excerpt: "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations. This clause is to be interpreted in accordance with the BIMCO Laytime Definitions for Charter Parties, 2013.",
            bbox: null,
          },
        },
        {
          step: 11,
          description: "ON_DEMURRAGE: LOADING_END",
          value_usd: 62000,
          citation: {
            document: "sof_charterer.pdf",
            page_number: 1,
            excerpt: "All hatches closed.",
            bbox: null,
          },
          clause_citation: null,
        },
    ],
  },
  day_verdicts: [
      {
        date: "2026-06-14",
        owner_position: "The Owner claims the whole 12 hours as demurrage. The Owner's case is that the records do not reach the threshold over the claimed period, so the exception does not take these hours off the vessel's demurrage. The threshold applied is Beaufort Force 6 (or 2 mm/h precipitation), stated in the weather-exception clause (page 3) — this charterparty's own term. The port records for the claimed period show peak Beaufort Force 5 with 0.4 mm/h precipitation over 12 hours.",
        charterer_position: "The Charterer claims the 12 hours it logged as a weather delay as time lost on account of weather under the charterparty's weather clause. The window is the delay the Charterer's own Statement of Facts records, and the port records for those hours corroborate it: peak Beaufort Force 5 with 0.4 mm/h precipitation over the claimed period. The Charterer says those hours are therefore excepted from laytime.",
        weather: {
          date: "2026-06-14",
          wind_force_beaufort: 5,
          precipitation_mm: 0.4,
          adverse_hours: 0.0,
          is_excepted: false,
        },
        bimco_clause: {
          clause_id: "CP_WEATHER.MAJORITY_OF_HOURS",
          clause_text: "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations. This clause is to be interpreted in accordance with the BIMCO Laytime Definitions for Charter Parties, 2013.",
          source_document: "charterparty.pdf",
          page_number: 3,
        },
        measurement_basis: "Laytime Definitions for Charter Parties 2013, definition 16",
        verdict: "owner",
        winner_label: "Owner position better supported",
        dollars_credited_usd: 25000.0,
        justification: "Weather records show 0 of the 12 observed hours at or above the charterparty's weather-working threshold of Beaufort Force 6 (or precipitation of 2 mm/h), stated in the weather-exception clause (page 3) (peak: Force 5) — short of a majority. The strict-majority test applied here is this product's own policy reading the charterparty clause, not a test drawn from the Laytime Definitions. The measurement basis for an excepted period is Laytime Definitions for Charter Parties 2013, definition 16.",
      },
      {
        date: "2026-06-15",
        owner_position: "The Owner claims the whole 12 hours as demurrage. The Owner's case is that the records do not reach the threshold over the claimed period, so the exception does not take these hours off the vessel's demurrage. The threshold applied is Beaufort Force 6 (or 2 mm/h precipitation), stated in the weather-exception clause (page 3) — this charterparty's own term. The port records for the claimed period show peak Beaufort Force 4 with 0.1 mm/h precipitation over 12 hours.",
        charterer_position: "The Charterer claims the 12 hours it logged as a weather delay as time lost on account of weather under the charterparty's weather clause. The window is the delay the Charterer's own Statement of Facts records, and the port records for those hours corroborate it: peak Beaufort Force 4 with 0.1 mm/h precipitation over the claimed period. The Charterer says those hours are therefore excepted from laytime.",
        weather: {
          date: "2026-06-15",
          wind_force_beaufort: 4,
          precipitation_mm: 0.1,
          adverse_hours: 0.0,
          is_excepted: false,
        },
        bimco_clause: {
          clause_id: "CP_WEATHER.MAJORITY_OF_HOURS",
          clause_text: "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations. This clause is to be interpreted in accordance with the BIMCO Laytime Definitions for Charter Parties, 2013.",
          source_document: "charterparty.pdf",
          page_number: 3,
        },
        measurement_basis: "Laytime Definitions for Charter Parties 2013, definition 16",
        verdict: "owner",
        winner_label: "Owner position better supported",
        dollars_credited_usd: 25000.0,
        justification: "Weather records show 0 of the 12 observed hours at or above the charterparty's weather-working threshold of Beaufort Force 6 (or precipitation of 2 mm/h), stated in the weather-exception clause (page 3) (peak: Force 4) — short of a majority. The strict-majority test applied here is this product's own policy reading the charterparty clause, not a test drawn from the Laytime Definitions. The measurement basis for an excepted period is Laytime Definitions for Charter Parties 2013, definition 16.",
      },
      {
        date: "2026-06-16",
        owner_position: "The Owner claims the whole 36 hours as demurrage. The Owner's case is that a majority of the observed hours reaching the threshold is not a finding that every claimed hour was a period during which weather interrupted work, and a laytime exception does not of itself suspend the accrual of demurrage. The threshold applied is Beaufort Force 6 (or 2 mm/h precipitation), stated in the weather-exception clause (page 3) — this charterparty's own term. The port records for the claimed period show peak Beaufort Force 7 with 5.6 mm/h precipitation over 36 hours.",
        charterer_position: "The Charterer claims the 36 hours it logged as a weather delay as time lost on account of weather under the charterparty's weather clause. The window is the delay the Charterer's own Statement of Facts records, and the port records for those hours corroborate it: peak Beaufort Force 7 with 5.6 mm/h precipitation over the claimed period. The Charterer says those hours are therefore excepted from laytime. The threshold applied is Beaufort Force 6 (or 2 mm/h precipitation), stated in the weather-exception clause (page 3) — this charterparty's own term.",
        weather: {
          date: "2026-06-16",
          wind_force_beaufort: 7,
          precipitation_mm: 5.6,
          adverse_hours: 36.0,
          is_excepted: true,
        },
        bimco_clause: {
          clause_id: "CP_WEATHER.MAJORITY_OF_HOURS",
          clause_text: "Time lost on account of weather shall not count as laytime, provided that such weather actually prevented loading operations. This clause is to be interpreted in accordance with the BIMCO Laytime Definitions for Charter Parties, 2013.",
          source_document: "charterparty.pdf",
          page_number: 3,
        },
        measurement_basis: "Laytime Definitions for Charter Parties 2013, definition 16",
        verdict: "charterer",
        winner_label: "Charterer position better supported",
        dollars_credited_usd: 0.0,
        justification: "Weather records show all 36 of the 36 observed hours met or exceeded the charterparty's weather-working threshold of Beaufort Force 6 (or precipitation of 2 mm/h), stated in the weather-exception clause (page 3), and at least one of those hours records that loading operations were prevented. The whole of the claimed period is therefore excepted from laytime, because a majority of the observed hours met the threshold — that share test is this product's own policy against the charterparty clause, and it is not a test drawn from the Laytime Definitions, so a majority of hours is not a finding that every claimed hour was an interrupted period. The measurement basis for the excluded period is Laytime Definitions for Charter Parties 2013, definition 16.",
      },
  ],
  reconciled_total_usd: 112000.0,
  math_breakdown: "$62,000 (charterer base) + $50,000 (items favouring the owner's position) = $112,000",
};

export const MOCK_VOYAGES: VoyageSummary[] = [
  {
    voyage_id: "voyage_001",
    created_at: "2026-06-16T00:00:00.000000+00:00",
    vessel_name: MOCK_RECONCILIATION.charterparty.vessel_name,
    owner_name: MOCK_RECONCILIATION.charterparty.owner_name,
    charterer_name: MOCK_RECONCILIATION.charterparty.charterer_name,
    status: "Reconciled",
    owner_total_usd: MOCK_RECONCILIATION.owner_calculation.total_usd,
    charterer_total_usd: MOCK_RECONCILIATION.charterer_calculation.total_usd,
    reconciled_total_usd: MOCK_RECONCILIATION.reconciled_total_usd,
    disputed_count: MOCK_RECONCILIATION.day_verdicts.length,
  },
];

/**
 * Fallback rows for the list pages. `voyage_001` mirrors the recorded pipeline
 * output; `voyage_002`…`voyage_007` are sample rows that exist only to give
 * those pages something to draw when the API is unreachable — no voyage with
 * those ids has been analysed.
 */
export const MOCK_RECONCILIATIONS: ReconciliationSummary[] = [
  {
    voyage_id: "voyage_001",
    created_at: "2026-06-16T00:00:00.000000+00:00",
    vessel_name: MOCK_RECONCILIATION.charterparty.vessel_name,
    owner_name: MOCK_RECONCILIATION.charterparty.owner_name ?? "Not extracted",
    charterer_name: MOCK_RECONCILIATION.charterparty.charterer_name,
    status: "Reconciled",
    owner_total_usd: MOCK_RECONCILIATION.owner_calculation.total_usd,
    charterer_total_usd: MOCK_RECONCILIATION.charterer_calculation.total_usd,
    reconciled_total_usd: MOCK_RECONCILIATION.reconciled_total_usd,
    disputed_count: MOCK_RECONCILIATION.day_verdicts.length,
  },
  {
    voyage_id: "voyage_002",
    created_at: "2026-06-14T00:00:00.000000+00:00",
    vessel_name: "MV Baltic Dawn",
    owner_name: "Baltic Shipping Co.",
    charterer_name: "North Sea Logistics",
    status: "Reconciled",
    owner_total_usd: 245000,
    charterer_total_usd: 98000,
    reconciled_total_usd: 171000,
    disputed_count: 5,
  },
  {
    voyage_id: "voyage_003",
    created_at: "2026-06-10T00:00:00.000000+00:00",
    vessel_name: "MV Caspian Voyager",
    owner_name: "Caspian Sea Lines",
    charterer_name: "Trans-Eurasian Freight",
    status: "In Review",
    owner_total_usd: 320000,
    charterer_total_usd: 195000,
    reconciled_total_usd: 265000,
    disputed_count: 7,
  },
  {
    voyage_id: "voyage_004",
    created_at: "2026-06-05T00:00:00.000000+00:00",
    vessel_name: "MV Diamond Spirit",
    owner_name: "Diamond Tankers",
    charterer_name: "Global Petrochem",
    status: "Reconciled",
    owner_total_usd: 92000,
    charterer_total_usd: 92000,
    reconciled_total_usd: 92000,
    disputed_count: 2,
  },
  {
    voyage_id: "voyage_005",
    created_at: "2026-05-28T00:00:00.000000+00:00",
    vessel_name: "MV Emerald Bay",
    owner_name: "Emerald Maritime",
    charterer_name: "Pacific Carriers Ltd",
    status: "Closed",
    owner_total_usd: 156000,
    charterer_total_usd: 134000,
    reconciled_total_usd: 148000,
    disputed_count: 4,
  },
  {
    voyage_id: "voyage_006",
    created_at: "2026-05-20T00:00:00.000000+00:00",
    vessel_name: "MV Fjord Princess",
    owner_name: "Fjord Shipping",
    charterer_name: "Nordic Bulk",
    status: "Reconciled",
    owner_total_usd: 275000,
    charterer_total_usd: 110000,
    reconciled_total_usd: 198000,
    disputed_count: 6,
  },
  {
    voyage_id: "voyage_007",
    created_at: "2026-05-12T00:00:00.000000+00:00",
    vessel_name: "MV Golden Horizon",
    owner_name: "Golden Star Lines",
    charterer_name: "Sunrise Logistics",
    status: "Closed",
    owner_total_usd: 82000,
    charterer_total_usd: 82000,
    reconciled_total_usd: 82000,
    disputed_count: 0,
  },
];

// ─── API functions ────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload voyage documents to the backend.
 * In mock mode, waits 1 second and returns a canned response.
 */
export async function uploadVoyageFiles(
  files: File[]
): Promise<UploadResponse> {
  if (USE_MOCK) {
    await sleep(1200);
    return { voyage_id: "voyage_001", status: "ready" };
  }

  const form = new FormData();
  files.forEach((f) => form.append("files", f));

  const res = await fetch(`${API_BASE_URL}/voyages`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<UploadResponse>;
}

/**
 * Fetch full voyage detail (extraction + reconciliation).
 * In mock mode returns the MOCK_RECONCILIATION oracle.
 */
export async function fetchVoyageDetail(
  voyageId: string
): Promise<VoyageDetailResponse> {
  let data: VoyageDetailResponse;
  if (USE_MOCK) {
    await sleep(600);
    data = JSON.parse(JSON.stringify({
      reconciliation: MOCK_RECONCILIATION,
      pdf_urls: {
        "charterparty.pdf": "/mock-pdfs/charterparty.pdf",
        "sof_owner.pdf": "/mock-pdfs/sof_owner.pdf",
        "sof_charterer.pdf": "/mock-pdfs/sof_charterer.pdf",
      },
    })) as VoyageDetailResponse;
  } else {
    const res = await fetch(`${API_BASE_URL}/voyages/${voyageId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch voyage: ${res.status}`);
    }
    data = await res.json() as VoyageDetailResponse;
  }

  // Normalize clause_id for all clauses if they are generic (e.g., "clause-0")
  if (data.reconciliation?.charterparty?.clauses) {
    data.reconciliation.charterparty.clauses = data.reconciliation.charterparty.clauses.map((clause, idx) => {
      const clauseId = clause.clause_id;
      if (!clauseId || /^clause-\d+$/i.test(clauseId)) {
        const clauseText = clause.clause_text ?? "";
        const match = clauseText.match(/^\s*(clause\s+\d+(?:\.\d+)*)/i);
        if (match) {
          const matchedStr = match[1].trim();
          clause.clause_id = matchedStr.charAt(0).toUpperCase() + matchedStr.slice(1);
        } else {
          const numMatch = clauseText.match(/^\s*(\d+(?:\.\d+)*)/);
          if (numMatch) {
            clause.clause_id = `Clause ${numMatch[1].trim()}`;
          } else {
            clause.clause_id = `Clause ${idx + 1}`;
          }
        }
      }
      return clause;
    });
  }

  return data;
}

/**
 * Fetch dashboard voyage summaries.
 */
export async function fetchVoyages(): Promise<VoyageSummary[]> {
  if (USE_MOCK) {
    await sleep(400);
    return MOCK_VOYAGES;
  }

  const res = await fetch(`${API_BASE_URL}/voyages`);
  if (!res.ok) {
    throw new Error(`Failed to fetch voyages: ${res.status}`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("The voyage list response was not a list.");
  }
  return data as VoyageSummary[];
}

/**
 * Poll /voyages/{id}/status until status is "ready" or "error".
 * Calls onMessage with each status message as it arrives.
 *
 * The interval has to be well under the pipeline's own runtime. Measured
 * against a warm API the whole run lands in ~30 ms and a cold one in ~1.1 s,
 * while the backend overwrites its status row on every graph node, so all
 * seven node messages are gone before a 1.5 s sampler can see a second one.
 * Callers should treat onMessage as "the latest thing the server said", not
 * as a progress stream; consecutive duplicates are suppressed.
 */
export async function pollVoyageStatus(
  voyageId: string,
  onMessage: (msg: string) => void,
  intervalMs = 250
): Promise<void> {
  if (USE_MOCK) {
    const steps = [
      "Parsing documents…",
      "Extracting charterparty terms (LLM)…",
      "Extracting owner SOF events (LLM)…",
      "Extracting charterer SOF events (LLM)…",
      "Calculating owner laytime & demurrage…",
      "Calculating charterer laytime & demurrage…",
      "Assessing weather exceptions…",
      "Reconciling positions…",
    ];
    for (const step of steps) {
      onMessage(step);
      await sleep(400);
    }
    return;
  }

  let lastMessage: string | null = null;
  while (true) {
    const res = await fetch(`${API_BASE_URL}/voyages/${voyageId}/status`);
    if (!res.ok) {
      // The id comes from POST /voyages, so it can 404 if the row was deleted
      // mid-poll. Without this the loop would spin forever.
      const text = await res.text();
      throw new Error(`Failed to poll voyage status: ${res.status} ${text}`);
    }
    const data = await res.json() as { status: string; message: string };
    if (data.message !== lastMessage) {
      lastMessage = data.message;
      onMessage(data.message);
    }
    if (data.status === "ready") return;
    if (data.status === "error") throw new Error(data.message);
    await sleep(intervalMs);
  }
}

/**
 * Fetch reconciliation summaries (list page) with pagination.
 */
export async function fetchReconciliations(
  page = 1,
  perPage = 10
): Promise<PaginatedResponse<ReconciliationSummary>> {
  if (USE_MOCK) {
    await sleep(400);
    const start = (page - 1) * perPage;
    const items = MOCK_RECONCILIATIONS.slice(start, start + perPage);
    return {
      items,
      total: MOCK_RECONCILIATIONS.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(MOCK_RECONCILIATIONS.length / perPage),
    };
  }

  const res = await fetch(
    `${API_BASE_URL}/reconciliations?page=${page}&per_page=${perPage}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch reconciliations: ${res.status}`);
  }
  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null || !Array.isArray((data as { items?: unknown }).items)) {
    throw new Error("The reconciliation list response carried no items array.");
  }
  return data as PaginatedResponse<ReconciliationSummary>;
}

/**
 * Delete a reconciliation.
 */
export async function deleteReconciliation(
  voyageId: string
): Promise<void> {
  if (USE_MOCK) {
    await sleep(200);
    return;
  }

  const res = await fetch(`${API_BASE_URL}/reconciliations/${voyageId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete failed: ${res.status} ${text}`);
  }
}

/**
 * Delete a voyage.
 */
export async function deleteVoyage(voyageId: string): Promise<void> {
  if (USE_MOCK) {
    await sleep(200);
    return;
  }

  const res = await fetch(`${API_BASE_URL}/voyages/${voyageId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete failed: ${res.status} ${text}`);
  }
}

/**
 * Manually override a voyage's status.
 */
export async function updateVoyageStatus(
  voyageId: string,
  status: SettableVoyageStatus
): Promise<void> {
  if (USE_MOCK) {
    await sleep(200);
    return;
  }

  const res = await fetch(`${API_BASE_URL}/voyages/${voyageId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Status update failed: ${res.status} ${text}`);
  }
}

/**
 * Format a USD value as a display string.
 *
 * A `null` total is the API saying it never measured the figure, so it prints
 * as an em dash. `Intl` would render it as `$0`, which asserts a number the
 * pipeline never produced.
 */
export function formatUsd(amount: number | null | undefined): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Advisory label for a day assessment.
 *
 * `DayVerdict.winner_label` arrives from the API as "Owner position better
 * supported" / "Charterer position better supported" (adapters.py:158). It is
 * derived here from the wire `verdict` field rather than echoed, so the UI copy
 * stays under this repo's control. The wire field itself is untouched.
 */
export function assessmentLabel(verdict: Verdict): string {
  switch (verdict) {
    case "owner":
      return "Owner position better supported";
    case "charterer":
      return "Charterer position better supported";
    default:
      return "Split — requires manual review";
  }
}
