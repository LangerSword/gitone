"use client";

import { useEffect, useRef } from "react";

// Champagne burst on card reveal — podium and above pop the cork. A tiny
// canvas particle loop, no dependencies; runs once on mount and cleans up.
export function Confetti({ colors, count = 130 }: { colors: string[]; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = (canvas.width = canvas.offsetWidth * dpr);
    const H = (canvas.height = canvas.offsetHeight * dpr);

    const parts = Array.from({ length: count }, () => ({
      x: W * (0.3 + Math.random() * 0.4),
      y: H * (0.42 + Math.random() * 0.08),
      vx: (Math.random() - 0.5) * 7 * dpr,
      vy: -(5 + Math.random() * 9) * dpr,
      w: (3 + Math.random() * 4) * dpr,
      h: (6 + Math.random() * 7) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.22,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
    }));

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.life += 1;
        p.vy += 0.16 * dpr;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        // champagne fades after ~150 frames
        if (p.life > 150 || p.y > H + 20) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - p.life / 150);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [colors, count]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}
    />
  );
}
