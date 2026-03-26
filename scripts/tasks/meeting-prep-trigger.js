/**
 * Meeting Prep Trigger — orchestrator that parses the Daily note's
 * MEETING PREP STATUS section and triggers meeting-brief generation
 * for entries marked PARTIAL or MISSING.
 *
 * Replaces: trigger-meeting-prep.sh
 * Not directly scheduled — called by morning-triage's onSuccess hook.
 */

import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { resolveVaultPath, resolveDate } from "../lib/config.js";
import { runTask } from "../lib/runner.js";

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "meeting";
}

function extractCandidates(noteContent) {
  const lines = noteContent.split("\n");
  const candidates = [];
  let inSection = false;

  for (const line of lines) {
    if (/^### MEETING PREP STATUS\s*$/.test(line)) { inSection = true; continue; }
    if (inSection && /^### /.test(line)) { inSection = false; continue; }
    if (inSection && /^- /.test(line) && /(PARTIAL|MISSING) -/.test(line)) {
      candidates.push(line);
    }
  }
  return candidates;
}

function normalizeMeetingName(line) {
  // Strip checkbox prefix and bold time prefix, extract [Name] from brackets
  const bracketMatch = line.match(/\[([^\]]+)\]/);
  if (bracketMatch) return bracketMatch[1].trim();
  // Fallback: strip leading `- `, checkbox, time prefixes
  return line.replace(/^-\s*(\[.\]\s+)?(\*\*[^*]+\*\*\s*·\s*)?/, "").replace(/(PARTIAL|MISSING)\s*-.*/, "").trim();
}

function inferCustomer(meetingName) {
  const withMatch = meetingName.match(/[Ww]ith\s+([^-|]+)/);
  if (withMatch) return withMatch[1].trim();
  const forMatch = meetingName.match(/[Ff]or\s+([^-|]+)/);
  if (forMatch) return forMatch[1].trim();
  return "TBD";
}

export default {
  name: "meeting-prep-trigger",
  prompt: "meeting-brief.prompt.md",       // not used directly by runner
  repairPrompt: "meeting-brief-repair.prompt.md",
  skipWeekends: false,
  maxRepairAttempts: 1,

  /**
   * Custom execution — overrides the standard runner loop.
   * Called via `runTask(meetingPrepTrigger, { date })` from morning-triage.
   */
  async customRun({ date, log }) {
    const vaultDir = resolveVaultPath();
    const notePath = join(vaultDir, "Daily", `${date}.md`);
    const maxMeetings = parseInt(process.env.MAX_MEETING_PREP_TRIGGERS || "5", 10);

    if (!existsSync(notePath)) {
      log(`Daily note not found: ${notePath}`);
      return 1;
    }

    const content = readFileSync(notePath, "utf-8");
    const candidates = extractCandidates(content);

    if (candidates.length === 0) {
      log("No PARTIAL/MISSING meetings found — nothing to trigger.");
      return 0;
    }

    log(`Found ${candidates.length} meeting(s) needing prep.`);

    const { default: meetingBrief } = await import("./meeting-brief.js");
    let triggered = 0;
    let errors = 0;

    for (const line of candidates) {
      if (triggered >= maxMeetings) {
        log(`Reached max triggers (${maxMeetings}).`);
        break;
      }

      const meetingName = normalizeMeetingName(line);
      const customer = inferCustomer(meetingName);
      const slug = slugify(meetingName);

      log(`Triggering: ${meetingName} (${customer}, ${slug})`);
      triggered++;

      if (process.env.DRY_RUN === "1") continue;

      const exitCode = await runTask(meetingBrief, {
        date,
        meeting_name: meetingName,
        customer,
        meeting_file_slug: slug,
      });

      if (exitCode !== 0) errors++;
    }

    log(`Done: ${triggered} triggered, ${errors} errors.`);
    return errors > 0 ? 1 : 0;
  },

  schedule: null, // not independently scheduled
};
