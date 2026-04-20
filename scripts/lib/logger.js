/**
 * logger.js — shared timestamped logger that also appends to the vault's
 * daily agent log at <vault>/_agent-log/<date>.md.
 */

import { existsSync, mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function ts() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/**
 * Create a logger for a specific task/date. Returns { log, logFile }.
 *   log(msg)   — prints to stdout and appends to the vault's agent log.
 *
 * @param {string} taskName  Short label shown in the log line (e.g. "morning-triage").
 * @param {string} vaultDir  Vault root directory.
 * @param {string} date      YYYY-MM-DD.
 */
export function createLogger(taskName, vaultDir, date) {
  const logDir = join(vaultDir, "_agent-log");
  const logFile = join(logDir, `${date}.md`);

  mkdirSync(logDir, { recursive: true });
  if (!existsSync(logFile)) {
    writeFileSync(logFile, `# Agent Log - ${date}\n\n`, "utf-8");
  }

  function log(msg) {
    const line = `[${ts()}] ${msg}`;
    console.log(line);
    try {
      appendFileSync(logFile, `- [${ts()}] ${taskName}: ${msg}\n`, "utf-8");
    } catch {
      // best-effort; don't let logging errors abort the task
    }
  }

  return { log, logFile };
}
