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
 * Variant 2 — Telemetry Console (Nightwatch).
 *
 * Dark maritime terminal & bridge console: abyssal navy ground, phosphor emerald
 * and radar amber status telemetry, monospace instruments, coordinate readouts,
 * and high-density tabular calculation data.
 */

/**
 * `focus-visible:outline-solid` is load-bearing, not decoration. A Tailwind
 * outline reset sets `--tw-outline-style: none` on the element and
 * `focus-visible:outline-2` reads that same variable back, so the two cancel and
 * nothing is painted. `outline-solid` is also what makes the ring survive on
 * the shadcn `Button`, whose base class carries such a reset of its own.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-emerald-400";
const PRESS =
  "transition-all duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none";

function ConsoleWordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded border border-emerald-500/40 bg-emerald-950/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
        <Image
          src="/logo.png"
          alt=""
          width={26}
          height={26}
          unoptimized
          className="size-6 brightness-125"
        />
        <span className="absolute inset-0 bg-emerald-400/10 pointer-events-none" />
      </span>
      <div className="flex flex-col font-mono leading-none">
        <span className="flex items-center gap-2 text-sm font-bold tracking-wider text-emerald-300">
          {BRAND.name.toUpperCase()}
          <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" />
        </span>
        <span className="mt-1 text-[0.625rem] font-medium tracking-[0.2em] text-emerald-500/80">
          SYS // TELEMETRY
        </span>
      </div>
    </span>
  );
}

export default function TelemetryVariant() {
  return (
    <div className="min-h-dvh bg-[#050B14] text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-100 font-plex-mono antialiased">
      <a
        href="#main-telemetry"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:border focus:border-emerald-500 focus:bg-[#0B1524] focus:px-4 focus:py-3 focus:text-sm focus:text-emerald-300 ${FOCUS}`}
      >
        Skip to console feed
      </a>

      {/* Top telemetry status ticker */}
      <div className="border-b border-emerald-500/20 bg-[#070F1B]/95 text-[0.6875rem] text-emerald-400/80 font-mono tracking-widest px-4 py-1.5 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping inline-block motion-reduce:animate-none" />
            CONSOLE: ONLINE
          </span>
          <span className="text-slate-400">|</span>
          <span>PORT: {BRAND.port.toUpperCase()}</span>
          <span className="text-slate-400">|</span>
          <span>VESSEL: {BRAND.vessel.toUpperCase()}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0 text-slate-400">
          <span className="text-emerald-400/90 font-bold">STATE: RECONCILED</span>
        </div>
      </div>

      {/* Navigation header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#070F1B]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className={`inline-flex items-center ${FOCUS}`}>
            <ConsoleWordmark />
          </Link>

          <nav aria-label="Console Sections" className="hidden lg:flex items-center gap-6 text-xs text-slate-400 font-mono">
            {FOOTER.sectionLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`hover:text-emerald-300 transition-colors uppercase tracking-wider ${FOCUS}`}
              >
                [{label}]
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className={`hidden sm:inline-flex items-center h-9 px-3.5 rounded border border-emerald-500/30 bg-[#0B1726] text-xs font-mono text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-500/60 ${FOCUS} ${PRESS}`}
            >
              {CLOSING.portal}
            </Link>
            <Link
              href="/login"
              className={`inline-flex items-center h-9 px-4 rounded bg-emerald-500 text-xs font-mono font-bold text-slate-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta} &rarr;
            </Link>
          </div>
        </div>
      </header>

      <main id="main-telemetry" tabIndex={-1} className="relative z-10">
        {/* Hero Section */}
        <section className="relative border-b border-slate-800/80 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-xs font-mono text-emerald-300 mb-6">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  SYS_MISSION // {HERO.eyebrow.toUpperCase()}
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
                  {HERO.heading}
                </h1>

                <p className="mt-6 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-sans">
                  {HERO.lede}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/login"
                    className={`inline-flex items-center justify-center h-11 px-6 rounded bg-emerald-500 font-mono text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] ${FOCUS} ${PRESS}`}
                  >
                    {CLOSING.cta}
                  </Link>

                  <Dialog>
                    <DialogTrigger
                      render={
                        <Button
                          variant="outline"
                          className={`h-11 px-5 rounded border border-slate-700 bg-slate-900/60 font-mono text-xs text-slate-300 hover:bg-slate-800 hover:text-white ${FOCUS} ${PRESS}`}
                        />
                      }
                    >
                      {CLOSING.explainer}
                    </DialogTrigger>
                    <DialogContent className="border border-emerald-500/30 bg-[#0B1524] text-slate-200 max-w-xl font-mono">
                      <DialogHeader>
                        <DialogTitle className="text-emerald-400 font-bold text-base tracking-wide flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-400" />
                          SYS_DOC // {CLOSING.explainer.toUpperCase()}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                          Deterministic verification workflow
                        </DialogDescription>
                      </DialogHeader>
                      <p className="text-xs text-slate-300 leading-relaxed mt-4 font-sans">
                        {EXPLAINER}
                      </p>
                      <div className="mt-6 flex justify-end">
                        <DialogClose
                          render={
                            <Button className={`h-8 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono ${FOCUS}`} />
                          }
                        >
                          CLOSE_STREAM
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Live Telemetry Instrument Cluster */}
              <div className="lg:col-span-5">
                <div className="rounded-lg border border-emerald-500/30 bg-[#071322]/80 p-5 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-400" />
                      RECONCILIATION_HUD
                    </span>
                    <span className="text-slate-400">ID: {BRAND.fixture}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded border border-slate-800/80 bg-slate-900/50 p-3">
                      <div className="text-[0.625rem] text-slate-400 uppercase tracking-wider">{OWNER.role}</div>
                      <div className="mt-1 font-mono text-xl font-bold text-emerald-400">{OWNER.figure}</div>
                      <div className="mt-1 text-[0.625rem] text-slate-400 truncate">{OWNER.party}</div>
                    </div>

                    <div className="rounded border border-slate-800/80 bg-slate-900/50 p-3">
                      <div className="text-[0.625rem] text-slate-400 uppercase tracking-wider">{CHARTERER.role}</div>
                      <div className="mt-1 font-mono text-xl font-bold text-amber-400">{CHARTERER.figure}</div>
                      <div className="mt-1 text-[0.625rem] text-slate-400 truncate">{CHARTERER.party}</div>
                    </div>
                  </div>

                  <div className="mt-3 rounded border border-emerald-500/40 bg-emerald-950/20 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-emerald-300">
                        {RECONCILED.label}
                      </span>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[0.625rem] font-bold text-emerald-300">
                        FINAL
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-3xl font-extrabold text-white tracking-tight">
                      {RECONCILED.figure}
                    </div>
                    <div className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
                      {RECONCILED.arithmetic}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ledger Section */}
        <section id={LEDGER.anchor} className="border-b border-slate-800/80 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                  {LEDGER.kicker}
                </p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white font-sans">
                  {LEDGER.heading}
                </h2>
              </div>
              <div className="text-xs font-mono text-slate-400 max-w-md">
                Every hour checked deterministically against port weather readings.
              </div>
            </div>

            {/* Table Matrix */}
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#071322]/60">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                    <th className="py-3.5 px-4 font-semibold uppercase">Date Window</th>
                    <th className="py-3.5 px-4 font-semibold uppercase">Claimed Lost</th>
                    <th className="py-3.5 px-4 font-semibold uppercase">Adverse Hours</th>
                    <th className="py-3.5 px-4 font-semibold uppercase">Sensor Observations</th>
                    <th className="py-3.5 px-4 font-semibold uppercase">Deterministic Verdict</th>
                    <th className="py-3.5 px-4 font-semibold uppercase text-right">Settlement Credited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {DISPUTED_DAYS.map((day) => {
                    const isOwner = day.winner === "owner";
                    return (
                      <tr key={day.date} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-4 font-bold text-white">{day.date}</td>
                        <td className="py-4 px-4 text-slate-300">{day.claimed}</td>
                        <td className="py-4 px-4 text-slate-300">{day.adverse}</td>
                        <td className="py-4 px-4 text-slate-400">{day.weather}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${
                              isOwner
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${isOwner ? "bg-emerald-400" : "bg-amber-400"}`} />
                            {day.winner} Winner
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-white tabular-nums">
                          {day.credited}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded border border-slate-800 bg-[#070F1B] p-4 text-xs text-slate-400 leading-relaxed font-sans">
              <span className="font-mono text-emerald-400 font-bold mr-2">[RULE_AUTHORITY]</span>
              {LEDGER.thresholdNote}
            </div>
          </div>
        </section>

        {/* Method Section */}
        <section id={METHOD.anchor} className="border-b border-slate-800/80 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12">
              <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                {METHOD.eyebrow}
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white font-sans max-w-2xl">
                {METHOD.heading}
              </h2>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className="rounded-lg border border-slate-800 bg-[#071322]/40 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="font-mono text-xs text-emerald-400/80 font-bold mb-3">
                      NODE_{step.n}
                    </div>
                    <h3 className="text-base font-bold text-white mb-2 font-sans">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {step.body}
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-800/60 text-[0.625rem] font-mono text-slate-400 uppercase">
                    STATUS: VERIFIED
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Build Verification Section */}
        <section id={BUILD.anchor} className="border-b border-slate-800/80 px-4 py-16 sm:px-6 sm:py-20 bg-[#060D17]">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              {BUILD.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white font-sans">
              {BUILD.heading}
            </h2>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="rounded-lg border border-emerald-500/20 bg-[#071322]/60 p-6">
                <h3 className="text-sm font-bold text-emerald-300 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  {BUILD.runsHeading}
                </h3>
                <ul className="space-y-3 font-sans text-xs text-slate-300">
                  {RUNS.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="font-mono text-emerald-400 font-bold text-sm leading-none shrink-0">+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#071322]/60 p-6">
                <h3 className="text-sm font-bold text-slate-400 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-slate-500" />
                  {BUILD.absentHeading}
                </h3>
                <ul className="space-y-3 font-sans text-xs text-slate-400">
                  {DOES_NOT_RUN.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="font-mono text-slate-400 font-bold text-sm leading-none shrink-0">&ndash;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-sans tracking-tight">
              {CLOSING.heading}
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
              {CLOSING.body}
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className={`inline-flex items-center justify-center h-12 px-8 rounded bg-emerald-500 font-mono text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] ${FOCUS} ${PRESS}`}
              >
                {CLOSING.cta} &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#040810] px-4 py-12 sm:px-6 text-xs font-mono text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between gap-8">
          <div>
            <ConsoleWordmark />
            <p className="mt-4 max-w-md text-slate-400 leading-relaxed font-sans">
              {FOOTER.blurb}
            </p>
          </div>
          <div>
            <div className="text-slate-300 font-bold mb-3 uppercase tracking-wider">
              [NAV_INDEX]
            </div>
            <ul className="space-y-2">
              {FOOTER.sectionLinks.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className={`hover:text-emerald-400 transition-colors ${FOCUS}`}>
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/login" className={`hover:text-emerald-400 transition-colors ${FOCUS}`}>
                  {CLOSING.portal}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-slate-300 font-bold mb-3 uppercase tracking-wider">
              [{FOOTER.buildHeading.toUpperCase()}]
            </div>
            <ul className="space-y-1.5 text-slate-400 font-sans">
              {FOOTER.notes.map((note) => (
                <li key={note}>&bull; {note}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-slate-800/80 flex justify-between items-center text-[0.625rem]">
          <span>{FOOTER.colophon}</span>
          <span className="text-emerald-500/80">END_TRANSMISSION // 2026</span>
        </div>
      </footer>
    </div>
  );
}
