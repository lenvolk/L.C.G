/**
 * secure-path.js — safe vault-root resolution and path containment.
 *
 * Used by vault-writing scripts (setup-vault.js, etc.) to guard against
 * path traversal when cp'ing files from the repo into the user's vault.
 */

import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { resolveVaultPath } from "./config.js";

/**
 * Resolve the vault root, normalised to an absolute path. Throws if the
 * vault is not configured or does not exist.
 */
export function resolveVaultRoot(override) {
  const root = override || resolveVaultPath();
  const abs = resolve(root);
  if (!existsSync(abs)) {
    throw new Error(`Vault root does not exist: ${abs}`);
  }
  return abs;
}

/**
 * Assert that `target` resolves to a path inside `root`. Throws otherwise.
 */
export function assertWithinVault(root, target) {
  const absRoot = resolve(root);
  const absTarget = resolve(target);
  const rel = absTarget.startsWith(absRoot + "/") || absTarget === absRoot ||
              (process.platform === "win32" && absTarget.toLowerCase().startsWith(absRoot.toLowerCase() + "\\"));
  if (!rel) {
    throw new Error(`Path escape detected: ${absTarget} is outside ${absRoot}`);
  }
  return absTarget;
}
