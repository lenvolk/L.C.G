# 8. User Experience (The UI Abstraction)

Kate is an elite Chief of Staff, not a DevOps engineer. The fundamental UX requirement is that **she must never see a line of config code, a Git merge conflict, or a JSON payload.**

The system achieves this by hiding the entire GitHub Copilot customization engine (the `.instructions.md` rules, `.prompt.md` files, and local Git repo) behind a bespoke application built via the Copilot SDK.

---

## 8.1 The "Desktop App" Interface

Kate interacts with the system through a streamlined, lightweight UI panel that plugs into her existing Copilot workflow (likely leveraging the Copilot CLI/SDK capabilities as a standalone widget). 

The UI is divided into three primary zones:

### 1. The "Start Here" Dashboard (Vault Reader)
When Kate opens her laptop, she doesn't see a raw chat window. She sees the **Morning Triage Brief**, rendered from the `Vault/Daily/{today}.md` file.
*   **What it shows:** An immediate operating picture. "You have 3 flagged VIP emails. These 2 meetings require prep docs. Your scheduled PR touchpoint is missing an agenda."
*   **UX Pattern:** One-click action buttons attached to the insights (e.g., [Draft Responses], [Generate Prep Docs]).

### 2. The Execution Chat (The Workflow Runner)
This is the conversational interface where Kate pulls the trigger on specific jobs.
*   **Targeted Skills:** Instead of typing long, complex prompts, Kate invokes pre-packaged SDK Skills via simple slash commands or buttons (`/draft-vip-responses`, `/prep-sync john_doe`).
*   **Staging:** When the AI generates a draft, the UI presents it as a copy-paste block or automatically stages it as a Draft in Outlook. It does not send it.

### 3. The Settings Interviewer (No-Code Configuration)
This is how Kate "programs" the system without writing code. 
When Kate wants to alter how the system behaves (e.g., "Start treating Vendor X as high priority"), she clicks the **Update Preferences** button.

*   **The Flow:** The system acts like an HR business partner updating a file. It asks clarifying questions: *"Do you want me to flag ALL emails from Vendor X, or just ones mentioning contracts?"*
*   **The Abstraction:** Behind the scenes, the workflow translates her answer into Markdown updates and reloads behavior. Versioning remains internal and should not require direct Git interaction from Kate.
*   **The Result:** Kate changes the AI's core behavior purely via conversation.

---

## 8.2 A Day in the Life: The "Scorched Earth" Flow

Here is how the architecture and UX combine in a real-world scenario:

**8:00 AM:** Kate opens the app. The **Morning Triage** skill has already run. It parsed the M365 calendar and CRM, depositing a clean brief into her Vault. She reads the brief—it took ZERO seconds to load because it's a local file.

### Current Build Reality

The current implementation has production-adjacent workflow scripts and prompt contracts, but not a full bespoke UI shell yet.

- Morning triage executes through `scripts/morning-prep.sh` using `.github/prompts/morning-triage.prompt.md`.
- Morning brief structure is quality-gated by `scripts/validate-morning-brief.sh`.
- Correction loop is available via `.github/prompts/triage-correction-loop.prompt.md` and `scripts/morning-corrections.sh`.
- The UX target remains valid, but the current operator surface is primarily VS Code + Copilot CLI + vault files.

**9:15 AM:** She has a 1:1 with a difficult stakeholder. She clicks the `@Stakeholder-Refresh` skill. The UI spins for a few seconds while the MCP servers pull Dynamics CRM milestones and M365 history. The system writes a new profile to `Vault/Stakeholders/` and displays a bulleted brief in the UI.

**11:00 AM:** A fire drill hits. Kate needs an email drafted *exactly* in her boss's tone. She types `/draft-response "tell them no, budget is locked"`. Because the system is reading the local Vault (which contains the cached tone rules and stakeholder persona), it generates a flawless, factual rejection draft in under a second. 

**3:00 PM:** Kate realizes the system is forwarding too many IT updates. She clicks **Update Preferences**, says "Stop flagging routine IT maintenance emails," confirms the AI's clarifying question, and moves on. The system quietly updates its Git repo in the background. She never saw a `.md` file.
