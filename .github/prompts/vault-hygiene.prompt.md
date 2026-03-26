---
agent: Chief of Staff
---
# Vault Hygiene

Today is {{TODAY}}. Run the weekly vault hygiene check.

## Purpose
Keep the vault fast and relevant by identifying stale content, migrating lingering action items, and reporting vault health. Prevents the vault from becoming a data swamp.

## Inputs
- Daily/ (all daily notes)
- Meetings/ (all meeting notes)
- _lcg/learning-log.md
- _lcg/operating-rhythm.md

## Steps
1. Scan Daily/ for notes older than 14 days.
   - For each, check if it contains unresolved action items (items in ACTION QUEUE without a "done" or "resolved" marker).
   - Collect lingering action items for migration.
2. Scan Meetings/ for meeting notes older than 14 days.
   - Check for open action items or follow-ups never completed.
3. Check for vault structure issues:
   - Daily notes missing required sections (per morning triage template).
   - Meeting notes missing required sections (per meeting brief template).
   - Empty or placeholder-only files in _lcg/.
4. Compile vault health metrics:
   - Total daily notes count.
   - Daily notes older than 14 days.
   - Total meeting notes count.
   - Meeting notes older than 14 days.
   - Learning-log entry count.
   - Lingering action items found.
5. Persist the hygiene report via OIL:
  - Target: Daily/{{TODAY}}-vault-hygiene.md
  - Call `oil:get_note_metadata` for that path.
  - If the note exists: use `oil:atomic_replace` with `mtime_ms` as `expected_mtime`.
  - If the note does not exist: use `oil:create_note`.
  - Never use `create_file`.
6. If lingering action items were found, append them to today's daily note via OIL:
  - Call `oil:get_note_metadata` for Daily/{{TODAY}}.md to get `mtime_ms`.
  - Use `oil:atomic_append` with heading "Migrated Action Items", the consolidated list as content, and `mtime_ms` as `expected_mtime`.

## Guardrails
- NEVER delete any vault files. Only report what could be archived.
- Never send email or post to Teams.
- Never execute CRM writes.
- Never modify instruction files.
- Only create/write the hygiene report and optionally append migrated items to the daily note.

## Output Format
Write to Daily/{{TODAY}}-vault-hygiene.md using this exact structure:

## Vault Hygiene Report

### LINGERING ACTION ITEMS
Items from notes older than 14 days that appear unresolved:
- [original date] [source file] — [action item text] — [owner if known]

### ARCHIVE CANDIDATES
Daily and meeting notes older than 14 days with no unresolved items:
- [file path] — [date] — safe to archive

### STRUCTURE ISSUES
Files with missing sections or structural problems:
- [file path] — [issue description]

### VAULT HEALTH
- Total daily notes: {n}
- Daily notes older than 14 days: {n}
- Total meeting notes: {n}
- Meeting notes older than 14 days: {n}
- Learning-log entries: {n}
- Lingering action items migrated: {n}
- Structure issues found: {n}
- Report date: {{TODAY}}
