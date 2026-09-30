import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const LABEL =
  "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";
const HAIRLINE = "border-foreground/15";
const RULE = "border-foreground/30";
const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const PRESS =
  "transition-[transform,background-color,border-color,color] duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none";
const REVEAL =
  "motion-safe:[animation:fadeIn_0.45s_cubic-bezier(0.23,1,0.32,1)_both]";

const FIXTURE_FACTS = [
  ["Voyage", "voyage_001"],
  ["Vessel", "MV Hellenic Pioneer"],
  ["Port", "Piraeus"],
  ["Laytime allowed", "72 running hours, Sundays and holidays excepted"],
  ["Demurrage", "$50,000 per running day"],
  ["Weather threshold", "Beaufort 6, or 2.0 mm/h"],
];

const STEPS = [
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

const RUNS = [
  "An agent graph: an orchestrator, a charterparty worker, a statements-of-facts worker, a validator, the laytime engine, and the step that weighs both positions.",
  "A pure-Python state machine producing every figure on this page.",
  "Per-day verdicts that name the document and page each number was read from.",
  "A settlement letter rendered as HTML from the reconciled figure.",
  "One voyage, the fixture. There is no customer data in this build.",
];

const DOES_NOT_RUN = [
  "Accounts and sign-in. The entry page sets a flag in your browser; nothing is checked and no account exists.",
  "Sending the letter anywhere. It renders on screen and stops there.",
  "PDF export. The letter endpoint returns HTML only.",
  "A human review step between the calculation and the reconciled figure.",
  "A live weather feed. The port record is a file you supply.",
  "On-screen previews of the source documents. This checkout carries no PDF bytes to draw, though the citations name the document and page.",
];

const DISPUTED_DAYS = [
  {
    date: "14 Jun 2026",
    claimed: "12 h",
    adverse: "0 of 12",
    weather: "Beaufort 5 · 0.4 mm/h",
    winner: "Owner",
    credited: "$25,000",
    colour: "owner",
  },
  {
    date: "15 Jun 2026",
    claimed: "12 h",
    adverse: "0 of 12",
    weather: "Beaufort 4 · 0.1 mm/h",
    winner: "Owner",
    credited: "$25,000",
    colour: "owner",
  },
  {
    date: "16 Jun 2026",
    claimed: "36 h",
    adverse: "36 of 36",
    weather: "Beaufort 7 · 5.6 mm/h",
    winner: "Charterer",
    credited: "$0",
    colour: "charterer",
  },
] as const;

const MARGIN_CLASS = "border-l-2 pl-4 sm:pl-5";
const OWNER_RULE = "border-l-[hsl(var(--owner))]";
const CHARTERER_RULE = "border-l-[hsl(var(--charterer))]";
const OWNER_MARK = "bg-[hsl(var(--owner))]";
const CHARTERER_MARK = "bg-[hsl(var(--charterer))]";

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-foreground/15 bg-white">
        <Image
          src="/logo.png"
          alt=""
          width={30}
          height={30}
          unoptimized
          className="size-[1.875rem]"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.0625rem] font-extrabold tracking-[-0.02em]">
          Keel
        </span>
        <span className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Maritime intelligence
        </span>
      </span>
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-foreground selection:bg-[hsl(var(--owner))]/20">
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-20 focus:rounded-sm focus:border focus:border-foreground/30 focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-medium ${FOCUS}`}
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-10 border-b border-foreground/15 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[82rem] items-center gap-6 px-5 sm:h-[4.5rem] sm:px-8">
          <Link
            href="/"
            className={`inline-flex min-h-11 items-center rounded-sm ${FOCUS}`}
          >
            <Wordmark />
          </Link>

          <nav
            aria-label="Sections"
            className="ml-auto hidden items-center gap-6 lg:flex"
          >
            {[
              ["The reconciliation", "#ledger"],
              ["The method", "#method"],
              ["This build", "#build"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`inline-flex min-h-11 items-center whitespace-nowrap text-sm text-muted-foreground hover:text-foreground ${FOCUS} ${PRESS}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <span className="inline-flex min-h-11 min-w-11 items-center justify-center">
              <ThemeToggle />
            </span>
            <Link
              href="/login"
              className={`hidden min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm border border-foreground/30 px-4 text-sm font-medium hover:bg-foreground/5 sm:inline-flex ${FOCUS} ${PRESS}`}
            >
              Client Portal
            </Link>
            <Link
              href="/login"
              className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/85 ${FOCUS} ${PRESS}`}
            >
              Enter Demo Mode
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="mx-auto max-w-[82rem] px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className={`${LABEL} ${REVEAL}`}>Laytime and demurrage</p>

              <h1
                className={`mt-5 max-w-[19ch] font-display text-[clamp(2.375rem,1.35rem+3.9vw,4rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-balance ${REVEAL} motion-safe:[animation-delay:60ms]`}
              >
                Bringing deterministic arithmetic to a demurrage claim.
              </h1>

              <p
                className={`mt-7 max-w-[60ch] text-base leading-relaxed text-pretty text-muted-foreground motion-safe:text-foreground/80 ${REVEAL} motion-safe:[animation-delay:120ms]`}
              >
                Keel reads a charterparty and both parties&apos; statements of
                facts, runs each account through the same state machine, tests
                every disputed weather window against the threshold the
                charterparty itself sets, and reconciles the difference to one
                number. A language model extracts the text. It never writes a
                figure.
              </p>

              <div
                className={`mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center ${REVEAL} motion-safe:[animation-delay:180ms]`}
              >
                <Link
                  href="/login"
                  className={`inline-flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-sm bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/85 ${FOCUS} ${PRESS}`}
                >
                  Enter Demo Mode
                </Link>
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        className={`min-h-12 rounded-sm border-foreground/30 bg-transparent px-6 text-sm hover:bg-foreground/5 hover:text-foreground ${FOCUS} ${PRESS}`}
                      />
                    }
                  >
                    How the Demo Works
                  </DialogTrigger>
                  <DialogContent className="max-w-xl gap-5 p-6">
                    <DialogHeader>
                      <DialogTitle className="font-display text-lg font-semibold">
                        How the demo works
                      </DialogTitle>
                      <DialogDescription>
                        There is no recorded video for this build. In the
                        workspace, open the new-voyage dialog and run the
                        bundled fixture: a charterparty and two statements of
                        facts are parsed, the terms are extracted into fixed
                        schemas, a state machine computes each party&apos;s
                        laytime, and each disputed weather window is tested
                        against the threshold on page 3 of the charterparty.
                        Every figure carries the document and page it was read
                        from.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <DialogClose
                        render={
                          <Button
                            variant="outline"
                            className={`min-h-11 rounded-sm border-foreground/30 ${FOCUS} ${PRESS}`}
                          />
                        }
                      >
                        Close
                      </DialogClose>
                      <Link
                        href="/login"
                        className={`inline-flex min-h-11 items-center justify-center rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 ${FOCUS} ${PRESS}`}
                      >
                        Enter Demo Mode
                      </Link>
                    </div>
                  </DialogContent>
                </Dialog>
                <Link
                  href="/login"
                  className={`inline-flex min-h-11 items-center justify-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground sm:hidden ${FOCUS} ${PRESS}`}
                >
                  Client Portal
                </Link>
              </div>
            </div>

            <aside className="lg:col-span-3 lg:col-start-10">
              <p className={`${LABEL} border-b ${RULE} pb-3`}>
                The fixture
              </p>
              <dl className="mt-4 space-y-4">
                {FIXTURE_FACTS.map(([term, value]) => (
                  <div key={term} className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">{term}</dt>
                    <dd className="font-mono text-[0.8125rem] leading-relaxed tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>

        <section
          id="ledger"
          aria-labelledby="ledger-heading"
          className="border-y border-foreground/15 bg-[hsl(var(--surface-2))]/60"
        >
          <div className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2
                id="ledger-heading"
                className="font-display text-[clamp(1.625rem,1.2rem+1.6vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-balance"
              >
                The reconciliation, in full
              </h2>
              <p className={`${LABEL} shrink-0`}>
                voyage_001 · MV Hellenic Pioneer · Piraeus
              </p>
            </div>

            <div className="mt-10 border-t-2 border-foreground/35">
              <div
                className={`grid grid-cols-1 items-baseline gap-x-8 gap-y-1 border-b ${HAIRLINE} py-5 motion-safe:[animation:fadeIn_0.45s_cubic-bezier(0.23,1,0.32,1)_both] motion-safe:[animation-delay:60ms] sm:grid-cols-[1fr_auto] ${MARGIN_CLASS} ${OWNER_RULE}`}
              >
                <div>
                  <p className="font-display text-lg font-semibold">
                    The shipowner&apos;s claim
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aegean Shipping Co. · laytime exhausted, then demurrage
                  </p>
                </div>
                <p className="font-mono text-[clamp(1.5rem,1.2rem+1.4vw,2rem)] font-medium leading-none tabular-nums sm:text-right">
                  $187,000
                </p>
              </div>

              <div
                className={`grid grid-cols-1 items-baseline gap-x-8 gap-y-1 border-b ${HAIRLINE} py-5 motion-safe:[animation:fadeIn_0.45s_cubic-bezier(0.23,1,0.32,1)_both] motion-safe:[animation-delay:120ms] sm:grid-cols-[1fr_auto] ${MARGIN_CLASS} ${CHARTERER_RULE}`}
              >
                <div>
                  <p className="font-display text-lg font-semibold">
                    The charterer&apos;s computation
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mediterranean Grains Ltd. · weather excluded on 16 June only
                  </p>
                </div>
                <p className="font-mono text-[clamp(1.5rem,1.2rem+1.4vw,2rem)] font-medium leading-none tabular-nums sm:text-right">
                  $62,000
                </p>
              </div>
            </div>

            <div className="mt-12">
              <p className={`${LABEL} border-b ${RULE} pb-3`}>
                Three disputed days
              </p>

              <dl className="mt-2">
                {DISPUTED_DAYS.map((day, index) => (
                  <div
                    key={day.date}
                    className={`grid grid-cols-1 gap-x-8 gap-y-2 border-b ${HAIRLINE} py-5 motion-safe:[animation:fadeIn_0.45s_cubic-bezier(0.23,1,0.32,1)_both] lg:grid-cols-[8rem_1fr_auto] lg:items-baseline`}
                    style={
                      {
                        animationDelay: `${180 + index * 60}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <dt className="font-mono text-sm font-medium tabular-nums">
                      {day.date}
                    </dt>
                    <dd className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-[7.5rem_10.5rem_1fr]">
                      <span>
                        <span className="text-muted-foreground">
                          claimed{" "}
                        </span>
                        <span className="font-mono tabular-nums">
                          {day.claimed}
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">
                          met threshold{" "}
                        </span>
                        <span className="font-mono tabular-nums">
                          {day.adverse}
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">weather </span>
                        <span className="font-mono tabular-nums">
                          {day.weather}
                        </span>
                      </span>
                    </dd>
                    <dd className="flex items-center gap-2 lg:justify-end">
                      <span
                        aria-hidden="true"
                        className={`size-2 shrink-0 ${
                          day.colour === "owner" ? OWNER_MARK : CHARTERER_MARK
                        }`}
                      />
                      <span className="text-sm font-semibold">
                        {day.winner}
                      </span>
                      <span className="font-mono text-sm tabular-nums text-muted-foreground">
                        {day.credited}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-5 max-w-[72ch] text-sm leading-relaxed text-pretty">
                The threshold and the test come from clause 3.2 of the
                charterparty, page 3: Beaufort 6 or above, or 2.0 mm/h or above.
                A window is excepted once a majority of its observed hours reach
                that threshold — Keel&apos;s own test, not one the Laytime
                Definitions supply. What those Definitions do supply is the
                measurement basis for an excepted period: the actual period of
                interruption, definition 16 of the Laytime Definitions for
                Charter Parties 2013.
              </p>
            </div>

            <div className="mt-12 border-t-2 border-foreground/35 pt-6">
              <div className="grid grid-cols-1 items-end gap-x-8 gap-y-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-display text-xl font-semibold">
                    Reconciled
                  </p>
                  <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-pretty">
                    $62,000 charterer base plus $50,000 for the items favouring
                    the shipowner. The claim is reduced by $75,000.
                  </p>
                </div>
                <p className="font-mono text-[clamp(2.5rem,1.2rem+5.4vw,4.5rem)] font-medium leading-[0.9] tracking-[-0.05em] tabular-nums sm:text-right">
                  $112,000
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="method"
          aria-labelledby="method-heading"
          className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-24"
        >
          <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className={LABEL}>The method</p>
              <h2
                id="method-heading"
                className="mt-4 font-display text-[clamp(1.625rem,1.2rem+1.6vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-balance"
              >
                Five steps, and only one of them can produce a dollar.
              </h2>
            </div>

            <ol className="lg:col-span-7 lg:col-start-6">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className={`grid grid-cols-[2.5rem_1fr] gap-x-5 border-t ${HAIRLINE} py-6 sm:grid-cols-[3rem_9rem_1fr] sm:gap-x-6`}
                >
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {step.n}
                  </span>
                  <h3 className="font-display text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="col-start-2 text-sm leading-relaxed text-pretty sm:col-start-3">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="build"
          aria-labelledby="build-heading"
          className="border-y border-foreground/15 bg-[hsl(var(--surface-2))]/60"
        >
          <div className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-20">
            <p className={LABEL}>This build</p>
            <h2
              id="build-heading"
              className="mt-4 max-w-[24ch] font-display text-[clamp(1.625rem,1.2rem+1.6vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-balance"
            >
              What runs here, and what does not.
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
              <div>
                <h3 className="border-b border-foreground/30 pb-3 text-sm font-semibold">
                  Runs in this build
                </h3>
                <ul className="mt-4 space-y-4">
                  {RUNS.map((item) => (
                    <li key={item} className="grid grid-cols-[1rem_1fr] gap-x-3">
                      <span
                        aria-hidden="true"
                        className="pt-0.5 font-mono text-sm leading-6 text-muted-foreground"
                      >
                        +
                      </span>
                      <span className="text-sm leading-relaxed text-pretty">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="border-b border-foreground/30 pb-3 text-sm font-semibold">
                  Not in this build
                </h3>
                <ul className="mt-4 space-y-4">
                  {DOES_NOT_RUN.map((item) => (
                    <li key={item} className="grid grid-cols-[1rem_1fr] gap-x-3">
                      <span
                        aria-hidden="true"
                        className="pt-0.5 font-mono text-sm leading-6 text-muted-foreground"
                      >
                        &ndash;
                      </span>
                      <span className="text-sm leading-relaxed text-pretty">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em] text-balance">
                Run the fixture voyage end to end.
              </h2>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <p className="text-sm leading-relaxed text-pretty">
                The demo parses the bundled Piraeus documents, computes both
                parties&apos; laytime, tests each disputed weather window and
                reconciles the difference. It needs no key and creates no
                account.
              </p>
              <Link
                href="/login"
                className={`mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/85 sm:w-auto ${FOCUS} ${PRESS}`}
              >
                Enter Demo Mode
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-foreground/15">
        <div className="mx-auto max-w-[82rem] px-5 py-14 sm:px-8">
          <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <Wordmark />
              <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-pretty text-muted-foreground">
                Laytime and demurrage reconciliation for maritime
                charterparties. A model reads the documents; the arithmetic is
                code.
              </p>
            </div>

            <nav aria-label="Sections" className="md:col-span-3">
              <h2 className={LABEL}>On this page</h2>
              <ul className="mt-4 space-y-1">
                {[
                  ["The reconciliation", "#ledger"],
                  ["The method", "#method"],
                  ["This build", "#build"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      className={`inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground ${FOCUS} ${PRESS}`}
                    >
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    href="/login"
                    className={`inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground ${FOCUS} ${PRESS}`}
                  >
                    Client Portal
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="md:col-span-4">
              <h2 className={LABEL}>The build</h2>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li>Fixture data, not customer data.</li>
                <li>
                  The bundled voyage runs without a key. Extracting from your own
                  documents needs an OpenAI key.
                </li>
                <li>Advisory output, not legal advice.</li>
              </ul>
            </div>
          </div>

          <p className="mt-12 border-t border-foreground/15 pt-6 text-xs text-muted-foreground">
            Keel · hackathon demo build
          </p>
        </div>
      </footer>
    </div>
  );
}
