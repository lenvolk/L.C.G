/**
 * runner.js — generic task runner for all vault/CRM automation tasks.
 *
 * A task module exports a default object with this shape:
 *   {
 *     name: string,
 *     prompt: string,                    // prompt filename under .github/prompts/
 *     repairPrompt?: string | null,
 *     skipWeekends?: boolean,
 *     maxRepairAttempts?: number,
 *     variables?: Record<string, (ctx) => string>,
 *     artifactPath: (ctx) => string,
 *     validate?: ValidateSpec,
 *     schedule?: { days: string[], time: string } | null,
 *     beforeRun?: (ctx) => Promise<void> | void,
 *     onSuccess?: (ctx) => Promise<void> | void,
 *     customRun?: (ctx) => Promise<number>,   // bypasses the standard loop
 *   }
 */

import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLogger } from "./logger.js";
import { resolveVaultPath, resolveDate, PROJECT_ROOT, isWeekend } from "./config.js";
import { resolveCopilotBin, runCopilot } from "./copilot.js";
import { loadPrompt } from "./prompt.js";
import { validateArtifact } from "./validate.js";

/**
 * Resolve all variables for a task against the given context.
 * String-valued variables are passed through; function-valued ones are called.
 */
function resolveVariables(task, ctx) {
  const out = {};
  for (const [k, v] of Object.entries(task.variables || {})) {
    out[k] = typeof v === "function" ? v(ctx) : v;
  }
  return out;
}

/**
 * Execute a task. Returns the exit code.
 *
 * @param {Object} task       Task module default export.
 * @param {Object} [overrides] Optional overrides passed from the CLI.
 */
export async function runTask(task, overrides = {}) {
  const vaultDir = resolveVaultPath();
  const date = resolveDate(overrides.date);
  const baseCtx = {
    ...overrides,
    date,
    vaultDir,
    PROJECT_ROOT,
  };

  const { log, logFile } = createLogger(task.name, vaultDir, date);

  // Weekend guard
  if (task.skipWeekends && isWeekend() && !overrides.forceWeekend) {
    log(`${task.name}: weekend — skipping.`);
    return 0;
  }

  // Custom execution path
  if (typeof task.customRun === "function") {
    return await task.customRun({ ...baseCtx, log, logFile });
  }

  // beforeRun hook (e.g. vault-hygiene does archive + quarantine first)
  if (typeof task.beforeRun === "function") {
    await task.beforeRun({ ...baseCtx, log });
  }

  const variables = resolveVariables(task, baseCtx);
  const ctx = { ...baseCtx, ...variables };

  const bin = resolveCopilotBin();
  if (!bin) {
    log("ERROR: copilot CLI not found.");
    return 1;
  }

  const artifactPath = task.artifactPath(ctx);
  log(`Starting ${task.name} for ${date}`);
  log(`Vault: ${vaultDir}`);
  log(`Artifact: ${artifactPath}`);

  // Primary run
  let promptText;
  try {
    promptText = loadPrompt(task.prompt, variables, ctx);
  } catch (err) {
    log(`ERROR: ${err.message}`);
    return 1;
  }

  const primaryLog = join(tmpdir(), `${task.name}-${date}.log`);
  log(`Running copilot CLI (log: ${primaryLog})…`);
  const primaryCode = await runCopilot({
    bin,
    prompt: promptText,
    vaultDir,
    logPath: primaryLog,
    cwd: PROJECT_ROOT,
  });

  if (primaryCode !== 0) {
    log(`ERROR: copilot exited with code ${primaryCode}`);
    return primaryCode;
  }

  // Validate
  const maxRepair = Number.isFinite(overrides.maxRepair)
    ? overrides.maxRepair
    : task.maxRepairAttempts ?? 0;

  let ok = await runValidation(task, artifactPath, log);

  if (!ok && task.repairPrompt && maxRepair > 0) {
    for (let attempt = 1; attempt <= maxRepair && !ok; attempt++) {
      log(`Validation failed — starting repair attempt ${attempt}/${maxRepair}`);
      let repairText;
      try {
        repairText = loadPrompt(task.repairPrompt, variables, ctx);
      } catch (err) {
        log(`ERROR: ${err.message}`);
        break;
      }
      const repairLog = join(tmpdir(), `${task.name}-repair-${date}-${attempt}.log`);
      const rc = await runCopilot({
        bin,
        prompt: repairText,
        vaultDir,
        logPath: repairLog,
        cwd: PROJECT_ROOT,
      });
      if (rc !== 0) {
        log(`Repair attempt ${attempt} copilot exit code: ${rc}`);
      }
      ok = await runValidation(task, artifactPath, log);
      if (ok) log(`Repair succeeded on attempt ${attempt}.`);
    }
  }

  if (!ok) {
    log(`${task.name}: FAILED validation after repair attempts.`);
    return 2;
  }

  log(`${task.name}: PASS`);
  if (typeof task.onSuccess === "function") {
    try {
      await task.onSuccess({ ...ctx, log });
    } catch (err) {
      log(`onSuccess hook error: ${err.message}`);
    }
  }
  return 0;
}

async function runValidation(task, artifactPath, log) {
  if (!task.validate) return true;
  const result = validateArtifact(artifactPath, task.validate);
  if (result.ok) {
    log("Validation passed.");
    return true;
  }
  log(`Validation errors:`);
  for (const e of result.errors) log(`  - ${e}`);
  return false;
}
