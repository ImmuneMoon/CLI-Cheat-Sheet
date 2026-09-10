// Builds CLI-Cheat-Sheet.md (GitHub-flavoured Markdown) from content.js
// Usage: node src/build-md.js [output.md]
const fs = require('fs');
const path = require('path');
const { sections, shortcuts, notes, essentials } = require('./content.js');
const { splitAnnotation } = require('./annotate.js');
const { key, starred, resolveEssentials } = require('./essentials.js');
const { normalizeNotes } = require('./notes.js');
const STARRED = starred(essentials);

// Inside a GFM table cell a pipe must be escaped even within backticks.
const cellSafe = s => s.replace(/\|/g, '\\|');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function codeSpan(code) {
  // Use a longer backtick fence if the code itself contains backticks.
  const ticks = '`'.repeat(Math.max(1, ...(code.match(/`+/g) || []).map(m => m.length + 1)));
  const pad = code.startsWith('`') || code.endsWith('`') ? ' ' : '';
  return `${ticks}${pad}${code}${pad}${ticks}`;
}

function cmdLine(line) {
  const [code, ann] = splitAnnotation(line);
  let out = '';
  if (code) out += codeSpan(code);
  if (ann) out += (code ? ' ' : '') + `*${ann.replace(/\*/g, '\\*')}*`;
  return cellSafe(out);
}

const lines = l => l.map(cmdLine).join('<br>');

function table(headers, rows) {
  let md = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;
  for (const r of rows) md += `| ${r.join(' | ')} |\n`;
  return md;
}

const toc = ['Everyday Essentials', ...sections.map(s => s.title), 'Keyboard Shortcuts', 'Notes and Gotchas'];

let md = `# Command Line Interface Cheat Sheet

Windows CMD · PowerShell · Bash (Linux and macOS) · Git

**How to read this sheet.** Each row shows the same task in all three shells. Commands are in \`monospace\`; *italics* explain flags or name an alias for the same command. 🔒 needs administrator, root or sudo. ⚠ destructive; check before running. *(Linux)* or *(macOS)* marks a command that exists only on that platform. ★ marks the everyday essentials.

Also available as [HTML](CLI-Cheat-Sheet.html) (searchable, dark mode), [PDF](CLI-Cheat-Sheet.pdf) (print) and [DOCX](CLI-Cheat-Sheet.docx) (edit).

**Contents:** ${toc.map(t => `[${t}](#${slug(t)})`).join(' · ')}

`;

md += '## Everyday Essentials\n\n';
md += 'The commands most people use every day, in short form. Each one appears again in its own section with more options and notes.\n\n';
md += table(['Task', 'CMD', 'PowerShell', 'Bash'], resolveEssentials(sections, essentials).map(r => [
  `★ **[${cellSafe(r[0])}](#${slug(r[4])})**`, lines(r[1]), lines(r[2]), lines(r[3]),
]));
md += '\n';

for (const s of sections) {
  md += `## ${s.title}\n\n`;
  const star = task => STARRED.has(key(s.title, task)) ? '★ ' : '';
  md += s.kind === 'single'
    ? table(['Task', 'Command', 'Notes'], s.rows.map(r => [`**${cellSafe(r[0])}**`, lines(r[1]), cellSafe(r[2])]))
    : table(['Task', 'CMD', 'PowerShell', 'Bash', 'Notes'], s.rows.map(r => [
        `${star(r[0])}**${cellSafe(r[0])}**`, lines(r[1]), lines(r[2]), lines(r[3]), cellSafe(r[4]),
      ]));
  md += '\n';
}

md += '## Keyboard Shortcuts\n\n';
md += table(['Action', 'CMD', 'PowerShell', 'Bash', 'Notes'], shortcuts.map(r => [
  `**${cellSafe(r[0])}**`, cmdLine(r[1]), cmdLine(r[2]), cmdLine(r[3]), cellSafe(r[4]),
]));
md += '\n## Notes and Gotchas\n\n';
for (const group of normalizeNotes(notes)) {
  md += `### ${group.title}\n\n`;
  for (const it of group.items) md += `- ${it.text}\n`;
  md += '\n';
}
md += '---\n\n© 2026 Fulllion Creative Works · MIT License · Generated from `src/content.js`; edit that file and run `npm run build` rather than editing this one.\n';

const out = process.argv[2] || path.join(__dirname, '..', 'CLI-Cheat-Sheet.md');
fs.writeFileSync(out, md);
console.log('wrote', out, md.length, 'bytes');
