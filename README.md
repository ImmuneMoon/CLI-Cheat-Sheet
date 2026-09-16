# CLI Cheat Sheet

Windows CMD, PowerShell and Bash (Linux and macOS) commands side by side, plus Git and a developer setup guide. Every row shows the same task in all three shells, with the flags explained and the gotchas called out.

**Read it online:** [immunemoon.github.io/CLI-Cheat-Sheet](https://immunemoon.github.io/CLI-Cheat-Sheet/CLI-Cheat-Sheet.html)

## Get the sheet

| Format | File | Best for |
|---|---|---|
| Markdown | [CLI-Cheat-Sheet.md](CLI-Cheat-Sheet.md) | Reading right here on GitHub. |
| HTML | [CLI-Cheat-Sheet.html](CLI-Cheat-Sheet.html) | Browsing and searching. Filter box (press `/`), section links, show or hide each shell's column, click any command to copy it, dark mode. Works offline, single file. |
| PDF | [CLI-Cheat-Sheet.pdf](CLI-Cheat-Sheet.pdf) | Printing. US Letter, landscape. |
| Word | [CLI-Cheat-Sheet.docx](CLI-Cheat-Sheet.docx) | Editing in Word or Google Docs. |

## What is covered

- Everyday essentials: the fifteen tasks most people reach for, in one short table at the top. The same rows are starred (★) in their full sections.
- File and directory management
- Disk and storage
- Windows repair: SFC, DISM, CHKDSK, System Restore, recovery boot
- System and user information
- Processes, services and power
- Networking and diagnostics
- Environment, history and shell basics
- Text processing and output
- Redirection and piping
- Users and groups
- Package management
- Developer setup, by operating system: WSL, package managers, Git, GitHub CLI, SSH keys, Node.js, Python, VS Code, PowerShell 7, build tools, Docker
- Git: setup, commits, branches, remotes, undo, stash, tags, search
- Docker: containers, images, logs, build, push, volumes, Compose
- Keyboard shortcuts
- Notes and gotchas: paths, quoting, wildcards, how PowerShell differs, macOS, zsh and WSL, Git on Windows

Markers used throughout:

- 🔒 needs administrator, root or sudo
- ⚠ destructive; check before running
- *(Linux)* or *(macOS)* marks a command that exists only on that platform
- *(alias: x)* names a shorter alias for the same command

## Editing the sheet

All four files are generated from one data file, `src/content.js`. Edit the rows there, then rebuild. Do not edit the Markdown, DOCX, HTML or PDF by hand or the next build will overwrite your changes.

Each row is:

```js
['Task name',
 ['cmd command', 'cmd command (annotation)'],        // CMD column
 ['PowerShell command (alias: x)'],                  // PowerShell column
 ['bash command (Linux)'],                           // Bash column
 'Free-text note for the Notes column, or an empty string.'],
```

A trailing `(...)` on a command is rendered as a grey italic annotation. A line that is entirely `(...)` is rendered as a note with no code.

Two other section shapes exist: `kind: 'single'` for tools that are identical in every shell (Git), with rows of `[task, [commands], note]`, and `kind: 'platform'` for things that differ by operating system (Developer Setup), with rows of `[task, [windows], [macos], [linux], note]`.

Notes in the Notes and Gotchas section carry tags (`cmd`, `ps`, `bash`, or a single-column section such as `git`) so the HTML can hide the ones that do not apply to the shells currently shown. A whole group takes one tag list; a single bullet can narrow it with `[text, tags]`.

Rows are ordered by workflow within each section (set up, then use, then undo), with rarely used or destructive commands last. The `essentials` list at the bottom of the data file names the rows that appear in the Everyday Essentials table and get a star; it refers to rows by section title and task name, so renaming a task means updating it there too (`npm test` will tell you).

## Building

Requires Node.js 18 or newer. The PDF step also needs Microsoft Edge or Google Chrome installed (it prints the HTML headlessly).

```bash
npm install
npm run build
```

`npm run build` first runs `npm test`, which checks the data file for malformed rows, duplicate task names and suspicious annotations, then builds all four outputs. Individual targets: `npm run build:md`, `npm run build:docx`, `npm run build:html`, `npm run build:pdf`. If the PDF step cannot find a browser, set `BROWSER_BIN` to the browser executable.

Old builds live in `legacy/`, which is ignored by git along with `old/` and `archive/`.

### Who commits the built files

**The GitHub Actions workflow does, not you.** `.github/workflows/build.yml` runs the checks and rebuilds all four outputs whenever `src/` changes on `main`, then commits the results back with a "Rebuild cheat sheet outputs" commit. On pull requests it runs the checks and build without committing.

The everyday flow is therefore:

1. Edit `src/content.js`.
2. Run `npm test`. Optionally run `npm run build` and open the results to check them.
3. Commit **only** your source changes (`src/`, `README.md`, and so on). If you built locally, discard the regenerated outputs first with `npm run restore`.
4. Push. A minute later the workflow commits the rebuilt DOCX, HTML, Markdown and PDF, and the GitHub Pages site updates.
5. Pull before your next change so you have the bot's commit.

Committing the built files yourself works, but if the workflow also rebuilds them you get a merge conflict on the DOCX and PDF, because git cannot merge binaries. If that happens, keep whichever side was built from the newer source (usually yours), then push and let the workflow rebuild on top:

```bash
git checkout --ours CLI-Cheat-Sheet.docx CLI-Cheat-Sheet.pdf
git add CLI-Cheat-Sheet.docx CLI-Cheat-Sheet.pdf
git commit
```

## Contributing

Spotted a wrong flag or a missing command? Open an issue, or edit `src/content.js`, run `npm test`, and send a pull request. Keep the data file changes and leave the generated files alone; the workflow rebuilds them after merge.

## Publishing with GitHub Pages

The repo is laid out so Pages can serve it straight from the root of the main branch. `index.html` redirects to `CLI-Cheat-Sheet.html`, and `.nojekyll` tells GitHub to publish the files as they are.

1. Push the repo to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then pick `main` and `/ (root)`. Save.
4. After a minute or two the sheet is live at `https://<user>.github.io/<repo>/`. The PDF and DOCX are downloadable from the same address, for example `https://<user>.github.io/<repo>/CLI-Cheat-Sheet.pdf`.

Every push that includes rebuilt output files updates the site.

## License

MIT. See [LICENSE](LICENSE). Use it, copy it, adapt it, share it; just keep the copyright notice.

## ☕ Support the Project

If you find this project helpful and want to support further development by Fulllion Creative Works, consider leaving a tip!

* [Donate via PayPal](https://www.paypal.com/donate/?hosted_button_id=LCDZX75HR4CLC)
* [Support on Ko-fi](https://ko-fi.com/fulllion)

---
© 2026 Fulllion Creative Works. Released under the MIT License.
