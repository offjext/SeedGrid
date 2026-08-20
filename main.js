'use strict';

const { app, BrowserWindow, ipcMain, Menu, clipboard, nativeImage } = require('electron');
const { Worker } = require('worker_threads');
const path = require('path');
const { VERSION_GROUPS } = require('./engine/versions');
const { STRUCTURES } = require('./engine/structures');
const gameBridge = require('./game-bridge');

let mainWindow = null;
let biomeWorkers = [];
let structWorkers = [];
let biomeRR = 0;
let structRR = 0;
let nextId = 0;
const pending = new Map();

function bindWorker(worker, onReady) {
  worker.on('message', (msg) => {
    if (msg.type === 'ready') {
      if (onReady) onReady();
      return;
    }
    const cb = pending.get(msg.id);
    if (!cb) return;
    pending.delete(msg.id);
    if (msg.type === 'error') cb.reject(new Error(msg.error));
    else cb.resolve(msg.result);
  });
}

function startWorkers() {
  const file = path.join(__dirname, 'engine', 'worker.js');
  const ready = [];
  for (let i = 0; i < 3; i++) {
    const w = new Worker(file);
    biomeWorkers.push(w);
    ready.push(new Promise((resolve) => bindWorker(w, resolve)));
  }
  for (let i = 0; i < 2; i++) {
    const w = new Worker(file);
    structWorkers.push(w);
    ready.push(new Promise((resolve) => bindWorker(w, resolve)));
  }
  return Promise.all(ready);
}

function workerCall(target, type, params) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    target.postMessage({ type, id, params });
  });
}

function nextOf(list, kind) {
  if (kind === 'biome') {
    const w = list[biomeRR % list.length];
    biomeRR += 1;
    return w;
  }
  const w = list[structRR % list.length];
  structRR += 1;
  return w;
}

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) icon = undefined;

  mainWindow = new BrowserWindow({
    width: 1280, height: 860, minWidth: 800, minHeight: 500,
    frame: false, title: 'SeedGrid', backgroundColor: '#c8dce8', icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false
    }
  });
  Menu.setApplicationMenu(null);
  mainWindow.webContents.on('context-menu', (e) => e.preventDefault());
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(async () => {
  if (process.platform === 'win32') app.setAppUserModelId('com.nullforge.seedgrid');
  await startWorkers();
  createWindow();
});

app.on('window-all-closed', () => {
  for (const w of biomeWorkers) w.terminate();
  for (const w of structWorkers) w.terminate();
  biomeWorkers = [];
  structWorkers = [];
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('seedgrid:meta', () => ({
  versions: VERSION_GROUPS,
  structures: STRUCTURES.map((s) => ({ key: s.key, name: s.name, kind: s.kind, color: s.color, dim: s.dim }))
}));

ipcMain.handle('seedgrid:biomes', (_e, params) => workerCall(nextOf(biomeWorkers, 'biome'), 'biomes', params));
ipcMain.handle('seedgrid:structures', (_e, params) => workerCall(nextOf(structWorkers, 'struct'), 'structures', params));
ipcMain.handle('seedgrid:point-info', (_e, params) => workerCall(nextOf(biomeWorkers, 'biome'), 'pointInfo', params));

ipcMain.handle('seedgrid:random-seed', () => {
  const hi = Math.floor(Math.random() * 0x100000000) >>> 0;
  const lo = Math.floor(Math.random() * 0x100000000) >>> 0;
  return ((BigInt(hi) << 32n) | BigInt(lo)).toString();
});

ipcMain.handle('seedgrid:copy', (_e, text) => clipboard.writeText(String(text)));
ipcMain.handle('seedgrid:game-show', (_e, mark) => gameBridge.show(mark));
ipcMain.handle('seedgrid:game-hide', (_e, id) => gameBridge.hide(id));
ipcMain.handle('seedgrid:game-clear', () => gameBridge.clear());
ipcMain.handle('seedgrid:game-list', () => gameBridge.list());
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return;
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.handle('window:close', () => mainWindow?.close());
