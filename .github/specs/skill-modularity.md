# Skill Modularity Spec

**Status:** Draft  
**Date:** 2026-04-20  
**Scope:** `.github/skills/`, `.github/prompts/`, `SKILLS.md`

---

## Design Target: SE as the Front Door, SQL Modernization as the Front Door to AI

Lindsey's core message has two interlocking parts:

**1. SE is the front door for all technical engagements.** Account teams too often bypass SEs and go straight to FDEs or other costly resources without clear intent — creating inefficiency, unnecessary escalations, and poor customer experience. Every technical engagement request should start with the SE, who qualifies the scenario, understands customer cost and readiness, and deliberately routes to the right resource (CSA, FDE, Engineering, ISD, OCTO) only when warranted.

**2. SQL modernization is the front door to AI.** Teams under-prioritize SQL modernization even though it is critical to unlocking scalable, governed AI adoption. The SE should consistently drive SQL modernization as the foundational motion — not as a separate "database" conversation, but as the prerequisite that makes AI outcomes possible.

The desired behavior:

1. **SE is the front door.** Every technical engagement request flows through the SE first.
2. **Qualify before routing.** The SE assesses customer context (pipeline status, cost exposure, engagement history, at-risk signals, SQL footprint) before involving other resources.
3. **SQL modernization = AI readiness.** When a customer has SQL on-prem footprint (SQL Cores > 0) but no modernization pipeline, the SE doesn't just flag it — they position SQL modernization as the path to AI, with concrete next steps.
4. **Deliberate routing, not escalation-first.** Routing to CSA/FDE/Engineering/ISD/OCTO happens only when the SE has confirmed the scenario warrants it, with a clear rationale.
5. **Next steps over raw data.** Output emphasizes concise, action-oriented recommendations — especially for at-risk or zero-pipeline accounts — not data dumps that leave the team guessing.

### Why this requires modularity

Building this with today's skill structure would mean creating another 300+ line monolith that re-inlines SE boundary rules, HoK gates, activity-recording protocols, CRM query patterns, routing decision trees, and SQL modernization context — all of which already exist (in duplicate or isolation) across `role-se`, `role-se-execution-check`, `role-se-ms-activities`, `role-execution-router`, `powerbi-sql600-hls`, and `sql600-tagging-audit`.

The SQL600 skills are a sharp example of the problem. `powerbi-sql600-hls` produces excellent portfolio data (ACR, pipeline, gap accounts, modernization coverage). `sql600-tagging-audit` produces excellent exception data (mistagged opps, gap accounts, wins). The `generate-next-steps.js` helper already generates action-oriented next steps per account. But none of this connects back to the SE's engagement-intake decision. An SE qualifying a technical request for a SQL600 account today has no way to compose "check this customer's SQL readiness" + "route the engagement" + "recommend SQL modernization as the AI path" without manually loading 3+ skills worth of context.

With the modular architecture below, the **engagement intake** workflow can be built as a thin ~120-line skill that **composes** existing pieces:
- `role-se` lens → authority and boundary rules
- `_shared/engagement-routing-rules.md` → qualification criteria and routing decision tree
- `_shared/sql-modernization-lens.md` → SQL-as-AI-front-door positioning rules (shared with SQL600 skills)
- `_shared/next-steps-output-shape.md` → action-oriented output format
- `execution-check` workflow → customer pipeline and task context
- `powerbi-sql600-hls` → SQL footprint and modernization coverage (when customer is SQL600)
- `activity-recording` workflow → log the intake and routing decision as a CRM activity

No new duplication. One decision tree to maintain. The SQL modernization lens is written once and consumed by engagement-intake, the SQL600 readout, and the tagging audit. Ad-hoc promptable: *"route this Contoso technical request"* or *"what's the SQL modernization play for Blue KC?"* compose the same pieces without loading monoliths.

---

## Problem Statement

Skills carry duplicated policy across files because there is no formal separation between **what a role is allowed to do**, **how a workflow executes**, and **reusable domain rules**. This creates three concrete costs:

1. **Token waste** — The same rules (HoK legal gate, born-closed protocol, Unified constraints, write-gate authority, MCEM stage tables) are restated in 2–4 skills each. Every skill load pays for content the model already received from a sibling skill in the same session.
2. **Drift risk** — When a rule changes (e.g. commit-gate criteria), every file that inlines it must be updated. Today there is no single-source-of-truth enforcement beyond `verify-instructions.js` checksums, which detect change but not inconsistency.
3. **Composition friction** — Ad-hoc prompting (e.g. "scan last week and log SE activities for Blue KC only") requires loading `role-se-ms-activities` in full, even though the user only needs the activity-recording workflow scoped by a role lens. Skills can't be mixed-and-matched because each one bundles its own copy of cross-cutting policy.

### Evidence

| Duplicated content | Appears in | Lines duplicated (approx) |
|---|---|---|
| SE born-closed / activity-record protocol | `role-se` §Activity Tracking, `role-se-ms-activities` §Core Principle, `role-se-execution-check` §Task Hygiene | ~30 lines × 3 |
| HoK legal gate rules | `role-se` §HoK Mandate, `role-se-ms-activities` §Prerequisites, `role-se-execution-check` §Task Hygiene, `deal-lifecycle` §4 Commit Gate, `role-execution-router` §HoK Playbook | ~15 lines × 5 |
| Unified constraint checks | `deal-unified-check` (full skill), `role-se-execution-check` §Unified Constraints, `role-execution-router` §Unified Playbook | ~40 lines × 3 |
| MCEM stage spine | `deal-lifecycle` §1, `role-execution-router` §Role Registry + §Task→Role Matrix | ~60 lines × 2 |
| Write-gate authority references | `role-se` §Boundary Rules, `role-se-ms-activities` §Prerequisites, `deal-lifecycle` §Boundaries, `role-execution-router` cross-refs | ~10 lines × 4 |
| Role boundary hard-blocks (SE) | `role-se` §Hard Blocks, `role-se-ms-activities` anti-patterns, `role-se-execution-check` implicit | ~12 lines × 3 |
| SQL600 HLS scope filter + config | `powerbi-sql600-hls` §Configuration, `sql600-tagging-audit` §Configuration | ~15 lines × 2 |
| Gap account / zero-pipeline rules | `powerbi-sql600-hls` §Decision Logic, `sql600-tagging-audit` §Step 4, `engagement-routing-rules` (new) | ~20 lines × 3 |
| SQL modernization positioning narrative | `powerbi-sql600-hls` §Step 3 synthesis rules, `sql600-tagging-audit` gap account action, `generate-next-steps.js` prompt | ~15 lines × 3 |

**Total duplicated surface**: ~600–800 lines across 35+ skills that could be reduced to single-source references.

---

## Design Constraints

Any refactor must work within these existing mechanisms — not invent new ones.

| Mechanism | How it works | Constraint |
|---|---|---|
| **Skill discovery** | VS Code matches user intent against `description` in YAML frontmatter. Each `SKILL.md` is a standalone discovery target. | Cannot merge skills into one file just to deduplicate — each discoverable unit needs its own `SKILL.md` with a distinct description. |
| **Progressive disclosure** | `SKILL.md` is the orchestrator (<500 lines). Detail lives in `references/*.md`, loaded on demand via `read_file`. One level deep. | Already the right pattern. Spec extends it to cross-skill shared references. |
| **Prompt → skill composition** | `.prompt.md` files say "load skill X" in their steps. Skills say "chain to skill Y" in `Chained Skills` tables. | Composition is explicit and textual — no runtime registry. Refactoring must preserve these chains. |
| **Agent tool scoping** | `.agent.md` files define which tools an agent can use. Skills reference MCP tools by qualified name. | Skill refactoring doesn't affect agent definitions. |
| **Integrity checking** | `verify-instructions.js` checksums all `.md` files under `.github/instructions/` and `.github/skills/`. | New files are automatically covered. Renames show up as add+delete in verification. |
| **Vault sync** | `setup-vault.js` copies `.github/skills/` → `sidekick/skills/` in the vault. | Folder structure changes propagate automatically. |
| **SKILLS.md index** | Manual index with domain groupings and "I want to…" lookup table. | Must be updated when skills are renamed, split, or consolidated. |

---

## Proposal: Three-Layer Skill Architecture

Skills are classified into exactly three types. Classification is declared in frontmatter via a new `kind` field. Discovery, loading, and progressive disclosure all work the same way — `kind` is metadata for humans and for the authoring/audit process, not a runtime dispatch mechanism.

### Layer 1: Domain Workflows

**What they are:** Executable procedures that do one thing. Role-agnostic by default.

**Naming:** Align to existing patterns in the skills directory. Existing names stay. New workflows use the established `{domain}-{noun}` convention (e.g., `deal-milestone-review`, `engagement-intake`).

**Structure:**
```
skill-name/
├── SKILL.md              # Flow, decision logic, output schema (<500 lines)
└── references/           # On-demand detail
    ├── classification.md
    └── field-mapping.md
```

**Rules:**
- A workflow skill NEVER inlines role-specific boundary rules. It references role lenses via a `## Role Lens` section that says: *"Load the active role card for authority checks before CRM writes."*
- A workflow skill NEVER restates cross-cutting policy (HoK gate, write-gate, born-closed). It references shared policy packs.
- A workflow skill MAY have role-specific **modes** (e.g. `execution-check` has SE-mode vs CSA-mode) but the mode logic is: "if role = SE, apply constraints from `role-se`" — not a copy of those constraints.

**Examples (current → proposed):**

| Skill | Change |
|---|---|
| `role-se-ms-activities` | Slim: move restated SE policy (born-closed, HoK gate) to `_shared/` references. Keep name + structure. |
| `role-se-execution-check` | Slim: move restated Unified constraints and born-closed rules to `_shared/` references. Keep name + structure + modes. |
| `deal-unified-check` | No change. Already a clean workflow. |
| `deal-milestone-review` | No change. Already a clean workflow. |
| `deal-portfolio-review` | No change. Already a clean workflow. |
| `powerbi-sql600-hls` | No structural change. Gains access to `_shared/sql-modernization-lens.md` for positioning narrative. Detection rules stay in `sql600-tagging-audit/detection-rules.md` (see § Sales Program Awareness). |
| `sql600-tagging-audit` | No structural change. `detection-rules.md` promoted to `_shared/` so all roles can reference SQL workload patterns and sales play expectations. |
| *(new)* `engagement-intake` | SE front-door workflow — qualifies technical engagement requests, checks customer context (incl. SQL footprint), routes to the right resource. See § Engagement Intake Workflow. |

### Layer 2: Role Lenses

**What they are:** Boundary declarations for a specific role. They define what a role CAN do, CANNOT do, and how generic workflows are constrained when invoked by that role. They are NOT workflows — they have no `## Flow` section.

**Naming:** `role-{name}` (unchanged).

**Structure:**
```
role-{name}/
├── SKILL.md              # Identity, authority, boundaries, escalation (<200 lines)
└── references/           # Optional: extended boundary tables, examples
```

**Rules:**
- A role lens declares: mission, MCEM stage accountability, ownership scope, boundary rules (hard blocks), escalation triggers, and a **Cross-Workflow Lens** table mapping which workflows this role uses and how it constrains them.
- A role lens NEVER contains a `## Flow` section or MCP tool call sequences.
- A role lens NEVER restates workflow logic. It says *"When running `activity-recording`, SE tasks are born-closed per `shared/born-closed-protocol.md`"* — not a full restatement.
- The Cross-Workflow Lens table replaces the current "Cross-Role Skill Lens" table but is more precise:

```markdown
## Cross-Workflow Lens

| Workflow | SE Constraints |
|---|---|
| `engagement-intake` | SE is the front door. Qualify scenario and customer context before routing to any other resource. Load `_shared/engagement-routing-rules.md`. |
| `role-se-ms-activities` | Born-closed only. Future activities → defer. Load `_shared/born-closed-protocol.md`. |
| `role-se-execution-check` | Run in SE mode. Open tasks are anomalies. HoK tasks require legal gate. |
| `deal-unified-check` | Validate technical prerequisites; dispatch coordination → CSAM. |
| `powerbi-sql600-hls` | SQL modernization framing per `_shared/sql-modernization-lens.md`. Surface gap accounts with AI-readiness context. |
| `sql600-tagging-audit` | Sales play tagging governance. SE should be aware of detection rules for SQL workload patterns (`_shared/sql600-detection-rules.md`). |
```

**Examples:**

| Current | Change |
|---|---|
| `role-se` (105 lines) | Slim to ~90 lines. Reframe mission: front door for technical engagement + proof executor. Remove restated protocols. Add Cross-Workflow Lens with `engagement-intake` as first entry and SQL600 program awareness. Reference shared policy packs. |
| (not yet created) `role-specialist`, `role-csa`, `role-csam` | Future role cards follow the same template. All roles reference `_shared/sql600-detection-rules.md` for SQL program awareness. |

### Layer 3: Shared Policy Packs

**What they are:** Single-source-of-truth reference files for cross-cutting rules that multiple skills need. They are NOT standalone skills — they have no `SKILL.md` and are never discovered via description matching. They are loaded by workflows and role lenses via `read_file`.

**Location:** `.github/skills/_shared/` (underscore prefix signals "not a skill, not discoverable").

**Structure:**
```
_shared/
├── write-gate-authority.md         # Role-Action Authority Matrix (every role)
├── mcem-stage-spine.md             # Stage table + exit criteria (every role)
├── confirmation-packet.md          # Standard confirmation format for CRM writes (every role)
├── next-steps-output-shape.md      # Action-oriented output format: next steps first, context second (every workflow)
├── engagement-routing-rules.md     # SE front-door qualification criteria + routing decision tree
├── sql-modernization-lens.md       # SQL modernization as AI front door: positioning rules, gap account framing
└── sql600-detection-rules.md       # SQL workload patterns + expected sales play values (promoted from sql600-tagging-audit/detection-rules.md)
```

> **Note on SE-specific protocols:** `born-closed-protocol` and `hok-legal-gate` stay inside `role-se/` as role-specific references (not `_shared/`) because they apply to one role only. If future roles need them, promote at that point.

> **Note on `sql600-detection-rules.md`:** This is the current `sql600-tagging-audit/detection-rules.md` promoted to `_shared/` because **every role** should be aware of SQL workload patterns, expected sales play mappings, and the Catalyst coaching scope. The tagging audit skill's own `detection-rules.md` becomes a symlink or re-export: `→ read_file("_shared/sql600-detection-rules.md")`. This means Specialists checking pipeline, AEs reviewing account plans, and CSAMs monitoring delivery all have access to the same SQL program taxonomy without loading the full tagging audit skill.

> **Note on CRM query patterns:** The staged-parallel pattern and rate limit guardrails in the engagement-intake flow (Stage A→B→C) follow the same conventions already established in `vault-sync` Mode 1 (OR-chain 15 GUIDs, parallel batches), `sql600-tagging-audit` (max 10 opp IDs per `list_opportunities`), and `role-se-ms-activities/references/signal-discovery.md` (staged parallel with bounded concurrency). The heavy lifting (join, group, classify, compute signals) happens in `scripts/helpers/resolve-deal-teams.js` — the agent dumps raw CRM JSON to `/tmp` and reads the compact output, same pattern as `classify-sql-pipeline.js` and `audit-sales-play.js`. The agent MUST NOT generate new scripts to parse CRM data.

**Rules:**
- Each file is <100 lines. It contains ONLY the policy/table/rules — no flow, no discovery metadata, no frontmatter.
- Files are referenced like: `→ read_file("_shared/hok-legal-gate.md")` from within SKILL.md or references/.
- Any change to a shared file is immediately visible to all consumers (single edit → universal effect).
- `verify-instructions.js` already covers these (it scans all `.md` under `.github/skills/`).

---

## Frontmatter Extension

Add `kind` to skill frontmatter. Optional for now; required for new skills.

```yaml
---
name: engagement-intake
kind: workflow                    # workflow | role-lens
description: '...'
argument-hint: '...'
---
```

- `kind` is informational — VS Code ignores unknown frontmatter fields.
- Shared packs in `_shared/` have no frontmatter (they are not discoverable skills).
- Composition is documented in prose via existing `Chained Skills` tables — no structured `composes` block needed.

---

## Router Simplification

`role-execution-router` is currently 390 lines because it embeds program playbooks and full Task→Role matrices. Under this spec:

- **Keep** the Scenario Classification table and Resolution Order (routing logic).
- **Keep** the Role Registry (compact reference).
- **Add** a new **Technical Engagement Intake** category to § Scenario Classification — signal phrases: *"route this engagement", "who should handle this", "technical request", "customer needs help", "engagement intake"*. Primary router: `engagement-intake` workflow.
- **Move** Program Playbooks (MACC, Unified, Co-Sell, HoK, Account Planning, Skilling) to `_shared/program-playbooks/` as individual files, loaded on demand.
- **Move** the full Task→Role Matrix detail to `references/task-role-matrix.md` (one level deep from SKILL.md).
- **Target**: SKILL.md < 150 lines — a true router, not an encyclopedia.

---

## Engagement Intake Workflow (new skill)

This is the concrete deliverable the modularity spec unlocks. It implements Lindsey's front-door model as a thin, composable workflow.

### Identity

```yaml
---
name: engagement-intake
kind: workflow
description: >
  SE front-door for technical engagement requests. Qualifies the scenario,
  resolves the deal team from MSX, checks customer pipeline and cost context,
  and routes to the right named person (Specialist, CSA, CSAM, AE, or SE
  handles directly) with a clear rationale and recommended next steps.
  Routes to FDE/Engineering/ISD/OCTO when warranted. Emphasizes action-oriented
  output over raw data. Triggers: route engagement, technical request,
  customer needs help, who should handle this, engagement intake, qualify
  technical ask, route to FDE, route to CSA, should I escalate.
argument-hint: 'Customer name + description of the technical engagement request'
---
```

### Flow (sketch — full detail written at implementation)

**Scope modes:** This workflow handles both single-account ("route this Contoso request") and multi-account ("review all SQL600 gap accounts") invocations. The CRM query strategy below scales from 1 to 43+ accounts.

#### Single-account mode

1. **Identify the customer.** Resolve customer name → TPID. Load vault customer note if available.
2. **Pipeline + deal team in parallel.** Fire both CRM calls simultaneously — they have no dependency on each other:
   - `msx-crm:get_my_active_opportunities({ customerKeyword })` → active opps for this customer
   - `msx-crm:get_milestones({ opportunityIds, statusFilter: "active", format: "triage" })` → milestone context (fires after opp IDs are known)
3. **Resolve deal team.** For each opp, call `msx-crm:manage_deal_team({ action: "list", opportunityId })`. Deduplicate systemuser GUIDs across opps, then batch-resolve names via `crm_query` on `systemusers` (OR-chain up to 15 GUIDs per call). This grounds all routing in **named people**.
4. **Check SQL modernization context (if SQL600 account).** If the customer is on the SQL600 list or has SQL Cores > 0, load `_shared/sql-modernization-lens.md`. Optionally chain to `powerbi-sql600-hls` for live data.
5. **Classify + route.** Apply `_shared/engagement-routing-rules.md`. Map to named deal team members per Step 3.
6. **Format output** per `_shared/next-steps-output-shape.md`.
7. **Optionally record** intake via `role-se-ms-activities`.

#### Multi-account mode (portfolio sweep)

For portfolio-level runs (e.g., "review all SQL600 gap accounts" or "route recommendations for my territory"):

**Design principle: bulk dump → helper script → compact summary.** The agent should NEVER generate new scripts to parse CRM data. It follows the same pattern as the SQL600 tagging audit: dump raw data to `/tmp`, run existing helper scripts to classify/join/summarize, and read only the compact output.

##### New helper: `scripts/helpers/resolve-deal-teams.js`

A new helper script (built once, reused by any skill) that takes raw CRM bulk data and produces a compact, pre-joined summary. The agent never parses deal team JSON inline.

```bash
# Usage:
node scripts/helpers/resolve-deal-teams.js /tmp/intake-opps-$DATE.json

# Or pipe:
cat /tmp/intake-opps-$DATE.json | node scripts/helpers/resolve-deal-teams.js
```

**Input JSON shape** (agent dumps this from CRM bulk calls):
```json
{
  "opportunities": [ ... list_opportunities results ... ],
  "dealTeams": {
    "<oppId>": [ ... manage_deal_team results ... ]
  },
  "milestones": [ ... get_milestones results ... ]
}
```

**Output JSON shape** (compact, agent reads only this):
```json
{
  "generated": "2026-04-20",
  "accounts": [
    {
      "account": "Blue KC",
      "tpid": 123456,
      "opportunities": [
        {
          "oppId": "...",
          "oppName": "...",
          "stage": "Inspire & Design",
          "estimatedValue": 500000,
          "closeDate": "2026-06-30",
          "salesPlay": "Migrate and Modernize Your Estate",
          "milestones": [
            { "name": "...", "status": "active", "dueDate": "2026-05-15", "commitment": "committed" }
          ],
          "dealTeam": {
            "AE": { "name": "Jane Doe", "id": "..." },
            "Specialist": { "name": "John Smith", "id": "..." },
            "SE": { "name": "Jin Lee", "id": "..." },
            "CSA": null,
            "CSAM": { "name": "Pat Kim", "id": "..." }
          }
        }
      ],
      "signals": {
        "hasActivePipeline": true,
        "atRisk": false,
        "closeDateDrift": false,
        "staleStage": false,
        "zeroPipeline": false,
        "missingDealTeamRoles": ["CSA"]
      }
    }
  ],
  "summary": {
    "totalAccounts": 43,
    "accountsWithPipeline": 20,
    "accountsZeroPipeline": 23,
    "accountsAtRisk": 5,
    "accountsMissingCSA": 12,
    "uniquePeople": 65,
    "totalOpps": 80
  }
}
```

**What the script does (offline, no API calls):**
- Joins deal team GUIDs → resolved names (from a `systemusers` lookup the agent passes in, or from a cached map)
- Groups opportunities by account (TPID)
- Classifies deal team roles by `title` field pattern matching (CSA, Specialist, AE, CSAM, SE)
- Computes per-account risk signals (close date drift, stale stage, zero pipeline)
- Flags missing deal team roles
- Produces the compact summary the agent reads (~50 lines for 43 accounts vs ~1MB raw)

##### Pipeline flow

```bash
DATE=$(date +%F)

# 1. Agent bulk-fetches from CRM (3 stages of API calls):
#    Stage A: get_my_active_opportunities → all opps
#    Stage B: manage_deal_team per opp (5 concurrent) + get_milestones (batches of 10)
#    Stage C: crm_query on systemusers (OR-chain 15 GUIDs, all batches parallel)
#    Agent saves combined result to /tmp/intake-opps-$DATE.json

# 2. Helper script joins + classifies (no API calls, instant):
node scripts/helpers/resolve-deal-teams.js /tmp/intake-opps-$DATE.json \
  > /tmp/intake-resolved-$DATE.json

# 3. Agent reads ONLY the compact resolved output (~50 lines)
#    Applies engagement-routing-rules.md per account
#    Formats output per next-steps-output-shape.md
```

**Key benefit:** CRM payloads (1MB+ for 80 opps with deal teams) never enter agent context. Agent reads the ~50-line summary with pre-joined names, pre-computed signals, and pre-grouped accounts. No inline JSON parsing. No generated scripts.

##### CRM bulk retrieval strategy

The agent's CRM calls (Stage A→B→C) follow the same bounded-concurrency pattern as the SQL600 tagging audit:

```
┌─ Stage A (1 call) ────────────────────────────────────────────┐
│  get_my_active_opportunities (all accounts)                   │
│  → save raw to /tmp/intake-opps-raw-$DATE.json                │
│  → extract unique opportunityIds for Stage B                  │
└───────────────────────────────────────────────────────────────┘
         │
┌─ Stage B (parallel, bounded) ─────────────────────────────────┐
│  get_milestones({ opportunityIds })                           │
│    → batch up to 10 opp IDs per call                          │
│    → max 5 concurrent calls                                   │
│                                                               │
│  manage_deal_team({ action: "list", opportunityId })          │
│    → 1 call per opp (no batch API)                            │
│    → max 5 concurrent calls                                   │
│    → collect systemuser GUIDs across all results              │
└───────────────────────────────────────────────────────────────┘
         │
┌─ Stage C (parallel batches) ──────────────────────────────────┐
│  Deduplicate systemuser GUIDs from all deal teams             │
│  crm_query on systemusers — OR-chain up to 15 GUIDs per call │
│    → typically 2-4 batches for 30-60 unique people            │
│    → all batches in parallel                                  │
└───────────────────────────────────────────────────────────────┘
         │
┌─ Agent saves combined JSON ───────────────────────────────────┐
│  { opportunities, dealTeams, milestones, systemusers }        │
│  → /tmp/intake-opps-$DATE.json                                │
└───────────────────────────────────────────────────────────────┘
         │
┌─ Helper script (CPU-only, no API calls) ──────────────────────┐
│  node scripts/helpers/resolve-deal-teams.js                   │
│  → join, group, classify, compute signals                     │
│  → /tmp/intake-resolved-$DATE.json (compact)                  │
└───────────────────────────────────────────────────────────────┘
         │
┌─ Agent reads compact output ──────────────────────────────────┐
│  Apply routing rules per account                              │
│  Format output per next-steps-output-shape.md                 │
└───────────────────────────────────────────────────────────────┘
```

##### Rate limit guardrails

| Constraint | Limit | Rationale |
|---|---|---|
| `manage_deal_team` concurrency | **5 concurrent** | Heaviest call pattern (1 per opp); MSX rate limits at ~60 req/min |
| `get_milestones` batch size | **10 opp IDs per call** | Aligns with existing `sql600-tagging-audit` pattern |
| `get_milestones` concurrency | **5 concurrent** | Parallel batches, bounded |
| `systemusers` OR-chain | **15 GUIDs per call** | Aligns with existing `vault-sync` Mode 1 pattern |
| `systemusers` concurrency | **All batches in parallel** | Lightweight lookup, low risk |
| Total API calls (43 accounts, ~80 opps) | **~95-110 calls** | 1 (opps) + ~8 (milestones) + ~80 (deal teams) + ~4 (systemusers) |
| Estimated wall time (43 accounts) | **~20-30s** | Stage B dominates; 80 deal team calls at 5 concurrent ≈ 16 rounds × ~1.5s |

##### Early-exit optimization

If the user's request filters to a subset (e.g., "gap accounts only"), the agent can skip deal team resolution for non-matching accounts. The helper script handles this too — pass `--filter gap` to only resolve deal teams for zero-pipeline accounts.

##### Caching

Deal team composition changes slowly. For repeated runs within the same session:
- Cache `/tmp/intake-resolved-$DATE.json` — reuse if <1 hour old
- Always re-fetch opportunity and milestone data (these change frequently)
- `resolve-deal-teams.js` accepts `--systemusers-cache /tmp/systemusers-cache.json` to skip re-resolving known GUIDs

##### Output formatting

For multi-account output, the agent reads the resolved JSON and formats per `_shared/next-steps-output-shape.md`. Group by routing recommendation, not alphabetically:

```markdown
## Portfolio Routing Summary

| Customer | Route To | Person | Key Signal | Next Step |
|---|---|---|---|---|
| Blue KC | **SE** (self) | — | SQL mod gap, 450 cores | Schedule mod discovery with **John Smith** (Specialist) |
| Humana | **CSA** | **Pat Kim** | Architecture review needed | Post-commitment review by 5/15 |
| Anthem | ⚠️ No pipeline | — | 800 SQL Cores, zero opps | **Jane Doe** (Specialist): Create SQL mod opportunity |

### Flagged Accounts (detail)
... per-account detail only for at-risk, gap, or routed items ...
```

### Output Shape

```markdown
## Routing Recommendation: {Customer}

**Route to:** {Named person} ({Role}) — or SE (self) if SE handles directly
**Rationale:** {1-2 sentences: why this resource, not another}

### Recommended Next Steps
1. **{Named person}** ({Role}): {Concrete action with timeframe}
2. **{Named person}** ({Role}): {Concrete action}

### Deal Team
| Role | Name | On Opp |
|---|---|---|
| AE | {name} | {opp name} |
| Specialist | {name} | {opp name} |
| SE | {name} | {opp name} |
| CSA | {name or "⚠️ not assigned"} | {opp name} |
| CSAM | {name or "⚠️ not assigned"} | {opp name} |

### Customer Context (supporting)
- **Pipeline:** {$X active | zero — recommend positioning conversation}
- **Risk signals:** {at-risk milestones, close-date drift, or "none"}
- **SQL footprint:** {SQL Cores, modernization coverage, gap account status — if SQL600 account}
- **Recent engagement:** {last touchpoint date and type}
- **Cost exposure:** {Unified/EDE allocation status if relevant}
- **AI readiness:** {SQL modernization status as prerequisite for AI — if applicable}
```

### Anti-patterns this corrects

| Current behavior | Corrected behavior |
|---|---|
| AE emails FDE directly for a technical issue | Request goes to SE first; SE qualifies and routes if FDE is actually needed |
| Teams bypass creates duplicate engagements | SE checks existing milestones and activities before opening a new thread |
| Escalation without pipeline context | SE surfaces zero-pipeline or at-risk status before committing costly resources |
| Raw data dumps ("here's the pipeline") with no action | Output leads with "do this next" and uses pipeline data as supporting evidence |
| Ad-hoc FDE requests for scenarios SE can handle | Decision tree distinguishes SE-scope from FDE-scope explicitly |
| SQL modernization deprioritized vs AI conversations | SE positions SQL mod as the *prerequisite* for AI, not a separate lower-priority motion |
| AI engagement requested on account with unmodernized SQL estate | SE flags SQL readiness gap and recommends modernization as step 1, with concrete next steps |
| SQL600 gap account gets expensive FDE engagement with no pipeline | SE surfaces gap account status and recommends pipeline creation before resource commitment |

### What makes this possible

Without modularity, this skill would need to inline:
- SE boundary rules (~30 lines from `role-se`)
- Pipeline query patterns (~40 lines from `role-se-execution-check`)
- Activity recording protocol (~50 lines from `role-se-ms-activities`)
- SQL modernization positioning rules (~40 lines, distilled from `powerbi-sql600-hls` + `sql600-tagging-audit` + `generate-next-steps.js`)
- SQL workload detection rules (~30 lines from `sql600-tagging-audit/detection-rules.md`)
- Routing decision tree (~60 lines, new)
- Output format (~20 lines, new)

**Total: ~270 lines of duplicated content** in a ~350 line skill.

With modularity, the skill is ~120 lines: a flow that references `role-se` for authority, `_shared/engagement-routing-rules.md` for the decision tree, `_shared/sql-modernization-lens.md` for the AI-front-door positioning, `_shared/sql600-detection-rules.md` for workload patterns, `_shared/next-steps-output-shape.md` for format, chains to `role-se-execution-check` and `role-se-ms-activities` for CRM context and recording, and optionally reads from `powerbi-sql600-hls` for live SQL600 data. The routing rules and SQL positioning are maintained in one place and evolve independently — when Lindsey refines the modernization narrative, one file changes and all consumers pick it up.

---

## `_shared/engagement-routing-rules.md` (sketch)

The decision tree that `engagement-intake` loads. Single source of truth for "when does the SE handle it vs route it."

```markdown
# Engagement Routing Rules

## Qualification Questions (SE asks these before routing)

1. **What is the technical scenario?**
   - Proof/POC/Pilot/Demo → SE scope (Stage 3)
   - Architecture review → CSA scope (if post-commitment)
   - Product-level troubleshooting → SE first; FDE only if SE confirms depth exceeds scope
   - Deployment/delivery execution → ISD/Partner (not SE or FDE)
   - Strategic technology advisory → OCTO (rare; SE + ATS first)

2. **Is there active pipeline?**
   - Yes, with milestones → route normally per scenario type
   - Yes, but stale/at-risk → include pipeline health action item in routing output
   - No pipeline → flag prominently; recommend SE positioning conversation before committing resources

3. **Does the customer have cost exposure?**
   - Unified/EDE allocated → note allocation status in routing output
   - No Unified → note cost implications of engaging FDE/Engineering

4. **Can the SE handle it directly?**
   - Within solution play expertise → SE handles
   - Adjacent expertise, skilling opportunity → SE handles with backpack/community support
   - Outside SE scope with confirmed evidence → route

## Routing Decision Matrix

| Scenario | Pipeline? | SE Can Handle? | Route To | Rationale |
|---|---|---|---|---|
| Proof/POC/Pilot | Yes | Yes | **SE** | Core SE scope |
| Proof/POC/Pilot | No | Yes | **SE** + pipeline action | SE executes + recommends Specialist create pipeline |
| Architecture review | Yes, committed | N/A | **CSA** | Post-commitment architecture is CSA scope |
| Architecture review | Yes, uncommitted | Partial | **SE** + CSA consult | SE leads technical shaping; CSA for feasibility |
| Product troubleshooting | Any | Yes | **SE** | First-pass diagnosis is always SE |
| Product troubleshooting | Any | No (depth confirmed) | **FDE** | SE documents what was tried, hands off |
| Product-blocking bug | Any | No | **Engineering** | SE confirms reproduction, escalation evidence |
| Deployment execution | Yes, committed | No | **ISD/Partner** | SE doesn't do delivery execution |
| Strategic tech advisory | Any | No | **OCTO** | Rare; SE + ATS first |
| Skilling/enablement | Any | Yes | **SE** | SE owns HoK and enablement positioning |
| SQL modernization | Yes (mod pipeline exists) | Yes | **SE** | Core SE scope — position as AI prerequisite, drive through milestones |
| SQL modernization | No (gap account) | Yes | **SE** + pipeline action | SE positions mod conversation with Specialist; frame as AI front door |
| AI engagement request | SQL estate unmodernized | Partial | **SE** — SQL mod first | SE positions SQL modernization as step 1; AI engagement follows modernization |
| AI engagement request | SQL estate modernized | Varies | Route per scenario type | Standard routing; SQL readiness is not a blocker |
| Unknown/unclear | Any | Maybe | **SE qualifies first** | Never route an unqualified request |

## Zero-Pipeline Account Rules

When the account has no active opportunities:
- ALWAYS flag in routing output: "⚠️ No active pipeline for {customer}"
- Recommend: "Before committing {resource type}, SE should have a positioning conversation with Specialist about pipeline creation"
- Do NOT block routing entirely — some scenarios (e.g., critical escalation) warrant resource commitment without pipeline
- DO include the pipeline gap as a concrete next-step action item, not just a data point

## At-Risk Account Rules

When the account has at-risk opportunities or milestones:
- Include risk signals in routing output with specific milestone names and due dates
- Recommend: "Address {risk type} before or alongside this engagement"
- If the engagement could remediate the risk, call that out explicitly
```

---

## `_shared/next-steps-output-shape.md` (sketch)

The output format contract that any workflow can reference when it needs action-oriented output.

```markdown
# Next-Steps Output Shape

## Principle

Lead with what to do. Follow with why. Never present raw data without interpretation.

## Structure

1. **Headline recommendation** — one sentence: what to do and who does it
2. **Numbered next steps** — 2-4 concrete actions, each with owner and timeframe
3. **Supporting context** — pipeline, risk, engagement history as labeled sub-bullets
4. **Flags** — at-risk, zero-pipeline, cost exposure as callouts, not buried in prose

## Formatting Rules

- Next steps use imperative voice: "Schedule architecture review with CSA" not "An architecture review could be considered"
- Each next step names an **owner by name and role** — resolved from MSX deal team, not generic titles. E.g., "**Sarah Kim** (CSA): Review architecture feasibility by Friday" not "CSA should review"
- When deal team is available, ALWAYS use named people. Fall back to role titles only for resources outside the deal team (FDE, Engineering, OCTO)
- At-risk items use `⚠️` prefix; zero-pipeline uses `⚠️ No active pipeline`
- Missing deal team roles use `⚠️ not assigned` — flag the gap as an action item itself
- Context section is collapsible in spirit — keep it to ≤5 bullets
- Never output pipeline data without a "so what" interpretation

## Anti-patterns

| Don't | Do instead |
|---|---|
| "Pipeline: $2.3M across 4 opps" (no action) | "Pipeline: $2.3M across 4 opps — 2 are at-risk (past close date). **Next:** SE review milestones with Specialist by Friday." |
| "No pipeline found" (FYI only) | "⚠️ No active pipeline. **Next:** SE schedule positioning conversation with Specialist before committing FDE resources." |
| 15-bullet context dump | 3 next steps + 4 supporting context bullets |
```

---

## `_shared/sql-modernization-lens.md` (sketch)

The positioning and framing rules that connect SQL modernization to AI outcomes. Consumed by `engagement-intake`, `powerbi-sql600-hls`, `sql600-tagging-audit`, and `generate-next-steps.js`.

```markdown
# SQL Modernization Lens — AI Front Door

## Core Positioning

SQL modernization is not a standalone "database" conversation. It is the **foundational prerequisite** for scalable, governed AI adoption. Customers cannot build production AI workloads on unmodernized, on-prem SQL estates — the data governance, performance, and integration requirements make modernization step 1.

Frame every SQL modernization conversation through this lens:
- "Modernizing your SQL estate is the fastest path to production-ready AI"
- "AI at scale requires governed, cloud-native data — that starts with SQL modernization"
- "Your SQL footprint is the foundation your AI strategy will build on"

## When to Apply

| Signal | Action |
|---|---|
| Customer has SQL Cores > 0 and no modernization pipeline | Flag as AI readiness gap. Recommend positioning conversation. |
| Customer asks about AI/Copilot but SQL estate is on-prem | Position SQL mod as prerequisite. Don't skip to AI engagement. |
| Customer has active mod pipeline | Reinforce: "This modernization work directly enables your AI roadmap." |
| SQL600 gap account receiving technical engagement request | SE surfaces SQL readiness gap alongside routing recommendation. |

## Gap Account Framing

When the account has SQL on-prem footprint but no modernization pipeline:

**Don't say:** "No SQL pipeline found for this account."
**Do say:** "⚠️ {Customer} has {N} SQL Cores on-prem with no active modernization pipeline. This blocks AI-at-scale readiness. **Next:** SE schedule SQL modernization positioning with Specialist — frame as the prerequisite for {customer's stated AI goals}."

## Competitive Context (DBC)

SQL600 accounts without modernization pipeline are GCP leakage risks. Frame urgency through Database Compete:
- Unmodernized SQL estate = customer evaluating alternatives (GCP AlloyDB, AWS Aurora)
- Modernization pipeline = customer investing in Azure SQL path = competitive lock-in
- No pipeline + high SQL Cores = highest-priority gap for SE engagement

## Next-Step Patterns for SQL Modernization

> When deal team is resolved from MSX, substitute `{Specialist}`, `{AE}`, `{CSAM}` with actual names.

| Account State | Recommended Next Step |
|---|---|
| Gap account, zero pipeline | "**{Specialist}**: Create SQL modernization opportunity. **{SE}**: Schedule discovery call — position Azure SQL MI as the AI-ready data foundation." |
| Pipeline exists, uncommitted | "**{SE}**: Drive milestone commitment with **{Specialist}**. Connect modernization timeline to customer's AI adoption targets." |
| Pipeline committed, execution underway | "**{CSAM}**: Monitor delivery. **{SE}**: Prepare AI workload planning as modernization completes." |
| Modernization complete, no AI pipeline | "**{Specialist}**: Create AI workload opportunity. **{SE}**: Position next-phase engagement. SQL foundation is ready." |
| Renewal window approaching | "**{AE}**: Tie renewal to modernization commitment. **{SE}**: Position cloud-native SQL as the long-term AI platform." |

## Relationship to Existing Skills

| Skill | How it uses this lens |
|---|---|
| `engagement-intake` | Step 3 — SQL context check. Loads this lens when customer has SQL footprint. |
| `powerbi-sql600-hls` | Step 3 synthesis — frames gap accounts and modernization coverage through AI readiness narrative. |
| `sql600-tagging-audit` | Gap account output — uses next-step patterns from this lens instead of generic "create pipeline" language. |
| `generate-next-steps.js` | LLM prompt context — feeds these positioning rules into the per-account next-step generation. |
```

---

## Sales Program Awareness: SQL600 Detection Rules as Shared Reference

`sql600-tagging-audit/detection-rules.md` currently lives inside the tagging audit skill, but its content — SQL workload patterns, expected sales play mappings, Catalyst coaching scope, severity classification — is something **every role** should be aware of when working on SQL600 accounts. An AE reviewing an account plan needs to know which workloads map to SQL600. A Specialist creating pipeline needs the correct `msp_salesplay` values. A CSAM monitoring delivery needs the workload tier classification.

**Promotion plan:**
1. Move `sql600-tagging-audit/detection-rules.md` → `_shared/sql600-detection-rules.md`
2. Replace the original file with a one-liner: `→ See _shared/sql600-detection-rules.md`
3. All role lenses add a row to their Cross-Workflow Lens table pointing to this file for SQL program awareness
4. `engagement-intake` loads it when the customer has SQL footprint
5. Future role cards (`role-specialist`, `role-csa`, `role-csam`) reference it from day one

This pattern generalizes: when a sales program's taxonomy and detection rules are relevant across roles, promote the rules file to `_shared/`. The skill that produces the audit/report keeps its SKILL.md and output-template; only the reusable classification rules move.

---

## LLM-Inferred Next Steps: Design Note

`generate-next-steps.js` currently uses `gpt-4.1-mini` to produce per-account recommended next steps based on pipeline signals. This is powerful but raises legitimate concerns about latency, cost, and consistency.

**Current approach (keep for now):**
- Script runs as a batch step in the HTML report pipeline
- ~8 concurrent LLM calls, ~2-4 seconds per account, ~$0.02 total for 43 accounts
- Output is deterministic-ish: same signals produce similar recommendations, but exact wording varies
- Model is cheap/fast (`gpt-4.1-mini`) — latency is acceptable for batch, not for interactive

**Future consideration:**
- For interactive use (engagement-intake asking "what's the next step for Blue KC?"), the LLM call adds 2-4s latency per account
- Alternative: pre-compute next steps during the nightly/weekly SQL600 readout run and cache in vault or `/tmp`; engagement-intake reads cached results instead of calling LLM
- Alternative: rule-based next steps from `_shared/sql-modernization-lens.md` patterns (no LLM) for interactive, LLM for batch reports
- Recommendation: **start with rule-based patterns for interactive routing, LLM for batch reports.** Revisit if rule-based quality is insufficient.

The `_shared/sql-modernization-lens.md` next-step patterns table is designed to support the rule-based path. It maps `{account state}` → `{recommended next step}` without LLM inference. `generate-next-steps.js` can optionally read this file as prompt context for richer LLM output, but the interactive path doesn't depend on it.

---

## deal-lifecycle Consolidation Precedent

`deal-lifecycle` already proved the consolidation pattern works: it merged 10 prior standalone skills into one with clear sections. This spec does NOT undo that. Instead:

- `deal-lifecycle` keeps its consolidated content (it's the MCEM reference skill).
- Shared tables that `deal-lifecycle` defines AND other skills restate (stage spine, commit gate) get extracted to `_shared/` and both `deal-lifecycle` and the downstream skills reference the same source.
- Individual `deal-*` workflow skills remain separate discoverable units — they serve different trigger intents and different user tasks.

---

## Migration Plan

### Phase 1: Extract shared packs (low risk, high impact)

1. Create `.github/skills/_shared/` directory.
2. Extract cross-role shared policy files from their current inline locations:
   - `write-gate-authority.md` — from `role-se` §Boundary Rules + `deal-lifecycle` §Boundaries
   - `mcem-stage-spine.md` — from `deal-lifecycle` §1
   - `confirmation-packet.md` — from `role-se-ms-activities` §Step 2
   - `next-steps-output-shape.md` — new, from sketch in this spec
3. Promote `sql600-tagging-audit/detection-rules.md` → `_shared/sql600-detection-rules.md`. Replace original with redirect.
4. **Create `engagement-routing-rules.md` and `sql-modernization-lens.md`** — new, from sketches in this spec.
5. Replace inline content in existing skills with `→ read_file` references.
6. No skill renames. No discovery changes. No prompt file edits.
7. Run `verify-instructions.js --generate` to update checksums.

**Validation:** Every prompt that worked before still works. Shared packs reduce token load and establish single sources of truth.

### Phase 2: Slim role lenses (medium risk)

1. Refactor `role-se` to:
   - Reframe mission: **front door for technical engagement** + proof executor + HoK driver.
   - Remove restated protocols (activity tracking model, HoK resource list). Keep as references within `role-se/references/` if SE-specific.
   - Add Cross-Workflow Lens table with `engagement-intake` as first entry, SQL600 program awareness.
   - Reference `_shared/` packs for cross-role policy instead of inlining.
2. Slim `role-se-execution-check`: replace inlined Unified constraint tables and born-closed rules with references to `_shared/` or `role-se/references/`. Keep name, keep modes.
3. Slim `role-se-ms-activities`: replace inlined confirmation packet format and write-gate authority references with `_shared/` references. Keep name, keep flow.
4. Update `SKILLS.md` index to note shared packs.

**Validation:** Run each prompt that touches SE workflows. Verify output quality is unchanged.

### Phase 3: Build engagement-intake workflow (the deliverable)

1. **Build `scripts/helpers/resolve-deal-teams.js`** — the helper script that joins raw CRM bulk data into compact, pre-grouped, signal-annotated account summaries. Follows existing helper conventions (stdin/file input, JSON stdout, composable via pipes). Add to `scripts/helpers/README.md`.
2. Create `engagement-intake/SKILL.md` (~120 lines) following the sketch in this spec. References the helper script for multi-account mode.
3. It composes: `role-se` lens + `_shared/engagement-routing-rules.md` + `_shared/sql-modernization-lens.md` + `_shared/next-steps-output-shape.md` + chains to `role-se-execution-check` and `role-se-ms-activities`.
4. Add to `SKILLS.md` index.
5. Add a scenario row to `role-execution-router` § Scenario Classification: *Technical Engagement Intake*.
6. Optionally create `engagement-intake.prompt.md` for standard trigger phrases.

**Validation:** Test with real scenarios: "route this Contoso technical request", "customer needs architecture help but has no pipeline", "should I engage FDE for this Blue KC issue?", "what's the SQL modernization play for Humana?", "review all SQL600 gap accounts".

### Phase 4: Router diet (low risk)

1. Extract program playbooks and task-role matrix from `role-execution-router` to on-demand references.
2. Router SKILL.md drops to ~150 lines.
3. No external changes needed — nothing else loads the router's internal content.

### Phase 5: Metadata + lint (optional, future)

1. Add `kind` to all skill frontmatter.
2. Extend `verify-instructions.js` to lint: shared pack references resolve, `kind` is set, SKILL.md line count respects limits per kind.
3. Update `dev-skill-authoring` checklist to include the three-layer classification.

---

## What This Does NOT Change

- **Skill names** — No renames. `role-se-ms-activities`, `role-se-execution-check`, `powerbi-sql600-hls`, `sql600-tagging-audit` all keep their current names.
- **Prompt files** — Still reference skills by current names. No prompt edits needed.
- **Agent definitions** — No changes to `.agent.md` files.
- **Skill discovery mechanism** — VS Code frontmatter matching is unchanged. `_shared/` has no `SKILL.md`, so it's invisible to discovery.
- **Vault sync** — `setup-vault.js` copies all of `.github/skills/` including `_shared/`.
- **deal-\* skills** — No structural changes. They're already clean workflows.
- **internal-\* skills** — Config gate, vault routing, M365 scoping are already well-scoped internal plumbing. No changes.
- **powerbi-\* skills** — Already follow the progressive disclosure pattern with sub-files. `powerbi-sql600-hls` and `sql600-tagging-audit` gain a shared reference (`sql-modernization-lens.md`) but their SKILL.md files, query-rules, and output-templates are untouched. The PBI dispatch-to-`pbi-analyst` pattern is unchanged.
- **Helper scripts** — `generate-next-steps.js`, `classify-sql-pipeline.js`, `audit-sales-play.js`, `generate-sql600-report.js`, `enrich-sql600-accounts.js` are unchanged. See § LLM-Inferred Next Steps for future considerations.
- **vault-sync** — Out of scope for this spec. It's an ad-hoc operation with different concerns.

---

## Success Criteria

| Metric | Before | After |
|---|---|---|
| Files to edit when write-gate authority changes | 4+ (role-se, role-se-ms-activities, deal-lifecycle, role-execution-router) | 1 (`_shared/write-gate-authority.md`) |
| Files to edit when SQL modernization positioning changes | 3+ (sql600-hls synthesis rules, tagging-audit gap framing, generate-next-steps prompt) | 1 (`_shared/sql-modernization-lens.md`) |
| Files to edit when SQL workload detection rules change | 1 (sql600-tagging-audit/detection-rules.md) but invisible to other roles | 1 (`_shared/sql600-detection-rules.md`) visible to all roles |
| Skills that can compose SQL modernization context into routing | 0 (SQL600 skills are isolated from engagement-intake) | 3+ (`engagement-intake`, `powerbi-sql600-hls`, `sql600-tagging-audit`, future role cards) share one lens |
| Roles with SQL program awareness | 1 (SE, implicitly via tagging audit) | All (via `_shared/sql600-detection-rules.md` in Cross-Workflow Lens) |
| Prompt files requiring changes | — | 0 (no skill renames) |

---

## Resolved Decisions

1. **Naming**: Keep all existing skill names. New skills use the established `{domain}-{noun}` pattern. No renames.
2. **Shared pack scope**: Only truly cross-role processes go in `_shared/`. SE-specific protocols (born-closed, HoK gate) stay inside `role-se/references/`. Promote to `_shared/` only if/when a second role needs them.
3. **Composition metadata**: Keep it simple. `kind` in frontmatter for classification. Composition documented in prose via `Chained Skills` tables. No structured `composes` block.
4. **vault-sync**: Out of scope. Separate concern.
5. **SQL600 skills**: Keep current structure (data-pull vs audit). Promote `detection-rules.md` to `_shared/sql600-detection-rules.md` so all roles can reference SQL workload patterns. SQL600 skills stay focused on their domain; role lenses point to the shared detection rules for program awareness.
6. **LLM-inferred next steps**: Keep `generate-next-steps.js` for batch reports (current approach works well). For interactive use via `engagement-intake`, use rule-based patterns from `_shared/sql-modernization-lens.md` to avoid latency/cost. Revisit LLM for interactive if rule-based quality is insufficient.
