/**
 * Meeting Brief — on-demand meeting prep briefing.
 * Replaces: trigger-meeting-prep.sh, meeting-repair.sh, validate-meeting-brief.sh
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
  name: "meeting-brief",
  prompt: "meeting-brief.prompt.md",
  repairPrompt: "meeting-brief-repair.prompt.md",
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
    join(vaultDir, "Meetings", `${date}-${meeting_file_slug}.md`),

  validate: {
    requiredSections: [
      "## Meeting",
      "## Why This Matters",
      "## What Changed Since Last Touchpoint",
      "## Key Attendee Context",
      "## Opportunity Status & Key Actions",
      "## Risks and Decision Points",
      "## Prep Checklist",
      "## Recommended Talk Track",
    ],
    requiredPatterns: [
      /^# Meeting Brief:/m,
      /^- Title: .+/m,
      /^- Date\/Time: .+/m,
      /^- Customer\/Topic: .+/m,
    ],
    minChecklistItems: 2,
  },

  schedule: null, // on-demand only
};
