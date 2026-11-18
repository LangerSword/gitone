import { ImageResponse } from "next/og";
import { loadCardFonts } from "@/lib/og/card";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const alt = "gitone · your github, rated like f1";

// Home unfurl: the lights are on.
export default async function OgImage() {
  const fonts = await loadCardFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 96,
          background: "radial-gradient(70% 42% at 30% 20%, rgba(225,6,0,0.14), rgba(0,0,0,0)) #0a0a0d",
          color: "#edeef2",
          fontFamily: "Titillium",
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: "radial-gradient(circle at 35% 30%, #ff4a41, #b30400 68%)",
                display: "flex",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 44, fontWeight: 900, fontSize: 104, lineHeight: 0.95 }}>
          your github,
        </div>
        <div style={{ display: "flex", fontWeight: 900, fontSize: 104, lineHeight: 0.95, color: "#e10600" }}>
          rated like f1.
        </div>
        <div style={{ display: "flex", marginTop: 30, fontFamily: "JBMono", fontSize: 26, color: "#9a9ca6" }}>
          EXP · RAC · AWA · PAC. Scored live from real commits
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
