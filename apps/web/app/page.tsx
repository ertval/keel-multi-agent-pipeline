"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ship,
  ArrowRight,
  CheckCircle2,
  Mail,
  FileText,
  LayoutGrid,
  ShieldCheck,
  Layers,
  Menu,
  X,
  Play,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

function KeelLogo({ showTagline = true, className = "" }: { showTagline?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="15" y="10" width="12" height="80" rx="3" className="fill-slate-900 dark:fill-white transition-colors duration-300" />
          <path
            d="M27 50 L75 10 L45 50 L80 90 Z"
            fill="url(#keel-gradient)"
          />
          <defs>
            <linearGradient id="keel-gradient" x1="27" y1="50" x2="80" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#0052cc" />
              <stop offset="100%" stopColor="#00a2ff" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="font-display text-xl font-bold tracking-[0.3em] text-slate-900 dark:text-white uppercase leading-none transition-colors duration-300">
          Keel
        </span>
        {showTagline && (
          <span className="text-[8px] tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold uppercase mt-1 leading-none transition-colors duration-300">
            Operational Intelligence
          </span>
        )}
      </div>
    </div>
  );
}

/** Signature element: ruled three-column ledger for the canonical fixture. */
function WorkedExampleLedger({ className = "" }: { className?: string }) {
  return (
    <figure className={`border border-[var(--border)] bg-[var(--card)] ${className}`}>
      <figcaption className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Worked example, not a portfolio.
        </span>
        <span className="mono text-[10px] text-slate-400 dark:text-slate-500">voyage_001</span>
      </figcaption>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
        <div className="px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 mb-2">
            Owner claim
          </p>
          <p className="mono text-2xl md:text-3xl font-medium tracking-tight text-[hsl(var(--owner))]">
            $187,000
          </p>
        </div>
        <div className="px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 mb-2">
            Charterer figure
          </p>
          <p className="mono text-2xl md:text-3xl font-medium tracking-tight text-[hsl(var(--charterer))]">
            $62,000
          </p>
        </div>
        <div className="px-5 py-5 bg-[var(--surface-2)]/50">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 mb-2">
            Reconciled total
          </p>
          <p className="mono text-2xl md:text-3xl font-medium tracking-tight text-slate-950 dark:text-white">
            $112,000
          </p>
        </div>
      </div>
    </figure>
  );
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--keel-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

export default function CorporateHomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200 relative overflow-hidden font-sans">
      {/* Ambient atmosphere — keel blue / cyan only */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 dark:bg-blue-900/10 blur-[120px] transition-colors duration-300" />
        <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-500/5 dark:bg-cyan-950/20 blur-[150px] transition-colors duration-300" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.4] dark:opacity-[0.15] pointer-events-none z-0 transition-opacity duration-300" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--background)]/85 border-b border-[var(--border)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className={`rounded-sm ${focusRing}`}>
            <KeelLogo />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#mission" className={`text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm ${focusRing}`}>Mission</a>
            <a href="#offerings" className={`text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm ${focusRing}`}>Offerings</a>
            <a href="#values" className={`text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm ${focusRing}`}>Values</a>
            <a href="#company" className={`text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm ${focusRing}`}>HQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className={`text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] hover:bg-[var(--surface-2)] transition-all duration-200 ${focusRing}`}
            >
              Client Portal
            </Link>
            <Link
              href="/register"
              className={`text-sm font-semibold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 hover:opacity-95 px-5 py-2.5 rounded-lg shadow-lg shadow-blue-500/10 transition-all duration-200 ${focusRing}`}
            >
              Request Enterprise Trial
            </Link>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm ${focusRing}`}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[var(--background)] border-b border-[var(--border)] px-6 py-6 flex flex-col gap-6">
            <nav className="flex flex-col gap-4">
              <a href="#mission" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm ${focusRing}`}>Mission</a>
              <a href="#offerings" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm ${focusRing}`}>Offerings</a>
              <a href="#values" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm ${focusRing}`}>Values</a>
              <a href="#company" onClick={() => setMobileMenuOpen(false)} className={`text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm ${focusRing}`}>HQ</a>
            </nav>
            <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border)]">
              <Link href="/login" className={`w-full text-center text-sm font-semibold text-slate-700 dark:text-slate-300 py-3 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-2)] rounded-lg transition-all ${focusRing}`}>
                Client Portal
              </Link>
              <Link href="/register" className={`w-full text-center text-sm font-semibold text-white bg-gradient-to-r from-blue-700 to-cyan-500 py-3 rounded-lg transition-all ${focusRing}`}>
                Request Enterprise Trial
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-6 flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-blue-200/50 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/40 text-xs font-semibold text-blue-700 dark:text-cyan-400 w-fit transition-colors duration-300">
            <span>Charterer-side demurrage audit · Alpha</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12] transition-colors duration-300">
            Owner claims $187,000.{" "}
            <span className="text-slate-600 dark:text-slate-300">Charterer holds $62,000.</span>{" "}
            <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 dark:from-blue-400 dark:via-cyan-400 dark:to-cyan-300 bg-clip-text text-transparent">
              Keel cites $112,000—on one voyage.
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl transition-colors duration-300">
            Charterer-side laytime and demurrage reconciliation. Upload the owner claim, charterparty, and statement of facts; Keel applies BIMCO 2013 weather-working-day thresholds and returns a cited reconciled total. Output is advisory.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href="/register"
              className={`px-8 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 hover:opacity-95 text-white font-semibold rounded-xl text-center shadow-lg shadow-blue-600/20 transition-opacity duration-300 ${focusRing}`}
            >
              Request Enterprise Trial
            </Link>
            <button
              type="button"
              onClick={() => setDemoModalOpen(true)}
              className={`flex items-center justify-center gap-2 px-8 py-4 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-2)] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold rounded-xl transition-colors duration-300 ${focusRing}`}
            >
              <Play size={16} />
              Watch 90s Demo
            </button>
          </div>
        </div>

        {/* Hero mock — ledger + weather threshold panel */}
        <div className="lg:col-span-6 w-full">
          <div className="relative border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl p-5 md:p-6 shadow-2xl shadow-slate-950/10 dark:shadow-slate-950/50">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--border)]">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <span className="mono text-[11px] text-slate-400 dark:text-slate-500">keel · worked example</span>
            </div>

            <WorkedExampleLedger className="mb-5" />

            <div className="border border-[var(--border)] bg-[var(--background)]/80 p-4 mb-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-300">June 16 · WWD threshold test</h2>
                <span className="shrink-0 px-2 py-0.5 border border-amber-500/25 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider">
                  Disputed day
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Threshold test on observations in the file—Beaufort and precipitation versus BIMCO 2013 WWD thresholds. Not proof the log is true.
              </p>
              <div className="flex flex-col gap-1.5 text-[11px] mono">
                <div className="flex justify-between gap-4 text-slate-500">
                  <span>Wind (Beaufort)</span>
                  <span className="text-amber-700 dark:text-amber-400 font-medium text-right">Force 7 · threshold ≥ 6</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-500">
                  <span>Precipitation</span>
                  <span className="text-amber-700 dark:text-amber-400 font-medium text-right">3.2 mm/h · threshold ≥ 2.0</span>
                </div>
                <div className="flex justify-between gap-4 font-medium border-t border-[var(--border)] pt-1.5 mt-1 text-[hsl(var(--owner))]">
                  <span>BIMCO 2013 WWD</span>
                  <span className="text-right">Exception met · clock pauses</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 border border-[var(--border)] bg-[var(--surface-2)]/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 border border-[var(--border)] bg-[var(--card)] text-[hsl(var(--owner))] shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Worked-example reconciled total
                  </span>
                  <span className="mono text-2xl font-medium text-slate-950 dark:text-white tracking-tight">$112,000</span>
                </div>
              </div>
              <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider text-slate-500 border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 shrink-0">
                Cited · advisory
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission + worked-example ledger (replaces fake portfolio stats) */}
      <section id="mission" className="relative z-10 border-t border-[var(--border)] bg-[var(--surface-2)]/40 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-400 block">The dispute</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-950 dark:text-white leading-tight">
              One voyage. Three figures. Sources required.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
              When an owner issues a $187,000 demurrage claim and the charterer&apos;s figure is $62,000, the gap is not a slogan—it is a spreadsheet fight. Keel is built for the charterer side: ingest both positions, test disputed weather days against BIMCO 2013 WWD thresholds on the observations in the file, and surface a cited reconciled total. Advisory output; not a binding determination.
            </p>
            <div className="pt-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Operating hubs</p>
              <div className="flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><Ship size={14} className="text-blue-500" /> Piraeus</span>
                <span className="flex items-center gap-1.5"><Ship size={14} className="text-cyan-500" /> London</span>
                <span className="flex items-center gap-1.5"><Ship size={14} className="text-blue-400" /> Singapore</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <WorkedExampleLedger />
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
              Canonical fixture used in product demos. Not a claim about portfolio volume, speed, or accuracy rates.
            </p>
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section id="offerings" className="relative z-10 py-20 md:py-28 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-400 block">Offerings</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-950 dark:text-white leading-tight">
            What is live in alpha—and what is not.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
            Honest status for charterer-side demurrage audit. No dated roadmaps; no clauses we do not ship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LIVE — core platform */}
          <div className="md:col-span-12 lg:col-span-7 p-8 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden flex flex-col justify-between min-h-[320px] group hover:border-blue-500/40 dark:hover:border-slate-600 transition-colors duration-300">
            <div className="absolute top-0 right-0 p-6">
              <span className="px-3 py-1 border border-emerald-500/25 bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Live
              </span>
            </div>
            <div className="flex flex-col gap-4 max-w-lg">
              <div className="p-3 border border-[var(--border)] bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <Ship size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">Claims intake &amp; demurrage audit</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ingest owner claims, charterparty, and statement-of-facts PDFs. Side-by-side reconciliation on the voyage page with click-to-source highlights. BIMCO 2013 WWD threshold checks on disputed weather days. Export a claim letter with the cited reconciled total.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/register"
                className={`inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 transition-colors rounded-sm ${focusRing}`}
              >
                Access alpha portal
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* LIVE qualified — orchestrator */}
          <div className="md:col-span-12 lg:col-span-5 p-8 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden flex flex-col justify-between min-h-[320px] group hover:border-blue-500/40 dark:hover:border-slate-600 transition-colors duration-300">
            <div className="absolute top-0 right-0 p-6">
              <span className="px-3 py-1 border border-amber-500/25 bg-amber-500/10 text-xs font-semibold text-amber-700 dark:text-amber-400">
                Live · alpha
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="p-3 border border-[var(--border)] bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <Layers size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">Pipeline orchestrator</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The end-to-end audit orchestrator runs in alpha: parse, extract, calculate, reconcile. Extraction quality is gated by schema validation—not by promises that retries or self-correction improve results.
              </p>
            </div>
            <div className="text-xs mono text-slate-400 dark:text-slate-500 pt-4">
              Qualified · in alpha
            </div>
          </div>

          {/* NOT live — email */}
          <div className="md:col-span-6 lg:col-span-4 p-6 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden flex flex-col justify-between min-h-[240px]">
            <div className="absolute top-0 right-0 p-6">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Not live</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="p-2.5 border border-[var(--border)] bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <Mail size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Email plugin</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Outlook and Gmail overlays that surface demurrage traces beside the inbox. Not available in this alpha.
              </p>
            </div>
          </div>

          {/* NOT live — document routing */}
          <div className="md:col-span-6 lg:col-span-4 p-6 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden flex flex-col justify-between min-h-[240px]">
            <div className="absolute top-0 right-0 p-6">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Not live</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="p-2.5 border border-[var(--border)] bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <FileText size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Content-based document routing</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Route parsers from document content rather than filenames. Not available in this alpha.
              </p>
            </div>
          </div>

          {/* NOT live — confidence / HITL */}
          <div className="md:col-span-12 lg:col-span-4 p-6 border border-[var(--border)] bg-[var(--card)] relative overflow-hidden flex flex-col justify-between min-h-[240px]">
            <div className="absolute top-0 right-0 p-6">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Not live</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="p-2.5 border border-[var(--border)] bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <LayoutGrid size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Confidence / human-review queue</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Stage low-confidence extractions for analyst sign-off. Not available in this alpha.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="relative z-10 border-t border-[var(--border)] bg-[var(--surface-2)]/40 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-400 block">Principles</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-950 dark:text-white leading-tight">
              How the numbers are allowed to appear.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              Extraction proposes; code decides what reaches the page. Output remains advisory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4 p-6 border border-[var(--border)] bg-[var(--card)]">
              <div className="p-2 border border-[var(--border)] bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Python calculates.</h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Models read unstructured PDFs. Laytime clocks, once-on-demurrage, and BIMCO 2013 WWD thresholds run in pure Python—so the arithmetic is not left to the model.
              </p>
            </div>
            <div className="flex flex-col gap-4 p-6 border border-[var(--border)] bg-[var(--card)]">
              <div className="p-2 border border-[var(--border)] bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">A figure without a source span is not shown.</h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Click-to-source on the voyage page ties line items to PDF spans. If there is no citeable span, the figure does not appear as a reconciled fact.
              </p>
            </div>
            <div className="flex flex-col gap-4 p-6 border border-[var(--border)] bg-[var(--card)]">
              <div className="p-2 border border-[var(--border)] bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Advisory, not adversarial counsel.</h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Engine totals and weather verdicts support charterer-side review. They are not a binding legal determination and do not replace counsel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 max-w-7xl mx-auto px-6">
        <div className="relative border border-[var(--border)] bg-[var(--card)] p-8 md:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="absolute top-[-50%] right-[-20%] w-[350px] h-[350px] rounded-full bg-cyan-500/5 dark:bg-cyan-600/10 blur-[80px] pointer-events-none" />

          <div className="flex flex-col gap-4 max-w-xl relative z-10">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight">
              Run the worked example—or bring your own PDFs.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Alpha trial for charterer-side demurrage audit. No counterparty onboarding required to inspect a cited reconciliation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10">
            <input
              type="email"
              placeholder="enterprise@shipping.co"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className={`px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-slate-400 focus:outline-none focus:border-cyan-500 ${focusRing} transition-colors w-full sm:w-[220px]`}
            />
            <Link
              href={`/register?email=${encodeURIComponent(emailInput)}`}
              className={`px-6 py-3 bg-gradient-to-r from-blue-700 to-cyan-500 hover:opacity-95 text-white font-semibold text-sm rounded-lg text-center shadow-lg shadow-blue-500/10 transition-opacity duration-200 ${focusRing}`}
            >
              Request Onboarding
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="company" className="relative z-10 border-t border-[var(--border)] bg-[var(--background)]/85 py-16 text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="flex flex-col gap-4 md:col-span-2">
            <Link href="/" className={`rounded-sm w-fit ${focusRing}`}>
              <KeelLogo showTagline={true} />
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mt-2">
              Keel Technologies provides charterer-side laytime and demurrage reconciliation. Engine calculations and reports are advisory and do not represent binding legal representation.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Offerings</span>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link href="/login" className={`hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm w-fit ${focusRing}`}>Client Portal</Link>
              <Link href="/register" className={`hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm w-fit ${focusRing}`}>Enterprise Trial</Link>
              <span className="text-slate-400 dark:text-slate-600">Email Plugin (not live)</span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Operational Hubs</span>
            <div className="flex flex-col gap-2.5 text-sm mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Ship size={12} /> Piraeus, Attica</span>
              <span className="flex items-center gap-1.5"><Ship size={12} /> London, City of</span>
              <span className="flex items-center gap-1.5"><Ship size={12} /> Singapore, Port of</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span>&copy; {new Date().getFullYear()} Keel Technologies. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </footer>

      {demoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
        >
          <div className="relative w-full max-w-4xl bg-[var(--card)] border border-[var(--border)] p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setDemoModalOpen(false)}
              aria-label="Close demo"
              className={`absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors bg-[var(--background)] border border-[var(--border)] ${focusRing}`}
            >
              <X size={20} />
            </button>
            <div className="aspect-video w-full bg-[var(--background)] flex flex-col items-center justify-center gap-4 border border-[var(--border)] relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 gap-3">
                <div className="p-4 border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit mx-auto">
                  <Play size={32} />
                </div>
                <h2 id="demo-modal-title" className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                  Keel claims reconciliation demo
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                  Mock player: document intake, side-by-side reconciliation, BIMCO 2013 WWD threshold checks, and click-to-source PDF highlights—ending on the worked-example $112,000 total.
                </p>
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(false)}
                  className={`px-6 py-2.5 bg-[var(--card)] hover:bg-[var(--surface-2)] text-slate-700 dark:text-slate-200 font-semibold text-sm mt-3 border border-[var(--border)] transition-colors ${focusRing}`}
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
