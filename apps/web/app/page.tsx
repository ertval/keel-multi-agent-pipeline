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
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

// SVG Brand Logo Component representing the official "Keel Operational Intelligence" design
function KeelLogo({ showTagline = true, className = "" }: { showTagline?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Stylized K SVG Icon */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Left Pillar - matches theme foreground (dark slate in light mode, white in dark mode) */}
          <rect x="15" y="10" width="12" height="80" rx="3" className="fill-slate-900 dark:fill-white transition-colors duration-300" />
          {/* Sweeping Right Gradient Sail / Keel Blade */}
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
      
      {/* Typography wordmark & tagline */}
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

export default function CorporateHomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200 relative overflow-hidden font-sans">
      {/* Global Ambient Gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 dark:bg-blue-900/10 blur-[120px] transition-colors duration-300" />
        <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-500/5 dark:bg-cyan-950/20 blur-[150px] transition-colors duration-300" />
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-indigo-500/5 dark:bg-indigo-950/10 blur-[100px] transition-colors duration-300" />
      </div>

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.4] dark:opacity-[0.15] pointer-events-none z-0 transition-opacity duration-300" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--background)]/85 border-b border-[var(--border)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <KeelLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#mission" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Mission</a>
            <a href="#offerings" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Offerings</a>
            <a href="#values" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Values</a>
            <a href="#company" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">HQ</a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/login" 
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] hover:bg-[var(--surface-2)] transition-all duration-200"
            >
              Client Portal
            </Link>
            <Link 
              href="/login" 
              className="text-sm font-semibold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 hover:opacity-95 px-5 py-2.5 rounded-lg shadow-lg shadow-blue-500/10 transition-all duration-200"
            >
              Open the Demo
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[var(--background)] border-b border-[var(--border)] px-6 py-6 flex flex-col gap-6 animate-fade-in">
            <nav className="flex flex-col gap-4">
              <a 
                href="#mission" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Mission
              </a>
              <a 
                href="#offerings" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Offerings
              </a>
              <a 
                href="#values" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Values
              </a>
              <a 
                href="#company" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                HQ
              </a>
            </nav>
            <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border)]">
              <Link 
                href="/login"
                className="w-full text-center text-sm font-semibold text-slate-700 dark:text-slate-300 py-3 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-2)] rounded-lg transition-all"
              >
                Client Portal
              </Link>
              <Link 
                href="/login"
                className="w-full text-center text-sm font-semibold text-white bg-gradient-to-r from-blue-700 to-cyan-500 py-3 rounded-lg transition-all"
              >
                Open the Demo
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left Copy block */}
        <div className="lg:col-span-6 flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/10 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-900/50 text-xs font-semibold text-blue-700 dark:text-cyan-400 w-fit transition-colors duration-300">
            <Sparkles size={13} className="text-blue-600 dark:text-cyan-400" />
            <span>Hackathon demo build &bull; fixture voyage &bull; needs a live OpenAI key</span>
          </div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight transition-colors duration-300">
            Bringing Deterministic <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:via-cyan-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Truth to Global Trade.
            </span>
          </h2>

          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl transition-colors duration-300">
            Maritime shipping is the bedrock of global commerce, yet billions of dollars remain trapped in adversarial demurrage disputes. Keel Technologies transforms unstructured port logs and divergent interpretations into mathematically verified, defensible truths.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link 
              href="/login" 
              className="px-8 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 hover:opacity-95 text-white font-semibold rounded-xl text-center shadow-lg shadow-blue-600/20 transition-all duration-300 hover:scale-[1.02]"
            >
              Open the Demo
            </Link>
            <button 
              onClick={() => setDemoModalOpen(true)}
              className="flex items-center justify-center gap-2 px-8 py-4 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-2)] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold rounded-xl transition-all duration-300"
            >
              <Play size={16} />
              How the Demo Works
            </button>
          </div>
        </div>

        {/* Right Dashboard Mockup (Visual Highlight Centerpiece) */}
        <div className="lg:col-span-6 w-full animate-slide-up">
          <div className="relative rounded-2xl bg-[var(--card)]/90 dark:bg-slate-900/40 backdrop-blur-xl border border-[var(--border)] p-6 shadow-2xl shadow-slate-950/10 dark:shadow-slate-950/50 group hover:border-slate-400/50 dark:hover:border-slate-700/80 transition-all duration-500">
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[10px] font-semibold text-slate-500 dark:text-slate-400 z-10">
              Figures below are the real output of voyage_001
            </div>
            {/* Header window control buttons */}
            <div className="flex items-center justify-between mb-6 pt-2 pb-4 border-b border-[var(--border)]">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-800" />
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-800" />
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-800" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">/voyage/voyage_001/reconcile</span>
            </div>

            {/* Reconciliation Comparison Card */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Owner interpret */}
              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Shipowner Interpretation</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-200">$187,000.00</span>
                <span className="text-[11px] text-rose-600 dark:text-rose-500 block mt-1">Owner better supported on 2 of 3 disputed days</span>
              </div>
              {/* Charterer interpret */}
              <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Charterer Interpretation</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-200">$62,000.00</span>
                <span className="text-[11px] text-blue-600 dark:text-cyan-400 block mt-1">Charterer better supported on 1 of 3 disputed days</span>
              </div>
            </div>

            {/* Disputed-window highlight */}
            <div className="p-4 rounded-xl bg-[var(--background)]/90 border border-[var(--border)] relative overflow-hidden mb-6">
              <div className="absolute top-0 right-0 p-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  Disputed Window
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-2">16 June 2026 Weather Exception</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Charterer claimed Weather Exception. Keel evaluated the fixture hourly weather log for Piraeus:
              </p>
              <div className="flex flex-col gap-1.5 text-[11px] font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Wind Speed (Beaufort):</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Force 7 (Charterparty &ge; Bft 6)</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Precipitation Rate:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">5.6 mm/h (Charterparty &ge; 2.0)</span>
                </div>
              <div className="flex justify-between text-slate-400 dark:text-slate-500">
                <span>Measurement basis for an excepted period:</span>
                <span>EXCLUDED PERIOD AS AN ACTUAL PERIOD</span>
              </div>

                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t border-[var(--border)] pt-1.5 mt-1">
                  <span>Charterparty threshold test:</span>
                  <span>EXCEPTION APPLIES &middot; TIME NOT COUNTED</span>
                </div>
              </div>
            </div>

            {/* Reconciliation Statement Output */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[var(--background)] to-[var(--surface-2)] border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Reconciled Total</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">$112,000.00</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block px-3 py-1 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                Claim reduced by $75,000
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Mission Section */}
      <section id="mission" className="relative z-10 border-t border-[var(--border)] bg-[var(--surface-2)]/40 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-400 block">The Friction in Global Trade</span>
            <h3 className="font-display text-3xl md:text-4xl font-bold text-slate-950 dark:text-white leading-tight">
              Resolving Dispute Deadlocks in Seconds.
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
              When a shipowner issues a $187,000 demurrage claim and a charterer&apos;s calculations reflect $62,000, months of adversarial legal friction and capital lockup follow. Keel Technologies was founded to break this deadlock. We provide single-player, defensible audit trails that bridge the gap between counterparties—equipping maritime pioneers with the intelligence required to resolve disputes in seconds.
            </p>
            <div className="pt-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">What This Build Actually Does</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                One fixture charterparty and two statements of facts from Piraeus. The
                pipeline reads them with a live OpenAI key, then a pure-Python state
                machine produces the laytime arithmetic. There are no other voyages
                in this build and no customer data.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col items-center justify-center gap-2">
              <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">$187k&rarr;$112k</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Owner claim vs reconciled total</span>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col items-center justify-center gap-2">
              <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-500 to-emerald-500 dark:from-cyan-400 dark:to-emerald-400 bg-clip-text text-transparent">&lt; 2s</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Cold pipeline runtime</span>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col items-center justify-center gap-2">
              <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">3</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Disputed days assessed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Offerings & Architectural Roadmap */}
      <section id="offerings" className="relative z-10 py-20 md:py-28 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-400 block">Offerings &amp; Roadmap</span>
          <h3 className="font-display text-3xl md:text-4xl font-bold text-slate-950 dark:text-white leading-tight">
            Institutional Laytime &amp; Audit Architecture.
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
            Discover our active enterprise features alongside the upcoming components of our operational intelligence platform.
          </p>
        </div>

        {/* Offerings Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Flagsip Claims Platform (Active) */}
          <div className="md:col-span-12 lg:col-span-7 p-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] relative overflow-hidden flex flex-col justify-between min-h-[320px] group hover:border-blue-500/50 dark:hover:border-slate-700/80 transition-all duration-300">
            <div className="absolute top-0 right-0 p-6">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Works Today
              </span>
            </div>
            <div className="flex flex-col gap-4 max-w-lg">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <Ship size={24} />
              </div>
              <h4 className="text-xl font-bold text-slate-950 dark:text-white">Keel Claims Intake &amp; Demurrage Audit Platform</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Our core operational portal. Ingest owner claims, charterparty agreements, and Statement of Facts PDFs. Our layout-aware parsing and state machine models evaluate weather disputes, calculate laytime state progressions, and compile audited demurrage settlement letters.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-white group-hover:text-blue-700 dark:group-hover:text-cyan-400 transition-colors"
              >
                Open the Demo
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Email integration (Coming Soon) */}
          <div className="md:col-span-12 lg:col-span-5 p-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] relative overflow-hidden flex flex-col justify-between min-h-[320px] group hover:border-blue-500/50 dark:hover:border-slate-700/80 transition-all duration-300">
            <div className="absolute top-0 right-0 p-6">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-cyan-400">
                Coming Soon
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <Mail size={24} />
              </div>
              <h4 className="text-xl font-bold text-slate-950 dark:text-white">Enterprise Email Plugin</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Verify calculations directly within daily analyst workflows. Outlook Add-in and Chrome/Gmail extension overlay demurrage trace details, weather observations, and PDF citations directly adjacent to email clients.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 dark:text-slate-500">
              Target: Q3 2026 Release
            </div>
          </div>

          {/* Card 3: Classification */}
          <div className="md:col-span-6 lg:col-span-4 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] relative overflow-hidden flex flex-col justify-between min-h-[260px] group hover:border-blue-500/50 dark:hover:border-slate-700/80 transition-all duration-300">
            <div className="absolute top-0 right-0 p-6">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Coming Soon</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <FileText size={20} />
              </div>
              <h4 className="text-base font-bold text-slate-950 dark:text-white">Document Classification</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Content-based parser routing that eliminates file naming dependencies. Analyzes document text layouts to detect scanned, non-searchable PDFs and fail-loud immediately.
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-600">Roadmap Phase 1.1</div>
          </div>

          {/* Card 4: Validation Gates */}
          <div className="md:col-span-6 lg:col-span-4 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] relative overflow-hidden flex flex-col justify-between min-h-[260px] group hover:border-blue-500/50 dark:hover:border-slate-700/80 transition-all duration-300">
            <div className="absolute top-0 right-0 p-6">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Gate Live · UI Not Built</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <LayoutGrid size={20} />
              </div>
              <h4 className="text-base font-bold text-slate-950 dark:text-white">Validation Gates &amp; HITL</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The validation gate runs today: a validator node re-checks the
                extracted terms and coordinates and sends them back to the
                extraction worker up to three times. The visual Human-in-the-Loop
                review workspace is not built.
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-600">HITL workspace: not started</div>
          </div>

          {/* Card 5: Multi-agent */}
          <div className="md:col-span-12 lg:col-span-4 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] relative overflow-hidden flex flex-col justify-between min-h-[260px] group hover:border-blue-500/50 dark:hover:border-slate-700/80 transition-all duration-300">
            <div className="absolute top-0 right-0 p-6">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Runs Today
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <Layers size={20} />
              </div>
              <h4 className="text-base font-bold text-slate-950 dark:text-white">Multi-Agent Orchestrator</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                An Orchestrator-Worker-Validator agentic model, as a LangGraph state
                machine: an orchestrator, separate charterparty and SOF extraction
                workers, a validator with a bounded retry policy, the laytime
                engine, and a final step that weighs both parties&apos; positions.
                Model fallback is not implemented.
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-600">Model fallback: not started</div>
          </div>
        </div>
      </section>

      {/* Corporate Values */}
      <section id="values" className="relative z-10 border-t border-[var(--border)] bg-[var(--surface-2)]/40 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-400 block">Corporate Principles</span>
            <h3 className="font-display text-3xl md:text-4xl font-bold text-slate-950 dark:text-white leading-tight">
              Our Operational Mandate.
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              The guidelines governing how this codebase handles evidence and
              security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <ShieldCheck size={20} />
              </div>
              <h4 className="text-lg font-bold text-slate-950 dark:text-white">Egoless Truth &amp; Accuracy</h4>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                AI reads, but deterministic code calculates. We isolate LLM extractions behind strict Pydantic model gates. All laytime and weather analysis is processed via pure Python deterministic state machine classes to ensure zero calculation hallucinations.
              </p>
            </div>
            {/* Value 2 */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <Layers size={20} />
              </div>
              <h4 className="text-lg font-bold text-slate-950 dark:text-white">The Producer Mentality</h4>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We design operational software that defends margins and reduces claims analysis cycles from months to seconds. Every database configuration, API path, and micro-latency optimization is measured by its concrete business outcome.
              </p>
            </div>
            {/* Value 3 */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="text-lg font-bold text-slate-950 dark:text-white">Auditable Transparency</h4>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every calculated figure carries the page of the source document it
                came from. When a figure cannot be traced to a named document, the
                row says so rather than pointing at a plausible-looking guess. This
                build ships no source PDFs, so the on-screen preview and its
                highlight are unavailable here &mdash; the citations themselves are
                real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Call-to-Action Card */}
      <section className="relative z-10 py-20 max-w-7xl mx-auto px-6">
        <div className="relative rounded-2xl bg-gradient-to-br from-[var(--card)] via-[var(--card)]/90 to-blue-500/5 dark:to-blue-950/40 border border-[var(--border)] p-8 md:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          {/* Ambient light glow inside card */}
          <div className="absolute top-[-50%] right-[-20%] w-[350px] h-[350px] rounded-full bg-cyan-500/5 dark:bg-cyan-600/10 blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col gap-4 max-w-xl">
            <h3 className="font-display text-2xl md:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight">
              Run the Fixture Voyage End to End.
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              There is no trial, no sales process, and no account to create in this
              build. The demo runs the pipeline over the bundled Piraeus documents
              and reconciles the two parties&apos; figures against the weather log.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Link
              href="/login"
              className="px-8 py-3.5 bg-gradient-to-r from-blue-700 to-cyan-500 hover:opacity-95 text-white font-semibold text-sm rounded-lg text-center shadow-lg shadow-blue-500/10 transition-all duration-200"
            >
              Open the Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Corporate Footer */}
      <footer id="company" className="relative z-10 border-t border-[var(--border)] bg-[var(--background)]/85 py-16 text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Col 1 Brand */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <Link href="/">
              <KeelLogo showTagline={true} />
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mt-2">
              Keel Technologies provides operational intelligence, layout-aware contract extraction, and laytime analysis. Engine calculations and reports are advisory and do not represent binding legal representation.
            </p>
          </div>
          {/* Col 2 Product */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">Offerings</span>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link href="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">Client Portal (Demo)</Link>
              <span className="text-slate-400 dark:text-slate-600">Email Plugin (Not Built)</span>
            </div>
          </div>
          {/* Col 3 Build status */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">This Build</span>
            <div className="flex flex-col gap-2.5 text-sm text-slate-500 dark:text-slate-400">
              <span>Fixture data, not customer data</span>
              <span>No API key needed for the demo voyage; a key is needed to extract from your own PDFs</span>
              <span>No authentication, no accounts</span>
              <span>No SOC 2, ISO or GDPR certification</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span>&copy; {new Date().getFullYear()} Keel Technologies. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} />
            Hackathon demo build. Advisory output only &mdash; not audited, not
            certified, and not legal advice.
          </span>
        </div>
      </footer>

      {/* Demo Explainer Modal */}
      <Dialog open={demoModalOpen} onOpenChange={setDemoModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="p-4 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 w-fit mx-auto border border-blue-500/20">
              <Play size={32} />
            </div>
            <DialogTitle>How the Demo Works</DialogTitle>
            <DialogDescription className="text-center">
              There is no recorded video for this build. In the portal, open the
              new-voyage dialog and run the bundled fixture: a charterparty and
              two statements of facts are parsed, the terms are extracted with
              an LLM, a deterministic state machine computes laytime, and the
              weather exception is tested against the charterparty&apos;s own
              threshold. Every figure is cited back to the page it came from.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-cyan-500 hover:opacity-95 text-white font-semibold rounded-lg text-sm shadow-lg shadow-blue-500/10 transition-all duration-200"
            >
              Open the Demo
            </Link>
            <Button
              variant="outline"
              onClick={() => setDemoModalOpen(false)}
              className="px-6 py-2.5 text-sm"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
