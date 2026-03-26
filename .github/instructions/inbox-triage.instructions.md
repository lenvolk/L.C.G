---
applyTo: "**"
---
# Inbox Triage Rules

## VIP Handling
- Treat Tier 1 VIP senders as URGENT unless explicitly downgraded by context.
- Treat Tier 2 VIP senders as HIGH by default.

## Classification Rules
- Apply labels from the Triage Labels section in `_kate/preferences.md`.
- Every item gets exactly one **Priority** (P0-P3), one **Type**, and one or more **Signal** labels.
- Classify each item as URGENT, HIGH, NORMAL, or LOW.
- Separate items requiring response from FYI-only threads.
- Group related threads by topic where possible.
- For URGENT/HIGH items, include one-sentence required action.

## Triage Output Shape
1. URGENT items first with immediate action.
2. HIGH items grouped by project or meeting.
3. Action queue (owner, due signal, next step).
4. FYI list for later reading.
5. Every email, calendar event, or Teams message referenced MUST include its `webLink` or `webUrl` as an Obsidian hyperlink for auditability. See M365 Source Linking Policy in copilot-instructions.md.

## Suppression Rules
- Suppress automated alerts and low-value newsletters.
- Suppress RSVP-only notifications without meaningful message content.
