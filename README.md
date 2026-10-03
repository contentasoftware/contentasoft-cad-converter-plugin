# 3D CAD Converter plugin

Use **3D CAD Converter** from your AI agent on your Windows PC: converting STEP, IGES, STL, OBJ, FBX, glTF, 3MF and other 3D/CAD files. The agent calls the app's tools
on files on your computer; nothing is uploaded to the model provider or to ContentaSoft to do the work. It works
with any agent that runs local MCP servers: Cursor, Claude Code, Codex, VS Code, Windsurf and others.

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

## What runs and what is sent

- As a Claude plugin it runs `server/launch.cmd` from the plugin folder, which looks for `cadconvert.exe` in the app's
  install folder (`%LOCALAPPDATA%\Programs\CadConverter`), on your `PATH` or in `Program Files`, and runs
  `cadconvert serve`. Nothing is downloaded. If the app is missing, the bundled Node launcher (`server/index.js`, the same
  bytes as the npm package `@contentasoft/cad-converter-mcp`, MIT, no dependencies; source: https://github.com/contentasoftware/mcp-launcher)
  or, without Node.js, the Windows PowerShell stub `server/stub.ps1` serves one tool, `get_started`. Neither sends
  anything over the network.
- The skill may only run the app's own command-line tool (`allowed-tools: Bash(cadconvert:*)`).
- The app processes local files only. It sends anonymous usage telemetry (which tools ran, which MCP client
  connected, trial state) to ContentaSoft; turn it off in the app's settings. Privacy policy: https://www.contenta-software.com/3dcadconverter/privacy.php
- The free trial gives 10 conversions at full quality within 30 days of the first launch; after that STEP/IGES/BREP are meshed at draft quality and every export carries a trial note. Nothing is blocked. Nothing stops working; a licence removes the limits.

## License

This plugin and the launcher are MIT-licensed (see LICENSE). 3D CAD Converter itself is commercial software by
ContentaSoft AB.
