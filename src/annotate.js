// Splits a command line into [code, annotation].
// A trailing "(...)" group is an annotation unless it looks like PowerShell
// parameters (e.g. "(Read-Host -AsSecureString)").
function parenSpansToEnd(s, i) {
  let depth = 0;
  for (let k = i; k < s.length; k++) {
    if (s[k] === '(') depth++;
    else if (s[k] === ')') { depth--; if (depth === 0) return k === s.length - 1; }
  }
  return false;
}

function looksLikeCode(inner) { return /[\s(]-[A-Z]/.test(inner); }

function splitAnnotation(s) {
  if (s.startsWith('(') && s.endsWith(')') && parenSpansToEnd(s, 0) && !looksLikeCode(s)) return ['', s];
  const i = s.lastIndexOf(' (');
  if (i > 0 && s.endsWith(')') && parenSpansToEnd(s, i + 1)) {
    const inner = s.slice(i + 1);
    if (!looksLikeCode(inner)) return [s.slice(0, i), inner];
  }
  return [s, ''];
}

module.exports = { splitAnnotation };
