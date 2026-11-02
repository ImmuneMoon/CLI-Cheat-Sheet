// A prose "article" section (kind: 'article') mirroring the PowerShell tutorial
// for Bash. Same block shapes: { h } { p } { ul } { code }.
// Prose uses double-quoted strings (escape " and \); code uses backtick
// template literals (escape \ as \\).

module.exports = { title: 'Building Bash One-Liners', kind: 'article', blocks: [
  { p: "Bash (Linux, macOS, WSL, and Git Bash on Windows) builds one-liners by piping small text tools together. Same idea as the PowerShell section, different pieces: Bash pipes **plain text**, not objects. The reference tables above hold the individual commands; this is about assembling them." },

  { h: "Building blocks" },
  { ul: [
    "`name=value` sets a variable, with **no spaces** around `=`. Read it as `$name` or `${name}`. `files=$(ls)` captures a command's output into one.",
    "`|` pipes the text output of the command on the left into the command on the right.",
    "`$(command)` substitutes a command's output inline; `$(( ))` does arithmetic.",
    "`;` runs commands in order; `&&` runs the next only if the previous succeeded; `||` only if it failed. See **Chain commands**.",
    "`for f in *.log; do ...; done` loops over items; `{ ...; }` groups commands.",
    "`>` redirects output, `>>` appends, `2>` redirects errors, `> /dev/null` throws output away. See **Redirection and Piping**.",
  ] },

  { h: "Quoting and globbing" },
  { ul: [
    "Single quotes `'...'` are literal; double quotes `\"...\"` expand `$variables` and `$(...)`.",
    "The shell expands `*`, `?` and `[abc]` into matching filenames **before** the command runs. Quote the pattern (`'*.log'`) when the command itself should see it, as with `find` and `grep`.",
    "Always quote a variable that may contain spaces: `\"$file\"` survives a name like `My File.txt`; bare `$file` would split into two arguments.",
  ] },

  { h: "Filtering and shaping text" },
  { p: "Bash pipes plain text, so you compose small filters. Each has a reference row; reach for:" },
  { ul: [
    "`grep 'pattern'` keeps matching lines; `grep -E 'a|b'` for regex OR, `-i` ignore case, `-v` invert, `-r` recurse, `-c` count. See **Search text in files**.",
    "`cut -d, -f2` and `awk '{print $2}'` pull out columns. See **Extract columns / fields**.",
    "`sed 's/old/new/'` substitutes; `sort`, `uniq -c`, `head`, `tail`, `wc -l` round out the kit. See **Text Processing and Output**.",
    "`xargs` turns a list into arguments: `find . -name '*.tmp' | xargs rm`. Use `find -print0 | xargs -0` so names with spaces survive.",
  ] },

  { h: "Pattern: search the end of a log" },
  { p: "The Bash version of the PowerShell log-search pattern. Same shape, different tools:" },
  { code: [
    `tail -n <lines to read> '<path to log>' | grep -E '<pattern>|<other pattern>' | tail -n <matches to show>`,
  ] },
  { p: "A real example:" },
  { code: [
    `tail -n 20000 ~/.steam/steam/logs/content_log.txt | grep -E 'update started|Validation: read' | tail -n 20`,
  ] },
  { ul: [
    "`tail -n 20000 file` reads only the last 20,000 lines, so a huge log stays fast.",
    "`grep -E 'a|b'` keeps lines matching a or b; `-E` turns on extended regex where `|` means OR. It is case-sensitive by default; add `-i` to ignore case.",
    "The final `tail -n 20` keeps the newest 20 matches, because logs are oldest-first.",
  ] },
  { p: "Variations:" },
  { ul: [
    "Surrounding lines: `grep -C 2 'error'` (two each side); `-A`/`-B` for after/before only.",
    "Plain text, no regex: `grep -F 'C:\\path (x86)'`.",
    "Exclude noise: `... | grep -v 'noise'`.",
    "Many files: `grep -rE 'error' /var/log/ | tail -n 20`.",
    "Count matches: `grep -c 'error' file`.",
    "Watch live: `tail -f file | grep --line-buffered 'error'`, then Ctrl+C to stop.",
  ] },
  { p: "Gotchas:" },
  { ul: [
    "`tail -n` counts lines and the final `tail` counts matched lines, so the two numbers are not interchangeable, exactly as with PowerShell's `-Tail` and `-Last`.",
    "macOS ships BSD `tail`, `grep` and `sed`; `grep -E` works everywhere but some GNU-only flags differ. See **macOS, zsh and WSL** in Notes.",
    "Reading a log is safe while the program writes; only `>` and `tee` change files, and `>` overwrites unless you use `>>` or `tee -a`.",
  ] },

  { h: "Safety habits" },
  { ul: [
    "**Look before you delete.** List first with `ls` or `find ... -print`, read it, then act.",
    "⚠ **`rm` is permanent.** There is no Trash on the command line. `rm -i` prompts per file; `rm -rf` asks nothing and cannot be undone.",
    "**Preview, then apply.** Run a `find` without `-delete`, or a `sed` without `-i`, first and read the output.",
    "🔒 System paths, other users' files, and most of `/etc` need `sudo`. See **Run as admin / root**.",
  ] },

  { h: "Worked example: delete old logs safely" },
  { p: "Grow a cleanup one-liner, previewing at every stage. First, just list what matches:" },
  { code: [
    `find /var/log -name '*.log' -mtime +30`,
  ] },
  { p: "Read the list, then total its size before committing:" },
  { code: [
    `find /var/log -name '*.log' -mtime +30 -print0 | du -ch --files0-from=- | tail -1`,
  ] },
  { p: "Only once you trust the list, add the delete. This cannot be undone:" },
  { code: [
    `find /var/log -name '*.log' -mtime +30 -delete`,
  ] },
  { ul: [
    "`-mtime +30` matches files modified more than 30 days ago; `-print0` with `--files0-from=-` handles names containing spaces.",
    "⚠ `-delete` is permanent. Running the `find` without it first, and reading the list, is the whole safety habit.",
  ] },
] };
