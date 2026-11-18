"use client";

import { useEffect, useRef } from "react";

// Reveal-on-scroll with the timeout safety net: IntersectionObserver flips
// .revealed when the element enters view; a hard timeout guarantees it fires
// even when the view jumps past the trigger (e.g. anchor navigation) — a
// hidden section is a broken section.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      el.classList.add("revealed");
      io.disconnect();
      clearTimeout(net);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) show();
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    const net = setTimeout(show, 1400 + delay);
    return () => {
      io.disconnect();
      clearTimeout(net);
    };
  }, [delay]);

  return (
    <div ref={ref} className={`reveal${className ? ` ${className}` : ""}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
