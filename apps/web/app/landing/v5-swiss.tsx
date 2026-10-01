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
 * Variant 5 — Swiss International Minimalist Arbiter.
 *
 * Modernist Swiss design: rigid mathematical grid, monumental typography,
 * stark monochromatic tension, electric ultramarine accent, zero decorative fluff,
 * and high-contrast typographic hierarchy.
 */

/**
 * `focus-visible:outline-solid` is load-bearing, not decoration. A Tailwind
 * outline reset sets `--tw-outline-style: none` on the element and
 * `focus-visible:outline-2` only reads that variable back, so without the
 * explicit `solid` the two cancel and nothing is painted. It is also what
 * makes the ring survive on the shadcn `Button`, whose base class carries such
 * a reset of its own.
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-blue-400";
const PRESS =
  "transition-transform duration-100 ease-out active:scale-[0.98] motion-reduce:transition-none";

function SwissWordmark() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="size-8 shrink-0 bg-black dark:bg-white flex items-center justify-center font-bold text-white dark:text-black font-archivo text-base">
        K
      </div>
      <div className="min-w-0 truncate font-archivo text-lg font-black uppercase tracking-tighter text-black dark:text-white">
        {BRAND.name}
      </div>
    </div>
  );
}

export default function SwissVariant() {
  return (
    <div className="min-h-dvh bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-neutral-100 font-archivo antialiased selection:bg-blue-600 selection:text-white">
      <a
        href="#main-swiss"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:text-xs font-bold ${FOCUS}`}
      >
        Skip to content
      </a>

      {/* Primary Swiss Bar */}
      <header className="sticky top-0 z-30 border-b-2 border-black dark:border-white bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className={`inline-flex min-w-0 items-center ${FOCUS}`}>
            <SwissWordmark />
          </Link>

          <nav aria-label="Index" className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider">
            {FOOTER.sectionLinks.map(([label, href], idx) => (
              <a
                key={href}
                href={href}
                className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${FOCUS}`}
              >
                0{idx + 1} {"//"} {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className={`hidden min-[360px]:inline text-xs font-bold uppercase tracking-wider whitespace-nowrap hover:underline underline-offset-4 ${FOCUS}`}
            >
              {CLOSING.portal}
            </Link>
            <Link
              href="/login"
              className={`inline-flex items-center h-10 px-3 sm:px-5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 ${FOCUS} ${PRESS}`}
            >
              <span className="hidden sm:inline">{CLOSING.cta}</span>
              <span className="sm:hidden">{BRAND.name}</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-swiss" tabIndex={-1} className="mx-auto max-w-7xl px-4 sm:px-8">
        {/* Monumental Hero */}
        <section className="py-16 sm:py-24 border-b-2 border-black dark:border-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-4">
                01 / THE MISSION &mdash; {HERO.eyebrow}
              </div>

              {/* `text-3xl` below `sm`, not `text-4xl`: "DETERMINISTIC" is one
                  unbreakable 311.3px token at 36px Archivo 900, and the content
                  box is 288px at a 320px viewport. 30px measures 259.4px, and
                  `break-words` is the backstop if a fallback face is wider. */}
              <h1 className="text-3xl sm:text-6xl lg:text-7xl break-words font-black uppercase tracking-tight leading-[0.95] text-balance">
                {HERO.heading}
              </h1>

              <p className="mt-8 text-base sm:text-lg font-medium text-neutral-700 dark:text-neutral-300 max-w-2xl leading-relaxed">
                {HERO.lede}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className={`inline-flex items-center justify-center h-14 px-8 bg-black text-white dark:bg-white dark:text-black font-black text-sm uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white ${FOCUS} ${PRESS}`}
                >
                  {CLOSING.cta} &rarr;
                </Link>

                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        className={`h-14 px-6 border-2 border-black dark:border-white bg-transparent font-black text-xs uppercase tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black ${FOCUS} ${PRESS}`}
                      />
                    }
                  >
                    {CLOSING.explainer}
                  </DialogTrigger>
                  <DialogContent className="border-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white max-w-xl font-archivo">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tight">
                        {CLOSING.explainer}
                      </DialogTitle>
                      <DialogDescription className="text-xs uppercase tracking-wider font-bold text-neutral-500 dark:text-neutral-400">
                        System Architecture Verification
                      </DialogDescription>
                    </DialogHeader>
                    <p className="text-sm leading-relaxed mt-4 font-sans">
                      {EXPLAINER}
                    </p>
                    <div className="mt-6 flex justify-end">
                      <DialogClose
                        render={
                          <Button className={`h-10 bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase tracking-wider ${FOCUS}`} />
                        }
                      >
                        Close
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Monumental Numbers Card */}
            <div className="lg:col-span-4 border-2 border-black dark:border-white p-6 bg-neutral-50 dark:bg-[#121212]">
              <div className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-black/20 dark:border-white/20 pb-2 mb-4">
                The Invariant
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[0.6875rem] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                    Shipowner Claim
                  </div>
                  <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100 font-mono">
                    {OWNER.figure}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{OWNER.party}</div>
                </div>

                <div>
                  <div className="text-[0.6875rem] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                    Charterer Account
                  </div>
                  <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100 font-mono">
                    {CHARTERER.figure}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{CHARTERER.party}</div>
                </div>

                <div className="pt-4 border-t-2 border-black dark:border-white bg-blue-600 text-white p-4 -mx-6 -mb-6">
                  <div className="text-xs font-black uppercase tracking-widest">
                    {RECONCILED.label}
                  </div>
                  <div className="text-5xl font-black tracking-tight font-mono mt-1">
                    {RECONCILED.figure}
                  </div>
                  <div className="text-xs mt-2 leading-tight opacity-90">
                    {RECONCILED.arithmetic}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 / Disputed Schedule */}
        <section id={LEDGER.anchor} className="py-16 sm:py-20 border-b-2 border-black dark:border-white">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                02 / THE LEDGER
              </div>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mt-1">
                {LEDGER.heading}
              </h2>
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Three Disputed Days at Piraeus
            </div>
          </div>

          <div className="border-2 border-black dark:border-white overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-wider text-[0.6875rem]">
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Claimed</th>
                  <th className="py-4 px-4">Adverse Hours</th>
                  <th className="py-4 px-4">Port Observation</th>
                  <th className="py-4 px-4">Deterministic Ruling</th>
                  <th className="py-4 px-4 text-right">Award Sum</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 border-black dark:border-white font-mono">
                {DISPUTED_DAYS.map((day) => {
                  const isOwner = day.winner === "owner";
                  return (
                    <tr key={day.date} className="hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
                      <td className="py-4 px-4 font-black font-archivo text-sm">{day.date}</td>
                      <td className="py-4 px-4">{day.claimed}</td>
                      <td className="py-4 px-4">{day.adverse}</td>
                      <td className="py-4 px-4 font-sans">{day.weather}</td>
                      <td className="py-4 px-4 font-archivo">
                        <span
                          className={`inline-block px-2 py-1 text-[0.625rem] font-black uppercase ${
                            isOwner
                              ? "bg-emerald-700 text-white"
                              : "bg-rose-600 text-white"
                          }`}
                        >
                          {day.winner} Favored
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-sm">{day.credited}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 border border-black/30 dark:border-white/30 text-xs text-neutral-600 dark:text-neutral-400 font-sans leading-relaxed">
            <strong className="font-archivo uppercase text-black dark:text-white mr-2">Rule Note:</strong>
            {LEDGER.thresholdNote}
          </div>
        </section>

        {/* 03 / Method Pipeline */}
        <section id={METHOD.anchor} className="py-16 sm:py-20 border-b-2 border-black dark:border-white">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-2">
            03 / METHODOLOGY
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-12">
            {METHOD.heading}
          </h2>

          <ol className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {STEPS.map((step) => (
              <li key={step.n} className="border-t-4 border-black dark:border-white pt-4">
                <div className="text-3xl font-black text-blue-600 dark:text-blue-500 mb-2 font-mono">
                  {step.n}
                </div>
                <h3 className="text-base font-black uppercase tracking-tight mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* 04 / Scope & Build */}
        <section id={BUILD.anchor} className="py-16 sm:py-20 border-b-2 border-black dark:border-white">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-2">
            04 / RUNTIME SPEC
          </div>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-8">
            {BUILD.heading}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border-2 border-black dark:border-white p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-4 pb-2 border-b border-black/20 dark:border-white/20">
                + {BUILD.runsHeading}
              </h3>
              <ul className="space-y-3 text-xs font-sans">
                {RUNS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="font-black text-black dark:text-white">&rarr;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-2 border-black dark:border-white p-6 bg-neutral-100 dark:bg-[#141414]">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 mb-4 pb-2 border-b border-black/20 dark:border-white/20">
                &ndash; {BUILD.absentHeading}
              </h3>
              <ul className="space-y-3 text-xs font-sans text-neutral-600 dark:text-neutral-400">
                {DOES_NOT_RUN.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="font-bold">&times;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Closing Action */}
        <section className="py-20 text-center">
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            {CLOSING.heading}
          </h2>
          <p className="mt-4 text-sm font-medium text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed font-sans">
            {CLOSING.body}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className={`inline-flex items-center justify-center h-14 px-10 bg-black text-white dark:bg-white dark:text-black font-black text-sm uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white ${FOCUS} ${PRESS}`}
            >
              {CLOSING.cta} &rarr;
            </Link>
          </div>
        </section>
      </main>

      {/* Swiss Footer */}
      <footer className="border-t-2 border-black dark:border-white py-12 px-4 sm:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <SwissWordmark />
            <p className="mt-3 text-neutral-600 dark:text-neutral-400 max-w-sm font-sans">
              {FOOTER.blurb}
            </p>
          </div>
          <div>
            <div className="font-black uppercase tracking-wider mb-2">Index</div>
            <ul className="space-y-1 font-bold">
              {FOOTER.sectionLinks.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className={`hover:text-blue-600 ${FOCUS}`}>
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/login" className={`hover:text-blue-600 ${FOCUS}`}>
                  {CLOSING.portal}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-black uppercase tracking-wider mb-2">Disclaimers</div>
            <ul className="space-y-1 text-neutral-600 dark:text-neutral-400 font-sans">
              {FOOTER.notes.map((note) => (
                <li key={note}>&bull; {note}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-black/20 dark:border-white/20 flex justify-between text-[0.625rem] text-neutral-500 dark:text-neutral-400 font-bold uppercase">
          <span>{FOOTER.colophon}</span>
          <span>SWISS ARBITER &bull; BASEL // ATHENS</span>
        </div>
      </footer>
    </div>
  );
}
