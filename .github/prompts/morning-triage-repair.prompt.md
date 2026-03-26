---
agent: Chief of Staff
---
# Morning Triage Repair

Today is {{TODAY}}.

Repair today's Daily note so the Morning Triage artifact is structurally valid and deterministic.

## Inputs
- Daily/{{TODAY}}.md
- _lcg/vip-list.md
- _lcg/preferences.md
- _lcg/operating-rhythm.md

## Required Actions
1. Read Daily/{{TODAY}}.md.
2. Rewrite only the "## Morning Triage" section using the exact headings and order below.
3. Preserve factual content from the existing note where possible.
4. If a section has no items, include one bullet: "- None.".
5. Ensure RUN METADATA includes the exact counts line pattern and exactly 3 assumptions.
6. Persist via OIL:
  - Call `oil:get_note_metadata` for Daily/{{TODAY}}.md to get `mtime_ms`.
  - Use `oil:atomic_replace` with the full updated note content and the `mtime_ms` as `expected_mtime`.
  - Never use `create_file`.

## Guardrails
- Never send email or post to Teams.
- Never execute CRM writes.
- Never modify any section outside "## Morning Triage".

## Formatting Rules
- Bold the key scan-point on every primary bullet; push detail into sub-bullets.
- Sort MEETING PREP STATUS chronologically by meeting time.
- Sort ACTION QUEUE by deadline (earliest first).
- See Visual Formatting Policy in copilot-instructions.md.

## Required Template
Use this exact structure and heading text:

## Morning Triage

### URGENT
- [f] **[Sender/Topic]** — why urgent
	- ⏭️ **Next:** action description

### HIGH
- [!] **[Sender/Topic]** — why high
	- ⏭️ **Next:** action description

### MEETING PREP STATUS
- [x] **HH:MM AM** · [Meeting name] READY - summary
	- ✅ next action
- [/] **HH:MM AM** · [Meeting name] PARTIAL - gap summary
	- ⚠️ what's incomplete or at risk
	- ⏭️ **Next:** action by **deadline**
- [ ] **HH:MM AM** · [Meeting name] MISSING - what's needed
	- ❌ what's missing
	- ⏭️ **Next:** action by **deadline**

### MILESTONE ALERTS
- [*] **[Milestone]** · 👤 **Owner** · 📅 due **date**
	- 📉 risk description
	- ⏭️ **Follow-up:** proposed action

### ACTION QUEUE
- [ ] 👤 **Owner** · action description · ⏰ **by when**
	- Draft needed: yes/no

### FYI
- [i] **[Thread/topic]** — summary

### RUN METADATA
- Section counts: URGENT={n}; HIGH={n}; MEETING PREP STATUS={n}; MILESTONE ALERTS={n}; ACTION QUEUE={n}; FYI={n}
- Assumptions to validate:
  - [assumption 1]
  - [assumption 2]
  - [assumption 3]
