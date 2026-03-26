---
agent: Chief of Staff
---
# Learning Review Repair

Today is {{TODAY}}.

Repair the learning review artifact so it is structurally valid.

## Inputs
- Daily/{{TODAY}}-learning-review.md
- _kate/learning-log.md

## Required Actions
1. Read Daily/{{TODAY}}-learning-review.md.
2. Rewrite to match the exact structure below while preserving factual content.
3. If a section has no items, include one bullet: "- None."
4. Ensure REVIEW METADATA includes all required count fields.
5. Persist via OIL:
  - Call `oil:get_note_metadata` for Daily/{{TODAY}}-learning-review.md to get `mtime_ms`.
  - Use `oil:atomic_replace` with the full rewritten content and `mtime_ms` as `expected_mtime`.
  - If the note does not exist, use `oil:create_note`.
  - Never use `create_file`.

## Guardrails
- Never modify vault preference files or instruction files.
- Never send email or post to Teams.
- Never execute CRM writes.
- Only modify the learning review artifact file.

## Required Template
Use this exact structure:

## Learning Review

### PROMOTION CANDIDATES
- **Pattern:** [description]
- **Evidence:** [count] entries from [date range]
  - [entry summary]
- **Target file:** _kate/[filename].md
- **Proposed change:**
  ```
  [exact text]
  ```
- **Status:** PENDING APPROVAL

### WATCHING
- [topic] — [count] entries — needs [n] more before promotion

### STALE ENTRIES
- [date]: [entry summary] — reason flagged

### REVIEW METADATA
- Total learning-log entries: {n}
- Promotion candidates: {n}
- Watching patterns: {n}
- Stale entries: {n}
- Review date: {{TODAY}}
