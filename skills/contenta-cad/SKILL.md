---
name: contenta-cad
description: Convert 3D CAD and mesh files with the 3D CAD Converter CLI (cadconvert). Use when the user asks to convert STEP, IGES or BREP to STL, OBJ, 3MF, glTF/GLB, FBX, PLY or other formats, convert between mesh formats (including USD/USDZ and VRML input), change units, control mesh quality for 3D printing, reduce the polygon count of a mesh, set the up axis for game engines, inspect a 3D file, or batch-convert or watch a folder of CAD files.
allowed-tools: Bash(cadconvert:*)
---

# 3D CAD Converter

Use the `cadconvert` CLI (3D CAD Converter 1.0.30+, Windows). Default per-user install: `%LOCALAPPDATA%\Programs\CadConverter\cadconvert.exe`, on the user PATH. Check with `cadconvert --version` (it prints the build id after a `+`).

`info`, `formats`, `convert` and `batch` take `--json` and print exactly one JSON object (the same shape as the MCP results, with `success`, and for conversions `warning`, `notes`, `trialExport`, `buyUrl`); errors under `--json` are `{"success":false,"error":"...","exitCode":N}`. `batch --json` reports `"success": false` and exits 4 when any file failed (the others are still written), `"noFilesFound": true` with exit 0 for a folder with nothing to convert, `skippedFolders` for folders it could not read and `cancelled` when it was stopped. A conversion that writes several part files lists the extra ones in `additionalOutputs`; side files such as `.bin` or `.mtl` are not listed. When stdout is not a terminal (or with `--plain`) the text output is plain `Key: Value` lines and ASCII tables, and every number uses a `.` decimal point with no thousands separator.

## Commands

```bash
cadconvert convert <input> [<output>] [-f <fmt>] [--quality P|N] [--angular RAD] [--up-axis y|z|unchanged] [--decimate R] [--units mm|cm|in|m|ft] [--repair] [--binary true|false]
cadconvert batch <dir> [<outdir>] [-f stl] [-r] [-w N] [same conversion options]
cadconvert watch <dir> [<outdir>] [-f stl] [-w N] [same conversion options]     # runs until Ctrl+C
cadconvert info <file>
cadconvert formats
cadconvert register -k <key> -e <email>      # exit 0 ok, 2 badly shaped key, 1 key rejected
```

- Paths can be positional or given with `-i`/`-o`. `-o` can be an existing folder (the file is named after the input).
- No output: `convert` writes next to the input with the `-f` extension (then `-f` is required); `batch` and `watch` write to `<input>_converted` next to the input folder.
- `-f` on `convert` defaults to the output extension; `batch` and `watch` default to `stl`. A `-f` that contradicts the output extension exits 2 (leave `-f` out to take it from the extension).
- `batch` is recursive by default; `-w` defaults to the number of logical processors. `watch` takes `-w` too and, by default, writes a renamed copy rather than overwriting an existing output.

## Mesh quality (STEP/IGES/BREP sources only)

`--quality` (same option as `--tessellation`) takes a preset or a linear deflection in mm. `--angular` is in **radians** and defaults to the preset's value (0.5 with a numeric deflection).

| Preset | Linear | Angular |
|--------|--------|---------|
| draft | 1.0 | 5.0 |
| standard (default) | 0.1 | 0.5 |
| fine (smooth curves, 3D printing) | 0.01 | 0.1 |
| ultrafine (`ultra` also works) | 0.001 | 0.05 |

Finer settings make much larger files: on a small test part, fine produced about 12x the triangles of standard. Mesh-to-mesh conversions ignore these options.

## Units

Sources that declare a unit are read at their true size, converted to mm, then written in `--units` (mm when left out):

- STEP, IGES: the file's unit. 3MF: `unit` attribute. glTF/GLB and VRML (`.wrl`, `.vrml`, `.wrz`): always metres (a 1 m VRML cube is 1000 mm). FBX: `UnitScaleFactor`. Collada: `<unit>` (metres when absent). USD/USDZ: `metersPerUnit` (centimetres when absent).
- BREP, STL, OBJ, PLY, OFF, X3D, AMF, DXF, DWG: no unit; the numbers are taken as mm. The CLI has no source-unit option.
- glTF, FBX and Collada outputs declare their unit and up axis; a glTF output opens at its true size in metres. VRML outputs declare their unit with a root `scale 0.001` (millimetre numbers, scaled to metres as the VRML specification requires).
- Since 1.0.25: glTF/GLB to STL/OBJ/3MF/PLY is 1000x larger than in 1.0.24 (true mm), any file to glTF opens at its true size, and a Blender cm FBX comes in 10x larger.

## Up axis, repair and polygon reduction

- `--up-axis y` for game engines, glTF and three.js; `z` for CAD and 3D printing. It starts from the up axis the source declares (USD, Collada, FBX, glTF, VRML). A STEP/IGES/BREP re-export is not rotated (the CLI prints a note).
- `--repair` repairs STEP/IGES/BREP surfaces before meshing (broken edges and faces, small gaps). It has no effect on mesh sources (STL, OBJ, PLY ...).
- `--decimate 0.25` (or `25%`) keeps about a quarter of the triangles. Mesh sources only: STL, OBJ, PLY, glTF/GLB, FBX, 3MF, Collada, OFF, VRML, X3D, AMF, DXF. STEP/IGES/BREP are not reduced; lower their `--quality` instead (draft is lightest). DWG and USD are not reduced. Meshes over 2,000,000 triangles are written unreduced. The desktop app has no reduction control.

## Formats

Write: stl, obj, ply, fbx, dae, 3mf, gltf, glb, wrl (vrml), x3d, off, step (.step/.stp), iges (.iges/.igs), brep.
Read only: amf, dwg, dxf, usd (.usd/.usda/.usdc, text or binary), usdz, and `.wrz` (gzipped VRML; `.wrl` and `.vrml` are read and written).

VRML input (1.0.27): VRML 2.0 and 1.0, read in metres and Y-up. Extrusion, line and point sets, Text, PROTO instances, textures, scripts and animation are not drawn (the message says so). Inline loads only relative local files; web, absolute and network addresses are refused with a warning.

BREP input means OpenCascade `.brep`/`.brp` only (not Parasolid `.x_t` or ACIS `.sat`). It has no unit, so it is read as mm, and it comes in as one merged solid without part names, colours or assembly tree.

## Examples (verified on 1.0.30, except the USD and USDZ lines)

```bash
cadconvert convert model.step model.stl
cadconvert convert model.step -f glb
cadconvert convert model.step -o model_fine.stl --quality fine
cadconvert convert model.step -o model_fine.stl --tessellation 0.01 --angular 0.1
cadconvert convert model.step -o model_y.glb --up-axis y
cadconvert convert -i model.step -o model_in.obj --units in --repair
cadconvert convert tower.glb tower.stl                  # glTF metres -> true size in mm
cadconvert convert tower.glb tower_in.stl --units in
cadconvert convert tower_cm.fbx tower_fbx.stl           # Blender cm FBX -> mm
cadconvert convert scene.usdz scene.glb
cadconvert convert tower_yup.usda tower_z.stl --up-axis z
cadconvert convert scan.stl -o scan_light.glb --decimate 0.25
cadconvert convert -i model.stl -o model_ascii.stl --binary false
cadconvert convert part.brep part.step
cadconvert convert room.wrl room.stl                 # VRML is read in metres: a 1 m cube is 1000 mm
cadconvert convert model.step model.wrl
cadconvert batch -i ./cad-files -o ./meshes -f obj --quality fine
cadconvert batch ./cad-files
cadconvert info model.step
cadconvert info scene.usdz
cadconvert watch ./incoming -f glb --up-axis y
```

## Exit codes

0 success · 1 error (also a rejected license key), also a cancelled `convert` or `batch` · 2 invalid arguments (also a `-f` that contradicts the output extension, an unknown extension, a file that is not a 3D format) · 3 file not found · 4 conversion failed (also `info` on a file with no readable geometry, and a `batch` with a failed file) · 5 not used (older versions: trial blocked a conversion).

## Guidelines

- Run `cadconvert info` first: it gives the declared unit (STEP, IGES, 3MF, FBX, Collada, USD; glTF and VRML are metres) and, for STEP/IGES/BREP/USD/VRML, the bounding box in mm. A file it cannot read is an error, not a table of zeros. STL, OBJ, PLY and OFF carry no unit and show Unknown.
- Use standard quality unless the user needs smooth curves (fine) or a quick, light preview (draft).
- To shrink a mesh file, use `--decimate`; to shrink a mesh made from STEP/IGES, use a coarser `--quality`.
- STL has no colors or materials; the CLI says so. Use 3MF, OBJ or GLB when color matters.
- glTF (`.gltf`) is JSON plus side files; GLB (`.glb`) is a single binary file and is easier to share.
- Trial: 10 conversions at full quality within 30 days of the first launch (plus 10 after the newsletter confirmation in the app). After that nothing is blocked: STEP/IGES/BREP to a mesh format is meshed at `draft` whatever `--quality` says, and every export carries a trial note (FBX gets draft only). The CLI prints `Buy:` and a link; `cadconvert register -k <key> -e <email>` removes it. In the MCP tool, paths must be absolute; `convert_cad` takes `tessellation` (a preset or a linear deflection in mm, e.g. `"0.001"`), `angular` (radians), `up_axis` (`y|z|unchanged`), `decimate` (`0.25` or `"25%"`, mesh sources only), `units`, `repair`, `binary`, and returns the CLI's notes in `notes` (for example that a STEP source is not reduced by `decimate`).
