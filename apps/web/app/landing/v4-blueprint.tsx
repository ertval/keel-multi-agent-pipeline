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
 * Variant 4 — Naval Architecture Blueprint.
 *
 * Drafting table aesthetic: cyanotype grid background, technical dimension lines,
 * CAD crosshair markings, engineering schematics, monospace callouts,
 * and the state machine represented as an engineering logic flow.
 */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-cyan-400";
const PRESS =
  "transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none";

function BlueprintTitleBlock() {
  return (
    <div className="border border-cyan-500/50 bg-[#07192C]/90 p-3 font-mono text-[0.625rem] text-cyan-300">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-cyan-500/30 pb-2 mb-2">
        <div>
          <span className="text-cyan-500/80 block">PROJECT:</span>
          <span className="font-bold text-white uppercase">{BRAND.name} DISPUTE ENGINE</span>
        </div>
        <div>
          <span className="text-cyan-500/80 block">VESSEL:</span>
          <span className="font-bold text-white">{BRAND.vessel}</span>
        </div>
        <div>
          <span className="text-cyan-500/80 block">DWG NO:</span>
          <span className="font-bold text-white">
            {BRAND.name.toUpperCase()}-{BRAND.fixture.toUpperCase()}
          </span>
        </div>
        <div>
          <span className="text-cyan-500/80 block">SCALE:</span>
          <span className="font-bold text-cyan-400">1:1 DETERMINISTIC</span>
        </div>
      </div>
      <div className="flex justify-between items-center text-[0.5625rem] text-cyan-400/80">
        <span>MEASUREMENT BASIS: BIMCO 2013 DEF 16</span>
        <span>ENGINE: PURE PYTHON SM // ZERO LLM DOLLARS</span>
      </div>
    </div>
  );
}

export default function BlueprintVariant() {
  return (
    <div className="min-h-dvh bg-[#071424] text-slate-200 font-mono selection:bg-cyan-500/30 selection:text-cyan-100 antialiased relative">
      {/* Background CAD Blueprint Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            linear-gradient(to right, rgba(6, 182, 212, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px, 20px 20px, 100px 100px, 100px 100px",
        }}
      />

      <a
        href="#main-blueprint"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:border focus:border-cyan-400 focus:bg-[#07192C] focus:px-4 focus:py-2 focus:text-xs focus:text-cyan-300 ${FOCUS}`}
      >
        Skip to Schematic Main
      </a>

      {/* Blueprint Header */}
      <header className="sticky top-0 z-30 border-b border-cyan-500/40 bg-[#071424]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className={`flex items-center gap-3 ${FOCUS}`}>
            <span className="flex size-9 items-center justify-center border border-cyan-400/60 bg-cyan-950/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Image
                src="/logo.png"
                alt=""
                width={24}
                height={24}
                unoptimized
                className="size-6 brightness-125"
              />
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-sm text-cyan-300 tracking-wider">
                {BRAND.name.toUpperCase()} {"//"} CAD
              </span>
              <span className="text-[0.625rem] text-cyan-500/80 tracking-widest mt-0.5">
                MARINE SCHEMATIC
              </span>
            </div>
          </Link>

          <nav aria-label="Schematic Sections" className="hidden lg:flex items-center gap-6 text-xs text-cyan-400/70">
            {FOOTER.sectionLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`hover:text-cyan-200 transition-colors uppercase tracking-wider flex items-center gap-1 ${FOCUS}`}
              >
                <span className="text-cyan-600">&bull;</span>
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className={`hidden sm:inline-flex items-center h-8 px-3 border border-cyan-500/50 bg-[#0A2038] text-xs text-cyan-300 hover:bg-cyan-950/60 ${FOCUS} ${PRESS}`}
            >
              {CLOSING.portal}
            </Link>
            <Link
              href="/login"
              className={`inline-flex items-center h-8 px-4 bg-cyan-400 text-xs font-bold text-slate-950 uppercase tracking-wider hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)] ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-blueprint" tabIndex={-1} className="relative z-10 px-4 sm:px-6 py-10 max-w-7xl mx-auto">
        {/* Engineering Title Block Top */}
        <div className="mb-8">
          <BlueprintTitleBlock />
        </div>

        {/* Hero Schematic Section */}
        <section className="border border-cyan-500/40 bg-[#08182B]/80 p-6 sm:p-10 relative mb-12">
          {/* Corner CAD registration marks */}
          <div className="absolute top-1 left-1 text-[0.625rem] text-cyan-500/80">+ {BRAND.name.toUpperCase()}</div>
          <div className="absolute bottom-1 left-1 text-[0.625rem] text-cyan-500/80">+ {BRAND.fixture.toUpperCase()}</div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-950/50 px-2.5 py-1 text-xs text-cyan-300 mb-6">
                <span className="size-2 bg-cyan-400 animate-pulse motion-reduce:animate-none" />
                SYSTEM DESIGNATION: {HERO.eyebrow.toUpperCase()}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white font-sans tracking-tight leading-tight">
                {HERO.heading}
              </h1>

              <p className="mt-6 text-sm text-cyan-100/80 leading-relaxed font-sans max-w-xl">
                {HERO.lede}
              </p>

              {/* Dimension measurement bar callout */}
              <div className="mt-8 border-y border-dashed border-cyan-500/40 py-3 text-xs text-cyan-400 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <span>&lt;--- {FIXTURE_FACTS[3][1]} ---&gt;</span>
                <span className="text-white font-bold">{FIXTURE_FACTS[4][1]}</span>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className={`inline-flex items-center justify-center h-11 px-6 bg-cyan-400 text-xs font-bold text-slate-950 uppercase tracking-widest hover:bg-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] ${FOCUS} ${PRESS}`}
                >
                  {CLOSING.cta}
                </Link>

                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        className={`h-11 px-5 border border-cyan-500/50 bg-[#09223D] text-xs text-cyan-300 hover:bg-[#0E2F52] hover:text-white ${FOCUS} ${PRESS}`}
                      />
                    }
                  >
                    {CLOSING.explainer}
                  </DialogTrigger>
                  <DialogContent className="border border-cyan-400 bg-[#07192C] text-slate-200 max-w-lg font-mono">
                    <DialogHeader>
                      <DialogTitle className="text-cyan-300 font-bold text-base flex items-center gap-2">
                        <span>[DWG_NOTE]</span> {CLOSING.explainer}
                      </DialogTitle>
                      <DialogDescription className="text-cyan-400/80 text-xs">
                        Procedural layout specifications
                      </DialogDescription>
                    </DialogHeader>
                    <p className="text-xs text-slate-300 leading-relaxed mt-4 font-sans">
                      {EXPLAINER}
                    </p>
                    <div className="mt-6 flex justify-end">
                      <DialogClose
                        render={
                          <Button className={`h-8 bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 text-xs ${FOCUS}`} />
                        }
                      >
                        ACKNOWLEDGE
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Right: Structural Calculation Diagram */}
            <div className="lg:col-span-5">
              <div className="border border-cyan-500/60 bg-[#061220] p-6 shadow-xl relative">
                <div className="text-xs font-bold text-cyan-400 border-b border-cyan-500/30 pb-2 mb-4 flex justify-between">
                  <span>STRUCTURAL TOTALS SPEC</span>
                  <span>CANONICAL: {BRAND.fixture.toUpperCase()}</span>
                </div>

                <div className="space-y-4">
                  <div className="border border-cyan-500/30 bg-[#08182B] p-3 flex justify-between items-center">
                    <div>
                      <div className="text-[0.625rem] text-cyan-400/80 uppercase">{OWNER.role}</div>
                      <div className="text-xs text-slate-300">{OWNER.party}</div>
                    </div>
                    <div className="text-xl font-bold text-emerald-400 tabular-nums">{OWNER.figure}</div>
                  </div>

                  <div className="border border-cyan-500/30 bg-[#08182B] p-3 flex justify-between items-center">
                    <div>
                      <div className="text-[0.625rem] text-cyan-400/80 uppercase">{CHARTERER.role}</div>
                      <div className="text-xs text-slate-300">{CHARTERER.party}</div>
                    </div>
                    <div className="text-xl font-bold text-amber-400 tabular-nums">{CHARTERER.figure}</div>
                  </div>

                  <div className="border-2 border-cyan-400 bg-cyan-950/30 p-4">
                    <div className="flex justify-between items-center text-xs text-cyan-300 font-bold mb-1">
                      <span>SETTLEMENT SUM:</span>
                      <span className="bg-cyan-400 text-slate-950 px-1.5 py-0.2 text-[0.625rem]">
                        {RECONCILED.label.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-4xl font-extrabold text-white tracking-tight tabular-nums">
                      {RECONCILED.figure}
                    </div>
                    <div className="text-[0.6875rem] text-cyan-200/80 mt-2 font-sans leading-tight">
                      {RECONCILED.arithmetic}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cyan-500/30 text-[0.625rem] text-cyan-400/80">
                  CALC ENGINE: STATE MACHINE
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ledger: Engineering Test Schedule */}
        <section id={LEDGER.anchor} className="border border-cyan-500/40 bg-[#08182B]/60 p-6 sm:p-8 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-cyan-500/30 pb-4">
            <div>
              <span className="text-xs text-cyan-400 uppercase tracking-widest">{LEDGER.kicker}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-sans mt-1">
                {LEDGER.heading}
              </h2>
            </div>
            <div className="text-xs text-cyan-300/80 max-w-sm">
              SCHEDULE: VERIFICATION OF THE THREE DISPUTED CALENDAR WINDOWS
            </div>
          </div>

          <div className="overflow-x-auto border border-cyan-500/30 bg-[#050E18]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cyan-500/30 bg-[#091D33] text-cyan-300 uppercase text-[0.6875rem]">
                  <th className="py-3 px-4">Observation Window</th>
                  <th className="py-3 px-4">Claimed Duration</th>
                  <th className="py-3 px-4">Threshold Exceedances</th>
                  <th className="py-3 px-4">Meteorological Reading</th>
                  <th className="py-3 px-4">State Machine Flag</th>
                  <th className="py-3 px-4 text-right">Settlement Credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/20">
                {DISPUTED_DAYS.map((day) => {
                  const isOwner = day.winner === "owner";
                  return (
                    <tr key={day.date} className="hover:bg-cyan-950/20">
                      <td className="py-3 px-4 font-bold text-white">{day.date}</td>
                      <td className="py-3 px-4 text-cyan-200">{day.claimed}</td>
                      <td className="py-3 px-4 text-cyan-200">{day.adverse}</td>
                      <td className="py-3 px-4 text-slate-300">{day.weather}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[0.625rem] font-bold uppercase border ${
                            isOwner
                              ? "border-emerald-400 text-emerald-300 bg-emerald-950/40"
                              : "border-amber-400 text-amber-300 bg-amber-950/40"
                          }`}
                        >
                          PASS // {day.winner.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white tabular-nums">
                        {day.credited}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 border border-cyan-500/30 bg-[#061220] text-xs text-cyan-100/80 leading-relaxed font-sans">
            <span className="font-mono text-cyan-400 font-bold mr-2">[NOTE: CRITERIA APPLIED]</span>
            {LEDGER.thresholdNote}
          </div>
        </section>

        {/* Method: 5 Schematic Steps */}
        <section id={METHOD.anchor} className="border border-cyan-500/40 bg-[#08182B]/60 p-6 sm:p-8 mb-12">
          <div className="mb-8 border-b border-cyan-500/30 pb-4">
            <span className="text-xs text-cyan-400 uppercase tracking-widest">{METHOD.eyebrow}</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-sans mt-1">
              {METHOD.heading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="border border-cyan-500/30 bg-[#061220] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs text-cyan-400 font-bold mb-2">STAGE_{step.n}</div>
                  <h3 className="text-sm font-bold text-white font-sans mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">{step.body}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-cyan-500/20 text-[0.5625rem] text-cyan-500">
                  DETERMINISTIC LOGIC GATE
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Build Specifications: Runs vs Absent */}
        <section id={BUILD.anchor} className="border border-cyan-500/40 bg-[#08182B]/60 p-6 sm:p-8 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-sans mb-6">
            {BUILD.heading}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-emerald-500/40 bg-[#061220] p-5">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 border-b border-emerald-500/20 pb-2">
                [+] {BUILD.runsHeading}
              </h3>
              <ul className="space-y-2 text-xs font-sans text-slate-300">
                {RUNS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="font-mono text-emerald-400 font-bold">&#10003;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-700 bg-[#061220] p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">
                [-] {BUILD.absentHeading}
              </h3>
                  <ul className="space-y-2 text-xs font-sans text-slate-400">
                    {DOES_NOT_RUN.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="font-mono font-bold text-slate-400">&times;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

            </div>
          </div>
        </section>

        {/* Closing Schematic Call */}
        <section className="text-center py-12 border border-cyan-500/40 bg-[#08182B]/90 p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans">
            {CLOSING.heading}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-cyan-100/80 font-sans max-w-xl mx-auto leading-relaxed">
            {CLOSING.body}
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/login"
              className={`inline-flex items-center justify-center h-11 px-8 bg-cyan-400 text-xs font-bold text-slate-950 uppercase tracking-widest hover:bg-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta}
            </Link>
          </div>
        </section>
      </main>

      {/* Blueprint Footer */}
      <footer className="border-t border-cyan-500/40 bg-[#050E18] px-4 sm:px-6 py-8 text-xs text-cyan-500/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="font-bold text-white text-sm mb-1">{BRAND.name} ENGINEERING</div>
            <p className="text-slate-400 font-sans max-w-md text-xs">{FOOTER.blurb}</p>
          </div>
          <div>
            <div className="font-bold text-cyan-300 uppercase mb-2">INDEX</div>
            <ul className="space-y-1">
              {FOOTER.sectionLinks.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className={`hover:text-cyan-200 ${FOCUS}`}>
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/login" className={`hover:text-cyan-200 ${FOCUS}`}>
                  {CLOSING.portal}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-cyan-300 uppercase mb-2">SPECIFICATIONS</div>
            <ul className="space-y-1 text-slate-400 font-sans">
              {FOOTER.notes.map((note) => (
                <li key={note}>&bull; {note}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-cyan-500/20 text-[0.625rem] flex justify-between">
          <span>{FOOTER.colophon}</span>
          <span>DWG SHEET 1 OF 1</span>
        </div>
      </footer>
    </div>
  );
}
