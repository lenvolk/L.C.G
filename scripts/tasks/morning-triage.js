/**
 * Morning Triage — daily weekday triage note.
 * Replaces: morning-prep.sh, morning-repair.sh, validate-morning-brief.sh
 */

import { join } from "node:path";

export default {
  name: "morning-triage",
  prompt: "morning-triage.prompt.md",
  promptFallback: "morning-prep.prompt.md",
  repairPrompt: "morning-triage-repair.prompt.md",
  skipWeekends: true,
  maxRepairAttempts: 1,

  variables: {
    TODAY: ({ date }) => date,
  },

  artifactPath: ({ date, vaultDir }) =>
    join(vaultDir, "Daily", `${date}.md`),

  validate: {
    requiredSections: [
      "## Morning Triage",
      "### URGENT",
      "### HIGH",
      "### MEETING PREP STATUS",
      "### MILESTONE ALERTS",
      "### ACTION QUEUE",
      "### FYI",
      "### RUN METADATA",
    ],
    sectionCountPattern:
      /^- Section counts: URGENT=\d+; HIGH=\d+; MEETING PREP STATUS=\d+; MILESTONE ALERTS=\d+; ACTION QUEUE=\d+; FYI=\d+$/m,
    conflictSummaryPattern:
      /^- Conflict summary: overlap_groups=\d+; conflict_decisions=\d+; unresolved_conflicts=\d+$/m,
    assumptionCount: 3,
  },

  // After successful triage, optionally trigger meeting prep
  async onSuccess({ date, vaultDir, log, REPO_DIR }) {
    if (process.env.ENABLE_MEETING_PREP_AUTOTRIGGER === "1") {
      log("Meeting prep auto-trigger enabled — delegating to meeting-prep-trigger task.");
      const { default: meetingPrepTrigger } = await import("./meeting-prep-trigger.js"); // relative — Node resolves this fine
      const { runTask } = await import("../lib/runner.js");
      await runTask(meetingPrepTrigger, { date });
    }
  },

  schedule: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], time: "07:00" },
};
