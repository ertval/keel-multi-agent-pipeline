import Image from "next/image";
import Link from "next/link";
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
 * Variant 8 — Dusk.
 *
 * The one atmospheric design in the set: open water at last light. A forced
 * dark navy palette identical in both app themes (no `.dark` class, no
 * ThemeToggle), a CSS-only gradient-mesh horizon built from four stacked
 * radial-gradients, a fine `feTurbulence` grain, and glass panels whose blur
 * picks the mesh up underneath them.
 *
 * The reconciled figure is the loudest element on the page by construction: it
 * is the only panel raised a step in fill and edge opacity, it carries its own
 * local halo, and nothing else on the page is allowed above `text-slate-200`.
 *
 * Entrance motion is one scale-and-fade on the hero and a staggered rise on
 * every section. Both are 300ms or less, `cubic-bezier(0.23,1,0.32,1)`, gated
 * behind `motion-safe:` so a reduced-motion visitor sees the finished page with
 * no animation at all. No loops, no parallax, no scroll listeners — this is a
 * server component and the whole page is static HTML.
 */

/**
 * `focus-visible:outline-solid` is not optional. Tailwind v4's no-outline
 * utility sets `--tw-outline-style: none` on the same element and `outline-2`
 * reads that variable straight back, so pairing the two paints nothing at all.
 * The teal-300 ring clears 3:1 against every ground on the page, darkest mesh
 * included, and the 2px offset keeps it off the buttons' own fills.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-teal-300";

const PRESS =
  "transition-[transform,background-color,border-color,color] duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none";

/** The one glass recipe. Only the reconciled panel deviates, and it says so. */
const GLASS = "border border-white/10 bg-white/[0.045] backdrop-blur-xl";

/** Labels: mono, uppercase, wide — the quietest voice on the page.
 *  `slate-300`, not `slate-400`: over the brightest patch of the mesh and over
 *  the `bg-white/[0.045]` glass, slate-400 measured 3.56:1 and 3.13:1. */
const LABEL =
  "font-plex-mono text-[0.6875rem] uppercase tracking-[0.2em] text-slate-300";

const H2 =
  "font-archivo-expanded text-[clamp(1.75rem,1.1rem+2.4vw,2.75rem)] font-bold leading-[1.02] tracking-[-0.025em] text-white text-balance";

const OWNER_ACCENT = "border-teal-300/25 bg-teal-300/10 text-teal-300";
const CHARTERER_ACCENT = "border-orange-300/25 bg-orange-300/10 text-orange-300";

/* ── Atmosphere ──────────────────────────────────────────────────────────────
 * Five layers, each a separate `absolute inset-0` div so nothing can push the
 * page wider than the viewport. Percentages are resolved against the root's own
 * height, so the mesh is composed as a vertical descent — indigo zenith, a pale
 * horizon band, deep water, one warm ember, and a vignette that sinks the
 * corners. */
const MESH_BASE =
  "linear-gradient(180deg,#0b1230 0%,#080d1a 34%,#060a14 68%,#04070e 100%)";
const MESH_ZENITH =
  "radial-gradient(124% 40% at 50% -5%, rgba(79,70,229,0.40) 0%, rgba(67,56,202,0.15) 40%, rgba(79,70,229,0) 74%)";
const MESH_HORIZON =
  "radial-gradient(88% 22% at 50% 27%, rgba(165,243,252,0.24) 0%, rgba(56,189,248,0.09) 44%, rgba(56,189,248,0) 76%)";
const MESH_DEEP =
  "radial-gradient(98% 30% at 8% 56%, rgba(13,148,136,0.32) 0%, rgba(13,148,136,0.10) 46%, rgba(13,148,136,0) 78%)";
const MESH_EMBER =
  "radial-gradient(74% 24% at 93% 80%, rgba(249,115,22,0.24) 0%, rgba(217,119,6,0.08) 46%, rgba(249,115,22,0) 78%)";
const MESH_SINK =
  "radial-gradient(132% 106% at 50% 6%, rgba(4,6,14,0) 42%, rgba(3,5,12,0.78) 100%)";

/** Fine film grain, 180px tile, screen-blended so it lifts rather than greys. */
const GRAIN_IMAGE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E\")";

/** The light the reconciled figure sits in. Local, so it cannot drift. */
const HALO =
  "radial-gradient(78% 130% at 50% 4%, rgba(224,242,254,0.30) 0%, rgba(125,211,252,0.16) 36%, rgba(125,211,252,0) 70%)";

const BLOOM =
  "motion-safe:[animation:dusk-bloom_300ms_cubic-bezier(0.23,1,0.32,1)_both]";
const RISE =
  "motion-safe:[animation:dusk-rise_280ms_cubic-bezier(0.23,1,0.32,1)_both]";

/** Stagger in 60ms steps, well inside the 30–80ms band. */
function stagger(index: number, start = 0) {
  return { animationDelay: `${start + index * 60}ms` };
}

function Atmosphere() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
    >
      <div className="absolute inset-0" style={{ backgroundImage: MESH_BASE }} />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: MESH_ZENITH }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: MESH_HORIZON }}
      />
      <div className="absolute inset-0" style={{ backgroundImage: MESH_DEEP }} />
      <div className="absolute inset-0" style={{ backgroundImage: MESH_EMBER }} />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-screen"
        style={{
          backgroundImage: GRAIN_IMAGE,
          backgroundSize: "180px 180px",
        }}
      />
      <div className="absolute inset-0" style={{ backgroundImage: MESH_SINK }} />
    </div>
  );
}

function DuskWordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
        <Image
          src="/logo.png"
          alt=""
          width={26}
          height={26}
          unoptimized
          className="size-6"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-archivo-expanded text-[1.0625rem] font-bold tracking-[-0.02em] text-white">
          {BRAND.name}
        </span>
        <span className="mt-1 hidden font-plex-mono text-[0.5625rem] uppercase tracking-[0.2em] text-slate-300 sm:block">
          {BRAND.tagline}
        </span>
      </span>
    </span>
  );
}

function Claim({
  role,
  party,
  note,
  figure,
  winner,
  index,
}: {
  role: string;
  party: string;
  note: string;
  figure: string;
  winner: "owner" | "charterer";
  index: number;
}) {
  const figureTone =
    winner === "owner" ? "text-teal-200" : "text-orange-200";
  return (
    <div
      className={`min-w-0 rounded-2xl p-5 sm:p-6 ${GLASS} ${RISE}`}
      style={stagger(index, 60)}
    >
      <span
        aria-hidden="true"
        className={`block h-px w-10 ${
          winner === "owner" ? "bg-teal-300/80" : "bg-orange-300/80"
        }`}
      />
      <p className="mt-4 font-sans text-sm font-semibold text-slate-200">
        {role}
      </p>
      <p className="mt-1 break-words text-sm leading-relaxed text-slate-300">
        {party}
      </p>
      <p className="mt-1 break-words text-sm leading-relaxed text-slate-300">
        {note}
      </p>
      <p
        className={`mt-5 font-plex-mono text-[clamp(1.75rem,1.4rem+1.6vw,2.375rem)] font-medium leading-none tracking-[-0.03em] tabular-nums ${figureTone}`}
      >
        {figure}
      </p>
    </div>
  );
}

export default function DuskVariant() {
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip bg-[#080d1a] font-sans text-slate-300 antialiased selection:bg-teal-300/30 selection:text-white">
      <Atmosphere />

      <a
        href="#dusk-main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:border focus:border-teal-300/40 focus:bg-[#0d1428] focus:px-4 focus:py-2.5 focus:text-sm focus:text-teal-200 ${FOCUS}`}
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080d1a]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[82rem] items-center gap-4 px-5 sm:h-[4.5rem] sm:px-8">
          <Link
            href="/"
            className={`inline-flex min-h-11 shrink-0 items-center rounded-lg ${FOCUS}`}
          >
            <DuskWordmark />
          </Link>

          <nav aria-label="Page sections" className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-7">
              {FOOTER.sectionLinks.map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    className={`inline-flex min-h-11 items-center whitespace-nowrap font-sans text-sm text-slate-300 hover:text-white ${FOCUS} ${PRESS}`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto shrink-0 lg:ml-0">
            <Link
              href="/login"
              className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-slate-100 hover:bg-white/[0.11] ${FOCUS} ${PRESS}`}
            >
              {CLOSING.portal}
            </Link>
          </div>
        </div>
      </header>

      {/* tabIndex={-1} is the skip link's focus target: without it the browser
          scrolls here and leaves activeElement on <body>. */}
      <main id="dusk-main" tabIndex={-1}>
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[82rem] px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12">
            <div className={`min-w-0 lg:col-span-7 ${BLOOM}`}>
              <p className={LABEL}>{HERO.eyebrow}</p>

              <h1 className="mt-6 font-archivo-expanded text-[clamp(2.375rem,1.15rem+5.2vw,4.75rem)] font-bold leading-[0.95] tracking-[-0.035em] text-white text-balance">
                {HERO.heading}
              </h1>

              <p className="mt-8 max-w-[62ch] font-sans text-base leading-relaxed text-pretty text-slate-300 sm:text-[1.0625rem]">
                {HERO.lede}
              </p>
            </div>

            <aside
              className={`min-w-0 lg:col-span-4 lg:col-start-9 ${RISE}`}
              style={stagger(1, 80)}
            >
              <div className={`rounded-2xl p-5 sm:p-6 ${GLASS}`}>
                <p className={`border-b border-white/10 pb-3 ${LABEL}`}>
                  {BRAND.fixture}
                </p>
                <dl className="mt-4 space-y-3.5">
                  {FIXTURE_FACTS.map(([term, value]) => (
                    <div
                      key={term}
                      className="flex min-w-0 items-baseline justify-between gap-x-4 gap-y-1"
                    >
                      <dt className="font-sans text-[0.8125rem] text-slate-300">
                        {term}
                      </dt>
                      <dd className="min-w-0 break-words text-right font-plex-mono text-[0.8125rem] leading-relaxed tabular-nums text-slate-200">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>
          </div>
        </section>

        {/* ── The reconciliation ─────────────────────────────────────────── */}
        <section
          id={LEDGER.anchor}
          aria-labelledby="dusk-ledger-heading"
          className="scroll-mt-20 border-t border-white/10"
        >
          <div className="mx-auto max-w-[82rem] px-5 py-20 sm:px-8 sm:py-28">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-[28ch]">
                <p className={LABEL}>{LEDGER.kicker}</p>
                <h2 id="dusk-ledger-heading" className={`mt-4 ${H2}`}>
                  {LEDGER.heading}
                </h2>
              </div>
              <p className={`shrink-0 ${LABEL}`}>
                {BRAND.vessel} · {BRAND.port}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <Claim
                role={OWNER.role}
                party={OWNER.party}
                note={OWNER.note}
                figure={OWNER.figure}
                winner="owner"
                index={0}
              />
              <Claim
                role={CHARTERER.role}
                party={CHARTERER.party}
                note={CHARTERER.note}
                figure={CHARTERER.figure}
                winner="charterer"
                index={1}
              />
            </div>

            <ul className="mt-5 grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
              {DISPUTED_DAYS.map((day, index) => {
                const won = day.winner === "owner";
                return (
                  <li
                    key={day.date}
                    className={`min-w-0 rounded-2xl p-5 ${GLASS} ${RISE}`}
                    style={stagger(index, 120)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      <p className="font-plex-mono text-sm font-medium tracking-[-0.01em] tabular-nums text-slate-100">
                        {day.date}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 font-plex-mono text-[0.625rem] uppercase tracking-[0.14em] ${
                          won ? OWNER_ACCENT : CHARTERER_ACCENT
                        }`}
                      >
                        {won ? "Owner" : "Charterer"}
                      </span>
                    </div>

                    <dl className="mt-4 space-y-2 border-t border-white/10 pt-4">
                      {(
                        [
                          ["claimed", day.claimed],
                          ["adverse hours", day.adverse],
                          ["weather", day.weather],
                          ["credited", day.credited],
                        ] as const
                      ).map(([term, value]) => (
                        <div
                          key={term}
                          className="flex min-w-0 items-baseline justify-between gap-x-3 gap-y-1"
                        >
                          <dt className="font-sans text-[0.8125rem] text-slate-300">
                            {term}
                          </dt>
                          <dd className="min-w-0 break-words text-right font-plex-mono text-[0.8125rem] tabular-nums text-slate-200">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                );
              })}
            </ul>

            <p
              className={`mt-8 max-w-[78ch] font-sans text-sm leading-relaxed text-pretty text-slate-300 ${RISE}`}
              style={stagger(0, 240)}
            >
              {LEDGER.thresholdNote}
            </p>

            {/* The one panel raised a step: white/8 fill, white/20 edge, its
                own halo. Everything else on the page stays under
                text-slate-200 so this figure reads first. */}
            <div
              className={`relative mt-12 min-w-0 overflow-hidden rounded-3xl border border-white/20 bg-white/[0.08] p-6 backdrop-blur-2xl sm:p-10 ${RISE}`}
              style={stagger(0, 300)}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: HALO }}
              />
              <div className="relative flex min-w-0 flex-col gap-8">
                <div className="min-w-0">
                  <p className="font-plex-mono text-[0.6875rem] uppercase tracking-[0.2em] text-slate-300">
                    {RECONCILED.label}
                  </p>
                  <p className="mt-5 font-plex-mono text-[clamp(3rem,0.4rem+11vw,8.5rem)] font-medium leading-[0.9] tracking-[-0.045em] tabular-nums text-white drop-shadow-[0_0_40px_rgba(125,211,252,0.35)]">
                    {RECONCILED.figure}
                  </p>
                </div>
                <p className="max-w-[52ch] font-sans text-sm leading-relaxed text-pretty text-slate-300 sm:text-base">
                  {RECONCILED.arithmetic}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── The method ─────────────────────────────────────────────────── */}
        <section
          id={METHOD.anchor}
          aria-labelledby="dusk-method-heading"
          className="scroll-mt-20 border-t border-white/10"
        >
          <div className="mx-auto max-w-[82rem] px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-[24ch]">
              <p className={LABEL}>{METHOD.eyebrow}</p>
              <h2 id="dusk-method-heading" className={`mt-4 ${H2}`}>
                {METHOD.heading}
              </h2>
            </div>

            <ol className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:gap-5">
              {STEPS.map((step, index) => (
                <li
                  key={step.n}
                  className={`grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] gap-x-5 rounded-2xl p-5 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-x-8 sm:p-6 ${GLASS} ${RISE}`}
                  style={stagger(index, 60)}
                >
                  <span className="font-plex-mono text-sm tabular-nums text-teal-300/80">
                    {step.n}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-archivo-expanded text-lg font-semibold tracking-[-0.02em] text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-[76ch] font-sans text-sm leading-relaxed text-pretty text-slate-300">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── This build ─────────────────────────────────────────────────── */}
        <section
          id={BUILD.anchor}
          aria-labelledby="dusk-build-heading"
          className="scroll-mt-20 border-t border-white/10"
        >
          <div className="mx-auto max-w-[82rem] px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-[24ch]">
              <p className={LABEL}>{BUILD.eyebrow}</p>
              <h2 id="dusk-build-heading" className={`mt-4 ${H2}`}>
                {BUILD.heading}
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 md:grid-cols-2 md:gap-5">
              <div className={`min-w-0 rounded-2xl p-5 sm:p-6 ${GLASS} ${RISE}`}>
                <h3
                  className={`border-b border-white/10 pb-3 ${LABEL} text-slate-200`}
                >
                  {BUILD.runsHeading}
                </h3>
                <ul className="mt-5 space-y-4">
                  {RUNS.map((item) => (
                    <li
                      key={item}
                      className="grid min-w-0 grid-cols-[0.75rem_minmax(0,1fr)] gap-x-3"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.55em] size-1 rounded-full bg-teal-300/80"
                      />
                      <span className="font-sans text-sm leading-relaxed text-pretty text-slate-300">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={`min-w-0 rounded-2xl p-5 sm:p-6 ${GLASS} ${RISE}`}
                style={stagger(1, 60)}
              >
                <h3
                  className={`border-b border-white/10 pb-3 ${LABEL} text-slate-200`}
                >
                  {BUILD.absentHeading}
                </h3>
                <ul className="mt-5 space-y-4">
                  {DOES_NOT_RUN.map((item) => (
                    <li
                      key={item}
                      className="grid min-w-0 grid-cols-[0.75rem_minmax(0,1fr)] gap-x-3"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.7em] h-px w-2 bg-orange-300/70"
                      />
                      <span className="font-sans text-sm leading-relaxed text-pretty text-slate-300">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Closing ────────────────────────────────────────────────────── */}
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-[82rem] px-5 py-20 sm:px-8 sm:py-28">
            <div
              className={`grid grid-cols-1 items-end gap-x-12 gap-y-8 lg:grid-cols-12 ${RISE}`}
            >
              <div className="min-w-0 lg:col-span-7">
                <h2 className="font-archivo-expanded text-[clamp(2rem,1.2rem+3.6vw,3.5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-white text-balance">
                  {CLOSING.heading}
                </h2>
              </div>
              <div className="min-w-0 lg:col-span-4 lg:col-start-9">
                <p className="font-sans text-sm leading-relaxed text-pretty text-slate-300">
                  {CLOSING.body}
                </p>
                <Link
                  href="/login"
                  className={`mt-7 inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-teal-200 px-7 font-sans text-sm font-semibold text-[#062b2b] hover:bg-teal-100 sm:w-auto ${FOCUS} ${PRESS}`}
                >
                  {CLOSING.cta}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-[82rem] px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-12">
            <div className="min-w-0 md:col-span-5">
              <DuskWordmark />
              <p className="mt-5 max-w-[42ch] font-sans text-sm leading-relaxed text-pretty text-slate-300">
                {FOOTER.blurb}
              </p>
            </div>

            <nav aria-label="Footer" className="md:col-span-3">
              <h2 className={LABEL}>On this page</h2>
              <ul className="mt-4 space-y-1">
                {FOOTER.sectionLinks.map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      className={`inline-flex min-h-11 items-center font-sans text-sm text-slate-300 hover:text-white ${FOCUS} ${PRESS}`}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="min-w-0 md:col-span-4">
              <h2 className={LABEL}>{FOOTER.buildHeading}</h2>
              <ul className="mt-4 space-y-2 font-sans text-sm leading-relaxed text-slate-300">
                {FOOTER.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-12 border-t border-white/10 pt-6 font-plex-mono text-[0.6875rem] uppercase tracking-[0.16em] text-slate-300">
            {FOOTER.colophon}
          </p>
        </div>
      </footer>

      {/* Two keyframes for the whole variant. `dusk-bloom` scales from 0.965
          rather than zero — nothing in the real world arrives from nothing. */}
      <style>{`
        @keyframes dusk-bloom {
          from { opacity: 0; transform: scale(0.965) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes dusk-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
