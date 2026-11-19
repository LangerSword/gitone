// The landing page's atmosphere: a lit studio rather than a flat field. A warm
// signal blooms top-left, a cool spotlight pools behind the card fan on the
// right, and a faint perspective floor grounds the grid. Fixed decoration — it
// never adds scroll height. The GitHub heatmap lives in the lower band.
export function TrackBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* base grade: warm deep-red top-left cooling into charcoal */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 16% -12%, rgba(193,18,31,0.17), transparent 54%), radial-gradient(80% 60% at 90% 16%, rgba(246,241,232,0.06), transparent 62%), linear-gradient(180deg, #181820, #101014 72%)",
        }}
      />
      {/* the spotlight pooling behind the fan */}
      <div
        className="absolute"
        style={{
          right: "0%",
          top: "4%",
          width: "56%",
          height: "78%",
          background:
            "radial-gradient(closest-side, rgba(246,241,232,0.11), rgba(193,18,31,0.06) 54%, transparent 76%)",
        }}
      />
      {/* warm ember */}
      <div
        className="absolute"
        style={{
          left: "-12%",
          top: "-18%",
          width: "58%",
          height: "62%",
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(193,18,31,0.22), transparent 72%)",
        }}
      />
      <div className="grid-lines absolute inset-0" style={{ opacity: 0.16 }} />
      {/* a faint floor glow grounding the scene */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: "30%", background: "linear-gradient(180deg, transparent, rgba(193,18,31,0.05) 70%, rgba(0,0,0,0.28))" }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(246,241,232,0.16), transparent)" }}
      />
    </div>
  );
}
