// The landing page's atmosphere: two slow colour fields (warm signal on the
// left, cool mint on the right), a measuring grid, and a scatter of livery
// sectors along the base. Fixed decoration — it never adds scroll height.
const LIT: { x: number; c: string }[] = [
  { x: 8, c: "var(--f1-red)" },
  { x: 21, c: "var(--amber)" },
  { x: 36, c: "var(--mint)" },
  { x: 51, c: "var(--f1-red)" },
  { x: 64, c: "var(--amber)" },
  { x: 79, c: "var(--mint)" },
  { x: 92, c: "var(--f1-red)" },
];

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
          background: "radial-gradient(closest-side, rgba(201, 121, 69, 0.2), transparent 72%)",
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
          background: "radial-gradient(closest-side, rgba(121, 199, 164, 0.1), transparent 74%)",
        }}
      />

      <div className="grid-lines absolute inset-0" style={{ opacity: 0.28 }} />

      <div className="lit-sectors absolute inset-x-0 bottom-0" style={{ height: 180, opacity: 0.55 }}>
        {LIT.map((s, i) => (
          <span key={i} style={{ left: `${s.x}%`, top: `${68 + (i % 3) * 9}%`, background: s.c }} />
        ))}
      </div>

      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(246,241,232,0.16), transparent)" }}
      />
    </div>
  );
}
