# Chief of Staff — Copilot Framework Spec v0.1

> A personal-assistant workflow engine built on GitHub Copilot customization, MCP servers, and a living, self-updating second brain. · Draft · March 2026

This spec defines how to turn GitHub Copilot into a **Chief of Staff** for a General Manager — not by replacing judgment, but by reducing triage load, sharpening focus, and raising the quality of prep work.

Implementation status is tracked in [Implementation Roadmap](./09-roadmap.md) § 9.0 *Current Status Snapshot* and reflected in [Open Questions](./10-open-questions.md) § 10.6 *Implementation Reality Check*.

The architecture is three layers:

1. **Natural language files** (`.instructions.md`, `.prompt.md`, agents) — capture workflow nuance, preferences, and operating rhythm in plain English so a non-technical user can read, understand, and customize
2. **MCP servers** — the data bridge and action layer connecting Copilot to M365, CRM, vault, and other systems
3. **Second brain (vault)** — durable, human-readable memory that gets smarter with every use

---

## Documents

| # | Section | Summary |
|---|---------|---------|
| 1 | [Executive Summary](./01-executive-summary.md) | What this is, who it's for, core thesis |
| 2 | [Problem Statement](./02-problem-statement.md) | Current workflow pain, what's missing today |
| 3 | [Architecture](./03-architecture.md) | Three-layer system design: instructions → MCPs → second brain |
| 4 | [Copilot Customization Surface](./04-copilot-customization.md) | Full reference for `.instructions.md`, `.prompt.md`, agents, and skills |
| 5 | [Capability Map](./05-capability-map.md) | Detailed capability breakdown mapped to MCP tools and instruction files |
| 6 | [Trust & Automation Model](./06-trust-model.md) | What's autonomous, what's human-in-the-loop, and how trust escalates |
| 7 | [Second Brain & Learning Loop](./07-second-brain.md) | How the system builds durable memory and gets smarter over time |
| 8 | [Non-Technical User Experience](./08-user-experience.md) | How Kate interacts with and customizes the system day-to-day (via Copilot SDK UI) |
| 9 | [Implementation Roadmap](./09-roadmap.md) | Phased build plan from MVP to full workflow engine |
| 10 | [Open Questions](./10-open-questions.md) | Unresolved decisions and areas for user input |

---

## Key Principles

- **Copilot as engine, not product** — the value is in the composition of instructions, tools, and memory — not in any single feature
- **Natural language is the configuration language** — every behavior is defined in `.md` files a human can read and edit (guided by automated custom skills)
- **MCP servers are the hands** — Copilot thinks and plans; MCPs read email, query CRM, check calendars, and stage actions
- **The vault is the local cache and memory** — rather than actively polling in the background, the system relies on structured skills to selectively extract and save key context from M365 and CRM interactions. This builds a local Obsidian-style markdown vault that safely frontloads context for lightning-fast, accurate retrieval.
- **Human owns the final mile** — the system drafts, prepares, and recommends; the operator decides, edits, and sends
- **Non-technical-first design** — if the operator can't understand a file by reading it, the file is wrong. UI wrappers abstract away the complexities of Git and the IDE.
