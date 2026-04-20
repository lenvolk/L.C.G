#!/usr/bin/env node

/**
 * setup-vault.js — Scaffold an Obsidian vault for OIL and sync .github/ → sidekick/.
 *
 * Two jobs:
 *   1. **Scaffold**: Create the base OIL folder structure if missing
 *   2. **Sync**: Copy repo .github/{agents,instructions,skills,prompts} → vault/sidekick/
 *
 * The sync is additive — it copies repo artifacts into sidekick/ but never
 * deletes local-only files the user created there. Files from the repo
 * overwrite their counterparts in sidekick/ (repo is source-of-truth for
 * shared artifacts; local overrides live alongside them).
 *
 * Usage:
 *   node scripts/setup-vault.js                  # scaffold + sync (auto-detects vault)
 *   node scripts/setup-vault.js /path/to/vault   # explicit vault path
 *   node scripts/setup-vault.js --sync-only       # skip scaffold, just sync sidekick
 *   node scripts/setup-vault.js --scaffold-only   # skip sync, just create folders
 *   node scripts/setup-vault.js --check            # dry-run: show what would be created/synced
 *
 * Also importable:
 *   import { scaffoldVault, syncSidekick } from './setup-vault.js';
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  copyFileSync,
} from "node:fs";
import { resolve, join, dirname, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveVaultRoot, assertWithinVault } from "./lib/secure-path.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function ok(msg) { console.log(`  ✔ ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }
function info(msg) { console.log(`  → ${msg}`); }

// ── OIL vault base folders ──────────────────────────────────────────

const VAULT_FOLDERS = [
  "Customers",
  "People",
  "Meetings",
  "Daily",
  "Weekly",
  "Projects",
  "Inbox",
  "Resources",
  "Tags",
  "Dashboard",
  "_lcg",
  "_lcg/templates",
  "_agent-log",
  ".connect/hooks",
  "sidekick",
  "sidekick/agents",
  "sidekick/instructions",
  "sidekick/skills",
  "sidekick/prompts",
  "sidekick/tools",
  "sidekick/triggers",
];

// ── Sidekick sync sources (.github/ → sidekick/) ───────────────────

const SYNC_MAP = [
  { src: ".github/agents",      dest: "sidekick/agents" },
  { src: ".github/instructions", dest: "sidekick/instructions" },
  { src: ".github/skills",      dest: "sidekick/skills" },
  { src: ".github/prompts",     dest: "sidekick/prompts" },
];

// _lcg/ and Dashboard/ are authoritative from vault-starter — sync with overwrite
const STARTER_SYNC_MAP = [
  { src: "vault-starter/_lcg",      dest: "_lcg" },
  { src: "vault-starter/Dashboard",  dest: "Dashboard" },
];

const STARTER_DIR = join(ROOT, "vault-starter");

// ── Helpers ─────────────────────────────────────────────────────────

function resolveVaultPath(explicit) {
  if (explicit) return explicit;
  // Try live env vars
  if (process.env.OBSIDIAN_VAULT) return process.env.OBSIDIAN_VAULT;
  if (process.env.OBSIDIAN_VAULT_PATH) return process.env.OBSIDIAN_VAULT_PATH;
  // Try .env file
  const envPath = join(ROOT, ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(/^OBSIDIAN_VAULT_PATH\s*=\s*(.+)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }
  // Fall back to local .vault/ directory if it exists
  const localVault = join(ROOT, ".vault");
  if (existsSync(localVault)) return localVault;
  return null;
}

/**
 * Recursively collect all files under `dir`, returning paths relative to `dir`.
 */
function walkFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // Skip hidden dirs like .DS_Store, .space, .git
    if (entry.name.startsWith(".")) continue;

    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const child of walkFiles(full)) {
        results.push(join(entry.name, child));
      }
    } else {
      results.push(entry.name);
    }
  }
  return results;
}

// ── Scaffold ────────────────────────────────────────────────────────

/**
 * Create the base OIL folder structure in the vault.
 * @param {string} vaultPath
 * @param {{ dryRun?: boolean }} opts
 * @returns {{ created: string[], existed: string[] }}
 */
export function scaffoldVault(vaultPath, opts = {}) {
  const vaultRoot = resolveVaultRoot(vaultPath);
  const created = [];
  const existed = [];

  for (const folder of VAULT_FOLDERS) {
    const target = join(vaultRoot, folder);
    assertWithinVault(vaultRoot, target);
    if (existsSync(target)) {
      existed.push(folder);
    } else {
      if (!opts.dryRun) {
        mkdirSync(target, { recursive: true });
      }
      created.push(folder);
    }
  }

  return { created, existed };
}

// ── _lcg/ integrity check ──────────────────────────────────────────

const ALLOWED_CONFIG_EXTENSIONS = new Set(["md", "html"]);

/**
 * Scan _lcg/ for files that don't belong (anything other than .md / .html).
 * Returns a list of unauthorized file paths (relative to vault root).
 */
export function checkConfigIntegrity(vaultPath) {
  const vaultRoot = resolveVaultRoot(vaultPath);
  const configDir = join(vaultRoot, "_lcg");
  if (!existsSync(configDir)) return [];

  const unauthorized = [];
  for (const relFile of walkFiles(configDir)) {
    const ext = relFile.split(".").pop().toLowerCase();
    if (!ALLOWED_CONFIG_EXTENSIONS.has(ext)) {
      unauthorized.push(join("_lcg", relFile));
    }
  }
  return unauthorized;
}

// ── Seed vault-starter/ ─────────────────────────────────────────────

/**
 * Copy vault-starter/ contents into the vault. Seeds individual files
 * that are missing — existing files are never overwritten to preserve
 * user customizations.
 *
 * @param {string} vaultPath
 * @param {{ dryRun?: boolean }} opts
 * @returns {{ seeded: string[], skipped: string[] }}
 */
export function seedStarter(vaultPath, opts = {}) {
  const vaultRoot = resolveVaultRoot(vaultPath);
  const seeded = [];
  const skipped = [];

  if (!existsSync(STARTER_DIR)) {
    skipped.push("vault-starter/ (source missing)");
    return { seeded, skipped };
  }

  for (const entry of readdirSync(STARTER_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;

    if (entry.isDirectory()) {
      const srcDir = join(STARTER_DIR, entry.name);
      const destDir = join(vaultRoot, entry.name);
      assertWithinVault(vaultRoot, destDir);

      const files = walkFiles(srcDir);

      for (const relFile of files) {
        const destFile = join(destDir, relFile);
        if (existsSync(destFile)) {
          skipped.push(join(entry.name, relFile));
          continue;
        }
        const srcFile = join(srcDir, relFile);
        if (!opts.dryRun) {
          mkdirSync(dirname(destFile), { recursive: true });
          copyFileSync(srcFile, destFile);
        }
        seeded.push(join(entry.name, relFile));
      }

      // Ensure the directory itself exists even if empty
      if (files.length === 0 && !existsSync(destDir)) {
        if (!opts.dryRun) mkdirSync(destDir, { recursive: true });
        seeded.push(`${entry.name}/`);
      }
    }
  }

  return { seeded, skipped };
}

// ── Sync ────────────────────────────────────────────────────────────

/**
 * Sync repo .github/ artifacts into vault/sidekick/.
 * Overwrites matching files; leaves local-only files untouched.
 *
 * @param {string} vaultPath
 * @param {{ dryRun?: boolean }} opts
 * @returns {{ copied: string[], skipped: string[], unchanged: string[] }}
 */
export function syncSidekick(vaultPath, opts = {}) {
  const vaultRoot = resolveVaultRoot(vaultPath);
  const copied = [];
  const skipped = [];
  const unchanged = [];

  for (const { src, dest } of SYNC_MAP) {
    const srcDir = join(ROOT, src);
    const destDir = join(vaultRoot, dest);
    assertWithinVault(vaultRoot, destDir);

    if (!existsSync(srcDir)) {
      skipped.push(`${src} (source missing)`);
      continue;
    }

    const files = walkFiles(srcDir);

    for (const relFile of files) {
      const srcFile = join(srcDir, relFile);
      const destFile = join(destDir, relFile);

      // Check if destination already has identical content
      if (existsSync(destFile)) {
        try {
          const srcContent = readFileSync(srcFile);
          const destContent = readFileSync(destFile);
          if (srcContent.equals(destContent)) {
            unchanged.push(join(dest, relFile));
            continue;
          }
        } catch {
          // If comparison fails, fall through to copy
        }
      }

      if (!opts.dryRun) {
        mkdirSync(dirname(destFile), { recursive: true });
        copyFileSync(srcFile, destFile);
      }
      copied.push(join(dest, relFile));
    }
  }

  return { copied, skipped, unchanged };
}

// ── Sync starter configs (_lcg/, Dashboard/) ───────────────────────

/**
 * Sync vault-starter config dirs (_lcg/, Dashboard/) into the vault.
 * Overwrites matching files (repo is source-of-truth); leaves local-only
 * files untouched.
 *
 * @param {string} vaultPath
 * @param {{ dryRun?: boolean }} opts
 * @returns {{ copied: string[], skipped: string[], unchanged: string[] }}
 */
export function syncStarterConfigs(vaultPath, opts = {}) {
  const vaultRoot = resolveVaultRoot(vaultPath);
  const copied = [];
  const skipped = [];
  const unchanged = [];

  for (const { src, dest } of STARTER_SYNC_MAP) {
    const srcDir = join(ROOT, src);
    const destDir = join(vaultRoot, dest);
    assertWithinVault(vaultRoot, destDir);

    if (!existsSync(srcDir)) {
      skipped.push(`${src} (source missing)`);
      continue;
    }

    const files = walkFiles(srcDir);

    for (const relFile of files) {
      const srcFile = join(srcDir, relFile);
      const destFile = join(destDir, relFile);

      if (existsSync(destFile)) {
        try {
          const srcContent = readFileSync(srcFile);
          const destContent = readFileSync(destFile);
          if (srcContent.equals(destContent)) {
            unchanged.push(join(dest, relFile));
            continue;
          }
        } catch {
          // If comparison fails, fall through to copy
        }
      }

      if (!opts.dryRun) {
        mkdirSync(dirname(destFile), { recursive: true });
        copyFileSync(srcFile, destFile);
      }
      copied.push(join(dest, relFile));
    }
  }

  return { copied, skipped, unchanged };
}

// ── CLI entry point ─────────────────────────────────────────────────
const isCLI =
  process.argv[1] &&
  resolve(process.argv[1]).replace(/\.js$/, "") ===
    resolve(__dirname, "setup-vault").replace(/\.js$/, "");

if (isCLI) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--check");
  const syncOnly = args.includes("--sync-only");
  const scaffoldOnly = args.includes("--scaffold-only");

  const explicit = args.find((a) => !a.startsWith("--"));
  const rawVaultPath = resolveVaultPath(explicit);

  if (!rawVaultPath) {
    console.log("\n  No vault path found. Set OBSIDIAN_VAULT in your environment,");
    console.log("  or pass it explicitly: node scripts/setup-vault.js /path/to/vault\n");
    process.exit(1);
  }

  let vaultPath;
  try {
    vaultPath = resolveVaultRoot(rawVaultPath);
  } catch (err) {
    warn(`Vault path rejected: ${err.message}`);
    warn("Ensure the path exists and is a valid directory.\n");
    process.exit(1);
  }

  const modeLabel = dryRun ? " (dry run)" : "";

  // ── Scaffold ────────────────────────────────────────────────────
  if (!syncOnly) {
    console.log(`\n  Vault scaffold${modeLabel}: ${vaultPath}\n`);
    const { created, existed } = scaffoldVault(vaultPath, { dryRun });

    for (const f of existed) ok(`${f}/`);
    for (const f of created) info(`${dryRun ? "would create" : "created"} ${f}/`);

    if (created.length === 0) {
      ok("All base folders already exist.");
    } else {
      ok(`${dryRun ? "Would create" : "Created"} ${created.length} folder(s).`);
    }
  }

  // ── Seed vault-starter ──────────────────────────────────────────
  if (!syncOnly) {
    console.log(`\n  Vault starter seed${modeLabel}: vault-starter/ → ${vaultPath}\n`);
    const { seeded, skipped: seedSkipped } = seedStarter(vaultPath, { dryRun });

    if (seeded.length > 0) {
      for (const f of seeded) info(`${dryRun ? "would seed" : "seeded"} ${f}`);
      ok(`${dryRun ? "Would seed" : "Seeded"} ${seeded.length} file(s) from vault-starter.`);
    } else {
      ok("All starter files already exist — nothing to seed.");
    }

    if (seedSkipped.length > 0) {
      ok(`${seedSkipped.length} starter file(s) already present.`);
    }
  }

  // ── Sync ────────────────────────────────────────────────────────
  if (!scaffoldOnly) {
    console.log(`\n  Sidekick sync${modeLabel}: .github/ → ${vaultPath}/sidekick/\n`);
    const { copied, skipped, unchanged } = syncSidekick(vaultPath, { dryRun });

    for (const f of skipped) warn(f);

    if (copied.length > 0) {
      for (const f of copied) info(`${dryRun ? "would copy" : "synced"} ${f}`);
      ok(`${dryRun ? "Would sync" : "Synced"} ${copied.length} file(s).`);
    } else {
      ok("Sidekick is up to date — no files changed.");
    }

    if (unchanged.length > 0) {
      ok(`${unchanged.length} file(s) already identical.`);
    }
  }

  // ── Sync _lcg/ and Dashboard/ ─────────────────────────────────
  if (!scaffoldOnly) {
    console.log(`\n  Config sync${modeLabel}: vault-starter/ → ${vaultPath}\n`);
    const { copied: cfgCopied, skipped: cfgSkipped, unchanged: cfgUnchanged } =
      syncStarterConfigs(vaultPath, { dryRun });

    for (const f of cfgSkipped) warn(f);

    if (cfgCopied.length > 0) {
      for (const f of cfgCopied) info(`${dryRun ? "would copy" : "synced"} ${f}`);
      ok(`${dryRun ? "Would sync" : "Synced"} ${cfgCopied.length} config file(s).`);
    } else {
      ok("_lcg/ and Dashboard/ configs are up to date — no files changed.");
    }

    if (cfgUnchanged.length > 0) {
      ok(`${cfgUnchanged.length} config file(s) already identical.`);
    }
  }

  // ── _lcg/ integrity check ──────────────────────────────────────
  const unauthorized = checkConfigIntegrity(vaultPath);
  if (unauthorized.length > 0) {
    console.log(`\n  ⚠ Unauthorized files in _lcg/ (only .md and .html allowed):\n`);
    for (const f of unauthorized) warn(f);
    console.log(`\n  Run 'npm run vault:hygiene' to quarantine them.\n`);
  }

  console.log();
  process.exit(0);
}
