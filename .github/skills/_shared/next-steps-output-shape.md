# Next-Steps Output Shape

> **Freedom Level: Low** — Structure and formatting rules are exact. Content within each section uses judgment.

Output format contract for any workflow that produces action-oriented recommendations. Consumed by `engagement-intake`, `powerbi-sql600-hls` (gap account framing), and `sql600-tagging-audit` (exception actions).

---

## Principle

Lead with what to do. Follow with why. Never present raw data without interpretation.

## Structure

1. **Headline recommendation** — one sentence: what to do and who does it
2. **Numbered next steps** — 2-4 concrete actions, each with owner and timeframe
3. **Supporting context** — pipeline, risk, engagement history as labeled sub-bullets
4. **Flags** — at-risk, zero-pipeline, cost exposure as callouts, not buried in prose

## Formatting Rules

- Next steps use imperative voice: "Schedule architecture review with CSA" not "An architecture review could be considered"
- Each next step names an **owner by name and role** — resolved from MSX deal team, not generic titles
  - E.g., "**{CSA Name}** (CSA): Review architecture feasibility by Friday" not "CSA should review"
- When deal team is available, ALWAYS use named people
- Fall back to role titles only for resources outside the deal team (FDE, Engineering, OCTO)
- At-risk items use `⚠️` prefix; zero-pipeline uses `⚠️ No active pipeline`
- Missing deal team roles use `⚠️ not assigned` — flag the gap as an action item itself
- Context section is collapsible in spirit — keep it to ≤5 bullets
- Never output pipeline data without a "so what" interpretation

## Anti-patterns

| Don't | Do instead |
|---|---|
| "Pipeline: $2.3M across 4 opps" (no action) | "Pipeline: $2.3M across 4 opps — 2 are at-risk (past close date). **Next:** **{SE Name}** (SE) review milestones with **{Specialist Name}** (Specialist) by Friday." |
| "No pipeline found" (FYI only) | "⚠️ No active pipeline. **Next:** **{SE Name}** (SE) schedule positioning conversation with **{Specialist Name}** (Specialist) before committing FDE resources." |
| "CSA should review" (generic role) | "**{CSA Name}** (CSA): Review architecture feasibility by Friday" |
| 15-bullet context dump | 3 next steps + 4 supporting context bullets |
| Data table with no interpretation | Summary table grouped by routing recommendation, flagged items only |
