#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

let dotenvLoaded = false;

function parseEnv(content) {
  const out = {};
  const lines = content.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");
    out[key] = value;
  }
  return out;
}

export function loadDotenv(envPath = join(ROOT, ".env")) {
  if (dotenvLoaded) return;
  dotenvLoaded = true;
  if (!existsSync(envPath)) return;

  const parsed = parseEnv(readFileSync(envPath, "utf-8"));
  for (const [k, v] of Object.entries(parsed)) {
    if (process.env[k] === undefined) {
      process.env[k] = v;
    }
  }
}

export function resolveDate(explicit) {
  if (explicit && /^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;
  if (process.env.TARGET_DATE && /^\d{4}-\d{2}-\d{2}$/.test(process.env.TARGET_DATE)) {
    return process.env.TARGET_DATE;
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function resolveVaultPath(explicit) {
  loadDotenv();
  const raw =
    explicit ||
    process.env.OBSIDIAN_VAULT_PATH ||
    process.env.VAULT_DIR ||
    join(ROOT, ".vault");
  return resolve(raw);
}

export function repoRoot() {
  return ROOT;
}
