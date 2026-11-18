import { ImageResponse } from "next/og";
import { loadCard } from "@/lib/scout";
import { cardTree, cardH } from "@/lib/og/renderCard26";
import { loadCardAssets } from "@/lib/og/renderCard";
import { loadCardFonts } from "@/lib/og/card";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const alt = "gitone driver card";

// Social unfurl for the scout report: the live card framed in carbon.
export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const res = await loadCard(username);
  if ("error" in res) {
    const fonts = await loadCardFonts();
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0c0c0f",
            color: "#edeef2",
            fontFamily: "Titillium",
          }}
        >
          <div style={{ display: "flex", fontWeight: 900, fontSize: 88, letterSpacing: 4 }}>GITONE</div>
        </div>
      ),
      { ...size, fonts },
    );
  }

  const card = res.card;
  const fonts = await loadCardFonts();
  const assets = await loadCardAssets(card);
  // portrait card (2:3) framed for a 1200x630 unfurl
  const cardW = 360;
  const H = cardH(cardW); // ≈ 545 with frame
  const top = Math.round((630 - H) / 2);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          position: "relative",
          background: "linear-gradient(160deg, #131318 0%, #0a0a0d 70%)",
        }}
      >
        <div style={{ position: "absolute", left: 120, top, display: "flex" }}>{cardTree(card, assets, cardW)}</div>
      </div>
    ),
    { ...size, fonts },
  );
}
