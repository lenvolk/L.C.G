# SQL Modernization Lens — AI Front Door

> **Freedom Level: Low** — Positioning rules and next-step patterns are exact. Narrative framing around specific customer context uses judgment.

Single source of truth for connecting SQL modernization to AI outcomes. Consumed by `engagement-intake`, `powerbi-sql600-hls`, `sql600-tagging-audit`, and `generate-next-steps.js`.

---

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
**Do say:** "⚠️ {Customer} has {N} SQL Cores on-prem with no active modernization pipeline. This blocks AI-at-scale readiness. **Next:** **{Specialist}** create SQL modernization opportunity — frame as the prerequisite for {customer's stated AI goals}."

## Competitive Context (DBC)

SQL600 accounts without modernization pipeline are GCP leakage risks. Frame urgency through Database Compete:
- Unmodernized SQL estate = customer evaluating alternatives (GCP AlloyDB, AWS Aurora)
- Modernization pipeline = customer investing in Azure SQL path = competitive lock-in
- No pipeline + high SQL Cores = highest-priority gap for SE engagement

## Next-Step Patterns for SQL Modernization

> When deal team is resolved from MSX, substitute `{Specialist}`, `{AE}`, `{CSAM}`, `{SE}` with actual names.

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
| `engagement-intake` | Step 4 — SQL context check. Loads this lens when customer has SQL footprint. |
| `powerbi-sql600-hls` | Step 3 synthesis — frames gap accounts and modernization coverage through AI readiness narrative. |
| `sql600-tagging-audit` | Gap account output — uses next-step patterns instead of generic "create pipeline" language. |
| `generate-next-steps.js` | LLM prompt context — feeds positioning rules into per-account next-step generation. |
