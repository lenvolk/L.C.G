#!/usr/bin/env node

/**
 * resolve-deal-teams.js — CRM bulk data joiner for engagement intake
 *
 * Takes raw CRM bulk data (opportunities + deal teams + milestones + systemusers)
 * and produces a compact, pre-joined summary grouped by account with risk signals
 * and deal team roles resolved to named people.
 *
 * Designed to run AFTER the agent's CRM bulk fetch — this script does NO API calls.
 * It joins, groups, classifies, and computes signals offline, keeping agent context lean.
 *
 * Usage:
 *   node scripts/helpers/resolve-deal-teams.js /tmp/intake-opps.json
 *   cat /tmp/intake-opps.json | node scripts/helpers/resolve-deal-teams.js
 *   node scripts/helpers/resolve-deal-teams.js /tmp/intake-opps.json --filter gap
 *
 * Options:
 *   --filter <type>     Filter output: "gap" (zero-pipeline only), "at-risk", "all" (default)
 *   --output <path>     Write output to file instead of stdout
 *
 * Input JSON shape (agent saves this from CRM bulk calls):
 *   {
 *     "opportunities": [ ... list_opportunities / get_my_active_opportunities results ... ],
 *     "dealTeams": { "<oppId>": [ ... manage_deal_team results ... ], ... },
 *     "milestones": [ ... get_milestones results ... ],
 *     "systemusers": [ ... crm_query systemusers results ... ]
 *   }
 *
 * Output JSON shape (compact, agent reads only this):
 *   {
 *     "generated": "2026-04-20",
 *     "accounts": [ { account, tpid, opportunities: [...], signals: {...} } ],
 *     "summary": { totalAccounts, accountsWithPipeline, accountsZeroPipeline, ... }
 *   }
 *
 * See engagement-intake SKILL.md for the full schema documentation.
 */

import { readFileSync, writeFileSync } from "node:fs";

// ── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let dataPath = null;
let filterType = "all";
let outputPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--filter" && args[i + 1]) filterType = args[++i];
  else if (args[i] === "--output" && args[i + 1]) outputPath = args[++i];
  else if (!args[i].startsWith("-")) dataPath = args[i];
}

// ── Read input ──────────────────────────────────────────────────────

let raw;
if (dataPath) {
  raw = readFileSync(dataPath, "utf-8");
} else {
  // stdin
  const chunks = [];
  const { stdin } = process;
  stdin.setEncoding("utf-8");
  for await (const chunk of stdin) chunks.push(chunk);
  raw = chunks.join("");
}

const data = JSON.parse(raw);
const { opportunities = [], dealTeams = {}, milestones = [], systemusers = [] } = data;

// ── Build lookup maps ───────────────────────────────────────────────

// systemuser GUID → { name, title, email }
const userMap = new Map();
for (const u of systemusers) {
  const id = u.systemuserid || u.SystemUserId;
  if (!id) continue;
  userMap.set(id.toLowerCase(), {
    name: u.fullname || u["fullname@OData.Community.Display.V1.FormattedValue"] || u.FullName || "Unknown",
    title: u.title || u.Title || "",
    email: u.internalemailaddress || u.InternalEmailAddress || "",
  });
}

// Classify a systemuser into a deal team role by title
function classifyRole(title) {
  if (!title) return "Unknown";
  const t = title.toLowerCase();
  if (t.includes("cloud solution architect") || t.includes("csa")) return "CSA";
  if (t.includes("customer success") || t.includes("csam")) return "CSAM";
  if (t.includes("solution engineer") || t.includes(" se ") || t.endsWith(" se")) return "SE";
  if (t.includes("specialist") || t.includes("solution sales")) return "Specialist";
  if (t.includes("account executive") || t.includes("account manager") || t.includes(" ae ") || t.endsWith(" ae")) return "AE";
  if (t.includes("account technology") || t.includes("ats")) return "ATS";
  return "Other";
}

// milestones by opportunity ID
const milestonesByOpp = new Map();
for (const m of milestones) {
  const oppId = (m._msp_parentopportunityid_value || m.opportunityId || "").toLowerCase();
  if (!oppId) continue;
  if (!milestonesByOpp.has(oppId)) milestonesByOpp.set(oppId, []);
  milestonesByOpp.get(oppId).push(m);
}

// ── Group opportunities by account ──────────────────────────────────

const accountMap = new Map(); // accountName → { tpid, opps: [] }

for (const opp of opportunities) {
  const oppId = (opp.opportunityid || opp.OpportunityId || "").toLowerCase();
  const accountName =
    opp["_parentaccountid_value@OData.Community.Display.V1.FormattedValue"] ||
    opp.parentAccountName ||
    opp.AccountName ||
    "Unknown Account";
  const tpid = opp.msp_tpid || opp.TPID || null;

  if (!accountMap.has(accountName)) {
    accountMap.set(accountName, { tpid, opps: [] });
  }

  // Resolve deal team for this opp
  const rawTeam = dealTeams[oppId] || dealTeams[opp.opportunityid] || [];
  const resolvedTeam = { AE: null, Specialist: null, SE: null, CSA: null, CSAM: null, ATS: null };

  for (const member of rawTeam) {
    const userId = (
      member._msp_dealteamuserid_value ||
      member.userId ||
      member.SystemUserId ||
      ""
    ).toLowerCase();
    const user = userMap.get(userId);
    if (!user) continue;
    const role = classifyRole(user.title);
    if (role in resolvedTeam && !resolvedTeam[role]) {
      resolvedTeam[role] = { name: user.name, id: userId };
    }
  }

  // Resolve milestones for this opp
  const oppMilestones = (milestonesByOpp.get(oppId) || []).map((m) => ({
    name: m.msp_milestonename || m.name || m.MilestoneName || "Unnamed",
    status: m.msp_milestonestatus || m.status || "unknown",
    dueDate: m.msp_milestonedate || m.dueDate || null,
    commitment: m.msp_commitmentrecommendation || m.commitment || "unknown",
    workload: m.msp_workload || m.workload || null,
    monthlyUse: m.msp_monthlyuse || m.monthlyUse || 0,
  }));

  // Extract opp fields
  const estimatedValue = opp.estimatedvalue || opp.EstimatedValue || 0;
  const closeDate = opp.estimatedclosedate || opp.EstimatedCloseDate || null;
  const stage =
    opp["msp_activesalesstage@OData.Community.Display.V1.FormattedValue"] ||
    opp.stageName ||
    opp.StageName ||
    "Unknown";
  const salesPlay =
    opp["msp_salesplay@OData.Community.Display.V1.FormattedValue"] ||
    opp.salesPlayName ||
    opp.SalesPlay ||
    null;
  const modifiedOn = opp.modifiedon || opp.ModifiedOn || null;

  accountMap.get(accountName).opps.push({
    oppId: opp.opportunityid || opp.OpportunityId,
    oppName: opp.name || opp.Name || "Unnamed",
    stage,
    estimatedValue,
    closeDate,
    salesPlay,
    modifiedOn,
    milestones: oppMilestones,
    dealTeam: resolvedTeam,
  });
}

// ── Compute per-account signals ─────────────────────────────────────

const today = new Date();
const todayMs = today.getTime();
const DAY_MS = 86400000;

const accounts = [];

for (const [accountName, { tpid, opps }] of accountMap) {
  const hasActivePipeline = opps.length > 0;
  let atRisk = false;
  let closeDateDrift = false;
  let staleStage = false;
  const missingRoles = new Set();

  for (const opp of opps) {
    // Close date drift: past due or within 14 days
    if (opp.closeDate) {
      const closeMs = new Date(opp.closeDate).getTime();
      if (closeMs < todayMs) closeDateDrift = true;
      else if (closeMs - todayMs < 14 * DAY_MS) closeDateDrift = true;
    }

    // Stale stage: no modification in 30+ days
    if (opp.modifiedOn) {
      const modMs = new Date(opp.modifiedOn).getTime();
      if (todayMs - modMs > 30 * DAY_MS) staleStage = true;
    }

    // Milestone risk: any overdue
    for (const m of opp.milestones) {
      if (m.dueDate && new Date(m.dueDate).getTime() < todayMs) {
        atRisk = true;
      }
    }

    // Missing deal team roles
    for (const role of ["AE", "Specialist", "SE", "CSA", "CSAM"]) {
      if (!opp.dealTeam[role]) missingRoles.add(role);
    }
  }

  if (closeDateDrift || staleStage) atRisk = true;

  const signals = {
    hasActivePipeline,
    atRisk,
    closeDateDrift,
    staleStage,
    zeroPipeline: !hasActivePipeline,
    missingDealTeamRoles: [...missingRoles],
  };

  accounts.push({ account: accountName, tpid, opportunities: opps, signals });
}

// ── Apply filter ────────────────────────────────────────────────────

let filtered = accounts;
if (filterType === "gap") {
  filtered = accounts.filter((a) => a.signals.zeroPipeline);
} else if (filterType === "at-risk") {
  filtered = accounts.filter((a) => a.signals.atRisk);
}

// ── Build summary ───────────────────────────────────────────────────

const allPeople = new Set();
for (const a of accounts) {
  for (const opp of a.opportunities) {
    for (const role of Object.values(opp.dealTeam)) {
      if (role && role.id) allPeople.add(role.id);
    }
  }
}

const summary = {
  totalAccounts: accounts.length,
  filteredAccounts: filtered.length,
  accountsWithPipeline: accounts.filter((a) => a.signals.hasActivePipeline).length,
  accountsZeroPipeline: accounts.filter((a) => a.signals.zeroPipeline).length,
  accountsAtRisk: accounts.filter((a) => a.signals.atRisk).length,
  accountsMissingCSA: accounts.filter((a) => a.signals.missingDealTeamRoles.includes("CSA")).length,
  uniquePeople: allPeople.size,
  totalOpps: accounts.reduce((sum, a) => sum + a.opportunities.length, 0),
  filter: filterType,
};

// ── Output ──────────────────────────────────────────────────────────

const output = {
  generated: today.toISOString().split("T")[0],
  accounts: filtered,
  summary,
};

const json = JSON.stringify(output, null, 2);

if (outputPath) {
  writeFileSync(outputPath, json + "\n", "utf-8");
  console.error(`Wrote ${filtered.length} accounts to ${outputPath}`);
} else {
  process.stdout.write(json + "\n");
}
