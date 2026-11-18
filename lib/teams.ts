// The 2026 grid. Choosing a team re-skins the card's livery: the slash,
// number chip, stat accents and frame glow all follow the team colour.
export interface Team {
  code: string;
  name: string;
  color: string;
  ink: string; // text that reads on the team colour
}

export const TEAMS: Team[] = [
  { code: "RBR", name: "Oracle Red Bull Racing", color: "#1e41ff", ink: "#ffffff" },
  { code: "FER", name: "Scuderia Ferrari", color: "#dc0000", ink: "#ffffff" },
  { code: "MER", name: "Mercedes-AMG Petronas", color: "#00d2be", ink: "#08171a" },
  { code: "MCL", name: "McLaren Formula 1 Team", color: "#ff8700", ink: "#16100a" },
  { code: "AMR", name: "Aston Martin Aramco", color: "#229971", ink: "#ffffff" },
  { code: "ALP", name: "BWT Alpine", color: "#ff87bc", ink: "#1a0d14" },
  { code: "WIL", name: "Atlassian Williams", color: "#64c4ff", ink: "#08131c" },
  { code: "RB", name: "Visa Cash App RB", color: "#6c98ff", ink: "#0b1020" },
  { code: "HAA", name: "TGR Haas F1 Team", color: "#b6babd", ink: "#101013" },
  { code: "AUD", name: "Audi Revolut F1 Team", color: "#00594f", ink: "#ffffff" },
  { code: "CAD", name: "Cadillac Formula 1 Team", color: "#c8b99b", ink: "#15130f" },
];

export function pickTeam(code: string | null | undefined): Team | null {
  if (!code) return null;
  return TEAMS.find((t) => t.code === code.trim().toUpperCase()) ?? null;
}
