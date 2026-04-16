/**
 * Learning Review — weekly learning log scan and rule promotion.
 * Replaces: learning-review.sh, learning-review-repair.sh, validate-learning-review.sh
 */

import { join } from "node:path";

export default {
  name: "learning-review",
  prompt: "triage-learning-review.prompt.md",
  repairPrompt: "triage-learning-review-repair.prompt.md",
  skipWeekends: false,
  maxRepairAttempts: 1,

  variables: {
    TODAY: ({ date }) => date,
  },

  artifactPath: ({ date, vaultDir }) =>
    join(vaultDir, "Daily", `${date}-learning-review.md`),

  validate: {
    requiredSections: [
      "## Learning Review",
      "### PROMOTION CANDIDATES",
      "### WATCHING",
      "### STALE ENTRIES",
      "### REVIEW METADATA",
    ],
    requiredLines: [
      "Total learning-log entries:",
      "Promotion candidates:",
      "Watching patterns:",
      "Stale entries:",
      "Review date:",
    ],
  },

  schedule: { days: ["Fri"], time: "16:00" },
};
