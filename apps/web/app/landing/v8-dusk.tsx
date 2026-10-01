import Link from "next/link";
import { Explainer } from "./parts/Explainer";
import { TideWaterSlot } from "./parts/TideWaterSlot";
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
 * Variant 8 — tide almanac at dusk.
 *
 * A Three.js water plane sits behind the hero. The tide table is the record;
 * the canvas is the roadstead and stays out of the accessibility tree.
 */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#E0B07A]";
const PRESS =
  "transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none";

export default function DuskVariant() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#07141C] text-[#E7E2D6] antialiased">
      <a
        href="#dusk-main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#07141C] focus:px-3 focus:py-2 ${FOCUS}`}
      >
        Skip to content
      </a>

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className={`font-fraunces text-xl italic ${FOCUS}`}>
          {BRAND.name}
        </Link>
        <nav aria-label="Sections" className="hidden flex-wrap justify-end gap-3 font-plex-mono text-[0.6875rem] text-[#8ECAE6] md:flex">
          {FOOTER.sectionLinks.map(([label, href]) => (
            <a key={href} href={href} className={FOCUS}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main id="dusk-main" tabIndex={-1}>
        <section className="relative min-h-[34rem] overflow-hidden">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <TideWaterSlot />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07141C] from-35% via-[#07141C]/75 via-55% to-transparent" />
          <div className="relative mx-auto grid max-w-6xl items-end gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="min-w-0">
              <p className="font-plex-mono text-[0.6875rem] tracking-[0.18em] text-[#E0B07A]">
                {HERO.eyebrow} · {BRAND.port}
              </p>
              <h1 className="mt-3 max-w-[14ch] font-fraunces text-[clamp(2.4rem,1.2rem+3.2vw,4.5rem)] leading-[0.95] font-medium tracking-[-0.03em] text-balance text-[#F4EFE6]">
                {HERO.heading}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#D5D0C6] sm:text-base">{HERO.lede}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className={`inline-flex min-h-11 items-center bg-[#E0B07A] px-5 font-plex-mono text-sm text-[#1A120C] ${FOCUS} ${PRESS}`}
                >
                  {CLOSING.cta}
                </Link>
                <Explainer
                  triggerClassName={`inline-flex min-h-11 items-center border border-[#E0B07A]/70 px-5 font-plex-mono text-sm text-[#E0B07A] ${FOCUS} ${PRESS}`}
                  panelClassName="border border-[#E0B07A]/40 bg-[#10202A] text-[#E7E2D6]"
                />
              </div>
            </div>
            <aside className="bg-[#E7E2D6] p-5 text-[#1A2430]">
              <p className="font-plex-mono text-[0.625rem] tracking-[0.16em] text-[#8A5A32]">TIDE ALMANAC</p>
              <p className="mt-2 font-fraunces text-sm">{RECONCILED.label}</p>
              <p className="font-fraunces text-5xl leading-none tabular-nums text-[#163646]">{RECONCILED.figure}</p>
              <p className="mt-3 text-sm leading-relaxed">{RECONCILED.arithmetic}</p>
              <p className="mt-4 font-plex-mono text-[0.6875rem]">
                {OWNER.figure} owner · {CHARTERER.figure} charterer
              </p>
            </aside>
          </div>
        </section>

        <section id={LEDGER.anchor} className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#8ECAE6]">{LEDGER.kicker}</p>
          <h2 className="mt-2 font-fraunces text-3xl text-[#F4EFE6]">{LEDGER.heading}</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">{LEDGER.heading}</caption>
              <thead className="font-plex-mono text-[0.6875rem] tracking-wide text-[#8ECAE6]">
                <tr className="border-b border-[#8ECAE6]/30">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Claimed</th>
                  <th className="py-2 pr-3 font-medium">Adverse</th>
                  <th className="py-2 pr-3 font-medium">Weather</th>
                  <th className="py-2 pr-3 font-medium">Side</th>
                  <th className="py-2 text-right font-medium">Credited</th>
                </tr>
              </thead>
              <tbody>
                {DISPUTED_DAYS.map((day) => (
                  <tr key={day.date} className="border-b border-white/10">
                    <td className="py-3 pr-3 font-plex-mono tabular-nums text-[#E0B07A]">{day.date}</td>
                    <td className="py-3 pr-3 tabular-nums">{day.claimed}</td>
                    <td className="py-3 pr-3 tabular-nums">{day.adverse}</td>
                    <td className="py-3 pr-3">{day.weather}</td>
                    <td className="py-3 pr-3 capitalize">{day.winner}</td>
                    <td className="py-3 text-right font-plex-mono tabular-nums">{day.credited}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <p className="text-sm leading-relaxed text-[#D5D0C6]">
              <span className="font-fraunces text-[#F4EFE6]">{OWNER.role}. </span>
              {OWNER.party}. {OWNER.note}.
            </p>
            <p className="text-sm leading-relaxed text-[#D5D0C6]">
              <span className="font-fraunces text-[#F4EFE6]">{CHARTERER.role}. </span>
              {CHARTERER.party}. {CHARTERER.note}.
            </p>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#C9C3B8]">{LEDGER.thresholdNote}</p>
        </section>

        <section id={METHOD.anchor} className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#E0B07A]">{METHOD.eyebrow}</p>
            <h2 className="mt-2 max-w-[18ch] font-fraunces text-3xl text-balance text-[#F4EFE6]">{METHOD.heading}</h2>
            <ol className="mt-8 space-y-5">
              {STEPS.map((step) => (
                <li key={step.n} className="grid gap-2 border-l border-[#8ECAE6]/40 pl-4 sm:grid-cols-[3rem_1fr]">
                  <p className="font-plex-mono text-sm text-[#8ECAE6]">{step.n}</p>
                  <div>
                    <h3 className="font-fraunces text-xl">{step.title}</h3>
                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#C9C3B8]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id={BUILD.anchor} className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <p className="font-plex-mono text-[0.6875rem] tracking-[0.16em] text-[#E0B07A]">{BUILD.eyebrow}</p>
            <h2 className="mt-2 font-fraunces text-3xl text-[#F4EFE6]">{BUILD.heading}</h2>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="font-plex-mono text-xs tracking-[0.14em] text-[#8ECAE6]">{BUILD.runsHeading}</h3>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed text-[#C9C3B8]">
                  {RUNS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-plex-mono text-xs tracking-[0.14em] text-[#E0B07A]">{BUILD.absentHeading}</h3>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed text-[#C9C3B8]">
                  {DOES_NOT_RUN.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              {FIXTURE_FACTS.map(([term, value]) => (
                <div key={term} className="border border-white/10 px-3 py-2">
                  <dt className="font-plex-mono text-[0.625rem] tracking-[0.12em] text-[#8ECAE6]">{term}</dt>
                  <dd className="text-sm">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-10">
              <h2 className="font-fraunces text-2xl text-[#F4EFE6]">{CLOSING.heading}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#C9C3B8]">{CLOSING.body}</p>
              <Link
                href="/login"
                className={`mt-5 inline-flex min-h-11 items-center border border-[#E0B07A] px-5 font-plex-mono text-sm text-[#E0B07A] ${FOCUS} ${PRESS}`}
              >
                {CLOSING.portal}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2">
          <p className="max-w-md text-sm text-[#C9C3B8]">{FOOTER.blurb}</p>
          <ul className="space-y-1 text-xs text-[#8E98A0]">
            {FOOTER.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <p className="mx-auto mt-6 max-w-6xl font-plex-mono text-[0.625rem] tracking-[0.14em] text-[#E0B07A]">
          {FOOTER.colophon}
        </p>
      </footer>
    </div>
  );
}
