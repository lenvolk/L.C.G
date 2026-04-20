#!/usr/bin/env node
/**
 * mcaps — L.C.G unified CLI entry point.
 *
 * Thin wrapper that forwards to scripts/run.js so the same task runner
 * is reachable via `mcaps <task>` after `npm link`, or directly via
 * `node scripts/run.js <task>` from inside the repo.
 *
 * Examples:
 *   mcaps list
 *   mcaps morning-triage
 *   mcaps meeting-brief --customer Contoso
 */

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const RUNNER = resolve(ROOT, "scripts", "run.js");

const child = spawn(process.execPath, [RUNNER, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: ROOT,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
