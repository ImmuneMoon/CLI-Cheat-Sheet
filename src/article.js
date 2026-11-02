// A prose "article" section for content.js (kind: 'article').
// Blocks: { h } subheading, { p } paragraph, { ul } bullet list, { code } code block.
// In p and ul text, `backticks` render as inline code and **double asterisks** as bold.
// Prose uses double-quoted strings (apostrophes and backticks are free; escape " and \).
// Code lines use backtick template literals (only \ needs escaping as \\).

module.exports = { title: 'Building PowerShell One-Liners', kind: 'article', blocks: [
  { p: "Windows gives you two shells that look almost identical but obey different rules: **Command Prompt** (`cmd.exe`) and **Windows PowerShell** 5.1. This section is about reading a one-liner, understanding each piece, and assembling your own, rather than copying blindly. The worked examples at the end are real commands broken down part by part." },

  { h: "1. Which shell am I in?" },
  { p: "Look at the prompt. `PS C:\\Users\\you>` is PowerShell; `C:\\Users\\you>` with no `PS` in front is Command Prompt. They share many names (`cd`, `dir`, `cls`) but the syntax underneath differs, so a line that works in one can fail in the other." },
  { ul: [
    "Open PowerShell: Start menu, type **PowerShell**. Open Command Prompt: type **cmd**.",
    "Open either as administrator: right-click it and choose **Run as administrator**, or press Ctrl+Shift+Enter when launching it from the Start menu. The title bar then reads \"Administrator\".",
    "Hop between them: type `powershell` to enter PowerShell, or `cmd` to drop into Command Prompt. Type `exit` to go back.",
    "Run one Command Prompt command from PowerShell with `cmd /c \"...\"` (used in example E).",
  ] },
  { p: "Rule of thumb: if a line uses `$variables`, pipes `|` into a cmdlet, or has `{ }` blocks, it is PowerShell. If it uses slash flags like `/S /Q`, it is Command Prompt style." },

  { h: "2. PowerShell building blocks" },
  { ul: [
    "`$name = value` stores a value. `$log = 'C:\\...\\out.txt'` holds a path you reuse later in the same line.",
    "`|` (the pipeline) sends each object from the command on the left to the command on the right. See **Redirection and Piping** for the table.",
    "`ForEach-Object { ... }` runs the block once per piped object; inside it `$_` is the current object, and `$_.Name` reads that object's Name property.",
    "`foreach ($x in $list) { ... }` is the loop form for when you already have a list, rather than a pipeline (example B).",
    "`;` runs several commands in order on one line, left to right. See **Chain commands** under Environment, History and Shell Basics.",
    "`{ ... }` is a script block: code passed around as a single unit, such as the body of ForEach-Object.",
    "`| Out-Null` throws output away when you only want the side effect. See **Suppress output**.",
  ] },

  { h: "3. Quoting, and the $ trap" },
  { ul: [
    "Single quotes `'...'` are literal: nothing inside is interpreted.",
    "Double quotes `\"...\"` expand variables. `\"$($_.Name)\"` runs the expression `$($_.Name)` and drops the result into the string; the `$( )` tells PowerShell to evaluate the property instead of printing the whole object.",
    "⚠ A `$` in a path must be inside single quotes. In double quotes or unquoted, PowerShell treats `$RECYCLE` as a variable, which is empty.",
  ] },
  { p: "That last point bites in a real way. Unquoted, this path collapses:" },
  { code: [
    `E:\\$RECYCLE.BIN\\   ->   E:\\.BIN\\     (wrong: $RECYCLE read as an empty variable)`,
    `'E:\\$RECYCLE.BIN'                       (right: single quotes keep the $ literal)`,
  ] },

  { h: "4. Aliases that lie: Command Prompt habits that break in PowerShell" },
  { p: "PowerShell defines `dir`, `del` and `rmdir` as aliases, but they point to cmdlets with different switches, so the Command Prompt flags fail." },
  { ul: [
    "`rmdir /S /Q folder` works in Command Prompt. In PowerShell `rmdir` is `Remove-Item`, which has no `/S /Q` and errors. The PowerShell form is `Remove-Item folder -Recurse -Force`.",
    "`dir` is `Get-ChildItem`; the Command Prompt hidden-files switch `dir /A` is `Get-ChildItem -Force`.",
    "`del` is `Remove-Item`; `del /Q` does nothing useful, use `-Force`.",
    "To deliberately use the Command Prompt version from PowerShell, wrap it: `cmd /c \"rmdir /s /q folder\"`.",
  ] },
  { p: "The full alias list is in **Notes and Gotchas**, under \"PowerShell is different\"." },

  { h: "5. Robocopy as a read-only inspector" },
  { p: "Robocopy is a copy tool, but with `/L` it copies nothing and only reports what it would do. That makes it a fast way to list or size folders, including protected ones a normal account cannot read. ⚠ Without `/L` it really copies, so always include `/L` when you are only inspecting." },
  { ul: [
    "`/L` list only: report, do not copy. The safety flag.",
    "`/E` include all subfolders, even empty ones.",
    "`/B` backup mode: read files the normal account cannot. 🔒 Needs administrator.",
    "`/BYTES` show sizes in bytes instead of rounded units.",
    "`/TS` add timestamps and `/FP` full paths to the listing.",
    "`/NC` no class, `/NDL` no directory list, `/NJH` no job header, `/NJS` no job summary, `/NFL` no file list: trim the output down to the lines you want.",
    "`/R:0` do not retry failed files and `/W:0` wait zero seconds: fail fast rather than hang on locked files.",
    "`/UNILOG:file` write a Unicode log to that file (paired with `$log` in example A).",
  ] },
  { p: "Robocopy's exit codes are unusual: 0 means nothing to do, 1 means files were (or would be) copied, and anything below 8 is success. 8 or higher is a real error. So a non-zero exit from robocopy is normal, not a failure." },

  { h: "6. Filtering and shaping output" },
  { p: "These cmdlets chain after a `|` to cut a firehose down to what you want. Each already has a reference row; here is when to reach for which." },
  { ul: [
    "`Select-String 'pattern'` keeps only matching lines, like grep. Example B uses `Select-String 'Files :|Bytes :'` to keep just the summary lines. See **Search text in files**.",
    "`Where-Object { $_.X -gt 1 }` keeps objects that match a condition. See **Filter a stream**.",
    "`Select-Object A,B` picks columns; `Select-Object -First 10` takes the first rows.",
    "`Sort-Object Size -Descending` orders objects.",
    "`Format-Table -AutoSize` lays the result out as aligned columns (example C). Put it last; it is for display only. See **Shape and export output**.",
  ] },

  { h: "7. Reading system and disk info" },
  { ul: [
    "`Get-PhysicalDisk` lists the physical drives; pipe each into `Get-StorageReliabilityCounter` for temperature, read and write error counts, and power-on hours (example A).",
    "`Get-CimInstance Win32_LogicalDisk` lists volumes with size and free space (example C). Also in **Disk and Storage**.",
    "`vssadmin list shadowstorage` shows the space used by Volume Shadow Copies and restore points. 🔒 Needs administrator.",
    "`icacls path` shows or changes the Windows permissions on a file or folder. See **File permissions**.",
  ] },

  { h: "8. Safety habits" },
  { ul: [
    "**Look before you delete.** List the target first with `robocopy ... /L`, `dir`, or `Get-ChildItem`, and read it.",
    "**Preview, then apply.** Good scripts take a switch so the plain run only reports and a second run acts (example D).",
    "**Know what needs admin.** `/B`, `vssadmin`, and changing permissions or services all need an Administrator window (🔒).",
    "⚠ **Some actions cannot be undone.** `Remove-Item -Recurse -Force`, `rd /s /q`, `del`, and formatting all bypass the Recycle Bin. There is no undo. Example E is shown to read, not to run.",
  ] },

  { h: "Worked example: build example A step by step" },
  { p: "Example A saves a file listing, then prints drive health. Grow it in stages." },
  { p: "Start by listing a folder without copying anything:" },
  { code: [
    `robocopy 'E:\\found.000' 'C:\\robocopy_list_only' /L /E`,
  ] },
  { p: "Trim the output, fail fast on locked files, and send it to a log held in a variable:" },
  { code: [
    `$log = 'C:\\Users\\randu\\AppData\\Local\\Temp\\found_E_listing.txt'`,
    `robocopy 'E:\\found.000' 'C:\\robocopy_list_only' /L /E /B /BYTES /TS /FP /NC /NDL /NJH /NJS /R:0 /W:0 /UNILOG:$log | Out-Null`,
  ] },
  { p: "The `| Out-Null` hides robocopy's console chatter because you only want the log file. Now add the drive-health read after a `;`:" },
  { code: [
    `Get-PhysicalDisk | ForEach-Object { $c = $_ | Get-StorageReliabilityCounter; "$($_.DeviceId) $($_.FriendlyName) temp=$($c.Temperature) readErrors=$($c.ReadErrorsUncorrected) writeErrors=$($c.WriteErrorsUncorrected) hours=$($c.PowerOnHours)" }`,
  ] },
  { p: "For each physical disk, `$c` holds its reliability counters, and the double-quoted string pulls named fields out with `$( )`. Join the two halves with `;` and end with `'done'`, and that is the whole of example A." },

  { h: "More worked examples" },
  { p: "**B. Size several protected folders.** A `foreach` loop runs robocopy on each path and keeps only the summary lines:" },
  { code: [
    `foreach ($p in 'E:\\found.000','E:\\System Volume Information','G:\\found.000') { $p; robocopy $p 'C:\\robocopy_list_only' /L /E /B /BYTES /NFL /NDL /NJH /R:0 /W:0 | Select-String 'Files :|Bytes :' }; vssadmin list shadowstorage /for=E:`,
  ] },
  { ul: [
    "`foreach ($p in a,b,c)` loops over the three paths; `$p;` prints the path as a header before its totals.",
    "`/NFL` (no file list) joins the trims from section 5, leaving just the totals; `Select-String 'Files :|Bytes :'` keeps those two lines.",
    "`/B` needs admin. `vssadmin list shadowstorage /for=E:` at the end reports shadow-copy usage on E:.",
  ] },
  { p: "**C. List drive sizes and free space as a clean table:**" },
  { code: [
    `Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID, VolumeName, @{n='SizeGB';e={[math]::Round($_.Size/1GB,1)}}, @{n='FreeGB';e={[math]::Round($_.FreeSpace/1GB,1)}} | Format-Table -AutoSize`,
  ] },
  { ul: [
    "`@{n='SizeGB';e={...}}` is a calculated column: `n` is its name, `e` is the expression. Here it turns bytes into GB with `[math]::Round(.../1GB,1)`.",
    "`Format-Table -AutoSize` aligns it. Change `1GB` to `1MB`, or the rounding `1` to `2`, to reshape it.",
  ] },
  { p: "**D. Run a script preview-then-apply.** Two runs of the same script:" },
  { code: [
    `powershell -ExecutionPolicy Bypass -File C:\\path\\to\\script.ps1`,
    `powershell -ExecutionPolicy Bypass -File C:\\path\\to\\script.ps1 -Apply`,
  ] },
  { ul: [
    "`-ExecutionPolicy Bypass` lets this one script run without permanently changing your machine's policy. See **Allow PowerShell scripts** in Notes.",
    "The first line has no `-Apply`, so a well-written script only previews. The second adds `-Apply` to make the changes. Preview, read it, then apply.",
  ] },
  { p: "**E. The same delete in each shell, shown for explanation only:**" },
  { code: [
    `Command Prompt:  rd /s /q "E:\\$RECYCLE.BIN"`,
    `PowerShell:      cmd /c 'rd /s /q "E:\\$RECYCLE.BIN"'`,
  ] },
  { ul: [
    "`rd /s /q` is Command Prompt: `/s` recurse, `/q` quiet. It permanently deletes the folder and everything under it.",
    "In PowerShell, `rd` would be `Remove-Item` and would mis-read `$RECYCLE`, so the line wraps the real Command Prompt call in `cmd /c '...'`, using single quotes to protect the `$`.",
    "⚠ This is permanent and cannot be undone. It is here to read, not to run.",
  ] },

  { h: "Pattern: search the end of a log" },
  { p: "A common need is to find recent events in a large log without reading the whole file. It composes the three cmdlets from section 6 into a reusable template:" },
  { code: [
    `Get-Content '<path to log>' -Tail <lines to read> | Select-String '<pattern>|<other pattern>' | Select-Object -Last <matches to show>`,
  ] },
  { p: "A real example, pulling the last few Steam content events:" },
  { code: [
    `Get-Content 'E:\\Program Files (x86)\\Steam\\logs\\content_log.txt' -Tail 20000 | Select-String 'update started|Validation: read' | Select-Object -Last 20`,
  ] },
  { p: "Built one stage at a time:" },
  { ul: [
    "`Get-Content 'file' -Tail 20000` reads only the last 20,000 lines, so a huge log stays fast. Pick a number big enough to reach back to when the event happened. Single quotes keep spaces and `$` in the path safe.",
    "`|` passes each line to the next command.",
    "`Select-String 'a|b'` keeps lines matching a or b. It is a regex, so `|` means OR, and it ignores case by default; add `-CaseSensitive` if case matters.",
    "`Select-Object -Last 20` keeps only the newest 20 matches, because logs are oldest-first. Without it you get every match.",
  ] },
  { p: "Useful variations:" },
  { ul: [
    "Show surrounding lines: `Select-String 'error' -Context 2,2` (two before, two after).",
    "Plain text instead of regex: `Select-String -SimpleMatch 'C:\\path (x86)'`.",
    "Exclude noise: `... | Where-Object { $_.Line -notmatch 'noise' }`.",
    "Text only, without the match formatting: `... | ForEach-Object { $_.Line }`.",
    "Search many files at once: `Select-String -Path 'C:\\logs\\*.log' -Pattern 'error' | Select-Object -Last 20`.",
    "Count matches rather than show them: `(Select-String -Path 'file' -Pattern 'error').Count`.",
    "Watch live: `Get-Content 'file' -Tail 20 -Wait | Select-String 'error'`, then Ctrl+C to stop.",
    "Save results: `... | Out-File results.txt`. ⚠ Out-File overwrites an existing file; add `-Append` to add to it instead.",
  ] },
  { p: "Gotchas:" },
  { ul: [
    "Regex special characters like `.` `(` `)` `[` `]` `\\` need escaping with a backslash, or use `-SimpleMatch` to match them literally.",
    "`-Tail` counts lines and `-Last` counts matches, so the two numbers are not interchangeable.",
    "This is PowerShell only. Command Prompt's nearest tool is `findstr`; the Bash equivalent is `tail -n 20000 file | grep -E 'a|b' | tail -n 20`.",
    "Reading a log is safe while the program is still writing to it; nothing here changes the file. Only `Out-File` writes, and it overwrites unless you add `-Append`.",
  ] },
] };
