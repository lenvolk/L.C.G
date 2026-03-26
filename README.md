<p align="center">
  <img src="image/README/avatar.png" alt="K.A.T.E. IQ" width="200">
</p>

# K.A.T.E.

### **Knowledge Automation & Triage Engine**

*An AI-powered Chief of Staff framework built on GitHub Copilot's customization layer.*

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Copilot](https://img.shields.io/badge/GitHub_Copilot-VS_Code-000?logo=github&logoColor=white)](https://github.com/features/copilot)
[![MCP](https://img.shields.io/badge/MCP_Servers-12-blue)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-Private-red)](#)

</div>

---

## The Problem

Chiefs of staff and executive assistants face a compounding information challenge:

- **Dense inboxes** — no pre-processed priority view across hundreds of daily messages
- **Back-to-back meetings** — prep requires hunting across 5+ disconnected tools
- **Recurring deliverables** — rebuilt from scratch every cycle instead of compounding
- **Institutional memory** — lives in one person's head, not in a durable system
- **Action tracking** — manual follow-up scattered across email, CRM, and chat

No single tool today provides deep M365/CRM integration, persistent personalization, *and* trust-appropriate automation where the human always owns the final decision.

---

## How K.A.T.E. Solves It

K.A.T.E. turns GitHub Copilot into a tireless junior staffer that **pre-processes, pre-researches, and pre-drafts** — so the operator can focus on judgment, tone, and relationships.

### The Three-Layer Architecture

```
                      YOU (natural language)
                              |
                              v
 +--------------------------------------------------------------+
 |                                                              |
 |  LAYER 1 -- Natural Language Instructions                    |
 |                                                              |
 |    .instructions.md   .prompt.md   agents   skills           |
 |    "What to do and how to think about it"                    |
 |                                                              |
 +--------------------------------------------------------------+
 |                                                              |
 |  LAYER 2 -- MCP Servers (Data Bridge & Actions)              |
 |                                                              |
 |    +------+ +-----+ +-------+ +-----+ +-----+ +---------+    |
 |    | Mail | | Cal | | Teams | | CRM | | PBI | | Vault   |    |
 |    +------+ +-----+ +-------+ +-----+ +-----+ +---------+    |
 |                                                              |
 |    "How to read data and take action"                        |
 |                                                              |
 +--------------------------------------------------------------+
 |                                                              |
 |  LAYER 3 -- Second Brain (Obsidian Vault)                    |
 |                                                              |
 |    Preferences  Patterns  History  Templates  Learning Log   |
 |    "What the system knows and remembers"                     |
 |                                                              |
 +--------------------------------------------------------------+
```

| Layer                           | What it does                                                | Why it matters                                                             |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Instructions & Skills** | Plain-English markdown files that define behavior           | Anyone can read, edit, and version them — no code needed                  |
| **MCP Servers**           | Connect Copilot to live data (email, CRM, calendar, vault)  | One agent queries 12 systems in a single turn                              |
| **Second Brain**          | Local Obsidian vault acts as an L1 cache of durable context | Lightning-fast, zero-hallucination recall — system gets smarter over time |

---

## Agents

K.A.T.E. uses a **two-agent architecture** that separates strategy from execution:

```
 +-------------------------------------------------------------+
 |                                                             |
 |   CHIEF OF STAFF  (the brain)                               |
 |                                                             |
 |   Owns triage, prioritization, prep, drafting,              |
 |   risk framing, and all recommendations.                    |
 |                                                             |
 |   Tools:  CRM (MSX)  |  Vault (OIL)  |  Search  |  Edit     |
 |                                                             |
 |   +-----------------------------------------------------+   |
 |   |  When an M365 action is needed (send email, post    |   |
 |   |  to Teams, schedule meeting, etc.)  ------------>   |   |
 |   +-----------------------------------------------------+   |
 |                                                             |
 +------------------------------+------------------------------+
                                |  delegates
                                v
 +-------------------------------------------------------------+
 |                                                             |
 |   M365-ACTIONS  (the hands)                                 |
 |                                                             |
 |   Executes scoped M365 operations only.                     |
 |   Never makes strategic decisions.                          |
 |                                                             |
 |   Tools:  Mail  |  Calendar  |  Teams  |  SharePoint  |  Word
 |                                                             |
 +-------------------------------------------------------------+
```

| Agent                    | Role                              | Tools                                   | Guardrails                                                                |
| ------------------------ | --------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| **Chief of Staff** | Strategy, triage, prep, drafting  | CRM, Vault, Search, Edit                | Never sends email directly; stages all CRM writes                         |
| **m365-actions**   | Execute delegated M365 operations | Mail, Calendar, Teams, SharePoint, Word | Only acts on scoped instructions from parent; never makes strategic calls |

> The Chief of Staff resolves all identity and business context from the vault *before* handing off to m365-actions — keeping latency low and hallucination risk near zero.

---

## Key Workflows

All workflows are invoked via **`/prompt`** in Copilot Chat — type `/prompt` and select from the list.

### Daily Operations

| Prompt                  | What It Does                                                    |
| ----------------------- | --------------------------------------------------------------- |
| 🌅`/morning-triage`   | Scans inbox + calendar → produces a prioritized daily brief    |
| 🌅`/morning-prep`     | Condensed variant — quick morning readout                      |
| 📋`/meeting-brief`    | Assembles a one-page brief from email, CRM, calendar, and vault |
| 📊`/meeting-followup` | Generates post-meeting action summaries and next steps          |
| 📩`/update-request`   | Drafts milestone follow-up emails from CRM data                 |

### Weekly & Recurring

| Prompt                      | What It Does                                     |
| --------------------------- | ------------------------------------------------ |
| 📆`/weekly-rob`           | Prepares the weekly rhythm-of-business summary   |
| 🏆`/winning-wednesdays`   | Summarizes Winning Wednesdays channel highlights |
| 🏆`/win-wire-digest`      | Compiles Win Wire entries into a digest          |
| 🏆`/patty-d-deal-summary` | Drafts a Patty D deal recap                      |
| 📢`/stu-highlights`       | Pulls STU channel highlights                     |

### System Maintenance

| Prompt                          | What It Does                                                            |
| ------------------------------- | ----------------------------------------------------------------------- |
| 🔄`/learning-review`          | Reviews corrections → proposes vault promotions for recurring patterns |
| ✏️`/triage-correction-loop` | Captures triage corrections to feed the learning loop                   |
| 🧹`/vault-hygiene`            | Cleans stale notes, migrates lingering action items                     |
| 🎨`/pptx-builder`             | Generates a PowerPoint deck from structured content                     |

### Self-Correction

Every core workflow has a **repair** prompt that auto-fixes validation failures:

| Repair Prompt                | Fixes                    |
| ---------------------------- | ------------------------ |
| `/morning-triage-repair`   | Morning triage output    |
| `/meeting-brief-repair`    | Meeting brief output     |
| `/meeting-followup-repair` | Meeting follow-up output |
| `/update-request-repair`   | Update request output    |
| `/learning-review-repair`  | Learning review output   |

---

## Prerequisites

| Requirement         | Minimum Version | Check                       |
| ------------------- | --------------- | --------------------------- |
| Node.js             | ≥ 18           | `node --version`          |
| npm                 | ≥ 9            | `npm --version`           |
| VS Code             | Insiders        | `code-insiders --version` |
| GitHub Copilot Chat | Enabled         | Extensions panel            |
| Azure CLI           | Latest          | `az --version`            |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/JinLee794/K.A.T.E.git
cd K.A.T.E
```

### 2. Install everything (one command)

```bash
npm install
```

> This runs the `postinstall` hook which automatically:
>
> - Checks prerequisites (Node ≥ 18, npm)
> - Verifies GitHub Packages authentication for MCP server packages
> - Verifies the workspace MCP configuration is present

> **First time?** If `npm install` fails with a `401` or `404` from `npm.pkg.github.com`, you need to set up GitHub Packages authentication — see [Troubleshooting](#troubleshooting) below.

### 3. Sign in to Azure (for CRM access)

```bash
az login
```

### 4. Bootstrap your vault (first time only)

```bash
npm run vault:init
```

> This copies starter templates into your Obsidian vault. Set `OBSIDIAN_VAULT_PATH` in your `.env` first.

### 5. Open in VS Code and start chatting

```bash
code .
```

Open Copilot Chat → select the **Chief of Staff** agent → you're live.

---

## Project Structure

```
K.A.T.E/
├── .github/
│   ├── instructions/        ← 5 behavior rules (triage, prep, CRM, comms, copilot)
│   ├── prompts/             ← 19 workflow templates (morning triage, meeting brief, etc.)
│   ├── skills/              ← 21 domain skills (calendar scoping, pipeline triage, etc.)
│   └── agents/              ← Agent definitions (Chief of Staff)
├── scripts/                 ← Automation scripts (morning prep, meeting prep, etc.)
├── vault-starter/           ← Obsidian vault templates & preferences
│   ├── _kate/               ← Operating rules, VIP list, learning log
│   ├── Daily/               ← Morning triage output
│   └── Meetings/            ← Meeting prep one-pagers
├── _specs/                  ← Design specifications & architecture docs
└── package.json             ← All npm scripts for workflows
```

---

## MCP Servers

K.A.T.E. connects to MCP servers through the workspace MCP config in [.vscode/mcp.json](/Users/jinle/Repos/_InternalTools/KATE/.vscode/mcp.json).

### Workspace-Configured Servers

| Server | Transport | Purpose |
| ------ | --------- | ------- |
| **msx-crm** | `npx` | Microsoft Sales Experience integration |
| **oil** | `npx` | Obsidian vault read/write/search |
| **calendar / mail / teams / sharepoint / word / onedrive** | HTTP | Microsoft 365 data and actions |

---

## Trust Model

K.A.T.E. is designed with a strict **human-in-the-loop** trust model:

| Policy                 | Behavior                                      |
| ---------------------- | --------------------------------------------- |
| **Email**        | Drafts only — never sends directly           |
| **Teams**        | Requires explicit approval before posting     |
| **CRM writes**   | All mutations staged in an approval queue     |
| **Audit trail**  | Every CRM operation fully logged              |
| **Prompt guard** | 10 injection-detection patterns on CRM inputs |
| **Vault data**   | Stays local on disk — never synced to cloud  |

---

## npm Scripts (Developer Reference)

These scripts support setup, headless automation, and validation. Most day-to-day use goes through `/prompt` in Copilot Chat (see [Key Workflows](#key-workflows) above).

| Category             | Command                              | Description                             |
| -------------------- | ------------------------------------ | --------------------------------------- |
| **Setup**      | `npm run setup`                    | Verify prerequisites and configure local env |
|                      | `npm run check`                    | Verify environment and workspace config |
|                      | `npm run vault:init`               | Bootstrap Obsidian vault from templates |
| **Validation** | `npm run morning:validate`         | Validate morning brief output           |
|                      | `npm run meeting:validate`         | Validate meeting brief                  |
|                      | `npm run update-request:validate`  | Validate update request output          |
|                      | `npm run learning:review:validate` | Validate learning review output         |
| **Eval**       | `npm run eval`                     | Run evaluation suite                    |
|                      | `npm run eval:live`                | Run live evaluation tests               |

---

## Troubleshooting

### `npm ERR! 404 Not Found` or `401 Unauthorized` from `npm.pkg.github.com`

**What's happening:** Some MCP server packages (`@microsoft/msx-mcp-server`, `@jinlee794/obsidian-intelligence-layer`) are published to GitHub Packages, not the public npm registry. The project `.npmrc` already routes these scopes to the right place — but GitHub Packages requires a personal access token (PAT) for authentication, even for read-only access.

**Fix it in one step:**

```bash
npm login --registry=https://npm.pkg.github.com
```

When prompted:
- **Username:** your GitHub username
- **Password:** a personal access token (classic) with the `read:packages` scope
- **Email:** your GitHub email

That's it. The token is saved to your user-level `~/.npmrc` and applies everywhere.

<details>
<summary>Manual alternative (if <code>npm login</code> doesn't work)</summary>

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select the **`read:packages`** scope
4. Copy the token
5. Open (or create) `~/.npmrc` and add this line:

```
//npm.pkg.github.com/:_authToken=ghp_YOUR_TOKEN_HERE
```

Replace `ghp_YOUR_TOKEN_HERE` with your actual token.

</details>

> **Why is this needed?** GitHub Packages doesn't support anonymous reads. The project-level `.npmrc` in this repo handles *which* packages go to GitHub vs. public npm — you just need to provide a token so GitHub lets you in.

### MCP server fails to start with `ERR_UNSUPPORTED_ESM_URL_SCHEME`

This usually means you're running a Node version older than 18. Check with `node --version` and upgrade if needed.

### `copilot CLI not found` when running automations

The task runner uses GitHub Copilot's CLI binary. It looks for it in:
1. `COPILOT_CLI_PATH` environment variable
2. `copilot` on your system PATH
3. VS Code's bundled location (`AppData/Code/User/globalStorage/github.copilot-chat/copilotCli/`)

Make sure GitHub Copilot Chat is installed in VS Code — it bundles the CLI automatically.

### Azure CLI token expired

CRM and M365 operations require an active Azure CLI session. If you see token errors:

```bash
az login
```

---

<div align="center">

*K.A.T.E. — Private repository — Internal use only*

</div>
