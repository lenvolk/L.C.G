#!/usr/bin/env node

/**
 * install-scheduler.js — cross-platform scheduler installer.
 *
 * Installs a recurring schedule for one of the named tasks (default:
 * morning-triage at 07:00 Mon–Fri).
 *
 * Implementation per OS:
 *   macOS:   launchd  (~/Library/LaunchAgents/<label>.plist)
 *   Linux:   cron     (user crontab entry, marked with a tag comment)
 *   Windows: Task Scheduler (schtasks)
 *
 * Usage:
 *   node scripts/install-scheduler.js
 *   node scripts/install-scheduler.js --task milestone-review --time 08:00 --days Mon
 *   node scripts/install-scheduler.js --uninstall
 *   node scripts/install-scheduler.js --task morning-triage --label com.myorg.morning-prep
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { homedir, platform } from "node:os";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── CLI args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name) { return args.includes(`--${name}`); }
function param(name, def) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : def;
}

const TASK = param("task", "morning-triage");
const TIME = param("time", "07:00"); // HH:MM
const DAYS = (param("days", "Mon,Tue,Wed,Thu,Fri") || "").split(",").map((s) => s.trim());
const LABEL = param("label", `project.${TASK}`);
const UNINSTALL = flag("uninstall");

const [hourStr, minStr] = TIME.split(":");
const HOUR = Number(hourStr);
const MINUTE = Number(minStr);
if (!Number.isFinite(HOUR) || !Number.isFinite(MINUTE)) {
  console.error(`Invalid --time: ${TIME} (expected HH:MM)`);
  process.exit(2);
}

const WEEKDAY_MAP = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};
const WINDOWS_WEEKDAY_MAP = {
  Sun: "SUN", Mon: "MON", Tue: "TUE", Wed: "WED", Thu: "THU", Fri: "FRI", Sat: "SAT",
};
const CRON_WEEKDAY_MAP = {
  Sun: "0", Mon: "1", Tue: "2", Wed: "3", Thu: "4", Fri: "5", Sat: "6",
};

const osName = platform();

// ── Dispatch ────────────────────────────────────────────────────────
if (osName === "darwin") {
  if (UNINSTALL) uninstallLaunchd(); else installLaunchd();
} else if (osName === "win32") {
  if (UNINSTALL) uninstallSchtasks(); else installSchtasks();
} else {
  if (UNINSTALL) uninstallCron(); else installCron();
}

// ── macOS: launchd ─────────────────────────────────────────────────
function installLaunchd() {
  const plistPath = join(homedir(), "Library", "LaunchAgents", `${LABEL}.plist`);
  const logDir = join(homedir(), "Library", "Logs");
  const outLog = join(logDir, `${LABEL}.out.log`);
  const errLog = join(logDir, `${LABEL}.err.log`);

  mkdirSync(dirname(plistPath), { recursive: true });
  mkdirSync(logDir, { recursive: true });

  const weekdayDicts = DAYS
    .map((d) => WEEKDAY_MAP[d])
    .filter((n) => Number.isFinite(n))
    .map((n) =>
      `    <dict><key>Weekday</key><integer>${n}</integer><key>Hour</key><integer>${HOUR}</integer><key>Minute</key><integer>${MINUTE}</integer></dict>`
    )
    .join("\n");

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>${process.execPath}</string>
    <string>${join(ROOT, "scripts", "run.js")}</string>
    <string>${TASK}</string>
  </array>

  <key>WorkingDirectory</key>
  <string>${ROOT}</string>

  <key>StartCalendarInterval</key>
  <array>
${weekdayDicts}
  </array>

  <key>StandardOutPath</key>
  <string>${outLog}</string>
  <key>StandardErrorPath</key>
  <string>${errLog}</string>

  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
`;
  writeFileSync(plistPath, plist, "utf-8");

  // Unload if already loaded, then load
  spawnSync("launchctl", ["unload", plistPath], { stdio: "ignore" });
  const r = spawnSync("launchctl", ["load", plistPath], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`[scheduler] launchctl load failed (exit ${r.status})`);
    process.exit(r.status ?? 1);
  }
  console.log(`[scheduler] Installed: ${plistPath}`);
  console.log(`[scheduler] Logs: ${outLog} / ${errLog}`);
  console.log(`[scheduler] Next run: ${DAYS.join(",")} @ ${TIME} local time`);
}

function uninstallLaunchd() {
  const plistPath = join(homedir(), "Library", "LaunchAgents", `${LABEL}.plist`);
  if (existsSync(plistPath)) {
    spawnSync("launchctl", ["unload", plistPath], { stdio: "ignore" });
    unlinkSync(plistPath);
    console.log(`[scheduler] Removed: ${plistPath}`);
  } else {
    console.log(`[scheduler] No launchd plist at ${plistPath} — nothing to remove.`);
  }
}

// ── Windows: schtasks ──────────────────────────────────────────────
function installSchtasks() {
  const weekdays = DAYS.map((d) => WINDOWS_WEEKDAY_MAP[d]).filter(Boolean).join(",");
  const runScript = `"${process.execPath}" "${join(ROOT, "scripts", "run.js")}" ${TASK}`;
  const args = [
    "/Create",
    "/TN", LABEL,
    "/TR", runScript,
    "/SC", "WEEKLY",
    "/D", weekdays,
    "/ST", TIME,
    "/F", // force overwrite
  ];
  const r = spawnSync("schtasks", args, { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`[scheduler] schtasks /Create failed (exit ${r.status})`);
    process.exit(r.status ?? 1);
  }
  console.log(`[scheduler] Installed scheduled task: ${LABEL}`);
  console.log(`[scheduler] Runs: ${DAYS.join(",")} @ ${TIME}`);
}

function uninstallSchtasks() {
  const r = spawnSync("schtasks", ["/Delete", "/TN", LABEL, "/F"], { stdio: "inherit" });
  if (r.status === 0) {
    console.log(`[scheduler] Removed scheduled task: ${LABEL}`);
  } else {
    console.log(`[scheduler] Task ${LABEL} not found or could not be removed.`);
  }
}

// ── Linux: cron ────────────────────────────────────────────────────
function installCron() {
  const weekdays = DAYS.map((d) => CRON_WEEKDAY_MAP[d]).filter(Boolean).join(",");
  const tag = `# scheduler:${LABEL}`;
  const cronLine = `${MINUTE} ${HOUR} * * ${weekdays} "${process.execPath}" "${join(ROOT, "scripts", "run.js")}" ${TASK} ${tag}`;

  const current = spawnSync("crontab", ["-l"], { encoding: "utf-8" });
  const existing = current.status === 0 ? current.stdout : "";
  // Drop any existing line with our tag
  const cleaned = existing
    .split("\n")
    .filter((l) => !l.includes(tag))
    .join("\n")
    .replace(/\n+$/, "");
  const next = `${cleaned ? cleaned + "\n" : ""}${cronLine}\n`;

  const write = spawnSync("crontab", ["-"], { input: next, encoding: "utf-8" });
  if (write.status !== 0) {
    console.error(`[scheduler] crontab write failed (exit ${write.status})`);
    console.error(write.stderr);
    process.exit(write.status ?? 1);
  }
  console.log(`[scheduler] Installed cron entry tagged ${tag}`);
  console.log(`[scheduler] Runs: ${DAYS.join(",")} @ ${TIME}`);
}

function uninstallCron() {
  const tag = `# scheduler:${LABEL}`;
  const current = spawnSync("crontab", ["-l"], { encoding: "utf-8" });
  if (current.status !== 0) {
    console.log(`[scheduler] No crontab found — nothing to remove.`);
    return;
  }
  const next = current.stdout
    .split("\n")
    .filter((l) => !l.includes(tag))
    .join("\n")
    .replace(/\n+$/, "") + "\n";
  const write = spawnSync("crontab", ["-"], { input: next, encoding: "utf-8" });
  if (write.status === 0) console.log(`[scheduler] Removed cron entries tagged ${tag}`);
  else console.error(`[scheduler] crontab write failed`);
}
