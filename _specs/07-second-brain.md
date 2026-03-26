# 7. Second Brain & Learning Loop

## 7.1 The Core Idea

Every time the system runs, it should get a little bit smarter. Not through model fine-tuning — through **accumulating context in the vault** that Copilot reads as instructions on the next run.

The vault is not just storage. It's the system's working memory, long-term memory, and personality all in one.

```
┌──────────────────────────────────────┐
│         The Learning Loop            │
│                                      │
│   1. System runs a workflow          │
│   2. Results written to vault        │
│   3. Kate reviews, corrects,         │
│      adds context                    │
│   4. Next run, system reads the      │
│      updated vault files             │
│   5. Behavior improves               │
│   6. Repeat                          │
│                                      │
│   The vault IS the training data.    │
└──────────────────────────────────────┘
```

---

## 7.2 What the Vault Remembers

### Preferences (human-written, system-read)
| File | What It Captures | Who Updates It |
|------|-----------------|----------------|
| `_kate/preferences.md` | Working style, tool preferences, corrections | Kate |
| `_kate/vip-list.md` | Priority people and why they matter | Kate |
| `_kate/communication-style.md` | Writing patterns, formality rules, phrase preferences | Kate |
| `_kate/operating-rhythm.md` | Recurring cadences, key dates, channels to monitor | Kate |
| `_kate/templates/` | Reusable document structures for briefs, slides, updates | Kate (with system suggestions) |

### Context (system-built, human-reviewed)
| File/Folder | What It Captures | Who Updates It |
|-------------|-----------------|----------------|
| `Customers/{name}.md` | Account context, opportunity IDs, team, agent insights | System (append) + Kate (edits) |
| `People/{name}.md` | Stakeholder profiles, associations, interaction history | System (append) + Kate (edits) |
| `Meetings/{date}-{topic}.md` | Meeting briefs, action items, outcomes | System (creates brief) + Kate (adds notes) |
| `Daily/{date}.md` | Daily triage briefs, action items | System (writes) + Kate (annotates) |
| `Weekly/{week}.md` | Weekly ROB summaries | System (writes) + Kate (reviews) |

### System Memory (system-written)
| File/Folder | What It Captures | Who Updates It |
|-------------|-----------------|----------------|
| `_kate/learning-log.md` | Classification corrections, preference changes, pattern observations | System (appends after corrections) |
| `_agent-log/{date}.md` | Full audit trail of every system action | System (automatic) |

---

## 7.3 How the System Learns

### Learning Mechanism 1: Explicit Corrections
Kate tells the system it got something wrong:
```
Kate: "That email from [person] should be HIGH, not NORMAL"
System: Appends to _kate/learning-log.md:
  - 2026-03-18: Emails from [person] classified as NORMAL, 
    should be HIGH — they are the new project lead for [client]
```

Next triage run, Copilot reads the learning log and adjusts.

### Learning Mechanism 2: Vault Context Accumulation
Every meeting brief adds context. Every CRM correlation adds IDs. Over time:
- Customer files get richer (more opportunity IDs, more team members, more history)
- People files build relationship maps (who works with whom, what topics they own)
- Meeting notes create a searchable history of decisions and action items
- The semantic search index gets more relevant results because there's more to search

### Learning Mechanism 3: Template Evolution
Kate starts with basic templates. Over time:
- She modifies the meeting brief template to match her actual preferences
- She adds recurring presentation templates for specific cadences
- She builds up a library of communication patterns for different audiences

Each template is just a markdown file — editable, versionable, composable.

### Learning Mechanism 4: Pattern Recognition via Instructions
As Kate accumulates corrections, the system's weekly learning review (`learning-review.prompt.md`) scans the learning log for clusters of 3+ related corrections and proposes specific vault file changes. Kate reviews and approves promotions — the system never auto-modifies instruction or preference files.

> **Implementation Status:** `learning-review.prompt.md` + `scripts/learning-review.sh` with validate/repair automation (`npm run learning:review`). `vault-hygiene.prompt.md` + `scripts/vault-hygiene.sh` handles stale-entry detection and action-item migration (`npm run vault:hygiene`).

```markdown
# Before (learning log has 5+ corrections about the same person)
_kate/learning-log.md:
  - 2026-03-10: [Person] emails are always urgent (project lead)
  - 2026-03-12: [Person] emails about [topic] need immediate response
  - 2026-03-15: [Person] is driving the Q3 deadline — always prioritize
  - 2026-03-17: Missed [Person]'s email again — this must be Tier 1

# After (promoted to VIP list)
_kate/vip-list.md:
  ## Tier 1 — Always URGENT
  - [Person]: Q3 project lead for [client], all emails are URGENT
```

---

## 7.4 The Second Brain File Structure

```
Vault/
├── _kate/                          ← Personal operating context
│   ├── preferences.md              ← Working style, tool preferences
│   ├── vip-list.md                 ← Priority people (tiered)
│   ├── communication-style.md      ← Writing patterns and tone rules
│   ├── operating-rhythm.md         ← ROB cadences, key dates, channels
│   ├── learning-log.md             ← Corrections and pattern observations
│   └── templates/                  ← Reusable structures
│       ├── meeting-brief.md        ← Standard meeting prep format
│       ├── weekly-summary.md       ← Weekly ROB format
│       ├── update-request.md       ← Milestone owner follow-up
│       ├── town-hall-deck.md       ← Town hall presentation outline
│       └── customer-engagement.md  ← Customer meeting deck outline
│
├── Customers/                      ← Account context (OIL-managed)
│   └── {CustomerName}.md           ← Frontmatter IDs + sections
│
├── People/                         ← Stakeholder profiles
│   └── {Full Name}.md              ← Associations, roles, context
│
├── Meetings/                       ← System-prepared briefs + Kate's notes
│   └── YYYY-MM-DD - {Topic}.md     
│
├── Daily/                          ← Morning triage briefs
│   └── YYYY-MM-DD.md              
│
├── Weekly/                         ← ROB summaries
│   └── YYYY-W{XX}.md             
│
└── _agent-log/                     ← Full audit trail
    └── YYYY-MM-DD.md
```

---

## 7.5 The Compounding Effect

The value of the system increases non-linearly with use:

| After... | The system knows... | Kate's experience... |
|----------|--------------------|--------------------|
| **Week 1** | Global preferences, VIP list, basic templates | Triage briefs are helpful but generic |
| **Week 4** | 20+ customer files with IDs, 50+ people files, 20 meeting notes | Briefs pull real context, CRM queries are scoped, prep quality jumps |
| **Month 3** | Operating rhythm patterns, communication style fine-tuned, learning log has 100+ entries | System anticipates Kate's priorities, drafts match her voice, corrections are rare |
| **Month 6** | Full relationship graph, historical meeting context, refined templates | Kate can't imagine working without it — "best friend" bar achieved |
| **Year 1** | Deep institutional knowledge, year-over-year patterns, seasoned templates | System is irreplaceable because the vault IS Kate's externalized expertise |

---

## 7.6 Privacy & Data Boundary

| Data Type | Where It Lives | Who Accesses It |
|-----------|---------------|-----------------|
| Kate's preferences | Local vault files | Copilot (read), Kate (read/write) |
| Customer context | Local vault files | Copilot (read/write), Kate (read/write) |
| Email content | M365 (not stored locally) | Copilot (read via MCP, per-session) |
| CRM data | Dynamics 365 (not stored locally) | Copilot (read/write via MCP, scoped) |
| Calendar data | M365 (not stored locally) | Copilot (read via MCP, per-session) |
| Agent logs | Local vault files | Kate (read), system (write) |

**The vault is the only persistent local store.** MCP queries are per-session. Nothing is sent to external systems beyond the authenticated MCP calls.

---

*Previous: [← Trust & Automation Model](./06-trust-model.md) · Next: [Non-Technical User Experience →](./08-user-experience.md)*
