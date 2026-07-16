'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowDown, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  CloudRain, 
  Wind, 
  Mail, 
  FileText, 
  Workflow, 
  Scale, 
  LineChart 
} from 'lucide-react';
import { ThemeToggle } from "@/components/ThemeToggle";

// Reusable CSS-based fade-in transition
const FadeIn = ({ children, delay = 0, y = 20, className }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) => (
  <div
    className={`${className || ""} animate-slide-up`}
    style={{ animationDelay: `${delay}s`, animationFillMode: 'both' }}
  >
    {children}
  </div>
);

// Official Keel Logo Component
const KeelLogo = ({ className }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Solid vertical pillar - matches theme foreground (dark slate in light mode, white in dark mode) */}
      <rect x="6" y="4" width="8" height="32" rx="1" className="fill-slate-900 dark:fill-white transition-colors duration-300" />
      {/* Sweeping curved sail blade */}
      <path 
        d="M14 4 C 22 14, 28 24, 34 36 C 26 32, 20 22, 14 4 Z" 
        fill="url(#keel_gradient)" 
      />
      <defs>
        <linearGradient id="keel_gradient" x1="14" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a8a" />
          <stop offset="1" stopColor="#00a2ff" />
        </linearGradient>
      </defs>
    </svg>
    <div className="flex flex-col">
      <span className="text-slate-900 dark:text-white font-bold text-lg tracking-[0.3em] leading-none transition-colors duration-300">K E E L</span>
      <span className="text-slate-500 dark:text-slate-400 text-[10px] tracking-[0.2em] uppercase mt-1 transition-colors duration-300">Operational Intelligence</span>
    </div>
  </div>
);

export default function KeelTechnologiesHome() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden selection:bg-blue-500/30 transition-colors duration-300">
      
      {/* Ambient Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 dark:bg-[#1e3a8a] rounded-full filter blur-[120px] opacity-20 dark:mix-blend-screen transition-all duration-300"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 dark:bg-[#00a2ff] rounded-full filter blur-[120px] opacity-10 dark:mix-blend-screen transition-all duration-300"></div>
      </div>

      {/* === HEADER === */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--background)]/85 border-b border-[var(--border)] transition-all duration-300">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <KeelLogo />
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500 dark:text-slate-300 font-medium transition-colors">
            <a href="#mission" className="hover:text-slate-950 dark:hover:text-white transition-colors">Mission</a>
            <a href="#offerings" className="hover:text-slate-950 dark:hover:text-white transition-colors">Offerings</a>
            <a href="#values" className="hover:text-slate-950 dark:hover:text-white transition-colors">Values</a>
            <a href="#company" className="hover:text-slate-950 dark:hover:text-white transition-colors">Company</a>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white border border-[var(--border)] hover:bg-[var(--surface-2)] rounded-lg transition-all">
              Client Portal
            </Link>
            <Link href="/register" className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#1e3a8a] via-[#0052cc] to-[#00a2ff] rounded-lg hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/20">
              Request Enterprise Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        
        {/* === HERO SECTION === */}
        <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-xs font-medium text-blue-600 dark:text-blue-300 tracking-wide transition-colors">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Maritime AI • Phase 1 Alpha Live
            </span>
          </FadeIn>
          
          <FadeIn delay={0.1}>
            <h1 className="mt-8 text-5xl md:text-7xl font-bold tracking-tight text-slate-950 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:to-slate-400 max-w-4xl leading-[1.1] transition-colors">
              Bringing Deterministic Truth to Global Maritime Operations.
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-8 max-w-2xl text-lg text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
              Maritime shipping is the bedrock of global commerce, yet billions of dollars remain trapped in adversarial demurrage disputes. Keel Technologies transforms unstructured port logs and divergent interpretations into mathematically verified, defensible truths.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-[#1e3a8a] via-[#0052cc] to-[#00a2ff] rounded-xl hover:scale-[1.02] transition-transform shadow-xl shadow-blue-500/20">
                Request Enterprise Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#offerings" className="flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-2)] rounded-xl transition-all">
                Explore Our Platform <ArrowDown className="w-4 h-4" />
              </a>
            </div>
          </FadeIn>

          {/* Hero Visual Mockup */}
          <FadeIn delay={0.4} y={40} className="mt-24 w-full max-w-5xl">
            <div className="relative bg-[var(--card)]/90 dark:bg-slate-900/40 backdrop-blur-xl border border-[var(--border)] rounded-2xl p-2 shadow-2xl transition-colors">
              <div className="bg-[var(--background)] rounded-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left border border-[var(--border)] transition-colors">
                {/* Comparison Column */}
                <div className="flex flex-col justify-center space-y-4 border-r border-[var(--border)] pr-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Shipowner Claim</p>
                    <p className="text-2xl font-bold text-red-500 dark:text-red-400">$187,000</p>
                  </div>
                  <div className="h-px bg-[var(--border)]"></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Charterer Calc</p>
                    <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">$62,000</p>
                  </div>
                </div>

                {/* Weather Dispute Card */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-center transition-colors">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                    <CloudRain className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Weather Dispute</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">June 16</p>
                  <p className="text-xs text-slate-500 mt-1">Beaufort Force 7 + Heavy Rain</p>
                  <div className="mt-3 h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-[#0052cc] to-[#00a2ff]"></div>
                  </div>
                </div>

                {/* Reconciled Truth Block */}
                <div className="flex flex-col justify-center bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-4 text-[#10b981]">
                  <p className="text-xs uppercase tracking-widest mb-1">Reconciled Truth</p>
                  <p className="text-3xl font-extrabold tracking-tight">$112,000</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-xs font-semibold">Defensible Baseline</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* === CORPORATE MISSION === */}
        <section id="mission" className="max-w-7xl mx-auto px-6 py-24 border-t border-[var(--border)] bg-[var(--surface-2)]/40 transition-colors">
          <FadeIn className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950 dark:text-white transition-colors">The Friction in Global Trade</h2>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
              When a shipowner issues a $187,000 demurrage claim and a charterer's calculations reflect $62,000, months of adversarial legal friction and capital lockup follow. Keel Technologies was founded to break this deadlock. We provide single-player, defensible audit trails that bridge the gap between counterparties—equipping maritime pioneers with the intelligence required to resolve disputes in seconds.
            </p>
          </FadeIn>

          <FadeIn delay={0.2} className="mt-16 text-center">
            <p className="text-sm text-slate-500 uppercase tracking-widest mb-12">
              Proudly serving top-tier charterers, shipowners, and trading houses across Piraeus, London, and Singapore.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { metric: "$50M+", label: "Disputed Claims Analyzed" },
                { metric: "< 10s", label: "Average Reconciliation Time" },
                { metric: "100%", label: "Calculation Auditability" }
              ].map((item, i) => (
                <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 hover:border-slate-400/50 dark:hover:border-slate-700 transition-all duration-300">
                  <p className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#0052cc] to-[#00a2ff] bg-clip-text text-transparent">{item.metric}</p>
                  <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* === ENTERPRISE OFFERINGS === */}
        <section id="offerings" className="max-w-7xl mx-auto px-6 py-24">
          <FadeIn>
            <h2 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white mb-12 transition-colors">Enterprise Offerings &amp; Architectural Roadmap</h2>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 auto-rows-fr">
            {/* Card 1 - Featured */}
            <FadeIn className="lg:col-span-4 lg:row-span-2" delay={0.1}>
              <div className="h-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 flex flex-col justify-between hover:border-blue-500/50 dark:hover:border-slate-700 transition-all duration-300 group">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4">
                    Phase 1 Alpha Live
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950 dark:text-white transition-colors">Keel Claims Intake &amp; Demurrage Audit Platform</h3>
                  <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">
                    Our flagship single-player platform. Ingests counterparty claims alongside your own CP and SOF PDFs. Utilizes advanced fact extraction and a pure Python deterministic state machine to evaluate disputed weather windows against port weather logs, instantly resolving divergent calculations into a defensible baseline (reconciling a $187K vs $62K gap to exactly $112K) and exporting a formal settlement claim letter.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FileText className="w-4 h-4" /> <span className="text-sm font-semibold">PDF Extraction Enabled</span>
                </div>
              </div>
            </FadeIn>

            {/* Card 2 */}
            <FadeIn className="lg:col-span-2" delay={0.2}>
              <div className="h-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:border-blue-500/50 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-4" />
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white transition-colors">Enterprise Email Integration Plugin</h3>
                  <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Bring Keel's deterministic audit engine directly into your daily communications workflow via Outlook &amp; Chrome extensions.</p>
                </div>
                <span className="mt-4 inline-block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Coming Soon</span>
              </div>
            </FadeIn>

            {/* Card 3 */}
            <FadeIn className="lg:col-span-2" delay={0.3}>
              <div className="h-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:border-blue-500/50 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <Workflow className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-4" />
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white transition-colors">Content-Based Document Classification</h3>
                  <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Eliminating brittle filename ingestion. Autonomously inspects text geometry to dynamically route documents with fail-loud detection.</p>
                </div>
                <span className="mt-4 inline-block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Coming Soon</span>
              </div>
            </FadeIn>

            {/* Card 4 */}
            <FadeIn className="lg:col-span-3" delay={0.4}>
              <div className="h-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:border-blue-500/50 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-4" />
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white transition-colors">Pydantic Validation Gates &amp; HITL Review</h3>
                  <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Institutional-grade verification boundaries enforcing strict chronological event ordering. Low-confidence extractions are staged in a Next.js Human-in-the-Loop visual dashboard for analyst sign-off.</p>
                </div>
                <span className="mt-4 inline-block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Coming Soon</span>
              </div>
            </FadeIn>

            {/* Card 5 */}
            <FadeIn className="lg:col-span-3" delay={0.5}>
              <div className="h-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:border-blue-500/50 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <LineChart className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-4" />
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white transition-colors">Multi-Agent Orchestrator &amp; Fallback Chains</h3>
                  <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Redesigning our linear extraction engine into a robust Orchestrator-Worker-Validator topology backed by exponential backoff for zero downtime.</p>
                </div>
                <span className="mt-4 inline-block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Coming Soon</span>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* === CORE VALUES === */}
        <section id="values" className="max-w-7xl mx-auto px-6 py-24">
          <FadeIn>
            <h2 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white mb-12 transition-colors">Core Corporate Values</h2>
          </FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1 - Large */}
            <FadeIn className="lg:col-span-3" delay={0.1}>
              <div className="h-full bg-gradient-to-r from-[var(--card)] to-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-8 hover:border-slate-400 dark:hover:border-slate-700 transition-colors">
                <div className="grid md:grid-cols-3 gap-8 items-center">
                  <div className="md:col-span-1">
                    <Scale className="w-8 h-8 text-blue-600 dark:text-[#00a2ff] mb-4" />
                    <h3 className="text-2xl font-bold text-slate-950 dark:text-white transition-colors">Egoless Truth &amp; Deterministic Accuracy</h3>
                  </div>
                  <p className="md:col-span-2 text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">
                    AI is utilized exclusively to read the unstructured reality of port logs and legal prose. All calculations are governed by a 100% deterministic pure Python state machine. Zero hallucinated liabilities.
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* Card 2 */}
            <FadeIn className="lg:col-span-1" delay={0.2}>
              <div className="h-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:border-blue-500/50 dark:hover:border-slate-700 transition-all duration-300">
                <Wind className="w-6 h-6 text-blue-600 dark:text-[#00a2ff] mb-4" />
                <h3 className="text-xl font-bold text-slate-950 dark:text-white transition-colors">The Producer Mentality</h3>
                <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  We engineer systems designed to eliminate operational friction, reduce claim resolution cycles from months to seconds, and actively defend our clients' balance sheets.
                </p>
              </div>
            </FadeIn>

            {/* Card 3 */}
            <FadeIn className="lg:col-span-2" delay={0.3}>
              <div className="h-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:border-blue-500/50 dark:hover:border-slate-700 transition-all duration-300">
                <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-[#00a2ff] mb-4" />
                <h3 className="text-xl font-bold text-slate-950 dark:text-white transition-colors">Auditable Transparency</h3>
                <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Trust requires verification. Keel features an interactive PDF citation engine—clicking any dollar figure or timestamp instantly overlays a bounding box highlight directly over the exact line item in the source document.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* === CONVERSION CTA === */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] p-12 md:p-16 text-center bg-gradient-to-br from-[var(--card)] via-[var(--card)]/90 to-blue-500/5 dark:to-blue-950/40 shadow-2xl transition-all duration-300">
              {/* Radial Mesh Background */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle,_#0052cc_0%,_transparent_70%)] opacity-5 dark:opacity-20 blur-2xl transition-all duration-300"></div>
                <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-[radial-gradient(circle,_#00a2ff_0%,_transparent_70%)] opacity-5 dark:opacity-10 blur-2xl transition-all duration-300"></div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-950 dark:text-white tracking-tight max-w-3xl mx-auto transition-colors">
                  Ready to secure your maritime assets and eliminate claim friction?
                </h2>
                <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto transition-colors">
                  Start your 14-day Enterprise Alpha Trial today. Zero onboarding friction. Ingest your first disputed claim in 60 seconds.
                </p>
                <Link href="/register" className="mt-10 inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-[#1e3a8a] via-[#0052cc] to-[#00a2ff] rounded-xl hover:scale-[1.02] transition-transform shadow-xl shadow-blue-500/30">
                  Request Enterprise Onboarding <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* === FOOTER === */}
        <footer id="company" className="border-t border-[var(--border)] bg-[var(--background)]/85 mt-24 transition-colors">
          <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-slate-500 dark:text-slate-400 transition-colors">
            <div>
              <KeelLogo />
              <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mt-2 transition-colors">
                Keel Technologies provides advanced analytics, operational intelligence, and negotiation support. Outputs are advisory and do not constitute formal legal representation.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <h4 className="text-slate-700 dark:text-slate-400 font-semibold mb-2 uppercase tracking-widest text-xs transition-colors">Platform</h4>
              <Link href="/login" className="text-slate-500 hover:text-slate-905 dark:hover:text-white transition-colors">Client Portal</Link>
              <Link href="/register" className="text-slate-500 hover:text-slate-905 dark:hover:text-white transition-colors">Enterprise Trial</Link>
              <a href="#" className="text-slate-500 hover:text-slate-905 dark:hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-slate-905 dark:hover:text-white transition-colors">Terms of Service</a>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <h4 className="text-slate-700 dark:text-slate-400 font-semibold mb-2 uppercase tracking-widest text-xs transition-colors">Headquarters</h4>
              <p className="text-slate-500">Athens, Greece</p>
              <p className="text-slate-500">London, United Kingdom</p>
            </div>
          </div>
          <div className="border-t border-[var(--border)] py-6 text-center text-xs text-slate-600 transition-colors">
            © {new Date().getFullYear()} Keel Technologies. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}