# 3D CAD Converter plugin

Use **3D CAD Converter** from your AI agent on your Windows PC: converting STEP, IGES, STL, OBJ, FBX, glTF, 3MF and other 3D/CAD files. The agent calls the app's tools
on files on your computer; nothing is uploaded to the model provider or to ContentaSoft to do the work. It works
with any agent that runs local MCP servers: Cursor, Claude Code, Codex, VS Code, Windsurf and others.

## Install

- **Cursor and other MCP clients** (`mcpServers` JSON): add
  `"cad-converter": { "command": "npx", "args": ["-y", "@contentasoft/cad-converter-mcp"] }`. Or install it from
  cursor.directory.
- **Claude Code / Cowork**: install this repository as a plugin. It runs the bundled launcher in `server/`.
- More clients and options: https://www.npmjs.com/package/@contentasoft/cad-converter-mcp

## What you need

- Windows 10 or 11 with **3D CAD Converter** installed. It has a free trial: https://www.contenta-software.com/3dcadconverter/download.php
  (if it is not installed yet, the `get_started` tool gives the agent the download link and the steps).
- Node.js 18 or later, which runs the small launcher (MIT, no dependencies; the npm package `@contentasoft/cad-converter-mcp`,
  also bundled here as `server/index.js`; source: https://github.com/contentasoftware/mcp-launcher). The
  launcher starts the app's own MCP server (`cadconvert serve`) and passes its messages through; it sends nothing
  over the network itself.
- An agent that runs on that computer. Browser chat apps cannot start local programs, so they cannot use these
  tools.

## What is included

- **MCP server** `cad-converter` with the tools `convert_cad`, `detect_format`, `get_file_info`, `list_formats`. Each tool
  says whether it only reads files, writes new files, may overwrite files, or uses the internet.
- **Skill** `contenta-cad`: how and when the agent should use those tools.

## What runs and what is sent

- As a Claude plugin it runs `node server/index.js` from the plugin folder, so nothing is downloaded; through
  `npx` the same launcher comes from npm. The launcher looks for
  `cadconvert.exe` in the app's install folder (`%LOCALAPPDATA%\Programs\CadConverter`), on your `PATH`
  or in `Program Files`, and runs `cadconvert serve`. If the app is missing it serves one tool, `get_started`.
- The skill may only run the app's own command-line tool (`allowed-tools: Bash(cadconvert:*)`).
- The app processes local files only. It sends anonymous usage telemetry (which tools ran, which MCP client
  connected, trial state) to ContentaSoft; turn it off in the app's settings. Privacy policy: https://www.contenta-software.com/3dcadconverter/privacy.php
- During the trial some outputs carry a watermark or other limits; the tool results say so and link to the
  license.

## License

This plugin and the launcher are MIT-licensed (see LICENSE). 3D CAD Converter itself is commercial software by
ContentaSoft AB.
