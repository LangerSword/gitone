// The landing page's atmosphere: two slow colour fields (warm signal on the
// left, cool white on the right) and a measuring grid. Fixed decoration — it
// never adds scroll height. The GitHub contribution heatmap lives in the
// lower-third band (ContribGrid), not scattered here.
export function TrackBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute"
        style={{
          left: "-12%",
          top: "-18%",
          width: "58%",
          height: "62%",
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(193, 18, 31, 0.2), transparent 72%)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "-10%",
          bottom: "-16%",
          width: "52%",
          height: "58%",
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(255, 255, 255, 0.1), transparent 74%)",
        }}
      />

      <div className="grid-lines absolute inset-0" style={{ opacity: 0.28 }} />

      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(246,241,232,0.16), transparent)" }}
      />
    </div>
  );
}
