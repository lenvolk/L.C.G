/**
 * copilot.js — resolve and invoke the GitHub Copilot CLI.
 *
 * The binary is either:
 *   1. `copilot` on PATH,
 *   2. $COPILOT_CLI_PATH if set,
 *   3. the VS Code / VS Code Insiders bundled binary.
 */

import { spawnSync, spawn } from "node:child_process";
import { existsSync, createWriteStream } from "node:fs";
import { join } from "node:path";
import { platform, homedir } from "node:os";

const isWin = platform() === "win32";

function onPath(cmd) {
  const which = spawnSync(isWin ? "where" : "which", [cmd], { stdio: "ignore" });
  return which.status === 0;
}

/** Return a runnable path to the copilot CLI or null if not found. */
export function resolveCopilotBin() {
  if (process.env.COPILOT_CLI_PATH && existsSync(process.env.COPILOT_CLI_PATH)) {
    return process.env.COPILOT_CLI_PATH;
  }
  if (onPath("copilot")) return "copilot";

  const home = homedir();
  const candidates = isWin
    ? [
        join(process.env.APPDATA || "", "Code", "User", "globalStorage", "github.copilot-chat", "copilotCli", "copilot.exe"),
        join(process.env.APPDATA || "", "Code - Insiders", "User", "globalStorage", "github.copilot-chat", "copilotCli", "copilot.exe"),
      ]
    : [
        join(home, "Library", "Application Support", "Code", "User", "globalStorage", "github.copilot-chat", "copilotCli", "copilot"),
        join(home, "Library", "Application Support", "Code - Insiders", "User", "globalStorage", "github.copilot-chat", "copilotCli", "copilot"),
        join(home, ".config", "Code", "User", "globalStorage", "github.copilot-chat", "copilotCli", "copilot"),
        join(home, ".config", "Code - Insiders", "User", "globalStorage", "github.copilot-chat", "copilotCli", "copilot"),
      ];

  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

/**
 * Run copilot non-interactively. Streams output to stdout and the given log
 * file (tee-style). Returns the exit code.
 *
 * @param {Object} opts
 * @param {string} opts.bin          Path to the copilot binary.
 * @param {string} opts.prompt       The fully rendered prompt text.
 * @param {string} opts.vaultDir     Vault dir to add with --add-dir.
 * @param {string} [opts.logPath]    Optional file path to tee output into.
 * @param {string} [opts.cwd]        Working directory for the child process.
 */
export function runCopilot({ bin, prompt, vaultDir, logPath, cwd }) {
  return new Promise((res, rej) => {
    if (!bin) return rej(new Error("copilot CLI not found"));

    const args = [
      "-p",
      prompt,
      "--allow-all-tools",
      "--allow-all-paths",
      "--add-dir",
      vaultDir,
      "--output-format",
      "text",
    ];

    const logStream = logPath ? createWriteStream(logPath) : null;
    const child = spawn(bin, args, {
      cwd,
      env: { ...process.env, OBSIDIAN_VAULT_PATH: vaultDir },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const tee = (chunk) => {
      process.stdout.write(chunk);
      if (logStream) logStream.write(chunk);
    };
    child.stdout.on("data", tee);
    child.stderr.on("data", tee);

    child.on("close", (code) => {
      if (logStream) logStream.end();
      res(code ?? 0);
    });
    child.on("error", (err) => {
      if (logStream) logStream.end();
      rej(err);
    });
  });
}
