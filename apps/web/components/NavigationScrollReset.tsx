"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Next's scroll handler writes `documentElement.scrollTop` and bails when the
 * first segment node is already on screen — a sticky header qualifies. It also
 * never resets a nested scroller. The analyst shell scrolls inside `#app-scroll`
 * (`overflow: auto` on the dashboard `<main>`), so a sidebar navigation was
 * leaving the next page mid-scroll.
 *
 * Same-pathname updates (the landing `?v=` switcher) are handled there, not
 * here: this effect keys off the pathname only, so a hash link on the current
 * page is left alone.
 */
export function NavigationScrollReset() {
  const pathname = usePathname();
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (window.location.hash) return;

    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    document.getElementById("app-scroll")?.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, [pathname]);

  return null;
}
