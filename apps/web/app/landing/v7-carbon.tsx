import Image from "next/image";
import Link from "next/link";
import {
  BRAND,
  BUILD,
  CHARTERER,
  CLOSING,
  DISPUTED_DAYS,
  DOES_NOT_RUN,
  FIXTURE_FACTS,
  FOOTER,
  HERO,
  LEDGER,
  METHOD,
  OWNER,
  RECONCILED,
  RUNS,
  STEPS,
} from "./content";

/**
 * Variant 7 — Carbon duplicate.
 *
 * A mimeograph carbon-copy receipt: warm off-white stock, desaturated
 * blue-black ink, dotted and dashed rules instead of solid ones, a perforated
 * edge, a repeated micro-print security strip along one margin, and a
 * detachable duplicate stub at the foot carrying the reconciled figure.
 *
 * The palette is forced light on the root element and is identical in both app
 * themes — this variant deliberately carries no `dark:` variant and renders no
 * `ThemeToggle`, so it is legible whichever theme the workspace is in.
 *
 * Type is mono-forward throughout: IBM Plex Mono for reading, Space Mono for
 * the stencilled display sizes and the stub.
 *
 * Movement is deliberately minimal. The only animation on the page is a single
 * 280ms ease-out feed of the stub, gated behind `motion-safe:`.
 */

/**
 * Palette, applied as literal arbitrary values because Tailwind only sees class
 * names that exist in source:
 *   page      #ded6c2   carbon-tint #d3dbd8   rule   #a99f8a
 *   sheet     #e9e3d4   stub-ink     #20383f   faint #5f5747
 *   ink       #2b2620   body-ink     #3a342c   muted #5b5445
 *   carbon    #2d4a52   stamp        #8a3b2c
 *
 * Every ink above clears 4.5:1 on all three grounds it is used on — page
 * #ded6c2, sheet #e9e3d4 and stub #d3dbd8. `faint` is the floor, and it is the
 * reason the 9px micro-print and the ordinals are legible at all: the inks it
 * replaced measured 2.49:1 on the page (faint) and 2.24:1 on the sheet (the
 * footer's micro-print strip), which is unreadable at 9px.
 *
 * `faint` was 4 steps lighter and measured 4.27:1 on the page grounds
 * #d7cfbc–#d8d0c0 — under the 4.5 body threshold at 9px, on 21 elements.
 * #5f5747 measures 4.60:1 on #d7cfbc, the worst ground, and 4.93:1 on the page
 * proper; it never drops below that on the sheet, the stub or the wordmark chip.
 * It stays the lightest ink on the page: `muted` #5b5445 is still darker, so the
 * ladder is monotone.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#2d4a52]";
const PRESS =
  "transition-[transform,background-color,border-color,color] duration-100 ease-out active:scale-[0.98] motion-reduce:transition-none";

/** Micro-print: 9px, letterspaced, uppercase. Never smaller than legible. */
const MICRO = "text-[0.5625rem] uppercase tracking-[0.28em]";
/** Standard stencilled micro-label. */
const LABEL = "text-[0.625rem] font-medium uppercase tracking-[0.24em]";

/** Dotted perforation: repeating radial-gradient dots, CSS only. */
const PERF: React.CSSProperties = {
  backgroundImage: "radial-gradient(circle, #5f5747 1.5px, transparent 1.7px)",
  backgroundSize: "9px 9px",
  backgroundRepeat: "repeat",
};

/**
 * The torn deckle along the stub's top edge. A single mask layer tiled
 * horizontally: the top-centre semicircle of each 18x10 tile is punched out, so
 * the paper behind shows through in a row of scallops.
 */
const TORN: React.CSSProperties = {
  maskImage: "radial-gradient(circle 5px at 9px 0, transparent 97%, #000 100%)",
  maskSize: "18px 10px",
  maskRepeat: "repeat-x",
};

/** Laid paper: 4px horizontal chain lines, barely there. */
const LAID: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(0deg, rgba(43,38,32,0.035) 0 1px, transparent 1px 4px)",
};

/** Security-print strip. Non-claim strings only: vessel, voyage id, port. */
const STRIP_TEXT = `${BRAND.vessel} · ${BRAND.fixture} · ${BRAND.port} · ${BRAND.name} ·`;

/**
 * The security-print strip. Decorative: the visible copy is `aria-hidden`
 * because it repeats ten times over, and because the same vessel, voyage id and
 * port already appear legibly in the fixture facts above it.
 */
function MicroPrint({
  repeats,
  className,
}: {
  repeats: number;
  className?: string;
}) {
  return (
    <span className={className} aria-hidden="true">
      {Array.from({ length: repeats }, (_, i) => (
        <span key={i}>{STRIP_TEXT}</span>
      ))}
    </span>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden border border-[#5f5747] bg-[#f7f2e6]">
        <Image
          src="/logo.png"
          alt=""
          width={30}
          height={30}
          unoptimized
          className="size-[1.875rem]"
        />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="font-space-mono text-[0.9375rem] font-bold uppercase tracking-[0.2em]">
          {BRAND.name}
        </span>
        {/* The tagline is ~150px wide in the header; below 448px it would push
            the Client Portal link past a 375px viewport, so it drops out here
            and the footer wordmark carries it instead. */}
        <span className={`mt-1.5 hidden min-[28rem]:block ${MICRO} text-[#5b5445]`}>
          {BRAND.tagline}
        </span>
      </span>
    </span>
  );
}

/** Perforated column down the left margin of a sheet. */
function PerfColumn({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={PERF}
      className={`block w-2 shrink-0 border-r border-dashed border-[#a99f8a] ${className ?? ""}`}
    />
  );
}

/** A dotted rule that spans a row. */
function PerfRule({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={PERF}
      className={`block h-2 ${className ?? ""}`}
    />
  );
}

export default function CarbonVariant() {
  return (
    <div
      style={LAID}
      className="min-h-dvh overflow-x-clip bg-[#ded6c2] font-plex-mono text-[#2b2620] antialiased selection:bg-[#2d4a52] selection:text-[#f0e9d8]"
    >
      <a
        href="#carbon-main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:border focus:border-[#2d4a52] focus:bg-[#f7f2e6] focus:px-4 focus:py-3 focus:text-[0.6875rem] focus:font-medium focus:uppercase focus:tracking-[0.2em] ${FOCUS}`}
      >
        Skip to content
      </a>

      <header className="border-b border-dashed border-[#5f5747] bg-[#e9e3d4]">
        <div className="mx-auto flex max-w-[74rem] items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6">
          <Link
            href="/"
            className={`inline-flex min-h-11 shrink-0 items-center ${FOCUS} ${PRESS}`}
          >
            <Wordmark />
          </Link>

          <nav
            aria-label="Sections"
            className="ml-auto hidden items-center gap-6 lg:flex"
          >
            {FOOTER.sectionLinks.map(([label, href], index) => (
              <a
                key={href}
                href={href}
                className={`inline-flex min-h-11 items-center whitespace-nowrap ${MICRO} text-[#5b5445] hover:text-[#2b2620] ${FOCUS} ${PRESS}`}
              >
                <span className="tabular-nums text-[#5f5747]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mx-2" aria-hidden="true">
                  ·
                </span>
                {label}
              </a>
            ))}
          </nav>

          <Link
            href="/login"
            className={`ml-auto inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border border-[#2d4a52] px-3.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[#2d4a52] hover:bg-[#2d4a52] hover:text-[#f0e9d8] lg:ml-0 ${FOCUS} ${PRESS}`}
          >
            {CLOSING.portal}
          </Link>
        </div>
      </header>

      {/* tabIndex={-1} is the skip link's focus target: without it the browser
          scrolls here and leaves activeElement on <body>. */}
      <main id="carbon-main" tabIndex={-1} className="mx-auto max-w-[74rem] px-4 sm:px-6">
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="carbon-hero" className="relative py-10 sm:py-16">
          {/* Micro-print security strip down the right edge. */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-8 overflow-hidden xl:flex">
            <div
              style={{ writingMode: "vertical-rl" }}
              className={`${MICRO} shrink-0 whitespace-nowrap pl-2 text-[#5f5747] tabular-nums`}
            >
              <MicroPrint repeats={10} />
            </div>
          </div>

          <div className="flex gap-4 xl:pr-10">
            <PerfColumn className="my-1 hidden lg:block" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className={`${LABEL} text-[#2d4a52]`}>{HERO.eyebrow}</p>
                <span className="h-px flex-1 bg-[#a99f8a]" aria-hidden="true" />
                <p className={`${MICRO} text-[#5b5445] tabular-nums`}>
                  {BRAND.fixture} · {BRAND.port}
                </p>
              </div>

              <h1
                id="carbon-hero"
                className="mt-6 max-w-[22ch] font-space-mono text-[clamp(1.5rem,0.95rem+2.5vw,3.125rem)] font-bold uppercase leading-[1.08] tracking-[0.01em] text-balance"
              >
                {HERO.heading}
              </h1>

              <p className="mt-7 max-w-[64ch] border-l-2 border-dashed border-[#a99f8a] pl-4 text-[0.8125rem] leading-[1.75] text-pretty text-[#3a342c] sm:text-sm">
                {HERO.lede}
              </p>

              <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {FIXTURE_FACTS.map(([term, value]) => (
                  <div key={term} className="min-w-0 border-t border-dashed border-[#a99f8a] pt-2">
                    <dt className={`${MICRO} text-[#5b5445]`}>{term}</dt>
                    <dd className="mt-1.5 text-[0.8125rem] leading-relaxed break-words tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── LEDGER ───────────────────────────────────────────────────── */}
        <section
          id={LEDGER.anchor}
          aria-labelledby="carbon-ledger"
          className="relative border-t-2 border-[#2b2620] py-10 sm:py-14"
        >
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h2
              id="carbon-ledger"
              className="min-w-0 max-w-[24ch] font-space-mono text-[clamp(1.125rem,0.9rem+1.1vw,1.875rem)] font-bold uppercase leading-[1.15] tracking-[0.01em] text-balance"
            >
              {LEDGER.heading}
            </h2>
            <p className={`${MICRO} shrink-0 text-[#5b5445] tabular-nums`}>
              {BRAND.vessel} · {BRAND.fixture} · {BRAND.port}
            </p>
          </div>

          {/* The two accounts as continuous-form lines. */}
          <ul className="mt-8">
            {[OWNER, CHARTERER].map((account) => {
              const owner = account.role === OWNER.role;
              return (
                <li
                  key={account.role}
                  className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-2 border-t border-dashed border-[#a99f8a] py-5 sm:grid-cols-[1fr_auto] sm:items-baseline"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em]">
                      <span
                        aria-hidden="true"
                        className={
                          owner
                            ? "inline-block size-2.5 shrink-0 bg-[#2d4a52]"
                            : "inline-block size-2.5 shrink-0 border border-dashed border-[#8a3b2c]"
                        }
                      />
                      {account.role}
                    </p>
                    <p className="mt-2 text-[0.75rem] leading-relaxed break-words text-[#5b5445]">
                      {account.party} · {account.note}
                    </p>
                  </div>
                  <p className="font-space-mono text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)] font-bold leading-none tracking-[-0.02em] tabular-nums sm:text-right">
                    {account.figure}
                  </p>
                </li>
              );
            })}
          </ul>

          {/* Disputed days. */}
          <div className="mt-10">
            <div className="flex items-center gap-4">
              <p className={`${LABEL} shrink-0 text-[#2b2620]`}>{LEDGER.kicker}</p>
              <PerfRule className="flex-1" />
            </div>

            <ul className="mt-5">
              {DISPUTED_DAYS.map((day) => (
                <li
                  key={day.date}
                  className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 border-t border-dashed border-[#a99f8a] py-4 lg:grid-cols-[8rem_1fr_10.5rem] lg:items-baseline"
                >
                  <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] tabular-nums">
                    {day.date}
                  </p>

                  <dl className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-2 text-[0.75rem] sm:grid-cols-3">
                    <div className="min-w-0">
                      <dt className={`${MICRO} text-[#5f5747]`}>claimed</dt>
                      <dd className="mt-1 tabular-nums">{day.claimed}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className={`${MICRO} text-[#5f5747]`}>met threshold</dt>
                      <dd className="mt-1 tabular-nums">{day.adverse}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className={`${MICRO} text-[#5f5747]`}>weather</dt>
                      <dd className="mt-1 break-words tabular-nums">{day.weather}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 lg:justify-end">
                    <span className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.18em]">
                      <span
                        aria-hidden="true"
                        className={
                          day.winner === "owner"
                            ? "inline-block size-2.5 shrink-0 bg-[#2d4a52]"
                            : "inline-block size-2.5 shrink-0 border border-dashed border-[#8a3b2c]"
                        }
                      />
                      {day.winner === "owner" ? "Owner" : "Charterer"}
                    </span>
                    <span className="text-[0.8125rem] font-semibold tabular-nums">
                      {day.credited}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 max-w-[74ch] border-l-2 border-dashed border-[#a99f8a] pl-4 text-[0.75rem] leading-[1.75] text-pretty text-[#3a342c]">
              {LEDGER.thresholdNote}
            </p>
          </div>

          {/* Reconciled, in the flow of the ledger. */}
          <div className="mt-10 grid min-w-0 grid-cols-1 gap-x-8 gap-y-3 border-t-2 border-[#2b2620] pt-5 sm:grid-cols-[1fr_auto] sm:items-baseline">
            <div className="min-w-0">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.2em]">
                {RECONCILED.label}
              </p>
              <p className="mt-2 max-w-[54ch] text-[0.75rem] leading-[1.75] text-pretty text-[#5b5445]">
                {RECONCILED.arithmetic}
              </p>
            </div>
            <p className="font-space-mono text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)] font-bold leading-none tracking-[-0.02em] tabular-nums sm:text-right">
              {RECONCILED.figure}
            </p>
          </div>

          {/* ── THE DETACHABLE DUPLICATE ───────────────────────────────── */}
          <div className="mt-12">
            <div className="flex items-center gap-4">
              <PerfRule className="flex-1" />
              <p className={`${MICRO} shrink-0 text-[#5b5445]`}>detach here</p>
              <PerfRule className="flex-1" />
            </div>
            <div className="mt-4 h-px bg-[#7d9295]" />

            <div
              style={TORN}
              className="motion-safe:[animation:fadeIn_0.28s_cubic-bezier(0.23,1,0.32,1)_both] bg-[#d3dbd8] px-4 pt-8 pb-5 sm:px-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-dashed border-[#7d9295] pb-3">
                <p className={`${LABEL} text-[#2d4a52]`}>Duplicate · second copy</p>
                <p className={`${MICRO} text-[#2d4a52] tabular-nums`}>
                  {BRAND.fixture} · {BRAND.port}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
                <p className={`${LABEL} text-[#3f5a60]`}>{RECONCILED.label}</p>
                <p className="font-space-mono text-[clamp(2.25rem,0.9rem+6.4vw,5.25rem)] font-bold leading-[0.9] tracking-[-0.04em] text-[#20383f] tabular-nums">
                  {RECONCILED.figure}
                </p>
              </div>

              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-dashed border-[#7d9295] pt-3">
                {DISPUTED_DAYS.map((day) => (
                  <li
                    key={day.date}
                    className="text-[0.625rem] uppercase tracking-[0.18em] text-[#3c5459] tabular-nums"
                  >
                    {day.date}{" "}
                    <span className="font-semibold text-[#20383f]">
                      {day.credited}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 overflow-hidden">
                <MicroPrint
                  repeats={3}
                  className="block whitespace-nowrap text-[0.5625rem] uppercase tracking-[0.24em] text-[#456066] tabular-nums"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── METHOD ───────────────────────────────────────────────────── */}
        <section
          id={METHOD.anchor}
          aria-labelledby="carbon-method"
          className="relative border-t-2 border-[#2b2620] py-10 sm:py-14"
        >
          <div className="flex gap-4">
            <PerfColumn className="my-1 hidden lg:block" />

            <div className="min-w-0 flex-1">
              <p className={`${MICRO} text-[#2d4a52]`}>{METHOD.eyebrow}</p>
              <h2
                id="carbon-method"
                className="mt-2 max-w-[26ch] font-space-mono text-[clamp(1.125rem,0.9rem+1.1vw,1.875rem)] font-bold uppercase leading-[1.15] tracking-[0.01em] text-balance"
              >
                {METHOD.heading}
              </h2>

              <ol className="mt-8">
                {STEPS.map((step) => (
                  <li
                    key={step.n}
                    className="grid min-w-0 grid-cols-[2.25rem_1fr] gap-x-4 border-t border-dashed border-[#a99f8a] py-5 sm:grid-cols-[3rem_7rem_1fr] sm:gap-x-6"
                  >
                    <span className={`${LABEL} text-[#5f5747] tabular-nums`}>
                      {step.n}
                    </span>
                    <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.18em]">
                      {step.title}
                    </h3>
                    <p className="col-start-2 min-w-0 text-[0.75rem] leading-[1.75] text-pretty text-[#3a342c] sm:col-start-3">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── BUILD ────────────────────────────────────────────────────── */}
        <section
          id={BUILD.anchor}
          aria-labelledby="carbon-build"
          className="relative border-t-2 border-[#2b2620] py-10 sm:py-14"
        >
          <div className="flex gap-4">
            <PerfColumn className="my-1 hidden lg:block" />

            <div className="min-w-0 flex-1">
              <p className={`${MICRO} text-[#2d4a52]`}>{BUILD.eyebrow}</p>
              <h2
                id="carbon-build"
                className="mt-2 max-w-[26ch] font-space-mono text-[clamp(1.125rem,0.9rem+1.1vw,1.875rem)] font-bold uppercase leading-[1.15] tracking-[0.01em] text-balance"
              >
                {BUILD.heading}
              </h2>

              <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
                <div className="min-w-0">
                  <h3 className={`${LABEL} border-b border-[#2b2620] pb-2`}>
                    {BUILD.runsHeading}
                  </h3>
                  <ul className="mt-4 space-y-3.5">
                    {RUNS.map((item) => (
                      <li
                        key={item}
                        className="grid min-w-0 grid-cols-[1rem_1fr] gap-x-2.5"
                      >
                        <span
                          aria-hidden="true"
                          className="pt-0.5 text-[0.75rem] leading-[1.75] text-[#2d4a52]"
                        >
                          +
                        </span>
                        <span className="min-w-0 text-[0.75rem] leading-[1.75] text-pretty text-[#3a342c]">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="min-w-0">
                  <h3 className={`${LABEL} border-b border-[#8a3b2c] pb-2 text-[#8a3b2c]`}>
                    {BUILD.absentHeading}
                  </h3>
                  <ul className="mt-4 space-y-3.5">
                    {DOES_NOT_RUN.map((item) => (
                      <li
                        key={item}
                        className="grid min-w-0 grid-cols-[1rem_1fr] gap-x-2.5"
                      >
                        <span
                          aria-hidden="true"
                          className="pt-0.5 text-[0.75rem] leading-[1.75] text-[#8a3b2c]"
                        >
                          &ndash;
                        </span>
                        <span className="min-w-0 text-[0.75rem] leading-[1.75] text-pretty text-[#3a342c]">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CLOSING ──────────────────────────────────────────────────── */}
        <section
          aria-labelledby="carbon-closing"
          className="relative border-t-2 border-[#2b2620] py-10 sm:py-16"
        >
          <div className="flex gap-4">
            <PerfColumn className="my-1 hidden lg:block" />

            <div className="grid min-w-0 flex-1 grid-cols-1 items-start gap-x-10 gap-y-6 lg:grid-cols-12">
              <div className="min-w-0 lg:col-span-7">
                <h2
                  id="carbon-closing"
                  className="font-space-mono text-[clamp(1.125rem,0.85rem+1.4vw,2.125rem)] font-bold uppercase leading-[1.12] tracking-[0.01em] text-balance"
                >
                  {CLOSING.heading}
                </h2>
              </div>
              <div className="min-w-0 lg:col-span-5">
                <p className="text-[0.75rem] leading-[1.75] text-pretty text-[#3a342c]">
                  {CLOSING.body}
                </p>
                <Link
                  href="/login"
                  className={`mt-6 inline-flex min-h-12 w-full items-center justify-center bg-[#2d4a52] px-6 text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[#f0e9d8] hover:bg-[#20383f] sm:w-auto ${FOCUS} ${PRESS}`}
                >
                  {CLOSING.cta}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-4 border-t border-dashed border-[#5f5747] bg-[#e9e3d4]">
        <div className="mx-auto max-w-[74rem] px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-12">
            <div className="min-w-0 md:col-span-5">
              <Wordmark />
              <p className="mt-4 max-w-[42ch] text-[0.75rem] leading-[1.75] text-pretty text-[#5b5445]">
                {FOOTER.blurb}
              </p>
            </div>

            <nav aria-label="Sections" className="min-w-0 md:col-span-3">
              <h2 className={`${LABEL} text-[0.6875rem]`}>On this sheet</h2>
              <ul className="mt-4 space-y-1">
                {FOOTER.sectionLinks.map(([label, href], index) => (
                  <li key={href}>
                    <a
                      href={href}
                      className={`inline-flex min-h-9 items-center gap-2 text-[0.75rem] text-[#3a342c] hover:text-[#2d4a52] ${FOCUS} ${PRESS}`}
                    >
                      <span className={`${MICRO} text-[#5f5747] tabular-nums`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="min-w-0 md:col-span-4">
              <h2 className={`${LABEL} text-[0.6875rem]`}>{FOOTER.buildHeading}</h2>
              <ul className="mt-4 space-y-2 text-[0.75rem] leading-[1.75] text-[#5b5445]">
                {FOOTER.notes.map((note) => (
                  <li key={note} className="border-t border-dashed border-[#c2b9a4] pt-2">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 overflow-hidden">
            <MicroPrint
              repeats={6}
              className="block whitespace-nowrap text-[0.5625rem] uppercase tracking-[0.28em] text-[#5f5747] tabular-nums"
            />
          </div>

          <p className="mt-4 border-t border-dashed border-[#5f5747] pt-4 text-[0.625rem] uppercase tracking-[0.2em] text-[#5b5445]">
            {FOOTER.colophon}
          </p>
        </div>
      </footer>
    </div>
  );
}
