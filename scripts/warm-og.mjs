#!/usr/bin/env node
// Off-path OG poster warmer. Complements scripts/warm.mjs: warms the 1200x630
// share image for every scouted profile so a first share is deterministic.
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = process.cwd();
const WRANGLER = join(REPO, "node_modules", ".bin", "wrangler");
const BUCKET = "gitone-pngs-v2";
const LOCAL = process.env.WARM_PORT ? `http://127.0.0.1:${process.env.WARM_PORT}` : "http://127.0.0.1:3002";
const STATE = join(REPO, "scripts", ".og-warm-state.json");
const logins = JSON.parse(readFileSync(join(REPO, "scripts", ".warm-state.json"), "utf8"));
let done = new Set();
try { done = new Set(JSON.parse(readFileSync(STATE, "utf8"))); } catch {}

async function up() {
  try { return (await fetch(LOCAL, { signal: AbortSignal.timeout(3000) })).status > 0; }
  catch { return false; }
}
if (!(await up())) {
  console.error(`local server on ${LOCAL} is not up`);
  process.exit(1);
}
let ok = 0;
for (const login of logins) {
  if (done.has(login)) continue;
  try {
    const res = await fetch(`${LOCAL}/api/og/${login}?force=1`, { signal: AbortSignal.timeout(120000) });
    if (!res.ok) { console.log(login, "http", res.status); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100000) { console.log(login, "suspicious", buf.length); continue; }
    const dir = mkdtempSync(join(tmpdir(), "ogwarm-"));
    const file = join(dir, "v");
    writeFileSync(file, buf);
    execFileSync(WRANGLER, ["r2", "object", "put", `${BUCKET}/og:v20:${login.toLowerCase()}`, "--remote", "--file", file, "--content-type", "image/png"], { cwd: REPO, stdio: "ignore" });
    execFileSync("rm", ["-rf", dir]);
    done.add(login);
    writeFileSync(STATE, JSON.stringify([...done].sort()));
    ok += 1;
    console.log("ok", login, buf.length);
  } catch (e) {
    console.log(login, "err", e.message);
  }
}
console.log(`[og-warm] done: ${ok} warmed, ${done.size}/${logins.length} total`);
