# 10. Open Questions

## 10.1 Resolved Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| R1 | Code or no-code configuration? | **No code. Natural language files only.** | Kate is non-technical; every behavior must be readable and editable plain English |
| R2 | Where does memory live? | **Vault (Obsidian files)** | Human-readable, versionable, works offline, no external service dependency |
| R3 | Can the system send email? | **No. Drafts only.** | Kate explicitly wants to own outbound communication. Trust boundary. |
| R4 | Where do preferences vs. rules live? | **Vault for preferences, `.github/` for rules** | Preferences are personal context (VIP list, style); rules are behavioral constraints (triage logic) |
| R5 | How does the system learn? | **Vault accumulation + learning log, not model fine-tuning** | Corrections and context persist as files Copilot reads on next run |
| R6 | Should the system auto-post to Teams? | **Only with explicit approval per post** | Kate wants review before any visible-to-others action |
| R7 | How does Kate customize? | **Edit markdown files** | No settings UI, no admin panel — files are the interface |

---

## 10.2 Open — Needs Kate's Input

| # | Question | Why It Matters | Proposed Default |
|---|----------|---------------|-----------------|
| O1 | **What exact signals define "high-profile" vs. normal meetings?** | Determines which meetings get full prep briefs | Meetings with VIP attendees, external attendees, or meetings Kate manually flags |
| O2 | **What is the ideal Sunday-night triage experience?** | Defines the weekly kickoff prompt | Weekly ROB brief produced Sunday at 6 PM, covering Mon–Fri ahead |
| O3 | **What inputs should feed the PowerPoint generator?** | Scopes what data sources the PPTX prompt pulls from | Email + CRM + vault + prior decks (manual upload to templates folder) |
| O4 | **What level of draft quality makes this indispensable vs. gimmicky?** | Sets the quality bar for Phase 3 | Kate edits ≤2 sentences per draft email, ≤3 slides per deck |
| O5 | **How should Winning Wednesdays and channel summaries be structured?** | Defines the channel summary prompt | Bullet-point summary per channel, last 7 days, sorted by relevance |
| O6 | **What's the right format for notes Kate sends back to teams?** | Clarifies what the "human-in-the-loop notes" draft should look like | System proposes structure + key points; Kate writes final version |
| O7 | **Should the system flag email threads Kate hasn't responded to?** | Could be valuable for follow-through, could be noisy | Only flag threads with explicit asks that are >48 hours unanswered |
| O8 | **How should travel preferences be captured beyond Delta/Marriott?** | Scopes the travel advisory feature | Seat preference, hotel tier, maximum layovers, preferred airports — stored in `_kate/preferences.md` |

---

## 10.3 Open — Needs Technical Investigation

| # | Question | Why It Matters | Next Step |
|---|----------|---------------|-----------|
| T1 | **Can Copilot CLI reliably trigger from cron on macOS?** | Morning triage depends on scheduled execution | `launchd` installer and runner scripts are implemented; confirm with 5 consecutive weekday runs and log review |
| T2 | **What's the token budget per prompt execution?** | Limits how many emails/meetings a single triage run can process | Benchmark a full inbox triage run and measure token usage |
| T3 | **Can M365 MCP differentiate client vs. internal emails?** | Kate explicitly wants this separation | Test email search with domain-based filtering |
| T4 | **How does `pptxgenjs` handle template-based generation?** | Presentation quality depends on template fidelity | Prototype a town-hall deck from vault + CRM data |
| T5 | **Can agents inherit instructions from other instruction files?** | Agent composition without duplication | Test `instructions:` field in `.agent.md` frontmatter |
| T6 | **What's the M365 MCP tool surface for Teams channel reading?** | Channel summary feature depends on reliable channel access | Verify `ListChannelMessages`, `SearchTeamsMessages` work for target channels |
| T7 | **Can the system detect when a Copilot correction should become a permanent rule?** | Automates the learning-log → instruction promotion path | **Implemented.** `learning-review.prompt.md` scans learning-log weekly for 3+ recurring corrections, groups by topic, and proposes promotions to specific vault files (VIP list, preferences, etc.) with before/after diffs. Never auto-applies — Kate must approve. `vault-hygiene.prompt.md` handles stale-entry detection. Full run/validate/repair automation via `npm run learning:review` and `npm run vault:hygiene`. |
| T8 | **How do we handle vault conflicts when Kate and the system write simultaneously?** | Obsidian and OIL writing the same file | OIL's mtime-based optimistic locking handles this; verify with concurrent use |
| T9 | **Can prompts reference other prompts (chaining)?** | Morning triage should auto-trigger meeting briefs | Prompt aliasing is implemented (`morning-prep` → `morning-triage`) and trigger runner wiring exists (`trigger-meeting-prep.sh` + optional call from `morning-prep.sh`); production validation is still required |

---

## 10.6 Implementation Reality Check (as of 2026-03-18)

| Area | Current State | Remaining Gap |
|------|---------------|---------------|
| Morning triage run contract | Implemented (`morning-triage.prompt.md`) with deterministic sections and run metadata | Needs repeated successful production runs and accuracy scoring |
| Morning artifact quality gate | Implemented (`scripts/validate-morning-brief.sh`) and wired into `morning-prep.sh` | Needs stabilized run success across real daily data |
| Correction loop | Implemented (`triage-correction-loop.prompt.md`, `scripts/morning-corrections.sh`) | Needs measurable correction-to-improvement reporting |
| Learning review & promotion | Implemented (`learning-review.prompt.md`, `scripts/learning-review.sh`) with validate/repair automation | Needs weekly cadence scheduling and first live promotion cycle with Kate's approval |
| Vault hygiene | Implemented (`vault-hygiene.prompt.md`, `scripts/vault-hygiene.sh`) with inline validation | Needs weekly cadence scheduling and first live cleanup pass |
| Meeting brief workflow | Implemented prompt contract + template + auto-trigger runner (`scripts/trigger-meeting-prep.sh`) | Needs live reliability and quality validation |
| CRM update draft loop | Implemented prompt contract + template | Needs end-to-end owner-specific draft QA cycle |
| Meeting follow-through | Implemented prompt contract (`meeting-followup.prompt.md`) | Needs live extraction quality checks and staged CRM task integration |
| Weekly ROB | Implemented prompt contract + starter template | Needs scheduled production run and quality rubric |
| Presentation generation | Prompt contracts implemented (`pptx-builder.prompt.md`, `winning-wednesdays.prompt.md`) + starter templates present | Needs PPTX runtime generation validation and Teams channel-read validation |

---

## 10.4 Open — Product Direction

| # | Question | Options | Implication |
|---|----------|---------|------------|
| P1 | **Should this be a single repo (KATE) or a config layer on MCAPS-IQ?** | Separate repo: focused, clean · Config layer: inherits all MCP servers and tests | Separate repo is simpler for Kate; shared repo gives access to eval infrastructure |
| P2 | **Should Kate have her own vault or share Jin's vault structure?** | Shared: reuses existing schema · Separate: clean slate, no clutter | Separate vault recommended — Kate's namespace shouldn't depend on Jin's notes |
| P3 | **Is VS Code the right primary surface for Kate?** | VS Code: full Copilot features · Obsidian: Kate's natural home · Web: simplest | Start with VS Code for full capability; explore Obsidian-native integration later |
| P4 | **Should the system have a "dashboard" view?** | Daily note IS the dashboard vs. a dedicated web view | Start with daily note; a dashboard is Phase 5+ if the daily note format isn't enough |
| P5 | **How do we measure success?** | Qualitative (Kate's satisfaction) vs. quantitative (time saved, corrections declining) | Both — weekly 5-minute check-in with Kate: "What worked? What didn't? Time saved?" |

---

## 10.5 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Trust drops if system sends something Kate didn't approve** | Low (safeguards in place) | High | No send capability, drafts only, staged writes |
| **Triage accuracy is too low to be useful** | Medium (early phase) | Medium | Learning log corrections, VIP list refinement, weekly accuracy reviews |
| **Kate finds markdown files intimidating** | Medium | High | Guided onboarding, templates with examples, Copilot can edit files when asked |
| **Token limits prevent full inbox processing** | Medium | Medium | Process in batches, prioritize VIP email first, cache results in vault |
| **M365 MCP doesn't support needed operations** | Low | High | Verify tool surface before building prompts that depend on it |
| **System creates vault clutter** | Medium | Low | Agent writes are scoped to specific directories; vault-hygiene weekly prompt identifies stale notes and archive candidates (`npm run vault:hygiene`) |
| **Kate stops using it after initial novelty** | Medium | High | Focus Phase 1 on clear, immediate value (morning triage saves real time) |

---

*Previous: [← Implementation Roadmap](./09-roadmap.md)*
