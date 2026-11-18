import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-28 text-center">
      <div className="lights justify-center" aria-hidden="true">
        <span className="on" style={{ background: "radial-gradient(circle at 35% 30%, #ff4a41, #b30400 68%)" }} />
      </div>
      <h1 className="mt-6 mono text-[15px] tracking-[0.2em]" style={{ color: "var(--ink)" }}>
        NO SUCH DRIVER ON THE GRID
      </h1>
      <p className="mt-3 text-[14px]" style={{ color: "var(--dim)" }}>
        That login never took a lap. Check the spelling and try again.
      </p>
      <Link
        href="/"
        className="mono inline-block mt-8 rounded-md px-5 py-3 text-[12px] font-bold tracking-[0.12em]"
        style={{ background: "var(--f1-red)", color: "#ffffff" }}
      >
        BACK TO THE GRID
      </Link>
    </main>
  );
}
