// Builds CLI-Cheat-Sheet.docx from content.js
// Usage: node src/build-docx.js [output.docx]
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, HeadingLevel, AlignmentType, PageOrientation,
  Footer, PageNumber, LevelFormat, TabStopType,
} = require('docx');
const { sections, shortcuts, notes, essentials } = require('./content.js');
const { splitAnnotation } = require('./annotate.js');
const { key, starred, resolveEssentials } = require('./essentials.js');
const { normalizeNotes } = require('./notes.js');
const STARRED = starred(essentials);

// ---------- page geometry (US Letter landscape) ----------
const PAGE_W = 15840, PAGE_H = 12240, MARGIN = 864;           // 0.6in margins
const TEXT_W = PAGE_W - 2 * MARGIN;                            // 14112
const COLS = [1750, 3250, 3700, 3300, 2112];                   // sums to 14112
const HEADERS = ['Task', 'CMD', 'PowerShell', 'Bash', 'Notes'];
const SINGLE_COLS = [2000, 7600, 4512];                        // kind: 'single' sections; sums to 14112
const SINGLE_HEADERS = ['Task', 'Command', 'Notes'];
const ESS_COLS = [2000, 4037, 4038, 4037];                     // Everyday Essentials; sums to 14112
const ESS_HEADERS = ['Task', 'CMD', 'PowerShell', 'Bash'];
const C_STAR = 'D97706';

// ---------- fonts / colours ----------
const SANS = 'Calibri', MONO = 'Consolas', EMOJI = 'Segoe UI Emoji';
const BODY = 18, CODE = 17, SMALL = 16;                        // half-points
const C_HEAD = '2E3A4B', C_ZEBRA = 'F3F5F7', C_BORDER = 'C9CED6', C_ANN = '6B7280', C_CODE = '1F2937';

const EMOJI_RE = /([⚠🔒]️?)/u;

function runs(text, opts = {}) {
  return text.split(EMOJI_RE).filter(s => s !== '').map(s =>
    EMOJI_RE.test(s)
      ? new TextRun({ text: s, font: EMOJI, size: opts.size || BODY })
      : new TextRun({ text: s, font: SANS, size: BODY, ...opts })
  );
}

function commandParagraph(line, tight = false) {
  const [code, ann] = splitAnnotation(line);
  const children = [];
  if (code) children.push(...runs(code, { font: MONO, size: CODE, color: C_CODE }));
  if (ann) {
    if (code) children.push(new TextRun({ text: ' ', size: CODE }));
    children.push(...runs(ann, { size: SMALL, italics: true, color: C_ANN }));
  }
  return new Paragraph({ children, spacing: { after: tight ? 0 : 30, line: 240 } });
}

function noteParagraph(text) {
  return new Paragraph({ children: runs(text, { size: SMALL }), spacing: { after: 0, line: 240 } });
}

function cell(children, width, opts = {}) {
  return new TableCell({
    children, width: { size: width, type: WidthType.DXA },
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
  });
}

const border = { style: BorderStyle.SINGLE, size: 4, color: C_BORDER };
const tableBorders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

function headerRow(labels, cols = COLS) {
  return new TableRow({
    tableHeader: true, cantSplit: true,
    children: labels.map((h, i) => cell(
      [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', font: SANS, size: BODY })], spacing: { after: 0 } })],
      cols[i], { fill: C_HEAD })),
  });
}

function taskCell(text, fill, width = COLS[0], star = false) {
  const children = [];
  if (star) children.push(new TextRun({ text: '★ ', bold: true, font: 'Segoe UI Symbol', size: BODY, color: C_STAR }));
  children.push(new TextRun({ text, bold: true, font: SANS, size: BODY }));
  return cell([new Paragraph({ children, spacing: { after: 0 } })], width, { fill });
}

function essentialsTable(rows) {
  const trs = [headerRow(ESS_HEADERS, ESS_COLS)];
  rows.forEach((r, idx) => {
    const fill = idx % 2 === 1 ? C_ZEBRA : undefined;
    trs.push(new TableRow({ cantSplit: true, children: [
      taskCell(r[0], fill, ESS_COLS[0], true),
      cell(r[1].map(l => commandParagraph(l)), ESS_COLS[1], { fill }),
      cell(r[2].map(l => commandParagraph(l)), ESS_COLS[2], { fill }),
      cell(r[3].map(l => commandParagraph(l)), ESS_COLS[3], { fill }),
    ] }));
  });
  return new Table({ columnWidths: ESS_COLS, width: { size: TEXT_W, type: WidthType.DXA }, borders: tableBorders, rows: trs });
}

function singleTable(rows) {
  const trs = [headerRow(SINGLE_HEADERS, SINGLE_COLS)];
  rows.forEach((r, idx) => {
    const [fn, cmds, note] = r;
    const fill = idx % 2 === 1 ? C_ZEBRA : undefined;
    trs.push(new TableRow({ cantSplit: true, children: [
      taskCell(fn, fill, SINGLE_COLS[0]),
      cell(cmds.map(l => commandParagraph(l)), SINGLE_COLS[1], { fill }),
      cell([noteParagraph(note)], SINGLE_COLS[2], { fill }),
    ] }));
  });
  return new Table({ columnWidths: SINGLE_COLS, width: { size: TEXT_W, type: WidthType.DXA }, borders: tableBorders, rows: trs });
}

function commandTable(rows, sectionTitle) {
  const trs = [headerRow(HEADERS)];
  rows.forEach((r, idx) => {
    const [fn, cmd, ps, bash, note] = r;
    const fill = idx % 2 === 1 ? C_ZEBRA : undefined;
    trs.push(new TableRow({ cantSplit: true, children: [
      taskCell(fn, fill, COLS[0], STARRED.has(key(sectionTitle, fn))),
      cell(cmd.map(l => commandParagraph(l)), COLS[1], { fill }),
      cell(ps.map(l => commandParagraph(l)), COLS[2], { fill }),
      cell(bash.map(l => commandParagraph(l)), COLS[3], { fill }),
      cell([noteParagraph(note)], COLS[4], { fill }),
    ] }));
  });
  return new Table({ columnWidths: COLS, width: { size: TEXT_W, type: WidthType.DXA }, borders: tableBorders, rows: trs });
}

function shortcutTable(rows) {
  const trs = [headerRow(['Action', 'CMD', 'PowerShell', 'Bash', 'Notes'])];
  rows.forEach((r, idx) => {
    const fill = idx % 2 === 1 ? C_ZEBRA : undefined;
    trs.push(new TableRow({ cantSplit: true, children: [
      taskCell(r[0], fill),
      cell([commandParagraph(r[1], true)], COLS[1], { fill }),
      cell([commandParagraph(r[2], true)], COLS[2], { fill }),
      cell([commandParagraph(r[3], true)], COLS[3], { fill }),
      cell([noteParagraph(r[4])], COLS[4], { fill }),
    ] }));
  });
  return new Table({ columnWidths: COLS, width: { size: TEXT_W, type: WidthType.DXA }, borders: tableBorders, rows: trs });
}

function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 260, after: 100 }, children: [new TextRun({ text })] });
}

// ---------- body ----------
const children = [];

children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 40 }, children: [new TextRun({ text: 'Command Line Interface Cheat Sheet' })] }));
children.push(new Paragraph({ spacing: { after: 80 }, children: [
  new TextRun({ text: 'Windows CMD  ·  PowerShell  ·  Bash (Linux and macOS)  ·  Git', font: SANS, size: 22, color: '4B5563' }),
] }));

children.push(new Paragraph({ spacing: { after: 60 }, children: [
  new TextRun({ text: 'How to read this sheet.  ', bold: true, font: SANS, size: BODY }),
  ...runs('Each row shows the same task in all three shells. Commands are in monospace; '),
  new TextRun({ text: 'grey italics', italics: true, color: C_ANN, font: SANS, size: BODY }),
  ...runs(' explain flags or name an alias for the same command.  🔒 needs administrator, root or sudo.  ⚠ destructive; check before running.  (Linux) or (macOS) marks a command that exists only on that platform.  '),
  new TextRun({ text: '★', bold: true, font: 'Segoe UI Symbol', size: BODY, color: C_STAR }),
  ...runs(' marks the everyday essentials.'),
] }));

children.push(new Paragraph({ spacing: { after: 120 }, children: [
  new TextRun({ text: 'Sections:  ', bold: true, font: SANS, size: SMALL, color: '4B5563' }),
  new TextRun({ text: ['Everyday Essentials', ...sections.map(s => s.title), 'Keyboard Shortcuts', 'Notes and Gotchas'].join('  ·  '), font: SANS, size: SMALL, color: '4B5563' }),
] }));

children.push(h2('Everyday Essentials'));
children.push(new Paragraph({ spacing: { after: 80 }, children: runs('The commands most people use every day, in short form. Each one appears again in its own section below with more options and notes.', { size: SMALL, color: '4B5563' }) }));
children.push(essentialsTable(resolveEssentials(sections, essentials)));

for (const s of sections) {
  children.push(h2(s.title));
  children.push(s.kind === 'single' ? singleTable(s.rows) : commandTable(s.rows, s.title));
}

children.push(h2('Keyboard Shortcuts'));
children.push(shortcutTable(shortcuts));

children.push(h2('Notes and Gotchas'));
for (const group of normalizeNotes(notes)) {
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, spacing: { before: 140, after: 40 }, children: [new TextRun({ text: group.title })] }));
  for (const it of group.items) {
    children.push(new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 30, line: 250 }, children: runs(it.text) }));
  }
}

// ---------- document ----------
const doc = new Document({
  creator: 'Fulllion Creative Works',
  title: 'Command Line Interface Cheat Sheet',
  styles: {
    default: { document: { run: { font: SANS, size: BODY } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 40, bold: true, font: SANS, color: '111827' }, paragraph: { spacing: { after: 60 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: SANS, color: C_HEAD }, paragraph: { outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 20, bold: true, font: SANS, color: '111827' }, paragraph: { outlineLevel: 2 } },
    ],
  },
  numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: PAGE_H, height: PAGE_W, orientation: PageOrientation.LANDSCAPE },
      margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 400, footer: 400 } } },
    footers: { default: new Footer({ children: [new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W }],
      children: [
        new TextRun({ text: 'Command Line Interface Cheat Sheet  ·  © 2026 Fulllion Creative Works  ·  MIT License', font: SANS, size: SMALL, color: '6B7280' }),
        new TextRun({ text: '\tPage ', font: SANS, size: SMALL, color: '6B7280' }),
        new TextRun({ children: [PageNumber.CURRENT], font: SANS, size: SMALL, color: '6B7280' }),
        new TextRun({ text: ' of ', font: SANS, size: SMALL, color: '6B7280' }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: SANS, size: SMALL, color: '6B7280' }),
      ] })] }) },
    children,
  }],
});

const out = process.argv[2] || path.join(__dirname, '..', 'CLI-Cheat-Sheet.docx');
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(out, buf); console.log('wrote', out, buf.length, 'bytes'); });
