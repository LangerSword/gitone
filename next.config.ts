import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No framework badge floating over the product in dev.
  devIndicators: false,
  async headers() {
    // Social crawlers need cacheable HTML to build and reuse unfurls. Route
    // handlers (PNG/API) set their own headers and are excluded here.
    return [
      {
        source: "/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" }],
      },
    ];
  },
  async rewrites() {
    // Pretty embed URL: gitone/<username>.png -> the card image route. The
    // username charset matches GitHub's (alphanumerics + hyphens), and it only
    // matches the .png suffix, so this never shadows real static assets in
    // /public. afterFiles, so /public files still win over it.
    return [
      { source: "/:username([a-zA-Z0-9-]+).png", destination: "/api/card-image/:username" },
      { source: "/:username([a-zA-Z0-9-]+)/vs/:opponent([a-zA-Z0-9-]+).png", destination: "/api/battle-image/:username/:opponent" },
    ];
  },
};

export default nextConfig;
