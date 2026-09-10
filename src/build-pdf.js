// Prints CLI-Cheat-Sheet.html to CLI-Cheat-Sheet.pdf with headless Edge or Chrome.
// Usage: node src/build-pdf.js [input.html] [output.pdf]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const input = path.resolve(process.argv[2] || path.join(__dirname, '..', 'CLI-Cheat-Sheet.html'));
const output = path.resolve(process.argv[3] || path.join(__dirname, '..', 'CLI-Cheat-Sheet.pdf'));

const candidates = process.platform === 'win32' ? [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
] : process.platform === 'darwin' ? [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
] : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];

const browser = process.env.BROWSER_BIN || candidates.find(p => fs.existsSync(p));
if (!browser) { console.error('No Edge or Chrome found. Set BROWSER_BIN to the browser executable.'); process.exit(1); }

const fileUrl = 'file:///' + input.replace(/\\/g, '/');
const args = [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--user-data-dir=' + path.join(require('os').tmpdir(), 'cli-cheat-sheet-pdf-profile'),
  '--no-pdf-header-footer', '--print-to-pdf=' + output, '--virtual-time-budget=5000',
  fileUrl,
];
execFileSync(browser, args, { stdio: 'inherit', timeout: 120000 });
console.log('wrote', output, fs.statSync(output).size, 'bytes using', path.basename(browser));
