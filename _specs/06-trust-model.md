# 6. Trust & Security Model

Because a Chief of Staff operates at the highest tier of organizational confidentiality, this system requires a non-negotiable, mathematically enforced trust model. "Trusting the AI to be good" is unacceptable; the safety must be structural.

---

## 6.1 The Intune-Anchored Local Vault

The system’s memory (the L1 Cache/Vault) is fundamentally air-gapped from global cloud storage. 

*   **Location:** The Vault exists strictly as local Markdown files on Kate’s corporate machine.
*   **Protection:** The host machine is managed by Microsoft Intune. If the device goes out of compliance or goes missing, it is remote-wiped. There is no central database or SaaS tenant to be breached.
*   **Access:** Copilot reads the Vault via a local file-system MCP tool, running purely on the local host shell.

---

## 6.2 Data Ingress vs. Egress Rules

The architecture explicitly separates how data flows *in* versus how it flows *out*.

### 🟩 Tier 1: Autonomous Reads (Safe)
The system is permitted to autonomously read data from designated sources to populate the Vault or build prep documents.
*   **Allowed Operations:** M365 searches, Calendar scans, CRM Opportunity lookups, MSX queries.
*   **Risk Profile:** Low. The system is just reading data Kate already has access to via her active AAD/Entra login session.

### 🟨 Tier 2: Staged Outputs (Human-in-the-Loop)
The system may draft communications or propose data modifications, but it **cannot execute them**.
*   **Allowed Operations:** Drafting an Outlook email, writing a Teams reply in a text input box, queuing an MSX/CRM Opportunity update.
*   **Risk Profile:** Medium. The AI prepares the payload, but Kate *must manually click* "Send," "Post," or "Save" in the respective UI. The system acts as the typist, Kate acts as the editor.

### 🟥 Tier 3: Autonomous Writes (Strictly Prohibited & Disabled)
The system is structurally barred from unilaterally altering data in external systems.
*   **Prohibited Operations:** Sending emails directly via API, posting to Teams autonomously, bulk-updating CRM records without a visual staging step.
*   **Mechanism:** The provided M365 and MSX MCP servers simply **do not implement** unconditional POST/PATCH endpoints for these actions. Even if the LLM hallucinates an instruction to send an email, the underlying tool throws an error.

---

## 6.3 Copilot "Zero Data Retention" Clause

Because the system uses standard GitHub Copilot models:
*   Copilot requests are scrubbed and **are not used to train the base model.**
*   The LLM is stateless. The intelligence and memory reside entirely in Kate's local Markdown Vault, not in the LLM’s weights.

## 6.4 The UI / Skill Abstraction Boundary

Kate configures the system's behavior via a custom CLI UI plugin, not by editing Markdown instructions directly. 
*   **Why this matters:** A typo in a YAML block or prompt file could accidentally strip a behavioral guardrail (e.g., deleting "never send an email"). By forcing updates through a UI-guided Skill, the abstraction layer ensures core safety constraints are permanently injected into the underlying files, regardless of Kate's input.
