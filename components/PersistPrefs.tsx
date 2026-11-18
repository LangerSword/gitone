"use client";

import { useEffect } from "react";
import { writePref } from "@/lib/prefs";

// A share link is a choice too: if the URL carries a livery or flag, write
// the same per-login cookie the pickers use, so the next visit without the
// query still opens on that card.
export function PersistPrefs({
  login,
  team,
  country,
}: {
  login: string;
  team?: string | null;
  country?: string | null;
}) {
  useEffect(() => {
    if (team) writePref("team", login, team);
    if (country) writePref("country", login, country);
  }, [login, team, country]);

  return null;
}
