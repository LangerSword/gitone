import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Pretty embed URL: gitone/<username>.png -> the card image route. The
    // username charset matches GitHub's (alphanumerics + hyphens), and it only
    // matches the .png suffix, so this never shadows real static assets in
    // /public. afterFiles, so /public files still win over it.
    return [
      { source: "/:username([a-zA-Z0-9-]+).png", destination: "/api/card-image/:username" },
    ];
  },
};

export default nextConfig;
