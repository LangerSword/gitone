import { normalizeCountry } from "@/lib/countries";
import { pickTeam } from "@/lib/teams";

// One key shape for every writer and reader of a rendered card PNG.
// Pinned variants must resolve to the same key whether the value arrived as a
// raw embed query (?country=NL&team=fer) or as the page's resolved variant.
export function cardCacheKey(
  login: string,
  country?: string | null,
  team?: string | null,
): string {
  const flag = normalizeCountry(country) ?? "";
  const teamCode = team ? (pickTeam(team)?.code ?? "") : "";
  return `cardpng:v10:${login.toLowerCase()}:${flag}:${teamCode}`;
}
