// A prose "article" section (kind: 'article') mirroring the one-liner tutorials
// for Command Prompt (cmd.exe). Same block shapes: { h } { p } { ul } { code }.
// Prose uses double-quoted strings (escape " and \); code uses backtick
// template literals (escape \ as \\).

module.exports = { title: 'Building Command Prompt One-Liners', kind: 'article', blocks: [
  { p: "Yes, Command Prompt (`cmd.exe`) does one-liners, but with a small toolset and quirky syntax. It pipes plain text between a handful of built-ins and has no objects, no `$(...)` substitution, and little string handling. For anything richer, use PowerShell (see **Building PowerShell One-Liners**). This covers what CMD does well and where it stops." },

  { h: "Building blocks" },
  { ul: [
    "`set VAR=value` sets a variable, **no spaces** around `=`; read it as `%VAR%`. Inside a `for` loop or a parenthesised block, `%VAR%` is read once up front, so use delayed expansion `!VAR!` after `setlocal enabledelayedexpansion`.",
    "`&` runs the next command regardless; `&&` runs it only if the previous succeeded; `||` only if it failed.",
    "`|` pipes text between commands, but only a few understand it: `find`, `findstr`, `sort`, `more`.",
    "`>` redirects output, `>>` appends, `2>` redirects errors, `2>&1` merges them, `>nul` throws output away.",
    "There is no `$(...)`. To capture a command's output into a loop or variable, use `for /f` (below).",
  ] },

  { h: "for /f: the workhorse" },
  { p: "`for /f` loops over the lines of a file, a string, or another command's output. It is how CMD parses and composes." },
  { ul: [
    "Over a file's fields: `for /f \"tokens=2 delims=,\" %i in (file.csv) do @echo %i` prints the second comma-separated field of each line.",
    "Over a command's output: wrap the command in single quotes: `for /f \"delims=\" %i in ('dir /b *.txt') do @echo %i`.",
    "`tokens=` picks which fields, `delims=` sets the separators, `skip=1` skips a header line.",
    "At an interactive prompt use `%i`; inside a `.bat` file double it to `%%i`.",
  ] },

  { h: "Filtering text" },
  { ul: [
    "`findstr` is CMD's grep: `findstr \"error\" log.txt`, with `/I` ignore case, `/S` recurse, `/V` invert, `/N` line numbers, `/R` regex, and `/C:\"exact phrase\"` for a literal phrase.",
    "`find` is simpler: `find \"text\"` keeps matching lines, `find /c /v \"\"` counts lines, `find /v \"skip\"` drops matching lines.",
    "`sort` orders lines and `more` pages them. There is no `cut`, `awk` or `sed`; reach for PowerShell when you need those. See **Text Processing and Output**.",
  ] },

  { h: "Pattern: search a log" },
  { p: "CMD has no `-Tail`/`-Last` equivalent, so it reads the whole file. For recent events, filter with `findstr` and page the result:" },
  { code: [
    `findstr /I "update started" content_log.txt | more`,
  ] },
  { ul: [
    "`/I` ignores case; add more terms with `findstr /I \"started errored\"` (space-separated terms are ORed).",
    "`| more` pages the output; `> out.txt` saves it instead.",
    "⚠ There is no built-in \"last 20 lines\". For the tail-then-filter pattern, use PowerShell `Get-Content -Tail` or Bash `tail` (see those sections).",
  ] },

  { h: "Safety habits" },
  { ul: [
    "**Look before you delete.** List with `dir` first and read it.",
    "**Dry-run a loop** by putting `echo` in front of the action: `for ... do @echo del \"%i\"` prints what it *would* delete without deleting. Remove `echo` to act.",
    "⚠ `del` and `rd /s /q` are permanent; there is no Recycle Bin from the command line and no undo.",
    "🔒 System folders and other users' files need an Administrator prompt.",
  ] },

  { h: "Worked example: delete matching files, dry-run first" },
  { p: "Find every `.tmp` under the current folder and preview the deletes. The `@echo` makes it a dry run:" },
  { code: [
    `for /f "delims=" %i in ('dir /b /s *.tmp') do @echo del "%i"`,
  ] },
  { p: "Read the printed list. Only when you trust it, drop the `echo` to actually delete. This cannot be undone:" },
  { code: [
    `for /f "delims=" %i in ('dir /b /s *.tmp') do @del "%i"`,
  ] },
  { ul: [
    "`dir /b /s *.tmp` lists bare, recursive full paths; `for /f` feeds each to the action.",
    "⚠ The second line is permanent. The `@echo` dry run is the whole safety habit; always run it first.",
  ] },
] };
