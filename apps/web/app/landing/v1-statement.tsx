import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BRAND,
  BUILD,
  CLOSING,
  DISPUTED_DAYS,
  DOES_NOT_RUN,
  EXPLAINER,
  FIXTURE_FACTS,
  FOOTER,
  HERO,
  LEDGER,
  METHOD,
  OWNER,
  CHARTERER,
  RECONCILED,
  RUNS,
  STEPS,
} from "./content";

/**
 * Variant 1 — Statement of Account.
 *
 * A printed instrument: serif display, hairline rules, generous air, and the
 * reconciliation set as a ruled ledger with the real arithmetic exposed. Light
 * by default so it inherits the app's own light theme.
 *
 * This is the default variant and the e2e suite pins it
 * (`smoke.spec.ts:6-14`, `modals.spec.ts:77-96`), so its heading, its
 * `banner`-scoped "Client Portal" link and its "How the Demo Works" button are
 * load-bearing.
 */

const LABEL =
  "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";
const HAIRLINE = "border-foreground/15";
const RULE = "border-foreground/30";
/**
 * `focus-visible:outline-solid` is load-bearing, not decoration. A Tailwind
 * outline reset sets `--tw-outline-style: none` on the element and
 * `focus-visible:outline-2` reads that same variable back, so the two cancel and
 * nothing is painted. `outline-solid` is also what makes the ring survive on
 * the shadcn `Button`, whose base class carries such a reset of its own.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";
const PRESS =
  "transition-[transform,background-color,border-color,color] duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none";
/** 0.3s, the project animation budget. No delay: the budget covers delay too. */
const REVEAL =
  "motion-safe:[animation:fadeIn_0.3s_cubic-bezier(0.23,1,0.32,1)_both]";

const MARGIN_CLASS = "border-l-2 pl-4 sm:pl-5";
const OWNER_RULE = "border-l-[hsl(var(--owner))]";
const CHARTERER_RULE = "border-l-[hsl(var(--charterer))]";
const OWNER_MARK = "bg-[hsl(var(--owner))]";
const CHARTERER_MARK = "bg-[hsl(var(--charterer))]";

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-foreground/15 bg-white">
        <Image
          src="/logo.png"
          alt=""
          width={30}
          height={30}
          unoptimized
          className="size-[1.875rem]"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.0625rem] font-extrabold tracking-[-0.02em]">
          {BRAND.name}
        </span>
        <span className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {BRAND.tagline}
        </span>
      </span>
    </span>
  );
}

export default function StatementVariant() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-foreground selection:bg-[hsl(var(--owner))]/20">
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-20 focus:rounded-sm focus:border focus:border-foreground/30 focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-medium ${FOCUS}`}
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-10 border-b border-foreground/15 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[82rem] items-center gap-6 px-5 sm:h-[4.5rem] sm:px-8">
          <Link
            href="/"
            className={`inline-flex min-h-11 items-center rounded-sm ${FOCUS}`}
          >
            <Wordmark />
          </Link>

          <nav
            aria-label="Sections"
            className="ml-auto hidden items-center gap-6 lg:flex"
          >
            {FOOTER.sectionLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`inline-flex min-h-11 items-center whitespace-nowrap text-sm text-muted-foreground hover:text-foreground ${FOCUS} ${PRESS}`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <span className="inline-flex min-h-11 min-w-11 items-center justify-center">
              <ThemeToggle />
            </span>
            <Link
              href="/login"
              className={`hidden min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm border border-foreground/30 px-4 text-sm font-medium hover:bg-foreground/5 sm:inline-flex ${FOCUS} ${PRESS}`}
            >
              {CLOSING.portal}
            </Link>
            <Link
              href="/login"
              className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/85 ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta}
            </Link>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="mx-auto max-w-[82rem] px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className={`${LABEL} ${REVEAL}`}>{HERO.eyebrow}</p>

              <h1
                className={`mt-5 max-w-[19ch] font-display text-[clamp(2.375rem,1.35rem+3.9vw,4rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-balance ${REVEAL}`}
              >
                {HERO.heading}
              </h1>

              <p
                className={`mt-7 max-w-[60ch] text-base leading-relaxed text-pretty text-muted-foreground motion-safe:text-foreground/80 ${REVEAL}`}
              >
                {HERO.lede}
              </p>

              <div
                className={`mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center ${REVEAL}`}
              >
                <Link
                  href="/login"
                  className={`inline-flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-sm bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/85 ${FOCUS} ${PRESS}`}
                >
                  {CLOSING.cta}
                </Link>
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        aria-label="How Keel Works (How the Demo Works)"
                        className={`min-h-12 rounded-sm border-foreground/30 bg-transparent px-6 text-sm hover:bg-foreground/5 hover:text-foreground ${FOCUS} ${PRESS}`}
                      />
                    }
                  >
                    {CLOSING.explainer}
                  </DialogTrigger>
                  <DialogContent className="max-w-xl gap-5 p-6">
                    <DialogHeader>
                      <DialogTitle className="font-display text-lg font-semibold">
                        How Keel works
                      </DialogTitle>
                      <DialogDescription>{EXPLAINER}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <DialogClose
                        render={
                          <Button
                            variant="outline"
                            className={`min-h-11 rounded-sm border-foreground/30 ${FOCUS} ${PRESS}`}
                          />
                        }
                      >
                        Close
                      </DialogClose>
                      <Link
                        href="/login"
                        className={`inline-flex min-h-11 items-center justify-center rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/85 ${FOCUS} ${PRESS}`}
                      >
                        {CLOSING.cta}
                      </Link>
                    </div>
                  </DialogContent>
                </Dialog>
                <Link
                  href="/login"
                  className={`inline-flex min-h-11 items-center justify-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground sm:hidden ${FOCUS} ${PRESS}`}
                >
                  {CLOSING.portal}
                </Link>
              </div>
            </div>

            <aside className="lg:col-span-3 lg:col-start-10">
              <p className={`${LABEL} border-b ${RULE} pb-3`}>
                The fixture
              </p>
              <dl className="mt-4 space-y-4">
                {FIXTURE_FACTS.map(([term, value]) => (
                  <div key={term} className="grid gap-1">
                    <dt className="text-xs text-muted-foreground">{term}</dt>
                    <dd className="font-mono text-[0.8125rem] leading-relaxed tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>

        <section
          id={LEDGER.anchor}
          aria-labelledby="ledger-heading"
          className="border-y border-foreground/15 bg-[hsl(var(--surface-2))]/60"
        >
          <div className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2
                id="ledger-heading"
                className="font-display text-[clamp(1.625rem,1.2rem+1.6vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-balance"
              >
                {LEDGER.heading}
              </h2>
              <p className={`${LABEL} shrink-0`}>
                {BRAND.fixture} · {BRAND.vessel} · {BRAND.port}
              </p>
            </div>

            <div className="mt-10 border-t-2 border-foreground/35">
              <div
                className={`grid grid-cols-1 items-baseline gap-x-8 gap-y-1 border-b ${HAIRLINE} py-5 ${REVEAL} sm:grid-cols-[1fr_auto] ${MARGIN_CLASS} ${OWNER_RULE}`}
              >
                <div>
                  <p className="font-display text-lg font-semibold">
                    {OWNER.role}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {OWNER.party} · {OWNER.note}
                  </p>
                </div>
                <p className="font-mono text-[clamp(1.5rem,1.2rem+1.4vw,2rem)] font-medium leading-none tabular-nums sm:text-right">
                  {OWNER.figure}
                </p>
              </div>

              <div
                className={`grid grid-cols-1 items-baseline gap-x-8 gap-y-1 border-b ${HAIRLINE} py-5 ${REVEAL} sm:grid-cols-[1fr_auto] ${MARGIN_CLASS} ${CHARTERER_RULE}`}
              >
                <div>
                  <p className="font-display text-lg font-semibold">
                    {CHARTERER.role}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {CHARTERER.party} · {CHARTERER.note}
                  </p>
                </div>
                <p className="font-mono text-[clamp(1.5rem,1.2rem+1.4vw,2rem)] font-medium leading-none tabular-nums sm:text-right">
                  {CHARTERER.figure}
                </p>
              </div>
            </div>

            <div className="mt-12">
              <p className={`${LABEL} border-b ${RULE} pb-3`}>
                {LEDGER.kicker}
              </p>

              <dl className="mt-2">
                {DISPUTED_DAYS.map((day) => (
                  <div
                    key={day.date}
                    className={`grid grid-cols-1 gap-x-8 gap-y-2 border-b ${HAIRLINE} py-5 ${REVEAL} lg:grid-cols-[8rem_1fr_auto] lg:items-baseline`}
                  >
                    <dt className="font-mono text-sm font-medium tabular-nums">
                      {day.date}
                    </dt>
                    <dd className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-[7.5rem_10.5rem_1fr]">
                      <span>
                        <span className="text-muted-foreground">
                          claimed{" "}
                        </span>
                        <span className="font-mono tabular-nums">
                          {day.claimed}
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">
                          met threshold{" "}
                        </span>
                        <span className="font-mono tabular-nums">
                          {day.adverse}
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">weather </span>
                        <span className="font-mono tabular-nums">
                          {day.weather}
                        </span>
                      </span>
                    </dd>
                    <dd className="flex items-center gap-2 lg:justify-end">
                      <span
                        aria-hidden="true"
                        className={`size-2 shrink-0 ${
                          day.winner === "owner" ? OWNER_MARK : CHARTERER_MARK
                        }`}
                      />
                      <span className="text-sm font-semibold">
                        {day.winner === "owner" ? "Owner" : "Charterer"}
                      </span>
                      <span className="font-mono text-sm tabular-nums text-muted-foreground">
                        {day.credited}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-5 max-w-[72ch] text-sm leading-relaxed text-pretty">
                {LEDGER.thresholdNote}
              </p>
            </div>

            <div className="mt-12 border-t-2 border-foreground/35 pt-6">
              <div className="grid grid-cols-1 items-end gap-x-8 gap-y-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-display text-xl font-semibold">
                    {RECONCILED.label}
                  </p>
                  <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-pretty">
                    {RECONCILED.arithmetic}
                  </p>
                </div>
                <p className="font-mono text-[clamp(2.5rem,1.2rem+5.4vw,4.5rem)] font-medium leading-[0.9] tracking-[-0.05em] tabular-nums sm:text-right">
                  {RECONCILED.figure}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id={METHOD.anchor}
          aria-labelledby="method-heading"
          className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-24"
        >
          <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className={LABEL}>{METHOD.eyebrow}</p>
              <h2
                id="method-heading"
                className="mt-4 font-display text-[clamp(1.625rem,1.2rem+1.6vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-balance"
              >
                {METHOD.heading}
              </h2>
            </div>

            <ol className="lg:col-span-7 lg:col-start-6">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className={`grid grid-cols-[2.5rem_1fr] gap-x-5 border-t ${HAIRLINE} py-6 sm:grid-cols-[3rem_9rem_1fr] sm:gap-x-6`}
                >
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {step.n}
                  </span>
                  <h3 className="font-display text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="col-start-2 text-sm leading-relaxed text-pretty sm:col-start-3">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id={BUILD.anchor}
          aria-labelledby="build-heading"
          className="border-y border-foreground/15 bg-[hsl(var(--surface-2))]/60"
        >
          <div className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-20">
            <p className={LABEL}>{BUILD.eyebrow}</p>
            <h2
              id="build-heading"
              className="mt-4 max-w-[24ch] font-display text-[clamp(1.625rem,1.2rem+1.6vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-balance"
            >
              {BUILD.heading}
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
              <div>
                <h3 className="border-b border-foreground/30 pb-3 text-sm font-semibold">
                  {BUILD.runsHeading}
                </h3>
                <ul className="mt-4 space-y-4">
                  {RUNS.map((item) => (
                    <li key={item} className="grid grid-cols-[1rem_1fr] gap-x-3">
                      <span
                        aria-hidden="true"
                        className="pt-0.5 font-mono text-sm leading-6 text-muted-foreground"
                      >
                        +
                      </span>
                      <span className="text-sm leading-relaxed text-pretty">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="border-b border-foreground/30 pb-3 text-sm font-semibold">
                  {BUILD.absentHeading}
                </h3>
                <ul className="mt-4 space-y-4">
                  {DOES_NOT_RUN.map((item) => (
                    <li key={item} className="grid grid-cols-[1rem_1fr] gap-x-3">
                      <span
                        aria-hidden="true"
                        className="pt-0.5 font-mono text-sm leading-6 text-muted-foreground"
                      >
                        &ndash;
                      </span>
                      <span className="text-sm leading-relaxed text-pretty">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em] text-balance">
                {CLOSING.heading}
              </h2>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <p className="text-sm leading-relaxed text-pretty">
                {CLOSING.body}
              </p>
              <Link
                href="/login"
                className={`mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/85 sm:w-auto ${FOCUS} ${PRESS}`}
              >
                {CLOSING.cta}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-foreground/15">
        <div className="mx-auto max-w-[82rem] px-5 py-14 sm:px-8">
          <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <Wordmark />
              <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-pretty text-muted-foreground">
                {FOOTER.blurb}
              </p>
            </div>

            <nav aria-label="Sections" className="md:col-span-3">
              <h2 className={LABEL}>On this page</h2>
              <ul className="mt-4 space-y-1">
                {FOOTER.sectionLinks.map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      className={`inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground ${FOCUS} ${PRESS}`}
                    >
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    href="/login"
                    className={`inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground ${FOCUS} ${PRESS}`}
                  >
                    {CLOSING.portal}
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="md:col-span-4">
              <h2 className={LABEL}>{FOOTER.buildHeading}</h2>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {FOOTER.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-12 border-t border-foreground/15 pt-6 text-xs text-muted-foreground">
            {FOOTER.colophon}
          </p>
        </div>
      </footer>
    </div>
  );
}
