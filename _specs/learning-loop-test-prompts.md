# Learning Loop — Test Prompts

Use these prompts to exercise each stage of the learning loop. Run them in order for the full end-to-end flow, or pick individual sections to test in isolation.

---

## Prerequisites

Before testing, ensure:
1. Vault is initialized: `npm run vault:init`
2. MCP servers are healthy: `npm run check`
3. A daily note exists for today (run `npm run morning:prep` first, or create a minimal one manually)

---

## Stage 1: Seed the Learning Log with Corrections

These prompts simulate Kate providing corrections after a morning triage. Paste them into `@Chief of Staff` chat one at a time.

### Prompt 1a — Reclassify a sender
```
I got an email from Sarah Chen today that was classified as NORMAL in the morning triage. 
She's the new project lead for the Contoso engagement — her emails should always be HIGH. 
Please add this correction to my learning log.
```

### Prompt 1b — Suppress a noise source
```
The morning triage keeps surfacing IT Service Health notifications. 
These are automated alerts and should be suppressed. 
Log this as a correction.
```

### Prompt 1c — Adjust meeting priority
```
The "Weekly Vendor Sync" meeting was marked READY in this morning's triage, 
but it's actually low priority — we just listen in, no prep needed. 
Please note this in the learning log so future runs skip prep for this meeting.
```

### Prompt 1d — Fix a tone issue
```
The draft response you wrote for the Fabrikam escalation was too formal. 
For internal-facing escalation responses to our own team, use a more direct, 
less corporate tone. Add this to the learning log.
```

### Prompt 1e — Repeated sender reclassification (builds a pattern)
```
Another email from Sarah Chen was classified NORMAL today. 
This is the third time — she should be HIGH priority. 
Log this correction again.
```

### Prompt 1f — Second suppression for same source
```
Another IT Service Health alert showed up in today's triage. 
I already asked to suppress these. Please log it again.
```

### Prompt 1g — Third suppression (triggers promotion threshold)
```
IT Service Health notifications appeared in today's triage again. 
This is the third time I've asked to suppress these. 
Log the correction and flag this for permanent rule promotion.
```

**What to verify after Stage 1:**
- Open `_kate/learning-log.md` in your vault
- Confirm entries were appended under today's date
- Each entry should have: original classification, corrected classification, and reason

---

## Stage 2: Run the Learning Review

### Option A — Via npm script
```bash
npm run learning:review
```

### Option B — Via Copilot Chat
```
Run the learning review workflow. Scan my learning log for recurring correction 
patterns and tell me which corrections are ready for promotion into permanent 
vault rules.
```

### Option C — Targeted date override
```bash
TARGET_DATE=2026-03-18 npm run learning:review
```

**What to verify after Stage 2:**
- Check `Daily/{today}-learning-review.md` in your vault
- **PROMOTION CANDIDATES** should include:
  - Sarah Chen → `_kate/vip-list.md` (3+ entries about sender priority)
  - IT Service Health → `_kate/preferences.md` (3+ suppression requests)
- Each candidate should have a `**Proposed change:**` block with exact text
- **WATCHING** should list patterns with < 3 entries (e.g., tone feedback, meeting priority)
- **REVIEW METADATA** should have counts for all fields

### Validate the artifact structure
```bash
npm run learning:review:validate
```

### If validation fails, repair
```bash
npm run learning:review:repair
```

---

## Stage 3: Manually Apply a Promotion

The learning review proposes changes but never auto-applies them. Test the approval flow:

### Prompt 3a — Apply a VIP list promotion
```
I reviewed the learning review. Please apply the promotion for Sarah Chen — 
add her to the Tier 2 VIP list in _kate/vip-list.md as the Contoso project lead, 
with classification HIGH.
```

### Prompt 3b — Apply a suppression rule
```
I reviewed the learning review. Please apply the IT Service Health suppression — 
add it to _kate/preferences.md under a "## Suppression Rules" section.
```

### Prompt 3c — Reject a promotion
```
I see the learning review flagged the "Weekly Vendor Sync" meeting priority. 
Don't promote that yet — I want to watch it for another week. 
No changes needed.
```

**What to verify after Stage 3:**
- `_kate/vip-list.md` should have Sarah Chen under Tier 2
- `_kate/preferences.md` should have IT Service Health in suppression rules
- No changes should have been made for the rejected item

---

## Stage 4: Run Vault Hygiene

### Option A — Via npm script
```bash
npm run vault:hygiene
```

### Option B — Via Copilot Chat
```
Run the vault hygiene check. Scan my Daily and Meetings folders for stale 
notes older than 14 days, identify any lingering action items, and give me 
a health report.
```

**What to verify after Stage 4:**
- Check `Daily/{today}-vault-hygiene.md` in your vault
- **LINGERING ACTION ITEMS** lists unresolved actions from old notes
- **ARCHIVE CANDIDATES** lists old notes safe to clean up
- **VAULT HEALTH** has counts for daily notes, meeting notes, stale entries
- If lingering items were found, check today's daily note for a `## Migrated Action Items` section

---

## Stage 5: Full End-to-End Loop

Run these in sequence to simulate a full week's learning cycle:

```bash
# 1. Morning triage (creates daily note)
npm run morning:prep

# 2. After reviewing triage, run corrections
npm run morning:corrections

# 3. (Repeat steps 1-2 for several days, or seed learning-log manually)

# 4. Weekly learning review (Friday recommended)
npm run learning:review

# 5. Validate the review artifact
npm run learning:review:validate

# 6. Weekly vault hygiene (Friday recommended)
npm run vault:hygiene

# 7. Manually apply approved promotions via chat
```

---

## Edge Case Prompts

### Empty learning log
```
Run the learning review. My learning log has no entries yet.
```
**Expected:** Review artifact with all sections present, all counts at 0, no promotion candidates.

### No stale vault content
```
Run vault hygiene. I just initialized my vault today — there should be nothing stale.
```
**Expected:** Hygiene report with 0 archive candidates, 0 lingering items.

### Conflicting corrections
```
Last week I said emails from Alex Kim should be HIGH. Today I want to change 
that — Alex moved to a different team and should now be NORMAL. 
Log this correction.
```
**Expected:** New entry appended. Next learning review should surface the conflict and ask Kate to resolve.

### Bulk correction seeding (for testing promotion threshold)
```
Please add these corrections to my learning log:
1. 2026-03-14: Email from Dana Park classified NORMAL, should be HIGH — she's the Azure migration lead
2. 2026-03-15: Email from Dana Park classified NORMAL, should be HIGH — same reason
3. 2026-03-16: Email from Dana Park classified NORMAL, should be HIGH — third miss
```
**Expected:** Three entries appended. Next learning review should surface Dana Park as a promotion candidate.

---

## Validation Cheat Sheet

| Command | What it checks |
|---------|---------------|
| `npm run learning:review:validate` | Learning review has required sections + metadata |
| `npm run learning:review:repair` | Rewrites malformed review artifact |
| `npm run morning:validate` | Morning brief has required triage sections |
| `npm run vault:hygiene` | Vault health + stale content scan |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "learning-log.md not found" | Run `npm run vault:init` to bootstrap vault |
| Learning review has 0 candidates | Seed at least 3 corrections for the same topic |
| Vault hygiene finds nothing stale | Normal if vault is < 14 days old |
| Validation fails after review | Run `npm run learning:review:repair` |
| Copilot CLI not found | Check `COPILOT_CLI_PATH` or install via VS Code |
