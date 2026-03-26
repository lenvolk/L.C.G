<p align="center">
  <img src="image/README/avatar.png" alt="L.C.G. — Let Copilot Grind" width="200">
</p>

# L.C.G.

### Let Copilot Grind

*Stop doing the grind yourself. Let Copilot do it.*

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Copilot](https://img.shields.io/badge/GitHub_Copilot-VS_Code-000?logo=github&logoColor=white)](https://github.com/features/copilot)
[![MCP](https://img.shields.io/badge/MCP_Servers-12-blue)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-Private-red)](#)

</div>

---

## The Grind is Real

You already know the pain:

- **Hundreds of emails** — and you're manually deciding what matters before your first coffee
- **Back-to-back meetings** — prep means hunting across 5+ tools you didn't build and don't love
- **Same deliverables, every week** — rebuilt from scratch instead of compounding
- **Institutional memory** — trapped in your head, not in a system
- **Follow-ups everywhere** — scattered across email, CRM, Teams, and sticky notes

No single tool today gives you deep M365/CRM integration, persistent personalization, *and* trust-appropriate automation where you still own every final call. So you grind. Every. Single. Day.

---

## Let Copilot Grind Instead

L.C.G. turns GitHub Copilot into the tireless junior staffer you always wanted — one that **pre-processes, pre-researches, and pre-drafts everything** so you can focus on judgment, relationships, and the work that actually requires a human.

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
| **Instructions & Skills** | Plain-English markdown files that define behavior           | Anyone can read, edit, and version them — zero code required              |
| **MCP Servers**           | Connect Copilot to live data (email, CRM, calendar, vault)  | One prompt, 12 systems queried — Copilot does the legwork                 |
| **Second Brain**          | Local Obsidian vault acts as an L1 cache of durable context | The system remembers so you don't have to — gets smarter every cycle     |

---

## Agents

L.C.G. uses a **two-agent architecture** — you think, Copilot grinds:

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

> The brain resolves all context from the vault *before* handing off to the hands — so the grind is fast, accurate, and hallucination-free.

---

## What Copilot Grinds For You

All workflows are one `/prompt` away — type it in Copilot Chat and pick from the list.

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

Copilot even fixes its own mistakes. Every core workflow has a **repair** prompt that auto-corrects validation failures:

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
git clone https://github.com/JinLee794/L.C.G.git
cd L.C.G
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
L.C.G/
├── .github/
│   ├── instructions/        ← 5 behavior rules (triage, prep, CRM, comms, copilot)
│   ├── prompts/             ← 19 workflow templates (morning triage, meeting brief, etc.)
│   ├── skills/              ← 21 domain skills (calendar scoping, pipeline triage, etc.)
│   └── agents/              ← Agent definitions (Chief of Staff)
├── scripts/                 ← Automation scripts (morning prep, meeting prep, etc.)
├── vault-starter/           ← Obsidian vault templates & preferences
│   ├── _LCG/               ← Operating rules, VIP list, learning log
│   ├── Daily/               ← Morning triage output
│   └── Meetings/            ← Meeting prep one-pagers
├── _specs/                  ← Design specifications & architecture docs
└── package.json             ← All npm scripts for workflows
```

---

## MCP Servers

L.C.G. connects to MCP servers through the workspace MCP config in [.vscode/mcp.json](/Users/jinle/Repos/_InternalTools/LCG/.vscode/mcp.json).

### Workspace-Configured Servers

| Server                                                           | Transport | Purpose                                |
| ---------------------------------------------------------------- | --------- | -------------------------------------- |
| **msx-crm**                                                | `npx`   | Microsoft Sales Experience integration |
| **oil**                                                    | `npx`   | Obsidian vault read/write/search       |
| **calendar / mail / teams / sharepoint / word / onedrive** | HTTP      | Microsoft 365 data and actions         |

---

## Trust Model

Copilot grinds, but **you stay in control**. Strict human-in-the-loop on everything that matters:

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

For when you want to let Copilot grind headlessly. Most day-to-day use goes through `/prompt` in Copilot Chat (see [What Copilot Grinds For You](#what-copilot-grinds-for-you) above).

| Category             | Command                              | Description                                  |
| -------------------- | ------------------------------------ | -------------------------------------------- |
| **Setup**      | `npm run setup`                    | Verify prerequisites and configure local env |
|                      | `npm run check`                    | Verify environment and workspace config      |
|                      | `npm run vault:init`               | Bootstrap Obsidian vault from templates      |
| **Validation** | `npm run morning:validate`         | Validate morning brief output                |
|                      | `npm run meeting:validate`         | Validate meeting brief                       |
|                      | `npm run update-request:validate`  | Validate update request output               |
|                      | `npm run learning:review:validate` | Validate learning review output              |
| **Eval**       | `npm run eval`                     | Run evaluation suite                         |
|                      | `npm run eval:live`                | Run live evaluation tests                    |

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

*L.C.G. — Let Copilot Grind — Private repository — Internal use only*

</div>
