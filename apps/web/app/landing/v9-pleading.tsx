import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
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
 * Variant 9 — Pleading.
 *
 * The paper a document is *filed* on, as opposed to the newspaper it is
 * *printed* in (`v3-gazette`). Pleading paper is numbered down the left margin,
 * split from the body by a double vertical rule, with a red margin rule further
 * out, and its body is a run of numbered paragraphs. One continuous paragraph
 * sequence runs from the two claims, through the reconciled figure and the
 * method, and on through what this build does not do.
 *
 * The palette is forced light and self-contained — literal `bg` and `text` on
 * the root, identical in both app themes, and no `.dark` variant written
 * anywhere in this file, so the sheet reads the same either way. The theme
 * toggle is deliberately absent: a filed document does not come in two ink
 * weights.
 *
 * The numbered margin aligns to the text the way printed pleading paper aligns
 * it. The opening sheet is set on a fixed 1.75rem line grid and every block
 * inside it is a whole number of those lines tall, so line *n* of the margin
 * sits on line *n* of the text. Rules that would break that grid are drawn with
 * inset box-shadows, which paint without occupying layout. Below `sm` the
 * gutter is dropped outright and the margin survives as a single hairline, so a
 * 375px viewport never scrolls sideways.
 */

/** Twenty-eight numbered lines — the margin of one sheet of pleading paper. */
const LINE_NUMBERS: ReadonlyArray<number> = Array.from(
  { length: 28 },
  (_, i) => i + 1,
);

/**
 * One continuous paragraph sequence. The first three paragraphs are the two
 * claims and the figure that reconciles them; the rest run on through the
 * sections below. The numbering is derived from the content's own lengths, so
 * a step or a build note added to `content.ts` renumbers the sequence instead
 * of desynchronising it. It is drawn as content rather than carried by an
 * ordered list, because most of these paragraphs are not a sequence; `STEPS`
 * is, and its `<ol start>` carries the same number this arithmetic produces.
 */
const THRESHOLD_NO = 4;
const STEP_FIRST = THRESHOLD_NO + 1;
const RUNS_FIRST = STEP_FIRST + STEPS.length;
const ABSENT_FIRST = RUNS_FIRST + RUNS.length;

/**
 * A focus ring that actually paints. Tailwind's outline-suppressing utility
 * must not appear here: it sets `--tw-outline-style: none` on the same element,
 * and `outline-2` reads that variable back through
 * `outline-style: var(--tw-outline-style)`, so the two cancel and not one ring
 * pixel is drawn. The ring is the ink, not the legal-pad red — a red ring on
 * the red margin rule is 1.19:1, and ink reads 14.22:1 on the `#e7dfcf` pad
 * and 17.60:1 on the paper.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#14110c]";
const PRESS =
  "transition-transform duration-150 ease-out motion-reduce:transition-none active:scale-[0.98]";
/**
 * Signed signage type at `/70`: `/55` measured 4.08:1 on the paper and 3.84:1
 * on the pad, both under the 4.5:1 that 10px text owes. `/70` measures 6.83:1
 * and 6.16:1, and is the ink the file already uses for its secondary text.
 */
const LABEL =
  "font-plex-mono text-[0.625rem] font-medium tracking-[0.2em] text-[#14110c]/70 uppercase";
/** The same at the size that fits a two-column stacked table cell at 375px. */
const LABEL_XS =
  "font-plex-mono text-[0.5625rem] font-medium tracking-[0.18em] text-[#14110c]/70 uppercase";
const HAIRLINE = "border-[#14110c]/20";
const RULE = "border-[#14110c]/40";
/** A rule painted rather than laid out, so the sheet's line grid survives. */
const INK_RULE = "shadow-[inset_0_1px_0_rgba(20,17,12,0.22)]";

/**
 * A numbered pleading paragraph. The number is drawn as content, so it is read
 * — except where the parent list already announces the same position, where
 * `decorativeNumber` keeps the two from being read twice.
 */
function Para({
  n,
  className = "",
  rule = false,
  decorativeNumber = false,
  children,
}: {
  n: number;
  className?: string;
  rule?: boolean;
  decorativeNumber?: boolean;
  children: ReactNode;
}) {
  return (
    <li
      className={`grid list-none grid-cols-[1.375rem_minmax(0,1fr)] gap-x-3 ${className}`}
    >
      {/* `/75` reads 8.18:1 on the paper; `/50` read 3.48:1. */}
      <span
        aria-hidden={decorativeNumber}
        className="font-plex-mono text-[0.6875rem] leading-[1.75rem] tabular-nums text-[#14110c]/75"
      >
        {n}
      </span>
      <div className={`min-w-0 break-words ${rule ? INK_RULE : ""}`}>
        {children}
      </div>
    </li>
  );
}

/** One line of the sheet's 1.75rem grid, whatever it happens to hold. */
function GridLine({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[1.75rem] items-center gap-3 leading-[1.75rem] ${className}`}
    >
      {children}
    </div>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden border border-[#14110c]/20 bg-[#faf7f0] sm:size-9">
        <Image
          src="/logo.png"
          alt=""
          width={30}
          height={30}
          unoptimized
          className="size-6 sm:size-[1.875rem]"
        />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="font-bodoni text-lg font-semibold tracking-[-0.01em]">
          {BRAND.name}
        </span>
        <span className="mt-1 font-plex-mono text-[0.5625rem] tracking-[0.14em] text-[#14110c]/70 uppercase sm:text-[0.625rem] sm:tracking-[0.18em]">
          {BRAND.tagline}
        </span>
      </span>
    </span>
  );
}

/** One day-table cell. The label sits in the cell below `sm` and in the head
 *  above it, so every figure keeps its name at every width and is named once. */
function DayCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <td className="min-w-0 break-words align-top">
      <span className={`block leading-[1.25rem] sm:hidden ${LABEL_XS}`}>
        {label}
      </span>
      <span className="font-plex-mono text-[0.75rem] leading-[1.5rem] tabular-nums">
        {children}
      </span>
    </td>
  );
}

export default function PleadingVariant() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#e7dfcf] font-news text-[#14110c] antialiased selection:bg-[#a8241c]/15">
      <style>{`
        @keyframes pleading-rule {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>

      <a
        href="#pleading-main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:border focus:border-[#14110c]/40 focus:bg-[#faf7f0] focus:px-4 focus:py-3 focus:font-plex-mono focus:text-sm ${FOCUS}`}
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-[#14110c]/25 bg-[#faf7f0]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[68rem] items-center gap-4 pr-5 pl-5 sm:h-[4.5rem] sm:pl-6 sm:pr-10">
          <Link
            href="/"
            className={`inline-flex min-h-11 shrink-0 items-center ${FOCUS}`}
          >
            <Wordmark />
          </Link>

          <nav
            aria-label="Sections"
            className="ml-auto hidden items-center gap-6 md:flex"
          >
            {FOOTER.sectionLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`inline-flex min-h-11 items-center whitespace-nowrap font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#14110c]/70 uppercase hover:text-[#14110c] ${FOCUS} ${PRESS}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <Link
            href="/login"
            className={`ml-auto inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border border-[#14110c]/45 px-4 font-plex-mono text-[0.6875rem] tracking-[0.16em] uppercase hover:bg-[#14110c]/5 md:ml-0 ${FOCUS} ${PRESS}`}
          >
            {CLOSING.portal}
          </Link>
        </div>
      </header>

      {/* `tabIndex` so the skip link actually lands focus here rather than
          leaving it on `<body>`, where the next Tab restarts at the header. */}
      <main id="pleading-main" tabIndex={-1}>
        <article className="relative mx-auto mt-8 w-full max-w-[68rem] bg-[#faf7f0] shadow-[0_1px_2px_rgba(20,17,12,0.10),0_24px_48px_-28px_rgba(20,17,12,0.40)] sm:mt-12">
          {/* The margin: red rule at 12px, double rule at 50 and 54px, body from
              62px. Painted, so the sheet's own grid is untouched. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 sm:block"
          >
            <div className="absolute inset-y-0 left-3 w-px bg-[#a8241c]/70" />
            <div className="absolute inset-y-0 left-[3.125rem] w-px bg-[#14110c]/35" />
            <div className="absolute inset-y-0 left-[3.375rem] w-px bg-[#14110c]/35" />
          </div>

          <div className="border-l-2 border-[#14110c]/15 py-12 pr-5 pl-6 sm:border-l-0 sm:py-16 sm:pl-[3.875rem] sm:pr-10">
            {/* ── Title, above the numbered lines, as on filed paper ─────── */}
            <header className="text-center">
              <p className={LABEL}>{HERO.eyebrow}</p>
              <h1 className="mx-auto mt-5 max-w-[22ch] font-bodoni text-[clamp(1.875rem,1.1rem+3.3vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.015em] text-balance">
                {HERO.heading}
              </h1>
              <div
                aria-hidden="true"
                className="mx-auto mt-7 h-px w-24 bg-[#14110c]/70 motion-safe:[transform-origin:left_center] motion-safe:[animation:pleading-rule_220ms_cubic-bezier(0.23,1,0.32,1)_both]"
              />
            </header>

            {/* ── The numbered sheet ─────────────────────────────────────── */}
            <div className="mt-[3.5rem] sm:grid sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-x-[1.125rem]">
              <div
                aria-hidden="true"
                className="hidden flex-col items-end sm:flex"
              >
                {LINE_NUMBERS.map((n) => (
                  <span
                    key={n}
                    className="flex h-[1.75rem] items-center justify-end font-plex-mono text-[0.625rem] tabular-nums text-[#14110c]/75"
                  >
                    {n}
                  </span>
                ))}
              </div>

              <div className="min-w-0">
                {/* Caption: the matter on the left, the parties on the right.
                    Bordered with inset shadows — a real border would add two
                    pixels to the block and knock the margin out of step. */}
                <table className="w-full table-fixed border-separate border-spacing-0">
                  <caption className="sr-only">
                    The matter and the parties
                  </caption>
                  <tbody>
                    <tr>
                      <td
                        className="h-auto border-0 p-0 align-top shadow-[inset_1px_0_0_rgba(20,17,12,0.28),inset_0_1px_0_rgba(20,17,12,0.28),inset_0_-1px_0_rgba(20,17,12,0.28),inset_1px_0_0_rgba(20,17,12,0.28)] sm:h-[8.75rem]"
                      >
                        <div className="flex h-full flex-col justify-between">
                          <GridLine className={LABEL}>In the matter of</GridLine>
                          <GridLine className="min-w-0 break-words font-plex-mono text-[0.8125rem] tracking-[0.02em] sm:truncate">
                            {BRAND.fixture}
                          </GridLine>
                          <GridLine className="min-w-0 break-words text-[0.9375rem] sm:truncate">
                            {BRAND.vessel}
                          </GridLine>
                          <GridLine className="min-w-0 break-words text-[0.9375rem] sm:truncate">
                            {BRAND.port}
                          </GridLine>
                          <GridLine className="min-w-0 break-words text-[0.9375rem] text-[#14110c]/70 sm:truncate">
                            {BRAND.domain}
                          </GridLine>
                        </div>
                      </td>
                      <td
                        className="h-auto border-0 p-0 align-top shadow-[inset_0_1px_0_rgba(20,17,12,0.28),inset_0_-1px_0_rgba(20,17,12,0.28),inset_1px_0_0_rgba(20,17,12,0.28)] sm:h-[8.75rem]"
                      >
                        <div className="flex h-full flex-col justify-between">
                          <GridLine className={LABEL}>Parties</GridLine>
                          <GridLine className="min-w-0 break-words font-plex-mono text-[0.8125rem] tracking-[0.02em] sm:truncate">
                            {OWNER.party}
                          </GridLine>
                          <GridLine className="min-w-0 break-words text-[0.9375rem] text-[#14110c]/70 sm:truncate">
                            {OWNER.role}
                          </GridLine>
                          <GridLine className="min-w-0 break-words font-plex-mono text-[0.8125rem] tracking-[0.02em] sm:truncate">
                            {CHARTERER.party}
                          </GridLine>
                          <GridLine className="min-w-0 break-words text-[0.9375rem] text-[#14110c]/70 sm:truncate">
                            {CHARTERER.role}
                          </GridLine>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="mt-[3.5rem] text-[clamp(0.9375rem,0.9rem+0.2vw,1.0625rem)] leading-[1.75rem]">
                  {HERO.lede}
                </p>

                {/* ¶1 and ¶2 the two accounts; ¶3 the figure that reconciles
                    them. Two modest figures and one operative one. Three
                    paragraphs is not a sequence, so the list is a plain one
                    and the pleading number is content. */}
                <ul className="mt-[3.5rem] list-none">
                  <Para n={1}>
                    <GridLine className="min-w-0 break-words font-bodoni text-[1.0625rem] font-semibold">
                      {OWNER.party}
                    </GridLine>
                    <GridLine className="min-w-0 break-words text-[0.9375rem] text-[#14110c]/70">
                      {OWNER.role}
                    </GridLine>
                    <GridLine className="min-w-0 flex-wrap gap-x-4 text-[0.9375rem]">
                      <span className="min-w-0 break-words">{OWNER.note}</span>
                      <span className="ml-auto font-plex-mono text-[1.0625rem] tabular-nums">
                        {OWNER.figure}
                      </span>
                    </GridLine>
                  </Para>

                  <Para n={2} className="mt-[1.75rem]" rule>
                    <div className="pt-[1.75rem]">
                      <GridLine className="min-w-0 break-words font-bodoni text-[1.0625rem] font-semibold">
                        {CHARTERER.party}
                      </GridLine>
                      <GridLine className="min-w-0 break-words text-[0.9375rem] text-[#14110c]/70">
                        {CHARTERER.role}
                      </GridLine>
                      <GridLine className="min-w-0 flex-wrap gap-x-4 text-[0.9375rem]">
                        <span className="min-w-0 break-words">
                          {CHARTERER.note}
                        </span>
                        <span className="ml-auto font-plex-mono text-[1.0625rem] tabular-nums">
                          {CHARTERER.figure}
                        </span>
                      </GridLine>
                    </div>
                  </Para>

                  <Para n={3} className="mt-[1.75rem]">
                    {/* Boxed with a shadow, not a border, for the same
                        reason the caption is. */}
                    <div className="p-[1.75rem] shadow-[inset_0_0_0_1px_rgba(20,17,12,0.45)]">
                      <GridLine className="min-w-0 flex-wrap gap-x-4">
                        <span className="font-bodoni text-[1.25rem] font-semibold">
                          {RECONCILED.label}
                        </span>
                        <span className="ml-auto font-plex-mono text-[clamp(1.75rem,1.2rem+2.4vw,2.5rem)] tabular-nums">
                          {RECONCILED.figure}
                        </span>
                      </GridLine>
                      <p className="mt-[1.75rem] text-[0.9375rem] leading-[1.75rem] text-[#14110c]/80">
                        {RECONCILED.arithmetic}
                      </p>
                    </div>
                  </Para>
                </ul>
              </div>
            </div>

            {/* ── The ledger ────────────────────────────────────────────── */}
            <section
              id={LEDGER.anchor}
              aria-labelledby="pleading-ledger"
              className="mt-[5.25rem] border-t-2 border-[#14110c]/50 pt-[1.75rem]"
            >
              <p className={LABEL}>{LEDGER.kicker}</p>
              <h2
                id="pleading-ledger"
                className="mt-3 max-w-[26ch] font-bodoni text-[clamp(1.5rem,1.15rem+1.5vw,2.125rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-balance"
              >
                {LEDGER.heading}
              </h2>

              <dl className="mt-[1.75rem] grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {FIXTURE_FACTS.map(([term, value]) => (
                  <div
                    key={term}
                    className={`min-w-0 border-t ${HAIRLINE} pt-2 pb-3`}
                  >
                    <dt className={LABEL_XS}>{term}</dt>
                    <dd className="mt-1.5 min-w-0 break-words font-plex-mono text-[0.8125rem] leading-[1.375rem] tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Below `sm` each day stacks into one record and its labels move
                  into the cells; from `sm` the table draws as a table. */}
              <table className="mt-[1.75rem] block w-full sm:table sm:table-fixed">
                <colgroup className="hidden sm:table-column-group">
                  <col className="sm:w-[7rem]" />
                  <col className="sm:w-[4.5rem]" />
                  <col className="sm:w-[5rem]" />
                  <col />
                  <col className="sm:w-[6.5rem]" />
                </colgroup>
                <thead className="hidden sm:table-header-group">
                  <tr>
                    {["Date", "Claimed", "Met threshold", "Weather", "Credited"].map(
                      (head) => (
                        <th
                          key={head}
                          scope="col"
                          className={`border-b ${RULE} pr-3 pb-2 text-left align-bottom font-normal ${LABEL}`}
                        >
                          {head}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="block sm:table-row-group">
                  {DISPUTED_DAYS.map((day) => (
                    <tr
                      key={day.date}
                      className={`grid list-none grid-cols-2 gap-x-3 border-t ${HAIRLINE} py-3 sm:table-row sm:border-t-0 sm:py-0`}
                    >
                      <th
                        scope="row"
                        className="col-span-2 min-w-0 break-words pb-2 text-left align-top font-normal sm:table-cell sm:pb-0 sm:pr-3"
                      >
                        <span
                          className={`block leading-[1.25rem] sm:hidden ${LABEL_XS}`}
                        >
                          Date
                        </span>
                        <span className="font-plex-mono text-[0.75rem] leading-[1.5rem] tabular-nums">
                          {day.date}
                        </span>
                      </th>
                      <DayCell label="Claimed">{day.claimed}</DayCell>
                      <DayCell label="Met threshold">{day.adverse}</DayCell>
                      <DayCell label="Weather">{day.weather}</DayCell>
                      <DayCell label="Credited">
                        <span className="block text-[0.625rem] leading-[1.25rem] tracking-[0.14em] text-[#14110c]/70 uppercase">
                          {day.winner === "owner" ? "Owner" : "Charterer"}
                        </span>
                        {day.credited}
                      </DayCell>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="mt-[3.5rem] list-none">
                <Para n={THRESHOLD_NO}>
                  <p className="text-[0.9375rem] leading-[1.75rem] sm:text-[1rem]">
                    {LEDGER.thresholdNote}
                  </p>
                </Para>
              </ul>
            </section>

            {/* ── The method ────────────────────────────────────────────── */}
            <section
              id={METHOD.anchor}
              aria-labelledby="pleading-method"
              className="mt-[5.25rem] border-t-2 border-[#14110c]/50 pt-[1.75rem]"
            >
              <p className={LABEL}>{METHOD.eyebrow}</p>
              <h2
                id="pleading-method"
                className="mt-3 max-w-[30ch] font-bodoni text-[clamp(1.5rem,1.15rem+1.5vw,2.125rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-balance"
              >
                {METHOD.heading}
              </h2>

              {/* The one genuinely ordered content on the sheet. `start` carries the
                  pleading number, so the announced position and the drawn one
                  are the same number and `start` still derives from the length
                  of the paragraphs above. */}
              <ol start={STEP_FIRST} className="mt-[3.5rem] list-none">
                {STEPS.map((step, index) => (
                  <Para
                    key={step.n}
                    n={STEP_FIRST + index}
                    className="mt-[1.75rem] first:mt-0"
                    rule={index > 0}
                    decorativeNumber
                  >
                    <div className="pt-[1.75rem]">
                      <p className="flex min-w-0 flex-wrap items-baseline gap-x-4">
                        <span className="font-bodoni text-[1.0625rem] font-semibold">
                          {step.title}
                        </span>
                        <span className="font-plex-mono text-[0.6875rem] tracking-[0.12em] text-[#14110c]/70">
                          {step.n}
                        </span>
                      </p>
                      <p className="mt-2 min-w-0 break-words text-[0.9375rem] leading-[1.5rem] text-[#14110c]/80">
                        {step.body}
                      </p>
                    </div>
                  </Para>
                ))}
              </ol>
            </section>

            {/* ── The build ─────────────────────────────────────────────── */}
            <section
              id={BUILD.anchor}
              aria-labelledby="pleading-build"
              className="mt-[5.25rem] border-t-2 border-[#14110c]/50 pt-[1.75rem]"
            >
              <p className={LABEL}>{BUILD.eyebrow}</p>
              <h2
                id="pleading-build"
                className="mt-3 max-w-[28ch] font-bodoni text-[clamp(1.5rem,1.15rem+1.5vw,2.125rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-balance"
              >
                {BUILD.heading}
              </h2>

              <div className="mt-[3.5rem] grid grid-cols-1 gap-x-10 gap-y-[1.75rem] md:grid-cols-2">
                <div>
                  <h3 className={`border-b ${RULE} pb-2 ${LABEL}`}>
                    {BUILD.runsHeading}
                  </h3>
                  <ul className="mt-[1.75rem] list-none">
                    {RUNS.map((item, index) => (
                      <Para key={item} n={RUNS_FIRST + index}>
                        <p className="min-w-0 break-words pb-4 text-[0.9375rem] leading-[1.5rem]">
                          {item}
                        </p>
                      </Para>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className={`border-b ${RULE} pb-2 ${LABEL}`}>
                    {BUILD.absentHeading}
                  </h3>
                  {/* Not an ordered sequence — a list of things this build does not
                      do — so it is not announced as "15., 16., 17." The
                      pleading number stays as drawn content. */}
                  <ul className="mt-[1.75rem] list-none">
                    {DOES_NOT_RUN.map((item, index) => (
                      <Para key={item} n={ABSENT_FIRST + index}>
                        <p className="min-w-0 break-words pb-4 text-[0.9375rem] leading-[1.5rem]">
                          {item}
                        </p>
                      </Para>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* ── Closing ───────────────────────────────────────────────── */}
            <section
              aria-labelledby="pleading-closing"
              className="mt-[5.25rem] border-t-2 border-[#14110c]/50 pt-[1.75rem]"
            >
              <h2
                id="pleading-closing"
                className="max-w-[30ch] font-bodoni text-[clamp(1.5rem,1.15rem+1.5vw,2.125rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-balance"
              >
                {CLOSING.heading}
              </h2>
              <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-[58ch] min-w-0 break-words text-[0.9375rem] leading-[1.5rem] text-[#14110c]/80">
                  {CLOSING.body}
                </p>
                <Link
                  href="/login"
                  className={`inline-flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap border border-[#14110c] bg-[#14110c] px-6 font-plex-mono text-[0.6875rem] font-medium tracking-[0.16em] text-[#faf7f0] uppercase hover:bg-[#14110c]/85 ${FOCUS} ${PRESS}`}
                >
                  {CLOSING.cta}
                </Link>
              </div>
            </section>
          </div>
        </article>
      </main>

      <footer className="mt-12 border-t border-[#14110c]/25 sm:mt-16">
        <div className="mx-auto max-w-[68rem] py-12 pr-5 pl-5 sm:py-14 sm:pl-6 sm:pr-10">
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <Wordmark />
              <p className="mt-4 max-w-[42ch] text-[0.875rem] leading-[1.5rem] text-[#14110c]/70">
                {FOOTER.blurb}
              </p>
            </div>

            <nav aria-label="Sections" className="md:col-span-3">
              <h2 className={LABEL}>On this page</h2>
              <ul className="mt-3 list-none space-y-1">
                {FOOTER.sectionLinks.map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      className={`inline-flex min-h-10 items-center font-plex-mono text-[0.6875rem] tracking-[0.14em] text-[#14110c]/70 uppercase hover:text-[#14110c] ${FOCUS} ${PRESS}`}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="md:col-span-4">
              <h2 className={LABEL}>{FOOTER.buildHeading}</h2>
              <ul className="mt-3 list-none space-y-2 text-[0.8125rem] leading-[1.5rem] text-[#14110c]/70">
                {FOOTER.notes.map((note) => (
                  <li key={note} className="flex gap-2.5">
                    <span aria-hidden="true" className="text-[#a8241c]">
                      —
                    </span>
                    <span className="min-w-0 break-words">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-10 border-t border-[#14110c]/20 pt-5 font-plex-mono text-[0.625rem] tracking-[0.16em] text-[#14110c]/70 uppercase">
            {FOOTER.colophon}
          </p>
        </div>
      </footer>
    </div>
  );
}
