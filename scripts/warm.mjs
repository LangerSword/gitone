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
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = "/home/lakshaya/projects/gitone";
const NS = "8d67e9c706f64ec397ea485d4fb30942";
const BUCKET = "gitone-pngs";
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

function wrangler(args) {
  return execFileSync("npx", ["wrangler", ...args], {
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
    env: { ...process.env, NODE_ENV: "production" },
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

function warmed() {
  try {
    return new Set(JSON.parse(readFileSync(STATE, "utf8")));
  } catch {
    return new Set();
  }
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
  const done = warmed();
  return [...cards].filter((c) => !done.has(c)).sort();
}

function pushPng(login, png) {
  const dir = mkdtempSync(join(tmpdir(), "gitone-warm-"));
  const file = join(dir, "v");
  writeFileSync(file, png);
  const key = `cardpng:v6:${login.toLowerCase()}::`;
  try {
    wrangler([
      "r2", "object", "put", `${BUCKET}/${key}`, "--remote", "--file", file,
      "--content-type", "image/png",
      "--cache-control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    ]);
    const done = warmed();
    done.add(login.toLowerCase());
    writeFileSync(STATE, JSON.stringify([...done].sort()));
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
      const res = await fetch(`${LOCAL}/${login}.png`, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) return { login, ok: false, status: res.status };
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 20_000) return { login, ok: false, status: `suspicious-${buf.length}B` };
      pushPng(login, buf);
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
