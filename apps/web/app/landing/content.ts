/**
 * The single source of truth for every landing page variant.
 *
 * Eleven designs render the same claims from this module. That is the point: a
 * variant that could edit its own copy would be a variant able to invent a
 * figure, a certification, or a customer. Nothing here may be restated, rounded
 * or reworded inside a variant file — only arranged.
 *
 * Every number below is the canonical `voyage_001` result asserted by
 * `apps/api/tests/test_canonical.py` and `test_reconciliation_cases.py`.
 */

export type Side = "owner" | "charterer";

export const BRAND = {
  name: "Keel",
  tagline: "Maritime intelligence",
  domain: "Laytime and demurrage",
  fixture: "voyage_001",
  vessel: "MV Hellenic Pioneer",
  port: "Piraeus",
} as const;

export const OWNER = {
  party: "Aegean Shipping Co.",
  role: "The shipowner's claim",
  note: "laytime exhausted, then demurrage",
  figure: "$187,000",
} as const;

export const CHARTERER = {
  party: "Mediterranean Grains Ltd.",
  role: "The charterer's computation",
  note: "weather excluded on 16 June only",
  figure: "$62,000",
} as const;

export const RECONCILED = {
  figure: "$112,000",
  arithmetic: "$62,000 charterer base plus $50,000 for the items favouring the shipowner. The claim is reduced by $75,000.",
  label: "Reconciled",
} as const;

export const FIXTURE_FACTS: ReadonlyArray<readonly [string, string]> = [
  ["Voyage", "voyage_001"],
  ["Vessel", "MV Hellenic Pioneer"],
  ["Port", "Piraeus"],
  ["Laytime allowed", "72 running hours, Sundays and holidays excepted"],
  ["Demurrage", "$50,000 per running day"],
  ["Weather threshold", "Beaufort 6, or 2.0 mm/h"],
];

export interface DisputedDay {
  date: string;
  claimed: string;
  adverse: string;
  weather: string;
  winner: Side;
  credited: string;
}

export const DISPUTED_DAYS: ReadonlyArray<DisputedDay> = [
  {
    date: "14 Jun 2026",
    claimed: "12 h",
    adverse: "0 of 12",
    weather: "Beaufort 5 · 0.4 mm/h",
    winner: "owner",
    credited: "$25,000",
  },
  {
    date: "15 Jun 2026",
    claimed: "12 h",
    adverse: "0 of 12",
    weather: "Beaufort 4 · 0.1 mm/h",
    winner: "owner",
    credited: "$25,000",
  },
  {
    date: "16 Jun 2026",
    claimed: "36 h",
    adverse: "36 of 36",
    weather: "Beaufort 7 · 5.6 mm/h",
    winner: "charterer",
    credited: "$0",
  },
];

export interface Step {
  n: string;
  title: string;
  body: string;
}

export const STEPS: ReadonlyArray<Step> = [
  {
    n: "01",
    title: "Read",
    body: "The charterparty and both statements of facts are parsed in a separate process under a page and memory limit. A language model extracts the text into fixed schemas and cites the document and page each term came from.",
  },
  {
    n: "02",
    title: "Measure",
    body: "Each party's account runs through the same state machine: before notice of readiness, on laytime, weather pause, on demurrage. Every dollar in this product is arithmetic in that file, not a number a model produced.",
  },
  {
    n: "03",
    title: "Check",
    body: "A validator re-checks the extracted terms and coordinates against each other and can send them back to the worker that produced them, three times at most.",
  },
  {
    n: "04",
    title: "Test and reconcile",
    body: "Every disputed weather window is tested against the threshold the charterparty itself sets, then the difference between the two accounts is reconciled to a single number, shown as the arithmetic behind it.",
  },
  {
    n: "05",
    title: "Draft",
    body: "A settlement letter is rendered as HTML from the reconciled figure, naming the charterparty clause behind every item it settles.",
  },
];

export const HERO = {
  eyebrow: "Laytime and demurrage",
  /**
   * `smoke.spec.ts:6-8` asserts this heading on the default landing page.
   * Changing it breaks the e2e gate.
   */
  heading: "Bringing deterministic arithmetic to a demurrage claim.",
  lede: "Keel reads a charterparty and both parties' statements of facts, runs each account through the same state machine, tests every disputed weather window against the threshold the charterparty itself sets, and reconciles the difference to one number. A language model extracts the text. It never writes a figure.",
} as const;

export const LEDGER = {
  anchor: "ledger",
  heading: "The reconciliation, in full",
  kicker: "Three disputed days",
  thresholdNote:
    "The threshold and the test come from clause 3.2 of the charterparty, page 3: Beaufort 6 or above, or 2.0 mm/h or above. A window is excepted once a majority of its observed hours reach that threshold — Keel's own test, not one the Laytime Definitions supply. What those Definitions do supply is the measurement basis for an excepted period: the actual period of interruption, definition 16 of the Laytime Definitions for Charter Parties 2013.",
} as const;

export const METHOD = {
  anchor: "method",
  eyebrow: "The method",
  heading: "Five steps, and only one of them can produce a dollar.",
} as const;

export const BUILD = {
  anchor: "build",
  eyebrow: "This build",
  heading: "What runs here, and what does not.",
  runsHeading: "Runs in this build",
  absentHeading: "Not in this build",
} as const;

export const RUNS: ReadonlyArray<string> = [
  "An agent graph: an orchestrator, a charterparty worker, a statements-of-facts worker, a validator, the laytime engine, and the step that weighs both positions.",
  "A pure-Python state machine producing every figure on this page.",
  "Per-day verdicts that name the document and page each number was read from.",
  "A settlement letter rendered as HTML from the reconciled figure.",
  "One voyage, the fixture. There is no customer data in this build.",
];

export const DOES_NOT_RUN: ReadonlyArray<string> = [
  "Accounts and sign-in. The entry page sets a flag in your browser; nothing is checked and no account exists.",
  "Sending the letter anywhere. It renders on screen and stops there.",
  "PDF export. The letter endpoint returns HTML only.",
  "A human review step between the calculation and the reconciled figure.",
  "A live weather feed. The port record is a file you supply.",
  "On-screen previews of the source documents. This checkout carries no PDF bytes to draw, though the citations name the document and page.",
];

export const CLOSING = {
  heading: "Explore a reconciled voyage end to end.",
  body: "Inspect the Hellenic Pioneer fixture voyage: parsed Piraeus documentation, dual-party laytime computation, deterministic weather-window testing, and a settlement statement that shows the arithmetic behind every figure.",
  cta: "Explore Platform",
  portal: "Client Portal",
  explainer: "How Keel Works",
} as const;

export const EXPLAINER =
  "Keel automates the full demurrage reconciliation workflow: charterparties and statements of facts are ingested, legal terms and clauses are extracted into strict schemas, a deterministic state machine computes each party's laytime account, and disputed weather windows are evaluated against the specific threshold established in the charterparty. Every figure is traceable back to its underlying document, page, and line citation.";

export const FOOTER = {
  blurb:
    "Laytime and demurrage reconciliation for maritime charterparties. A model reads the documents; the arithmetic is code.",
  buildHeading: "The build",
  notes: [
    "Fixture data, not customer data.",
    "The bundled voyage runs without a key. Extracting from your own documents needs an OpenAI key.",
    "Advisory output, not legal advice.",
  ],
  colophon: "Keel · Maritime Laytime & Demurrage Platform",
  sectionLinks: [
    ["The reconciliation", `#${LEDGER.anchor}`],
    ["The method", `#${METHOD.anchor}`],
    ["This build", `#${BUILD.anchor}`],
  ] as const,
} as const;
