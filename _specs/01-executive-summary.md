# 1. Executive Summary

This spec defines a **Chief of Staff framework** — a system of GitHub Copilot customization files, MCP server connections, and a persistent, self-updating vault that together give an executive assistant superpowers without requiring any technical knowledge to use or customize. (The user experience is delivered through VS Code's Copilot Chat interface using a workspace-as-application pattern — a bespoke standalone UI is planned but not yet implemented).

The target user is **Kate Huey**, a high-functioning personal assistant / chief of staff who already operates at a high level. The goal is not to replace Kate's judgment — it's to make an exceptional operator even more effective by giving her:

- An immediately actionable operating picture instead of a raw inbox
- Better prep artifacts assembled before she has to hunt for them
- Higher-quality first drafts that save meaningful time
- A highly efficient system that orchestrates context from M365 and CRM into a local vault, frontloading knowledge for rapid, accurate assistance and getting incrementally smarter with every use.

---

## Core Thesis

> **AI gives the assistant / chief of staff an immediately actionable operating picture, better prep artifacts, and higher-quality first drafts.**

The wedge is **not** "AI writes notes." The wedge is that Copilot acts as a tireless junior staffer who pre-processes, pre-researches, and pre-drafts — so Kate can focus her time on the things only she can do: judgment, tone, relationships, and ownership.

---

## Why Copilot Customization Files

Most AI assistant products ship a fixed set of features. This system is different: it's built on GitHub Copilot's **native customization layer** — plain markdown files that define behaviors, prompts, and workflows.

This matters because:

| Property | Why it matters for Kate |
|----------|----------------------|
| **Plain English** | Every instruction file is readable natural language — no code, no config syntax |
| **Editable by the user** | Kate can change how the system works by editing `.md` files directly or asking Copilot conversationally — though the envisioned guided UI skill for this does not yet exist |
| **Composable** | Small, focused files combine into complex workflows — add a new one without touching the rest |
| **Versionable** | Every change is tracked in Git — though the planned invisible auto-sync layer is not yet implemented |
| **Portable** | The files currently work inside VS Code with Copilot Chat — the planned standalone SDK app surface is not yet built |
| **Evolvable** | Start simple, add sophistication over time as trust and comfort grow |

---

## The Three-Layer Architecture (Preview)

```
┌───────────────────────────────────────────────────────────────┐
│  Layer 3: Natural Language Instructions                        │
│  .instructions.md · .prompt.md · agents · skills              │
│  ─── "What to do and how to think about it"                   │
├───────────────────────────────────────────────────────────────┤
│  Layer 2: MCP Servers (Data Bridge & Actions)                  │
│  M365 (mail, calendar, Teams) · MSX/CRM · Vault (OIL)        │
│  Excalidraw · PowerBI · Future: Travel, LinkedIn              │
│  ─── "How to read data and take action"                       │
├───────────────────────────────────────────────────────────────┤
│  Layer 1: Second Brain (Vault)                                 │
│  Preferences · Patterns · History · Templates · Learning log  │
│  ─── "What the system knows and remembers"                    │
└───────────────────────────────────────────────────────────────┘
```

Layer 3 is what Kate reads and edits. Layer 2 is what connects Copilot to real data. Layer 1 is what makes the system get smarter over time.

---

## What This Is Not

- **Not a chatbot** — this is an AI workflow framework, not a conversational dumping ground
- **Not a replacement for Kate** — it's a force multiplier; Kate keeps ownership of all final communication
- **Not a fixed product** — it's a living system that evolves with Kate's workload
- **Not code** — the entire behavior layer is plain English markdown files *(though initial setup currently requires terminal commands — a guided onboarding experience is planned)*
- **Not autonomous** — high-sensitivity actions (sending emails, posting to Teams) are always staged for review *(enforced via CRM approval queue and instruction-level guardrails)*

---

## Aspirational Bar

> Kate wants this to feel like a hyper-efficient co-executor — a trusted system that anticipates fire drills, immediately surfaces the right context, and drafts prep work perfectly on brand without wasting time or tokens on banter.

The design must deliver deep personalization and anticipation—nailing the nuances of business relationships and internal stakeholder dynamics—while maximizing speed and always letting Kate pull the final trigger.

---

## Implementation Status (Audited 2026-03-18)

| Claim | Status | Notes |
|-------|--------|-------|
| **System of Copilot customization files** | ✅ Implemented | 5 `.instructions.md`, 6 `.prompt.md`, 1 `.agent.md` — all functional |
| **MCP server connections** | ✅ Implemented | 12 servers configured: 3 local (MSX, OIL, Excalidraw) + 9 remote (M365 suite, GitHub, Power BI, ADO) |
| **Persistent, self-updating vault** | ⚠️ Partial | Vault scaffold exists (vault-starter), OIL MCP reads/writes work, but 12 of 19 OIL tools are dead code (orient + composite tools never registered at runtime) |
| **Bespoke UI built atop Copilot SDK** | ❌ Not implemented | System runs inside VS Code + Copilot Chat. No custom UI, no forms, no guided wizards. COS personalization spec exists as design doc only. |
| **No technical knowledge required** | ⚠️ Aspirational | Setup requires `node scripts/init.js`, `.env` configuration, and Azure CLI login. Daily use is conversational, but onboarding is technical. |
| **Immediately actionable operating picture** | ✅ Implemented | Morning triage pipeline (`morning-prep.sh` → `morning-triage.prompt.md`) produces structured daily briefs |
| **Better prep artifacts** | ✅ Implemented | `meeting-brief.prompt.md` assembles cross-source prep. Templates provided in vault-starter. |
| **Higher-quality first drafts** | ✅ Implemented | Communication style instructions + vault templates enable pattern-aware drafting |
| **Getting incrementally smarter** | ✅ Implemented | Full learning loop: `triage-correction-loop.prompt.md` captures daily corrections, `learning-review.prompt.md` scans for recurring patterns (3+) and proposes vault promotions with diffs, `vault-hygiene.prompt.md` cleans stale content and migrates lingering action items. All with run/validate/repair automation. Automated promotion into instruction files is intentionally gated on human approval. |

### Key Discrepancies

1. **"Bespoke UI" language is inaccurate** — The entire user experience is VS Code's Copilot Chat panel with agent/prompt/instruction files. The spec should reflect this is a *workspace-as-application* pattern, not a custom UI.

2. **"Editable by the user" via custom UI skill** — No such skill exists. Kate would need to edit `.md` files directly or ask Copilot to do it conversationally. The `agent-customization` skill is a generic Copilot feature, not KATE custom code.

3. **"Invisible version control"** — Not implemented. No auto-commit, no background Git sync. Only manual `subtree-sync.sh` exists for repo mirroring.

4. **"Portable / specialized app plugin"** — The system is anchored to VS Code. No standalone app, CLI wrapper, or SDK plugin has been built.

---

*Next: [Problem Statement →](./02-problem-statement.md)*
