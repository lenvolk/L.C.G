---
name: windows-task-scheduler
description: 'Create, list, update, and remove Windows scheduled tasks via PowerShell. Always inventories existing tasks before creating new ones to prevent sprawl and duplicates. Produces structured terminal output for at-a-glance task management. Triggers: schedule task, scheduled task, task scheduler, list scheduled tasks, create scheduled task, remove scheduled task, Windows scheduler, cron job Windows, recurring task, startup task, logon task, daily task.'
argument-hint: 'Describe what you want to schedule, or ask to list/audit existing tasks'
---

# Windows Task Scheduler Management

Create, list, audit, and remove Windows scheduled tasks via PowerShell — with sprawl detection and structured output.

## Purpose

Provides a repeatable, guardrail-protected workflow for managing Windows Task Scheduler entries. Every mutation is preceded by a full inventory so the agent can detect duplicates, overlapping triggers, and naming collisions before touching anything.

## When to Use

- Creating a new scheduled task (one-time, daily, weekly, at logon, at startup).
- Listing or auditing all user tasks with structured output.
- Checking for duplicate or overlapping schedules before adding a new one.
- Updating an existing task's trigger, action, or settings.
- Removing a task that is no longer needed.
- Troubleshooting why a task didn't fire.

## When NOT to Use

- Managing Linux/macOS cron jobs or launchd plists.
- Modifying Microsoft system tasks under `\Microsoft\*`.
- Scheduling jobs that belong on a server (use Azure Logic Apps, Azure Functions, etc.).

## Safety Rules

1. **Inventory first** — always run the List flow before any create/update/remove.
2. **Never modify system tasks** — filter out `\Microsoft\*`, `\Apple\*`, and other vendor paths.
3. **Prefix all Kate-managed tasks** with `Kate-` so they can be identified and cleaned up safely.
4. **Confirm before destructive actions** — present the task details and ask for explicit approval before `Unregister-ScheduledTask`.
5. **Idempotent creates** — use `-Force` on `Register-ScheduledTask` to upsert, but only after showing the diff.

## Naming Convention

All tasks created by this skill MUST follow:

```
Kate-<Purpose>[-<Qualifier>]
```

Examples: `Kate-Morning-Prep`, `Kate-Daily-Sync`, `Kate-Vault-Backup`

This lets the inventory and cleanup flows scope to `Kate-*` without touching unrelated tasks.

---

## Flow 1: Inventory (ALWAYS RUN FIRST)

Run this before every create, update, or remove operation.

### Step 1 — Query All User Tasks

```powershell
Get-ScheduledTask |
  Where-Object { $_.TaskPath -notlike "\Microsoft\*" -and $_.TaskPath -notlike "\Apple\*" } |
  ForEach-Object {
    $info = Get-ScheduledTaskInfo -TaskName $_.TaskName -TaskPath $_.TaskPath -ErrorAction SilentlyContinue
    $triggers = $_.Triggers | ForEach-Object { $_.CimClass.CimClassName -replace 'MSFT_Task',''-replace 'Trigger','' }
    [PSCustomObject]@{
      Name     = $_.TaskName
      Path     = $_.TaskPath
      State    = $_.State
      Managed  = if ($_.TaskName -like 'Kate-*') { 'Yes' } else { 'No' }
      Action   = ($_.Actions | ForEach-Object { "$($_.Execute) $($_.Arguments)" }) -join '; '
      Triggers = ($triggers -join ', ')
      LastRun  = if ($info.LastRunTime -gt [DateTime]'2000-01-01') { $info.LastRunTime.ToString('yyyy-MM-dd HH:mm') } else { 'Never' }
      NextRun  = if ($info.NextRunTime -gt [DateTime]'2000-01-01') { $info.NextRunTime.ToString('yyyy-MM-dd HH:mm') } else { 'N/A' }
    }
  } | Sort-Object Managed, Path, Name
```

### Step 2 — Present Structured Output

Format as a markdown table for the user with columns: Name, Managed, State, Triggers, Action, Next Run.

Group into two sections:
1. **Kate-managed tasks** (`Managed = Yes`) — full detail.
2. **Other user tasks** — name, state, and next run only (keep compact).

### Step 3 — Sprawl Detection

Before proceeding to any create/update, check for:

| Check | Condition | Action |
|---|---|---|
| **Duplicate name** | Proposed task name already exists | Show existing task, ask: update or pick a new name? |
| **Overlapping trigger** | Another Kate-* task runs the same exe/script within ±5 min of proposed time | Warn the user and suggest consolidating |
| **Stale tasks** | Kate-* task with State = `Disabled` or LastRun = `Never` and created >7 days ago | Flag for cleanup |
| **Orphaned one-shots** | Kate-* task with a one-time trigger in the past and NextRun = N/A | Flag for removal |

Present findings as a checklist before proceeding.

---

## Flow 2: Create / Register

Only after completing Flow 1.

### Inputs Required

| Parameter | Required | Default | Notes |
|---|---|---|---|
| Task name | Yes | — | Must start with `Kate-` |
| Action (exe + args) | Yes | — | Typically `pwsh.exe -File <path>` or `pwsh.exe -Command <cmd>` |
| Trigger type | Yes | — | `Once`, `Daily`, `Weekly`, `AtLogOn`, `AtStartup` |
| Trigger time | If timed | — | For Once/Daily/Weekly |
| Days of week | If Weekly | — | e.g., `Monday`, `Wednesday` |
| Run level | No | `Limited` | `Limited` or `Highest` (admin) |
| Description | No | Auto-generated | Short purpose statement |

### Step 1 — Build Components

```powershell
# Action
$action = New-ScheduledTaskAction -Execute "<exe>" -Argument "<args>"

# Trigger (pick one)
$trigger = New-ScheduledTaskTrigger -Once -At <datetime>
$trigger = New-ScheduledTaskTrigger -Daily -At <time>
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Wednesday -At <time>
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger = New-ScheduledTaskTrigger -AtStartup

# Principal
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Limited

# Settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
```

### Step 2 — Show Plan

Before registering, display:

```
╔══════════════════════════════════════════╗
║  TASK REGISTRATION PLAN                  ║
╠══════════════════════════════════════════╣
║  Name:      Kate-Daily-Sync              ║
║  Action:    pwsh.exe -File sync.ps1      ║
║  Trigger:   Daily at 08:00 AM            ║
║  Run As:    jinle (Interactive, Limited)  ║
║  Conflicts: None detected                ║
╚══════════════════════════════════════════╝
```

If sprawl checks found issues, show them here.

### Step 3 — Register

```powershell
Register-ScheduledTask `
  -TaskName "<name>" `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description "<description>" `
  -Force
```

### Step 4 — Confirm

Re-run a targeted query to confirm registration:

```powershell
$t = Get-ScheduledTask -TaskName "<name>"
$i = Get-ScheduledTaskInfo -TaskName "<name>"
Write-Host "Registered: $($t.TaskName) | State: $($t.State) | Next run: $($i.NextRunTime)"
```

---

## Flow 3: Update

1. Run Flow 1 (inventory).
2. Identify the existing task by name.
3. Show current vs. proposed values as a diff table.
4. Use `Set-ScheduledTask` for in-place updates, or `Register-ScheduledTask -Force` for full replacement.
5. Confirm with a targeted query.

---

## Flow 4: Remove

1. Run Flow 1 (inventory).
2. Show full task details to the user.
3. **Ask for explicit confirmation** — never auto-delete.
4. Execute:
   ```powershell
   Unregister-ScheduledTask -TaskName "<name>" -Confirm:$false
   ```
5. Confirm removal:
   ```powershell
   if (-not (Get-ScheduledTask -TaskName "<name>" -ErrorAction SilentlyContinue)) {
     Write-Host "Task '<name>' successfully removed."
   }
   ```

---

## Flow 5: Troubleshooting

When a task didn't fire as expected:

```powershell
# Check last run result code
$info = Get-ScheduledTaskInfo -TaskName "<name>"
Write-Host "Last result: $($info.LastTaskResult)"  # 0 = success, others = error
Write-Host "Last run:    $($info.LastRunTime)"
Write-Host "Next run:    $($info.NextRunTime)"
Write-Host "Missed runs: $($info.NumberOfMissedRuns)"

# Check task XML for full config
Export-ScheduledTask -TaskName "<name>" | Format-Xml  # or just output raw
```

Common result codes:

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Incorrect function (bad exe/args) |
| `267009` | Task is currently running |
| `267011` | Task has not yet run |
| `267014` | Task was terminated by user |
| `2147750671` | Credentials required / logon failure |

---

## Output Formatting Standards

Since there is no UI, all output MUST be structured for terminal readability:

- **Lists** → Markdown tables with aligned columns.
- **Single task detail** → Key-value box (see registration plan format above).
- **Sprawl warnings** → Checkbox list with recommended actions.
- **Confirmations** → Single-line status with task name + state + next run.
- **Grouped output** → Section headers separating Kate-managed vs. other tasks.

Always include the current time when showing next-run times so the user can gauge timing at a glance.
