#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  unlinkSync,
} from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";

function quarterForMonth(monthIndex) {
  return Math.floor(monthIndex / 3) + 1;
}

function archiveBucketFor(date) {
  const fy = String(date.getFullYear()).slice(-2);
  const q = quarterForMonth(date.getMonth());
  return `FY${fy}-Q${q}`;
}

function datedPrefixDate(fileName) {
  const m = fileName.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function prependArchiveFrontmatter(filePath, fromDirName) {
  const content = readFileSync(filePath, "utf-8");
  if (content.startsWith("---\n") || content.startsWith("---\r\n")) return;

  const stamped = [
    "---",
    "archived: true",
    `archived_from: ${fromDirName}`,
    `archived_at: ${new Date().toISOString()}`,
    "---",
    "",
    content,
  ].join("\n");

  writeFileSync(filePath, stamped, "utf-8");
}

export function archiveDatedNotes(notesDir, retentionDays = 30, { log = () => {} } = {}) {
  if (!existsSync(notesDir)) return { moved: 0 };

  const now = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  const vaultDir = dirname(notesDir);
  const sourceName = basename(notesDir);

  let moved = 0;
  for (const name of readdirSync(notesDir)) {
    const full = join(notesDir, name);
    if (extname(name).toLowerCase() !== ".md") continue;

    const d = datedPrefixDate(name);
    if (!d) continue;

    if (now - d.getTime() < maxAgeMs) continue;

    const bucket = archiveBucketFor(d);
    const archiveDir = join(vaultDir, "Archive", bucket);
    mkdirSync(archiveDir, { recursive: true });

    const dst = join(archiveDir, name);
    try {
      renameSync(full, dst);
    } catch {
      // Cross-device or lock fallback.
      copyFileSync(full, dst);
      unlinkSync(full);
    }

    prependArchiveFrontmatter(dst, sourceName);
    moved += 1;
    log(`Archived ${sourceName}/${name} -> Archive/${bucket}/${name}`);
  }

  return { moved };
}

function walkFiles(root, out) {
  if (!existsSync(root)) return;
  for (const name of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, name.name);
    if (name.isDirectory()) {
      walkFiles(full, out);
    } else if (name.isFile()) {
      out.push(full);
    }
  }
}

export function quarantineConfigDir(vaultDir, { configSubdir = "_lcg", log = () => {} } = {}) {
  const configDir = join(vaultDir, configSubdir);
  if (!existsSync(configDir)) return { quarantined: 0 };

  const files = [];
  walkFiles(configDir, files);

  const trashDir = join(vaultDir, ".trash", configSubdir);
  mkdirSync(trashDir, { recursive: true });

  let quarantined = 0;
  for (const full of files) {
    const ext = extname(full).toLowerCase();
    if (ext === ".md" || ext === ".html") continue;

    const rel = relative(configDir, full);
    const dst = join(trashDir, rel);
    mkdirSync(dirname(dst), { recursive: true });

    try {
      renameSync(full, dst);
    } catch {
      copyFileSync(full, dst);
      unlinkSync(full);
    }

    quarantined += 1;
    log(`Quarantined ${configSubdir}/${rel} -> .trash/${configSubdir}/${rel}`);
  }

  return { quarantined };
}
