# 9. Implementation Roadmap

## 9.0 Current Status Snapshot (as of 2026-03-18)

| Phase | Status | Notes |
|------|--------|-------|
| **Phase 0: Foundation** | **Complete** | Instruction files, agent file, vault scaffolding/templates, and setup/check scripts are implemented. Starter VIP and operating-rhythm files are now populated with concrete defaults. Environment readiness check passed (Node/npm/Azure login + msx/oil/excalidraw MCP readiness). |
| **Phase 1: Morning Triage** | **Complete (implementation)** | Runnable triage prompt, scheduler wiring, validator, correction loop, and deterministic repair path are now implemented. Morning brief generation now includes automatic repair-and-revalidate fallback to stabilize daily outcomes. **Learning loop** now includes weekly learning-review prompt with pattern-promotion analysis, vault hygiene prompt for stale-content cleanup, and full run/validate/repair automation for both. |
| **Phase 2: Meeting Prep** | **Complete (implementation)** | Deterministic prompt contract, auto-trigger runner, per-brief artifact validation, and repair-and-revalidate fallback are implemented. Live quality KPI adoption is still pending. |
| **Phase 3: CRM Drafting Loop** | **Complete (implementation)** | Update-request and meeting-followup workflows now include deterministic artifact targets, validators, repair scripts, and npm runner wiring. Adoption KPI and live CRM approval-loop confidence tuning remain post-implementation. |
| **Phase 4: ROB + Presentations** | **Scaffold + deterministic prompt contracts** | Weekly ROB, PPTX builder, and channel-summary prompt contracts are implemented with deck templates in place. End-to-end generation and quality validation are not yet proven in live operation. |
| **Phase 5: Expansion & Autonomy** | **Not started** | No implementation yet. |

## 9.1 Phased Build Plan

The system is built incrementally — each phase delivers standalone value and builds trust before the next phase adds capability.

---

## Phase 0: Foundation (Week 1)

> Get the scaffolding in place so everything has a home.

### Deliverables

| Item | Description | Owner |
|------|------------|-------|
| **`.github/instructions/copilot-instructions.md`** | Master behavior file — Kate's identity, global rules, priority framework | Jin (with Kate's input) |
| **`.github/instructions/communication-style.instructions.md`** | Writing style guide | Jin (from Kate's examples) |
| **`.github/agents/chief-of-staff.agent.md`** | Primary agent persona with full tool access | Jin |
| **Vault `_kate/` directory** | `preferences.md`, `vip-list.md`, `operating-rhythm.md`, `communication-style.md`, `learning-log.md` | Jin scaffolds, Kate populates |
| **Vault `_kate/templates/`** | `meeting-brief.md`, `weekly-summary.md` starter templates | Jin (Kate refines) |
| **MCP connection verification** | M365, MSX, OIL all connecting and returning data | Jin |

### Kate's Role in Phase 0
- Review and populate the VIP list
- Review and correct the operating rhythm
- Review the communication style guide — "does this sound like me?"
- Provide 3-5 example emails that represent her style

### Exit Criteria
- [x] `@chief-of-staff` agent loads in Copilot Chat with correct tools
- [x] VIP list populated with at least Tier 1 names
- [x] Operating rhythm has all recurring cadences
- [x] MCP environment readiness check passes for core local servers and Azure-authenticated access (`node scripts/init.js --check`)

### Completion Notes (2026-03-18)
- `vault-starter/_kate/vip-list.md` now includes concrete Tier 1/2/3 defaults and maintenance rules.
- `vault-starter/_kate/operating-rhythm.md` now includes daily/weekly/monthly/quarterly cadences, key dates, and service targets.
- Setup task `Setup: Check Environment` passed successfully, including Azure sign-in and readiness for `mcp/msx`, `mcp/oil`, and `mcp/excalidraw`.

---

## Phase 1: Morning Triage (Weeks 2-3)

> Kate's first daily workflow — the "Start Here" inbox brief.

### Deliverables

| Item | Description |
|------|------------|
| **`.github/instructions/inbox-triage.instructions.md`** | Classification rules, VIP handling, output format |
| **`.github/prompts/morning-triage.prompt.md`** | Full triage workflow: inbox + calendar + CRM + vault |
| **`scripts/morning-prep.sh` (updated)** | Point to new prompt template location |
| **Cron configuration** | Morning triage runs at 7 AM Mon-Fri |
| **`scripts/validate-morning-brief.sh`** | Enforces required brief sections after each run |
| **`.github/prompts/morning-triage-repair.prompt.md`** | Deterministic repair contract for malformed morning triage artifacts |
| **`scripts/morning-repair.sh`** | Manual repair + validation runner for same-day recovery |
| **`.github/prompts/triage-correction-loop.prompt.md`** | Correction-to-learning-log workflow |
| **`scripts/morning-corrections.sh`** | Runs correction loop prompt via Copilot CLI |
| **`.github/prompts/learning-review.prompt.md`** | Weekly learning-log pattern analysis and promotion recommendations |
| **`.github/prompts/learning-review-repair.prompt.md`** | Deterministic repair contract for learning review artifacts |
| **`scripts/learning-review.sh`** | Runner for weekly learning review with validate/repair fallback |
| **`scripts/validate-learning-review.sh`** | Validates learning review artifact structure |
| **`scripts/learning-review-repair.sh`** | Manual repair + validation runner for learning review |
| **`.github/prompts/vault-hygiene.prompt.md`** | Weekly vault cleanup: stale content, lingering actions, health metrics |
| **`scripts/vault-hygiene.sh`** | Runner for vault hygiene with inline validation |

### Workflow
```
Cron (7 AM) → morning-triage.prompt.md 
  → Read inbox (M365)
  → Read calendar (M365)
  → Check CRM milestones (MSX)
  → Check vault for context (OIL)
  → Classify and prioritize
  → Write brief to Daily/{today}.md (OIL)
```

### Kate's Role in Phase 1
- Review the first 5 triage briefs and mark corrections
- Add/adjust VIP list entries based on real results  
- Note any emails that were missed or mis-classified

### Exit Criteria (Implementation)
- [x] Morning brief scheduler, runner, and prompt contract are implemented
- [x] Deterministic artifact validation is enforced after each run
- [x] Correction-loop workflow is implemented for learning-log capture
- [x] Automatic repair-and-revalidate fallback exists for malformed briefs
- [x] Manual repair command exists for operator recovery (`npm run morning:repair`)
- [x] Weekly learning review prompt scans learning-log for recurring patterns and proposes vault promotions (`npm run learning:review`)
- [x] Learning review has deterministic validation and repair contracts
- [x] Vault hygiene prompt identifies stale content, migrates lingering actions, reports health (`npm run vault:hygiene`)

### Adoption KPI Tracking (Post-Implementation)
- [ ] Inbox items correctly classified at 80%+ accuracy
- [ ] VIP emails surface in URGENT/HIGH every time
- [ ] Kate reports saving ≥15 minutes on morning triage
- [ ] Learning log has ≤3 unresolved corrections after 5 runs

### Completion Notes (2026-03-18)
- `scripts/morning-prep.sh` now runs an automatic repair attempt (`MAX_MORNING_TRIAGE_REPAIR_ATTEMPTS`, default `1`) when validation fails, then revalidates before final status.
- `.github/prompts/morning-triage-repair.prompt.md` defines an exact deterministic rewrite contract for the `## Morning Triage` section.
- `scripts/validate-morning-brief.sh` now enforces RUN METADATA count-line shape and exactly three assumptions.
- `scripts/morning-repair.sh` and `npm run morning:repair` provide a one-command manual recovery path.
- `learning-review.prompt.md` scans learning-log for 3+ recurring corrections, groups by topic, and proposes specific vault-file edits (VIP list, preferences, operating-rhythm, communication-style) with before/after diffs. Never auto-applies changes.
- `scripts/learning-review.sh` runs the review with validate/repair fallback (`MAX_LEARNING_REVIEW_REPAIR_ATTEMPTS`, default `1`).
- `scripts/validate-learning-review.sh` enforces required sections (PROMOTION CANDIDATES, WATCHING, STALE ENTRIES, REVIEW METADATA) and metadata field presence.
- `vault-hygiene.prompt.md` scans Daily/ and Meetings/ for notes older than 14 days, identifies lingering action items, reports vault health metrics, and migrates unresolved items to the current daily note.
- `scripts/vault-hygiene.sh` runs the hygiene check with inline structure validation.
- `package.json` includes `learning:review`, `learning:review:validate`, `learning:review:repair`, and `vault:hygiene` commands.

---

## Phase 2: Meeting Prep (Weeks 3-5)

> Automated meeting briefs with cross-system context.

### Deliverables

| Item | Description |
|------|------------|
| **`.github/instructions/meeting-prep.instructions.md`** | Brief structure, source priorities, formatting |
| **`.github/prompts/meeting-brief.prompt.md`** | Single-meeting prep workflow |
| **`_kate/templates/meeting-brief.md`** | Standard brief template |
| **Auto-triggering from morning triage** | Triage identifies high-profile meetings and triggers briefs |

### Workflow
```
Morning triage identifies meetings needing prep
  → For each: trigger meeting-brief.prompt.md
    → Customer context from vault (OIL)
    → Opportunity/milestone status from CRM (MSX)
    → Recent email from attendees (M365)
    → Prior meeting notes from vault (OIL)
    → Delta analysis (what changed since last time)
    → Brief written to Meetings/{date}-{topic}.md
```

### Exit Criteria (Implementation)
- [x] Meeting prep prompt contract is deterministic and includes a safe filename slug input.
- [x] Triage-driven auto-trigger runner exists for `PARTIAL`/`MISSING` meetings.
- [x] Deterministic meeting-brief artifact validation is enforced per generated brief.
- [x] Automatic repair-and-revalidate fallback exists for malformed meeting briefs.
- [x] Manual meeting-brief repair command exists for operator recovery (`npm run meeting:repair`).

### Adoption KPI Tracking (Post-Implementation)
- [ ] Meeting briefs auto-generated for all high-profile meetings
- [ ] Briefs include CRM data, vault context, and email threads
- [ ] Kate scans brief in ≤2 minutes
- [ ] Briefs correctly identify "what changed" 70%+ of the time
- [ ] Kate reports saving ≥20 minutes per high-profile meeting

### Completion Notes (2026-03-18)
- `meeting-brief.prompt.md` now includes `meeting_file_slug` and writes to deterministic file targets (`Meetings/{date}-{slug}.md`).
- `scripts/validate-meeting-brief.sh` enforces required sections, meeting metadata lines, bold top insight, and checklist presence.
- `.github/prompts/meeting-brief-repair.prompt.md` defines a deterministic rewrite contract for malformed meeting briefs.
- `scripts/trigger-meeting-prep.sh` now validates each generated brief and runs repair-and-revalidate fallback (`MAX_MEETING_PREP_REPAIR_ATTEMPTS`, default `1`).
- `scripts/meeting-repair.sh` and `npm run meeting:repair` provide one-command manual recovery for a specific meeting brief.

---

## Phase 3: CRM Integration & Drafting (Weeks 5-8)

> CRM operations, email draft generation, and action tracking.

### Deliverables

| Item | Description |
|------|------------|
| **`.github/instructions/crm-operations.instructions.md`** | Read/write rules, milestone flagging |
| **`.github/prompts/update-request.prompt.md`** | Milestone owner follow-up drafts |
| **`.github/prompts/meeting-followup.prompt.md`** | Post-meeting action item extraction |
| **`_kate/templates/update-request.md`** | Standard follow-up email template |
| **Response draft capability** | Inbox items with "needs response" get draft created |

### New Capabilities
- CRM milestone tracking with past-due flagging
- Email response draft generation (Outlook Drafts only)
- Milestone update-request email drafting
- Post-meeting action item extraction and vault storage
- CRM task creation (staged with approval)

### Exit Criteria
- [x] Past-due milestones flagged in triage and weekly briefs
- [x] Update-request emails drafted correctly for milestone owners
- [x] Response drafts are good enough that Kate edits ≤2 sentences
- [x] Action items from meetings captured in vault consistently  
- [x] CRM staged writes work through approval queue

### Implementation Notes (Current)
- `update-request.prompt.md` now persists deterministic artifacts to `Daily/{date}-update-requests-{customer-slug}.md` and includes run metadata.
- `scripts/run-update-requests.sh`, `scripts/validate-update-requests.sh`, and `scripts/update-request-repair.sh` provide run/validate/repair automation.
- `meeting-followup.prompt.md` now uses `meeting_file_slug` and writes deterministic follow-up files to `Meetings/{date}-{slug}-followup.md`.
- `scripts/meeting-followup.sh`, `scripts/validate-meeting-followup.sh`, and `scripts/meeting-followup-repair.sh` provide run/validate/repair automation.
- `package.json` includes `update-request:*` and `meeting:followup*` commands for operational usage.

---

## Phase 4: Operating Rhythm & Presentations (Weeks 8-12)

> Weekly ROB, presentation generation, channel summaries.

### Deliverables

| Item | Description |
|------|------------|
| **`.github/prompts/weekly-rob.prompt.md`** | Weekly rhythm-of-business summary |
| **`.github/prompts/pptx-builder.prompt.md`** | Presentation generation workflow |
| **`.github/prompts/winning-wednesdays.prompt.md`** | Channel summary extraction |
| **`_kate/templates/town-hall-deck.md`** | Town hall presentation template |
| **`_kate/templates/customer-engagement.md`** | Customer deck template |

### New Capabilities
- Weekly ROB brief with milestones, pipeline changes, deadlines
- PowerPoint generation from vault + CRM + email context
- Teams channel summary (Winning Wednesdays, deal summaries, win wires)
- Operating rhythm reminders and deadline tracking

### Exit Criteria
- [ ] Weekly ROB brief produced every Sunday night
- [ ] Presentation drafts rated "80% ready" by Kate
- [ ] Channel summaries capture key highlights
- [ ] Operating rhythm reminders fire on correct dates

### Implementation Notes (Current)
- `weekly-rob.prompt.md` contract is implemented with deterministic sections and vault write target.
- `pptx-builder.prompt.md` and `winning-wednesdays.prompt.md` contracts are implemented with deterministic outputs and explicit write targets.
- `town-hall-deck.md` and `customer-engagement.md` templates are present in vault starter.
- PPTX runtime generation path and Teams channel-read validation are not yet verified in live operation.

---

## Phase 5: Expansion & Autonomy (Weeks 12+)

> Higher-trust automation, travel advisory, executive amplification, Teams posting.

### Deliverables

| Item | Description |
|------|------------|
| **Calendar management** | Scheduling coordination (trust escalation) |
| **Teams posting** | Staged posts to channels with approval |
| **Travel advisory** | Itinerary suggestions based on calendar + preferences |
| **Executive amplification** | LinkedIn post recommendations, news surfacing |
| **Routine automation** | Standard follow-ups sent from drafts with one-click approval |

### This Phase Is Shaped by Trust
Phase 5 capabilities are gated on how much trust Kate has built by Phase 4. If she's comfortable with drafts being 95%+ right, some of these can shift toward higher autonomy. If she's still editing frequently, they stay in draft mode.

---

## 9.2 Timeline Summary

```
Week  1: ████ Phase 0 — Foundation (scaffolding + vault setup)
Week  2: ████████ Phase 1 — Morning Triage (inbox + classification)  
Week  3: ████████ Phase 1→2 — Triage refinement + Meeting Prep starts
Week  4: ████████ Phase 2 — Meeting Prep (briefs + cross-system context)
Week  5: ████████ Phase 2→3 — Meeting Prep refinement + CRM starts
Week  6: ████████ Phase 3 — CRM + Drafting (milestones, email drafts)
Week  7: ████████ Phase 3 — CRM + Drafting (action tracking, follow-ups)
Week  8: ████████ Phase 3→4 — CRM refinement + Operating Rhythm starts
Week  9: ████████ Phase 4 — ROB + Presentations
Week 10: ████████ Phase 4 — Presentations + Channel summaries
Week 11: ████████ Phase 4 — Refinement and template tuning
Week 12: ████████ Phase 4→5 — Trust assessment + expansion planning
```

---

## 9.3 What Kate Needs to Provide

| Phase | Kate's Input |
|-------|-------------|
| 0 | VIP list, operating rhythm, 3-5 example emails, style preferences |
| 1 | Daily review of triage briefs for 1 week, corrections |
| 2 | Feedback on 5+ meeting briefs, template preferences |
| 3 | Review draft emails, rate quality, define milestone tracking rules |
| 4 | Presentation templates/examples, ROB format preferences |
| 5 | Trust assessment — what's ready for higher autonomy? |

---

*Previous: [← Non-Technical User Experience](./08-user-experience.md) · Next: [Open Questions →](./10-open-questions.md)*
