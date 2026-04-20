/**
 * prompt.js — load a prompt template and substitute {{variables}}.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_ROOT } from "./config.js";

export const PROMPTS_DIR = join(PROJECT_ROOT, ".github", "prompts");

/**
 * Load a prompt file and substitute variables. Variables can be:
 *   - literal strings: { TODAY: "2026-04-16" }
 *   - functions called with the full context: { manager_name: (ctx) => ctx.manager || "me" }
 *
 * Replaces every occurrence of {{key}} in the template.
 *
 * @param {string} relPath  Prompt filename (e.g. "triage-morning.prompt.md") or absolute path.
 * @param {Object} vars     Variables object.
 * @param {Object} [ctx]    Context passed to function-valued vars.
 */
export function loadPrompt(relPath, vars = {}, ctx = {}) {
  const file = relPath.startsWith("/") || /^[A-Za-z]:[\\/]/.test(relPath)
    ? relPath
    : join(PROMPTS_DIR, relPath);

  if (!existsSync(file)) {
    throw new Error(`Prompt not found: ${file}`);
  }
  let text = readFileSync(file, "utf-8");

  for (const [key, rawVal] of Object.entries(vars)) {
    const val = typeof rawVal === "function" ? rawVal(ctx) : rawVal;
    const replacement = String(val ?? "");
    text = text.split(`{{${key}}}`).join(replacement);
  }
  return text;
}
