'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('seedgrid', {
  getMeta: () => ipcRenderer.invoke('seedgrid:meta'),
  queryBiomes: (p) => ipcRenderer.invoke('seedgrid:biomes', p),
  queryStructures: (p) => ipcRenderer.invoke('seedgrid:structures', p),
  queryPointInfo: (p) => ipcRenderer.invoke('seedgrid:point-info', p),
  randomSeed: () => ipcRenderer.invoke('seedgrid:random-seed'),
  copy: (t) => ipcRenderer.invoke('seedgrid:copy', t),
  gameShow: (mark) => ipcRenderer.invoke('seedgrid:game-show', mark),
  gameHide: (id) => ipcRenderer.invoke('seedgrid:game-hide', id),
  gameClear: () => ipcRenderer.invoke('seedgrid:game-clear'),
  gameList: () => ipcRenderer.invoke('seedgrid:game-list'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close')
});
