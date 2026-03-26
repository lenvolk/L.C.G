/**
 * Meeting Follow-up — on-demand post-meeting action item generation.
 * Replaces: meeting-followup.sh, meeting-followup-repair.sh, validate-meeting-followup.sh
 *
 * Requires: meeting_name (env MEETING_NAME or CLI --meeting-name)
 */

import { join } from "node:path";

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export default {
  name: "meeting-followup",
  prompt: "meeting-followup.prompt.md",
  repairPrompt: "meeting-followup-repair.prompt.md",
  skipWeekends: false,
  maxRepairAttempts: 1,

  variables: {
    meeting_name: ({ meeting_name }) => meeting_name || process.env.MEETING_NAME || "",
    meeting_date: ({ date }) => date,
    customer: ({ customer }) => customer || process.env.CUSTOMER_OR_TOPIC || "TBD",
    meeting_file_slug: ({ meeting_name, meeting_file_slug }) =>
      meeting_file_slug || process.env.MEETING_FILE_SLUG || slugify(meeting_name || process.env.MEETING_NAME || "meeting"),
  },

  artifactPath: ({ date, vaultDir, meeting_file_slug }) =>
    join(vaultDir, "Meetings", `${date}-${meeting_file_slug}-followup.md`),

  validate: {
    requiredSections: [
      "## Run Metadata",
      "## Meeting",
      "## Action Items",
      "## Staged CRM Task Queue",
      "## Draft Follow-Up Queue",
      "## Risks and Blockers",
      "## Open Questions",
      "## Evidence Trace",
    ],
    requiredPatterns: [
      /^# Meeting Follow-Up:/m,
      /^- Date: .+/m,
      /^- Meeting Slug: .+/m,
      /^- Quality Bar: Action owner and due signal captured for every item$/m,
      /^- Confidence: (High|Medium|Low)$/m,
      /status=STAGED/m,
    ],
    forbiddenPatterns: [
      /status=EXECUTED/im,
    ],
  },

  schedule: null, // on-demand only
};
