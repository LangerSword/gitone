"use client";

import { useRef } from "react";

// FUT-style hover physics for a card: it leans toward the cursor while a
// glassy specular streak sweeps with the pointer — the foil catching light.
// The transform is driven imperatively on the element (no re-render per
// pointermove); touch disables it for good on the first touch event, and the
// glare only ever paints under a real hover pointer (see globals.css).
export function TiltCard({ children, max = 8 }: { children: React.ReactNode; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useRef(true);

  const onMove = (e: React.PointerEvent) => {
    if (!enabled.current || e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(1000px) rotateY(${((px - 0.5) * max).toFixed(1)}deg) rotateX(${((0.5 - py) * (max * 0.85)).toFixed(1)}deg)`;
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
  };

  const onLeave = () => {
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
        transition: "transform 0.2s ease-out",
        willChange: "transform",
      }}
      className="tilt-wrap group/tilt"
    >
      {/* glass: a sharp diagonal streak riding the pointer over a soft sheen */}
      <div
        aria-hidden
        className="tilt-glare"
        style={{
          background: `
            linear-gradient(115deg,
              transparent calc(var(--mx, 50%) - 22%),
              rgba(255,255,255,.05) calc(var(--mx, 50%) - 9%),
              rgba(255,255,255,.22) var(--mx, 50%),
              rgba(255,255,255,.06) calc(var(--mx, 50%) + 9%),
              transparent calc(var(--mx, 50%) + 20%)),
            radial-gradient(120% 90% at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,.10), transparent 60%)`,
          mixBlendMode: "screen",
        }}
      />
      {children}
    </div>
  );
}
