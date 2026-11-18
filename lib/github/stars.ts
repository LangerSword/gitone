import "server-only";

// The repo's star count for the header pill. Server-side and revalidated
// hourly — GitHub's unauthenticated REST budget is 60 requests per hour per
// IP, so this must never run per visitor. A failure returns null and the
// pill hides the number rather than lying with a zero.
export async function getRepoStars(): Promise<number | null> {
  try {
    const token = process.env.GITHUB_TOKEN ?? process.env.GITHUB_TOKENS?.split(",")[0]?.trim();
    const res = await fetch("https://api.github.com/repos/LangerSword/gitone", {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "gitone",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { stargazers_count?: number };
    return typeof json.stargazers_count === "number" ? json.stargazers_count : null;
  } catch {
    return null;
  }
}
