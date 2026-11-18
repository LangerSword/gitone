import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No framework badge floating over the product in dev.
  devIndicators: false,
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
