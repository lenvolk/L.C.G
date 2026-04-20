---
name: role-execution-router
description: "General-purpose task→role execution router. Maps user intents, scenarios, sales programs, and complex multi-role workflows to the right roles with execution responsibilities, handoff patterns, and coordination protocols. Extensible framework for capturing nuanced internal process work. Triggers: who should do this, which role, task assignment, role routing, execution plan, program execution, MACC execution, Unified program, co-sell motion, partner motion, sales program, multi-role workflow, coordination plan, who owns, who leads, who contributes, role responsibility, process routing, program playbook, engagement model, cross-team coordination, swarming plan, escalation routing."
---

# Role Execution Router

## Purpose

General-purpose dispatcher that resolves **"who does what"** for any scenario, task, sales program, or multi-role workflow. Use this skill when:

- The user's request spans multiple roles or the owning role is ambiguous
- A sales program or GTM motion needs role-specific execution guidance
- A complex internal process requires coordination across teams/units
- You need to generate an execution plan with named role responsibilities

This skill **does not replace** individual role cards or MCEM flow — it references them. It sits above them as a routing and coordination layer.

## Resolution Order

1. **Identify the scenario category** (§ Scenario Classification)
2. **Map to role responsibilities** (§ Task→Role Matrix or § Program Playbooks)
3. **Determine coordination model** (§ Coordination Patterns)
4. **Load role card** for the primary role (`role-se`, `role-specialist`, etc.) for boundary rules
5. **Load MCEM flow** if stage context is relevant

---

## Role Registry (Compact Reference)

| Role | Unit | Primary Domain | Stage Accountability |
|---|---|---|---|
| **AE** | ATU | Customer relationship, strategic planning, pipeline generation, MACC execution | Stage 1 lead |
| **ATS** | ATU | AI/Security strategy, technology relationship, technical team orchestration | Stage 1-2 lead, Stage 5 lead |
| **IA** | ATU | Industry use cases, Stage 1 pipeline creation, industry partner sales | Stage 1 contributor |
| **SD** | ATU | Team coaching, pipeline governance, MACC budget, operational excellence | Cross-stage leadership |
| **Specialist** | STU | Pipeline creation, opportunity ownership, Stages 2-3 progression, forecast hygiene | Stages 2-3 lead |
| **SE** | STU | Technical proof execution, HoK engagement, activity tracking | Stage 3 lead (technical) |
| **CSA** | CSU | Architecture feasibility, execution readiness, technical integrity | Stages 4-5 lead (technical) |
| **CSAM** | CSU | Customer success orchestration, governance cadence, outcome realization | Stages 4-5 lead (orchestration) |

---

## Scenario Classification

Classify the user's intent into one of these categories before routing:

| Category | Signal Phrases | Primary Router |
|---|---|---|
| **Pipeline Creation** | new opportunity, qualify lead, create pipeline, Stage 1, inbound signal | § Pipeline & Qualification |
| **Deal Progression** | advance stage, move forward, proof plan, technical win, commit | § Deal Progression |
| **Delivery & Execution** | execute milestone, deliver, implement, HoK, hands-on | § Delivery & Execution |
| **Governance & Hygiene** | review pipeline, forecast, weekly update, status check, hygiene | § Governance & Hygiene |
| **Sales Program** | MACC, Unified, co-sell, partner motion, EDE, skilling | § Program Playbooks |
| **Customer Success** | adoption, usage, value realization, health, renewal | § Customer Success |
| **Cross-Role Coordination** | swarming, handoff, escalation, who owns, conflicting direction | § Coordination Patterns |
| **Leadership & Coaching** | team review, coaching, performance, talent, pipeline governance | § Leadership Operations |

---

## Task→Role Matrix

### Pipeline & Qualification

| Task | Primary | Contributing | Approving | Skill Chain |
|---|---|---|---|---|
| Qualify inbound signal | AE + IA | ATS, Specialist | — | `pipeline-qualification` |
| Create Stage 1 opportunity | AE | ATS, IA | — | `pipeline-qualification` |
| Industry-led pipeline creation | IA | AE | IAM (approve allocation) | `pipeline-qualification` |
| Stage 1→2 progression | Specialist | AE, ATS | — | `pipeline-qualification`, `customer-outcome-scoping` |
| BANT qualification | Specialist + SE | AE | — | `proof-plan-orchestration` |
| Partner-sourced lead intake | AE | IA, Specialist | — | `pipeline-qualification`, `shared-patterns` § Partner |
| Customer outcome scoping | Specialist | AE, ATS | Customer | `customer-outcome-scoping` |
| Technology strategy assessment | ATS | AE | — | `role-ats` |
| Account plan creation/refresh | AE | ATS, CSAM, SD | — | `role-ae` |

### Deal Progression

| Task | Primary | Contributing | Approving | Skill Chain |
|---|---|---|---|---|
| Create milestone | Specialist | SE (technical input) | — | `write-gate` |
| Design proof plan (POC/Pilot/Demo) | SE | Specialist, CSA | — | `proof-plan-orchestration` |
| Position HoK engagement | SE | Specialist | Legal (coverage) | `hok-readiness-check` |
| Architecture feasibility review | CSA | SE | — | `architecture-review` |
| Stage 2→3 progression | Specialist | SE, CSA | — | `mcem-diagnostics` |
| Commitment gate check | Specialist | CSA, CSAM | — | `commit-gate-enforcement` |
| STU→CSU handoff | Specialist | SE, CSA, CSAM | CSAM (accept) | `handoff-readiness-validation` |
| Update opportunity fields (stage, close date, revenue) | Specialist | — | — | `write-gate` |
| Update milestone structure (name, date, monthlyUse) | Specialist | CSAM (co-owns Stage 4-5) | — | `write-gate` |
| Manage deal team membership | Specialist | — | — | `write-gate` |

### Delivery & Execution

| Task | Primary | Contributing | Approving | Skill Chain |
|---|---|---|---|---|
| Execute technical proof | SE | CSA | — | `proof-plan-orchestration` |
| Execute HoK session | SE | — | Legal (pre-cleared) | `hok-readiness-check` |
| Record SE activity (born-closed task) | SE | — | — | `role-se-ms-activities` |
| Delivery accountability mapping | CSAM | CSA, Partner/ISD | — | `delivery-accountability-mapping` |
| Milestone execution tracking | CSAM | CSA | — | `milestone-health-review` |
| Architecture guardrail enforcement | CSA | CSAM | — | `se-execution-check` |
| Partner/ISD delivery coordination | CSAM | CSA | — | `delivery-accountability-mapping` |
| Unified Support dispatch | CSAM | CSA (eligibility) | — | `se-execution-check` |

### Governance & Hygiene

| Task | Primary | Contributing | Approving | Skill Chain |
|---|---|---|---|---|
| Weekly pipeline review | Specialist | SE, SD | — | `pipeline-hygiene-triage` |
| Weekly milestone governance | CSAM | CSA | — | `milestone-health-review` |
| Forecast preparation | Specialist | AE | SD (sign-off) | `pipeline-hygiene-triage` |
| Task hygiene audit | SE | — | — | `se-execution-check` |
| Pipeline coverage review | SD | AE, Specialist | — | `role-atu-sd` |
| Deal risk assessment | CSA + CSAM | Specialist | — | `risk-surfacing` |
| MCEM stage diagnostic | CSA | Specialist, CSAM | — | `mcem-diagnostics` |
| CRM field completeness check | Specialist | — | — | `pipeline-hygiene-triage` |
| Morning briefing | Any (user's role) | — | — | `morning-brief` |

### Customer Success

| Task | Primary | Contributing | Approving | Skill Chain |
|---|---|---|---|---|
| Adoption health review | CSAM | CSA | — | `stage-5-review` |
| Value realization measurement | CSAM | CSA, AE | Customer | `stage-5-review` |
| Expansion signal routing | CSAM (timing) | Specialist (pipeline) | — | `stage-5-review` |
| Success plan maintenance | CSAM | AE, ATS | — | `role-csam` |
| Customer QBR preparation | AE | ATS, CSAM | — | `role-ae`, `milestone-health-review` |
| Renewal execution | AE | CSAM, ATS | — | `role-ae` |

### Leadership Operations

| Task | Primary | Contributing | Approving | Skill Chain |
|---|---|---|---|---|
| Pipeline governance meeting | SD | AE, Specialist | — | `role-atu-sd` |
| Account team coaching | SD | — | — | `role-atu-sd` |
| Red Carpet compliance | SD | AE | — | `role-atu-sd` |
| Cusp customer leadership brief | SE | SD | — | `hok-readiness-check` |
| Account plan sign-off | SD | AE, ATS | — | `role-atu-sd`, `role-ae` |
| IA engagement allocation | IAM | IA | — | `role-ia` |

---

## Program Playbooks

Extensible section — each program defines the role-specific execution model.

### MACC (Microsoft Azure Consumption Commitment)

| Phase | AE | ATS | Specialist | CSAM | CSA | SD |
|---|---|---|---|---|---|---|
| **Origination** | Lead — negotiate MACC with customer | Support — consumption plan scoping | Support — pipeline backing the MACC | Inform | — | Coach — MACC target tracking |
| **Consumption Plan** | Accountable — ensure plan exists in MSX | Lead — build consumption plan with AE | Contribute — milestone-level consumption mapping | Contribute — delivery feasibility | — | Review — sign off on plan quality |
| **Execution** | Monitor — overall MACC health | Monitor — consumption vs plan | Execute — drive pipeline through stages | Execute — milestone delivery for consumption | Execute — technical delivery | Govern — weekly MACC tracking |
| **Risk Mgmt** | Escalate — customer relationship issues | Escalate — technology blockers | Escalate — pipeline gaps to MACC | Escalate — delivery blockers | Escalate — architecture constraints | Escalate — team performance gaps |

**Key rules:**
- Every MACC must have a consumption plan in MSX (AE accountable, ATS builds)
- MACC with Unified attached is the expectation (AE positions)
- SD tracks MACC VTB (variance to budget) weekly
- Pipeline must be 2-3x MACC value for coverage (Specialist maintains)

### Unified Support

| Phase | AE | CSAM | CSA | SE | Specialist |
|---|---|---|---|---|---|
| **Positioning** | Lead — attach Unified to every deal | Support — customer value articulation | — | — | Support — include in solution scope |
| **Dispatch readiness** | — | Lead — orchestrate dispatch request | Validate — accreditation/eligibility | Validate — technical prerequisites | — |
| **EDE allocation** | — | Coordinate — align EDE to customer TPID | Consume — leverage EDE for technical depth | Consume — leverage EDE for proof support | — |
| **Escalation** | Escalate — commercial issues | Escalate — dispatch/delivery issues | Escalate — technical capability gaps | — | — |

**Key rules:**
- EDE is tracked in vault `## Unified Coverage`, not CRM
- Dispatch readiness requires accreditation proof (CSA/SE validate)
- CSAM owns Unified expectation management; CSA owns technical eligibility check
- Load `se-execution-check` for Unified constraint validation

### Co-Sell & Partner Motion

| Phase | AE | Specialist | SE | CSA | CSAM | IA |
|---|---|---|---|---|---|---|
| **Lead intake** | Receive — partner-sourced inbound | Qualify — commercial fit | — | — | — | Receive — industry ISV leads |
| **Deal registration** | Approve — co-sell deal registration | Execute — opportunity creation with partner flag | — | — | — | — |
| **Joint selling** | Orchestrate — customer relationship | Lead — pipeline progression | Execute — joint proof if needed | Review — architecture alignment | — | Contribute — industry positioning |
| **Partner delivery** | — | — | — | Validate — partner technical capability | Coordinate — partner execution | — |
| **Attribution** | — | Record — co-sell attribution in CRM | — | — | Track — partner delivery outcomes | Track — ISV ACR growth |

**Key rules:**
- Partner-sourced leads follow standard qualification but flag `co-sell` attribution
- Partner delivery requires CSA technical validation before commitment
- IA targets >30% of created opportunities shared with partners
- See `shared-patterns` § Partner Motion Adjustments for full rules

### HoK (Hands-on-Keyboard)

| Phase | SE | Specialist | CSA | CSAM | Legal |
|---|---|---|---|---|---|
| **Positioning** | Lead — position with every client | Support — align to opportunity | — | — | — |
| **Legal gate** | Request — legal coverage confirmation | — | — | Coordinate — customer legal alignment | Approve — legal coverage in place |
| **Scoping** | Lead — define environment, tier, acceptance criteria | Contribute — milestone alignment | Review — architecture constraints | — | — |
| **Execution** | Execute — hands-on work in customer environment | — | Monitor — architecture guardrails | — | — |
| **Recording** | Record — born-closed task with environment tier | — | — | — | — |
| **Cusp identification** | Flag — uncertain customers for leadership | — | — | — | — |

**Key rules:**
- Legal coverage MUST be confirmed before any customer environment work
- SE positions HoK with every client — this is an expectation, not optional
- Cusp customers require SD/leadership discussion before next steps
- Load `hok-readiness-check` for full gate validation

### Account Planning

| Phase | AE | ATS | SD | CSAM | Specialist | IA |
|---|---|---|---|---|---|---|
| **Plan creation** | Lead — own the account plan | Co-lead — technology strategy sections | Coach — quality review | Contribute — success plan inputs | Contribute — pipeline view | Contribute — industry use cases |
| **Executive mapping** | Lead — C-level relationship strategy | Lead — TDM/ITDM engagement | Coach — relationship breadth | Support — operational stakeholders | — | Support — industry persona mapping |
| **QBR execution** | Lead — customer-facing QBR | Contribute — technology progress | Review — pre-QBR coaching | Contribute — delivery status, adoption metrics | Contribute — pipeline status | — |
| **Plan refresh** | Lead — quarterly refresh | Contribute — technology landscape update | Sign off — quality gate | Contribute — outcome tracking | Contribute — pipeline refresh | Contribute — industry signal update |

**Key rules:**
- Account plan must be updated quarterly (SD signs off)
- Customer Secure AI Assessment owned by ATS, shared with v-team
- AE drives Executive Sponsor strategy for every strategic account
- SD reviews plans using quality guidance tools

### Skilling & Readiness Programs

| Program | Primary Owner | Cadence | Tracking | Governance |
|---|---|---|---|---|
| Skilling plans (FRI) | Individual (all roles) | Quarterly | https://aka.ms/FRI | SD monitors completion |
| TRW (Technical Readiness Week) | ATS | Annual + ongoing | Completion % | SD tracks |
| SE Readiness Backpack | SE | Ongoing | Per solution play | SE Manager |
| AI/Security certifications | ATS, CSA | As released | Cert tracker | SD + CSA Manager |
| MCEM coaching | SD | Weekly 1:1s | Coaching log | SD self-governed |
| Red Carpet compliance | AE | Per transition | Red Carpet tool | SD enforces 100% |

---

## Coordination Patterns

### Pattern 1: Serial Handoff

Used when work transitions cleanly between roles across MCEM stages.

```
[Role A completes scope] → [Handoff artifact] → [Role B accepts and continues]
```

| Handoff | From | To | Artifact Required | Validation Skill |
|---|---|---|---|---|
| Qualification → Pipeline | AE/IA | Specialist | Qualified opportunity with outcomes | `pipeline-qualification` |
| Pipeline → Technical Win | Specialist | SE | Proof plan with success criteria | `proof-plan-orchestration` |
| Technical Win → Commitment | SE | Specialist | Proof results + technical decision record | `commit-gate-enforcement` |
| STU → CSU | Specialist/SE | CSAM/CSA | Handoff checklist (why bought, success criteria, scope) | `handoff-readiness-validation` |
| Delivery → Optimization | CSAM/CSA | CSAM + Specialist | Adoption data + expansion signals | `stage-5-review` |

### Pattern 2: Parallel Swarming

Used when multiple roles work simultaneously on the same account or opportunity.

```
[Trigger: account review reveals adjacent pipeline]
  ├─ Specialist: opportunity management for own solution area
  ├─ SE: technical proof for own milestones
  ├─ CSA: architecture alignment across solutions
  └─ AE: customer relationship orchestration across all threads
```

**Rules:**
- AE or SD identifies swarming opportunity
- Each role maintains their lane per boundary rules
- CSA ensures cross-solution architecture coherence
- Load `account-landscape-awareness` for swarming detection

### Pattern 3: Escalation Chain

Used when a blocker requires authority beyond the current role.

| Blocker Type | First Escalation | Second Escalation | Resolution Owner |
|---|---|---|---|
| Technical feasibility | CSA | SE Manager | CSA (final authority) |
| Customer expectation | CSAM | AE | CSAM communicates, AE intervenes |
| Pipeline quality | Specialist | SD | SD coaches, Specialist executes |
| Delivery resourcing | CSAM | SD → GPS Lead | CSAM orchestrates |
| Legal/compliance | SE/CSAM | Legal team | Legal (final authority) |
| Commercial terms | AE | SD → Commercial Exec | AE negotiates |
| Partner capability | CSA | PDM | CSA validates, PDM resolves |

### Pattern 4: Write-Gate Coordination

Used when a CRM write requires cross-role alignment.

```
[Requesting role stages write] → [write-gate validates authority] → [Approving role confirms] → [Execute]
```

- Always validate role authority against `write-gate` § Role-Action Authority Matrix
- Cross-role writes (e.g., SE flagging milestone gap to Specialist) are staged as recommendations, not direct writes
- Load `write-gate` for the full confirmation protocol

### Pattern 5: Program-Triggered Multi-Role Activation

Used when a sales program or GTM motion activates work across multiple roles simultaneously.

```
[Program trigger] → [Dispatch role responsibilities from § Program Playbooks]
  ├─ Each role receives their phase-specific tasks
  ├─ Coordination owner tracks cross-role dependencies
  └─ SD/AE governs overall program cadence
```

---

## Intent Resolution Protocol

When the user's request doesn't map cleanly to one category:

### Step 1: Decompose

Break the request into atomic tasks. Each task maps to one row in the Task→Role Matrix.

### Step 2: Identify the anchor role

The anchor role is the one that owns the **most critical** subtask. This becomes the primary execution role.

### Step 3: Build the execution plan

```
Execution Plan: [Scenario Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Anchor Role: [Role]
MCEM Stage: [Stage or Cross-stage]

Step 1: [Task] → [Primary Role] (skill: [skill-name])
Step 2: [Task] → [Primary Role] + [Contributing Role] (skill: [skill-name])
Step 3: [Task] → [Primary Role] (skill: [skill-name])

Dependencies: Step 2 requires Step 1 output
Coordination: [Pattern name from § Coordination Patterns]
Program context: [If a program playbook applies, cite it]
```

### Step 4: Load role cards

For each unique role in the plan, load the role card skill to verify boundary rules and hard blocks.

### Step 5: Present and execute

Present the plan to the user. If write operations are involved, follow the write-gate protocol.

---

## Extensibility

### Adding a New Program Playbook

To add a new sales program, GTM motion, or internal process:

1. **Define phases** — what are the sequential or parallel stages of the program?
2. **Map roles per phase** — who leads, contributes, approves, and monitors at each phase?
3. **Identify key rules** — what are the hard constraints, gates, or compliance requirements?
4. **Cite skill chain** — which existing skills support execution at each phase?
5. **Add the playbook** to § Program Playbooks following the existing table format.

### Adding a New Scenario

To add a new scenario type:

1. **Add signal phrases** to § Scenario Classification
2. **Add task rows** to the appropriate section of § Task→Role Matrix
3. **Define coordination pattern** if the scenario requires multi-role coordination not covered by existing patterns

### Adding a New Role

1. **Create the role card** skill (`role-{name}/SKILL.md`)
2. **Add to § Role Registry** with unit, domain, and stage accountability
3. **Update Task→Role Matrix** rows where the new role participates
4. **Update Program Playbooks** with the new role's responsibilities

---

## Cross-References

| Need | Load |
|---|---|
| MCEM stage identification | `mcem-diagnostics` or `mcem-flow` |
| Individual role boundaries | `role-se`, `role-specialist`, `role-csa`, `role-csam`, `role-ae`, `role-ats`, `role-ia`, `role-atu-sd` |
| CRM write authorization | `write-gate` |
| Shared definitions and conventions | `shared-patterns` |
| Account-wide pipeline visibility | `account-landscape-awareness` |
| Risk detection across signals | `risk-surfacing` |
