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
 * Variant 10 — Radar / Plan Position Indicator.
 *
 * A polar display rather than a flat console. The hero instrument is a PPI
 * scope: range rings, a bearing crosshair, twelve bearing ticks, one plotted
 * contact per disputed day and a slow sweeping wedge. Everything the scope
 * draws is also printed as text in the ledger below, so the page stands up
 * with the instrument deleted.
 *
 * The palette is forced on the root element and is identical in both app
 * themes — a scope is a night instrument. No `.dark`, no `ThemeToggle`.
 */

/* ─── Scope geometry, in a 220×220 user-space box ─────────────────────────── */
const CX = 110;
const CY = 110;
const RINGS = [24, 41, 58, 75] as const;
const RIM = 86;
const LABEL_R = 99;
/** Contacts never sit closer than this, never nearer the rim than this. */
const R_INNER = 26;
const R_OUTER = 74;
/** First contact bearing; the rest are spaced evenly around the dial. */
const BEARING_START = 60;

const BEARINGS = Array.from({ length: 12 }, (_, i) => i * 30);
const MINOR_TICKS = Array.from({ length: 36 }, (_, i) => i * 10);

/**
 * Share of a disputed window that actually reached the charterparty's own
 * threshold, read straight out of the two strings in `content.ts`
 * (`"12 h"` and `"0 of 12"` → 0; `"36 h"` and `"36 of 36"` → 1). Deterministic,
 * no randomness, no invented unit.
 */
function adverseShare(claimed: string, adverse: string): number {
  const claimedHours = Number.parseInt(claimed, 10);
  const metHours = Number.parseInt(adverse.split("of")[0] ?? "", 10);
  if (!Number.isFinite(claimedHours) || claimedHours <= 0) return 0;
  if (!Number.isFinite(metHours)) return 0;
  return Math.min(1, Math.max(0, metHours / claimedHours));
}

/** Polar → cartesian. Bearing 0° is 12 o'clock, increasing clockwise. */
function point(bearingDeg: number, radius: number) {
  const rad = (bearingDeg * Math.PI) / 180;
  return { x: CX + radius * Math.sin(rad), y: CY - radius * Math.cos(rad) };
}

/**
 * One contact per disputed day. Bearing spreads the days evenly so no two
 * markers or their labels collide; range is the share of the window that
 * actually reached the threshold, so a day that met it sits out near the rim
 * and a day that did not sits in close. Deterministic — no randomness.
 */
const CONTACTS = DISPUTED_DAYS.map((day, index) => {
  const share = adverseShare(day.claimed, day.adverse);
  const bearing =
    BEARING_START + (index * 360) / Math.max(1, DISPUTED_DAYS.length);
  const range = R_INNER + share * (R_OUTER - R_INNER);
  return { day, index, ...point(bearing, range) };
});

/* ─── Class vocabulary ────────────────────────────────────────────────────── */
/**
 * Tailwind's outline-suppressing utility must not appear here: it sets
 * `--tw-outline-style: none` on the same element, and `outline-2` reads that
 * variable back through `outline-style: var(--tw-outline-style)`, so the two
 * cancel and no ring is painted at all. Cyan-300 reads 13.94:1 on the page and
 * 13.22:1 on the scope's own ground.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-cyan-300";
const PRESS =
  "transition-[transform,color,background-color,border-color,opacity] duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none";
const MICRO =
  "font-mono text-[0.625rem] font-medium uppercase tracking-[0.22em] text-cyan-300/70";
const HAIRLINE = "border-cyan-400/15";
const OWNER_MARK = "bg-[hsl(var(--owner))] brightness-125";
/**
 * Charterer red is lifted to a literal rather than filtered. `brightness-150` on
 * `hsl(var(--charterer))` still painted rgb(201,29,29) on the #050d14 grounds —
 * 3.42:1 at the 11px ledger label. #e8564d measures 5.46:1 on that ground, and
 * the swatch carries the same value so the key still reads as the figure.
 */
const CHARTERER_MARK = "bg-[#e8564d]";
const OWNER_INK = "text-[hsl(var(--owner))] brightness-125";
const CHARTERER_INK = "text-[#e8564d]";
/** ≤300ms, ease-out, and absent entirely when the reader asks for less motion. */
const RISE =
  "motion-safe:[animation:slideUp_0.3s_cubic-bezier(0.23,1,0.32,1)_both]";
const SCOPE_IN =
  "motion-safe:[animation:fadeIn_0.3s_cubic-bezier(0.23,1,0.32,1)_both]";

function RadarWordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-cyan-300/25 bg-white">
        <Image
          src="/logo.png"
          alt=""
          width={30}
          height={30}
          unoptimized
          className="size-[1.875rem]"
        />
      </span>
      <span className="flex flex-col font-mono leading-none">
        <span className="text-[0.9375rem] font-bold uppercase tracking-[0.3em] text-cyan-100">
          {BRAND.name}
        </span>
        <span className="mt-1.5 text-[0.5625rem] font-medium uppercase tracking-[0.26em] text-cyan-300/60">
          {BRAND.tagline}
        </span>
      </span>
    </span>
  );
}

/**
 * The PPI scope. Purely decorative: `aria-hidden`, `role="presentation"`, and
 * every quantity it encodes is printed in the ledger below.
 */
function PlanPositionIndicator() {
  return (
    <figure className="mx-auto w-full max-w-[28rem]">
      <div className="flex items-baseline justify-between gap-4 border-b border-cyan-300/30 pb-3">
        <p className={MICRO}>Plan position indicator</p>
        <p className={`${MICRO} tabular-nums text-cyan-300/60`}>
          {LEDGER.kicker}
        </p>
      </div>

      {/* Square parent: every layer below is inset-0, so nothing can exceed it. */}
      <div
        aria-hidden="true"
        className={`relative mt-5 aspect-square w-full max-w-[28rem] overflow-hidden rounded-full border border-cyan-300/25 bg-[#061019] shadow-[0_0_60px_-12px_rgba(8,145,178,0.35)] ${SCOPE_IN}`}
      >
        {/* Phosphor bloom behind the dial. */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgb(8 145 178 / 0.20) 0%, rgb(3 7 12 / 0) 62%)",
          }}
        />

        {/* Chrome: rings, crosshair, ticks, bearing labels, centre pip. */}
        <svg
          viewBox="0 0 220 220"
          role="presentation"
          focusable="false"
          className="absolute inset-0 size-full"
        >
          {RINGS.map((r) => (
            <circle
              key={r}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              strokeWidth={0.6}
              className="stroke-cyan-400/22"
            />
          ))}
          <circle
            cx={CX}
            cy={CY}
            r={RIM}
            fill="none"
            strokeWidth={1}
            className="stroke-cyan-300/50"
          />
          <circle
            cx={CX}
            cy={CY}
            r={RIM - 4}
            fill="none"
            strokeWidth={0.5}
            className="stroke-cyan-400/18"
          />

          <line
            x1={CX}
            y1={12}
            x2={CX}
            y2={208}
            strokeWidth={0.7}
            className="stroke-cyan-300/28"
          />
          <line
            x1={12}
            y1={CY}
            x2={208}
            y2={CY}
            strokeWidth={0.7}
            className="stroke-cyan-300/28"
          />
          <line
            x1={CX - 74}
            y1={CY - 74}
            x2={CX + 74}
            y2={CY + 74}
            strokeWidth={0.5}
            className="stroke-cyan-400/14"
          />
          <line
            x1={CX + 74}
            y1={CY - 74}
            x2={CX - 74}
            y2={CY + 74}
            strokeWidth={0.5}
            className="stroke-cyan-400/14"
          />

          {MINOR_TICKS.map((deg) => {
            const major = deg % 30 === 0;
            const inner = point(deg, RIM + 1.5);
            const outer = point(deg, RIM + (major ? 6 : 3));
            return (
              <line
                key={deg}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                strokeWidth={major ? 1 : 0.5}
                className={
                  major ? "stroke-cyan-300/60" : "stroke-cyan-400/30"
                }
              />
            );
          })}

          {/* The crosshair ends at r=98 and the diagonals reach r=104.7, so four
              of these labels sit across a line. There is no halo: at fontSize 6
              in a 220-unit box the 1.8px `paint-order: stroke` outline was
              wider than the glyph it was protecting, and the outline — not the
              numerals — was the unreadable paint at 2.42:1 against the ring it
              crossed. Unhaloed cyan-300 is 13.22:1 on the scope ground and
              6.47:1 over the brightest chrome in the label's own box, the
              crosshair end, and it scales: the full 6-unit glyph survives where
              the halo left a ~2-unit core. The twelve bearings are instrument
              chrome — nothing is encoded here that the ledger below does not
              print — so the group is marked decorative rather than enlarged. */}
          <g aria-hidden="true">
            {BEARINGS.map((deg) => {
              const label = point(deg, LABEL_R);
              return (
                <text
                  key={deg}
                  x={label.x}
                  y={label.y}
                  dy="0.34em"
                  textAnchor="middle"
                  fontSize={6}
                  letterSpacing={0.5}
                  className="fill-cyan-300 font-space-mono"
                >
                  {String(deg).padStart(3, "0")}
                </text>
              );
            })}
          </g>

          <circle cx={CX} cy={CY} r={1.7} className="fill-cyan-200" />
        </svg>

        {/* Sweep. Clipped by the round parent; rotation only under motion-safe. */}
        <div
          className="absolute inset-0 rounded-full motion-safe:[animation:spin_18s_linear_infinite] motion-reduce:animate-none"
          style={{
            background:
              "conic-gradient(from 0deg, rgb(103 232 249 / 0) 0deg, rgb(103 232 249 / 0) 292deg, rgb(103 232 249 / 0.08) 342deg, rgb(103 232 249 / 0.22) 358deg, rgb(103 232 249 / 0.26) 360deg)",
          }}
        />

        {/* Scanlines. */}
        <div
          className="absolute inset-0 rounded-full opacity-50 mix-blend-screen"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgb(103 232 249 / 0.07) 0px, rgb(103 232 249 / 0.07) 1px, transparent 1px, transparent 4px)",
          }}
        />

        {/* Contacts, drawn above the sweep so they never wash out. */}
        <svg
          viewBox="0 0 220 220"
          role="presentation"
          focusable="false"
          className="absolute inset-0 size-full"
        >
          {CONTACTS.map(({ day, index, x, y }) => {
            const owner = day.winner === "owner";
            return (
              <g key={day.date}>
                {/* Opaque plate behind the contact number. At 5.4px the
                    numerals had no contrast to measure — cyan-100/90 over the
                    blip and the sweep's 26% peak both composite to
                    rgb(189,232,237), so the glyph was the same colour as its
                    own ground. Cyan-100 on this plate is 17.46:1. */}
                <rect
                  x={x - 5.5}
                  y={y - 18}
                  width={11}
                  height={6}
                  rx={1.2}
                  className="fill-[#050d14] stroke-cyan-400/40"
                  strokeWidth={0.4}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={10}
                  className={
                    owner
                      ? "fill-[hsl(var(--owner))]/16"
                      : "fill-[hsl(var(--charterer))]/18"
                  }
                />
                <circle
                  cx={x}
                  cy={y}
                  r={5.5}
                  fill="none"
                  strokeWidth={0.8}
                  className={
                    owner
                      ? "stroke-[hsl(var(--owner))]/55"
                      : "stroke-[hsl(var(--charterer))]/55"
                  }
                />
                <rect
                  x={x - 2.8}
                  y={y - 2.8}
                  width={5.6}
                  height={5.6}
                  transform={`rotate(45 ${x} ${y})`}
                  strokeWidth={1.3}
                  className={
                    owner
                      ? "fill-[hsl(var(--owner))]"
                      : "fill-none stroke-[hsl(var(--charterer))]"
                  }
                />
                <text
                  x={x}
                  y={y - 13}
                  textAnchor="middle"
                  fontSize={5.4}
                  letterSpacing={0.4}
                  className="fill-cyan-100 font-space-mono"
                >
                  {`0${index + 1}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <figcaption
        className="mt-5 border-t border-cyan-400/15 pt-3 font-sans text-xs leading-relaxed text-cyan-100/65"
      >
        Bearing separates the three days; range is the share of that day&rsquo;s
        claimed hours which met the threshold. Marker colour follows the
        figure below.
      </figcaption>

      <dl className="mt-5 grid gap-px overflow-hidden border border-cyan-400/15 sm:grid-cols-2">
        <div className="bg-[#050d14] p-4">
          <dt className={`${MICRO} flex items-center gap-2`}>
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 ${OWNER_MARK}`}
            />
            Owner
          </dt>
          <dd
            className={`mt-2 font-mono text-[clamp(1.375rem,1.1rem+1.1vw,1.75rem)] font-medium leading-none tabular-nums ${OWNER_INK}`}
          >
            {OWNER.figure}
          </dd>
        </div>
        <div className="bg-[#050d14] p-4">
          <dt className={`${MICRO} flex items-center gap-2`}>
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 ${CHARTERER_MARK}`}
            />
            Charterer
          </dt>
          <dd
            className={`mt-2 font-mono text-[clamp(1.375rem,1.1rem+1.1vw,1.75rem)] font-medium leading-none tabular-nums ${CHARTERER_INK}`}
          >
            {CHARTERER.figure}
          </dd>
        </div>
      </dl>
    </figure>
  );
}

export default function RadarVariant() {
  return (
    <div
      className="min-h-dvh overflow-x-clip bg-[#03070c] font-plex-mono text-cyan-100 antialiased selection:bg-cyan-300/25 selection:text-cyan-50"
      style={{ colorScheme: "dark" }}
    >
      <a
        href="#main-radar"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:border focus:border-cyan-300 focus:bg-[#061019] focus:px-4 focus:py-3 focus:text-sm focus:text-cyan-100 ${FOCUS}`}
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-cyan-400/20 bg-[#03070c]/88 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[82rem] items-center gap-5 px-5 sm:h-[4.5rem] sm:px-8">
          <Link
            href="/"
            className={`inline-flex min-h-11 shrink-0 items-center rounded-sm ${FOCUS}`}
          >
            <RadarWordmark />
          </Link>

          <nav
            aria-label="Sections"
            className="ml-auto hidden items-center gap-6 lg:flex"
          >
            {FOOTER.sectionLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`inline-flex min-h-11 items-center whitespace-nowrap font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cyan-200/65 hover:text-cyan-100 ${FOCUS} ${PRESS}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Link
              href="/login"
              className={`hidden min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm border border-cyan-300/35 px-4 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cyan-100 hover:bg-cyan-300/10 sm:inline-flex ${FOCUS} ${PRESS}`}
            >
              {CLOSING.portal}
            </Link>
            <Link
              href="/login"
              className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm bg-cyan-300 px-4 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#03070c] hover:bg-cyan-200 ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta}
            </Link>
          </div>
        </div>
      </header>

      {/* `tabIndex` so the skip link actually lands focus here rather than
          leaving it on `<body>`, where the next Tab restarts at the header. */}
      <main id="main-radar" tabIndex={-1}>
        <section className="mx-auto max-w-[82rem] px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
          <div className="grid grid-cols-1 items-start gap-x-14 gap-y-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className={MICRO}>{HERO.eyebrow}</p>

              <h1
                className={`mt-6 max-w-[17ch] font-plex-mono text-[clamp(2rem,1.15rem+3.4vw,3.25rem)] font-bold uppercase leading-[1.06] tracking-[-0.01em] text-cyan-50 ${RISE}`}
              >
                {HERO.heading}
              </h1>

              <p
                className={`mt-7 max-w-[58ch] font-sans text-base leading-relaxed text-pretty text-cyan-100/70 ${RISE}`}
                style={{ animationDelay: "60ms" }}
              >
                {HERO.lede}
              </p>

              <p className={`${MICRO} mt-10 border-t border-cyan-300/30 pt-3`}>
                {BRAND.domain} · {BRAND.fixture}
              </p>

              <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {FIXTURE_FACTS.map(([term, value]) => (
                  <div key={term} className="grid gap-1.5">
                    <dt className={MICRO}>{term}</dt>
                    <dd className="font-mono text-[0.8125rem] leading-relaxed text-cyan-100/85 tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:col-span-5">
              <PlanPositionIndicator />
            </div>
          </div>
        </section>

        <section
          id={LEDGER.anchor}
          aria-labelledby="radar-ledger-heading"
          className={`border-y border-cyan-400/20 bg-[#050d14] ${RISE}`}
        >
          <div className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2
                id="radar-ledger-heading"
                className="font-plex-mono text-[clamp(1.375rem,1.05rem+1.3vw,2rem)] font-bold uppercase leading-tight tracking-[0.02em] text-cyan-50"
              >
                {LEDGER.heading}
              </h2>
              <p className={`${MICRO} shrink-0 tabular-nums`}>
                {BRAND.fixture} · {BRAND.vessel} · {BRAND.port}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
              <div className="border-l-2 border-l-[hsl(var(--owner))] pl-4 sm:pl-5">
                <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-cyan-100">
                  {OWNER.role}
                </p>
                <p className="mt-2 font-sans text-sm text-cyan-100/60">
                  {OWNER.party} · {OWNER.note}
                </p>
                <p className="mt-4 font-mono text-[clamp(1.75rem,1.4rem+1.6vw,2.5rem)] font-medium leading-none tabular-nums">
                  {OWNER.figure}
                </p>
              </div>

              <div className="border-l-2 border-l-[hsl(var(--charterer))] pl-4 sm:pl-5">
                <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-cyan-100">
                  {CHARTERER.role}
                </p>
                <p className="mt-2 font-sans text-sm text-cyan-100/60">
                  {CHARTERER.party} · {CHARTERER.note}
                </p>
                <p className="mt-4 font-mono text-[clamp(1.75rem,1.4rem+1.6vw,2.5rem)] font-medium leading-none tabular-nums">
                  {CHARTERER.figure}
                </p>
              </div>
            </div>

            <p className={`${MICRO} mt-14 border-b border-cyan-300/30 pb-3`}>
              {LEDGER.kicker}
            </p>

            <ol className="mt-2">
              {DISPUTED_DAYS.map((day, index) => {
                const owner = day.winner === "owner";
                return (
                  <li
                    key={day.date}
                    className={`grid gap-x-8 gap-y-3 border-b ${HAIRLINE} py-6 ${RISE}`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                      <span className="font-mono text-sm font-medium tabular-nums text-cyan-100">
                        {day.date}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`size-2 shrink-0 ${owner ? OWNER_MARK : CHARTERER_MARK}`}
                      />
                      <span
                        className={`font-mono text-[0.6875rem] uppercase tracking-[0.18em] ${owner ? OWNER_INK : CHARTERER_INK}`}
                      >
                        {owner ? "Owner" : "Charterer"}
                      </span>
                      <span className="font-mono text-sm tabular-nums text-cyan-100/75">
                        {day.credited}
                      </span>
                    </div>

                    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
                      <div className="grid gap-1">
                        <dt className={MICRO}>Claimed</dt>
                        <dd className="font-mono text-sm tabular-nums">
                          {day.claimed}
                        </dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className={MICRO}>Met threshold</dt>
                        <dd className="font-mono text-sm tabular-nums">
                          {day.adverse}
                        </dd>
                      </div>
                      <div className="grid gap-1">
                        <dt className={MICRO}>Weather</dt>
                        <dd className="font-mono text-sm tabular-nums">
                          {day.weather}
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ol>

            <p className="mt-8 max-w-[78ch] font-sans text-sm leading-relaxed text-pretty text-cyan-100/70">
              {LEDGER.thresholdNote}
            </p>

            {/* The single loudest element on the page. */}
            <div className="relative mt-14 border border-cyan-300/30 bg-[#03070c] p-6 shadow-[0_0_70px_-28px_rgba(34,211,238,0.55)] sm:p-10">
              <span
                aria-hidden="true"
                className="absolute -top-px -left-px size-3 border-t-2 border-l-2 border-cyan-300"
              />
              <span
                aria-hidden="true"
                className="absolute -right-px -bottom-px size-3 border-r-2 border-b-2 border-cyan-300"
              />

              <p className={`${MICRO} text-cyan-300`}>{RECONCILED.label}</p>
              <p className="mt-3 font-mono text-[clamp(2.75rem,1.1rem+8.4vw,8rem)] font-bold leading-[0.86] tracking-[-0.045em] text-cyan-200 tabular-nums [text-shadow:0_0_40px_rgba(34,211,238,0.35)]">
                {RECONCILED.figure}
              </p>
              <p className="mt-6 max-w-[62ch] font-sans text-base leading-relaxed text-pretty text-cyan-100/75">
                {RECONCILED.arithmetic}
              </p>
            </div>
          </div>
        </section>

        <section
          id={METHOD.anchor}
          aria-labelledby="radar-method-heading"
          className={`mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-24 ${RISE}`}
        >
          <div className="grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className={MICRO}>{METHOD.eyebrow}</p>
              <h2
                id="radar-method-heading"
                className="mt-5 max-w-[22ch] font-plex-mono text-[clamp(1.375rem,1.05rem+1.3vw,2rem)] font-bold uppercase leading-tight tracking-[0.02em] text-cyan-50"
              >
                {METHOD.heading}
              </h2>
            </div>

            <ol className="lg:col-span-7 lg:col-start-6">
              {STEPS.map((step, index) => (
                <li
                  key={step.n}
                  className={`grid grid-cols-[2.5rem_1fr] gap-x-5 border-t ${HAIRLINE} py-6 sm:grid-cols-[3rem_9rem_1fr] sm:gap-x-6 ${RISE}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span
                    className={`${MICRO} pt-1 text-[0.6875rem] tabular-nums`}
                  >
                    {step.n}
                  </span>
                  <h3 className="font-plex-mono text-sm font-bold uppercase tracking-[0.14em] text-cyan-100">
                    {step.title}
                  </h3>
                  <p className="col-start-2 font-sans text-sm leading-relaxed text-pretty text-cyan-100/70 sm:col-start-3">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id={BUILD.anchor}
          aria-labelledby="radar-build-heading"
          className={`border-y border-cyan-400/20 bg-[#050d14] ${RISE}`}
        >
          <div className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-20">
            <p className={MICRO}>{BUILD.eyebrow}</p>
            <h2
              id="radar-build-heading"
              className="mt-5 max-w-[26ch] font-plex-mono text-[clamp(1.375rem,1.05rem+1.3vw,2rem)] font-bold uppercase leading-tight tracking-[0.02em] text-cyan-50"
            >
              {BUILD.heading}
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
              <div>
                <h3
                  className={`${MICRO} border-b border-cyan-300/30 pb-3 text-cyan-300`}
                >
                  {BUILD.runsHeading}
                </h3>
                <ul className="mt-5 space-y-4">
                  {RUNS.map((item) => (
                    <li
                      key={item}
                      className="grid grid-cols-[1rem_1fr] gap-x-3"
                    >
                      <span
                        aria-hidden="true"
                        className="pt-0.5 font-mono text-sm leading-6 text-cyan-300/70"
                      >
                        +
                      </span>
                      <span className="font-sans text-sm leading-relaxed text-pretty text-cyan-100/75">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3
                  className={`${MICRO} border-b border-cyan-300/30 pb-3 text-cyan-300`}
                >
                  {BUILD.absentHeading}
                </h3>
                <ul className="mt-5 space-y-4">
                  {DOES_NOT_RUN.map((item) => (
                    <li
                      key={item}
                      className="grid grid-cols-[1rem_1fr] gap-x-3"
                    >
                      <span
                        aria-hidden="true"
                        className="pt-0.5 font-mono text-sm leading-6 text-cyan-300/60"
                      >
                        &ndash;
                      </span>
                      <span className="font-sans text-sm leading-relaxed text-pretty text-cyan-100/75">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className={`mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-24 ${RISE}`}>
          <div className="grid grid-cols-1 items-start gap-x-14 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="max-w-[20ch] font-plex-mono text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)] font-bold uppercase leading-tight tracking-[0.02em] text-cyan-50">
                {CLOSING.heading}
              </h2>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <p className="font-sans text-sm leading-relaxed text-pretty text-cyan-100/70">
                {CLOSING.body}
              </p>
              <p className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.22em] text-cyan-300/60">
                {BRAND.fixture} · {BRAND.port}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-cyan-400/20 bg-[#050d14]">
        <div className="mx-auto max-w-[82rem] px-5 py-14 sm:px-8">
          <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <RadarWordmark />
              <p className="mt-5 max-w-[42ch] font-sans text-sm leading-relaxed text-pretty text-cyan-100/60">
                {FOOTER.blurb}
              </p>
            </div>

            <nav aria-label="Sections" className="md:col-span-3">
              <h2 className={MICRO}>On this page</h2>
              <ul className="mt-4 space-y-1">
                {FOOTER.sectionLinks.map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      className={`inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-[0.14em] text-cyan-200/65 hover:text-cyan-100 ${FOCUS} ${PRESS}`}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="md:col-span-4">
              <h2 className={MICRO}>{FOOTER.buildHeading}</h2>
              <ul className="mt-4 space-y-2 font-sans text-sm leading-relaxed text-cyan-100/60">
                {FOOTER.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className={`${MICRO} mt-12 border-t border-cyan-400/15 pt-6`}>
            {FOOTER.colophon}
          </p>
        </div>
      </footer>
    </div>
  );
}
