# SQL600 Detection Rules — SQL Workload Patterns & Sales Play Mapping

> **Freedom Level: None** — These patterns and mappings are exact. Do not add, remove, or modify workload patterns or sales play expectations without updating this file.

> **Cross-role reference.** This file is the single source of truth for SQL workload classification and expected sales play values. All roles should be aware of these patterns when working on SQL600 accounts: SEs for engagement qualification, Specialists for pipeline creation, AEs for account planning, CSAMs for delivery monitoring.

---

## SQL Workload Patterns

Milestone workloads (from `_msp_workloadlkid_value` in CRM or `'✽ Pipeline'[MilestoneWorkload]` in PBI) that indicate SQL600-relevant work. Match is **case-insensitive prefix/contains**.

### Tier 1 — Core SQL Workloads (always SQL600-relevant)

| Workload Pattern | Description |
|---|---|
| `Data: SQL Modernization to Azure SQL MI with AI (PaaS)` | SQL Server → Azure SQL Managed Instance |
| `Data: SQL On-prem to Azure SQL VM (IaaS)` | SQL Server → SQL on Azure VM |
| `Data: SQL to Azure SQL Hyperscale (AI Apps & Agents)` | SQL Server → Azure SQL Hyperscale |
| `Data: SQL Server on Azure VM (Migrate & Modernize)` | SQL VM migration |

**Detection rule:** If `MilestoneWorkload` starts with `"Data: SQL"`, it is Tier 1.

### Tier 2 — Adjacent SQL Workloads (contextually relevant)

| Workload Pattern | SQL600 Relevance |
|---|---|
| `Data: MySQL Flexible Server (Migrate & Modernize)` | MySQL migration — may qualify depending on account context |
| `Data: MySQL Flexible Server (AI Apps & Agents)` | MySQL for new apps — lower SQL600 relevance |
| `Data: PostgreSQL Flexible Server (Migrate & Modernize)` | PostgreSQL — only if migrating from SQL Server |

**Detection rule:** If `MilestoneWorkload` contains `"MySQL"` or `"PostgreSQL"`, classify as Tier 2. Include in report but with lower severity.

### Tier 3 — Modernization Flag (PBI-only)

| Signal | Source |
|---|---|
| `'✽ Pipeline'[Modernization Workload Flag] = 1` | PBI Pipeline fact |

**Detection rule:** If Modernization Workload Flag = 1 AND workload is not Tier 1/2, still include as potentially SQL600-relevant. Cross-reference with account SQL Cores.

---

## Sales Program Workload Catalog (Catalyst Coaching Scope)

Use this catalog to detect opportunities that should be tagged to a Sales Program but are not currently tagged.

### Migrate & Modernize to Azure SQL / new App Development

- `Data: SQL On-prem to SQL MI (Paas)`
- `Data: SQL to Azure SQL Hyperscale (AI Apps & Agents)`
- `Data: SQL Modernization to Azure SQL DB with AI (Paas)`
- `Data: SQL Modernization to Azure SQL MI with AI (Paas)`
- `Data: SQL on-prem to Azure SQL VM (IaaS)`
- `Data: Analytics - Fabric SQL Databases (OLTP)`

### Arc-Enablement / ESU / SQL PayGo

- `Data: Hybrid: Arc-Enabled SQL Server`
- `Data: Arc-Enabled SQL 2014 ESU`
- `Data: SQL Billed TO Azure SQL PayGo Licenses (Arc and Azure)`
- `Infra: Hybrid - Arc-Enabled Servers`

### Migrate PostgreSQL / PostgreSQL new app development

- `Data: PostgreSQL Flexible Server (AI Apps & Agents)`
- `Data: PostgreSQL Flexible server (Migrate and Modernize)`

### Building AI Apps with DocumentDB / Cosmos DB

- `Data: Cosmos DB (AI Apps & Agents)`
- `Data: Cosmos DB (Migrate and Modernize)`

### Oracle to SQL Migration

- `Data: Oracle to Azure SQL Migration`
- `Data: Oracle to PostgreSQL Flexible Server (Migrate & Modernize)`

### Untagged Sales Program Detection

Flag an opportunity as **Untagged Sales Program** when BOTH conditions are true:

1. `MilestoneWorkload` is an exact (case-insensitive) match to a catalog workload above.
2. Opportunity `msp_salesplay` is missing/empty OR set to **Not Applicable** (`861980040`).

This list is a coaching queue for Catalyst v-team outreach.

---

## Expected Sales Play Mapping

The `msp_salesplay` field on the opportunity. Expected values for SQL600 work:

### ✅ Correct Sales Plays

| Sales Play | Code | When Expected |
|---|---|---|
| **Migrate and Modernize Your Estate** | `861980067` | Primary play for any SQL migration/modernization opp |
| **Build and Modernize AI Apps** | `861980037` | Valid when SQL workload is part of an AI app modernization |

### 🟡 Adjacent (Flag as Warning)

| Sales Play | Code | When Flagged |
|---|---|---|
| Innovate with Azure AI Apps and Agents | `861980098` | Commonly set but not ideal for SQL-first modernization opps |
| Unify Your Data Platform | `861980038` | Valid for SQL → Fabric/analytics scenarios but verify intent |
| Scale with Cloud and AI Endpoints | `861980056` | Unusual for SQL modernization — likely mistagged |

### 🔴 Incorrect (Flag as Critical)

Any sales play NOT in the ✅ or 🟡 lists above when the opp has Tier 1 SQL workloads. Common mismatches:

| Sales Play | Code | Why Wrong |
|---|---|---|
| Data Security | `861980027` | Security play — not SQL modernization |
| Modern SecOps with Unified Platform | `606820006` | Security ops play |
| Copilot and Agents at Work | `861980097` | M365/Copilot play |
| Sales Transformation with AI | `861980020` | BizApps play |
| Drive Cloud Success through Unified with Enhanced Solutions | `861980087` | Unified delivery play |
| ERP Transformation with AI | `861980026` | BizApps play |
| Not Applicable | `861980040` | Must be set to a real play |
| `null` / empty | — | Must be set |

---

## Severity Classification

| Severity | Condition |
|---|---|
| 🔴 **Critical** | SQL workload opp with `msp_salesplay` = null or completely unrelated play |
| 🟡 **Warning** | SQL workload opp with adjacent but non-ideal play |
| ⚪ **Gap** | SQL600 account with zero SQL-related opps, especially if `SQLCores` > 0 |
| ✅ **Clean** | SQL workload opp with correct expected play |
