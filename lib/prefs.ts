// Per-login preferences that survive without an account: a long-lived cookie
// is the source of truth for the server render, localStorage is the client
// fallback, and the share URL stays authoritative when it carries a value.
export const PREF_MAX_AGE = 60 * 60 * 24 * 365;

export const prefCookie = (kind: "team" | "country", login: string) =>
  `gitone_${kind}_${login.toLowerCase().replace(/[^a-z0-9_-]/g, "")}`;

export function writePref(kind: "team" | "country", login: string, value: string) {
  document.cookie = `${prefCookie(kind, login)}=${encodeURIComponent(value)}; path=/; max-age=${PREF_MAX_AGE}; SameSite=Lax`;
}

export function clearPref(kind: "team" | "country", login: string) {
  document.cookie = `${prefCookie(kind, login)}=; path=/; max-age=0; SameSite=Lax`;
}

export function localPrefKey(kind: "team" | "country", login: string) {
  return `gitone:${kind}:${login.toLowerCase()}`;
}
