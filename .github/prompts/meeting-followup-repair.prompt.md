---
agent: Chief of Staff
---
# Meeting Follow-Up Repair

Repair the meeting follow-up artifact for {{meeting_name}} on {{meeting_date}}.

## Inputs
- meeting_name: {{meeting_name}}
- meeting_date: {{meeting_date}}
- customer_or_topic: {{customer}}
- meeting_file_slug: {{meeting_file_slug}}

## Goal
Produce a deterministic, valid artifact at:

Meetings/{{meeting_date}}-{{meeting_file_slug}}-followup.md

## Steps
1. Read Meetings/{{meeting_date}}-{{meeting_file_slug}}-followup.md if it exists.
2. Keep factual content that is already present and remove malformed sections.
3. Rewrite the entire file to the exact output shape below.
4. If a section has missing evidence, write "UNKNOWN - needs follow-up".
5. Ensure staged queue entries use status=STAGED.
6. Persist via OIL:
  - Call `oil:get_note_metadata` for Meetings/{{meeting_date}}-{{meeting_file_slug}}-followup.md to get `mtime_ms`.
  - Use `oil:atomic_replace` with the full rewritten content and `mtime_ms` as `expected_mtime`.
  - If the note does not exist, use `oil:create_note`.
  - Never use `create_file`.

## Guardrails
- Never send messages.
- Never execute CRM writes.
- Never fabricate owner, due date, or source evidence.

## Output Format
Use this exact shape:

# Meeting Follow-Up: {{meeting_name}}

## Run Metadata
- Date: {{meeting_date}}
- Meeting Slug: {{meeting_file_slug}}
- Quality Bar: Action owner and due signal captured for every item

## Meeting
- Title: {{meeting_name}}
- Date: {{meeting_date}}
- Customer/Topic: {{customer}}
- Confidence: High|Medium|Low

## Action Items
- [ ] **[Action]** · 👤 **owner** · 📅 **due** · source: mail|meeting|crm
	- Tags: `CRM_TASK_CANDIDATE` | `EMAIL_FOLLOWUP_NEEDED` | `NONE`

## Staged CRM Task Queue
- [<] **[Action]** · 👤 **owner** · 📅 **due** · `STAGED`
	- 💡 reason: why it belongs in CRM

## Draft Follow-Up Queue
- [D] 👤 **[Owner Name]** · subject: **[topic]**
	- 💡 reason: missing update | risk | decision needed

## Risks and Blockers
- [!] **[blocker]**
	- 💡 context or mitigation

## Open Questions
- [?] **[question]**
	- needed from: [person/team]

## Evidence Trace
- 📧 mail: [message/thread references]
- 📅 calendar: [event reference]
- 📊 crm: [milestone/opportunity references]
- 📝 vault: [note references]
