// Sanity checks for content.js. Run with `npm test`. Exits non-zero on any failure.
const { sections, shortcuts, notes, essentials } = require('./content.js');
const { splitAnnotation } = require('./annotate.js');
const { resolveEssentials } = require('./essentials.js');

const problems = [];
const warnings = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const isStr = x => typeof x === 'string';
const isStrArr = x => Array.isArray(x) && x.length > 0 && x.every(isStr);

function checkLine(where, line) {
  if (line !== line.trim()) fail(where, `leading or trailing whitespace in "${line}"`);
  if (line === '') fail(where, 'empty command line');
  const [code, ann] = splitAnnotation(line);
  if (ann && /[|$]/.test(ann)) warn(where, `annotation looks like code: "${ann}"`);
  if (!ann && / \(/.test(line) && /\)$/.test(line) && !/\(.*-[A-Z]/.test(line)) warn(where, `ends with ")" but was not treated as an annotation: "${line}"`);
  if (code && /^\(.*\)$/.test(code) === false && /\s\s/.test(code)) warn(where, `double space inside command: "${code}"`);
}

if (!Array.isArray(sections) || sections.length === 0) fail('sections', 'must be a non-empty array');

const titles = new Set();
for (const [si, s] of (sections || []).entries()) {
  const where = `section ${si} (${s && s.title})`;
  if (!s || !isStr(s.title) || !s.title.trim()) { fail(where, 'missing title'); continue; }
  if (titles.has(s.title)) fail(where, 'duplicate section title');
  titles.add(s.title);
  if (!Array.isArray(s.rows) || s.rows.length === 0) { fail(where, 'rows must be a non-empty array'); continue; }

  if (s.kind !== undefined && s.kind !== 'single') fail(where, `unknown kind "${s.kind}" (omit it, or use 'single')`);
  const single = s.kind === 'single';
  const fields = single ? 3 : 5;

  const tasks = new Set();
  for (const [ri, r] of s.rows.entries()) {
    const rw = `${s.title} › row ${ri} (${Array.isArray(r) ? r[0] : '?'})`;
    if (!Array.isArray(r) || r.length !== fields) { fail(rw, `expected ${fields} fields, got ${Array.isArray(r) ? r.length : typeof r}`); continue; }
    const task = r[0], note = r[fields - 1];
    const columns = single ? [['Command', r[1]]] : [['CMD', r[1]], ['PowerShell', r[2]], ['Bash', r[3]]];
    if (!isStr(task) || !task.trim()) fail(rw, 'task name must be a non-empty string');
    if (tasks.has(task)) fail(rw, `duplicate task "${task}" in this section`);
    tasks.add(task);
    for (const [name, col] of columns) {
      if (!isStrArr(col)) { fail(rw, `${name} column must be a non-empty array of strings`); continue; }
      col.forEach(l => checkLine(`${rw} › ${name}`, l));
    }
    if (!isStr(note)) fail(rw, 'note must be a string (use "" for none)');
    else if (note !== note.trim()) fail(rw, 'note has leading or trailing whitespace');
  }
}

if (!Array.isArray(shortcuts) || shortcuts.length === 0) fail('shortcuts', 'must be a non-empty array');
const actions = new Set();
for (const [i, r] of (shortcuts || []).entries()) {
  const where = `shortcut ${i} (${Array.isArray(r) ? r[0] : '?'})`;
  if (!Array.isArray(r) || r.length !== 5 || !r.every(isStr)) { fail(where, 'expected 5 strings'); continue; }
  if (actions.has(r[0])) fail(where, 'duplicate action');
  actions.add(r[0]);
  r.slice(1, 4).forEach(l => checkLine(where, l));
}

if (!Array.isArray(notes) || notes.length === 0) fail('notes', 'must be a non-empty array');
const slugOf = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const knownTags = new Set(['cmd', 'ps', 'bash', ...(sections || []).filter(s => s && s.kind === 'single').map(s => slugOf(s.title))]);
const isTags = t => Array.isArray(t) && t.length > 0 && t.every(x => isStr(x) && knownTags.has(x));
for (const [i, n] of (notes || []).entries()) {
  const where = `note group ${i} (${Array.isArray(n) ? n[0] : '?'})`;
  if (!Array.isArray(n) || n.length !== 3 || !isStr(n[0]) || !Array.isArray(n[1]) || n[1].length === 0) { fail(where, 'expected [title, [items...], tags]'); continue; }
  if (!isTags(n[2])) fail(where, `tags must be a non-empty array drawn from: ${[...knownTags].join(', ')}`);
  n[1].forEach((it, j) => {
    const ok = isStr(it) || (Array.isArray(it) && it.length === 2 && isStr(it[0]) && isTags(it[1]));
    if (!ok) fail(`${where} › item ${j}`, 'expected a string or [text, tags]');
  });
}

if (!Array.isArray(essentials) || essentials.length === 0) fail('essentials', 'must be a non-empty array of [section, task]');
else {
  const seen = new Set();
  for (const e of essentials) {
    const where = `essentials (${Array.isArray(e) ? e.join(' › ') : e})`;
    if (!Array.isArray(e) || e.length !== 2 || !e.every(isStr)) { fail(where, 'expected [section title, task name]'); continue; }
    if (seen.has(e.join('\0'))) fail(where, 'listed twice');
    seen.add(e.join('\0'));
  }
  try { resolveEssentials(sections, essentials); } catch (err) { fail('essentials', err.message); }
  if (essentials.length > 20) warn('essentials', `${essentials.length} entries; the point is to be short`);
}

const rowCount = (sections || []).reduce((a, s) => a + ((s.rows && s.rows.length) || 0), 0);
console.log(`${(sections || []).length} sections, ${rowCount} rows, ${(shortcuts || []).length} shortcuts, ${(notes || []).length} note groups, ${(essentials || []).length} essentials`);
for (const w of warnings) console.log('warning:', w);
if (problems.length) {
  for (const p of problems) console.error('FAIL:', p);
  console.error(`${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`content OK${warnings.length ? ` (${warnings.length} warning(s))` : ''}`);
