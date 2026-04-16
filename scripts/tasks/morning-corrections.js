/**
 * Morning Corrections — runs the triage correction-loop prompt and
 * appends the output to the daily agent log.
 * Replaces: morning-corrections.sh
 */

import { join } from "node:path";

export default {
  name: "morning-corrections",
  prompt: "triage-correction-loop.prompt.md",
  repairPrompt: null,
  skipWeekends: false,
  maxRepairAttempts: 0,

  variables: {
    TODAY: ({ date }) => date,
  },

  // No artifact file is produced; output goes to stdout + the agent log.
  // A stub path keeps the runner happy without asserting file existence.
  artifactPath: ({ vaultDir }) => join(vaultDir, "_agent-log"),

  // Skip validation for this task (no artifact to check).
  validate: null,

  schedule: null,
};
