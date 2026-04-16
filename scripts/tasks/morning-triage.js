/**
 * Morning Triage — daily weekday triage note.
 * Replaces: morning-prep.sh, morning-repair.sh, validate-morning-brief.sh
 */

import { join } from "node:path";

export default {
  name: "morning-triage",
  prompt: "triage-morning.prompt.md",
  promptFallback: null,
  repairPrompt: "triage-morning-repair.prompt.md",
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
      "### PIPELINE ALERTS",
      "### ACTION QUEUE",
      "### FYI",
      "### RUN METADATA",
    ],
    sectionCountPattern:
      /^- Section counts: URGENT=\d+; HIGH=\d+; MEETING PREP STATUS=\d+; PIPELINE ALERTS=\d+; ACTION QUEUE=\d+; FYI=\d+$/m,
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
