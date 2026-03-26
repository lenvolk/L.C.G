# 5. Capability Map

Instead of treating the system as an open-ended conversational bot, it is decomposed into targeted "Skills" and "Workflows." Each capability bridges specific MCP tools with the local L1 Cache (Vault) to drastically reduce latency and hallucination.

---

## 5.1 The Orchestrated Workflows

### Capability: The Daily Briefing (Morning Triage)
**Goal:** Present an immediately actionable operating picture before Kate opens her inbox.

* **Trigger:** Automated via time-of-day or manual UI button.
* **Orchestration:**
  1. Calls `mcp_calendar_list` (M365) for today's meetings.
  2. Calls `mcp_mail_search` (M365) for unread mail from VIPs (identified via Vault rules).
  3. Queries the `mcp_vault_read` for established Runbooks associated with those explicit meetings.
* **Output:** A structured `Daily_Brief_{Date}.md` file dropped right into the Vault and surfaced natively in the Copilot UI app. It synthesizes what needs a response vs. what is purely informational.

### Capability: Stakeholder Front-Loading (Extractive Memory)
**Goal:** Prevent standard API latency by pre-caching vital context regarding executives, accounts, and vendors into the local Vault.

* **Trigger:** Kate triggers the `@Refresh-Stakeholders` skill before a big planning week in the UI.
* **Orchestration:**
  1. Copilot queries `mcp_msx_get_opportunity` and `mcp_msx_get_milestones`.
  2. Filters out noise and summarizes the sentiment/history.
  3. Uses `mcp_vault_write` to overwrite or create `Vault/Stakeholders/[Name].md`.
* **Output:** Lightning-fast future interactions because the AI can read local Markdown in milliseconds without touching network boundaries. 

### Capability: Inbox Draft Ghostwriting 
**Goal:** Generate hyper-accurate first drafts exactly matching Kate's tone for VIP queries.

* **Trigger:** Selected email thread -> "Draft response using [X] strategy."
* **Orchestration:**
  1. `mcp_vault_read` retrieves the cached `rule-tones.md` and specific matched Stakeholder cache.
  2. Copilot compiles a highly rigid, factual response based strictly on local front-loaded context.
  3. Stages the draft (No autonomous sending).
* **Output:** A copy-paste ready response. No banter, no generic "I hope this email finds you well" fluff.

---

## 5.2 The Configuration Abstraction Capabilities

To fulfill the "no code, no IDE" requirement, Kate needs a way to modify the system's behavior without editing Markdown files or using Git explicitly.

### Capability: The Preference Interviewer
**Goal:** Update underlying `.instructions.md` logic conversationally.

* **Trigger:** "I want to change how you handle meeting prep."
* **Orchestration:**
  1. The custom UI SDK skill intercepts the intent.
  2. The AI uses the `Copilot ask-questions` workflow to clarify exactly what she means (e.g., "Do you want this for all executives, or just Sales leaders?").
  3. The system maps the natural language answer and uses a secure filesystem skill to modify the respective `.instructions.md` file natively.
  4. Automatically runs a background `git commit` equivalent without surfacing the terminal to Kate.

### Capability: Context Garbage Collection
**Goal:** Keep the Vault fast and relevant without making it a digital hoarder's swamp.

* **Trigger:** Weekly scheduled cleanup prompt.
* **Orchestration:**
  1. Copilot scans `Vault/Daily_Briefs/` older than 14 days.
  2. Synthesizes any lingering long-term tasks and migrates them to a master `Runbook` or `To-Do` list, then safely deletes the old Daily Briefs.
  3. Purges transient Stakeholder files that haven't been referenced recently.
