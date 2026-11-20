import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export default function sitemap(): MetadataRoute.Sitemap {
  // The shop window plus a sample grid of real driver reports — enough for
  // crawlers to discover the per-user pattern; individual profiles are
  // effectively infinite, so we do not enumerate them all.
  const featured = ["torvalds", "sindresorhus", "gaearon", "xevrion", "yyx990803", "LangerSword"];
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    ...featured.map((login) => ({
      url: `${BASE}/${login}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
