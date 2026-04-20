/**
 * validate.js — artifact validation for generated vault notes.
 *
 * Accepts a `validate` descriptor on the task module and returns a
 * { ok: boolean, errors: string[] } result.
 */

import { existsSync, readFileSync } from "node:fs";

/**
 * @param {string} artifactPath
 * @param {Object} spec
 * @param {string[]} [spec.requiredSections]    Literal strings that must appear.
 * @param {string[]} [spec.requiredLines]       Literal strings that must appear (alias of requiredSections).
 * @param {RegExp[]} [spec.requiredPatterns]    Regex patterns that must match.
 * @param {RegExp[]} [spec.forbiddenPatterns]   Regex patterns that must NOT match.
 * @param {RegExp}   [spec.sectionCountPattern] Single regex required to match once.
 * @param {number}   [spec.assumptionCount]     Exact count of "  - " sub-bullets under a
 *                                              "- Assumptions to validate:" line in RUN METADATA.
 * @param {number}   [spec.minChecklistItems]   Minimum number of `- [ ]` lines.
 */
export function validateArtifact(artifactPath, spec = {}) {
  const errors = [];

  if (!existsSync(artifactPath)) {
    return { ok: false, errors: [`Artifact not found: ${artifactPath}`] };
  }

  const content = readFileSync(artifactPath, "utf-8");

  for (const s of spec.requiredSections || []) {
    if (!content.includes(s)) errors.push(`Missing section/line: ${s}`);
  }
  for (const s of spec.requiredLines || []) {
    if (!content.includes(s)) errors.push(`Missing line: ${s}`);
  }
  for (const re of spec.requiredPatterns || []) {
    if (!re.test(content)) errors.push(`Missing required pattern: ${re}`);
  }
  for (const re of spec.forbiddenPatterns || []) {
    if (re.test(content)) errors.push(`Forbidden pattern matched: ${re}`);
  }
  if (spec.sectionCountPattern && !spec.sectionCountPattern.test(content)) {
    errors.push(`Required section-count line not found: ${spec.sectionCountPattern}`);
  }
  if (typeof spec.minChecklistItems === "number") {
    const matches = content.match(/^- \[ \]/gm) || [];
    if (matches.length < spec.minChecklistItems) {
      errors.push(`Need >= ${spec.minChecklistItems} checklist items (found ${matches.length}).`);
    }
  }
  if (typeof spec.assumptionCount === "number") {
    const n = countAssumptions(content);
    if (n !== spec.assumptionCount) {
      errors.push(`RUN METADATA must include exactly ${spec.assumptionCount} assumptions (found ${n}).`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function countAssumptions(content) {
  const lines = content.split("\n");
  let inMeta = false;
  let inAssumptions = false;
  let count = 0;
  for (const line of lines) {
    if (/^### RUN METADATA\s*$/.test(line)) { inMeta = true; continue; }
    if (inMeta && /^### /.test(line)) { inMeta = false; inAssumptions = false; }
    if (inMeta && /^- Assumptions to validate:\s*$/.test(line)) { inAssumptions = true; continue; }
    if (inMeta && inAssumptions && /^  - /.test(line)) count++;
    else if (inMeta && inAssumptions && /^- /.test(line)) inAssumptions = false;
  }
  return count;
}
