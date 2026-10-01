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
 * Variant 5 — container bay plan.
 *
 * The key stays `swiss` because the switcher and the e2e walk address it by
 * that name. The page itself is a bay-row-tier stow of the claim, with one
 * safety-orange casting on the reconciled slot.
 */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#E25B12]";
const PRESS =
  "transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none";

function Castings({ hot = false }: { hot?: boolean }) {
  const tone = hot ? "bg-[#E25B12]" : "bg-[#0A0A0A]";
  return (
    <>
      <span className={`absolute top-1 left-1 size-2 ${tone}`} />
      <span className={`absolute top-1 right-1 size-2 ${tone}`} />
      <span className={`absolute bottom-1 left-1 size-2 ${tone}`} />
      <span className={`absolute right-1 bottom-1 size-2 ${tone}`} />
    </>
  );
}

export default function SwissVariant() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#F4F4F2] text-[#0A0A0A] antialiased">
      <a
        href="#main-swiss"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:px-3 focus:py-2 ${FOCUS}`}
      >
        Skip to content
      </a>
      <div className="flex items-center justify-between gap-3 bg-[#0B3A6A] px-4 py-2 font-plex-mono text-[0.625rem] tracking-[0.16em] text-white sm:px-6">
        <span>
          {BRAND.vessel} · {BRAND.port} · {BRAND.fixture}
        </span>
        <span className="hidden sm:inline">BAY PLAN</span>
      </div>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className={`font-archivo text-lg font-black tracking-[-0.04em] ${FOCUS}`}>
          {BRAND.name}
        </Link>
        <div className="flex items-center gap-3">
          <nav aria-label="Sections" className="hidden gap-4 font-plex-mono text-[0.6875rem] md:flex">
            {FOOTER.sectionLinks.map(([label, href]) => (
              <a key={href} href={href} className={FOCUS}>
                {label}
              </a>
            ))}
          </nav>
          <Link
            href="/login"
            className={`inline-flex min-h-10 items-center bg-[#E25B12] px-3 font-archivo text-xs font-bold tracking-wide text-white ${FOCUS} ${PRESS}`}
          >
            {CLOSING.cta}
          </Link>
        </div>
      </header>

      <main id="main-swiss" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <section className="grid items-end gap-8 border-b-4 border-[#0A0A0A] py-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="min-w-0">
            <p className="font-plex-mono text-[0.6875rem] tracking-[0.18em] text-[#0B3A6A]">{HERO.eyebrow}</p>
            <h1 className="mt-2 max-w-[16ch] break-words font-archivo text-[clamp(2.1rem,1rem+3vw,4.25rem)] leading-[0.9] font-black tracking-[-0.045em] text-balance">
              {HERO.heading}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#243044] sm:text-base">{HERO.lede}</p>
            <div className="mt-6">
              <Explainer
                triggerClassName={`inline-flex min-h-11 items-center border-2 border-[#0A0A0A] px-4 font-archivo text-sm font-bold ${FOCUS} ${PRESS}`}
                panelClassName="bg-white text-[#0A0A0A]"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Slot code="O-01" title={OWNER.role} party={OWNER.party} note={OWNER.note} figure={OWNER.figure} />
            <Slot code="C-01" title={CHARTERER.role} party={CHARTERER.party} note={CHARTERER.note} figure={CHARTERER.figure} />
            <Slot code="R-01" title={RECONCILED.label} party={BRAND.port} note={RECONCILED.arithmetic} figure={RECONCILED.figure} hot />
          </div>
        </section>

        <section id={LEDGER.anchor} className="py-12">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#E25B12]">{LEDGER.kicker}</p>
          <h2 className="font-archivo text-3xl font-black tracking-[-0.04em]">{LEDGER.heading}</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {DISPUTED_DAYS.map((day, index) => (
              <article key={day.date} className="relative border-2 border-[#0A0A0A] bg-white p-4">
                <Castings hot={day.winner === "charterer"} />
                <p className="font-plex-mono text-[0.625rem] tracking-[0.14em]">SLOT {String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 font-archivo text-xl font-black">{day.date}</p>
                <p className="mt-2 text-sm">
                  {day.claimed} claimed · {day.adverse} adverse
                </p>
                <p className="text-sm text-[#243044]">{day.weather}</p>
                <p className="mt-3 font-plex-mono text-xs tracking-[0.12em] uppercase">{day.winner}</p>
                <p className="font-plex-mono text-2xl font-semibold tabular-nums">{day.credited}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed">{LEDGER.thresholdNote}</p>
        </section>

        <section id={METHOD.anchor} className="border-t-4 border-[#0A0A0A] py-12">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#0B3A6A]">{METHOD.eyebrow}</p>
          <h2 className="max-w-[18ch] font-archivo text-3xl font-black tracking-[-0.04em] text-balance">{METHOD.heading}</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step) => (
              <li key={step.n} className="min-w-0 border-2 border-[#0A0A0A] p-3">
                <p className="font-plex-mono text-xs text-[#E25B12]">{step.n}</p>
                <h3 className="mt-1 font-archivo text-base font-black">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id={BUILD.anchor} className="border-t-4 border-[#0B3A6A] py-12">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em]">{BUILD.eyebrow}</p>
          <h2 className="font-archivo text-3xl font-black tracking-[-0.04em]">{BUILD.heading}</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="border-2 border-[#0A0A0A] p-4">
              <h3 className="font-archivo text-sm font-black">{BUILD.runsHeading}</h3>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed">
                {RUNS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="border-2 border-[#E25B12] p-4">
              <h3 className="font-archivo text-sm font-black">{BUILD.absentHeading}</h3>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed">
                {DOES_NOT_RUN.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <dl className="mt-6 grid gap-2 sm:grid-cols-3">
            {FIXTURE_FACTS.map(([term, value]) => (
              <div key={term} className="bg-white p-3">
                <dt className="font-plex-mono text-[0.625rem] tracking-[0.12em] text-[#0B3A6A]">{term}</dt>
                <dd className="text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t-4 border-[#0A0A0A] py-10">
          <h2 className="font-archivo text-2xl font-black tracking-[-0.04em]">{CLOSING.heading}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed">{CLOSING.body}</p>
        </section>
      </main>

      <footer className="bg-[#0A0A0A] px-4 py-8 text-[#F4F4F2] sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2">
          <p className="max-w-md text-sm text-[#D5D5D2]">{FOOTER.blurb}</p>
          <ul className="space-y-1 text-xs text-[#B7B7B4]">
            {FOOTER.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <p className="mx-auto mt-6 max-w-6xl font-plex-mono text-[0.625rem] tracking-[0.14em] text-[#E25B12]">
          {FOOTER.colophon}
        </p>
      </footer>
    </div>
  );
}

function Slot({
  code,
  title,
  party,
  note,
  figure,
  hot = false,
}: {
  code: string;
  title: string;
  party: string;
  note: string;
  figure: string;
  hot?: boolean;
}) {
  return (
    <article className={`relative border-2 p-3 ${hot ? "border-[#E25B12] bg-[#0A0A0A] text-white" : "border-[#0A0A0A] bg-white"}`}>
      <Castings hot={hot} />
      <div className="flex items-baseline justify-between gap-3 pl-3">
        <p className="font-plex-mono text-[0.625rem] tracking-[0.16em]">{code}</p>
        <p className="font-plex-mono text-xl font-semibold tabular-nums">{figure}</p>
      </div>
      <p className="mt-1 pl-3 font-archivo text-sm font-black">{title}</p>
      <p className={`pl-3 text-xs ${hot ? "text-[#D5D5D2]" : "text-[#243044]"}`}>{party}</p>
      <p className={`pl-3 text-xs leading-relaxed ${hot ? "text-[#D5D5D2]" : "text-[#243044]"}`}>{note}</p>
    </article>
  );
}
