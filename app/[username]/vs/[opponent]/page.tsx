import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { computeDuel } from "@/lib/duel";
import { loadCard } from "@/lib/scout";
import type { GithubError } from "@/lib/github/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SupportPills } from "@/components/SupportPills";
import { GitStrip } from "@/components/GitStrip";
import { DuelView } from "@/components/DuelView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; opponent: string }>;
}): Promise<Metadata> {
  const { username, opponent } = await params;
  const description = `🏁 ${username} vs ${opponent} on gitone — a GitHub scout duel, sector by sector. Who wins the grid?`;
  return {
    title: `${username} vs ${opponent}`,
    description,
    openGraph: {
      title: `${username} vs ${opponent} · gitone`,
      description,
      images: [`/${username}/vs/${opponent}/opengraph-image?ogv=6`],
    },
    twitter: { card: "summary_large_image", title: `${username} vs ${opponent} · gitone`, description, images: [`/${username}/vs/${opponent}/opengraph-image?ogv=6`] },
  };
}

function RedFlag({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-28 text-center">
      <div className="lights justify-center" aria-hidden="true">
        <span className="lamp on" />
      </div>
      <h1 className="mono mt-6 text-[13px] font-bold tracking-[0.22em]" style={{ color: "var(--ink)" }}>
        RED FLAG
      </h1>
      <p className="mt-3 text-[14px]" style={{ color: "var(--dim)" }}>
        {message}
      </p>
      <Link
        href="/"
        className="mono mt-8 inline-block px-5 py-3 text-[11px] font-bold tracking-[0.16em]"
        style={{ background: "var(--f1-red)", color: "#ffffff" }}
      >
        BACK TO THE GRID
      </Link>
    </main>
  );
}

export default async function VsPage({
  params,
}: {
  params: Promise<{ username: string; opponent: string }>;
}) {
  const { username, opponent } = await params;
  const a = await loadCard(username);
  const b = await loadCard(opponent);

  if ("error" in a || "error" in b) {
    const errRes = "error" in a ? a : (b as { error: GithubError });
    const err = errRes.error;
    if (err.type === "notfound" || err.type === "invalid") notFound();
    return <RedFlag message={err.message} />;
  }

  const duel = computeDuel(a.card, b.card);

  // The server loads both cards and computes the duel; the broadcast itself
  // (walkout → live shootout → chequered flag → settled) is a client reveal.
  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ "--livery": duel.challenger.constructor.color } as React.CSSProperties}
    >
      <SiteHeader back backHref={`/${duel.challenger.login}`} backLabel="← BACK TO THE REPORT" />
      <DuelView duel={duel} />
      <GitStrip />
      <SiteFooter />
      <SupportPills />
    </main>
  );
}