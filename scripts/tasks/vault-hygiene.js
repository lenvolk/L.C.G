/**
 * Vault Hygiene — weekly vault cleanup and health report.
 *
 * Pre-run, this performs deterministic vault file operations:
 *   - archives Daily/Meetings/Weekly notes older than 30 days into
 *     Archive/FY<nn>-Q<n>/ and stamps their frontmatter;
 *   - quarantines any non-.md/.html files in <vault>/_lcg/ into .trash/.
 *
 * It then runs the vault-hygiene prompt to generate the Markdown report.
 */

import { join } from "node:path";
import { archiveDatedNotes, quarantineConfigDir } from "../lib/vault-ops.js";

export default {
  name: "vault-hygiene",
  prompt: "vault-hygiene.prompt.md",
  repairPrompt: null,
  skipWeekends: false,
  maxRepairAttempts: 0,

  async beforeRun({ vaultDir, log }) {
    archiveDatedNotes(join(vaultDir, "Daily"), 30, { log });
    archiveDatedNotes(join(vaultDir, "Meetings"), 30, { log });
    archiveDatedNotes(join(vaultDir, "Weekly"), 30, { log });
    quarantineConfigDir(vaultDir, { configSubdir: "_lcg", log });
  },

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
