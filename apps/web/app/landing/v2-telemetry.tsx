import Image from "next/image";
import Link from "next/link";
import { Explainer } from "./parts/Explainer";
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
 * Variant 2 — engine-room telegraph and bell book.
 *
 * Soot panels, brass engraving, one red telegraph lamp on the reconciled
 * figure. Not a phosphor terminal.
 */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#E7D7A1]";
const PRESS =
  "transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none";

const STATIONS = ["FULL", "HALF", "SLOW", "STOP", "ASTERN"] as const;

function Telegraph() {
  return (
    <div className="flex items-stretch gap-4 rounded-sm border border-[#C4A35A]/50 bg-[#141C26] p-4 shadow-[inset_0_0_0_1px_rgba(196,163,90,0.15)]">
      <div className="relative hidden w-14 shrink-0 sm:block" aria-hidden="true">
        <div className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-[#C4A35A]/70" />
        {STATIONS.map((station, index) => (
          <div
            key={station}
            className="absolute left-0 flex w-full items-center justify-center"
            style={{ top: `${8 + index * 18}%` }}
          >
            <span className="bg-[#141C26] px-1 font-plex-mono text-[0.5rem] tracking-[0.14em] text-[#C4A35A]">
              {station}
            </span>
          </div>
        ))}
        <div className="absolute top-[58%] left-1/2 h-1.5 w-9 origin-left -translate-y-1/2 rotate-[-18deg] rounded-full bg-[#E7D7A1] shadow-[0_0_12px_rgba(231,215,161,0.8)] motion-safe:animate-[keel-lever_700ms_ease-out]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-plex-mono text-[0.625rem] tracking-[0.22em] text-[#C4A35A]">
          ENGINE TELEGRAPH · RECONCILED
        </p>
        <p className="mt-3 font-plex-mono text-4xl font-semibold tabular-nums text-[#F3E6C4] sm:text-5xl">
          {RECONCILED.figure}
        </p>
        <p className="mt-3 flex items-center gap-2 font-plex-mono text-xs text-[#E7E1D6]">
          <span className="inline-block size-2.5 rounded-full bg-[#A33B32] shadow-[0_0_10px_rgba(163,59,50,0.9)]" />
          Lamp on the settled figure
        </p>
        <p className="mt-4 font-plex-mono text-[0.6875rem] leading-relaxed text-[#C9C2B4]">
          {RECONCILED.arithmetic}
        </p>
      </div>
      <style>{`@keyframes keel-lever { from { transform: rotate(-72deg); } to { transform: rotate(-18deg); } }`}</style>
    </div>
  );
}

export default function TelemetryVariant() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#0C1218] text-[#E7E1D6] antialiased">
      <a
        href="#main-telemetry"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#141C26] focus:px-3 focus:py-2 focus:text-sm ${FOCUS}`}
      >
        Skip to content
      </a>
      <div className="border-b border-[#C4A35A]/30 bg-[#101820] px-4 py-2 font-plex-mono text-[0.625rem] tracking-[0.16em] text-[#C4A35A] sm:px-6">
        BELL BOOK · {BRAND.vessel.toUpperCase()} · {BRAND.port.toUpperCase()} · {BRAND.fixture}
      </div>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className={`inline-flex items-center gap-3 ${FOCUS}`}>
          <Image src="/logo.png" alt="" width={28} height={28} unoptimized className="size-7" />
          <span className="font-archivo text-sm font-semibold tracking-[0.18em] text-[#E7D7A1]">
            {BRAND.name.toUpperCase()} · ENGINE ROOM
          </span>
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-4 font-plex-mono text-[0.6875rem] text-[#C9C2B4] md:flex">
          {FOOTER.sectionLinks.map(([label, href]) => (
            <a key={href} href={href} className={`hover:text-[#E7D7A1] ${FOCUS}`}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main id="main-telemetry" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <section className="grid items-start gap-8 border-b border-[#C4A35A]/25 py-10 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="min-w-0">
            <p className="font-plex-mono text-[0.6875rem] tracking-[0.2em] text-[#C4A35A]">{HERO.eyebrow}</p>
            <h1 className="mt-3 max-w-[18ch] font-archivo text-[clamp(2rem,1.2rem+2.4vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-balance text-[#F4EFE4]">
              {HERO.heading}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#C9C2B4] sm:text-base">{HERO.lede}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className={`inline-flex min-h-11 items-center bg-[#A33B32] px-5 font-archivo text-sm font-semibold tracking-wide text-[#F4EFE4] hover:bg-[#8B3A2E] ${FOCUS} ${PRESS}`}
              >
                {CLOSING.cta}
              </Link>
              <Explainer
                triggerClassName={`inline-flex min-h-11 items-center border border-[#C4A35A]/60 px-5 font-archivo text-sm text-[#E7D7A1] hover:bg-[#C4A35A]/10 ${FOCUS} ${PRESS}`}
                panelClassName="border border-[#C4A35A]/40 bg-[#141C26] text-[#E7E1D6]"
              />
            </div>
          </div>
          <Telegraph />
        </section>

        <section className="grid gap-px border-b border-[#C4A35A]/25 py-8 sm:grid-cols-3">
          {[
            [OWNER.role, OWNER.party, OWNER.note, OWNER.figure],
            [CHARTERER.role, CHARTERER.party, CHARTERER.note, CHARTERER.figure],
            [RECONCILED.label, BRAND.vessel, BRAND.port, RECONCILED.figure],
          ].map(([role, party, note, figure]) => (
            <div key={role} className="border border-[#C4A35A]/20 bg-[#101820] p-4">
              <p className="font-plex-mono text-[0.625rem] tracking-[0.16em] text-[#C4A35A]">{role}</p>
              <p className="mt-3 font-plex-mono text-2xl tabular-nums text-[#F4EFE4]">{figure}</p>
              <p className="mt-2 text-xs text-[#C9C2B4]">{party}</p>
              <p className="text-xs text-[#8E887C]">{note}</p>
            </div>
          ))}
        </section>

        <section id={LEDGER.anchor} className="border-b border-[#C4A35A]/25 py-12">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.18em] text-[#C4A35A]">{LEDGER.kicker}</p>
          <h2 className="mt-2 font-archivo text-3xl font-semibold tracking-[-0.03em] text-[#F4EFE4]">{LEDGER.heading}</h2>
          <ol className="mt-8 divide-y divide-[#C4A35A]/20 border-y border-[#C4A35A]/30">
            {DISPUTED_DAYS.map((day) => (
              <li key={day.date} className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr_auto] sm:items-baseline">
                <p className="font-plex-mono text-sm tabular-nums text-[#E7D7A1]">{day.date}</p>
                <div className="min-w-0 text-sm">
                  <p>
                    Claimed {day.claimed} · adverse {day.adverse}
                  </p>
                  <p className="text-[#C9C2B4]">{day.weather}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#C4A35A]">{day.winner}</p>
                </div>
                <p className="font-plex-mono text-lg tabular-nums">{day.credited}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[#C9C2B4]">{LEDGER.thresholdNote}</p>
        </section>

        <section id={METHOD.anchor} className="border-b border-[#C4A35A]/25 py-12">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.18em] text-[#C4A35A]">{METHOD.eyebrow}</p>
          <h2 className="mt-2 max-w-[20ch] font-archivo text-3xl font-semibold tracking-[-0.03em] text-balance text-[#F4EFE4]">
            {METHOD.heading}
          </h2>
          <ol className="mt-8 space-y-4">
            {STEPS.map((step) => (
              <li key={step.n} className="grid gap-3 border-l-2 border-[#C4A35A]/50 pl-4 sm:grid-cols-[3rem_1fr]">
                <p className="font-plex-mono text-sm text-[#C4A35A]">{step.n}</p>
                <div>
                  <h3 className="font-archivo text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#C9C2B4]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id={BUILD.anchor} className="py-12">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.18em] text-[#C4A35A]">{BUILD.eyebrow}</p>
          <h2 className="mt-2 font-archivo text-3xl font-semibold tracking-[-0.03em] text-[#F4EFE4]">{BUILD.heading}</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-plex-mono text-xs tracking-[0.16em] text-[#E7D7A1]">{BUILD.runsHeading}</h3>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed text-[#C9C2B4]">
                {RUNS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-plex-mono text-xs tracking-[0.16em] text-[#C4A35A]">{BUILD.absentHeading}</h3>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed text-[#C9C2B4]">
                {DOES_NOT_RUN.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            {FIXTURE_FACTS.map(([term, value]) => (
              <div key={term} className="border border-[#C4A35A]/20 px-3 py-2">
                <dt className="font-plex-mono text-[0.625rem] tracking-[0.14em] text-[#C4A35A]">{term}</dt>
                <dd className="text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t border-[#C4A35A]/30 py-12">
          <h2 className="font-archivo text-2xl font-semibold text-[#F4EFE4]">{CLOSING.heading}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#C9C2B4]">{CLOSING.body}</p>
          <Link
            href="/login"
            className={`mt-6 inline-flex min-h-11 items-center bg-[#E7D7A1] px-5 font-archivo text-sm font-semibold text-[#1A1208] ${FOCUS} ${PRESS}`}
          >
            {CLOSING.portal}
          </Link>
        </section>
      </main>

      <footer className="border-t border-[#C4A35A]/30 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:justify-between">
          <p className="max-w-md text-sm text-[#C9C2B4]">{FOOTER.blurb}</p>
          <ul className="space-y-1 text-xs text-[#8E887C]">
            {FOOTER.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <p className="mx-auto mt-6 max-w-6xl font-plex-mono text-[0.625rem] tracking-[0.14em] text-[#C4A35A]">
          {FOOTER.colophon}
        </p>
      </footer>
    </div>
  );
}
