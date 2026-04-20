/**
 * config.js — resolves project root, vault path, and target date.
 *
 * Generic across projects: PROJECT_ROOT is auto-detected from this file's
 * location (scripts/lib/config.js → repo root two levels up). OBSIDIAN_VAULT_PATH
 * is required and must be set explicitly via env or .env file.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Project root — scripts/lib/config.js is two levels below the repo root. */
export const PROJECT_ROOT = resolve(__dirname, "..", "..");

/** Back-compat alias. Callers that used REPO_DIR should migrate to PROJECT_ROOT. */
export const REPO_DIR = PROJECT_ROOT;

/**
 * Load key=value pairs from a .env file (if present) into process.env.
 * Silently skips if the file is missing. Does not overwrite pre-set values.
 */
export function loadDotenv(path = join(PROJECT_ROOT, ".env")) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

/**
 * Resolve the Obsidian vault path. Throws a clear error if OBSIDIAN_VAULT_PATH
 * is not set — no hard-coded defaults.
 */
export function resolveVaultPath() {
  loadDotenv();
  const vault = process.env.OBSIDIAN_VAULT_PATH;
  if (!vault) {
    const msg =
      "OBSIDIAN_VAULT_PATH is not set.\n" +
      "  Set it in your shell profile or in .env at the repo root.\n" +
      "  Example: export OBSIDIAN_VAULT_PATH=\"$HOME/Documents/Obsidian/MyVault\"";
    throw new Error(msg);
  }
  if (!existsSync(vault)) {
    throw new Error(`OBSIDIAN_VAULT_PATH points to a non-existent directory: ${vault}`);
  }
  return vault;
}

/** Return today's date in YYYY-MM-DD (local timezone). */
export function resolveDate(override) {
  if (override) return override;
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Return 1–7 where 1=Mon ... 7=Sun (ISO weekday). */
export function isoWeekday(date = new Date()) {
  const d = date.getDay(); // 0=Sun..6=Sat
  return d === 0 ? 7 : d;
}

/** True if today (or the given date) is Sat/Sun. */
export function isWeekend(date = new Date()) {
  return isoWeekday(date) > 5;
}
