# 2. Problem Statement

## 2.1 Who Is Kate

Kate is a personal assistant / chief of staff operating at a high level. She manages inbox triage, meeting preparation, executive communications, operating rhythms, CRM follow-through, and leadership content — all while maintaining the judgment and nuance that only a human can provide.

She is not a technical user. She does not write code. She does not want to learn config file syntax. But she is sharp, detail-oriented, and has strong opinions about how things should work.

---

## 2.2 Current Workflow Pain

### The Inbox Problem
- Sunday night is a major inbox triage window
- Kate goes through the inbox constantly, manually sorting what matters
- The biggest friction is **not knowing where to start** when the inbox is dense
- Priority flags are especially important for high-profile meetings and urgent context
- Manually opening 10+ threads to build the full picture of one topic

### The Prep Problem
- Meeting preparation requires hunting across email, calendar, CRM, and prior notes
- Context is scattered — no single surface assembles the full picture
- Time spent searching for prep material is time not spent sharpening the prep itself

### The Drafting Problem
- Draft presentations are high-effort and time-consuming to assemble
- Response drafts start from zero each time instead of learning from prior communication patterns
- Recurring report structures (weekly updates, deal summaries) are rebuilt manually

### The Memory Problem
- Kate takes handwritten notes in part so she can memorize and internalize the material
- Institutional knowledge lives in Kate's head, not in a searchable, reusable system
- When Kate is out, the knowledge doesn't transfer easily
- Patterns and preferences are learned by experience, not captured anywhere

### The Follow-Through Problem
- Action items from meetings require manual tracking
- CRM milestones and tasks need manual checking for updates
- Operating rhythm reminders (STU ROB dates, recurring reviews) are calendar-dependent
- No automated way to detect when an owner hasn't responded to an update request

---

## 2.3 What's Missing Today

| Gap | Description | Impact |
|-----|-------------|--------|
| **No pre-processed operating picture** | Kate opens a raw inbox every time | Triage takes the first hour of every working window |
| **No automatic context assembly** | Meeting prep requires manual cross-referencing | Preparation time scales linearly with meeting count |
| **No pattern capture** | How Kate handles and prioritizes is in her head | System never learns; every day starts from zero |
| **No draft acceleration** | Responses, presentations, and reports start blank | High-quality output requires maximum human effort every time |
| **No action tracking bridge** | Meeting → action items → CRM → follow-up is manual | Things fall through cracks or require constant manual vigilance |
| **No operating rhythm automation** | Key dates and recurring processes are calendar-only | Rhythm adherence depends on Kate remembering, not on system support |
| **No trust-appropriate automation** | Either fully manual or fully automated — no middle ground | Kate can't offload low-risk tasks while keeping control of high-risk ones |

---

## 2.4 Why Existing Tools Don't Solve This

### Copilot (out of the box)
- General-purpose — doesn't know Kate's priorities, patterns, or preferences
- No persistent memory across sessions
- No connection to CRM or vault knowledge
- Can't stage actions for approval (emails go to drafts, not outbox)

### M365 Copilot features
- Inbox summary is generic — doesn't know what "high-profile" means to Kate's exec
- Meeting recap is retrospective, not prospective (prep is the gap, not recording)
- No CRM awareness — doesn't know what opportunities or milestones matter

### Standalone AI assistants
- No access to Microsoft enterprise systems
- No composability — can't be customized per-workflow
- No persistent, user-owned memory
- No approval queue for staged actions

### Manual workflow tools (lists, reminders, templates)
- Don't learn or adapt
- Don't cross-reference across data sources
- Don't generate content
- Scale linearly with workload

---

## 2.5 The Composite Gap

The real problem isn't any one missing feature. It's that no existing tool provides **all three of**:

1. **Deep integration** — mail, calendar, CRM, vault, Teams, PowerPoint
2. **Persistent personalization** — learns Kate's patterns, priorities, and terminology over time
3. **Appropriate automation** — automates what's safe, stages what needs judgment, never sends what Kate hasn't approved

This spec describes a system that fills that composite gap using GitHub Copilot's customization layer as the glue.

---

## 2.6 Implementation Status vs. Identified Gaps (Audited 2026-03-18)

| Gap from §2.3 | Implementation Status | What Exists |
|---|---|---|
| **No pre-processed operating picture** | ✅ Addressed | `morning-triage.prompt.md` + `morning-prep.sh` pipeline produces structured URGENT/HIGH/NORMAL/FYI daily notes with action queues |
| **No automatic context assembly** | ✅ Addressed | `meeting-brief.prompt.md` cross-references vault, CRM (milestones/opportunities), mail (7-day window), and calendar history into one-page briefs |
| **No pattern capture** | ⚠️ Partially addressed | `triage-correction-loop.prompt.md` captures corrections into `_kate/learning-log.md`, but no automated promotion of learnings into instruction file changes. System learns, but slowly and manually. |
| **No draft acceleration** | ✅ Addressed | Communication style instructions + vault templates (`update-request.md`, `weekly-summary.md`, etc.) enable pattern-aware drafting. Excalidraw MCP handles diagram generation. |
| **No action tracking bridge** | ✅ Addressed | MSX MCP `get_milestones` + `find_milestones_needing_tasks` + `create_task` pipeline. Morning triage includes milestone alerts. CRM writes staged for approval. |
| **No operating rhythm automation** | ⚠️ Partially addressed | `weekly-rob.prompt.md` and `operating-rhythm.md` vault file exist. `morning-prep.sh` supports scheduled execution via launchd. But no automated ROB-date reminders or cadence enforcement. |
| **No trust-appropriate automation** | ✅ Addressed | MSX approval queue (stage → review → execute), prompt guard (injection detection), audit trail, entity allowlist, and instruction-level "never send" guardrails. Strongest safety implementation of any layer. |

### Remaining Gaps Not Covered in §2.3

| New Gap | Description | Impact |
|---|---|---|
| **Technical onboarding barrier** | Setup requires `node scripts/init.js`, `.env` configuration, Azure CLI login | Contradicts "no technical knowledge" target user profile |
| **No guided first-run experience** | COS personalization spec designs an onboarding interview but it's unbuilt | First use drops Kate into raw Copilot Chat with no guidance |
| **12 OIL tools are dead code** | Orient + composite tools (vault context, customer context, drift detection) are implemented but never registered | The vault's "get smarter" intelligence layer is largely inert |
| **No standalone surface** | Entire UX is VS Code — no CLI app, no web UI, no SDK plugin | Kate must use a developer IDE as her daily driver |

---

*Previous: [← Executive Summary](./01-executive-summary.md) · Next: [Architecture →](./03-architecture.md)*
