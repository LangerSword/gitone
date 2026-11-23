import { buildOg } from "@/app/[username]/opengraph-image";
import { PNG_HEADERS } from "@/lib/og/pngCache";

export const runtime = "nodejs";

// Off-path render hook for the warmer. Never exposed to the public without
// the local force flag — Workers cannot render Satori inside 10 ms.
export async function GET(req: Request, ctx: { params: Promise<{ username: string }> }) {
  if (process.env.GITONE_FORCE_RENDER !== "1" || !new URL(req.url).searchParams.has("force")) {
    return new Response("not allowed", { status: 403 });
  }
  const { username } = await ctx.params;
  const res = await buildOg(username);
  return new Response(res.body, { headers: PNG_HEADERS });
}
