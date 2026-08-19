'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 38471;
const HOST = '127.0.0.1';

function marksDir() {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || '', '.minecraft', 'seedgrid');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'minecraft', 'seedgrid');
  }
  return path.join(os.homedir(), '.minecraft', 'seedgrid');
}

function marksFile() {
  return path.join(marksDir(), 'waypoints.json');
}

function emptyDoc() {
  return { v: 1, waypoints: [] };
}

function readDoc() {
  try {
    const raw = fs.readFileSync(marksFile(), 'utf8');
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.waypoints)) return emptyDoc();
    return { v: 1, waypoints: data.waypoints };
  } catch (e) {
    return emptyDoc();
  }
}

function writeDoc(doc) {
  const dir = marksDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(marksFile(), JSON.stringify(doc, null, 2));
}

function httpCall(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body == null ? null : JSON.stringify(body);
    const req = http.request({
      host: HOST,
      port: PORT,
      path: urlPath,
      method,
      timeout: 900,
      headers: data
        ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        : {}
    }, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => {
        let json = {};
        try { json = buf ? JSON.parse(buf) : {}; } catch (e) {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    if (data) req.write(data);
    req.end();
  });
}

async function tryHttp(method, urlPath, body) {
  try {
    return await httpCall(method, urlPath, body);
  } catch (e) {
    return null;
  }
}

function upsertLocal(mark) {
  const doc = readDoc();
  const next = doc.waypoints.filter((w) => w.id !== mark.id);
  next.push(mark);
  doc.waypoints = next;
  writeDoc(doc);
  return doc;
}

function removeLocal(id) {
  const doc = readDoc();
  doc.waypoints = doc.waypoints.filter((w) => w.id !== id);
  writeDoc(doc);
  return doc;
}

function clearLocal() {
  const doc = emptyDoc();
  writeDoc(doc);
  return doc;
}

async function show(mark) {
  const doc = upsertLocal(mark);
  const live = await tryHttp('POST', '/v1/waypoint', mark);
  return {
    ok: true,
    live: !!(live && live.ok),
    waypoints: (live && live.json.waypoints) || doc.waypoints
  };
}

async function hide(id) {
  const doc = removeLocal(id);
  const live = await tryHttp('DELETE', '/v1/waypoint', { id });
  return {
    ok: true,
    live: !!(live && live.ok),
    waypoints: (live && live.json.waypoints) || doc.waypoints
  };
}

async function clear() {
  const doc = clearLocal();
  const live = await tryHttp('POST', '/v1/clear', {});
  return {
    ok: true,
    live: !!(live && live.ok),
    waypoints: (live && live.json.waypoints) || doc.waypoints
  };
}

async function list() {
  const doc = readDoc();
  const live = await tryHttp('GET', '/v1/waypoints');
  const status = await tryHttp('GET', '/v1/status');
  return {
    ok: true,
    live: !!(live && live.ok),
    status: (status && status.json) || { ok: false, ingame: false },
    waypoints: (live && live.json.waypoints) || doc.waypoints
  };
}

module.exports = { show, hide, clear, list, PORT };
