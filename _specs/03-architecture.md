# 3. Architecture: The Workflow Engine

This framework drops the complex abstractions of an "operating system" in favor of a highly efficient, deterministic workflow engine. It relies on a local Markdown vault acting as an L1 Cache, orchestrated by the GitHub Copilot SDK, and securely presented through a bespoke UI wrapper.

## 3.1 The Three-Layer Stack

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   LAYER 3 — THE UI & SHELL ABSTRACTION (SDK PLUGIN)                  │
│   The "No-Code Interface & State Manager"                            │
│   ⚠️ STATUS: NOT YET IMPLEMENTED — currently VS Code Copilot Chat   │
│                                                                      │
│   • Bespoke UI built over the Copilot CLI / SDK      [NOT STARTED]  │
│   • Custom Skills that interview Kate to update behavior [DESIGNED]  │
│   • Invisible version control (Git runs automatically) [NOT STARTED] │
│   • Forms and guided workflows instead of IDE editing  [NOT STARTED] │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   LAYER 2 — THE ORCHESTRATION ENGINE (COPILOT + MCP SERVERS)         │
│   The "Execution & Tooling Layer"                                    │
│   ✅ STATUS: SUBSTANTIALLY COMPLETE — 12 MCP servers, 6 prompts     │
│                                                                      │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│   │ Instructions │ │ Custom Skills│ │   Prompts    │                 │
│   │ (.md files)  │ │ (Workflows)  │ │   (.md)      │                 │
│   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                 │
│          └────────────────┼────────────────┘                         │
│                 [ COPILOT LLM / ROUTER ]                             │
│          ┌────────────────┼────────────────┐                         │
│   ┌──────▼───────┐ ┌──────▼───────┐ ┌──────▼───────┐                 │
│   │ M365 MCP     │ │ MSX/CRM MCP  │ │ Vault MCP    │                 │
│   │ (Graph API)  │ │ (Dynamics)   │ │ (Read/Write) │                 │
│   └──────────────┘ └──────────────┘ └──────────────┘                 │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   LAYER 1 — THE SECURE L1 CACHE (OBSIDIAN-STYLE VAULT)               │
│   The "Front-Loaded Memory Repository"                               │
│   ⚠️ STATUS: SCAFFOLD COMPLETE — core R/W works, intelligence inert │
│                                                                      │
│   Vault/ (Secured via Intune & Conditional Access)                   │
│   ├── _kate/                 ← Kate's explicit operating rules  ✅   │
│   ├── Daily/                 ← Morning triage briefs            ✅   │
│   ├── Meetings/              ← Meeting prep one-pagers          ✅   │
│   ├── Weekly/                ← ROB summaries (missing from scaffold) │
│   ├── Stakeholders/          ← Planned but not scaffolded       ❌   │
│   ├── Runbooks/              ← Planned but not scaffolded       ❌   │
│   └── Projects/              ← Planned but not scaffolded       ❌   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3.2 The Shift to "Explicit Front-Loading"

Earlier iterations imagined a system that continuously and quietly polled M365 to update a background brain. That model results in data swamps, high latency, and hallucination risks.

The new architecture relies on **Explicit Orchestration via Skills**:
Rather than active polling in the background, the Copilot engine uses highly structured Skills to **front-load context** into the local Vault. 

### Example: How the L1 Cache (Vault) stays updated
1. Kate is prepping for an executive sync and triggers the `@Stakeholder-Refresh` skill.
2. The skill orchestrates a set of tools across the M365 MCP (getting recent emails summary) and MSX MCP (pulling account health).
3. The Copilot engine writes a highly structured, accurate markdown profile into `Vault/Stakeholders/john_doe.md`.
4. Tomorrow, when Kate asks Copilot "Draft an email to John", Copilot reads `/Stakeholders/john_doe.md` in less than 200 milliseconds. 
**Result**: Lightning-fast, highly contextual, zero-hallucination output without paying the 10-second penalty of a live Graph API/CRM lookup mid-chat.

> **⚠️ Implementation Status:** This example describes the aspirational pattern but `@Stakeholder-Refresh` does not exist as a skill or prompt file. The `Stakeholders/` vault folder is not scaffolded. The OIL tools that would power this (`get_customer_context`, `get_person_context`, `correlate_with_vault`, `promote_findings`) are implemented but are **dead code** — never registered at server startup. The closest working equivalent is the `meeting-brief.prompt.md` workflow, which does assemble cross-source context but writes to `Meetings/`, not `Stakeholders/`.

---

## 3.3 Security & State Management

### Intune / Conditional Access
Because the Vault is effectively an unencrypted log of executive-tier insights, it is physically anchored. The system only operates on hardware heavily managed by Microsoft Intune, behind strict Conditional Access policies. The data footprint is no riskier than the local `.ost`/cache Outlook already maintains. If the device goes missing, the Vault dies with the hardware.

### Invisible Git Sync 
The target user will never touch `git commit` or resolve a merge conflict in VS Code. All versioning is abstracted.
When Kate updates her rules via the overarching UI (e.g., “Stop prioritizing emails from Vendor X”), a custom internal Skill intercepts the natural language, translates it to a diff on the `inbox-triage.instructions.md` file, safely commits it under the hood, and reloads the engine.
> **⚠️ Implementation Status: NOT BUILT.** No auto-commit, auto-push, or background Git sync exists in the codebase. The only Git-related script is `subtree-sync.sh` for manual sub-repo mirroring. Vault files and instruction changes are not automatically versioned.

---

## 3.4 Implementation Status (Audited 2026-03-18)

### Layer-by-Layer Compliance

#### LAYER 1 — The Secure L1 Cache (Vault)

| Component | Spec | Implementation | Status |
|---|---|---|---|
| `_kate/` operating rules | Preferences, comms style, VIP list, operating rhythm, learning log | All 5 files exist in `vault-starter/` — template/scaffold with placeholders | ✅ Structure exists |
| `Stakeholders/` | Pushed from CRM by active skills | No `Stakeholders/` folder in vault-starter. OIL `get_customer_context` and `get_person_context` tools exist but are **dead code** (never registered) | ❌ Not wired |
| `Runbooks/` | Pre-established playbooks | No `Runbooks/` folder exists. No playbook content. | ❌ Not built |
| `Projects/` | Context extracted from M365 threads | No `Projects/` folder exists. No thread extraction workflow. | ❌ Not built |
| `Daily_Briefs/` | Aggregated daily prep material | `Daily/` folder exists (not `Daily_Briefs/`). Morning triage writes here. | ✅ Implemented (name differs) |
| OIL MCP server | Read/write/search/graph vault access | 7 tools active (retrieve + write). **12 tools dead code** (orient + composite). Graph, cache, watcher all functional. | ⚠️ Partial — core works, intelligence layer inert |
| Semantic search | Embedding-based retrieval | Code exists for `@xenova/transformers` but it's not in `dependencies` (optional). Falls back to fuzzy search. | ⚠️ Opt-in, undocumented |
| Bootstrap | One-command vault setup | `scripts/bootstrap-kate-vault.sh` — non-destructive copy of all templates/preferences. Requires `.env` with `OBSIDIAN_VAULT_PATH`. | ✅ Implemented |

#### LAYER 2 — The Orchestration Engine (Copilot + MCP Servers)

| Component | Spec | Implementation | Status |
|---|---|---|---|
| Instructions (`.md` files) | Behavioral rules for triage, prep, CRM ops, comms style | 5 files: `copilot-instructions.md`, `inbox-triage.instructions.md`, `meeting-prep.instructions.md`, `crm-operations.instructions.md`, `communication-style.instructions.md` | ✅ Complete |
| Prompts / Workflows | Structured task templates | 6 prompts: morning-triage, morning-prep, meeting-brief, triage-correction-loop, update-request, weekly-rob | ✅ Complete |
| Agent definition | Chief of Staff persona | `chief-of-staff.agent.md` with tool restrictions and operating rules | ✅ Complete |
| M365 MCP (Graph API) | Mail, calendar, Teams access | 6 remote HTTP servers: mail, calendar, teams, sharepoint, word, workiq — all via `agent365.svc.cloud.microsoft` | ✅ Complete |
| MSX/CRM MCP (Dynamics) | CRM read/write with safety | **Production-grade**: 27 tools, approval queue, audit trail, prompt guard (10 injection patterns), entity allowlist, input validation, AI attribution on writes | ✅ Exceeds spec |
| Vault MCP (OIL) | Vault read/write/search | 7 active tools. Graph index, session cache, file watcher all functional. 12 additional tools implemented but unreachable. | ⚠️ Partial |
| Excalidraw MCP | Diagram creation | 4 tools: create, list, get, export-to-SVG. Server-side renderer for 6 element types. | ✅ Complete |
| PowerBI MCP | Dashboard data access | Remote HTTP server via `api.fabric.microsoft.com`. | ✅ Complete |
| GitHub MCP | Repo operations | Remote HTTP server via `api.githubcopilot.com` | ✅ Complete |
| ADO MCP | Azure DevOps access | Local stdio via `npx @azure-devops/mcp` | ✅ Complete |

#### LAYER 3 — The UI & Shell Abstraction

| Component | Spec | Implementation | Status |
|---|---|---|---|
| Bespoke UI over Copilot SDK | Custom forms, guided workflows | **Not built.** UX is VS Code Copilot Chat with agent/prompt files. | ❌ Not started |
| Custom Skills that interview Kate | Onboarding, preference capture | **Not built.** `cos-getting-started.prompt.md` designed in COS spec but not created. | ❌ Not started |
| Invisible version control | Auto-commit/push behind the scenes | **Not built.** No Git automation exists. | ❌ Not started |
| Non-technical editing surface | Kate edits via UI, not raw files | **Not built.** Copilot Chat is conversational but there are no forms or wizards. Kate sees raw VS Code. | ❌ Not started |

### Infrastructure & Tooling

| Component | Status | Notes |
|---|---|---|
| Setup script (`init.js`) | ✅ | Interactive setup: prerequisites check, MCP build, vault path config, risk consent |
| Morning automation (`morning-prep.sh`) | ✅ | Weekday scheduling via `copilot` CLI, with validator and correction loop |
| launchd integration | ✅ | `install-morning-launchd.sh` for macOS auto-scheduling |
| Eval framework | ⚠️ Scaffolded | `eval-persist.js` (baseline/diff/regression detection), `capture-fixtures.js`, `sync-mock-tools.js` exist. But `evals/` dir is gitignored — no committed test suites. |
| Instruction integrity | ✅ | `verify-instructions.js` SHA-256 checksums for tampering detection |
| Per-server unit tests | ✅ | Vitest configs and test suites in `mcp/msx/`, `mcp/oil/`, `mcp/excalidraw/` |

---

### Critical Issues

1. **12 OIL tools are dead code.** `registerCompositeTools` and `registerOrientTools` are fully implemented and tested but never imported/called in `mcp/oil/src/index.ts`. This silently disables the vault intelligence layer — tools like `get_vault_context`, `get_customer_context`, `check_vault_health`, and `get_drift_report` are unreachable. **Fix: add two import lines and two function calls in index.ts.**

2. **Layer 3 is entirely unbuilt.** The architecture spec describes a "bespoke UI built over the Copilot CLI/SDK" with forms, guided workflows, and invisible Git sync. None of this exists. The system is a VS Code workspace. This is the largest gap between spec and implementation.

3. **Vault structure diverges from spec.** The spec shows `Stakeholders/`, `Runbooks/`, `Projects/`, `Daily_Briefs/`. The implementation has `Daily/`, `Meetings/`, `Weekly/` (partially — `Weekly/` is referenced in prompts but missing from vault-starter). The bootstrap script and vault-starter don't create the spec'd structure.

4. **`Weekly/` folder missing from vault-starter.** `weekly-rob.prompt.md` writes to `Weekly/{{TODAY}}-rob.md`, but `bootstrap-kate-vault.sh` doesn't create this directory. First ROB run will fail if OIL doesn't auto-create directories.

5. **No `.env.example` file.** Multiple scripts depend on `OBSIDIAN_VAULT_PATH` from `.env`, but no example file exists to guide manual setup outside of `init.js`.

6. **Phantom `package.json` references.** `bin/mcaps.js` (CLI entry point), `site/` (mkdocs docs), root `vitest.config.ts`, and `evals/vitest.live.config.ts` are referenced in package.json but don't exist on disk.

7. **`@Stakeholder-Refresh` skill doesn't exist.** The spec uses this as the primary example of explicit front-loading, but no such skill or prompt file has been created.