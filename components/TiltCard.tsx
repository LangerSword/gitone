"use client";

import { useEffect, useRef, useState } from "react";

type TiltTarget = Pick<HTMLDivElement, "style" | "getBoundingClientRect">;
type TiltPointer = Pick<React.PointerEvent, "clientX" | "clientY">;

// Exported so the no-motion contract can be tested without a browser. The
// component calls this on every pointer move; reduced motion short-circuits
// before any inline transform or glare position is written.
export function applyTiltStyle(
  el: TiltTarget,
  pointer: TiltPointer,
  max: number,
  reducedMotion: boolean,
): void {
  if (reducedMotion) return;
  const r = el.getBoundingClientRect();
  const px = (pointer.clientX - r.left) / r.width;
  const py = (pointer.clientY - r.top) / r.height;
  el.style.transform = `perspective(1000px) rotateY(${((px - 0.5) * max).toFixed(1)}deg) rotateX(${((0.5 - py) * (max * 0.85)).toFixed(1)}deg)`;
  el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
  el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
}

// FUT-style hover physics for a card: it leans toward the cursor while a
// glassy specular streak sweeps with the pointer — the foil catching light.
// The transform is driven imperatively on the element (no re-render per
// pointermove); touch disables it for good on the first touch event, and the
// glare only ever paints under a real hover pointer (see globals.css).
export function TiltCard({ children, max = 8 }: { children: React.ReactNode; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useRef(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion) {
      el.style.transform = "perspective(1000px)";
      el.style.transition = "none";
      el.style.setProperty("--mx", "-999%");
      el.style.setProperty("--my", "-999%");
    } else {
      el.style.transition = "transform 0.2s ease-out";
    }
  }, [reducedMotion]);

  const onMove = (e: React.PointerEvent) => {
    if (!enabled.current || e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    applyTiltStyle(el, e, max, reducedMotion);
  };

  const onLeave = () => {
    if (reducedMotion) return;
    const el = ref.current;
    if (el) el.style.transform = "perspective(1000px)";
  };

  const onTouch = () => {
    enabled.current = false;
    onLeave();
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerDown={onTouch}
      style={{
        position: "relative",
        transform: "perspective(1000px)",
        transition: reducedMotion ? "none" : "transform 0.2s ease-out",
        willChange: reducedMotion ? "auto" : "transform",
      }}
      className="tilt-wrap group/tilt"
    >
      {children}
    </div>
  );
}
