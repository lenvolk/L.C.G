/**
 * Update Requests — on-demand customer update-request email drafts.
 * Replaces: run-update-requests.sh, update-request-repair.sh, validate-update-requests.sh
 *
 * Requires: customer (env CUSTOMER or CLI --customer)
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
  name: "update-request",
  prompt: "deal-update-request.prompt.md",
  repairPrompt: "deal-update-request-repair.prompt.md",
  skipWeekends: false,
  maxRepairAttempts: 1,

  variables: {
    customer: ({ customer }) => customer || process.env.CUSTOMER || "",
    run_date: ({ date }) => date,
    customer_file_slug: ({ customer, customer_file_slug }) =>
      customer_file_slug || process.env.CUSTOMER_SLUG || slugify(customer || process.env.CUSTOMER || "customer"),
  },

  artifactPath: ({ date, vaultDir, customer_file_slug }) =>
    join(vaultDir, "Daily", `${date}-update-requests-${customer_file_slug}.md`),

  validate: {
    requiredSections: [
      "## Run Metadata",
      "## Draft Queue",
      "## Draft 1",
      "## Review Notes",
    ],
    requiredPatterns: [
      /^# Update Request Drafts:/m,
      /^- Date: .+/m,
      /^- Customer Slug: .+/m,
      /^- Draft Count: [0-9]+/m,
      /^- Quality Bar: L.C.G edits <=2 sentences per draft$/m,
      /^- To:.*$/m,
      /^- Subject: .*Update Request - .+/m,
      /^- Body:/m,
    ],
    forbiddenPatterns: [
      /\bsend\b.*\bemail\b/im,
      /\bexecute\b/im,
    ],
  },

  schedule: null, // on-demand only
};
