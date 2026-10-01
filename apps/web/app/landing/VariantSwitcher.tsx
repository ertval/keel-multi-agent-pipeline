"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

/**
 * Design picker for the eleven landing page variants.
 *
 * The active variant is resolved on the server from `?v=` in `app/page.tsx` and
 * handed down as a prop. This component therefore never calls
 * `useSearchParams()`, which is what keeps the route free of the Suspense
 * boundary that `next build` demands for a client-side search-param read.
 *
 * Navigation uses `push`, not `replace`: each variant is a distinct linkable
 * URL and comparing designs means walking back through the ones you just
 * looked at. With `replace` the first Back leaves the site entirely.
 */

let variantScrollArmed = false;

export interface VariantOption {
  key: string;
  label: string;
  /** Shown in the control's tooltip and used as its accessible description. */
  hint: string;
}

export function VariantSwitcher({
  current,
  options,
}: {
  current: string;
  options: ReadonlyArray<VariantOption>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // `/?v=` is a same-pathname navigation. Next does not mint a new segment for
  // it, so the App Router scroll handler never runs — and `{ scroll: false }`
  // tells it not to. A `scrollTo` in the click handler races the RSC commit
  // and loses. The flag lives on the module so a remount of this picker (the
  // page segment can swap around it) still scrolls after the first visit.
  useEffect(() => {
    if (!variantScrollArmed) {
      variantScrollArmed = true;
      return;
    }
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, [current]);

  return (
    <div
      role="group"
      aria-label="Landing page design"
      data-slot="variant-switcher"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 print:hidden"
    >
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-white/15 bg-neutral-950/90 p-1 shadow-lg shadow-black/40 backdrop-blur-md">
        {/* `neutral-500` composited through the 90%-opaque pill measured
            3.15:1–3.51:1 against the six light-ish variants. `neutral-400`
            reads 6.46:1 on #202020 and 7.94:1 on #080808. */}
        <span className="pl-3 pr-1 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-neutral-400">
          Design
        </span>
        {options.map((option, index) => {
          const active = option.key === current;
          return (
            <button
              key={option.key}
              type="button"
              title={option.hint}
              aria-pressed={active}
              aria-current={active ? "true" : undefined}
              onClick={() => {
                if (active) return;
                startTransition(() => {
                  router.push(`/?v=${option.key}`, { scroll: false });
                });
              }}
              className={`inline-flex min-h-9 min-w-9 items-center gap-1.5 rounded-full px-3 font-mono text-xs transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-neutral-200 motion-reduce:transition-none ${
                active
                  ? "bg-neutral-100 text-neutral-950"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              } ${pending && !active ? "opacity-60" : ""}`}
            >
              <span className="tabular-nums">{index + 1}</span>
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
