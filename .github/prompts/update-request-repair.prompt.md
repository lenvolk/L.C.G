---
agent: Chief of Staff
---
# Update Request Repair

Repair update-request drafts for {{customer}} on {{run_date}}.

## Inputs
- customer: {{customer}}
- run_date: {{run_date}}
- customer_file_slug: {{customer_file_slug}}

## Goal
Produce a deterministic, valid artifact at:

Daily/{{run_date}}-update-requests-{{customer_file_slug}}.md

## Steps
1. Read Daily/{{run_date}}-update-requests-{{customer_file_slug}}.md if it exists.
2. Keep factual content that is already present and remove malformed sections.
3. Rewrite the entire file to the exact output shape below.
4. If owner, due date, or risk is unknown, write "UNKNOWN - needs follow-up".
5. Persist via OIL:
  - Call `oil:get_note_metadata` for Daily/{{run_date}}-update-requests-{{customer_file_slug}}.md to get `mtime_ms`.
  - Use `oil:atomic_replace` with the full rewritten content and `mtime_ms` as `expected_mtime`.
  - If the note does not exist, use `oil:create_note`.
  - Never use `create_file`.

## Guardrails
- Draft only. Never send.
- Never execute CRM writes.
- Never fabricate owner names or due dates.

## Output Format
Use this exact structure:

# Update Request Drafts: {{customer}}

## Run Metadata
- Date: {{run_date}}
- Customer Slug: {{customer_file_slug}}
- Draft Count: {n}
- Quality Bar: Kate edits <=2 sentences per draft

## Draft Queue
- [D] [Owner Name] - priority URGENT|HIGH - reason

## Draft 1
- To:
- Subject: [Milestone] Update Request - [Due Date]
- Body:
	Hi [Owner Name],

	[Milestone Name] is due on [Due Date]. Could you please send a status update by [Requested Date/Time] that includes:
	- Current status (on track / at risk / blocked)
	- Any blockers and owner
	- Revised date if at risk

	Thank you,
	Kate

## Draft N
- Repeat for each owner.

## Review Notes
- Any uncertainties or missing data to verify before sending.
