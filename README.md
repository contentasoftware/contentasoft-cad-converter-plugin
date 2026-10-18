# 3D CAD Converter plugin

Use **3D CAD Converter** from your AI agent on your Windows PC: converting STEP, IGES, STL, OBJ, FBX, glTF, 3MF and other 3D/CAD files. You ask in plain words and the
agent does the work on files on your computer. It works with any agent that runs local MCP servers: Cursor,
Claude Code, Codex, VS Code, Windsurf and others.

## Ask your agent

- "Convert this STEP file to 3MF for my slicer."
- "How big is this STEP part, and what unit was it drawn in?"
- "Turn this assembly into a GLB file I can show a customer in a web browser."

3D CAD Converter also works without an agent: open it from the Start menu and work in its own window.

## Price and trial

- $179, a one-time purchase. No subscription needed. Prices: https://www.contenta-software.com/3dcadconverter/buy.php
- The free trial gives 10 conversions at full quality within 30 days of the first launch; after that STEP/IGES/BREP are meshed at draft quality and every export carries a trial note. Nothing stops working; a licence removes the limits.

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

- **MCP server** `cad-converter` with the tools `convert_cad`, `detect_format`, `get_file_info`, `list_formats`. Each tool
  says whether it only reads files, writes new files, may overwrite files, or uses the internet.
- **Skill** `contenta-cad`: how and when the agent should use those tools and the `cadconvert` command line.

## For developers

- Windows 10 and 11, 64-bit only. There is no macOS or Linux version.
- `cadconvert` never waits for input or shows a dialog, so it runs unattended from Task Scheduler or a script.
  To convert each new file saved to a folder while you are signed in, start `watch` at logon; it runs until you sign out or close its window:

  ```
  schtasks /create /tn "3D CAD Converter watch" /sc onlogon /tr "cadconvert watch D:\Parts D:\Meshes -f 3mf --quality fine"
  ```
- `info`, `formats`, `convert` and `batch` take `--json` and print exactly one object, with `success` and, when there is something to report, `warning` and `notes`. An error is `{"success":false,"error":"...","exitCode":N}`. Piped text output is plain ASCII.
- Exit codes: 0 done · 1 error or cancelled · 2 invalid arguments or not a 3D file · 3 file not found · 4 conversion failed (in a batch the other files are still written).
- The full command reference is the skill: `skills/contenta-cad/SKILL.md`.

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
- The skill may only run the app's own command-line tool (`allowed-tools: Bash(cadconvert:*)`).

## License

This plugin and the launcher are MIT-licensed (see LICENSE). 3D CAD Converter itself is commercial software by
ContentaSoft AB.
