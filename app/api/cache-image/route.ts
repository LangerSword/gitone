import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";

const LOGIN = /^[a-z0-9][a-z0-9-]{0,38}$/;

// Client-rendered warm cache. The browser does the expensive rasterisation;
// this route only stores the bytes under the exact key the OG route reads.
// Writes are skipped when the key already exists, so repeat visits are cheap.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const a = (url.searchParams.get("a") ?? "").toLowerCase();
  const b = (url.searchParams.get("b") ?? "").toLowerCase();
  const login = (url.searchParams.get("login") ?? "").toLowerCase();

  let key: string;
  if (kind === "card" && LOGIN.test(login)) key = `cardpng:v10:${login}::`;
  else if (kind === "teaser" && LOGIN.test(a) && LOGIN.test(b)) key = `poster-teaser:v46:${a}/${b}`;
  else return new Response("invalid", { status: 400 });

  const bytes = Buffer.from(await req.arrayBuffer());
  if (bytes.length < 200_000 || bytes.length > 4_000_000) {
    return new Response("bad size", { status: 400 });
  }

  try {
    const { env } = getCloudflareContext() as {
      env?: { GITONE_PNGS?: { head(k: string): Promise<unknown>; put(k: string, v: Uint8Array, opts?: unknown): Promise<unknown> } };
    };
    const store = env?.GITONE_PNGS;
    if (!store) return new Response("no store", { status: 202 });
    if (await store.head(key)) return new Response("cached", { status: 200 });
    await store.put(key, new Uint8Array(bytes), {
      httpMetadata: { contentType: "image/png" },
      customMetadata: { source: "client-warm" },
    });
    return new Response("stored", { status: 201 });
  } catch {
    return new Response("store failed", { status: 202 });
  }
}
