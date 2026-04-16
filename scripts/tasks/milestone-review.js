/**
 * Milestone Review — weekly CRM milestone health check.
 * Replaces: milestone-review.sh, milestone-review.ps1
 */

import { join } from "node:path";
import { existsSync } from "node:fs";

export default {
  name: "milestone-review",
  prompt: "deal-milestone-review.prompt.md",
  repairPrompt: null, // uses inline retry — output file existence is the gate
  skipWeekends: false, // has its own day-of-week check
  maxRepairAttempts: 1,

  variables: {
    TODAY: ({ date }) => date,
    manager_name: () => process.env.MANAGER_NAME || "me",
  },

  artifactPath: ({ date, vaultDir }) =>
    join(vaultDir, "Weekly", `${date}-milestone-review.md`),

  validate: {
    // Milestone review validates by file existence only
    // (the original ps1 just checked if the output file was created)
    requiredSections: [],
  },

  schedule: { days: ["Mon"], time: "08:00" },
};
