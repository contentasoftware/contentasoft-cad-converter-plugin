# 3D CAD Converter plugin

**Windows 10/11 only.** There is no Mac or Linux version: on a Mac or Linux machine the plugin installs, but its
server cannot start.

Use **3D CAD Converter** from your AI agent on your Windows PC: converting STEP, IGES, STL, OBJ, FBX, glTF, 3MF and other 3D/CAD files. You ask in plain words and the
agent does the work on files on your computer. It works with any agent that runs local MCP servers: Cursor,
Claude Code, Codex, VS Code, Windsurf and others.

For engineers and machine shops: turn STEP and IGES parts into GLB previews and 3MF, STL or STEP deliverables for your customers, a whole folder at a time. Parts come out at their true size. Conversion runs on this PC: your files are not uploaded, and converting needs no internet connection.

## Ask your agent

- "Convert every STEP file in this folder to GLB so my customer can view the parts in a browser."
- "What are the overall dimensions of this STEP assembly, in millimetres?"
- "Convert these IGES files from our supplier to STEP."

3D CAD Converter also works without an agent: open it from the Start menu and work in its own window.

## Price and trial

- $179, a one-time purchase. No subscription needed. Prices: https://www.contenta-software.com/3dcadconverter/buy.php
- The free trial has no end date: the first 10 conversions per PC come out at full quality (plus a newsletter bonus); after that STEP/IGES/BREP to a mesh is meshed at draft quality and every export carries a trial note. `cadconvert status` shows how many full-quality conversions are left. Nothing stops working; a licence removes the limits.
- After buying, the licence key arrives by email. Enter it in 3D CAD Converter's Register page, or run
  `cadconvert register <email> <key>` in a terminal. The key does not need to go through the chat.

## Formats

- Reads STEP (.step, .stp), IGES (.iges, .igs), BREP, STL, OBJ, PLY, 3MF, glTF and GLB, FBX, Collada (.dae), VRML (.wrl, .vrml, .wrz), X3D, OFF, AMF, DXF, DWG, USD and USDZ.
- Writes STEP, IGES, BREP, STL, OBJ, PLY, 3MF, glTF, GLB, FBX, Collada, VRML, X3D and OFF.
- SolidWorks (.sldprt, .sldasm), Fusion (.f3d), Inventor (.ipt, .iam), Creo (.prt), CATIA (.CATPart), Parasolid (.x_t) and ACIS (.sat) files do not open directly. Export the part or assembly as STEP from your CAD program, then convert the STEP file.

## Install

**Claude Code** (Windows): two commands, typed inside Claude Code. This repository is its own one-plugin
marketplace, named after the repository:

```
/plugin marketplace add contentasoftware/contentasoft-cad-converter-plugin
/plugin install contentasoft-cad-converter@contentasoft-cad-converter-plugin
```

From a terminal the same is `claude plugin marketplace add contentasoftware/contentasoft-cad-converter-plugin` and `claude plugin install contentasoft-cad-converter@contentasoft-cad-converter-plugin`.
Cowork and the Claude.ai directory: install **3D CAD Converter** from the directory once it is listed.

**Cursor, Claude Desktop, VS Code, Codex and other MCP clients** (`mcpServers` JSON):
`"cad-converter": { "command": "cmd", "args": ["/c", "npx", "-y", "@contentasoft/cad-converter-mcp"] }` (needs Node.js 18+), or,
once the app is installed, `"cad-converter": { "command": "cadconvert", "args": ["serve"] }` with no Node.js at all.
Client-by-client instructions: https://www.npmjs.com/package/@contentasoft/cad-converter-mcp

## What you need

- Windows 10 or 11 with **3D CAD Converter** installed. It has a free trial: https://www.contenta-software.com/3dcadconverter/download.php
  (if it is not installed yet, the `get_started` tool gives the agent the download link and the steps).
- Nothing else for the Claude Code plugin: its launcher is a Windows batch file (`server/launch.cmd`) that starts the
  app's own MCP server. Node.js is not required; only the `npx` route for other clients needs it.
- An agent that runs on that computer. Browser chat apps cannot start local programs, so they cannot use these
  tools.

## What is included

- **MCP server** `cad-converter` with the tools `convert_cad`, `detect_format`, `get_file_info`, `list_formats`, `get_license_status`. Each tool
  says whether it only reads files, writes new files, may overwrite files, or uses the internet.
- **Skill** `contenta-cad`: how and when the agent should use those tools and the `cadconvert` command line.

## For developers

- Windows 10 and 11, 64-bit only. There is no macOS or Linux version.
- `cadconvert` never waits for input or shows a dialog, so it runs unattended from Task Scheduler or a script.
  To convert each new file saved to a folder while you are signed in, start `watch` at logon; it runs until you sign out or close its window:

  ```
  schtasks /create /tn "3D CAD Converter watch" /sc onlogon /tr "cadconvert watch D:\Parts -o D:\Meshes --format 3mf --quality fine"
  ```
- Every command takes `--json` and prints one JSON object on stdout (logs go to stderr): `success`, `exitCode`, `error`, `warnings`, `errors` and `outputs`, plus the trial fields when they apply. Add `--progress` for one `{"type":"progress",...}` line per finished file before that object.
- Exit codes: 0 done · 1 unexpected error · 2 invalid arguments · 3 input not found or unreadable · 4 some items failed (the others are written) · 5 nothing succeeded · 6 the licence or trial refused the run · 130 cancelled. The four ContentaSoft command lines share this table.
- The skill (`skills/contenta-cad/SKILL.md`) tells the agent which commands to use.

## Full CLI and MCP reference

Every `cadconvert` command, option and exit code, the JSON output and every MCP tool with its parameters:

- Command line: https://github.com/brunojanvier77/ContentaSoft/blob/main/cad-converter/cli.md
- MCP server: https://github.com/brunojanvier77/ContentaSoft/blob/main/cad-converter/mcp-server.md

## Privacy

- Files are converted on this PC. They are not uploaded, and converting needs no internet connection.
- The app sends usage statistics (which tools ran, which MCP client connected, trial state) and crash reports to
  ContentaSoft, tagged with a hashed machine ID. They never contain your files; a crash report can contain a file
  name, but folder paths are removed. To turn them off, open the app and
  go to Settings, Privacy: Send usage statistics and crash reports. The same switch covers the command line and the
  MCP server. On a PC where nobody opens the app, set `"AllowUsageMetrics": false` in `%APPDATA%\CadConverter\settings.json`.
- Privacy policy, with the full list of what is sent: https://www.contenta-software.com/3dcadconverter/privacy.php

## What runs

- As a Claude plugin it runs `server/launch.cmd` from the plugin folder, which looks for `cadconvert.exe` in the app's
  install folder (`%LOCALAPPDATA%\Programs\CadConverter`), on your `PATH` or in `Program Files`, and runs
  `cadconvert serve`. Nothing is downloaded. If the app is missing, the bundled Node launcher (`server/index.js`, the same
  bytes as the npm package `@contentasoft/cad-converter-mcp`, MIT, no dependencies; source: https://github.com/contentasoftware/mcp-launcher)
  or, without Node.js, the Windows PowerShell stub `server/stub.ps1` serves one tool, `get_started`. Neither sends
  anything over the network.
- While Claude Code uses the skill, it can use the plugin's MCP tools and run the app's own command-line tool in Bash or
  PowerShell without asking (`allowed-tools: Bash(cadconvert *) PowerShell(cadconvert *) Bash(cadconvert.exe *) PowerShell(cadconvert.exe *) mcp__plugin_contentasoft-cad-converter_cad-converter`). That permission ends when you send your next message.
  Other commands follow your own Claude Code permission settings.

## License

This plugin and the launcher are MIT-licensed (see LICENSE). 3D CAD Converter itself is commercial software by
ContentaSoft AB.
