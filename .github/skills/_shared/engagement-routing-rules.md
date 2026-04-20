# Engagement Routing Rules

> **Freedom Level: Low** — Decision matrix and qualification questions are exact. Narrative framing in routing output uses judgment.

Single source of truth for "when does the SE handle it vs route it." Loaded by `engagement-intake` and referenced by `role-se` Cross-Workflow Lens.

---

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

---

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

---

## Zero-Pipeline Account Rules

When the account has no active opportunities:
- ALWAYS flag in routing output: `⚠️ No active pipeline for {customer}`
- Recommend: "Before committing {resource type}, **{Specialist}** should create pipeline and SE should have a positioning conversation"
- Do NOT block routing entirely — some scenarios (e.g., critical escalation) warrant resource commitment without pipeline
- DO include the pipeline gap as a concrete next-step action item, not just a data point

## At-Risk Account Rules

When the account has at-risk opportunities or milestones:
- Include risk signals in routing output with specific milestone names and due dates
- Recommend: "Address {risk type} before or alongside this engagement"
- If the engagement could remediate the risk, call that out explicitly

## Deal Team Resolution Rules

- Route to **named people** from MSX deal team, not generic role titles
- If a required role is missing from the deal team, flag as `⚠️ {Role} not assigned` — the gap is an action item
- For resources outside the deal team (FDE, Engineering, OCTO), name the deal team member who should initiate the request (typically SE or CSAM)
- Zero-pipeline accounts may have no deal team; fall back to account team from vault customer note or CRM account query
