export const runtime = "nodejs";

// Same-origin flag proxy. html-to-image re-fetches every <img> with a cache-bust
// query; flagcdn.com has no CORS header, so captures died with `download failed:
// Event` and no PNG was produced. Serving the bytes from our own origin keeps
// exports working and costs no Worker CPU (network wait is free).
const TRANSPARENT = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const m = path.join("/").match(/^w(\d{2,3})\/([a-z]{2}(?:-[a-z]{3})?)\.png$/);
  if (!m) return new Response("bad flag", { status: 400 });

  try {
    const res = await fetch(`https://flagcdn.com/w${m[1]}/${m[2]}.png`);
    if (!res.ok) throw new Error(String(res.status));
    return new Response(res.body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch {
    return new Response(new Uint8Array(TRANSPARENT), {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
    });
  }
}
