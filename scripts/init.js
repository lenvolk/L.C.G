#!/usr/bin/env node

/**
 * Cross-platform environment initializer for mcaps-iq.
 *
 * Usage:
 *   node scripts/init.js          # verify prerequisites and guide local config
 *   node scripts/init.js --check  # verify environment without prompting
 *
 * Exit codes:
 *   0 — success
 *   1 — one or more steps failed
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

// ── repo root (scripts/ lives one level below) ──────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MCP_CONFIG_PATH = join(ROOT, ".vscode", "mcp.json");

// ── prerequisite checks ─────────────────────────────────────────────
const PREREQS = [
  { cmd: "node --version", label: "Node.js", minMajor: 18 },
  { cmd: "npm --version", label: "npm" },
];

// ── helpers ─────────────────────────────────────────────────────────
const isWindows = process.platform === "win32";

function tryRun(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

function heading(text) {
  const bar = "─".repeat(60);
  console.log(`\n${bar}\n  ${text}\n${bar}`);
}

function ok(msg) {
  console.log(`  ✔ ${msg}`);
}
function warn(msg) {
  console.log(`  ⚠ ${msg}`);
}
function fail(msg) {
  console.log(`  ✖ ${msg}`);
}

// ── prerequisite validation ─────────────────────────────────────────
function checkPrereqs() {
  heading("Checking prerequisites");
  let passed = true;

  for (const { cmd, label, minMajor } of PREREQS) {
    const version = tryRun(cmd);
    if (!version) {
      fail(`${label} not found — install it before continuing.`);
      passed = false;
      continue;
    }
    if (minMajor) {
      const major = parseInt(version.replace(/^v/, ""), 10);
      if (major < minMajor) {
        fail(`${label} ${version} found — need v${minMajor}+`);
        passed = false;
        continue;
      }
    }
    ok(`${label} ${version}`);
  }

  // Azure CLI — optional but recommended
  const azVersion = tryRun("az version --query '\"azure-cli\"' -o tsv");
  if (azVersion) {
    ok(`Azure CLI ${azVersion}`);

    // Check if the user is actually signed in
    const account = tryRun("az account show --query user.name -o tsv");
    if (account) {
      ok(`Signed in as ${account}`);
    } else {
      warn("Azure CLI installed but not signed in — run: az login");
    }
  } else {
    warn("Azure CLI not found — needed for CRM authentication.");
    warn("  Install: https://learn.microsoft.com/cli/azure/install-azure-cli");
  }

  return passed;
}

// ── GitHub Packages auth check ──────────────────────────────────────
function checkGitHubPackagesAuth() {
  heading("Checking GitHub Packages authentication");

  // Read user-level .npmrc to look for a GitHub Packages auth token
  const home = process.env.HOME || process.env.USERPROFILE;
  const userNpmrc = join(home, ".npmrc");

  if (!existsSync(userNpmrc)) {
    fail("No user-level .npmrc found — GitHub Packages auth is not configured.");
    printGitHubAuthHelp();
    return false;
  }

  const content = readFileSync(userNpmrc, "utf-8");

  // Check for an auth token for npm.pkg.github.com
  const hasToken =
    content.includes("//npm.pkg.github.com/:_authToken=") ||
    content.includes("//npm.pkg.github.com/:_auth=");

  if (!hasToken) {
    fail("GitHub Packages auth token not found in ~/.npmrc");
    printGitHubAuthHelp();
    return false;
  }

  // Verify the token actually works by probing a known package
  const probe = tryRun(
    "npm view @microsoft/msx-mcp-server version --registry=https://npm.pkg.github.com 2>&1"
  );
  if (probe && !probe.includes("ERR") && !probe.includes("401") && !probe.includes("404")) {
    ok("GitHub Packages auth token is valid.");
    return true;
  }

  // Token exists but might be expired or invalid
  warn("GitHub Packages auth token found but may be expired or invalid.");
  printGitHubAuthHelp();
  return false;
}

function printGitHubAuthHelp() {
  console.log(`
  MCP servers (@microsoft/msx-mcp-server, @jinlee794/obsidian-intelligence-layer)
  are published to GitHub Packages, which requires authentication.

  The project .npmrc already routes these scopes to the right registry.
  You just need a personal access token (PAT) in your user-level ~/.npmrc.

  ┌─────────────────────────────────────────────────────────────────┐
  │  Option A — Use the GitHub CLI (recommended):                   │
  │                                                                 │
  │    npm login --registry=https://npm.pkg.github.com              │
  │                                                                 │
  │  When prompted, use your GitHub username, and a personal        │
  │  access token (classic) with the  read:packages  scope          │
  │  as your password.                                              │
  │                                                                 │
  │  Option B — Add the token manually to ~/.npmrc:                 │
  │                                                                 │
  │    //npm.pkg.github.com/:_authToken=ghp_YOUR_TOKEN_HERE         │
  │                                                                 │
  │  Create a token at:                                             │
  │    https://github.com/settings/tokens                           │
  │    → Generate new token (classic)                               │
  │    → Select scope:  read:packages                               │
  └─────────────────────────────────────────────────────────────────┘
`);
}

function checkWorkspaceConfig() {
  heading("Checking workspace configuration");

  let passed = true;

  if (existsSync(MCP_CONFIG_PATH)) {
    ok("VS Code MCP config found (.vscode/mcp.json)");
  } else {
    fail("Missing .vscode/mcp.json");
    passed = false;
  }

  const envVars = parseEnvFile(join(ROOT, ".env"));
  if (envVars.OBSIDIAN_VAULT_PATH) {
    ok(`Vault path configured: ${envVars.OBSIDIAN_VAULT_PATH}`);
  } else {
    warn("OBSIDIAN_VAULT_PATH not set in .env — OIL tools will prompt or fail until configured.");
  }

  return passed;
}

// ── check-only mode ─────────────────────────────────────────────────
function checkOnly() {
  const prereqsOk = checkPrereqs();
  const ghAuthOk = checkGitHubPackagesAuth();
  const workspaceOk = checkWorkspaceConfig();

  if (prereqsOk && ghAuthOk && workspaceOk) {
    heading("Environment is ready ✔");
  } else {
    heading("Environment has issues — run `node scripts/init.js` to fix");
  }
  return prereqsOk && ghAuthOk && workspaceOk;
}

// ── .env configuration ──────────────────────────────────────────────
function parseEnvFile(filePath) {
  const vars = {};
  if (!existsSync(filePath)) return vars;
  const lines = readFileSync(filePath, "utf-8").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    vars[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return vars;
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

async function configureEnv() {
  const envPath = join(ROOT, ".env");
  const existing = parseEnvFile(envPath);

  if (existing.OBSIDIAN_VAULT_PATH) {
    ok(`Vault path already configured: ${existing.OBSIDIAN_VAULT_PATH}`);
    return;
  }

  // Skip prompt in non-interactive environments (CI, piped stdin)
  if (!process.stdin.isTTY) {
    warn("Non-interactive shell — skipping vault path prompt.");
    warn("Set OBSIDIAN_VAULT_PATH in .env manually for the OIL MCP server.");
    return;
  }

  heading("Obsidian Vault Configuration");
  console.log("  The OIL MCP server needs the path to your Obsidian vault.");
  console.log("  This is stored in .env (gitignored) — not committed.\n");

  const vaultPath = await ask("  Obsidian vault path (or press Enter to skip): ");

  if (!vaultPath) {
    warn("Skipped — OIL server won't start without a vault path.");
    warn("You can set it later:  echo 'OBSIDIAN_VAULT_PATH=/your/path' >> .env");
    return;
  }

  if (!existsSync(vaultPath)) {
    warn(`Path does not exist yet: ${vaultPath}`);
    warn("Saving anyway — make sure the vault is created before starting OIL.");
  }

  // Append to .env (preserve any other vars)
  const envLine = `OBSIDIAN_VAULT_PATH=${vaultPath}\n`;
  const content = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";
  writeFileSync(envPath, content + envLine, "utf-8");
  ok(`Saved to .env: OBSIDIAN_VAULT_PATH=${vaultPath}`);
}

// ── main ────────────────────────────────────────────────────────────
const checkMode = process.argv.includes("--check");

if (checkMode) {
  const ok = checkOnly();
  process.exit(ok ? 0 : 1);
} else {
  const prereqsOk = checkPrereqs();
  if (!prereqsOk) {
    console.log("\nFix prerequisite issues above, then re-run this script.");
    process.exit(1);
  }

  checkGitHubPackagesAuth();
  checkWorkspaceConfig();

  // ── risk acknowledgement ────────────────────────────────────────
  heading("⚠  Important — Please Read");
  console.log(`
  This toolkit uses agentic AI (GitHub Copilot + MCP servers) to read
  and write CRM records, query M365 data, and suggest strategic actions.

  AI models can produce incorrect, incomplete, or misleading outputs.
  YOU are responsible for reviewing and validating every action.

  By proceeding you acknowledge that:
    • All AI-generated outputs are drafts requiring human judgment.
    • Write operations require your explicit confirmation before executing.
    • You will not rely on AI outputs without independent verification.
`);

  if (process.stdin.isTTY) {
    const consent = await ask("  Type 'yes' to accept and continue installation: ");
    if (consent.toLowerCase() !== "yes") {
      console.log("\n  Setup cancelled. Re-run when you're ready.\n");
      process.exit(0);
    }
  } else {
    warn("Non-interactive shell — proceeding with installation.");
    warn("By using this toolkit you accept the risks described above.");
  }

  heading("All done ✔");

  // Check if already signed in to provide the right next step
  const account = tryRun("az account show --query user.name -o tsv");
  if (account) {
    console.log(`
  You're signed in as ${account}. Everything is ready!

  Next steps:
    1. Open this repo in VS Code:  code .
    2. VS Code will launch the configured MCP servers from .vscode/mcp.json
    3. Set your vault path:  echo "OBSIDIAN_VAULT_PATH=/your/path" >> .env
    4. Bootstrap your vault: npm run vault:init
    5. Open Copilot chat (Cmd+Shift+I) and try: "Who am I in MSX?"
`);
  } else {
    console.log(`
  Next steps:
    1. Connect to Microsoft VPN
    2. Sign in to Azure:        az login
    3. Open this repo in VS Code:  code .
    4. Set your vault path:  echo "OBSIDIAN_VAULT_PATH=/your/path" >> .env
    5. Bootstrap your vault: npm run vault:init
    6. Open Copilot chat (Cmd+Shift+I) and try: "Who am I in MSX?"
`);
  }
}
