#!/usr/bin/env node

import { spawn, execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const DEFAULT_CONFIG = join(ROOT, "evals", "model-matrix.config.json");
const RESULTS_DIR = join(ROOT, "evals", "results");
const HISTORY_DIR = join(RESULTS_DIR, "history");
const DEFAULT_OUTPUT = join(RESULTS_DIR, "latest.json");
const DEFAULT_REPORT = join(RESULTS_DIR, "latest-model-matrix.md");
const WRAPPER_PATH = join(ROOT, "scripts", "copilot-model-wrapper.sh");

function parseArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG,
    includeAnthropic: false,
    lane: "non-anthropic",
    models: null,
    iterations: null,
    timeoutSec: null,
    output: DEFAULT_OUTPUT,
    report: DEFAULT_REPORT,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--config" && argv[i + 1]) args.config = argv[++i];
    else if (arg === "--include-anthropic") args.includeAnthropic = true;
    else if (arg === "--lane" && argv[i + 1]) args.lane = argv[++i];
    else if (arg === "--models" && argv[i + 1]) args.models = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg === "--iterations" && argv[i + 1]) args.iterations = Number(argv[++i]);
    else if (arg === "--timeout-sec" && argv[i + 1]) args.timeoutSec = Number(argv[++i]);
    else if (arg === "--output" && argv[i + 1]) args.output = argv[++i];
    else if (arg === "--report" && argv[i + 1]) args.report = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help") {
      console.log(`Usage:\n  node scripts/eval-model-matrix.js [options]\n\nOptions:\n  --config <path>            Config file (default: evals/model-matrix.config.json)\n  --lane <name>              non-anthropic | anthropic | all (default: non-anthropic)\n  --include-anthropic        Add anthropic pool to selected lane\n  --models <csv>             Explicit model list override\n  --iterations <n>           Repeat each scenario/model n times\n  --timeout-sec <n>          Global timeout override (seconds)\n  --output <path>            JSON output path (default: evals/results/latest.json)\n  --report <path>            Markdown report path (default: evals/results/latest-model-matrix.md)\n  --dry-run                  Execute plan without writing output files\n`);
      process.exit(0);
    }
  }

  return args;
}

function loadConfig(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function uniq(list) {
  return [...new Set(list)];
}

function pickModels(cfg, args) {
  if (args.models && args.models.length > 0) return args.models;

  const nonAnthropic = cfg.modelPools?.nonAnthropic ?? [];
  const anthropic = cfg.modelPools?.anthropic ?? [];

  let selected = [];
  if (args.lane === "non-anthropic") selected = [...nonAnthropic];
  else if (args.lane === "anthropic") selected = [...anthropic];
  else if (args.lane === "all") selected = [...nonAnthropic, ...anthropic];
  else throw new Error(`Unknown lane: ${args.lane}`);

  if (args.includeAnthropic && args.lane !== "anthropic") {
    selected.push(...anthropic);
  }

  return uniq(selected);
}

function getGitMeta() {
  const out = { branch: "unknown", commit: "unknown" };
  try {
    out.branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT }).toString().trim();
  } catch {}
  try {
    out.commit = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
  } catch {}
  return out;
}

function resolveTemplate(str, env) {
  return str.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => env[key] ?? "");
}

function applyPromptVars(text, vars) {
  let out = text;
  for (const [key, value] of Object.entries(vars || {})) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    out = out.replace(pattern, String(value));
  }
  return out;
}

function runProcess({ command, args, env, cwd, timeoutMs }) {
  return new Promise((resolveRun) => {
    const start = Date.now();
    const child = spawn(command, args, { env, cwd, shell: false });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timer);
      resolveRun({
        code: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - start,
        timedOut,
      });
    });
  });
}

async function runScenario({ scenario, model, cfgTimeoutSec, baseEnv, dryRun }) {
  const timeoutSec = scenario.timeoutSec ?? cfgTimeoutSec;
  const timeoutMs = Math.max(1, timeoutSec) * 1000;

  const missing = (scenario.requiresEnv || []).filter((k) => !baseEnv[k]);
  if (missing.length > 0) {
    return {
      status: "skipped",
      reason: `Missing env: ${missing.join(", ")}`,
      durationMs: 0,
      pass: null,
    };
  }

  const scenarioEnv = {};
  for (const [key, value] of Object.entries(scenario.env || {})) {
    scenarioEnv[key] = resolveTemplate(String(value), baseEnv);
  }

  const env = {
    ...baseEnv,
    ...scenarioEnv,
    LCG_EVAL_MODEL: model,
  };

  let proc;

  if (scenario.type === "command") {
    if (dryRun) {
      return {
        status: "skipped",
        reason: `dry-run command: ${scenario.command}`,
        durationMs: 0,
        pass: null,
      };
    }

    proc = await runProcess({
      command: "zsh",
      args: ["-lc", scenario.command],
      env,
      cwd: ROOT,
      timeoutMs,
    });
  } else if (scenario.type === "prompt") {
    const promptPath = join(ROOT, scenario.promptFile);
    let promptText = readFileSync(promptPath, "utf-8");
    promptText = applyPromptVars(promptText, scenario.variables || {});

    if (dryRun) {
      return {
        status: "skipped",
        reason: `dry-run prompt: ${scenario.promptFile}`,
        durationMs: 0,
        pass: null,
      };
    }

    const cliArgs = [
      "-p", promptText,
      "--allow-all-tools",
      "--allow-all-paths",
      "--add-dir", ROOT,
      "--output-format", "text",
    ];

    if (env.OBSIDIAN_VAULT_PATH) {
      cliArgs.push("--add-dir", env.OBSIDIAN_VAULT_PATH);
    }

    proc = await runProcess({
      command: WRAPPER_PATH,
      args: cliArgs,
      env,
      cwd: ROOT,
      timeoutMs,
    });
  } else {
    return {
      status: "skipped",
      reason: `Unsupported scenario type: ${scenario.type}`,
      durationMs: 0,
      pass: null,
    };
  }

  const combined = `${proc.stdout}\n${proc.stderr}`;
  let pass = proc.code === 0 && !proc.timedOut;

  if (pass && scenario.successRegex) {
    pass = new RegExp(scenario.successRegex, "m").test(combined);
  }

  const maxLog = 6000;
  const trim = (txt) => txt.length > maxLog ? `${txt.slice(0, maxLog)}\n...[truncated]` : txt;

  return {
    status: pass ? "pass" : "fail",
    reason: pass ? "ok" : (proc.timedOut ? "timeout" : `exit=${proc.code}`),
    durationMs: proc.durationMs,
    pass,
    stdout: trim(proc.stdout),
    stderr: trim(proc.stderr),
  };
}

function scoreLevel(score) {
  if (score >= 0.85) return "pass";
  if (score >= 0.6) return "review";
  return "fail";
}

function avg(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

async function main() {
  const args = parseArgs(process.argv);
  const cfg = loadConfig(resolve(args.config));
  const models = pickModels(cfg, args);

  if (models.length === 0) {
    throw new Error("No models selected. Check config model pools or --models override.");
  }

  const iterations = args.iterations ?? cfg.defaults?.iterations ?? 1;
  const timeoutSec = args.timeoutSec ?? cfg.defaults?.timeoutSec ?? 480;

  mkdirSync(RESULTS_DIR, { recursive: true });
  mkdirSync(HISTORY_DIR, { recursive: true });

  const git = getGitMeta();
  const startedAt = new Date().toISOString();
  const baseEnv = {
    ...process.env,
    MCAPS_REPO: process.env.MCAPS_REPO || ROOT,
    COPILOT_CLI_PATH: WRAPPER_PATH,
  };

  const allRuns = [];

  console.log(`Running model matrix with ${models.length} model(s), ${cfg.scenarios.length} scenario(s), ${iterations} iteration(s).`);

  for (const model of models) {
    console.log(`\\n== Model: ${model}`);
    for (const scenario of cfg.scenarios) {
      for (let i = 1; i <= iterations; i++) {
        const label = `${scenario.id} [${i}/${iterations}]`;
        process.stdout.write(`  - ${label} ... `);
        const run = await runScenario({
          scenario,
          model,
          cfgTimeoutSec: timeoutSec,
          baseEnv,
          dryRun: args.dryRun,
        });

        allRuns.push({
          model,
          scenarioId: scenario.id,
          agent: scenario.agent,
          iteration: i,
          ...run,
        });

        console.log(`${run.status.toUpperCase()} (${run.durationMs} ms)`);
      }
    }
  }

  const scenarioScores = [];
  const grouped = new Map();

  for (const run of allRuns) {
    const key = `${run.model}::${run.scenarioId}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(run);
  }

  for (const [key, runs] of grouped) {
    const passRuns = runs.filter((r) => r.pass === true);
    const attempted = runs.filter((r) => r.pass !== null);
    const skipped = runs.length - attempted.length;
    const score = attempted.length ? passRuns.length / attempted.length : 0;
    const latency = attempted.length ? avg(attempted.map((r) => r.durationMs)) : 0;

    scenarioScores.push({
      id: key,
      score,
      attempted: attempted.length,
      skipped,
      passCount: passRuns.length,
      avgLatencyMs: Math.round(latency),
      status: attempted.length ? scoreLevel(score) : "skipped",
    });
  }

  const scoredOnly = scenarioScores.filter((s) => s.attempted > 0);
  const overallScore = scoredOnly.length ? avg(scoredOnly.map((s) => s.score)) : 0;

  const output = {
    timestamp: startedAt,
    branch: git.branch,
    commit: git.commit,
    model: models.join(" | "),
    matrix: {
      lane: args.lane,
      includeAnthropic: args.includeAnthropic,
      iterations,
      models,
      scenarios: cfg.scenarios.map((s) => s.id),
    },
    summary: {
      overallScore,
      scenarioCount: scoredOnly.length,
      level: scoreLevel(overallScore),
      totalRuns: allRuns.length,
      skippedRuns: allRuns.filter((r) => r.pass === null).length,
    },
    scenarios: scenarioScores,
    runs: allRuns,
  };

  const lines = [];
  lines.push("# Model Matrix Eval Report");
  lines.push("");
  lines.push(`- Timestamp: ${startedAt}`);
  lines.push(`- Branch: ${git.branch}`);
  lines.push(`- Commit: ${git.commit}`);
  lines.push(`- Lane: ${args.lane}`);
  lines.push(`- Include Anthropic: ${String(args.includeAnthropic)}`);
  lines.push(`- Iterations: ${iterations}`);
  lines.push(`- Overall Score: ${pct(overallScore)} (${scoreLevel(overallScore)})`);
  lines.push("");
  lines.push("| Model::Scenario | Score | Attempted | Skipped | Avg Latency (ms) | Status |");
  lines.push("|---|---:|---:|---:|---:|---|");
  for (const s of scenarioScores.sort((a, b) => a.id.localeCompare(b.id))) {
    lines.push(`| ${s.id} | ${pct(s.score)} | ${s.attempted} | ${s.skipped} | ${s.avgLatencyMs} | ${s.status} |`);
  }

  if (args.dryRun) {
    console.log("\nDry-run complete. No output files were written.");
    return;
  }

  writeFileSync(resolve(args.output), JSON.stringify(output, null, 2));

  const stamp = startedAt.replace(/[:.]/g, "-");
  const historyPath = join(HISTORY_DIR, `model-matrix-${stamp}.json`);
  writeFileSync(historyPath, JSON.stringify(output, null, 2));

  writeFileSync(resolve(args.report), `${lines.join("\n")}\n`);

  console.log(`\\nWrote JSON: ${resolve(args.output)}`);
  console.log(`Wrote report: ${resolve(args.report)}`);
  console.log(`Wrote history: ${historyPath}`);
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
