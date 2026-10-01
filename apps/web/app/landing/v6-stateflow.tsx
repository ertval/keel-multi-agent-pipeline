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
 * Variant 6 — Stateflow Autonomous Agent Pipeline.
 *
 * Modern developer-tool & agentic workflow canvas: visual DAG node topology,
 * interactive-feeling timeline scrubber across the 3 disputed weather windows,
 * glassmorphic node cards, and transparent verification that an LLM extracts text
 * while pure-Python state machine computes every dollar.
 */

/**
 * `focus-visible:outline-solid` is load-bearing, not decoration. A Tailwind
 * outline reset sets `--tw-outline-style: none` on the element and
 * `focus-visible:outline-2` only reads that variable back, so without the
 * explicit `solid` the two cancel and nothing is painted. It is also what
 * makes the ring survive on the shadcn `Button`, whose base class carries such
 * a reset of its own.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-violet-400";
const PRESS =
  "transition-all duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none";

function PipelineWordmark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex size-9 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-950/40 shadow-[0_0_15px_rgba(139,92,246,0.25)]">
        <Image
          src="/logo.png"
          alt=""
          width={24}
          height={24}
          unoptimized
          className="size-6"
        />
        <div className="absolute -bottom-1 -right-1 size-2.5 rounded-full bg-emerald-400 border-2 border-[#0B0F19]" />
      </div>
      <div className="flex flex-col font-sans leading-none">
        <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
          {BRAND.name}
          <span className="text-[0.625rem] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-normal">
            GRAPH
          </span>
        </span>
        <span className="text-[0.625rem] text-slate-400 font-mono mt-0.5">
          DETERMINISTIC DAG
        </span>
      </div>
    </div>
  );
}

export default function StateflowVariant() {
  return (
    <div className="min-h-dvh bg-[#0B0F19] text-slate-200 font-sans selection:bg-violet-500/30 selection:text-violet-100 antialiased relative">
      <a
        href="#main-stateflow"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:border focus:border-violet-500 focus:bg-[#151C2C] focus:px-4 focus:py-2 focus:text-xs font-mono text-violet-300 ${FOCUS}`}
      >
        Skip to pipeline
      </a>

      {/* Glow gradient ambient effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-violet-600/10 via-sky-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className={`inline-flex items-center ${FOCUS}`}>
            <PipelineWordmark />
          </Link>

          <nav aria-label="Pipeline Stages" className="hidden lg:flex items-center gap-6 text-xs font-mono text-slate-400">
            {FOOTER.sectionLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`hover:text-white transition-colors ${FOCUS}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className={`hidden sm:inline-flex items-center h-9 px-3.5 rounded-lg border border-slate-700 bg-slate-900/60 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white ${FOCUS} ${PRESS}`}
            >
              {CLOSING.portal}
            </Link>
            <Link
              href="/login"
              className={`inline-flex items-center h-9 px-4 rounded-lg bg-violet-600 text-xs font-bold text-white hover:bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.35)] ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta} &rarr;
            </Link>
          </div>
        </div>
      </header>

      <main id="main-stateflow" tabIndex={-1} className="mx-auto max-w-7xl px-4 sm:px-6 py-12 relative z-10">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 border-b border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/40 px-3 py-1 text-xs font-mono text-violet-300 mb-6">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" />
                <span>
                  {BRAND.fixture} &middot; {RECONCILED.label}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
                {HERO.heading}
              </h1>

              <p className="mt-6 text-base text-slate-300 leading-relaxed max-w-2xl">
                {HERO.lede}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className={`inline-flex items-center justify-center h-12 px-7 rounded-lg bg-violet-600 font-bold text-xs uppercase tracking-wider text-white hover:bg-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.35)] ${FOCUS} ${PRESS}`}
                >
                  {CLOSING.cta}
                </Link>

                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        className={`h-12 px-5 rounded-lg border border-slate-700 bg-slate-900/60 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white ${FOCUS} ${PRESS}`}
                      />
                    }
                  >
                    {CLOSING.explainer}
                  </DialogTrigger>
                  <DialogContent className="border border-violet-500/30 bg-[#0F1422] text-slate-200 max-w-lg font-sans">
                    <DialogHeader>
                      <DialogTitle className="text-violet-300 font-bold text-lg flex items-center gap-2">
                        <span className="size-2 rounded-full bg-violet-400" />
                        {CLOSING.explainer}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-400">
                        Multi-Agent LangGraph Architecture
                      </DialogDescription>
                    </DialogHeader>
                    <p className="text-xs leading-relaxed text-slate-300 mt-4 font-mono">
                      {EXPLAINER}
                    </p>
                    <div className="mt-6 flex justify-end">
                      <DialogClose
                        render={
                          <Button className={`h-8 rounded bg-violet-600 text-white text-xs font-mono hover:bg-violet-500 ${FOCUS}`} />
                        }
                      >
                        PROCEED
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Pipeline Glassmorphism Summary Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono">
                  <span className="text-violet-400 font-bold">STATEFLOW RECONCILIATION</span>
                  <span className="text-slate-400">{BRAND.fixture}</span>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                    <div>
                      <div className="text-[0.625rem] text-slate-400 uppercase font-mono">{OWNER.role}</div>
                      <div className="text-xs font-medium text-slate-200 truncate">{OWNER.party}</div>
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                      {OWNER.figure}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                    <div>
                      <div className="text-[0.625rem] text-slate-400 uppercase font-mono">{CHARTERER.role}</div>
                      <div className="text-xs font-medium text-slate-200 truncate">{CHARTERER.party}</div>
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                      {CHARTERER.figure}
                    </div>
                  </div>

                  <div className="rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-950/40 to-slate-900/80 p-5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-violet-300 font-bold uppercase tracking-wider">
                        {RECONCILED.label}
                      </span>
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[0.625rem] font-bold text-violet-300">
                        {BRAND.fixture}
                      </span>
                    </div>
                    <div className="text-4xl font-extrabold font-mono text-white tracking-tight mt-2 tabular-nums">
                      {RECONCILED.figure}
                    </div>
                    <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {RECONCILED.arithmetic}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Graph DAG Pipeline Visualization */}
        <section id={METHOD.anchor} className="py-16 sm:py-20 border-b border-slate-800">
          <div className="mb-10">
            <span className="text-xs font-mono text-violet-400 uppercase tracking-widest">{METHOD.eyebrow}</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-1">
              {METHOD.heading}
            </h2>
            <p className="mt-2 text-xs text-slate-400 font-mono">
              7-NODE LANGGRAPH TOPOLOGY: ORCHESTRATOR &rarr; WORKERS &rarr; VALIDATOR &rarr; STATE MACHINE &rarr; ADJUDICATOR
            </p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="rounded-xl border border-slate-800 bg-[#0F1422] p-5 hover:border-violet-500/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-violet-400">NODE {step.n}</span>
                  <span className="size-2 rounded-full bg-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Visual Weather Timeline Scrub / Ledger Section */}
        <section id={LEDGER.anchor} className="py-16 sm:py-20 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-mono text-violet-400 uppercase tracking-widest">{LEDGER.kicker}</span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mt-1">
                {LEDGER.heading}
              </h2>
            </div>
            <div className="text-xs font-mono text-slate-400">
              WEATHER TIMELINE &bull; PIRAEUS HARBOUR GAUGE
            </div>
          </div>

          {/* Interactive Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {DISPUTED_DAYS.map((day) => {
              const isOwner = day.winner === "owner";
              return (
                <div
                  key={day.date}
                  className={`rounded-xl border p-5 bg-[#0F1422] ${
                    isOwner ? "border-emerald-500/30" : "border-amber-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-bold text-sm text-white">{day.date}</span>
                    <span
                      className={`text-[0.625rem] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        isOwner
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {day.winner} won
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Claimed Duration:</span>
                      <span className="font-mono text-slate-200">{day.claimed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Adverse Exceedances:</span>
                      <span className="font-mono text-slate-200">{day.adverse}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Observed Weather:</span>
                      <span className="font-mono text-slate-300">{day.weather}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/80 pt-2 font-bold">
                      <span className="text-slate-300">Sum Credited:</span>
                      <span className="font-mono text-white">{day.credited}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0F1422] p-5 text-xs text-slate-400 leading-relaxed">
            {LEDGER.thresholdNote}
          </div>
        </section>

        {/* Build Verification */}
        <section id={BUILD.anchor} className="py-16 sm:py-20 border-b border-slate-800">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
            {BUILD.heading}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-emerald-500/30 bg-[#0F1422] p-6">
              <h3 className="text-sm font-bold text-emerald-400 font-mono uppercase mb-4 flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400" />
                {BUILD.runsHeading}
              </h3>
              <ul className="space-y-3 text-xs text-slate-300">
                {RUNS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-emerald-400 font-bold font-mono">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0F1422] p-6">
              <h3 className="text-sm font-bold text-slate-400 font-mono uppercase mb-4 flex items-center gap-2">
                <span className="size-2 rounded-full bg-slate-500" />
                {BUILD.absentHeading}
              </h3>
              <ul className="space-y-3 text-xs text-slate-400">
                {DOES_NOT_RUN.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-slate-400 font-bold font-mono">&ndash;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Closing Call to Action */}
        <section className="py-20 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {CLOSING.heading}
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            {CLOSING.body}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className={`inline-flex items-center justify-center h-12 px-8 rounded-lg bg-violet-600 font-bold text-xs uppercase tracking-wider text-white hover:bg-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.35)] ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta} &rarr;
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#080B12] px-4 sm:px-6 py-10 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <PipelineWordmark />
            <p className="mt-3 text-slate-400 font-sans max-w-sm text-xs">
              {FOOTER.blurb}
            </p>
          </div>
          <div>
            <div className="text-slate-300 font-bold mb-2 uppercase">GRAPH NODES</div>
            <ul className="space-y-1">
              {FOOTER.sectionLinks.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className={`hover:text-violet-400 transition-colors ${FOCUS}`}>
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/login" className={`hover:text-violet-400 transition-colors ${FOCUS}`}>
                  {CLOSING.portal}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-slate-300 font-bold mb-2 uppercase">GOVERNANCE</div>
            <ul className="space-y-1 text-slate-400 font-sans">
              {FOOTER.notes.map((note) => (
                <li key={note}>&bull; {note}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-slate-800/80 flex justify-between text-[0.625rem]">
          <span>{FOOTER.colophon}</span>
          <span>LANGGRAPH TOPOLOGY COMPILED // 2026</span>
        </div>
      </footer>
    </div>
  );
}
