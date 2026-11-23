#!/usr/bin/env node
/**
 * Off-path card PNG warmer.
 *
 * Why this exists: the Workers free plan allows 10ms of CPU per request. A
 * cold Satori card composite costs ~2s, so rendering one on the request path
 * is killed outright (Cloudflare 1102 -> 503). Measured live before this
 * existed: cold renders failed 24/24.
 *
 * So the live route serves a branded fallback on a cold miss, and this script
 * does the expensive render somewhere with no CPU cap — this machine — then
 * writes the PNG into Cloudflare KV. The route's edge cache picks it up and
 * serves it for a day.
 *
 * Usage:
 *   node scripts/warm.mjs                 # warm everything due (max 25)
 *   node scripts/warm.mjs 50              # raise the batch cap
 *   node scripts/warm.mjs --only torvalds # specific handles
 *
 * Requires a local production server (scripts/warm.mjs starts one if the port
 * is closed) and wrangler auth with R2 object write.
 */
import { execFileSync, spawn } from "node:child_process";
import sharp from "sharp";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = process.cwd();
const NS = "8d67e9c706f64ec397ea485d4fb30942";
const BUCKET = "gitone-pngs-v2";
const STATE = join(REPO, "scripts", ".warm-state.json");
const LOCAL_PORT = process.env.WARM_PORT || "3001";
const LOCAL = `http://127.0.0.1:${LOCAL_PORT}`;
const DEFAULT_BATCH = 25;

const argv = process.argv.slice(2);
const onlyIdx = argv.indexOf("--only");
let only = null;
let rest = argv;
if (onlyIdx >= 0) {
  only = argv.slice(onlyIdx + 1).filter((a) => !/^\d+$/.test(a));
  rest = argv.slice(0, onlyIdx);
}
const batchArg = rest.find((a) => /^\d+$/.test(a));
const BATCH = batchArg ? Number(batchArg) : DEFAULT_BATCH;

const WRANGLER = join(REPO, "node_modules", ".bin", "wrangler");

function wrangler(args) {
  return execFileSync(WRANGLER, args, {
    cwd: REPO,
    maxBuffer: 256 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }).toString();
}

async function localUp() {
  try {
    const r = await fetch(`${LOCAL}/`, { signal: AbortSignal.timeout(4000) });
    return r.status > 0;
  } catch {
    return false;
  }
}

async function ensureLocalServer() {
  if (await localUp()) return false;
  console.log(`[warm] starting a local production server on :${LOCAL_PORT}`);
  const child = spawn("npx", ["next", "start", "-p", LOCAL_PORT], {
    cwd: REPO,
    detached: true,
    stdio: "ignore",
    env: { ...process.env, NODE_ENV: "production", GITONE_FORCE_RENDER: "1" },
  });
  child.unref();
  for (let i = 0; i < 40; i += 1) {
    if (await localUp()) {
      console.log("[warm] local server ready");
      return true;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("local server did not come up");
}

let warmedSet;
try {
  warmedSet = new Set(JSON.parse(readFileSync(STATE, "utf8")));
} catch {
  warmedSet = new Set();
}

function scoutedLogins() {
  // Known candidates come from the small card rows. The warmed set is local
  // state — R2 has no cheap object listing from wrangler, and asking KV again
  // would defeat the point of moving the PNGs off it.
  const keys = JSON.parse(
    wrangler(["kv", "key", "list", "--namespace-id", NS, "--remote"]),
  ).map((k) => k.name);
  const cards = new Set(
    keys.filter((n) => n.startsWith("gitone:card:")).map((n) => n.split(":").pop().toLowerCase()),
  );
  return [...cards].filter((c) => !warmedSet.has(c)).sort();
}

function pushPng(key, png) {
  const dir = mkdtempSync(join(tmpdir(), "gitone-warm-"));
  const file = join(dir, "v");
  writeFileSync(file, png);
  try {
    wrangler([
      "r2", "object", "put", `${BUCKET}/${key}`, "--remote", "--file", file,
      "--content-type", "image/png",
      "--cache-control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    ]);
  } finally {
    execFileSync("rm", ["-rf", dir]);
  }
}

async function warm(login) {
  // Transient GitHub/local-server failures are common in a long batch; one
  // retry clears most of them (measured: 15/80 failed on the first pass, all
  // rendered cleanly on a second).
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`${LOCAL}/${login}.png?force=1`, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) return { login, ok: false, status: res.status };
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 20_000) return { login, ok: false, status: `suspicious-${buf.length}B` };
      pushPng(`cardpng:v10:${login.toLowerCase()}::`, buf);

      // Tiny card thumb for the low-cost versus fallback: two of these can be
      // composited on the request path without a Satori render.
      const thumb = await sharp(buf).resize(230, 335, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).jpeg({ quality: 82 }).toBuffer();
      pushPng(`cardthumb:v1:${login.toLowerCase()}`, thumb);

      // Render the 1200x630 share card in the same off-path pass so a user's
      // first share never depends on a cold cache key.
      const og = await fetch(`${LOCAL}/api/og/${login}?force=1`, { signal: AbortSignal.timeout(120_000) });
      if (og.ok) {
        const ogBuf = Buffer.from(await og.arrayBuffer());
        if (ogBuf.length > 100_000) pushPng(`og:v18:${login.toLowerCase()}`, ogBuf);
      }

      warmedSet.add(login.toLowerCase());
      writeFileSync(STATE, JSON.stringify([...warmedSet].sort()));
      return { login, ok: true, bytes: buf.length };
    } catch (e) {
      if (attempt === 1) return { login, ok: false, status: e.message };
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return { login, ok: false, status: "unreachable" };
}

const started = await ensureLocalServer();
const todo = only ?? scoutedLogins();
const due = todo.slice(0, BATCH);
console.log(`[warm] ${todo.length} card(s) without a cached PNG; warming ${due.length}`);

let ok = 0;
for (const login of due) {
  try {
    const r = await warm(login);
    if (r.ok) ok += 1;
    console.log(`  ${r.ok ? "ok  " : "FAIL"} ${login}${r.ok ? ` (${(r.bytes / 1024).toFixed(0)}KB)` : ` ${r.status}`}`);
  } catch (e) {
    console.log(`  FAIL ${login} ${e.message}`);
  }
}
console.log(`[warm] done: ${ok}/${due.length} warmed${started ? " (started a local server)" : ""}`);
