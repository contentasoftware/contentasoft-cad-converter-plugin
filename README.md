# 3D CAD Converter for Claude

Use **3D CAD Converter** from Claude on your Windows PC: converting STEP, IGES, STL, OBJ, FBX, glTF, 3MF and other 3D/CAD files. Claude calls the app's tools on files on
your computer; nothing is uploaded to Anthropic or to ContentaSoft to do the work.

## What you need

- Windows 10 or 11 with **3D CAD Converter** installed. It has a free trial: https://www.contenta-software.com/3dcadconverter/download.php
  (if it is not installed yet, the plugin's `get_started` tool gives Claude the download link and the steps).
- Node.js 18 or later, which runs the small launcher in `server/index.js` (MIT, no dependencies, the same code
  as the npm package `@contentasoft/cad-converter-mcp`; source: https://github.com/contentasoftware/mcp-launcher). The launcher
  starts the app's own MCP server (`cadconvert serve`) and passes its messages through; it sends nothing over the
  network itself.
- Claude Code or Cowork on that computer. Chat on claude.ai cannot start local programs, so it does not load
  this plugin's tools.

## What is included

- **MCP server** `cad-converter` with the tools `convert_cad`, `detect_format`, `get_file_info`, `list_formats`. Each tool
  says whether it only reads files, writes new files, may overwrite files, or uses the internet.
- **Skill** `contenta-cad`: how and when Claude should use those tools.

## What runs and what is sent

- The plugin runs `node server/index.js` from the plugin folder; nothing is downloaded. The launcher looks for
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
