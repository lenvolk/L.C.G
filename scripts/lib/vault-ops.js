/**
 * vault-ops.js — deterministic vault file operations used by tasks
 * before invoking the copilot CLI.
 *
 * Includes:
 *   - archiveDatedNotes  : moves date-named notes older than N days into
 *                          fiscal-quarter archive dirs and tags their frontmatter.
 *   - quarantineConfigDir: moves unauthorised files out of the <vault>/_lcg/
 *                          config zone and into <vault>/.trash/.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  renameSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join } from "node:path";

/** Microsoft fiscal year (Jul–Jun). Returns "FY26-Q3" style string. */
export function fiscalQuarter(date) {
  const m = date.getMonth() + 1; // 1-12
  const y = date.getFullYear();
  const fy = m >= 7 ? y + 1 : y;
  let fq;
  if (m >= 7 && m <= 9) fq = 1;
  else if (m >= 10 && m <= 12) fq = 2;
  else if (m >= 1 && m <= 3) fq = 3;
  else fq = 4;
  return `FY${String(fy).slice(2)}-Q${fq}`;
}

/** Add `archived: true` and `archive_quarter: <fq>` to YAML frontmatter. */
function tagArchived(filePath, fq) {
  let content = readFileSync(filePath, "utf-8");
  if (content.startsWith("---")) {
    if (!/^archived:/m.test(content)) {
      content = content.replace(/^---\r?\n/, `---\narchived: true\n`);
    }
    if (!/^archive_quarter:/m.test(content)) {
      content = content.replace(/^archived: true\r?\n/m, `archived: true\narchive_quarter: ${fq}\n`);
    }
  } else {
    content = `---\narchived: true\narchive_quarter: ${fq}\n---\n${content}`;
  }
  writeFileSync(filePath, content, "utf-8");
}

/**
 * Move *.md files in `baseDir` (and its immediate subdirs) that are older
 * than `ageDays` (based on YYYY-MM-DD in filename) into baseDir/Archive/<fq>/.
 * Immediate subdirs preserve their name under the archive folder.
 *
 * Returns the count of archived files.
 */
export function archiveDatedNotes(baseDir, ageDays = 30, { log = () => {} } = {}) {
  if (!existsSync(baseDir)) {
    log(`archive: ${baseDir} not found — skipping`);
    return 0;
  }
  const today = new Date();
  let moved = 0;

  function processDir(searchDir, relPrefix) {
    for (const name of readdirSync(searchDir)) {
      const full = join(searchDir, name);
      if (!statSync(full).isFile() || !name.endsWith(".md")) continue;

      const m = name.match(/(\d{4}-\d{2}-\d{2})/);
      if (!m) continue;
      const fileDate = new Date(`${m[1]}T00:00:00`);
      if (Number.isNaN(fileDate.getTime())) continue;

      const age = Math.floor((today - fileDate) / (1000 * 60 * 60 * 24));
      if (age <= ageDays) continue;

      const fq = fiscalQuarter(fileDate);
      const archivePath = relPrefix
        ? join(baseDir, "Archive", fq, relPrefix)
        : join(baseDir, "Archive", fq);
      mkdirSync(archivePath, { recursive: true });
      const dest = join(archivePath, name);
      renameSync(full, dest);
      tagArchived(dest, fq);
      moved++;
      log(`  archived: ${relPrefix}${name} → Archive/${fq}/${relPrefix}`);
    }
  }

  log(`Archiving notes older than ${ageDays} days in ${basename(baseDir)}/…`);
  processDir(baseDir, "");
  for (const sub of readdirSync(baseDir)) {
    const subFull = join(baseDir, sub);
    if (!statSync(subFull).isDirectory()) continue;
    if (sub === "Archive" || sub.startsWith(".")) continue;
    processDir(subFull, `${sub}/`);
  }
  log(`archive: ${moved} file(s) moved.`);
  return moved;
}

/**
 * Quarantine files whose extensions are not in `allowedExts` out of
 * `<vaultDir>/<configSubdir>/` (default `_lcg/`) into
 * `<vaultDir>/.trash/<configSubdir>-quarantine-YYYYMMDD/`.
 *
 * Returns the count of quarantined files.
 */
export function quarantineConfigDir(
  vaultDir,
  { configSubdir = "_lcg", allowedExts = [".md", ".html"], maxDepth = 2, log = () => {} } = {}
) {
  const configDir = join(vaultDir, configSubdir);
  if (!existsSync(configDir)) return 0;

  const trashDir = join(
    vaultDir,
    ".trash",
    `${configSubdir}-quarantine-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`
  );

  let count = 0;
  function walk(dir, depth) {
    if (depth > maxDepth) return;
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const s = statSync(full);
      if (s.isDirectory()) {
        walk(full, depth + 1);
      } else if (s.isFile()) {
        const ext = extname(name).toLowerCase();
        if (allowedExts.includes(ext)) continue;
        if (count === 0) {
          mkdirSync(trashDir, { recursive: true });
          log(`⚠ Unauthorized files detected in ${configSubdir}/ — quarantining to .trash/`);
        }
        renameSync(full, join(trashDir, name));
        count++;
        log(`  quarantined: ${name}`);
      }
    }
  }
  walk(configDir, 0);
  if (count > 0) {
    log(`⚠ Quarantined ${count} unauthorized file(s) from ${configSubdir}/`);
    log(`  review: ${trashDir}`);
  }
  return count;
}
