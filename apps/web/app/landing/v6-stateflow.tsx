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
 * Variant 6 — harbour-master whiteboard.
 *
 * Marker ink on a cool board. The five steps are the diagram. No violet glass,
 * no agent-product skin.
 */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#C23B3B]";
const PRESS =
  "transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none";

export default function StateflowVariant() {
  return (
    <div
      className="min-h-dvh overflow-x-clip bg-[#F3F5F4] text-[#1E2A32] antialiased"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(31,58,95,0.05) 1px, transparent 1px), linear-gradient(rgba(31,58,95,0.05) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <a
        href="#main-stateflow"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#F3F5F4] focus:px-3 focus:py-2 ${FOCUS}`}
      >
        Skip to content
      </a>
      <div className="flex items-center justify-between bg-[#1F3A5F] px-4 py-2 text-[#F3F5F4] sm:px-6">
        <p className="font-bricolage text-sm font-semibold">Harbour board · {BRAND.port}</p>
        <p className="font-plex-mono text-[0.625rem] tracking-[0.14em]">{BRAND.fixture}</p>
      </div>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className={`font-bricolage text-xl font-semibold ${FOCUS}`}>
          {BRAND.name}
        </Link>
        <nav aria-label="Sections" className="flex flex-wrap justify-end gap-3 font-plex-mono text-[0.6875rem] text-[#2B6CB0]">
          {FOOTER.sectionLinks.map(([label, href]) => (
            <a key={href} href={href} className={FOCUS}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main id="main-stateflow" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <section className="py-6">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#C23B3B]">{HERO.eyebrow}</p>
          <h1 className="mt-2 max-w-[16ch] font-bricolage text-[clamp(2.2rem,1.1rem+3vw,4rem)] leading-[0.95] font-semibold tracking-[-0.03em] text-balance text-[#1F3A5F]">
            {HERO.heading}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">{HERO.lede}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className={`inline-flex min-h-11 items-center bg-[#1F3A5F] px-5 text-sm text-white ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta}
            </Link>
            <Explainer
              triggerClassName={`inline-flex min-h-11 items-center border-2 border-[#1F3A5F] px-5 text-sm ${FOCUS} ${PRESS}`}
              panelClassName="bg-[#F3F5F4] text-[#1E2A32]"
            />
          </div>
        </section>

        <section className="grid gap-3 py-4 sm:grid-cols-3">
          <BoardNote kicker={OWNER.role} title={OWNER.figure} body={`${OWNER.party}. ${OWNER.note}`} tone="blue" />
          <BoardNote kicker={CHARTERER.role} title={CHARTERER.figure} body={`${CHARTERER.party}. ${CHARTERER.note}`} tone="red" />
          <BoardNote kicker={RECONCILED.label} title={RECONCILED.figure} body={RECONCILED.arithmetic} tone="ink" />
        </section>

        <section id={METHOD.anchor} className="py-10">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#2B6CB0]">{METHOD.eyebrow}</p>
          <h2 className="max-w-[20ch] font-bricolage text-3xl font-semibold text-balance text-[#1F3A5F]">{METHOD.heading}</h2>
          <ol className="mt-6 grid gap-3 lg:grid-cols-5">
            {STEPS.map((step, index) => (
              <li key={step.n} className="relative min-w-0 rounded-sm bg-white/80 p-3 shadow-[0_1px_0_rgba(31,58,95,0.15)]">
                {index < STEPS.length - 1 ? (
                  <span className="absolute top-6 -right-2 hidden h-px w-4 bg-[#2B6CB0] lg:block" aria-hidden="true" />
                ) : null}
                <p className="font-plex-mono text-xs text-[#2B6CB0]">{step.n}</p>
                <h3 className="mt-1 font-bricolage text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id={LEDGER.anchor} className="py-8">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#C23B3B]">{LEDGER.kicker}</p>
          <h2 className="font-bricolage text-3xl font-semibold text-[#1F3A5F]">{LEDGER.heading}</h2>
          <div className="relative mt-8 border-t-4 border-[#1F3A5F] pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              {DISPUTED_DAYS.map((day) => (
                <article key={day.date}>
                  <span
                    className={`mb-3 inline-block size-4 rounded-full ${day.winner === "owner" ? "bg-[#2B6CB0]" : "bg-[#C23B3B]"}`}
                    aria-hidden="true"
                  />
                  <p className="font-plex-mono text-sm">{day.date}</p>
                  <p className="mt-1 font-bricolage text-2xl font-semibold tabular-nums">{day.credited}</p>
                  <p className="text-sm">
                    {day.claimed} claimed · {day.adverse} adverse
                  </p>
                  <p className="text-sm text-[#3D4C57]">{day.weather}</p>
                  <p className="mt-1 font-plex-mono text-xs tracking-[0.12em] uppercase">{day.winner}</p>
                </article>
              ))}
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed">{LEDGER.thresholdNote}</p>
          <dl className="mt-6 grid gap-2 sm:grid-cols-2">
            {FIXTURE_FACTS.map(([term, value]) => (
              <div key={term} className="bg-white/70 px-3 py-2">
                <dt className="font-plex-mono text-[0.625rem] tracking-[0.12em] text-[#2B6CB0]">{term}</dt>
                <dd className="text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id={BUILD.anchor} className="py-10">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#2B6CB0]">{BUILD.eyebrow}</p>
          <h2 className="font-bricolage text-3xl font-semibold text-[#1F3A5F]">{BUILD.heading}</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-bricolage text-lg font-semibold text-[#2B6CB0]">{BUILD.runsHeading}</h3>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed">
                {RUNS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bricolage text-lg font-semibold text-[#C23B3B]">{BUILD.absentHeading}</h3>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed">
                {DOES_NOT_RUN.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t-4 border-[#1F3A5F] py-10">
          <h2 className="font-bricolage text-2xl font-semibold text-[#1F3A5F]">{CLOSING.heading}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed">{CLOSING.body}</p>
          <Link href="/login" className={`mt-4 inline-flex min-h-11 items-center text-sm underline ${FOCUS}`}>
            {CLOSING.portal}
          </Link>
        </section>
      </main>

      <footer className="px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2">
          <p className="max-w-md text-sm">{FOOTER.blurb}</p>
          <ul className="space-y-1 text-xs text-[#3D4C57]">
            {FOOTER.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <p className="mx-auto mt-4 max-w-6xl font-plex-mono text-[0.625rem] tracking-[0.14em]">{FOOTER.colophon}</p>
      </footer>
    </div>
  );
}

function BoardNote({
  kicker,
  title,
  body,
  tone,
}: {
  kicker: string;
  title: string;
  body: string;
  tone: "blue" | "red" | "ink";
}) {
  const ink = tone === "red" ? "text-[#C23B3B]" : tone === "blue" ? "text-[#2B6CB0]" : "text-[#1F3A5F]";
  return (
    <article className="rotate-[-0.4deg] bg-white p-4 shadow-[3px_4px_0_rgba(31,58,95,0.12)]">
      <p className={`font-plex-mono text-[0.625rem] tracking-[0.14em] uppercase ${ink}`}>{kicker}</p>
      <p className={`mt-2 font-bricolage text-3xl font-semibold tabular-nums ${ink}`}>{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{body}</p>
    </article>
  );
}
