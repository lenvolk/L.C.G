# Output Template — SQL600 HLS Executive Readout

> **Freedom Level: Low** — Use this template exactly. Do not improvise heading names, reorder sections, or omit frontmatter fields. Sections with zero results should note "None detected", not be omitted.

## Vault Path

```text
Daily/SQL600-HLS/sql600-hls-readout-<YYYY-MM-DD>.md
```

Use `oil:create_note` for new notes, `oil:atomic_replace` if the note already exists for the same date.

## Frontmatter Schema

```yaml
---
tags: [sql600, hls, dbc, executive-readout]
generated: <YYYY-MM-DD>
source: pbi
model: SQL 600 Performance Tracking
scope: "SQL600 HLS (Healthcare)"
hls_account_count: <int>
total_sql600_accounts: 251
acr_lcm: "<formatted $>"
acr_mom_direction: "<↑|↓|→>"
acr_yoy_pct: "<formatted %>"
annualized_growth: "<formatted $>"
pipe_committed: "<formatted $>"
pipe_uncommitted: "<formatted $>"
pipe_qualified: "<formatted $>"
pipeline_penetration: "<formatted %>"
sql_tam: "<formatted $>"
sql_cores: "<formatted #>"
wow_change: "<formatted $>"
wow_direction: "<↑|↓|→>"
mod_opps: <int>
factory_attach_pct: "<formatted %>"
accts_with_mod_pipe: <int>
accts_without_mod_pipe: <int>
gap_account_count: <int>
industry_rank: <int>
readout_mode: "<Full|Accounts|Renewal|Modernization|Trend|Ranking|AIODeepDive|AccountDrill>"
aio_data_available: <true|false>
---
```

### Field Rules

| Field | Type | Rule |
|---|---|---|
| `acr_lcm` | string | Always quoted. Compact format: `"$15.4M"`. Never raw number. |
| `acr_mom_direction` | string | Arrow based on last 2 closed months comparison. `↑` if positive, `↓` if negative, `→` if flat (< 1% change). |
| `annualized_growth` | string | Always quoted. Compact format: `"$196.3M"`. |
| `pipe_committed` | string | Always quoted. Can be negative (blocked > committed). |
| `wow_change` | string | Always quoted. Include sign: `"+$1.3B"` or `"-$450K"`. |
| `wow_direction` | string | Arrow based on `wow_change` sign. |
| `industry_rank` | int | Ordinal position by ACR LCM among all SQL600 industries. 1 = highest. |
| `gap_account_count` | int | Count of HLS SQL600 accounts with zero committed pipeline. |

### What does NOT go in frontmatter

- Account-level detail → body tables only
- Opportunity detail → body tables only
- Renewal specifics → body sections only

---

## Body Template

```markdown
# SQL600 HLS Executive Readout — <Month Day, Year>

**Portfolio:** <hls_account_count> HLS accounts · <total_sql600_accounts> total SQL600
**Industry Rank:** #<rank> of <industry_count> SQL600 industries by ACR

---

## 🎯 Headline

**<ACR_LCM>** ACR (LCM) · <acr_mom_direction> MoM · **<annualized_growth>** annualized growth since June '25
**<wow_change>** WoW movement (<wow_direction>) · Pipeline Penetration: **<pipeline_penetration>**

> <one- or two-line DBC narrative — derive from this readout's actuals. Compare HLS's pipeline penetration and annualized growth to the SQL600 average computed in the Industry Ranking section, then state the factual position neutrally (ahead / in line with / behind). Where the comparison is notable, reinforce it with 1–2 correlated data points from elsewhere in this readout (e.g., ACR MoM/YoY direction, WoW delta, factory attach %, mod pipeline coverage, renewal exposure, gap-account count). Only cite correlations actually supported by the numbers — do not invent causation.>

---

## 📊 Portfolio Snapshot

| Metric | Value |
|---|---|
| **ACR (Last Closed Month)** | <acr_lcm> |
| **ACR YoY Δ** | <acr_yoy_pct> |
| **Annualized Growth** | <annualized_growth> |
| **Annualized Growth + Pipeline** | <annualized_growth_plus_pipe> |
| **Committed Pipeline** | <pipe_committed> |
| **Uncommitted Pipeline** | <pipe_uncommitted> |
| **Qualified Pipeline** | <pipe_qualified> |
| **Unqualified Pipeline** | <pipe_unqualified> |
| **Qualified Opps** | <qualified_opps> |
| **Total Opps** | <total_opps> |
| **Pipeline Penetration** | <pipeline_penetration> |
| **SQL TAM** | <sql_tam> |
| **SQL Cores** | <sql_cores> |
| **Realized + Base + Pipe** | <realized_plus_base_plus_pipe> |
| **WoW Δ** | <wow_change> |

---

## 📈 ACR Trajectory (FY26)

| Month | ACR |
|---|---|
<for each month in Q4 result:>
| <MMM yyyy> | <$formatted> |

> <trend narrative — direction, inflection points, trajectory interpretation. Where possible, correlate inflections with supporting signals from other sections (e.g., a jump in committed pipeline, a large renewal closing, mod-opps ramp, top-account expansion). Keep it factual — note the correlation, not a causal claim.>

---

## 🏥 Vertical Breakdown

| Vertical | Accounts | ACR (LCM) | Committed Pipe | Uncommitted Pipe | Growth | Mod Opps |
|---|---|---|---|---|---|---|
<for each vertical:>
| <vertical> | <count> | <acr> | <committed> | <uncommitted> | <growth> | <mod_opps> |

---

## 🏆 Industry Ranking (SQL600)

| Rank | Industry | Accounts | ACR (LCM) | Committed Pipe |
|---|---|---|---|---|
<for each industry, sorted by ACR DESC:>
| <rank> | <industry> | <count> | <acr> | <committed> |

> <narrative — derived from the ranking table above. State HLS's rank, the gap (absolute or %) vs. the top industry and vs. the SQL600 average, and whether HLS is ahead/in line/behind. Reinforce with correlated signals where they strengthen or complicate the position (e.g., HLS pipeline penetration vs. ranking peers, committed pipe concentration, mod-opps share, factory attach). No hardcoded framing — recompute from the data each time.>

---

## 🔝 Top Accounts

| # | Account | TPID | Vertical | Segment | ACR (LCM) | Committed | Uncommitted | Ann. Growth | Recommended Next Step |
|---|---|---|---|---|---|---|---|---|---|
<for each top account:>
| <n> | <TopParent> | <TPID> | <vertical> | <segment> | <acr> | <committed> | <uncommitted> | <growth> | <sql modernization next step> |

---

## ⚠️ Renewal Watch

| Account | TPID | Category | Renewal Q | SQL Cores | Arc? | ACR (LCM) | Committed Pipe |
|---|---|---|---|---|---|---|---|
<for each renewal account, renewals first then sorted by SQL Cores DESC:>
| <TopParent> | <TPID> | <category> | <renewal_q> | <cores> | <arc> | <acr> | <committed> |

> <renewal narrative — Q3/Q4 exposure, accounts needing immediate DB mod positioning>

---

## 🏭 Modernization Coverage

| Metric | Value |
|---|---|
| **Accounts with Mod Pipeline** | <accts_with> / <total_hls> |
| **Accounts without Mod Pipeline** | <accts_without> |
| **Modernization Opportunities** | <mod_opps> |
| **Factory Attach Rate** | <factory_attach> |

> <modernization narrative — coverage gaps, factory leverage opportunities>

## 🧠 Modernization + AI Enablement Outlook

> <forward-looking narrative — connect SQL modernization decisions now to downstream AI readiness (Azure OpenAI/copilot/data-platform needs), and call out where delay will create re-platforming risk later>

---

## 🔴 GCP Leakage Risk (Zero Committed Pipeline)

| Account | TPID | Vertical | ACR (LCM) | Uncommitted | SQL Cores |
|---|---|---|---|---|---|
<for each gap account:>
| <TopParent> | <TPID> | <vertical> | <acr> | <uncommitted> | <cores> |

> <competitive narrative — what HLS customers aren't spending with us, they're spending with GCP. DB mod positioning directly competes with GCP capture.>

---

## 🔍 Azure Consumption Deep Dive (AIO Cross-Reference)

> **Source:** MSA_AzureConsumption_Enterprise (Azure All-in-One)
> Only present when AIO data is available. If AIO queries were skipped or failed, omit this entire section.

### Account MoM ACR Heatmap

| Account | TPID | <Mon 1> | <Mon 2> | <Mon 3> | ... | <Mon N> | MoM Δ | Direction |
|---|---|---|---|---|---|---|---|---|
<for each account, months as columns:>
| <TopParent> | <TPID> | <$ACR> | <$ACR> | <$ACR> | ... | <$ACR> | <$change> | <↑/↓/→> |

> <MoM narrative — call out accounts with sustained growth vs. declining trajectories. Correlate with SQL600 pipeline state: accounts growing consumption without modernization pipeline represent untapped SQL conversion opportunity.>

### Service Pillar Mix (ACR by Strategic Pillar)

| Account | TPID | Data & AI | Infra | Digital & App | Security | Modern Work | BizApps | SQL-Adjacent % |
|---|---|---|---|---|---|---|---|---|
<for each account:>
| <TopParent> | <TPID> | <$ACR> | <$ACR> | <$ACR> | <$ACR> | <$ACR> | <$ACR> | <pct of Data&AI + Infra> |

> <service mix narrative — highlight accounts where SQL-adjacent pillars (Data & AI + Infra) are a large share of total spend (high modernization leverage) vs. accounts where they're small (untapped). Flag where Migrate & Modernize solution play is active vs. absent.>

### Budget Attainment Overlay

| Account | TPID | ACR YTD | ACR LCM | Budget Attain % | Signal |
|---|---|---|---|---|---|
<for each account, sorted by attainment ASC:>
| <TopParent> | <TPID> | <$ACR> | <$ACR> | <pct> | <signal> |

**Signal logic:**
- **🟢 Ahead** — Budget attainment ≥ 100%
- **🟡 On track** — Budget attainment 80–99%
- **🔴 Below target** — Budget attainment < 80%
- **⚫ No data** — Budget attainment not available

> <budget narrative — flag accounts below 80% attainment with SQL600 pipeline context. Accounts below target AND without committed SQL pipeline need immediate attention.>

---

## 💡 Key Takeaways

- [!] <most important insight — bold the DBC impact>
- [*] <pipeline/growth highlight>
- [d] <risk or declining trend if any>
- [?] <open question or data gap>
```

## Revenue/Value Formatting

| Range | Format | Example |
|---|---|---|
| ≥ $1B | `$X.XB` | `$1.8B` |
| ≥ $1M | `$X.XM` | `$15.4M` |
| ≥ $1K | `$XXXK` | `$454K` |
| < $1K | `$XXX` | `$867` |
| Negative | `(-$X.XM)` | `(-$7.7M)` |
| Zero/Blank | `—` | |
| Percentages | `XX.X%` | `76.7%` |
| Counts | `#,###` | `208,484` |

### Direction Arrows

| Condition | Arrow |
|---|---|
| Current > Prior | ↑ |
| Current < Prior | ↓ |
| Abs change < 1% | → |

Always pair arrow with $ or % delta: `↑ +$1.5M` or `↓ -2.3%`.
