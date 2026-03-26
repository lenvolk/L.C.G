/**
 * Vault Hygiene — weekly vault cleanup and health report.
 * Replaces: vault-hygiene.sh
 */

import { join } from "node:path";

export default {
  name: "vault-hygiene",
  prompt: "vault-hygiene.prompt.md",
  repairPrompt: null,
  skipWeekends: false,
  maxRepairAttempts: 0,

  variables: {
    TODAY: ({ date }) => date,
  },

  artifactPath: ({ date, vaultDir }) =>
    join(vaultDir, "Daily", `${date}-vault-hygiene.md`),

  validate: {
    requiredSections: [
      "## Vault Hygiene Report",
      "### LINGERING ACTION ITEMS",
      "### ARCHIVE CANDIDATES",
      "### STRUCTURE ISSUES",
      "### VAULT HEALTH",
    ],
  },

  schedule: { days: ["Sun"], time: "18:00" },
};
