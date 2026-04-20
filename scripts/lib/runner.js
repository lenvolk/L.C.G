#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createLogger } from "./logger.js";
import { loadDotenv, resolveDate, resolveVaultPath } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const PROMPTS_DIR = join(ROOT, ".github", "prompts");
const IS_WINDOWS = process.platform === "win32";

function isWeekend(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function buildPromptPath(name) {
  const p = join(PROMPTS_DIR, name);
  if (!existsSync(p)) {
    throw new Error(`Prompt file not found: ${p}`);
  }
  return p;
}

function renderTemplate(template, values) {
  return template.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = values[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

function resolveTaskVariables(task, context) {
  const vars = { ...context };
  const fns = task.variables || {};
  for (const [k, fn] of Object.entries(fns)) {
    if (typeof fn !== "function") continue;
    vars[k] = fn(vars);
  }
  return vars;
}

function getChecklistCount(content) {
  return (content.match(/^- \[[xX \-\/]\] /gm) || []).length;
}

function getAssumptionCount(content) {
  const idx = content.indexOf("Assumptions to validate:");
  if (idx === -1) return 0;
  const block = content.slice(idx);
  return (block.match(/^\s*- /gm) || []).length;
}

function validateOutput(content, rules = {}) {
  if (!rules) return { ok: true, issues: [] };

  const issues = [];

  for (const section of rules.requiredSections || []) {
    if (!content.includes(section)) {
      issues.push(`Missing section: ${section}`);
    }
  }

  for (const line of rules.requiredLines || []) {
    if (!content.includes(line)) {
      issues.push(`Missing line: ${line}`);
    }
  }

  for (const pattern of rules.requiredPatterns || []) {
    if (!pattern.test(content)) {
      issues.push(`Required pattern not found: ${pattern}`);
    }
  }

  for (const pattern of rules.forbiddenPatterns || []) {
    if (pattern.test(content)) {
      issues.push(`Forbidden pattern detected: ${pattern}`);
    }
  }

  if (rules.sectionCountPattern && !rules.sectionCountPattern.test(content)) {
    issues.push(`Section count line missing or malformed: ${rules.sectionCountPattern}`);
  }

  if (typeof rules.minChecklistItems === "number") {
    const count = getChecklistCount(content);
    if (count < rules.minChecklistItems) {
      issues.push(`Checklist items too low: ${count} < ${rules.minChecklistItems}`);
    }
  }

  if (typeof rules.assumptionCount === "number") {
    const count = getAssumptionCount(content);
    if (count < rules.assumptionCount) {
      issues.push(`Assumptions too low: ${count} < ${rules.assumptionCount}`);
    }
  }

  return { ok: issues.length === 0, issues };
}

function runCopilot(promptText) {
  const args = [
    "-p",
    promptText,
    "--allow-all-tools",
    "--silent",
    "--no-ask-user",
  ];

  const res = spawnSync("copilot", args, {
    cwd: ROOT,
    encoding: "utf-8",
    shell: IS_WINDOWS,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (res.error) {
    throw new Error(`Failed to run Copilot CLI: ${res.error.message}`);
  }
  if ((res.status ?? 1) !== 0) {
    const stderr = (res.stderr || "").trim();
    throw new Error(`Copilot CLI failed (${res.status}): ${stderr || "no stderr"}`);
  }

  const output = (res.stdout || "").trim();
  if (!output) {
    throw new Error("Copilot CLI returned empty output");
  }
  return output;
}

export async function runTask(task, overrides = {}) {
  loadDotenv();

  const date = resolveDate(overrides.date);
  const vaultDir = resolveVaultPath(overrides.vaultDir);
  mkdirSync(vaultDir, { recursive: true });

  const { log } = createLogger(task.name, vaultDir, date);

  if (task.skipWeekends && !overrides.forceWeekend && isWeekend(date)) {
    log(`Skipping ${task.name} on weekend (${date}).`);
    return 0;
  }

  if (typeof task.beforeRun === "function") {
    await task.beforeRun({ date, vaultDir, log, overrides, REPO_DIR: ROOT });
  }

  const context = {
    ...overrides,
    date,
    vaultDir,
    REPO_DIR: ROOT,
  };
  const vars = resolveTaskVariables(task, context);

  const artifactPath =
    typeof task.artifactPath === "function"
      ? task.artifactPath(vars)
      : null;

  const dryRun = process.env.DRY_RUN === "1";
  if (dryRun) {
    log(`[dry-run] Task: ${task.name}`);
    log(`[dry-run] Prompt: ${task.prompt}`);
    if (artifactPath) log(`[dry-run] Artifact: ${artifactPath}`);
    return 0;
  }

  const maxRepair = Number.isFinite(overrides.maxRepair)
    ? overrides.maxRepair
    : task.maxRepairAttempts ?? 0;

  let attempt = 0;
  let promptName = task.prompt;

  while (true) {
    const promptPath = buildPromptPath(promptName);
    const promptTemplate = readFileSync(promptPath, "utf-8");
    const promptText = renderTemplate(promptTemplate, vars);

    log(`Running task ${task.name} with prompt ${promptName} (attempt ${attempt + 1})`);
    const output = runCopilot(promptText);

    if (artifactPath) {
      mkdirSync(dirname(artifactPath), { recursive: true });
      writeFileSync(artifactPath, `${output.trimEnd()}\n`, "utf-8");
      log(`Wrote artifact: ${artifactPath}`);
    }

    if (!task.validate || !artifactPath) {
      if (typeof task.onSuccess === "function") {
        await task.onSuccess({ ...vars, date, vaultDir, log, REPO_DIR: ROOT });
      }
      return 0;
    }

    const content = readFileSync(artifactPath, "utf-8");
    const verdict = validateOutput(content, task.validate);
    if (verdict.ok) {
      log("Validation passed.");
      if (typeof task.onSuccess === "function") {
        await task.onSuccess({ ...vars, date, vaultDir, log, REPO_DIR: ROOT });
      }
      return 0;
    }

    log(`Validation failed: ${verdict.issues.join(" | ")}`);

    if (!task.repairPrompt || attempt >= maxRepair) {
      return 1;
    }

    attempt += 1;
    promptName = task.repairPrompt;
  }
}
