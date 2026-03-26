---
agent: Chief of Staff
---
# Meeting Brief

Prepare a brief for {{meeting_name}} on {{meeting_date}} for {{customer}}.

## Inputs
- meeting_name: {{meeting_name}}
- meeting_date: {{meeting_date}}
- customer_or_topic: {{customer}}
- meeting_file_slug: {{meeting_file_slug}}

## Steps
1. Read context in this source priority order:
	- Vault notes and templates first.
	- CRM opportunities and milestones second.
	- Recent email and calendar history third.
2. Pull customer or topic context from the vault and identify prior meeting notes.
3. Pull latest opportunity and milestone status from CRM; flag stale updates and due-soon risk.
4. Search recent email and related calendar history (last 7 days) for attendee signals.
5. Compute delta versus the last touchpoint:
	- What changed materially.
	- What remains open.
	- What is at risk.
6. Assemble a one-page brief using _lcg/templates/meeting-brief.md.
7. Persist via OIL to Meetings/{{meeting_date}}-{{meeting_file_slug}}.md:
	- Call `oil:get_note_metadata` for that path.
	- If the note exists: use `oil:atomic_replace` with `mtime_ms` as `expected_mtime`.
	- If the note does not exist: use `oil:create_note`.
	- Never use `create_file`.

## Guardrails
- Never send messages.
- Never write to CRM.
- If a source is unavailable, mark it explicitly under Risks.

## Output Format
Use this exact shape. Bold key scan-points; use sub-bullets for detail. See Visual Formatting Policy in copilot-instructions.md.

# Meeting Brief: {{meeting_name}}

## Meeting
- **Title:** {{meeting_name}}
- **Date/Time:** {{meeting_date}}
- **Customer/Topic:** {{customer}}
- **Calendar:** [Open in Outlook](webLink)
- **Attendees:**
	- 👤 **Name** · Role

## Why This Matters
- **[single most important thing the user should know]**
- supporting context

## What Changed Since Last Touchpoint
- **[change summary]** — [Source](webLink)
	- 💡 detail or implication

## Key Attendee Context
- 👤 **[name]** · [role]
	- [relevant recent interaction](webLink)

## Open Items and Milestone Status
- [/] **[item](recordUrl)** · 👤 **owner** · 📅 **due date** · `status`
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

## Source Links
- 📅 [event title](webLink)
- 📧 [thread subject](webLink)
- 📊 [opportunity/milestone](recordUrl)

Note: All mail, calendar, and Teams references MUST include the `webLink` / `webUrl` returned by M365 tools. See M365 Source Linking Policy.
