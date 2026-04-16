#!/usr/bin/env node

/**
 * L.C.G Task Runner CLI
 *
 * Unified entry point for all L.C.G automations.
 *
 * Usage:
 *   node scripts/run.js <task>       [options]
 *   node scripts/run.js list
 *
 * Examples:
 *   node scripts/run.js morning-triage
 *   node scripts/run.js morning-triage --date 2026-03-24
 *   node scripts/run.js meeting-brief --meeting-name "Contoso QBR" --customer Contoso
 *   node scripts/run.js milestone-review --force-weekend
 *   node scripts/run.js list
 *
 * Options:
 *   --date YYYY-MM-DD        Override target date
 *   --force-weekend          Run even on weekends
 *   --dry-run                Print what would happen without executing
 *   --meeting-name <name>    Meeting name (meeting-brief, meeting-followup)
 *   --customer <name>        Customer name (update-request, meeting-brief)
 *   --max-repair <n>         Override max repair attempts
 */

import { resolve, join } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { runTask } from "./lib/runner.js";

const TASKS_DIR = resolve(import.meta.dirname, "tasks");

// ── Parse CLI args ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const taskName = args[0];

function flag(name) {
  return args.includes(`--${name}`);
}

function param(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

// ── List mode ───────────────────────────────────────────────────────
if (taskName === "list" || !taskName) {
  const files = readdirSync(TASKS_DIR).filter((f) => f.endsWith(".js"));
  console.log("\nAvailable tasks:\n");

  const rows = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(join(TASKS_DIR, file)).href);
    const t = mod.default;
    const sched = t.schedule
      ? `${t.schedule.days.join(",")} @ ${t.schedule.time}`
      : "on-demand";
    rows.push({ name: t.name, schedule: sched });
  }

  // Align output
  const maxName = Math.max(...rows.map((r) => r.name.length));
  for (const r of rows) {
    console.log(`  ${r.name.padEnd(maxName + 2)} ${r.schedule}`);
  }
  console.log(`\nUsage: node scripts/run.js <task> [--date YYYY-MM-DD] [--force-weekend]\n`);
  process.exit(0);
}

// ── Load task ───────────────────────────────────────────────────────
const taskFile = join(TASKS_DIR, `${taskName}.js`);
if (!existsSync(taskFile)) {
  console.error(`Unknown task: ${taskName}`);
  console.error(`Run "node scripts/run.js list" to see available tasks.`);
  process.exit(1);
}

const { default: task } = await import(pathToFileURL(taskFile).href);

// ── Build overrides from CLI args ───────────────────────────────────
const overrides = {};
if (param("date")) overrides.date = param("date");
if (flag("force-weekend")) overrides.forceWeekend = true;
if (param("max-repair")) overrides.maxRepair = parseInt(param("max-repair"), 10);
if (param("meeting-name")) overrides.meeting_name = param("meeting-name");
if (param("customer")) overrides.customer = param("customer");
if (param("meeting-file-slug")) overrides.meeting_file_slug = param("meeting-file-slug");

// ── Dry run ─────────────────────────────────────────────────────────
if (flag("dry-run")) {
  process.env.DRY_RUN = "1";
  console.log(`[dry-run] Would run: ${task.name}`);
  console.log(`[dry-run] Date: ${overrides.date || "(today)"}`);
  console.log(`[dry-run] Prompt: ${task.prompt}`);
  if (task.schedule) {
    console.log(`[dry-run] Schedule: ${task.schedule.days.join(",")} @ ${task.schedule.time}`);
  }
  process.exit(0);
}

// ── Validate required inputs for on-demand tasks ────────────────────
if (task.name === "meeting-brief" || task.name === "meeting-followup") {
  if (!overrides.meeting_name && !process.env.MEETING_NAME) {
    console.error(`ERROR: --meeting-name is required for ${task.name}`);
    console.error(`Example: node scripts/run.js ${task.name} --meeting-name "Contoso QBR"`);
    process.exit(2);
  }
}

if (task.name === "update-request") {
  if (!overrides.customer && !process.env.CUSTOMER) {
    console.error(`ERROR: --customer is required for update-request`);
    console.error(`Example: node scripts/run.js update-request --customer Contoso`);
    process.exit(2);
  }
}

// ── Execute ─────────────────────────────────────────────────────────
// Tasks with customRun get routed differently
if (task.customRun) {
  const { createLogger } = await import("./lib/logger.js");
  const { resolveVaultPath, resolveDate } = await import("./lib/config.js");
  const date = overrides.date || resolveDate();
  const vaultDir = resolveVaultPath();
  const { log } = createLogger(task.name, vaultDir, date);
  const exitCode = await task.customRun({ date, vaultDir, log, overrides });
  process.exit(exitCode);
}

const exitCode = await runTask(task, overrides);
process.exit(exitCode);
