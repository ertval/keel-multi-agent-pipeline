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
 * Variant 11 — Manifest.
 *
 * Port cargo manifest and container-yard signage: stencilled expanded-cap
 * lettering, high-visibility blocks, painted slot grids, hazard tape at the
 * top and bottom edge. Forced light palette set on the root element, so it is
 * byte-identical in the app's light and dark themes.
 *
 * Every figure, day and term comes from `./content`; the only strings typed
 * here are stencil field labels, slot indices and aria text, none of which
 * assert anything.
 */

/** Stencilled display lettering. Uppercase, tight leading, negative tracking. */
const STENCIL =
  "font-archivo-expanded font-extrabold uppercase leading-[0.9] tracking-[-0.03em]";
/** Painted-on small signage type. Labels and codes only, never body copy. */
const MICRO = "font-plex-mono text-[0.625rem] font-medium uppercase tracking-[0.22em]";
/** Figures and slot codes. */
const FIGURE = "font-plex-mono font-semibold tabular-nums";
/**
 * One focus ring for every control, and it is the charcoal.
 *
 * Tailwind's outline-suppressing utility must not appear here: it sets
 * `--tw-outline-style: none` on the same element, and `outline-2` reads that
 * variable back through `outline-style: var(--tw-outline-style)`, so the two
 * cancel and no ring is painted at all.
 *
 * There is deliberately no high-vis variant. The `#f5c518` block is 1.19:1
 * against a `#f5c518` ring, and it holds no focusable element — the reconciled
 * figure, its label and its arithmetic are all text — so no ring can land on
 * it. Charcoal reads 14.24:1 on the concrete, 15.45:1 on the yard panel and
 * 10.90:1 on the yellow, so it covers every surface a control actually sits on
 * or beside.
 */
const FOCUS_INK =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#17181a]";
const PRESS =
  "transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none";
/** Painted hazard tape. Diagonal charcoal on high-vis, flat — no gradient falloff. */
const TAPE =
  "bg-[repeating-linear-gradient(135deg,#17181a_0_10px,#f5c518_10px_20px)]";
/** Painted cell edges for every slot grid. */
const GRID = "border-[#17181a]/25";

const SIDE = { owner: "Owner", charterer: "Charterer" } as const;

/*
 * Signage rust, `text-[#8a3707]`: it was #9c4009 and measured 4.36:1 at 10px —
 * under the 4.5 body threshold — on the six slot-index numerals. #8a3707 is
 * 5.23:1 there, 6.40:1 on the #e8e6e0 concrete and 4.90:1 on the #f5c518 block,
 * so the one value is safe on every ground this file puts it on, hover fill
 * included.
 */
function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden bg-[#f1efe9]">
        <Image
          src="/logo.png"
          alt=""
          width={36}
          height={36}
          unoptimized
          className="size-9"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`${STENCIL} text-lg`}>{BRAND.name}</span>
        <span className={`${MICRO} mt-1.5 text-[#4f5256]`}>{BRAND.tagline}</span>
      </span>
    </span>
  );
}

export default function ManifestVariant() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#e8e6e0] font-sans text-[#17181a] antialiased selection:bg-[#f5c518] selection:text-[#17181a]">
      {/* Sits 24px down so the 2px offset ring clears the 12px hazard tape at the
          top of the page rather than landing on its diagonal stripes. */}
      <a
        href="#manifest-main"
        className={`sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-6 focus:z-50 focus:bg-[#17181a] focus:px-4 focus:py-3 focus:text-[#e8e6e0] ${FOCUS_INK} ${MICRO}`}
      >
        Skip to content
      </a>

      <div aria-hidden="true" className={`h-3 w-full ${TAPE}`} />

      <header className="sticky top-0 z-30 border-b-2 border-[#17181a] bg-[#e8e6e0]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[82rem] items-center gap-6 px-5 sm:h-[4.5rem] sm:px-8">
          <Link
            href="/"
            className={`inline-flex min-h-11 shrink-0 items-center ${FOCUS_INK}`}
          >
            <Wordmark />
          </Link>

          <nav
            aria-label="Sections"
            className="ml-auto hidden items-center gap-7 lg:flex"
          >
            {FOOTER.sectionLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`${STENCIL} inline-flex min-h-11 items-center text-[0.8125rem] tracking-[0.06em] text-[#4f5256] hover:text-[#17181a] ${FOCUS_INK}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <Link
            href="/login"
            className={`${STENCIL} ml-auto inline-flex min-h-11 shrink-0 items-center border-2 border-[#17181a] px-4 text-[0.8125rem] tracking-[0.1em] hover:bg-[#17181a] hover:text-[#e8e6e0] lg:ml-0 ${FOCUS_INK} ${PRESS}`}
          >
            {CLOSING.portal}
          </Link>
        </div>
      </header>

      {/* `tabIndex` so the skip link actually lands focus here rather than
          leaving it on `<body>`, where the next Tab restarts at the header. */}
      <main id="manifest-main" tabIndex={-1}>
        {/* ── Manifest header block ───────────────────────────────────────── */}
        <section className="mx-auto max-w-[82rem] px-5 pb-14 pt-12 sm:px-8 sm:pt-16">
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className={`${MICRO} text-[#8a3707]`}>{HERO.eyebrow}</p>

              <h1
                className={`${STENCIL} mt-6 max-w-[16ch] break-words text-[clamp(2.25rem,1rem+6.4vw,5rem)] text-balance`}
              >
                {HERO.heading}
              </h1>

              <p className="mt-8 max-w-[62ch] text-base leading-relaxed text-pretty text-[#33363a]">
                {HERO.lede}
              </p>

              <Link
                href="/login"
                className={`${STENCIL} mt-10 inline-flex min-h-14 items-center bg-[#17181a] px-8 text-base tracking-[0.06em] text-[#e8e6e0] hover:bg-[#8a3707] ${FOCUS_INK} ${PRESS}`}
              >
                {CLOSING.cta}
              </Link>
            </div>

            <aside className="lg:col-span-4">
              <div className="border-2 border-[#17181a]">
                <div className="flex items-center justify-between bg-[#17181a] px-4 py-2.5">
                  <span className={`${MICRO} text-[#f5c518]`}>
                    Manifest / lot
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-2 w-8 bg-[#e2571f]"
                  />
                </div>
                <div className="bg-[#f1efe9] px-4 py-5">
                  <p
                    className={`${STENCIL} max-w-[10ch] break-words text-[clamp(1.5rem,1rem+2.2vw,2.25rem)]`}
                  >
                    {BRAND.fixture}
                  </p>
                  <dl className="mt-5 space-y-2.5 border-t border-[#17181a]/25 pt-4">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <dt className={`${MICRO} text-[#4f5256]`}>Vessel</dt>
                      <dd className={`${FIGURE} text-[0.8125rem]`}>
                        {BRAND.vessel}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <dt className={`${MICRO} text-[#4f5256]`}>Port</dt>
                      <dd className={`${FIGURE} text-[0.8125rem]`}>
                        {BRAND.port}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </aside>
          </div>

          {/* Painted slot grid: the fixture's own terms. */}
          <div className="mt-14">
            <h2 className={`${MICRO} mb-3 text-[#4f5256]`}>
              Manifest terms · {BRAND.fixture}
            </h2>
            <dl
              className={`grid grid-cols-1 border-l border-t sm:grid-cols-2 lg:grid-cols-3 ${GRID}`}
            >
              {FIXTURE_FACTS.map(([term, value], index) => (
                <div
                  key={term}
                  className={`border-b border-r p-4 sm:p-5 ${GRID}`}
                >
                  <dt className="flex items-baseline gap-3">
                    <span className={`${MICRO} text-[#8a3707]`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold text-[#4f5256]">
                      {term}
                    </span>
                  </dt>
                  <dd
                    className={`${FIGURE} mt-3 break-words text-[0.8125rem] leading-relaxed`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── The reconciliation ──────────────────────────────────────────── */}
        <section
          id={LEDGER.anchor}
          aria-labelledby="manifest-ledger-heading"
          className="border-y-2 border-[#17181a]"
        >
          <div className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
              <div>
                <p className={`${MICRO} text-[#8a3707]`}>{LEDGER.kicker}</p>
                <h2
                  id="manifest-ledger-heading"
                  className={`${STENCIL} mt-4 max-w-[18ch] break-words text-[clamp(1.875rem,1.1rem+3.2vw,3.25rem)] text-balance`}
                >
                  {LEDGER.heading}
                </h2>
              </div>
              <p
                className={`${STENCIL} shrink-0 break-words text-[clamp(1.5rem,1rem+2.4vw,2.5rem)] text-[#8a3707]`}
              >
                {BRAND.fixture}
              </p>
            </div>

            {/* The two painted accounts. */}
            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="border-2 border-[#17181a]">
                <div aria-hidden="true" className="h-2.5 bg-[#f5c518]" />
                <div className="bg-[#17181a] px-5 py-6 text-[#e8e6e0] sm:px-6">
                  <p className={`${MICRO} text-[#f5c518]`}>{OWNER.role}</p>
                  <p
                    className={`${FIGURE} mt-4 break-words text-[clamp(2rem,1rem+3.5vw,3.25rem)] leading-none tracking-[-0.04em]`}
                  >
                    {OWNER.figure}
                  </p>
                  <p className="mt-4 text-sm text-[#a8a49b]">{OWNER.party}</p>
                  <p className="mt-1 text-sm text-[#a8a49b]">{OWNER.note}</p>
                </div>
              </div>

              <div className="border-2 border-[#17181a]">
                <div aria-hidden="true" className="h-2.5 bg-[#17181a]" />
                <div className="bg-[#e2571f] px-5 py-6 sm:px-6">
                  {/* Full-strength charcoal: `/70` read 3.23:1 and `/80` read
                      3.77:1 on the signal orange. `/90` still fails at 4.29:1;
                      opaque measures 4.75:1. */}
                  <p className={`${MICRO} text-[#17181a]`}>
                    {CHARTERER.role}
                  </p>
                  <p
                    className={`${FIGURE} mt-4 break-words text-[clamp(2rem,1rem+3.5vw,3.25rem)] leading-none tracking-[-0.04em]`}
                  >
                    {CHARTERER.figure}
                  </p>
                  <p className="mt-4 text-sm text-[#17181a]">
                    {CHARTERER.party}
                  </p>
                  <p className="mt-1 text-sm text-[#17181a]">
                    {CHARTERER.note}
                  </p>
                </div>
              </div>
            </div>

            {/* Day slots, one painted cell per disputed date. */}
            <div className="mt-14">
              <h3 className={`${MICRO} mb-3 text-[#4f5256]`}>
                Day slots · {LEDGER.kicker}
              </h3>
              <ol
                className={`grid grid-cols-1 border-l border-t sm:grid-cols-3 ${GRID}`}
              >
                {DISPUTED_DAYS.map((day, index) => (
                  <li
                    key={day.date}
                    className={`flex flex-col border-b border-r p-4 sm:p-5 ${GRID}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`${MICRO} text-[#4f5256]`}>
                        Slot {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-8 ${
                          day.winner === "owner" ? "bg-[#f5c518]" : "bg-[#e2571f]"
                        }`}
                      />
                    </div>

                    <p
                      className={`${STENCIL} mt-4 max-w-[12ch] break-words text-[clamp(1.375rem,1rem+1.2vw,1.75rem)]`}
                    >
                      {day.date}
                    </p>

                    <dl className="mt-5 space-y-2.5 border-t border-[#17181a]/25 pt-4">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <dt className={`${MICRO} w-[5.5rem] shrink-0 text-[#4f5256]`}>
                          Claimed
                        </dt>
                        <dd className={`${FIGURE} text-[0.75rem]`}>
                          {day.claimed}
                        </dd>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <dt className={`${MICRO} w-[5.5rem] shrink-0 text-[#4f5256]`}>
                          Adverse
                        </dt>
                        <dd className={`${FIGURE} text-[0.75rem]`}>
                          {day.adverse}
                        </dd>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <dt className={`${MICRO} w-[5.5rem] shrink-0 text-[#4f5256]`}>
                          Weather
                        </dt>
                        <dd
                          className={`${FIGURE} min-w-0 break-words text-[0.75rem]`}
                        >
                          {day.weather}
                        </dd>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <dt className={`${MICRO} w-[5.5rem] shrink-0 text-[#4f5256]`}>
                          Credited
                        </dt>
                        <dd className={`${FIGURE} text-[0.75rem]`}>
                          {day.credited}
                        </dd>
                      </div>
                    </dl>

                    <p
                      className={`${STENCIL} mt-5 flex items-center gap-2 border-t border-[#17181a]/25 pt-4 text-[0.8125rem] tracking-[0.04em]`}
                    >
                      <span
                        aria-hidden="true"
                        className={`size-2.5 shrink-0 ${
                          day.winner === "owner"
                            ? "bg-[#f5c518]"
                            : "bg-[#e2571f]"
                        }`}
                      />
                      {SIDE[day.winner]}
                    </p>
                  </li>
                ))}
              </ol>

              <p className="mt-8 max-w-[78ch] text-sm leading-relaxed text-pretty text-[#33363a]">
                {LEDGER.thresholdNote}
              </p>
            </div>
          </div>

          {/* ── The operative figure. Loudest element on the page. ─────────── */}
          <div className="border-t-2 border-[#17181a] bg-[#f5c518] motion-safe:[animation:fadeIn_200ms_cubic-bezier(0.23,1,0.32,1)_both]">
            <div className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-16">
              <div className="grid grid-cols-1 items-end gap-x-10 gap-y-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <p className={`${MICRO} text-[#17181a]/70`}>
                    {RECONCILED.label}
                  </p>
                  <p
                    className={`${FIGURE} mt-4 break-words text-[clamp(3.25rem,0.9rem+10vw,8.5rem)] font-bold leading-[0.85] tracking-[-0.05em]`}
                  >
                    {RECONCILED.figure}
                  </p>
                </div>
                <p className="max-w-[46ch] text-sm leading-relaxed text-pretty lg:col-span-5">
                  {RECONCILED.arithmetic}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── The method ──────────────────────────────────────────────────── */}
        <section
          id={METHOD.anchor}
          aria-labelledby="manifest-method-heading"
          className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-24"
        >
          <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className={`${MICRO} text-[#8a3707]`}>{METHOD.eyebrow}</p>
              <h2
                id="manifest-method-heading"
                className={`${STENCIL} mt-4 max-w-[16ch] break-words text-[clamp(1.875rem,1.1rem+3.2vw,3.25rem)] text-balance`}
              >
                {METHOD.heading}
              </h2>
            </div>

            <ol
              className={`grid grid-cols-1 border-l border-t md:grid-cols-2 lg:col-span-8 ${GRID}`}
            >
              {STEPS.map((step, index) => (
                <li
                  key={step.n}
                  className={`flex flex-col border-b border-r p-5 sm:p-6 ${
                    index === STEPS.length - 1 ? "md:col-span-2" : ""
                  } ${GRID}`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`${FIGURE} inline-flex size-11 shrink-0 items-center justify-center bg-[#17181a] text-[0.8125rem] text-[#f5c518]`}
                    >
                      {step.n}
                    </span>
                    <h3
                      className={`${STENCIL} max-w-[14ch] break-words text-[clamp(1.375rem,1rem+1.4vw,1.875rem)]`}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-pretty text-[#33363a]">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── This build ──────────────────────────────────────────────────── */}
        <section
          id={BUILD.anchor}
          aria-labelledby="manifest-build-heading"
          className="border-y-2 border-[#17181a] bg-[#f1efe9]"
        >
          <div className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-20">
            <p className={`${MICRO} text-[#8a3707]`}>{BUILD.eyebrow}</p>
            <h2
              id="manifest-build-heading"
              className={`${STENCIL} mt-4 max-w-[20ch] break-words text-[clamp(1.875rem,1.1rem+3.2vw,3.25rem)] text-balance`}
            >
              {BUILD.heading}
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
              <div>
                <h3 className="border-2 border-[#17181a]">
                  <span
                    className={`${MICRO} flex items-center gap-3 bg-[#17181a] px-4 py-2.5 text-[#f5c518]`}
                  >
                    <span aria-hidden="true" className="size-2.5 bg-[#f5c518]" />
                    {BUILD.runsHeading}
                  </span>
                </h3>
                <ul className="mt-4 space-y-3.5">
                  {RUNS.map((item) => (
                    <li
                      key={item}
                      className="grid grid-cols-[0.625rem_1fr] gap-x-3.5"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 size-2.5 bg-[#f5c518] ring-1 ring-[#17181a]"
                      />
                      <span className="text-sm leading-relaxed text-pretty text-[#33363a]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="border-2 border-[#17181a]">
                  <span
                    className={`${MICRO} flex items-center gap-3 bg-[#e2571f] px-4 py-2.5 text-[#17181a]`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 bg-[#17181a]"
                    />
                    {BUILD.absentHeading}
                  </span>
                </h3>
                <ul className="mt-4 space-y-3.5">
                  {DOES_NOT_RUN.map((item) => (
                    <li
                      key={item}
                      className="grid grid-cols-[0.625rem_1fr] gap-x-3.5"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 size-2.5 bg-[#e2571f] ring-1 ring-[#17181a]"
                      />
                      <span className="text-sm leading-relaxed text-pretty text-[#33363a]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Closing sign-off panel ──────────────────────────────────────── */}
        <section className="border-b-2 border-[#17181a] bg-[#17181a] text-[#e8e6e0]">
          <div className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-20">
            <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12">
              <h2
                className={`${STENCIL} max-w-[16ch] break-words text-[clamp(1.875rem,1.1rem+3.2vw,3.25rem)] text-balance lg:col-span-7`}
              >
                {CLOSING.heading}
              </h2>
              <p className="max-w-[46ch] text-sm leading-relaxed text-pretty text-[#a8a49b] lg:col-span-5">
                {CLOSING.body}
              </p>
            </div>
          </div>
        </section>
      </main>

      <div aria-hidden="true" className={`h-3 w-full ${TAPE}`} />

      <footer className="bg-[#e8e6e0]">
        <div className="mx-auto max-w-[82rem] px-5 py-14 sm:px-8">
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <Wordmark />
              <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-pretty text-[#4f5256]">
                {FOOTER.blurb}
              </p>
            </div>

            <nav aria-label="On this page" className="md:col-span-3">
              <h2 className={`${MICRO} text-[#4f5256]`}>On this page</h2>
              <ul className="mt-4 space-y-1">
                {FOOTER.sectionLinks.map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      className={`${STENCIL} inline-flex min-h-11 items-center text-[0.8125rem] tracking-[0.04em] text-[#4f5256] hover:text-[#17181a] ${FOCUS_INK}`}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="md:col-span-4">
              <h2 className={`${MICRO} text-[#4f5256]`}>
                {FOOTER.buildHeading}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#4f5256]">
                {FOOTER.notes.map((note) => (
                  <li key={note} className="border-l-2 border-[#e2571f] pl-3">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p
            className={`${MICRO} mt-12 border-t border-[#17181a]/25 pt-6 text-[#4f5256]`}
          >
            {FOOTER.colophon}
          </p>
        </div>
      </footer>
    </div>
  );
}
