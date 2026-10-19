---
name: contenta-cad
description: Convert 3D CAD and mesh files with the 3D CAD Converter CLI (cadconvert). Use when the user asks to convert STEP, IGES or BREP to STL, OBJ, 3MF, glTF/GLB, FBX, PLY or other formats, convert between mesh formats (including USD/USDZ and VRML input), change units, control mesh quality for 3D printing, reduce the polygon count of a mesh, set the up axis for game engines, inspect a 3D file, or batch-convert or watch a folder of CAD files.
allowed-tools: Bash(cadconvert *) PowerShell(cadconvert *) Bash(cadconvert.exe *) PowerShell(cadconvert.exe *) mcp__plugin_contentasoft-cad-converter_cad-converter
---

# 3D CAD Converter

Use the `cadconvert` CLI (3D CAD Converter 1.0.33+, Windows). Default per-user install: `%LOCALAPPDATA%\Programs\CadConverter\cadconvert.exe`, on the user PATH. Check with `cadconvert --version` (it prints the build id after a `+`). Full reference: https://github.com/brunojanvier77/ContentaSoft/blob/main/cad-converter/cli.md

Every command accepts `--json` (one JSON object on stdout), `--plain`, `--quiet`, `-v/--verbose` and `--progress`. A conversion that writes several part files lists the extra ones in `additionalOutputs`; side files such as `.bin` or `.mtl` are not listed. When stdout is not a terminal (or with `--plain`) the text output is plain `Key: Value` lines and ASCII tables, and every number uses a `.` decimal point with no thousands separator.

## Running commands

- **MCP first:** when this app's MCP tools are connected (`convert_cad`, `get_file_info`, `list_formats` ...), use them for what they cover and the command line for the rest. They take paths and options as named fields, so there is no quoting or wildcard to get wrong. Give them full paths.
- **One command per call:** run one `cadconvert` command at a time, with no `cd`, `&&`, `;`, pipes, loops, variables or `$(...)`. Anything else on the line can stop the run to ask the user for approval, and the CLI already handles folders and reports its results (below).
- **Let the CLI do the folder work:** `cadconvert batch <folder> -o <output-folder>` converts every 3D file in the folder and its subfolders (`--include "*.step"` picks the files, `--skip-existing` makes a re-run do only what is missing), and both `batch` and `convert -o` create the output folder when it is missing.
- **Read the results, don't measure them:** every `--json` result lists the written files in `outputs`; `convert`, and each `files` row of a `batch`, add `outputBytes` and `durationMs`. No `stat`, `date` or `Get-Item` wrapper is needed. To see what is in a folder, use the agent's own file tools.

## Commands

```bash
cadconvert convert <input> -o <output> [-f <fmt>] [--quality P|N] [--angular RAD] [--up-axis y|z|unchanged] [--decimate R] [--units mm|cm|in|m|ft] [--repair] [--binary true|false] [--max-size MB]
cadconvert batch <dir> -o <outdir> [-f stl] [-r] [-w N] [--include "*.step"] [--exclude ...] [--report r.csv] [same conversion options]
cadconvert watch <dir> -o <outdir> [-f stl] [-w N] [same conversion options]     # runs until Ctrl+C
cadconvert info <file> --json
cadconvert formats [--input|--output]
cadconvert status --json                       # license block: trial or registered, conversions and days left
cadconvert register <email> <key>
```

- `-o` can be an existing folder (the file is named after the input).
- No `-o`: `convert` writes next to the input with the `-f` extension (then `-f` is required); `batch` and `watch` write to `<input>_converted` next to the input folder.
- `-f` on `convert` defaults to the output extension; `batch` and `watch` default to `stl`. A `-f` that contradicts the output extension exits 2 (leave `-f` out to take it from the extension).
- `batch` and `watch` are recursive by default (`-r false` for the folder itself only); `-w` defaults to the number of processors. `watch` writes a renamed copy rather than overwriting an existing output. `--overwrite` replaces existing outputs; `--skip-existing` leaves them alone, so a re-run converts only what is missing.
- `--profile file.json` starts from a profile saved by the desktop app; command-line options override it.

## Mesh quality (STEP/IGES/BREP sources only)

`--quality` takes a preset or a linear deflection in mm (e.g. `--quality 0.01`). `--angular` is in **radians** and defaults to the preset's value (0.5 with a numeric `--quality`).

| Preset | Linear | Angular |
|--------|--------|---------|
| draft | 1.0 | 5.0 |
| standard (default) | 0.1 | 0.5 |
| fine (smooth curves, 3D printing) | 0.01 | 0.1 |
| ultrafine | 0.001 | 0.05 |

Finer settings make much larger files: on a small test part, fine produced about 12x the triangles of standard. Mesh-to-mesh conversions ignore these options.

## Units

Sources that declare a unit are read at their true size, converted to mm, then written in `--units` (mm when left out):

- STEP, IGES: the file's unit. 3MF: `unit` attribute. glTF/GLB and VRML (`.wrl`, `.vrml`, `.wrz`): always metres (a 1 m VRML cube is 1000 mm). FBX: `UnitScaleFactor`. Collada: `<unit>` (metres when absent). USD/USDZ: `metersPerUnit` (centimetres when absent).
- BREP, STL, OBJ, PLY, OFF, X3D, AMF, DXF, DWG: no unit; the numbers are taken as mm. The CLI has no source-unit option.
- glTF, FBX and Collada outputs declare their unit and up axis; a glTF output opens at its true size in metres. VRML outputs declare their unit with a root `scale 0.001` (millimetre numbers, scaled to metres as the VRML specification requires).

## Up axis, repair, polygon reduction, size budget

- `--up-axis y` for game engines, glTF and three.js; `z` for CAD and 3D printing. It starts from the up axis the source declares (USD, Collada, FBX, glTF, VRML). A STEP/IGES/BREP re-export is not rotated (the CLI prints a note).
- `--repair` repairs STEP/IGES/BREP surfaces before meshing (broken edges and faces, small gaps). It has no effect on mesh sources (STL, OBJ, PLY ...).
- `--decimate 0.25` (or `25%`) keeps about a quarter of the triangles. Mesh sources only: STL, OBJ, PLY, glTF/GLB, FBX, 3MF, Collada, OFF, VRML, X3D, AMF, DXF. STEP/IGES/BREP are not reduced; lower their `--quality` instead (draft is lightest). DWG and USD are not reduced. Meshes over 2,000,000 triangles are written unreduced.
- `--max-size 5` (glTF/GLB only, MB): a file over it is written again with fewer triangles until it fits, down to 5% of its triangles. One that still does not fit is written at the smallest size and reported as over budget (exit 4).

## Formats

Write: stl, obj, ply, fbx, dae, 3mf, gltf, glb, wrl (vrml), x3d, off, step (.step/.stp), iges (.iges/.igs), brep.
Read only: amf, dwg, dxf, usd (.usd/.usda/.usdc, text or binary), usdz, and `.wrz` (gzipped VRML; `.wrl` and `.vrml` are read and written).

VRML input: VRML 2.0 and 1.0, read in metres and Y-up. Extrusion, line and point sets, Text, PROTO instances, textures, scripts and animation are not drawn (the message says so). Inline loads only relative local files; web, absolute and network addresses are refused with a warning.

BREP input means OpenCascade `.brep`/`.brp` only (not Parasolid `.x_t` or ACIS `.sat`). It has no unit, so it is read as mm, and it comes in as one merged solid without part names, colours or assembly tree.

Native CAD files do not open directly: SolidWorks (`.sldprt`, `.sldasm`), Fusion (`.f3d`), Inventor (`.ipt`, `.iam`), Creo (`.prt`), CATIA (`.CATPart`), Parasolid (`.x_t`) and ACIS (`.sat`). Ask the user to export the part or assembly as STEP from their CAD program, then convert the STEP file.

## Recipes

- **Previews and deliverables for customers:** GLB with `--up-axis y` for a browser viewer (one file, no side files; add `--max-size` for a web budget); 3MF or STL when the customer prints or machines from a mesh, with `--quality fine` from STEP/IGES so curves stay smooth; STEP when they need exact CAD geometry rather than a mesh, for example from a supplier's IGES. `batch` converts a whole folder: `cadconvert batch ./parts -o ./for-customer -f glb --up-axis y`. Run `cadconvert info` on one part first and tell the user its size in mm.
- **3D printing in a slicer (Bambu Studio, PrusaSlicer, OrcaSlicer, Cura):** convert to 3MF, which keeps the unit and colours, or to STL, which every slicer reads but which has no colour. From STEP/IGES use `--quality fine` so curves print smooth: `cadconvert convert part.step -o part.3mf --quality fine`. For a STEP or IGES source, run `cadconvert info` first and tell the user the size in mm, so a part in the wrong unit is caught before printing. STL, OBJ and PLY carry no unit; ask the user what unit the numbers are in.

## Examples

```bash
cadconvert convert model.step -o model.stl
cadconvert convert model.step -f glb
cadconvert convert model.step -o model_fine.stl --quality fine
cadconvert convert part.step -o part.stl --quality 0.01 --angular 0.1
cadconvert convert model.step -o model_y.glb --up-axis y
cadconvert convert model.step -o model_in.obj --units in --repair
cadconvert convert tower.glb -o tower.stl                  # glTF metres -> true size in mm
cadconvert convert tower_cm.fbx -o tower_fbx.stl           # Blender cm FBX -> mm
cadconvert convert scene.usdz -o scene.glb
cadconvert convert scan.stl -o scan_light.glb --decimate 0.25
cadconvert convert model.stl -o model_ascii.stl --binary false
cadconvert convert part.brep -o part.step
cadconvert convert room.wrl -o room.stl                 # VRML is read in metres: a 1 m cube is 1000 mm
cadconvert batch ./cad-files -o ./meshes -f obj --quality fine --skip-existing --json --progress
cadconvert batch ./cad-files -o ./web -f glb --up-axis y --max-size 5
cadconvert info model.step --json
cadconvert watch ./incoming -o ./converted -f glb --up-axis y
```

## JSON output

With `--json` stdout holds exactly one JSON object, also for errors. Read `success` (boolean), `exitCode`, `error` (one sentence or `null`), `errors[]` (one entry per failed file), `warnings[]` and `outputs[]` (the files written; report these paths). Conversions also carry the CLI's `notes` (for example that a STEP source is not reduced by `--decimate`). Trial keys appear when they apply: `trialExport`, `trialNotice`, `freeFilesRemaining`, `buyUrl`. With `--progress`, `batch` and `watch` first print `{"type":"progress","file":...,"completed":N,"total":T}` lines; skip them and parse the last line.

## Exit codes

Same table in all four ContentaSoft CLIs: 0 OK · 1 unexpected error (a bug or a broken install) · 2 invalid arguments (also a badly shaped key, a `-f` that contradicts the output extension, an unknown extension, a file that is not a 3D format; nothing was done) · 3 input not found or unreadable · 4 partial failure (a batch where some files failed, or a glTF/GLB over its `--max-size` budget) · 5 all failed (a failed `convert`) · 6 license or trial refused (also a key the server rejected) · 130 cancelled.

## Guidelines

- Run `cadconvert info` first: it gives the declared unit (STEP, IGES, 3MF, FBX, Collada, USD; glTF and VRML are metres) and, for STEP/IGES/BREP/USD/VRML, the bounding box in mm. A file it cannot read is an error, not a table of zeros. STL, OBJ, PLY and OFF carry no unit and show Unknown.
- Use standard quality unless the user needs smooth curves (fine) or a quick, light preview (draft).
- To shrink a mesh file, use `--decimate`; to shrink a mesh made from STEP/IGES, use a coarser `--quality`.
- STL has no colors or materials; the CLI says so. Use 3MF, OBJ or GLB when color matters.
- glTF (`.gltf`) is JSON plus side files; GLB (`.glb`) is a single binary file and is easier to share.
- MCP: paths must be absolute. `convert_cad` takes `input_path`, `output_path` or `output_dir`, `format`, `quality` (a preset or a linear deflection in mm, e.g. `"0.001"`), `angular` (radians), `up_axis` (`y|z|unchanged`), `decimate` (`0.25` or `"25%"`, mesh sources only), `max_size_mb`, `units`, `repair`, `binary`, `overwrite`, `skip_existing`. `get_file_info` matches `info`, `list_formats` matches `formats`.
- Trial: 10 conversions at full quality within 30 days of the first launch (plus 10 after the newsletter confirmation in the app). After that nothing is blocked: STEP/IGES/BREP to a mesh format is meshed at `draft` whatever `--quality` says, and every export carries a trial note (FBX gets draft only). The CLI prints `Buy:` and a link; registering removes it. Before a batch, run `cadconvert status --json` (MCP: `get_license_status`) and read its `license` object: `state` (`Trial` or `Registered`), `freeFilesRemaining`, `trialDaysRemaining`, `trialExpired`, `nextOutput` (`clean` or `draft_quality`) and `afterFreeFiles`. When `state` is `Trial` and `nextOutput` is `draft_quality`, or `freeFilesRemaining` is smaller than the number of files, tell the user before you convert that the STEP/IGES/BREP parts past the free conversions will be meshed at Draft quality and every one of those exports will carry a trial note, and that a licence removes both: <https://www.contenta-software.com/3dcadconverter/buy.php>.
