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

# Engagement Intake

## Purpose

SE front-door workflow for technical engagement requests. Qualifies the scenario, resolves the deal team from MSX, checks customer pipeline and cost context, and routes to the right **named person** with a clear rationale and recommended next steps.

Implements Lindsey's core directive: all engagements start with the SE, who qualifies before routing. SQL modernization is positioned as the front door to AI.

## Freedom Level

**Medium** — Routing classification requires judgment; decision matrix and output format are rule-based.

## When to Use

- An AE, account team, or partner asks "who should handle this technical request?"
- SE needs to qualify whether to handle directly or route to CSA/FDE/Engineering/ISD/OCTO
- Customer has a technical need but no engagement plan yet
- Portfolio sweep: "review all SQL600 gap accounts" or "route recommendations for my territory"

## Runtime Contract

| Tool | Purpose | Calls (single) | Calls (portfolio, ~80 opps) |
|---|---|---|---|
| `msx-crm:get_my_active_opportunities` | All active opps for customer(s) | 1 | 1 |
| `msx-crm:get_milestones` | Milestone context per opp batch | 1 | ~8 (10 IDs/call, 5 concurrent) |
| `msx-crm:manage_deal_team` | Deal team per opp | 1-3 | ~80 (5 concurrent) |
| `msx-crm:crm_query` (systemusers) | Resolve names from GUIDs | 1 | ~4 (15 GUIDs/call, all parallel) |
| `powerbi-remote:ExecuteQuery` | SQL600 data (optional) | 0-1 | 0-1 |

**Rate limit guardrails:**
- `manage_deal_team`: max **5 concurrent** (~60 req/min MSX limit)
- `get_milestones`: batch **10 opp IDs per call**, max **5 concurrent**
- `systemusers` OR-chain: **15 GUIDs per call**, all batches parallel

## Flow

### Single-Account Mode

1. **Identify the customer.** Resolve customer name → TPID. Load vault customer note if available.
2. **Pipeline + deal team in parallel.** No dependency between these:
   - `get_my_active_opportunities({ customerKeyword })` → active opps
   - After opp IDs known: `get_milestones({ opportunityIds, statusFilter: "active", format: "triage" })`
3. **Resolve deal team.** Per opp: `manage_deal_team({ action: "list", opportunityId })`. Deduplicate systemuser GUIDs, batch-resolve via `crm_query` on `systemusers` (OR-chain up to 15).
4. **SQL context (if SQL600 account).** If SQL Cores > 0 or on SQL600 list → load `_shared/sql-modernization-lens.md`. Optionally chain to `powerbi-sql600-hls` for live data.
5. **Classify + route.** Apply `_shared/engagement-routing-rules.md`. Map to named deal team members.
6. **Format output** per `_shared/next-steps-output-shape.md`.
7. **Optionally record** intake via `role-se-ms-activities`.

### Multi-Account Mode (Portfolio Sweep)

**Design principle:** Bulk dump → helper script → compact summary. The agent MUST NOT generate new scripts to parse CRM data.

1. **Bulk CRM fetch** — staged parallel:
   - **Stage A** (1 call): `get_my_active_opportunities` → all opps. Save raw.
   - **Stage B** (parallel, bounded): `get_milestones` (batches of 10, 5 concurrent) + `manage_deal_team` (1/opp, 5 concurrent). Collect systemuser GUIDs.
   - **Stage C** (parallel): `crm_query` on `systemusers` — OR-chain 15 GUIDs/call, all batches parallel.
   - **Save** combined JSON to `/tmp/intake-opps-<DATE>.json`:
     ```json
     { "opportunities": [...], "dealTeams": { "<oppId>": [...] }, "milestones": [...], "systemusers": [...] }
     ```

2. **Helper script** (no API calls, instant):
   ```bash
   node scripts/helpers/resolve-deal-teams.js /tmp/intake-opps-$DATE.json \
     > /tmp/intake-resolved-$DATE.json
   ```
   Use `--filter gap` for zero-pipeline accounts only, `--filter at-risk` for at-risk only.

3. **Agent reads compact output** (~50 lines for 43 accounts). Apply `_shared/engagement-routing-rules.md` per account. Format per `_shared/next-steps-output-shape.md`.

**Estimated wall time (43 accounts, ~80 opps):** ~20-30s. Stage B dominates (80 deal team calls at 5 concurrent ≈ 16 rounds × ~1.5s).

## Decision Logic

Load `_shared/engagement-routing-rules.md` for the full decision matrix. Key rules:

- **SE is always the front door.** Never route an unqualified request.
- **Pipeline context first.** Surface zero-pipeline or at-risk status before committing costly resources.
- **Named people, not roles.** Route to deal team members by name from MSX. Missing roles are action items.
- **SQL modernization = AI readiness.** Per `_shared/sql-modernization-lens.md`: position SQL mod as the AI prerequisite, not a separate lower-priority motion.
- **SQL workload awareness.** Per `_shared/sql600-detection-rules.md`: know which workloads map to SQL600 and expected sales play values.

## Output

### Single Account

```markdown
## Routing Recommendation: {Customer}

**Route to:** **{Named person}** ({Role}) — or SE (self) if SE handles directly
**Rationale:** {1-2 sentences}

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

### Customer Context
- **Pipeline:** {$X active | zero — recommend positioning conversation}
- **Risk signals:** {at-risk milestones, close-date drift, or "none"}
- **SQL footprint:** {SQL Cores, mod coverage — if SQL600}
- **AI readiness:** {SQL mod status as AI prerequisite — if applicable}
```

### Portfolio Sweep

```markdown
## Portfolio Routing Summary

| Customer | Route To | Person | Key Signal | Next Step |
|---|---|---|---|---|
| Contoso | **SE** (self) | — | SQL mod gap, 450 cores | Schedule mod discovery with **{Specialist}** |
| Northwind | **CSA** | **{name}** | Architecture review | Post-commitment review by {date} |
| Woodgrove | ⚠️ No pipeline | — | 800 SQL Cores, zero opps | **{Specialist}**: Create SQL mod opp |

### Flagged Accounts (detail)
... per-account detail only for at-risk, gap, or routed items ...
```

## Chained Skills

| Skill | Chain Condition |
|---|---|
| `role-se` | Always — SE boundary rules and Cross-Workflow Lens |
| `role-se-execution-check` | When milestones exist — task-level context in SE mode |
| `role-se-ms-activities` | Optional — record intake as CRM activity (born-closed) |
| `powerbi-sql600-hls` | When customer is SQL600 — live ACR/pipeline/mod data |
| `sql600-tagging-audit` | When checking sales play tagging for SQL opps |

## Shared References

| File | When Loaded |
|---|---|
| `_shared/engagement-routing-rules.md` | Always — decision matrix |
| `_shared/next-steps-output-shape.md` | Always — output format |
| `_shared/sql-modernization-lens.md` | When customer has SQL footprint |
| `_shared/sql600-detection-rules.md` | When checking SQL workload patterns or sales play values |

## Helper Scripts

| Script | When Used |
|---|---|
| `scripts/helpers/resolve-deal-teams.js` | Multi-account mode — joins CRM bulk data into compact summary |

## Anti-patterns (agent must NOT do)

| Anti-pattern | Correct behavior |
|---|---|
| Route without qualifying first | SE qualifies scenario, pipeline, and cost context before routing |
| Use generic role titles when deal team is available | Always use named people from MSX deal team |
| Generate new scripts to parse CRM data | Use `resolve-deal-teams.js` for multi-account; inline for single-account |
| Present raw pipeline data without interpretation | Lead with next steps; pipeline data is supporting context |
| Skip SQL modernization context for SQL600 accounts | Always load `sql-modernization-lens.md` when SQL footprint exists |
| Route to FDE without confirming SE can't handle it | SE first; FDE only when SE confirms depth exceeds scope |
