/**
 * Portfolio Review — weekly CRM portfolio health check.
 * Replaces: milestone-review.sh, milestone-review.ps1 for GM persona.
 */

import { join } from "node:path";

export default {
  name: "portfolio-review",
  prompt: "deal-portfolio-review.prompt.md",
  repairPrompt: null, // validates by file existence
  skipWeekends: false, // has its own day-of-week check
  maxRepairAttempts: 1,

  variables: {
    TODAY: ({ date }) => date,
    scope: () => process.env.PORTFOLIO_SCOPE || "",
  },

  artifactPath: ({ date, vaultDir }) =>
    join(vaultDir, "Weekly", `${date}-portfolio-review.md`),

  validate: {
    // Portfolio review validates by file existence only
    requiredSections: [],
  },

  schedule: { days: ["Mon"], time: "08:00" },
};
