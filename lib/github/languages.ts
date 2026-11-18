// Top-language → logo resolution. Pure, framework-agnostic (no DOM): given the
// repo list, rank languages by how many repos use each as their primary, then
// resolve a coloured logo from Devicon (https://devicon.dev), served by
// jsDelivr.
//
// IMPORTANT: GitHub's `primaryLanguage` is the *byte-largest* language per
// repo, so a TypeScript/Python project with a big generated CSS or HTML file
// is reported as CSS/HTML. We DEMOTE styling/markup/data/prose languages so
// the card's headline goes to a real programming language (see NON_HEADLINE).

const CDN_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const LOGO_URL_OVERRIDES: Record<string, string> = {
  "c-original": "https://cdn.jsdelivr.net/npm/programming-languages-logos/src/c/c.png",
  rescript: "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme/icons/rescript.svg",
};

// GitHub primaryLanguage.name (lowercased) → Devicon icon id ("<dir>-<variant>").
export const LANGUAGE_SLUGS: Record<string, string> = {
  javascript: "javascript-original",
  typescript: "typescript-original",
  python: "python-original",
  java: "java-original",
  c: "c-original",
  "c++": "cplusplus-original",
  cpp: "cplusplus-original",
  "c#": "csharp-original",
  csharp: "csharp-original",
  go: "go-original-wordmark",
  rust: "rust-original",
  ruby: "ruby-original",
  php: "php-original",
  swift: "swift-original",
  kotlin: "kotlin-original",
  dart: "dart-original",
  scala: "scala-original",
  elixir: "elixir-original",
  haskell: "haskell-original",
  lua: "lua-original",
  r: "r-original",
  shell: "bash-original",
  vue: "vuejs-original",
  svelte: "svelte-original",
  html: "html5-original",
  css: "css3-original",
  scss: "sass-original",
  sass: "sass-original",
  clojure: "clojure-original",
  erlang: "erlang-original",
  perl: "perl-original",
  "objective-c": "objectivec-plain",
  zig: "zig-original",
  julia: "julia-original",
  ocaml: "ocaml-original",
  powershell: "powershell-original",
  dockerfile: "docker-original",
  "jupyter notebook": "jupyter-original",
  crystal: "crystal-original",
  solidity: "solidity-original",
  nim: "nim-original",
  rescript: "rescript",
  astro: "astro-original",
  apex: "apex-original",
  arduino: "arduino-original",
  awk: "awk-original",
  clojurescript: "clojurescript-original",
  cmake: "cmake-original",
  cobol: "cobol-original",
  coffeescript: "coffeescript-original",
  delphi: "delphi-original",
  elm: "elm-original",
  "emacs lisp": "emacs-original",
  "f#": "fsharp-original",
  fsharp: "fsharp-original",
  fortran: "fortran-original",
  gdscript: "godot-original",
  gleam: "gleam-original",
  graphql: "graphql-plain",
  groovy: "groovy-original",
  handlebars: "handlebars-original",
  haxe: "haxe-original",
  hcl: "terraform-original",
  mathematica: "wolfram-original",
  matlab: "matlab-original",
  nix: "nixos-original",
  plpgsql: "postgresql-original",
  processing: "processing-original",
  prolog: "prolog-original",
  purescript: "purescript-original",
  racket: "racket-original",
  terraform: "terraform-original",
  tex: "tex-original",
  tsql: "microsoftsqlserver-plain",
  vala: "vala-original",
  vba: "visualbasic-original",
  "vim script": "vim-original",
  "vim snippet": "vim-original",
  "visual basic": "visualbasic-original",
  "visual basic .net": "visualbasic-original",
  webassembly: "wasm-original",
};

// Styling / markup / prose / data / config languages (lowercased). These
// inflate by bytes but aren't a developer's "headline" language, so they're
// ranked below any real programming language.
const NON_HEADLINE = new Set([
  "css", "scss", "sass", "less", "stylus", "postcss",
  "html", "xml", "svg", "pug", "haml", "ejs", "handlebars", "mustache", "liquid",
  "jinja", "twig", "blade", "smarty", "nunjucks",
  "markdown", "mdx", "tex", "asciidoc", "restructuredtext", "org", "roff", "rich text format",
  "json", "yaml", "toml", "csv", "ini",
  "dockerfile", "makefile", "cmake", "hcl", "terraform",
]);

export const isHeadlineLanguage = (name: string): boolean => !NON_HEADLINE.has(name.toLowerCase());

export interface LanguageLogo {
  name: string;
  slug: string;
}

// Counts non-null primary languages and orders them by repo count (desc) with
// a deterministic name tie-break (asc), THEN floats headline (programming)
// languages above styling/markup/data.
export function rankLanguages(repos: { language: string | null }[]): string[] {
  const counts = new Map<string, number>();
  for (const { language } of repos) {
    if (!language) continue;
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return [
    ...sorted.filter(([name]) => isHeadlineLanguage(name)),
    ...sorted.filter(([name]) => !isHeadlineLanguage(name)),
  ].map(([name]) => name);
}

export function logoSlugFor(name: string): string | null {
  return LANGUAGE_SLUGS[name.toLowerCase()] ?? null;
}

// The logo for the HEADLINE language only — never a different language's icon.
export function topLanguageLogo(rankedNames: string[]): LanguageLogo | null {
  const top = rankedNames[0];
  const slug = top ? logoSlugFor(top) : null;
  return slug ? { name: top, slug } : null;
}

export function languageLogoUrl(slug: string): string {
  return LOGO_URL_OVERRIDES[slug] ?? `${CDN_BASE}/${slug.split("-")[0]}/${slug}.svg`;
}
