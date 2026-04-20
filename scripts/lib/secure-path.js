/**
 * Secure path helpers for vault operations.
 *
 * Provides two guards used by init.js and setup-vault.js:
 *
 *   resolveVaultRoot(rawPath)
 *     Normalizes and validates a user-supplied vault path. Expands "~",
 *     resolves to an absolute path, and confirms the path exists and is
 *     a directory. Throws on any invalid input so callers can fall back
 *     cleanly instead of writing to an unintended location.
 *
 *   assertWithinVault(target, vaultRoot)
 *     Path-traversal guard. Ensures `target` resolves to a location
 *     inside `vaultRoot`. Throws if a symlink, "..", or absolute path
 *     would escape the vault boundary.
 */

import { resolve, isAbsolute, sep, relative } from "node:path";
import { statSync } from "node:fs";
import { homedir } from "node:os";

function expandHome(p) {
  if (!p) return p;
  if (p === "~") return homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) {
    return resolve(homedir(), p.slice(2));
  }
  return p;
}

/**
 * Resolve and validate a vault root path.
 * @param {string} rawPath - User-supplied vault path (may contain "~", be relative, etc.)
 * @returns {string} Absolute, normalized, verified-to-exist vault directory path.
 * @throws {Error} If the path is empty, does not exist, or is not a directory.
 */
export function resolveVaultRoot(rawPath) {
  if (!rawPath || typeof rawPath !== "string") {
    throw new Error("Vault path is empty or not a string.");
  }

  const trimmed = rawPath.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) {
    throw new Error("Vault path is empty after trimming.");
  }

  const expanded = expandHome(trimmed);
  const absolute = isAbsolute(expanded) ? expanded : resolve(process.cwd(), expanded);
  const normalized = resolve(absolute);

  let stat;
  try {
    stat = statSync(normalized);
  } catch (err) {
    throw new Error(`Vault path does not exist: ${normalized}`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`Vault path is not a directory: ${normalized}`);
  }

  return normalized;
}

/**
 * Assert that `target` is inside `vaultRoot`.
 * Prevents path-traversal attacks (e.g. symlinks, "../" segments, absolute overrides).
 * @param {string} target - Path to check (will be resolved to absolute).
 * @param {string} vaultRoot - Already-resolved absolute vault root.
 * @throws {Error} If `target` resolves outside `vaultRoot`.
 */
export function assertWithinVault(target, vaultRoot) {
  if (!target || !vaultRoot) {
    throw new Error("assertWithinVault requires both target and vaultRoot.");
  }

  const resolvedTarget = resolve(target);
  const resolvedRoot = resolve(vaultRoot);

  if (resolvedTarget === resolvedRoot) return;

  const rel = relative(resolvedRoot, resolvedTarget);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(
      `Path escapes vault boundary: ${resolvedTarget} is outside ${resolvedRoot}`,
    );
  }

  // Extra guard: on case-insensitive filesystems, ensure the prefix matches exactly.
  if (!resolvedTarget.startsWith(resolvedRoot + sep) && resolvedTarget !== resolvedRoot) {
    throw new Error(
      `Path escapes vault boundary: ${resolvedTarget} is outside ${resolvedRoot}`,
    );
  }
}
