#!/usr/bin/env node
// ContentaSoft MCP launcher — generated into each package by scripts/build.mjs; edit src/launcher.js.
//
// The MCP server lives inside the Windows desktop app (`<cli> serve`). This launcher:
//   - finds the installed app and runs its MCP server, passing stdin/stdout straight through;
//   - when the app is not installed (or this is not Windows), or cannot be started, runs a one-tool
//     MCP server whose `get_started` tool tells the agent what to do.
// It sends nothing over the network and writes nothing to disk. Zero dependencies.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const app = require('./app.json');

const LATEST_PROTOCOL = '2025-11-25';
const PROTOCOLS = [LATEST_PROTOCOL, '2025-06-18', '2025-03-26', '2024-11-05'];
/** JSON-RPC batching was removed from MCP in this version. */
const BATCHING_REMOVED_IN = '2025-06-18';

// ── Finding the app ─────────────────────────────────────────────────────────────

/** Case-insensitive environment lookup (a plain object, as in tests, is not case-insensitive like process.env). */
function getEnv(env, name) {
  if (env[name] !== undefined) return env[name];
  const key = Object.keys(env).find((k) => k.toLowerCase() === name.toLowerCase());
  return key === undefined ? undefined : env[key];
}

/** Expands %NAME% references; one that cannot be resolved is left as is (and then fails the absolute-path check). */
function expandVars(value, env) {
  return value.replace(/%([^%;\\/]+)%/g, (whole, name) => {
    const v = getEnv(env, name);
    return v === undefined ? whole : v;
  });
}

/**
 * Splits a Windows PATH the way Windows does: ';' separates entries except inside double quotes,
 * quotes are not part of the entry. Empty entries are dropped.
 */
function splitWindowsPath(value) {
  const entries = [];
  let cur = '';
  let quoted = false;
  for (const ch of value) {
    if (ch === '"') quoted = !quoted;
    else if (ch === ';' && !quoted) { entries.push(cur); cur = ''; }
    else cur += ch;
  }
  entries.push(cur);
  return entries.map((e) => e.trim()).filter(Boolean);
}

/**
 * Where the installer puts the CLI, in the order we look. Returns absolute, de-duplicated paths.
 * PATH entries that are relative ("." would run whatever is in the current directory) or UNC shares
 * (a dead server stalls startup for the client's whole timeout) are not searched.
 */
function candidatePaths(env, platform) {
  const out = [];
  const add = (p) => { if (p && !out.includes(p)) out.push(p); };
  const override = getEnv(env, app.overrideEnv);
  if (override) add(override);
  if (platform !== 'win32') return out;

  // Per-user install (the default: PrivilegesRequired=lowest, {autopf} = %LOCALAPPDATA%\Programs).
  const local = getEnv(env, 'LOCALAPPDATA');
  if (local) add(path.win32.join(local, 'Programs', app.installFolder, app.exe));

  // The installer adds the install folder to the user PATH.
  for (const raw of splitWindowsPath(getEnv(env, 'PATH') || '')) {
    const dir = expandVars(raw, env);
    if (!path.win32.isAbsolute(dir) || dir.startsWith('\\\\')) continue;
    add(path.win32.join(dir, app.exe));
  }

  // All-users install (chosen in the installer's privilege dialog); 32-bit Node sees ProgramFiles as the x86 folder.
  for (const name of ['ProgramFiles', 'ProgramW6432', 'ProgramFiles(x86)']) {
    const pf = getEnv(env, name);
    if (pf) add(path.win32.join(pf, app.installFolder, app.exe));
  }
  return out;
}

function findAll(env = process.env, platform = process.platform, exists = fs.existsSync) {
  return candidatePaths(env, platform).filter((p) => {
    try { return exists(p); } catch { return false; /* unreadable PATH entry */ }
  });
}

function findCli(env = process.env, platform = process.platform, exists = fs.existsSync) {
  return findAll(env, platform, exists)[0] || null;
}

// ── Texts ───────────────────────────────────────────────────────────────────────

function withAttribution(url) {
  return url + (url.includes('?') ? '&' : '?') + 'utm_source=mcp&utm_medium=agent&utm_campaign=launcher';
}

/** `state` is { exe, error } when the app was found but could not be started. */
function getStartedText(platform, state) {
  if (platform !== 'win32') {
    return `${app.product} is a Windows desktop app (${app.summary}). It runs on Windows 10 and 11 only, ` +
      `so its tools can't be used on this computer. More: ${withAttribution(app.websiteUrl)}`;
  }
  if (state && state.exe) {
    return [
      `${app.product} is installed (${state.exe}) but its MCP server could not be started: ${state.error}`,
      '',
      'What to try:',
      `1. Run "${state.exe}" serve in a terminal to see the error.`,
      '2. If it is blocked by antivirus or a missing file, reinstall the app: ' + withAttribution(app.downloadUrl),
      '3. Restart the AI client or reconnect this MCP server.',
    ].join('\n');
  }
  return [
    `${app.product} is not installed on this computer. It is a Windows desktop app for ${app.summary}; ` +
      `its MCP tools (${app.tools.join(', ')}) run on this PC, on local files.`,
    '',
    'To set it up:',
    `1. Download the free trial: ${withAttribution(app.downloadUrl)}`,
    '2. Run the installer. It installs for the current user and needs no administrator rights.',
    '3. Restart the AI client or reconnect this MCP server. This server then starts the app\'s own MCP server with the tools above.',
  ].join('\n');
}

// ── Stub MCP server (app not installed / not startable) ─────────────────────────

const err = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
const validId = (id) => typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id));

/** Per-connection state: the negotiated protocol version decides whether batches are legal. */
function newSession(platform = process.platform, state = null) {
  return { platform, state, version: null };
}

function handleMessage(msg, session, inBatch) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return err(null, -32600, 'A JSON-RPC message must be an object');

  const hasId = Object.prototype.hasOwnProperty.call(msg, 'id');
  if (hasId && msg.id !== null && !validId(msg.id)) return err(null, -32600, 'id must be a string or a number');
  const id = hasId && validId(msg.id) ? msg.id : null;

  if (typeof msg.method !== 'string' || msg.method === '') {
    // A response from the client: nothing is owed. Anything else without a method is invalid.
    if (!('method' in msg) && ('result' in msg || 'error' in msg)) return null;
    return err(id, -32600, 'Missing method');
  }

  const isNotificationMethod = msg.method.startsWith('notifications/');
  // JSON-RPC: no id = notification. Some clients write "id": null on notifications; MCP forbids a null id on requests.
  if (!hasId || (msg.id === null && isNotificationMethod)) return null; // we have no notification to act on
  if (msg.id === null) return err(null, -32600, 'id must not be null');
  if (inBatch && msg.method === 'initialize') return err(id, -32600, 'initialize must not be part of a JSON-RPC batch');

  const reply = (result) => ({ jsonrpc: '2.0', id, result });
  const { platform, state } = session;

  switch (msg.method) {
    case 'initialize': {
      const requested = msg.params && typeof msg.params.protocolVersion === 'string' ? msg.params.protocolVersion : '';
      session.version = PROTOCOLS.includes(requested) ? requested : LATEST_PROTOCOL;
      return reply({
        protocolVersion: session.version,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: app.serverName, version: require('./package.json').version },
        instructions: `${app.product} is not installed on this computer (or could not be started). Call get_started for what to do.`,
      });
    }
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({
        tools: [{
          name: 'get_started',
          title: `Set up ${app.product}`,
          description: `${app.product} (${app.summary}) is not installed on this computer (or could not be started), so its tools are not available yet. ` +
            'Call this tool to get the download link and the steps to show the user.',
          inputSchema: { type: 'object', properties: {} },
          annotations: { title: `Set up ${app.product}`, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        }],
      });
    case 'tools/call': {
      const params = msg.params;
      if (!params || typeof params !== 'object' || Array.isArray(params)) return err(id, -32602, 'Missing params');
      if (params.name !== 'get_started') {
        return err(id, -32602, `Unknown tool: ${params.name}. ${app.product} is not available; call get_started.`);
      }
      return reply({ content: [{ type: 'text', text: getStartedText(platform, state) }] });
    }
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

/** One input line → the line to write, or null. Exported for tests. */
function handleLine(line, platform = process.platform, session = newSession(platform)) {
  let parsed;
  try { parsed = JSON.parse(line.replace(/^﻿/, '')); } catch (e) {
    return JSON.stringify(err(null, -32700, 'Parse error'));
  }
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return JSON.stringify(err(null, -32600, 'Empty batch'));
    if (session.version && session.version >= BATCHING_REMOVED_IN) {
      return JSON.stringify(err(null, -32600, `JSON-RPC batches are not part of MCP ${session.version}; send one message per line`));
    }
    const replies = parsed.map((m) => handleMessage(m, session, true)).filter(Boolean);
    return replies.length ? JSON.stringify(replies) : null;
  }
  const r = handleMessage(parsed, session, false);
  return r ? JSON.stringify(r) : null;
}

function runStub(reason, state = null) {
  process.stderr.write(`[${app.serverName} launcher] ${reason}; serving get_started only\n`);
  const session = newSession(process.platform, state);
  // The client closing our stdout is the end of the session, not a crash.
  process.stdout.on('error', () => process.exit(0));
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    const out = handleLine(line, session.platform, session);
    if (out) process.stdout.write(out + '\n');
  });
  // No process.exit() here: stdout may still hold unflushed replies (a pipe is asynchronous on some
  // platforms). Once stdin has ended nothing keeps the event loop alive, so the process ends by itself.
}

// ── Pass-through to the installed app ───────────────────────────────────────────

/** Exit code to report for a child that ended: its own code, or 128+n for a signal (shell convention). */
function exitCodeFor(code, signal) {
  if (typeof code === 'number') return code;
  const n = signal && os.constants.signals[signal];
  return n ? 128 + n : 1;
}

/** Tries each existing candidate in turn; the stub only takes over once none could be started. */
function runCli(candidates, index = 0, lastError = null) {
  if (index >= candidates.length) {
    const first = candidates[0];
    runStub(`could not start ${first}: ${lastError ? lastError.message : 'unknown error'}`,
      { exe: first, error: lastError ? lastError.message : 'unknown error' });
    return;
  }
  const exe = candidates[index];
  process.stderr.write(`[${app.serverName} launcher] starting ${exe} serve\n`);
  let child;
  try {
    child = spawn(exe, ['serve'], { stdio: 'inherit', windowsHide: true });
  } catch (e) {
    // Node throws (instead of emitting 'error') for some failures: a file that is not a valid executable
    // ("spawn UNKNOWN"), an argument problem. Same handling as the asynchronous case below.
    runCli(candidates, index + 1, lastError || e);
    return;
  }
  let started = false;
  child.on('spawn', () => { started = true; });
  child.on('error', (e) => {
    // Could not even start (blocked, corrupt, access denied): try the next install, then the stub.
    if (!started) runCli(candidates, index + 1, lastError || e);
    else { process.stderr.write(`[${app.serverName} launcher] ${exe} failed: ${e.message}\n`); process.exit(1); }
  });
  child.on('exit', (code, signal) => process.exit(exitCodeFor(code, signal)));
  // Windows has no real signals: kill() ends the app at once. Its own stdin-EOF shutdown is the polite path.
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
    try { process.on(sig, () => child.kill()); } catch { /* signal not available on this platform */ }
  }
}

function main() {
  const found = findAll();
  if (found.length) runCli(found);
  else runStub(process.platform === 'win32' ? `${app.exe} not found` : `not Windows (${process.platform})`);
}

if (require.main === module) main();

module.exports = {
  candidatePaths, findCli, findAll, splitWindowsPath, expandVars, handleLine, newSession,
  getStartedText, withAttribution, exitCodeFor,
};
