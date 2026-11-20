"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Auto-hide-on-scroll for the floating support pills — the familiar
 * mobile-browser-chrome behavior: they slide away as you scroll DOWN a page
 * (out of the way while reading the report) and slide back the moment you
 * scroll UP. Deliberately not gated by width: the pills only cover content
 * when the page is tall enough to scroll — which is exactly when this fires.
 */
export function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      // Deadzone: ignore sub-6px jitter (and keep lastY as the anchor) so a
      // trembling finger can't flicker the pills in and out.
      if (Math.abs(dy) < 6) return;
      lastY.current = y;
      // Scrolling down past the top hides; any upward scroll shows.
      setHidden(dy > 0 && y > 40);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}
