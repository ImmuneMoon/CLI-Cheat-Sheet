// Builds CLI-Cheat-Sheet.html (standalone, no external assets) from content.js
// Usage: node src/build-html.js [output.html]
const fs = require('fs');
const path = require('path');
const { sections, shortcuts, notes, essentials } = require('./content.js');
const { splitAnnotation } = require('./annotate.js');
const { key, starred, resolveEssentials } = require('./essentials.js');
const { normalizeNotes } = require('./notes.js');
const STARRED = starred(essentials);

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function cmdLine(line) {
  const [code, ann] = splitAnnotation(line);
  return '<div class="line">' +
    (code ? `<code>${esc(code)}</code>` : '') +
    (ann ? `${code ? ' ' : ''}<span class="ann">${esc(ann)}</span>` : '') +
    '</div>';
}

function table(headers, rows, cellsFor, cls = 'multi') {
  let h = `<table class="${cls}"><thead><tr>` + headers.map(x => `<th>${esc(x)}</th>`).join('') + '</tr></thead><tbody>';
  for (const r of rows) h += '<tr>' + cellsFor(r).join('') + '</tr>';
  return h + '</tbody></table>';
}

const taskCell = (text, star) => `<td class="task">${star ? '<span class="star" title="Everyday essential">★</span> ' : ''}${esc(text)}</td>`;

const commandRows = (rows, sectionTitle) => table(['Task', 'CMD', 'PowerShell', 'Bash', 'Notes'], rows, r => [
  taskCell(r[0], STARRED.has(key(sectionTitle, r[0]))),
  `<td>${r[1].map(cmdLine).join('')}</td>`,
  `<td>${r[2].map(cmdLine).join('')}</td>`,
  `<td>${r[3].map(cmdLine).join('')}</td>`,
  `<td class="note">${esc(r[4])}</td>`,
]);

const essentialRows = rows => table(['Task', 'CMD', 'PowerShell', 'Bash'], rows, r => [
  `<td class="task"><span class="star">★</span> <a href="#${slug(r[4])}" title="Full entry in ${esc(r[4])}">${esc(r[0])}</a></td>`,
  `<td>${r[1].map(cmdLine).join('')}</td>`,
  `<td>${r[2].map(cmdLine).join('')}</td>`,
  `<td>${r[3].map(cmdLine).join('')}</td>`,
], 'multi essentials');

const platformRows = (rows, sectionTitle) => table(['Task', 'Windows', 'macOS', 'Linux', 'Notes'], rows, r => [
  taskCell(r[0], STARRED.has(key(sectionTitle, r[0]))),
  `<td>${r[1].map(cmdLine).join('')}</td>`,
  `<td>${r[2].map(cmdLine).join('')}</td>`,
  `<td>${r[3].map(cmdLine).join('')}</td>`,
  `<td class="note">${esc(r[4])}</td>`,
], 'platform');

const singleRows = rows => table(['Task', 'Command', 'Notes'], rows, r => [
  `<td class="task">${esc(r[0])}</td>`,
  `<td>${r[1].map(cmdLine).join('')}</td>`,
  `<td class="note">${esc(r[2])}</td>`,
], 'single');

const shortcutRows = rows => table(['Action', 'CMD', 'PowerShell', 'Bash', 'Notes'], rows, r => [
  `<td class="task">${esc(r[0])}</td>`,
  `<td>${cmdLine(r[1])}</td>`, `<td>${cmdLine(r[2])}</td>`, `<td>${cmdLine(r[3])}</td>`,
  `<td class="note">${esc(r[4])}</td>`,
]);

const allSections = ['Everyday Essentials', ...sections.map(s => s.title), 'Keyboard Shortcuts', 'Notes and Gotchas'];
const singleSections = sections.filter(s => s.kind === 'single');
// body.hide-<slug> hides that section (and its nav link) when its toggle is off
const sectionHideCss = singleSections.map(s => `body.hide-${slug(s.title)} #${slug(s.title)},body.hide-${slug(s.title)} nav a[href="#${slug(s.title)}"]{display:none}`).join('\n');

let body = '';
body += `<section id="everyday-essentials" class="multi-section"><h2>Everyday Essentials</h2><p class="lead">The commands most people use every day, in short form. Click a task name for the full entry with more options and notes.</p>${essentialRows(resolveEssentials(sections, essentials))}</section>`;
const tableFor = s => s.kind === 'single' ? singleRows(s.rows) : s.kind === 'platform' ? platformRows(s.rows, s.title) : commandRows(s.rows, s.title);
for (const s of sections) body += `<section id="${slug(s.title)}"${s.kind === 'single' ? '' : ' class="multi-section"'}><h2>${esc(s.title)}</h2>${tableFor(s)}</section>`;
const multiTitles = new Set(['Everyday Essentials', ...sections.filter(s => s.kind !== 'single').map(s => s.title)]);
body += `<section id="keyboard-shortcuts"><h2>Keyboard Shortcuts</h2>${shortcutRows(shortcuts)}</section>`;
body += '<section id="notes-and-gotchas"><h2>Notes and Gotchas</h2><div class="notes">';
for (const g of normalizeNotes(notes)) {
  body += `<div class="notegroup" data-tags="${esc(g.tags.join(' '))}"><h3>${esc(g.title)}</h3><ul>` +
    g.items.map(i => `<li data-tags="${esc(i.tags.join(' '))}">${esc(i.text)}</li>`).join('') + '</ul></div>';
}
body += '</div></section>';

const css = `
:root{--ink:#111827;--muted:#6b7280;--head:#2e3a4b;--zebra:#f3f5f7;--border:#c9ced6;--code:#1f2937;--bg:#fff;--codebg:#f6f7f9;--accent:#2563eb}
@media (prefers-color-scheme:dark){:root{--ink:#e5e7eb;--muted:#9ca3af;--head:#1f2937;--zebra:#161a21;--border:#374151;--code:#e5e7eb;--bg:#0f1115;--codebg:#1b1f27;--accent:#60a5fa}}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:64px}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.4 Calibri,Carlito,"Segoe UI",system-ui,-apple-system,sans-serif}
.wrap{max-width:1500px;margin:0 auto;padding:16px 24px 48px}
header h1{font-size:28px;margin:8px 0 2px}
header .sub{color:var(--muted);font-size:15px;margin:0 0 10px}
.howto{font-size:13.5px;margin:0 0 12px;max-width:1100px}
.howto .ann{font-style:italic;color:var(--muted)}
nav{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--border);padding:8px 0;margin:0 0 8px;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}
nav a{color:var(--accent);text-decoration:none;font-size:13px;white-space:nowrap}
nav a:hover{text-decoration:underline}
nav input{margin-left:auto;font:inherit;padding:5px 9px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--ink);min-width:220px}
h2{font-size:19px;color:var(--head);margin:26px 0 8px}
@media (prefers-color-scheme:dark){h2{color:#cbd5e1}}
h3{font-size:15px;margin:14px 0 4px}
table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:13px}
th,td{border:1px solid var(--border);padding:5px 8px;vertical-align:top;text-align:left}
th{background:var(--head);color:#fff;font-weight:600}
tbody tr:nth-child(even){background:var(--zebra)}
table.multi th:nth-child(1){width:12.4%}table.multi th:nth-child(2){width:23%}table.multi th:nth-child(3){width:26.2%}table.multi th:nth-child(4){width:23.4%}table.multi th:nth-child(5){width:15%}
table.single th:nth-child(1){width:14%}table.single th:nth-child(2){width:54%}table.single th:nth-child(3){width:32%}
table.platform th:nth-child(1){width:12.4%}table.platform th:nth-child(2){width:26%}table.platform th:nth-child(3){width:22%}table.platform th:nth-child(4){width:24%}table.platform th:nth-child(5){width:15.6%}
body.hide-cmd.hide-ps table.platform th:nth-child(2),body.hide-cmd.hide-ps table.platform td:nth-child(2),
body.hide-bash table.platform th:nth-child(3),body.hide-bash table.platform td:nth-child(3),
body.hide-bash table.platform th:nth-child(4),body.hide-bash table.platform td:nth-child(4){display:none}
table.essentials th:nth-child(1){width:14%}table.essentials th:nth-child(2),table.essentials th:nth-child(3),table.essentials th:nth-child(4){width:28.66%}
.star{color:#d97706;font-weight:700}
.lead{margin:0 0 8px;font-size:13px;color:var(--muted)}
td.task a{color:inherit;text-decoration:none;border-bottom:1px dotted var(--muted)}
td.task a:hover{color:var(--accent);border-bottom-color:var(--accent)}
#nomatch{margin:16px 0;padding:12px 14px;border:1px dashed var(--border);border-radius:6px;color:var(--muted)}
body.hide-cmd table.multi th:nth-child(2),body.hide-cmd table.multi td:nth-child(2),
body.hide-ps table.multi th:nth-child(3),body.hide-ps table.multi td:nth-child(3),
body.hide-bash table.multi th:nth-child(4),body.hide-bash table.multi td:nth-child(4){display:none}
${sectionHideCss}
body.hide-multi .multi-section,body.hide-multi nav a[data-multi]{display:none}
.toggles{display:flex;gap:10px;align-items:center;font-size:13px;color:var(--muted);padding-left:8px;border-left:1px solid var(--border)}
.toggles label{display:inline-flex;align-items:center;gap:4px;cursor:pointer;white-space:nowrap}
.toggles input{margin:0;min-width:0}
td.task{font-weight:600}
td.note{font-size:12.5px}
.line{margin:0 0 3px;overflow-wrap:anywhere}
.line:last-child{margin-bottom:0}
code{font:12.5px/1.35 Consolas,"Cascadia Mono",Menlo,"DejaVu Sans Mono",monospace;color:var(--code);background:var(--codebg);padding:0 3px;border-radius:3px}
tbody code{cursor:pointer;position:relative;transition:background .15s}
tbody code:hover{background:var(--accent);color:#fff}
tbody code.copied::after{content:"Copied";position:absolute;left:0;bottom:calc(100% + 3px);padding:1px 6px;border-radius:4px;z-index:2;background:var(--ink);color:var(--bg);font:11px Calibri,Carlito,"Segoe UI",system-ui,sans-serif;white-space:nowrap;pointer-events:none}
.ann{font-size:12px;font-style:italic;color:var(--muted)}
.notes{columns:2;column-gap:32px;max-width:1300px}
.notegroup{break-inside:avoid;margin-bottom:10px}
.notes ul{margin:0;padding-left:20px}
.notes li{margin:0 0 4px;font-size:13.5px}
tr.hide{display:none}
footer{margin-top:32px;color:var(--muted);font-size:12px}
@page{size:letter landscape;margin:0.5in}
@media print{
  :root{--ink:#111827;--muted:#6b7280;--head:#2e3a4b;--zebra:#f3f5f7;--border:#c9ced6;--code:#1f2937;--bg:#fff;--codebg:transparent;--accent:#111827}
  body{font-size:11.5px}
  .wrap{max-width:none;padding:0}
  nav{display:none}
  h2{page-break-after:avoid;margin-top:18px}
  section:first-of-type h2{margin-top:6px}
  table{font-size:10.5px}
  thead{display:table-header-group}
  tr{page-break-inside:avoid}
  code{font-size:10px;padding:0}
  .ann{font-size:9.5px}
  td.note{font-size:10px}
  th{background:var(--head)!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  tbody tr:nth-child(even){background:var(--zebra)!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .notes{columns:3}
  a{color:inherit}
}`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Command Line Interface Cheat Sheet</title>
<meta name="description" content="Windows CMD, PowerShell, Bash and Git commands side by side.">
<style>${css}</style>
</head>
<body>
<div class="wrap">
<header>
<h1>Command Line Interface Cheat Sheet</h1>
<p class="sub">Windows CMD &nbsp;·&nbsp; PowerShell &nbsp;·&nbsp; Bash (Linux and macOS) &nbsp;·&nbsp; Git</p>
<p class="howto"><strong>How to read this sheet.</strong> Each row shows the same task in all three shells. Commands are in monospace; <span class="ann">grey italics</span> explain flags or name an alias for the same command. 🔒 needs administrator, root or sudo. ⚠ destructive; check before running. (Linux) or (macOS) marks a command that exists only on that platform. <span class="star">★</span> marks the everyday essentials. Click any command to copy it.</p>
</header>
<nav>
${allSections.map(t => `<a href="#${slug(t)}"${multiTitles.has(t) ? ' data-multi' : ''}>${esc(t)}</a>`).join('\n')}
<input id="filter" type="search" placeholder="Filter rows… (e.g. ssh, -Recurse)" aria-label="Filter rows">
<span class="toggles" role="group" aria-label="Show columns and sections">Show:
<label><input type="checkbox" data-col="cmd" checked> CMD</label>
<label><input type="checkbox" data-col="ps" checked> PowerShell</label>
<label><input type="checkbox" data-col="bash" checked> Bash</label>
${singleSections.map(s => `<label><input type="checkbox" data-section="${slug(s.title)}" checked> ${esc(s.title)}</label>`).join('\n')}
</span>
</nav>
<p id="nomatch" hidden>No rows match <strong id="nomatch-q"></strong>. Try fewer letters, or check the Show toggles above.</p>
${body}
<footer>Command Line Interface Cheat Sheet · © 2026 Fulllion Creative Works · MIT License · also available as DOCX and PDF in the repository.</footer>
</div>
<script>
(function(){
  var box=document.getElementById('filter');if(!box)return;
  var rows=[].slice.call(document.querySelectorAll('tbody tr'));
  var cache=rows.map(function(r){return r.textContent.toLowerCase();});
  var nomatch=document.getElementById('nomatch'),nomatchQ=document.getElementById('nomatch-q');
  function apply(){
    var q=box.value.trim().toLowerCase();
    rows.forEach(function(r,i){r.classList.toggle('hide',q&&cache[i].indexOf(q)<0);});
    document.querySelectorAll('section').forEach(function(s){
      var t=s.querySelector('tbody');if(!t)return;
      s.style.display=(q&&!t.querySelector('tr:not(.hide)'))?'none':'';
    });
    var any=rows.some(function(r){return r.offsetParent!==null;});
    nomatch.hidden=!(q&&!any);
    nomatchQ.textContent=box.value.trim();
  }
  box.addEventListener('input',apply);
  document.addEventListener('keydown',function(e){if(e.key==='/'&&document.activeElement!==box){e.preventDefault();box.focus();}});

  // Column and section toggles, remembered per browser.
  var KEY='cli-cheat-sheet-cols';
  var toggles=[].slice.call(document.querySelectorAll('.toggles input[data-col],.toggles input[data-section]'));
  var keyOf=function(t){return t.dataset.col||t.dataset.section;};
  var saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
  function applyCols(){
    var state={};
    toggles.forEach(function(t){state[keyOf(t)]=t.checked;document.body.classList.toggle('hide-'+keyOf(t),!t.checked);});
    // with every shell column off, the shell tables have nothing to show: hide those sections
    var anyShell=toggles.some(function(x){return x.dataset.col&&x.checked;});
    document.body.classList.toggle('hide-multi',!anyShell);
    // notes: show a bullet if any of its tags is checked; hide a group with no visible bullets
    document.querySelectorAll('.notegroup').forEach(function(g){
      var shown=0;
      g.querySelectorAll('li[data-tags]').forEach(function(li){
        var on=li.dataset.tags.split(' ').some(function(t){return state[t];});
        li.hidden=!on;if(on)shown++;
      });
      g.hidden=shown===0;
    });
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
  }
  toggles.forEach(function(t){
    if(saved[keyOf(t)]===false)t.checked=false;
  });
  if(!toggles.some(function(x){return x.checked;}))toggles[0].checked=true; // never restore an all-off state
  toggles.forEach(function(t){
    t.addEventListener('change',function(){
      // keep at least one toggle on, whichever it is
      if(!toggles.some(function(x){return x.checked;})){t.checked=true;return;}
      applyCols();apply();
    });
  });
  applyCols();

  // Click a command to copy it.
  function copyText(text){
    if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(text);
    return new Promise(function(res,rej){
      var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');
      ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
      try{document.execCommand('copy')?res():rej();}catch(e){rej(e);}
      document.body.removeChild(ta);
    });
  }
  document.addEventListener('click',function(e){
    var code=e.target.closest&&e.target.closest('tbody code');if(!code)return;
    if(window.getSelection&&String(window.getSelection()).length)return; // user is selecting text
    copyText(code.textContent).then(function(){
      code.classList.add('copied');
      setTimeout(function(){code.classList.remove('copied');},900);
    },function(){});
  });
  document.querySelectorAll('tbody code').forEach(function(c){c.title='Click to copy';});
})();
</script>
</body>
</html>`;

const out = process.argv[2] || path.join(__dirname, '..', 'CLI-Cheat-Sheet.html');
fs.writeFileSync(out, html);
console.log('wrote', out, html.length, 'bytes');
