import type { Constructor } from "./types";

// Language → constructor. The headline language becomes the driver's team:
// the livery colour, the name on the band, and the tower code. Colours are
// the language communities' own brand colours, so the grid reads right at
// a glance (papaya Rust, blue TypeScript, cyan Go). Unknown or missing
// languages run as an Independent in carbon and F1 red.
const LIVERIES: Record<string, { name: string; code: string; color: string; ink: string }> = {
  typescript: { name: "TypeScript GP", code: "TS", color: "#3178c6", ink: "#ffffff" },
  javascript: { name: "JavaScript GP", code: "JS", color: "#f7df1e", ink: "#15161a" },
  python: { name: "Python GP", code: "PY", color: "#4b8bbe", ink: "#ffffff" },
  rust: { name: "Rust GP", code: "RS", color: "#f74c00", ink: "#15161a" },
  go: { name: "Go GP", code: "GO", color: "#00add8", ink: "#15161a" },
  c: { name: "C GP", code: "C", color: "#a8b9cc", ink: "#15161a" },
  "c++": { name: "C++ GP", code: "CPP", color: "#00599c", ink: "#ffffff" },
  cpp: { name: "C++ GP", code: "CPP", color: "#00599c", ink: "#ffffff" },
  java: { name: "Java GP", code: "JV", color: "#e76f00", ink: "#15161a" },
  "c#": { name: "C# GP", code: "CS", color: "#9b4f96", ink: "#ffffff" },
  csharp: { name: "C# GP", code: "CS", color: "#9b4f96", ink: "#ffffff" },
  ruby: { name: "Ruby GP", code: "RB", color: "#cc342d", ink: "#ffffff" },
  php: { name: "PHP GP", code: "PHP", color: "#777bb4", ink: "#ffffff" },
  swift: { name: "Swift GP", code: "SW", color: "#f05138", ink: "#ffffff" },
  kotlin: { name: "Kotlin GP", code: "KT", color: "#7f52ff", ink: "#ffffff" },
  dart: { name: "Dart GP", code: "DA", color: "#0175c2", ink: "#ffffff" },
  scala: { name: "Scala GP", code: "SC", color: "#dc322f", ink: "#ffffff" },
  elixir: { name: "Elixir GP", code: "EX", color: "#6e4a7e", ink: "#ffffff" },
  haskell: { name: "Haskell GP", code: "HS", color: "#5e5086", ink: "#ffffff" },
  lua: { name: "Lua GP", code: "LUA", color: "#2c2d72", ink: "#ffffff" },
  zig: { name: "Zig GP", code: "ZG", color: "#f7a41d", ink: "#15161a" },
  julia: { name: "Julia GP", code: "JL", color: "#9558b2", ink: "#ffffff" },
  r: { name: "R GP", code: "R", color: "#276dc3", ink: "#ffffff" },
  perl: { name: "Perl GP", code: "PL", color: "#39457e", ink: "#ffffff" },
  crystal: { name: "Crystal GP", code: "CR", color: "#15161a", ink: "#ffffff" },
  nim: { name: "Nim GP", code: "NIM", color: "#efc743", ink: "#15161a" },
  clojure: { name: "Clojure GP", code: "CL", color: "#5881d8", ink: "#ffffff" },
  erlang: { name: "Erlang GP", code: "ER", color: "#a90533", ink: "#ffffff" },
  ocaml: { name: "OCaml GP", code: "OC", color: "#ec6813", ink: "#ffffff" },
  shell: { name: "Shell GP", code: "SH", color: "#4eaa25", ink: "#15161a" },
  powershell: { name: "PowerShell GP", code: "PS", color: "#5391fe", ink: "#15161a" },
  solidity: { name: "Solidity GP", code: "SOL", color: "#363636", ink: "#ffffff" },
  vue: { name: "Vue GP", code: "VUE", color: "#41b883", ink: "#15161a" },
  svelte: { name: "Svelte GP", code: "SV", color: "#ff3e00", ink: "#ffffff" },
  html: { name: "HTML GP", code: "HTM", color: "#e34f26", ink: "#ffffff" },
  css: { name: "CSS GP", code: "CSS", color: "#1572b6", ink: "#ffffff" },
  scss: { name: "Sass GP", code: "SAS", color: "#cf649a", ink: "#ffffff" },
  sass: { name: "Sass GP", code: "SAS", color: "#cf649a", ink: "#ffffff" },
  markdown: { name: "Docs GP", code: "DOC", color: "#7d8b99", ink: "#ffffff" },
  dockerfile: { name: "Garage 51", code: "G51", color: "#2496ed", ink: "#ffffff" },
  hcl: { name: "Terraform GP", code: "TF", color: "#7b42bc", ink: "#ffffff" },
  terraform: { name: "Terraform GP", code: "TF", color: "#7b42bc", ink: "#ffffff" },
  nix: { name: "Nix GP", code: "NIX", color: "#7ebae4", ink: "#15161a" },
  gleam: { name: "Gleam GP", code: "GL", color: "#ffaff3", ink: "#15161a" },
  "objective-c": { name: "Objective-C GP", code: "OBJ", color: "#438eff", ink: "#ffffff" },
  fsharp: { name: "F# GP", code: "FS", color: "#378bba", ink: "#ffffff" },
  "f#": { name: "F# GP", code: "FS", color: "#378bba", ink: "#ffffff" },
  webassembly: { name: "WASM GP", code: "WASM", color: "#654ff0", ink: "#ffffff" },
  graphql: { name: "GraphQL GP", code: "GQL", color: "#e10098", ink: "#ffffff" },
};

const INDEPENDENT: Constructor = {
  language: null,
  name: "Independent",
  code: "IND",
  color: "#e10600",
  ink: "#ffffff",
};

export function constructorFor(language: string | null | undefined): Constructor {
  if (!language) return { ...INDEPENDENT };
  const l = LIVERIES[language.toLowerCase()];
  return l ? { language, ...l } : { ...INDEPENDENT };
}
