# 3D CAD Converter MCP stub for the Claude Code plugin: runs only when the app is not installed and Node.js
# is missing. Serves one tool, get_started, which tells the agent how to install the app. Sends nothing anywhere.
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding $false
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$in = [Console]::In
$out = [Console]::Out
$protocols = @('2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05')
$text = "3D CAD Converter is not installed on this computer. It is a Windows desktop app for converting STEP, IGES, STL, OBJ, FBX, glTF, 3MF and other 3D/CAD files; its MCP tools (convert_cad, detect_format, get_file_info, list_formats) run on this PC, on local files.\n\nTo set it up:\n1. Download the free trial: https://www.contenta-software.com/3dcadconverter/download.php?utm_source=mcp&utm_medium=agent&utm_campaign=launcher\n2. Run the installer. It installs for the current user and needs no administrator rights.\n3. Restart the AI client or reconnect this MCP server. This server then starts the app's own MCP server with the tools above." -replace '\\n', "`n"
$description = "3D CAD Converter (converting STEP, IGES, STL, OBJ, FBX, glTF, 3MF and other 3D/CAD files) is not installed on this computer (or could not be started), so its tools are not available yet. Call this tool to get the download link and the steps to show the user."

function Send($obj) { $out.Write((ConvertTo-Json -InputObject $obj -Compress -Depth 12) + "`n"); $out.Flush() }
function Reply($id, $result) { Send ([ordered]@{ jsonrpc = '2.0'; id = $id; result = $result }) }
function Fail($id, $code, $message) { Send ([ordered]@{ jsonrpc = '2.0'; id = $id; error = [ordered]@{ code = $code; message = $message } }) }

while ($null -ne ($line = $in.ReadLine())) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  try { $m = ConvertFrom-Json -InputObject $line.TrimStart([char]0xFEFF) } catch { Fail $null (-32700) 'Parse error'; continue }
  if ($m -is [array]) { Fail $null (-32600) 'Send one message per line'; continue }
  if (-not $m.PSObject.Properties['method']) { continue }
  if (-not $m.PSObject.Properties['id'] -or $null -eq $m.id) { continue }
  $id = $m.id
  switch ($m.method) {
    'initialize' {
      $requested = if ($m.params -and $m.params.PSObject.Properties['protocolVersion']) { [string]$m.params.protocolVersion } else { '' }
      $v = if ($protocols -contains $requested) { $requested } else { $protocols[0] }
      Reply $id ([ordered]@{
        protocolVersion = $v
        capabilities = [ordered]@{ tools = [ordered]@{ listChanged = $false } }
        serverInfo = [ordered]@{ name = 'cad-converter'; version = '1.0.3' }
        instructions = '3D CAD Converter is not installed on this computer. Call get_started for what to do.'
      })
    }
    'ping' { Reply $id ([ordered]@{}) }
    'tools/list' {
      Reply $id ([ordered]@{ tools = @([ordered]@{
        name = 'get_started'
        title = 'Set up 3D CAD Converter'
        description = $description
        inputSchema = [ordered]@{ type = 'object'; properties = [ordered]@{} }
        annotations = [ordered]@{ title = 'Set up 3D CAD Converter'; readOnlyHint = $true; destructiveHint = $false; idempotentHint = $true; openWorldHint = $false }
      }) })
    }
    'tools/call' {
      $name = if ($m.params) { [string]$m.params.name } else { '' }
      if ($name -ne 'get_started') { Fail $id (-32602) "Unknown tool: $name. 3D CAD Converter is not available; call get_started." }
      else { Reply $id ([ordered]@{ content = @([ordered]@{ type = 'text'; text = $text }) }) }
    }
    default { Fail $id (-32601) "Method not found: $($m.method)" }
  }
}
