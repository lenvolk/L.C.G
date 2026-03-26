import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.author = 'Jin Lee';
pptx.title = 'Your Personal Chief of Staff';
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5

// ── Microsoft Fluent palette ──
const MS_BLUE    = '0078D4';
const MS_NAVY    = '0F1B2D';
const MS_DARK    = '1B1F23';
const MS_TEAL    = '008575';
const MS_PURPLE  = '8661C5';
const MS_MAGENTA = 'E3008C';
const MS_ORANGE  = 'FF8C00';
const MS_RED     = 'D13438';
const MS_GREEN   = '107C10';
const MS_GRAY50  = '605E5C';
const MS_GRAY30  = '8A8886';
const MS_GRAY10  = 'E1DFDD';
const MS_GRAY05  = 'F3F2F1';
const WHITE      = 'FFFFFF';
const NEAR_BLACK = '11100F';

const TOTAL = 10;

// ── Reusable slide chrome ──
function chrome(slide, title, opts = {}) {
  // top gradient band
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.06, fill: MS_BLUE });
  // left accent bar
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.08, h: '100%', fill: MS_BLUE });
  // subtle corner triangle
  slide.addShape(pptx.shapes.RIGHT_TRIANGLE, { x: 11.5, y: 0, w: 1.83, h: 1.2, fill: MS_GRAY05, rotate: 90 });
  // title
  if (title) {
    slide.addText(title, { x: 0.55, y: 0.3, w: 10, fontSize: 28, bold: true, color: MS_NAVY, fontFace: 'Segoe UI' });
    slide.addShape(pptx.shapes.RECTANGLE, { x: 0.55, y: 1.0, w: 1.2, h: 0.06, fill: MS_BLUE, rectRadius: 0.03 });
  }
  // footer line + page number
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.55, y: 7.05, w: 12.2, h: 0.01, fill: MS_GRAY10 });
  slide.addText(`${opts.num || ''}`, { x: 12.3, y: 7.1, w: 0.8, fontSize: 9, color: MS_GRAY30, align: 'right', fontFace: 'Segoe UI' });
  if (opts.num) {
    slide.addText('Your Personal Chief of Staff', { x: 0.55, y: 7.1, w: 4, fontSize: 9, color: MS_GRAY30, fontFace: 'Segoe UI' });
  }
}

// pill badge helper
function pill(slide, x, y, w, h, text, fill, textColor = WHITE) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill, rectRadius: 0.12, shadow: { type: 'outer', blur: 6, offset: 2, color: '000000', opacity: 0.15 } });
  slide.addText(text, { x, y, w, h, fontSize: 13, bold: true, color: textColor, align: 'center', valign: 'middle', fontFace: 'Segoe UI' });
}

// card helper
function card(slide, x, y, w, h, heading, body, accentColor = MS_BLUE) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, fill: WHITE, rectRadius: 0.18,
    shadow: { type: 'outer', blur: 10, offset: 3, color: '000000', opacity: 0.12 },
    line: { color: MS_GRAY10, width: 0.75 },
  });
  // top accent stripe inside card
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: x + 0.15, y: y + 0.15, w: w - 0.3, h: 0.07, fill: accentColor, rectRadius: 0.04 });
  slide.addText(heading, { x: x + 0.2, y: y + 0.35, w: w - 0.4, fontSize: 16, bold: true, color: MS_NAVY, fontFace: 'Segoe UI' });
  slide.addText(body, { x: x + 0.2, y: y + 0.85, w: w - 0.4, h: h - 1.1, fontSize: 12.5, color: MS_GRAY50, fontFace: 'Segoe UI', valign: 'top', lineSpacingMultiple: 1.15 });
}

// ============================================================
// SLIDE 1 — Title (dark hero)
// ============================================================
const s1 = pptx.addSlide();
s1.background = { fill: MS_NAVY };
// large decorative circle (top-right)
s1.addShape(pptx.shapes.OVAL, { x: 9.0, y: -1.5, w: 6, h: 6, fill: MS_BLUE, transparency: 85 });
s1.addShape(pptx.shapes.OVAL, { x: 10.0, y: 3.0, w: 4.5, h: 4.5, fill: MS_PURPLE, transparency: 88 });
// accent line
s1.addShape(pptx.shapes.RECTANGLE, { x: 0.9, y: 0.6, w: 0.08, h: 2.8, fill: MS_BLUE, rectRadius: 0.04 });
// title text
s1.addText('Your Personal\nChief of Staff', {
  x: 1.3, y: 0.8, w: 8, fontSize: 48, bold: true, color: WHITE, fontFace: 'Segoe UI Semibold', lineSpacingMultiple: 1.1,
});
s1.addShape(pptx.shapes.RECTANGLE, { x: 1.3, y: 3.6, w: 2.5, h: 0.06, fill: MS_BLUE, rectRadius: 0.03 });
s1.addText('How AI turns information overload\ninto focused action', {
  x: 1.3, y: 3.9, w: 7, fontSize: 20, color: MS_GRAY10, fontFace: 'Segoe UI', lineSpacingMultiple: 1.3,
});
// bottom pills
pill(s1, 1.3, 5.5, 1.8, 0.45, 'Email', MS_BLUE);
pill(s1, 3.3, 5.5, 1.9, 0.45, 'Calendar', MS_TEAL);
pill(s1, 5.4, 5.5, 1.5, 0.45, 'CRM', MS_PURPLE);
pill(s1, 7.1, 5.5, 1.7, 0.45, 'Teams', MS_MAGENTA);
pill(s1, 9.0, 5.5, 2.2, 0.45, 'SharePoint', MS_ORANGE);
pill(s1, 11.4, 5.5, 1.5, 0.45, 'Vault', MS_GREEN);

s1.addText('KATE', { x: 1.3, y: 6.6, w: 3, fontSize: 11, color: MS_GRAY30, fontFace: 'Segoe UI', letterSpacing: 4 });

// ============================================================
// SLIDE 2 — The Problem
// ============================================================
const s2 = pptx.addSlide();
chrome(s2, 'The Problem', { num: 2 });

const problems = [
  { icon: '500+', label: 'emails, meetings & messages every week' },
  { icon: '!!', label: 'Important requests buried in noise' },
  { icon: '0 min', label: 'Meeting prep time in a packed schedule' },
  { icon: 'CRM', label: 'Updates and follow-ups fall through the cracks' },
  { icon: '6+', label: 'Disconnected tools to check every morning' },
];
problems.forEach((p, i) => {
  const yPos = 1.5 + i * 1.05;
  s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: yPos, w: 1.1, h: 0.75, fill: MS_NAVY, rectRadius: 0.12 });
  s2.addText(p.icon, { x: 0.55, y: yPos, w: 1.1, h: 0.75, fontSize: 16, bold: true, color: WHITE, align: 'center', valign: 'middle', fontFace: 'Segoe UI' });
  s2.addText(p.label, { x: 1.9, y: yPos, w: 10, h: 0.75, fontSize: 17, color: NEAR_BLACK, valign: 'middle', fontFace: 'Segoe UI' });
});

// ============================================================
// SLIDE 3 — The Vision
// ============================================================
const s3 = pptx.addSlide();
chrome(s3, 'What If You Had a Chief of Staff?', { num: 3 });
s3.addText('A trusted AI partner who works alongside you — not instead of you.', {
  x: 0.55, y: 1.4, w: 10, fontSize: 16, italic: true, color: MS_GRAY50, fontFace: 'Segoe UI',
});

const visions = [
  { txt: 'Reads every email and flags only what matters', color: MS_BLUE },
  { txt: 'Prepares a one-page brief before every important meeting', color: MS_TEAL },
  { txt: 'Watches your pipeline and alerts you to overdue milestones', color: MS_PURPLE },
  { txt: 'Remembers every past conversation, decision, and relationship', color: MS_ORANGE },
  { txt: 'Never sends anything without your approval', color: MS_GREEN },
];
visions.forEach((v, i) => {
  const yPos = 2.2 + i * 0.9;
  s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: yPos, w: 0.45, h: 0.55, fill: v.color, rectRadius: 0.1 });
  s3.addText('✓', { x: 0.55, y: yPos, w: 0.45, h: 0.55, fontSize: 18, color: WHITE, align: 'center', valign: 'middle' });
  s3.addText(v.txt, { x: 1.2, y: yPos, w: 11, h: 0.55, fontSize: 16, color: NEAR_BLACK, valign: 'middle', fontFace: 'Segoe UI' });
});

s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 6.2, w: 12.2, h: 0.55, fill: MS_GRAY05, rectRadius: 0.12 });
s3.addText("That's exactly what this system does.", { x: 0.55, y: 6.2, w: 12.2, h: 0.55, fontSize: 17, bold: true, color: MS_BLUE, align: 'center', valign: 'middle', fontFace: 'Segoe UI' });

// ============================================================
// SLIDE 4 — Inbox Triage
// ============================================================
const s4 = pptx.addSlide();
chrome(s4, 'Inbox Triage', { num: 4 });

// Four priority cards
const priorities = [
  { label: 'URGENT', fill: MS_RED, desc: 'Executive escalations\n& 48-hour deadlines' },
  { label: 'HIGH', fill: MS_ORANGE, desc: 'Meetings tomorrow\n& client action items' },
  { label: 'NORMAL', fill: MS_GREEN, desc: 'Internal updates\n& non-time-sensitive' },
  { label: 'LOW', fill: MS_GRAY50, desc: 'Newsletters &\nautomated alerts' },
];
priorities.forEach((p, i) => {
  const xPos = 0.55 + i * 3.15;
  s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos, y: 1.4, w: 2.85, h: 2.5, fill: WHITE, rectRadius: 0.18,
    shadow: { type: 'outer', blur: 8, offset: 2, color: '000000', opacity: 0.1 },
    line: { color: MS_GRAY10, width: 0.5 },
  });
  // colored top bar inside card
  s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: xPos + 0.1, y: 1.5, w: 2.65, h: 0.55, fill: p.fill, rectRadius: 0.12 });
  s4.addText(p.label, { x: xPos + 0.1, y: 1.5, w: 2.65, h: 0.55, fontSize: 16, bold: true, color: WHITE, align: 'center', valign: 'middle', fontFace: 'Segoe UI' });
  s4.addText(p.desc, { x: xPos + 0.2, y: 2.25, w: 2.45, h: 1.4, fontSize: 13, color: MS_GRAY50, align: 'center', valign: 'top', fontFace: 'Segoe UI', lineSpacingMultiple: 1.3 });
});

// Feature row
const triageFeatures = [
  'VIP senders automatically escalated',
  'Action-required vs. FYI threads separated',
  'Newsletters, RSVPs, and alerts suppressed',
];
triageFeatures.forEach((f, i) => {
  const yPos = 4.4 + i * 0.65;
  s4.addShape(pptx.shapes.OVAL, { x: 0.7, y: yPos + 0.1, w: 0.3, h: 0.3, fill: MS_BLUE });
  s4.addText('→', { x: 0.7, y: yPos + 0.1, w: 0.3, h: 0.3, fontSize: 11, color: WHITE, align: 'center', valign: 'middle' });
  s4.addText(f, { x: 1.2, y: yPos, w: 11, h: 0.55, fontSize: 15, color: NEAR_BLACK, valign: 'middle', fontFace: 'Segoe UI' });
});

// ============================================================
// SLIDE 5 — Meeting Prep
// ============================================================
const s5 = pptx.addSlide();
chrome(s5, 'Meeting Prep', { num: 5 });
s5.addText('A scannable one-page brief, ready in seconds — not hours.', {
  x: 0.55, y: 1.35, w: 10, fontSize: 15, italic: true, color: MS_GRAY50, fontFace: 'Segoe UI',
});

const prepRows = [
  [{ text: 'Section', options: { bold: true, fill: MS_BLUE, color: WHITE, fontSize: 13, fontFace: 'Segoe UI' } },
   { text: 'What You Get', options: { bold: true, fill: MS_BLUE, color: WHITE, fontSize: 13, fontFace: 'Segoe UI' } }],
  [{ text: 'Why it matters', options: { bold: true, fontSize: 13, color: MS_NAVY, fontFace: 'Segoe UI' } },
   { text: 'Context and strategic importance', options: { fontSize: 13, color: MS_GRAY50, fontFace: 'Segoe UI' } }],
  [{ text: 'What changed', options: { bold: true, fontSize: 13, color: MS_NAVY, fontFace: 'Segoe UI' } },
   { text: 'Key updates since last touchpoint', options: { fontSize: 13, color: MS_GRAY50, fontFace: 'Segoe UI' } }],
  [{ text: 'Key attendees', options: { bold: true, fontSize: 13, color: MS_NAVY, fontFace: 'Segoe UI' } },
   { text: 'Recent interactions with each person', options: { fontSize: 13, color: MS_GRAY50, fontFace: 'Segoe UI' } }],
  [{ text: 'Open items', options: { bold: true, fontSize: 13, color: MS_NAVY, fontFace: 'Segoe UI' } },
   { text: 'Milestone status pulled live from CRM', options: { fontSize: 13, color: MS_GRAY50, fontFace: 'Segoe UI' } }],
  [{ text: 'Risks & decisions', options: { bold: true, fontSize: 13, color: MS_NAVY, fontFace: 'Segoe UI' } },
   { text: 'What needs to be resolved in this meeting', options: { fontSize: 13, color: MS_GRAY50, fontFace: 'Segoe UI' } }],
  [{ text: 'Prep checklist', options: { bold: true, fontSize: 13, color: MS_NAVY, fontFace: 'Segoe UI' } },
   { text: 'Docs, links, and unresolved asks — all linked', options: { fontSize: 13, color: MS_GRAY50, fontFace: 'Segoe UI' } }],
];
s5.addTable(prepRows, {
  x: 0.55, y: 1.9, w: 12.2,
  border: { pt: 0.5, color: MS_GRAY10 },
  colW: [3.5, 8.7],
  rowH: [0.42, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55],
  autoPage: false,
});

// ============================================================
// SLIDE 6 — CRM & Pipeline
// ============================================================
const s6 = pptx.addSlide();
chrome(s6, 'CRM & Pipeline Awareness', { num: 6 });

const crmItems = [
  { head: 'Live Connection', body: 'Connects to MSX / Dynamics 365 and reads pipeline data in real time.' },
  { head: 'Overdue Detection', body: 'Flags stale milestones, past-due dates, and opportunities missing tasks.' },
  { head: 'Draft Follow-Ups', body: 'Generates follow-up emails with milestone name, due date, and exact ask — staged for your review.' },
  { head: 'Safe Updates', body: 'All CRM writes show a before/after diff. Nothing changes until you approve.' },
];
crmItems.forEach((c, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  card(s6, 0.55 + col * 6.25, 1.4 + row * 2.7, 5.95, 2.35, c.head, c.body, i < 2 ? MS_PURPLE : MS_TEAL);
});

// ============================================================
// SLIDE 7 — Knowledge Vault
// ============================================================
const s7 = pptx.addSlide();
chrome(s7, 'Knowledge Vault', { num: 7 });
s7.addText('Nothing starts from scratch.', {
  x: 0.55, y: 1.35, w: 10, fontSize: 16, italic: true, color: MS_GRAY50, fontFace: 'Segoe UI',
});

const vaultItems = [
  { head: 'Cross-Referenced', body: 'Every action is informed by your personal knowledge base — customer profiles, project specs, past decisions.', color: MS_BLUE },
  { head: 'Voice → Structure', body: 'Speak a memo on the go. It gets transcribed, structured, and linked to the right customer or project.', color: MS_ORANGE },
  { head: 'Living Memory', body: 'New information auto-connects to existing notes. No manual filing — relationships are inferred.', color: MS_GREEN },
];
vaultItems.forEach((v, i) => {
  card(s7, 0.55 + i * 4.15, 2.0, 3.85, 3.2, v.head, v.body, v.color);
});

s7.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 5.8, w: 12.2, h: 0.65, fill: MS_GRAY05, rectRadius: 0.12 });
s7.addText('Institutional memory that actually works.', {
  x: 0.55, y: 5.8, w: 12.2, h: 0.65, fontSize: 16, bold: true, color: MS_BLUE, align: 'center', valign: 'middle', fontFace: 'Segoe UI',
});

// ============================================================
// SLIDE 8 — Connected by Design
// ============================================================
const s8 = pptx.addSlide();
chrome(s8, 'Connected by Design', { num: 8 });
s8.addText('One assistant  ·  Six data sources  ·  Zero tab-switching', {
  x: 0.55, y: 1.3, w: 12, fontSize: 15, color: MS_GRAY50, fontFace: 'Segoe UI', align: 'center',
});

const dataSources = [
  { name: 'Outlook', desc: 'Inbox triage, draft replies, thread tracking', color: MS_BLUE },
  { name: 'Calendar', desc: 'Meeting prep, scheduling, history', color: MS_TEAL },
  { name: 'Dynamics CRM', desc: 'Pipeline, milestones, deal teams', color: MS_PURPLE },
  { name: 'Teams', desc: 'Channel monitoring, chat context', color: MS_MAGENTA },
  { name: 'SharePoint', desc: 'Documents, file access, search', color: MS_ORANGE },
  { name: 'Knowledge Vault', desc: 'Notes, specs, meeting history', color: MS_GREEN },
];
dataSources.forEach((ds, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const xPos = 0.55 + col * 4.15;
  const yPos = 1.9 + row * 2.5;
  // card
  s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos, y: yPos, w: 3.85, h: 2.1, fill: WHITE, rectRadius: 0.18,
    shadow: { type: 'outer', blur: 8, offset: 2, color: '000000', opacity: 0.1 },
    line: { color: MS_GRAY10, width: 0.5 },
  });
  // colored left edge
  s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: xPos + 0.08, y: yPos + 0.25, w: 0.08, h: 1.6, fill: ds.color, rectRadius: 0.04 });
  s8.addText(ds.name, { x: xPos + 0.35, y: yPos + 0.25, w: 3.2, fontSize: 17, bold: true, color: MS_NAVY, fontFace: 'Segoe UI' });
  s8.addText(ds.desc, { x: xPos + 0.35, y: yPos + 0.85, w: 3.2, h: 1.0, fontSize: 13, color: MS_GRAY50, fontFace: 'Segoe UI', valign: 'top' });
});

// ============================================================
// SLIDE 9 — Safety Rails
// ============================================================
const s9 = pptx.addSlide();
chrome(s9, 'Built-In Safety Rails', { num: 9 });

const rails = [
  { rule: 'Email', detail: 'Never sends directly — creates drafts only', icon: '✉' },
  { rule: 'Teams', detail: 'Never posts without your explicit approval', icon: '💬' },
  { rule: 'CRM', detail: 'All writes staged with before/after diff for review', icon: '📊' },
  { rule: 'Uncertainty', detail: 'Always called out, never hidden or assumed', icon: '⚠' },
];
rails.forEach((r, i) => {
  const yPos = 1.5 + i * 1.2;
  // icon circle
  s9.addShape(pptx.shapes.OVAL, { x: 0.6, y: yPos + 0.05, w: 0.7, h: 0.7, fill: MS_BLUE, shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.1 } });
  s9.addText(r.icon, { x: 0.6, y: yPos + 0.05, w: 0.7, h: 0.7, fontSize: 20, color: WHITE, align: 'center', valign: 'middle' });
  // rule name
  s9.addText(r.rule, { x: 1.6, y: yPos, w: 2, h: 0.4, fontSize: 16, bold: true, color: MS_NAVY, fontFace: 'Segoe UI' });
  s9.addText(r.detail, { x: 1.6, y: yPos + 0.35, w: 10, h: 0.45, fontSize: 14, color: MS_GRAY50, fontFace: 'Segoe UI' });
  // divider
  if (i < 3) s9.addShape(pptx.shapes.RECTANGLE, { x: 0.55, y: yPos + 1.0, w: 12, h: 0.01, fill: MS_GRAY10 });
});

// callout bar
s9.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.55, y: 6.0, w: 12.2, h: 0.7, fill: MS_NAVY, rectRadius: 0.15 });
s9.addText("You stay in control. The AI supports your judgment — it doesn't replace it.", {
  x: 0.55, y: 6.0, w: 12.2, h: 0.7, fontSize: 16, bold: true, color: WHITE, align: 'center', valign: 'middle', fontFace: 'Segoe UI',
});

// ============================================================
// SLIDE 10 — The Bottom Line (dark closer)
// ============================================================
const s10 = pptx.addSlide();
s10.background = { fill: MS_NAVY };
// decorative geometry
s10.addShape(pptx.shapes.OVAL, { x: -2, y: -2, w: 7, h: 7, fill: MS_BLUE, transparency: 90 });
s10.addShape(pptx.shapes.OVAL, { x: 10, y: 4, w: 5, h: 5, fill: MS_PURPLE, transparency: 88 });
s10.addShape(pptx.shapes.RECTANGLE, { x: 0.9, y: 0.6, w: 0.08, h: 2.2, fill: MS_BLUE, rectRadius: 0.04 });

s10.addText('The Bottom Line', { x: 1.3, y: 0.7, w: 8, fontSize: 36, bold: true, color: WHITE, fontFace: 'Segoe UI Semibold' });
s10.addShape(pptx.shapes.RECTANGLE, { x: 1.3, y: 1.7, w: 2.5, h: 0.06, fill: MS_BLUE, rectRadius: 0.03 });

s10.addText('Hours of triage, prep, and follow-up  →  minutes.', {
  x: 1.3, y: 2.1, w: 10, fontSize: 22, bold: true, color: MS_BLUE, fontFace: 'Segoe UI',
});

const outcomes = [
  'Start every day with a prioritized action queue',
  'Walk into every meeting fully prepared',
  'Keep your pipeline clean without manual busywork',
  'Never lose context between conversations',
];
outcomes.forEach((o, i) => {
  const yPos = 3.2 + i * 0.75;
  s10.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 1.3, y: yPos + 0.05, w: 0.35, h: 0.35, fill: MS_BLUE, rectRadius: 0.08 });
  s10.addText('✓', { x: 1.3, y: yPos + 0.05, w: 0.35, h: 0.35, fontSize: 14, color: WHITE, align: 'center', valign: 'middle' });
  s10.addText(o, { x: 1.9, y: yPos, w: 9, h: 0.45, fontSize: 17, color: MS_GRAY10, valign: 'middle', fontFace: 'Segoe UI' });
});

s10.addText('Spend your time on the work that actually matters.', {
  x: 1.3, y: 6.3, w: 10, fontSize: 17, italic: true, color: MS_GRAY30, fontFace: 'Segoe UI',
});

// ============================================================
// Write
// ============================================================
const outputPath = './Personal-Chief-of-Staff.pptx';
await pptx.writeFile({ fileName: outputPath });
console.log(`Done → ${outputPath} (${TOTAL} slides)`);
