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
import {
  BRAND,
  BUILD,
  CLOSING,
  DISPUTED_DAYS,
  DOES_NOT_RUN,
  EXPLAINER,
  FIXTURE_FACTS,
  FOOTER,
  HERO,
  LEDGER,
  METHOD,
  OWNER,
  CHARTERER,
  RECONCILED,
  RUNS,
  STEPS,
} from "./content";

/**
 * Variant 3 — Maritime Broadsheet Gazette.
 *
 * Heavy editorial newsprint: archival cream ground, deep printer's ink,
 * double rules, multi-column broadsheet layout and classical legal
 * typography. The masthead is the brand and nothing else: no issuing body, no
 * volume number, no dateline, and no claim to issue an official act.
 */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-amber-800 dark:focus-visible:outline-amber-400";
const PRESS =
  "transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none";

function GazetteMasthead() {
  return (
    <div className="border-b-4 border-double border-neutral-800/80 dark:border-neutral-200/80 py-6 text-center">
      <div className="flex items-center justify-between text-[0.625rem] font-serif uppercase tracking-[0.25em] text-neutral-600 dark:text-neutral-400 px-2 pb-3 border-b border-neutral-300 dark:border-neutral-700">
        <span>{BRAND.domain.toUpperCase()}</span>
        <span>{BRAND.tagline.toUpperCase()}</span>
        <span>{BRAND.fixture.toUpperCase()}</span>
      </div>

      <div className="py-4">
        <Link href="/" className={`inline-block ${FOCUS}`}>
          <div className="flex items-center justify-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center border-2 border-neutral-900 dark:border-neutral-100 bg-white p-1">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                unoptimized
                className="size-8"
              />
            </span>
            <span className="font-news text-3xl sm:text-5xl font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              {BRAND.name}
            </span>
          </div>
          <div className="mt-1 text-xs font-serif italic text-neutral-600 dark:text-neutral-400">
            Demurrage, laytime and weather claims, measured against the charterparty
          </div>
        </Link>
      </div>

      <div className="flex items-center justify-between text-[0.6875rem] font-serif uppercase tracking-wider text-neutral-700 dark:text-neutral-300 pt-2 border-t border-neutral-300 dark:border-neutral-700">
        <span>PORT: {BRAND.port}</span>
        <span>VESSEL: {BRAND.vessel}</span>
        <span>DISPUTE SETTLEMENT RECORD</span>
      </div>
    </div>
  );
}

export default function GazetteVariant() {
  return (
    <div className="min-h-dvh bg-[#FBF8F2] dark:bg-[#161412] text-[#221F1B] dark:text-[#E8E2D8] font-news selection:bg-amber-900/20 selection:text-amber-950 dark:selection:bg-amber-100/20 dark:selection:text-amber-100 antialiased">
      <a
        href="#main-gazette"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:border-2 focus:border-neutral-900 focus:bg-[#F3ECE2] focus:px-4 focus:py-2 focus:text-sm focus:font-bold ${FOCUS}`}
      >
        Skip to Gazette Ledger
      </a>

      {/* Primary Gazette Navigation */}
      <header className="sticky top-0 z-30 border-b border-neutral-400/60 dark:border-neutral-700 bg-[#FBF8F2]/95 dark:bg-[#161412]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="truncate font-bold text-xs uppercase tracking-wider sm:tracking-widest text-neutral-800 dark:text-neutral-200">
              {BRAND.name} Gazette
            </span>
            <span className="shrink-0 text-neutral-600 dark:text-neutral-400">&bull;</span>
            <span className="shrink-0 text-xs italic text-neutral-600 dark:text-neutral-400 hidden sm:inline">
              Deterministic Laytime
            </span>
          </div>

          <nav aria-label="Gazette Sections" className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider font-sans">
            {FOOTER.sectionLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`hover:underline underline-offset-4 text-neutral-700 dark:text-neutral-300 ${FOCUS}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 px-2 sm:gap-3 sm:px-0">
            <ThemeToggle />
            <Link
              href="/login"
              className={`hidden sm:inline text-xs uppercase tracking-wider font-sans font-semibold border-b border-neutral-800 dark:border-neutral-200 pb-0.5 hover:text-neutral-700 dark:hover:text-neutral-300 ${FOCUS}`}
            >
              {CLOSING.portal}
            </Link>
            <Link
              href="/login"
              className={`inline-flex items-center h-8 px-3.5 border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-sans font-bold uppercase tracking-wider hover:opacity-90 ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <GazetteMasthead />

        <main id="main-gazette" tabIndex={-1} className="py-10">
          {/* Front Page Headline */}
          <section className="border-b-2 border-neutral-800/80 dark:border-neutral-200/80 pb-12">
            <div className="text-center max-w-4xl mx-auto">
              <span className="inline-block text-xs font-serif uppercase tracking-[0.25em] text-amber-900 dark:text-amber-400 font-bold mb-3">
                &mdash; {LEDGER.kicker.toUpperCase()} &mdash;
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-news tracking-tight text-neutral-950 dark:text-neutral-50 leading-[1.08] text-balance">
                {HERO.heading}
              </h1>
              <p className="mt-4 text-base sm:text-lg italic text-neutral-700 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed">
                &ldquo;Wherein shipowner claims and charterer counters are measured against observed meteorological records, and the reconciled figure is arithmetic rather than opinion.&rdquo;
              </p>
            </div>

            {/* Three-Column Broadsheet Grid */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-neutral-300 dark:border-neutral-700 pt-8">
              {/* Left Column: Background & Statement */}
              <div className="md:col-span-4 text-sm leading-relaxed text-justify space-y-4">
                <p>
                  <span className="float-left text-5xl font-black font-news leading-none pr-3 pt-1 text-neutral-900 dark:text-neutral-100">
                    K
                  </span>
                  EEL reads a charterparty and both parties&apos; statements of facts, runs each account through the same state machine, tests every disputed weather window against the threshold the charterparty itself sets, and reconciles the difference to one number.
                </p>
                <p>
                  A language model extracts the terms into rigid schemas with precise line citations; but no model ever fabricates or computes a single dollar. The calculation is arithmetic in pure Python code.
                </p>

                <div className="p-4 border-2 border-neutral-400/80 dark:border-neutral-600 bg-[#F4EFEA] dark:bg-[#1E1B18] mt-6">
                  <p className="font-bold uppercase tracking-wider text-xs border-b border-neutral-300 dark:border-neutral-700 pb-2 mb-2">
                    Fixture Particulars
                  </p>
                  <dl className="space-y-1.5 text-xs">
                    {FIXTURE_FACTS.map(([label, val]) => (
                      <div key={label} className="flex justify-between">
                        <dt className="text-neutral-600 dark:text-neutral-400">{label}:</dt>
                        <dd className="font-bold text-right">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {/* Middle Column: The Proclamation / Money Total */}
              <div className="md:col-span-5 border-y md:border-y-0 md:border-x border-neutral-300 dark:border-neutral-700 md:px-6 py-6 md:py-0">
                <div className="border-4 border-neutral-900 dark:border-neutral-100 p-6 text-center bg-white dark:bg-[#1A1815]">
                  <div className="text-[0.6875rem] font-serif uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400">
                    {RECONCILED.label} total
                  </div>
                  <div className="mt-2 text-5xl sm:text-6xl font-black font-mono tracking-tight text-neutral-950 dark:text-white">
                    {RECONCILED.figure}
                  </div>
                  <div className="mt-3 text-xs italic text-neutral-700 dark:text-neutral-300 max-w-sm mx-auto">
                    {RECONCILED.arithmetic}
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 gap-4 text-left">
                    <div>
                      <div className="text-[0.625rem] uppercase font-bold text-neutral-600 dark:text-neutral-400">
                        Shipowner Claim
                      </div>
                      <div className="font-mono font-bold text-lg text-emerald-800 dark:text-emerald-400">
                        {OWNER.figure}
                      </div>
                      <div className="text-[0.625rem] text-neutral-600 dark:text-neutral-400 truncate">
                        {OWNER.party}
                      </div>
                    </div>
                    <div>
                      <div className="text-[0.625rem] uppercase font-bold text-neutral-600 dark:text-neutral-400">
                        Charterer Claim
                      </div>
                      <div className="font-mono font-bold text-lg text-rose-800 dark:text-rose-400">
                        {CHARTERER.figure}
                      </div>
                      <div className="text-[0.625rem] text-neutral-600 dark:text-neutral-400 truncate">
                        {CHARTERER.party}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href="/login"
                    className={`inline-flex items-center justify-center h-12 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs uppercase tracking-widest font-sans font-bold hover:opacity-90 ${FOCUS} ${PRESS}`}
                  >
                    {CLOSING.cta}
                  </Link>

                  <Dialog>
                    <DialogTrigger
                      render={
                        <Button
                          variant="outline"
                          className={`h-10 border border-neutral-400 dark:border-neutral-600 bg-transparent text-xs uppercase tracking-wider font-sans hover:bg-neutral-200 dark:hover:bg-neutral-800 ${FOCUS} ${PRESS}`}
                        />
                      }
                    >
                      {CLOSING.explainer}
                    </DialogTrigger>
                    <DialogContent className="border-4 border-neutral-900 dark:border-neutral-100 bg-[#FBF8F2] dark:bg-[#1A1816] text-neutral-900 dark:text-neutral-100 max-w-lg font-serif">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold font-news uppercase tracking-wide">
                          {CLOSING.explainer}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-600 dark:text-neutral-400 italic">
                          Procedural note
                        </DialogDescription>
                      </DialogHeader>
                      <p className="text-sm leading-relaxed mt-4">
                        {EXPLAINER}
                      </p>
                      <div className="mt-6 flex justify-end">
                        <DialogClose
                          render={
                            <Button className={`border border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs uppercase font-sans font-bold ${FOCUS}`} />
                          }
                        >
                          Return to Gazette
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Right Column: Dispatch & Authority */}
              <div className="md:col-span-3 space-y-4 text-xs leading-relaxed">
                <div className="border-b border-neutral-300 dark:border-neutral-700 pb-3">
                  <p className="font-bold uppercase tracking-wider text-xs">
                    Legal Jurisdiction
                  </p>
                  <p className="mt-2 text-neutral-700 dark:text-neutral-300">
                    The framework is the <em>Laytime Definitions for Charter Parties 2013</em> (BIMCO Special Circular No. 8). It supplies strictly the measurement basis: actual period of interruption.
                  </p>
                </div>

                <div>
                  <p className="font-bold uppercase tracking-wider text-xs">
                    Deterministic Arithmetic
                  </p>
                  <p className="mt-2 text-neutral-700 dark:text-neutral-300">
                    No subjective compromise and no figure a model produced. Both parties&apos; accounts run through the same state machine and are reconciled by arithmetic.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Gazette Ledger Table: Exhibit A */}
          <section id={LEDGER.anchor} className="py-12 border-b-2 border-neutral-800/80 dark:border-neutral-200/80">
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-[0.2em] font-sans font-bold text-neutral-600 dark:text-neutral-400">
                EXHIBIT A &bull; THE {RECONCILED.label.toUpperCase()} SCHEDULE
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold font-news tracking-tight mt-1 text-neutral-950 dark:text-neutral-50">
                {LEDGER.heading}
              </h2>
              <p className="text-xs italic text-neutral-600 dark:text-neutral-400 mt-1 max-w-xl mx-auto">
                Detailed finding upon the three disputed calendar windows at {BRAND.port}
              </p>
            </div>

            <div className="border-2 border-neutral-900 dark:border-neutral-100 overflow-x-auto bg-white dark:bg-[#1A1815]">
              <table className="w-full text-left text-xs font-serif border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-900 dark:border-neutral-100 bg-[#F4EFEA] dark:bg-[#25221F] text-neutral-900 dark:text-neutral-100 uppercase text-[0.6875rem] tracking-wider font-sans font-bold">
                    <th className="py-3 px-4 border-r border-neutral-300 dark:border-neutral-700">Calendar Date</th>
                    <th className="py-3 px-4 border-r border-neutral-300 dark:border-neutral-700">Claimed Duration</th>
                    <th className="py-3 px-4 border-r border-neutral-300 dark:border-neutral-700">Adverse Window</th>
                    <th className="py-3 px-4 border-r border-neutral-300 dark:border-neutral-700">Weather Observation</th>
                    <th className="py-3 px-4 border-r border-neutral-300 dark:border-neutral-700">Finding</th>
                    <th className="py-3 px-4 text-right">Sum Credited</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-neutral-300 dark:border-neutral-700">
                  {DISPUTED_DAYS.map((day) => {
                    const isOwner = day.winner === "owner";
                    return (
                      <tr key={day.date} className="hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40">
                        <td className="py-3.5 px-4 font-bold border-r border-neutral-300 dark:border-neutral-700">{day.date}</td>
                        <td className="py-3.5 px-4 border-r border-neutral-300 dark:border-neutral-700">{day.claimed}</td>
                        <td className="py-3.5 px-4 border-r border-neutral-300 dark:border-neutral-700">{day.adverse}</td>
                        <td className="py-3.5 px-4 border-r border-neutral-300 dark:border-neutral-700 italic">{day.weather}</td>
                        <td className="py-3.5 px-4 border-r border-neutral-300 dark:border-neutral-700">
                          <span className={`font-sans font-bold text-[0.6875rem] uppercase px-2 py-0.5 border ${
                            isOwner
                              ? "border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
                              : "border-rose-700 text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40"
                          }`}>
                            In Favor of {day.winner}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold">{day.credited}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 border border-neutral-300 dark:border-neutral-700 text-xs italic text-neutral-700 dark:text-neutral-300 bg-[#F4EFEA]/60 dark:bg-[#1E1B18]/60 leading-relaxed">
              <strong className="not-italic uppercase font-sans tracking-wide">Note on the weather standard: </strong>
              {LEDGER.thresholdNote}
            </div>
          </section>

          {/* The Method: 5 Articles */}
          <section id={METHOD.anchor} className="py-12 border-b-2 border-neutral-800/80 dark:border-neutral-200/80">
            <div className="text-center mb-10">
              <span className="text-xs uppercase tracking-[0.2em] font-sans font-bold text-neutral-600 dark:text-neutral-400">
                PROCEDURAL CANON
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold font-news tracking-tight mt-1 text-neutral-950 dark:text-neutral-50">
                {METHOD.heading}
              </h2>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {STEPS.map((step) => (
                <li key={step.n} className="border-t-2 border-neutral-800 dark:border-neutral-200 pt-3">
                  <div className="font-mono text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    ARTICLE {step.n}
                  </div>
                  <h3 className="font-news font-bold text-lg mb-2 text-neutral-900 dark:text-neutral-100">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Build Notice: What Runs */}
          <section id={BUILD.anchor} className="py-12 border-b-2 border-neutral-800/80 dark:border-neutral-200/80">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-3xl font-bold font-news text-center mb-8">
                {BUILD.heading}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-2 border-neutral-900 dark:border-neutral-100 p-6 bg-white dark:bg-[#1A1815]">
                <div>
                  <h3 className="font-sans font-bold uppercase text-xs tracking-wider border-b border-neutral-300 dark:border-neutral-700 pb-2 mb-3">
                    {BUILD.runsHeading}
                  </h3>
                  <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
                    {RUNS.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">&sect;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-sans font-bold uppercase text-xs tracking-wider border-b border-neutral-300 dark:border-neutral-700 pb-2 mb-3">
                    {BUILD.absentHeading}
                  </h3>
                  <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                    {DOES_NOT_RUN.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-neutral-500 dark:text-neutral-300">&mdash;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Closing Call */}
          <section className="py-16 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold font-news mb-4">
              {CLOSING.heading}
            </h2>
            <p className="text-sm italic text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
              {CLOSING.body}
            </p>
            <Link
              href="/login"
              className={`inline-flex items-center justify-center h-12 px-8 border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-sans text-xs font-bold uppercase tracking-widest hover:opacity-90 ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta}
            </Link>
          </section>
        </main>

        {/* Gazette Footer */}
        <footer className="border-t-4 border-double border-neutral-800/80 dark:border-neutral-200/80 py-10 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-neutral-300 dark:border-neutral-700">
            <div>
              <div className="font-bold font-news uppercase text-sm mb-2">{BRAND.name}</div>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {FOOTER.blurb}
              </p>
            </div>
            <div>
              <div className="font-sans font-bold uppercase tracking-wider text-xs mb-2">Sections</div>
              <ul className="space-y-1">
                {FOOTER.sectionLinks.map(([label, href]) => (
                  <li key={href}>
                    <a href={href} className={`hover:underline ${FOCUS}`}>
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link href="/login" className={`hover:underline ${FOCUS}`}>
                    {CLOSING.portal}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-sans font-bold uppercase tracking-wider text-xs mb-2">Notice</div>
              <ul className="space-y-1 text-neutral-600 dark:text-neutral-400">
                {FOOTER.notes.map((note) => (
                  <li key={note}>&bull; {note}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-4 flex justify-between items-center text-[0.6875rem] text-neutral-600 dark:text-neutral-400">
            <span>{FOOTER.colophon}</span>
            <span>{BRAND.port.toUpperCase()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
