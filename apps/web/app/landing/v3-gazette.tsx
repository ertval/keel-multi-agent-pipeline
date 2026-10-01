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
 * Variant 3 — hydrographic notice to mariners.
 *
 * Chart stock and indigo ink, with the reconciled arithmetic set as a
 * correction patch. Not a newspaper masthead.
 */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#8C2F2F]";
const PRESS =
  "transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none";

export default function GazetteVariant() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#E7E4D8] text-[#1C2840] antialiased">
      <a
        href="#main-gazette"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#E7E4D8] focus:px-3 focus:py-2 ${FOCUS}`}
      >
        Skip to content
      </a>
      <div className="bg-[#1C2840] px-4 py-2 font-plex-mono text-[0.625rem] tracking-[0.18em] text-[#E7E4D8] sm:px-8">
        NOTICE TO MARINERS · {BRAND.port.toUpperCase()} · NOT A NAVIGATION CHART
      </div>
      <header className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 py-5 sm:px-8">
        <div>
          <p className="font-news text-2xl italic text-[#1C2840]">{BRAND.name}</p>
          <p className="font-plex-mono text-[0.625rem] tracking-[0.16em] text-[#3E4C66]">{BRAND.domain}</p>
        </div>
        <nav aria-label="Sections" className="flex flex-wrap justify-end gap-x-4 gap-y-1 font-plex-mono text-[0.6875rem]">
          {FOOTER.sectionLinks.map(([label, href]) => (
            <a key={href} href={href} className={`underline decoration-[#A6843D] underline-offset-4 ${FOCUS}`}>
              {label}
            </a>
          ))}
          <Link href="/login" className={`underline decoration-[#8C2F2F] underline-offset-4 ${FOCUS}`}>
            {CLOSING.portal}
          </Link>
        </nav>
      </header>

      <main id="main-gazette" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-10 sm:px-8">
        <section className="grid gap-8 border-y-2 border-[#1C2840] py-8 lg:grid-cols-[16rem_1fr]">
          <aside className="border border-[#1C2840] bg-[#F3F0E6] p-4">
            <p className="font-plex-mono text-[0.625rem] tracking-[0.16em] text-[#8C2F2F]">CIRCULAR</p>
            <p className="mt-2 font-news text-3xl leading-none">{BRAND.fixture}</p>
            <dl className="mt-4 space-y-3 text-sm">
              {FIXTURE_FACTS.map(([term, value]) => (
                <div key={term}>
                  <dt className="font-plex-mono text-[0.625rem] tracking-[0.12em] text-[#3E4C66]">{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
          <div className="min-w-0">
            <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#8C2F2F]">{HERO.eyebrow}</p>
            <h1 className="mt-2 font-news text-[clamp(2.1rem,1.2rem+2.6vw,3.75rem)] leading-[1.02] font-medium tracking-[-0.02em] text-balance">
              {HERO.heading}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">{HERO.lede}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className={`inline-flex min-h-11 items-center bg-[#1C2840] px-5 text-sm text-[#E7E4D8] ${FOCUS} ${PRESS}`}
              >
                {CLOSING.cta}
              </Link>
              <Explainer
                triggerClassName={`inline-flex min-h-11 items-center border border-[#1C2840] px-5 text-sm ${FOCUS} ${PRESS}`}
                panelClassName="bg-[#F3F0E6] text-[#1C2840]"
              />
            </div>
          </div>
        </section>

        <section id={LEDGER.anchor} className="py-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#8C2F2F]">{LEDGER.kicker}</p>
              <h2 className="font-news text-3xl">{LEDGER.heading}</h2>
            </div>
            <p className="font-plex-mono text-xs text-[#3E4C66]">
              {BRAND.vessel} · {BRAND.port}
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="min-w-0 space-y-3">
              <article className="grid gap-1 border-b border-[#1C2840]/30 pb-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-news text-xl">{OWNER.role}</h3>
                  <p className="text-sm">{OWNER.party}</p>
                  <p className="text-sm text-[#3E4C66]">{OWNER.note}</p>
                </div>
                <p className="font-plex-mono text-2xl tabular-nums">{OWNER.figure}</p>
              </article>
              <article className="grid gap-1 border-b border-[#1C2840]/30 pb-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-news text-xl">{CHARTERER.role}</h3>
                  <p className="text-sm">{CHARTERER.party}</p>
                  <p className="text-sm text-[#3E4C66]">{CHARTERER.note}</p>
                </div>
                <p className="font-plex-mono text-2xl tabular-nums line-through decoration-[#8C2F2F]">{CHARTERER.figure}</p>
              </article>
            </div>
            <aside className="border-2 border-dashed border-[#8C2F2F] bg-[#F7F1E4] p-4">
              <p className="font-plex-mono text-[0.625rem] tracking-[0.18em] text-[#8C2F2F]">CORRECTION</p>
              <p className="mt-2 font-news text-sm">{RECONCILED.label}</p>
              <p className="font-plex-mono text-3xl tabular-nums">{RECONCILED.figure}</p>
              <p className="mt-3 text-sm leading-relaxed">{RECONCILED.arithmetic}</p>
            </aside>
          </div>

          <div className="mt-8 overflow-x-auto border border-[#1C2840]">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="sr-only">{LEDGER.heading}</caption>
              <thead className="bg-[#1C2840] font-plex-mono text-[0.6875rem] tracking-wide text-[#E7E4D8]">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Claimed</th>
                  <th className="px-3 py-2 font-medium">Adverse</th>
                  <th className="px-3 py-2 font-medium">Observation</th>
                  <th className="px-3 py-2 font-medium">Side</th>
                  <th className="px-3 py-2 text-right font-medium">Credited</th>
                </tr>
              </thead>
              <tbody>
                {DISPUTED_DAYS.map((day) => (
                  <tr key={day.date} className="border-t border-[#1C2840]/20">
                    <td className="px-3 py-3 font-plex-mono tabular-nums">{day.date}</td>
                    <td className="px-3 py-3 tabular-nums">{day.claimed}</td>
                    <td className="px-3 py-3 tabular-nums">{day.adverse}</td>
                    <td className="px-3 py-3">{day.weather}</td>
                    <td className="px-3 py-3 capitalize">{day.winner}</td>
                    <td className="px-3 py-3 text-right font-plex-mono tabular-nums">{day.credited}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#243044]">{LEDGER.thresholdNote}</p>
        </section>

        <section id={METHOD.anchor} className="border-t-2 border-[#1C2840] py-12">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#8C2F2F]">{METHOD.eyebrow}</p>
          <h2 className="max-w-[22ch] font-news text-3xl text-balance">{METHOD.heading}</h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((step) => (
              <li key={step.n} className="grid gap-2 sm:grid-cols-[4rem_1fr]">
                <p className="font-news text-2xl text-[#A6843D]">{step.n}</p>
                <div>
                  <h3 className="font-news text-xl">{step.title}</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id={BUILD.anchor} className="border-t border-[#1C2840]/40 py-12">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#8C2F2F]">{BUILD.eyebrow}</p>
          <h2 className="font-news text-3xl">{BUILD.heading}</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="font-plex-mono text-xs tracking-[0.14em]">{BUILD.runsHeading}</h3>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed">
                {RUNS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-plex-mono text-xs tracking-[0.14em]">{BUILD.absentHeading}</h3>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed">
                {DOES_NOT_RUN.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t-2 border-[#1C2840] py-10">
          <h2 className="font-news text-2xl">{CLOSING.heading}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed">{CLOSING.body}</p>
        </section>
      </main>

      <footer className="border-t border-[#1C2840] bg-[#F3F0E6] px-4 py-8 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2">
          <p className="max-w-md text-sm">{FOOTER.blurb}</p>
          <ul className="space-y-1 text-xs text-[#3E4C66]">
            {FOOTER.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <p className="mx-auto mt-6 max-w-6xl font-plex-mono text-[0.625rem] tracking-[0.14em]">{FOOTER.colophon}</p>
      </footer>
    </div>
  );
}
