---
agent: Chief of Staff
---
# Meeting Brief Repair

Repair the meeting brief artifact for {{meeting_name}} on {{meeting_date}}.

## Inputs
- meeting_name: {{meeting_name}}
- meeting_date: {{meeting_date}}
- customer_or_topic: {{customer}}
- meeting_file_slug: {{meeting_file_slug}}

## Goal
Produce a deterministic, valid one-page meeting brief artifact at:

Meetings/{{meeting_date}}-{{meeting_file_slug}}.md

## Steps
1. Read Meetings/{{meeting_date}}-{{meeting_file_slug}}.md if it exists.
2. Keep factual content that is already present and remove malformed sections.
3. Rewrite the entire file to the exact output shape below.
4. Ensure the Why This Matters section includes one bolded line for the single most important thing.
5. If a section has missing evidence, write "UNKNOWN - needs follow-up" instead of inventing facts.
6. Persist via OIL:
  - Call `oil:get_note_metadata` for Meetings/{{meeting_date}}-{{meeting_file_slug}}.md to get `mtime_ms`.
  - Use `oil:atomic_replace` with the full rewritten content and `mtime_ms` as `expected_mtime`.
  - If the note does not exist, use `oil:create_note`.
  - Never use `create_file`.

## Guardrails
- Never send messages.
- Never write to CRM.
- Never fabricate attendee or milestone facts.

## Formatting Rules
Bold key scan-points; use sub-bullets for detail. See Visual Formatting Policy in copilot-instructions.md.

## Output Format
Use this exact shape:

# Meeting Brief: {{meeting_name}}

## Meeting
- **Title:** {{meeting_name}}
- **Date/Time:** {{meeting_date}}
- **Customer/Topic:** {{customer}}
- **Attendees:**
	- 👤 **Name** · Role

## Why This Matters
- **[single most important thing the user should know]**
- supporting context

## What Changed Since Last Touchpoint
- **[change summary]**
	- 💡 detail or implication

## Key Attendee Context
- 👤 **[name]** · [role]
	- [relevant recent interaction]

## Open Items and Milestone Status
- [/] **[item]** · 👤 **owner** · 📅 **due date** · `status`
	- blocker/risk detail

## Risks and Decision Points
- [!] **[risk or decision]**
	- 💡 context or mitigation

## Prep Checklist
- [ ] [item]

## Recommended Talk Track
1. [opening/framing]
2. [key point]
3. [ask/close]