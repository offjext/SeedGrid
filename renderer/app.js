'use strict';

const MAX_VIEW_W = 16384;
const MIN_VIEW_W = 256;
const state = {
  seed: '5781506628997407461',
  versionId: 'java-26.2',
  dim: 0,
  cx: 0,
  cz: 0,
  viewW: 4096,
  y: 64,
  terrain: false,
  grid: true,
  features: {},
  structMarkers: [],
  structCache: {},
  customMarker: null,
  completed: {},
  gameMarks: {},
  bmp: null,
  bmpOx: 0,
  bmpOz: 0,
  bmpBw: 0,
  bmpBh: 0,
  bmpScale: 0,
  stOx: 0,
  stOz: 0,
  stBw: 0,
  stBh: 0,
  stReady: false,
  drag: null,
  biomeReq: 0,
  structReq: 0,
  biomeGen: 1,
  biomeBusy: false,
  biomeAgain: false,
  structBusy: false,
  structAgain: false
};

const biomeTiles = new Map();
const TILE_CELLS = 128;
const TILE_LIMIT = 80;
let popoverMarker = null;
let popoverPx = 0;
let popoverPy = 0;
let gamePollBusy = false;

const els = {};
let ctx = null;
const iconImgs = {};
let hitList = [];
const structDim = new Map();
const SETTINGS_KEY = 'seedgrid-settings';
let saveTimer = 0;

function $(id) {
  return document.getElementById(id);
}

function uid(marker) {
  return `${marker.key}_${marker.x}_${marker.z}`;
}

function clampViewWidth(value) {
  let v = Math.max(MIN_VIEW_W, Math.min(MAX_VIEW_W, Math.round(value)));
  v = Math.round(v / 16) * 16;
  return Math.max(MIN_VIEW_W, Math.min(MAX_VIEW_W, v));
}

function currentScale() {
  if (state.dim === 1) return 64;
  if (state.dim === -1) return 32;
  return 16;
}

function mapSize() {
  return {
    w: els.canvas.width || 800,
    h: els.canvas.height || 600
  };
}

function viewHeight() {
  const { w, h } = mapSize();
  return (state.viewW * h) / w;
}

function originX() {
  return state.cx - state.viewW / 2;
}

function originZ() {
  return state.cz - viewHeight() / 2;
}

function allMarkers() {
  const list = state.structMarkers.filter((m) => state.features[m.key] !== false);
  if (state.customMarker) list.push(state.customMarker);
  return list;
}

function loadSavedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch (e) {
    return null;
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      seed: state.seed,
      versionId: state.versionId,
      dim: state.dim,
      y: state.y,
      terrain: state.terrain,
      grid: state.grid,
      features: state.features,
      completed: state.completed,
      gameMarks: state.gameMarks,
      cx: state.cx,
      cz: state.cz,
      viewW: state.viewW
    }));
  } catch (e) {}
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, 120);
}

function restoreSettings() {
  const saved = loadSavedSettings();
  if (!saved) return;
  if (typeof saved.seed === 'string' && saved.seed.trim()) state.seed = saved.seed.trim();
  if (typeof saved.versionId === 'string' && saved.versionId) state.versionId = saved.versionId;
  if (saved.dim === 0 || saved.dim === -1 || saved.dim === 1) state.dim = saved.dim;
  if (saved.y === 64 || saved.y === 256 || saved.y === 0 || saved.y === -51) state.y = saved.y;
  if (typeof saved.terrain === 'boolean') state.terrain = saved.terrain;
  if (typeof saved.grid === 'boolean') state.grid = saved.grid;
  if (typeof saved.cx === 'number' && Number.isFinite(saved.cx)) state.cx = Math.round(saved.cx);
  if (typeof saved.cz === 'number' && Number.isFinite(saved.cz)) state.cz = Math.round(saved.cz);
  if (typeof saved.viewW === 'number' && Number.isFinite(saved.viewW)) state.viewW = clampViewWidth(saved.viewW);
  if (saved.features && typeof saved.features === 'object') {
    for (const key of Object.keys(state.features)) {
      if (typeof saved.features[key] === 'boolean') state.features[key] = saved.features[key];
    }
  }
  if (saved.completed && typeof saved.completed === 'object') {
    const next = {};
    for (const id of Object.keys(saved.completed)) {
      if (saved.completed[id]) next[id] = true;
    }
    state.completed = next;
  }
  if (saved.gameMarks && typeof saved.gameMarks === 'object') {
    const next = {};
    for (const id of Object.keys(saved.gameMarks)) {
      if (saved.gameMarks[id] && typeof saved.gameMarks[id] === 'object') {
        next[id] = saved.gameMarks[id];
      }
    }
    state.gameMarks = next;
  }
}

function syncFormFromState() {
  els.seed.value = state.seed;
  els.version.value = state.versionId;
  if (els.version.value !== state.versionId && els.version.options.length) {
    els.version.selectedIndex = 0;
    state.versionId = els.version.value;
  }
  els.dim.value = String(state.dim);
  els.ySelect.value = String(state.y);
  if (els.ySelect.value !== String(state.y)) {
    els.ySelect.value = '64';
    state.y = 64;
  }
  els.goX.value = String(state.cx);
  els.goZ.value = String(state.cz);
  els.terrainCb.checked = state.terrain;
  els.gridCb.checked = state.grid;
}

function defaultFeatures(structs) {
  const enabled = new Set([
    'biomes', 'spawn', 'village', 'outpost', 'mansion', 'monument', 'pyramid',
    'jungle', 'hut', 'igloo', 'ruins', 'shipwreck', 'treasure', 'ancient',
    'trial', 'trail', 'camp', 'stronghold', 'fortress', 'bastion', 'endcity', 'elytra', 'gateway'
  ]);
  const features = {};
  for (const s of structs) {
    features[s.key] = enabled.has(s.key);
  }
  features.slime = false;
  features.mineshaft = false;
  features.geode = false;
  features.well = false;
  features.portal = false;
  features.portal2 = false;
  return features;
}

function buildVersionSelect(groups) {
  const sel = els.version;
  sel.innerHTML = '';
  for (const group of groups) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.label;
    for (const item of group.items) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.label;
      optgroup.appendChild(option);
    }
    sel.appendChild(optgroup);
  }
  sel.value = state.versionId;
}

function buildFeatures(structs) {
  els.features.innerHTML = '';
  for (const def of structs) {
    if (!def.dim.includes(state.dim)) continue;
    const label = document.createElement('label');
    label.className = 'feat-toggle';
    label.title = def.name;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!state.features[def.key];
    input.addEventListener('change', () => {
      state.features[def.key] = input.checked;
      scheduleSave();
      if (def.kind === 'layer') {
        fullLoad();
      } else {
        state.stReady = false;
        state.structCache = {};
        loadStructures();
      }
    });

    label.appendChild(input);
    const iconHost = document.createElement('span');
    iconHost.innerHTML = window.FEATURE_ICONS[def.key] || window.FEATURE_ICONS.biomes;
    label.appendChild(iconHost.firstElementChild);

    const text = document.createElement('span');
    text.textContent = def.name;
    label.appendChild(text);
    els.features.appendChild(label);
  }
}

function fitCanvas() {
  const w = Math.max(1, Math.floor(els.viewport.clientWidth));
  const h = Math.max(1, Math.floor(els.viewport.clientHeight));
  if (els.canvas.width !== w || els.canvas.height !== h) {
    els.canvas.width = w;
    els.canvas.height = h;
  }
  els.canvas.style.width = `${w}px`;
  els.canvas.style.height = `${h}px`;
}

function worldToCanvas(x, z) {
  const { w, h } = mapSize();
  return {
    x: ((x - originX()) / state.viewW) * w,
    y: ((z - originZ()) / viewHeight()) * h
  };
}

function canvasToWorld(px, py) {
  const { w, h } = mapSize();
  return {
    x: Math.round(originX() + (px / w) * state.viewW),
    z: Math.round(originZ() + (py / h) * viewHeight())
  };
}

function biomeWorldKey() {
  return `${state.seed}|${state.versionId}|${state.dim}|${state.y}|${state.terrain ? 1 : 0}|${currentScale()}`;
}

function tileBlocks() {
  return TILE_CELLS * currentScale();
}

function tileKey(tx, tz) {
  return `${biomeWorldKey()}|${tx}|${tz}`;
}

function rememberTile(key, tile) {
  if (biomeTiles.has(key)) biomeTiles.delete(key);
  biomeTiles.set(key, tile);
  while (biomeTiles.size > TILE_LIMIT) {
    const first = biomeTiles.keys().next().value;
    biomeTiles.delete(first);
  }
}

function stashBiomeTiles(canvas, ox, oz, bw, bh, scale) {
  const ts = tileBlocks();
  if (scale !== currentScale()) return;
  const tx0 = Math.floor(ox / ts);
  const tz0 = Math.floor(oz / ts);
  const tx1 = Math.floor((ox + bw - 1) / ts);
  const tz1 = Math.floor((oz + bh - 1) / ts);
  for (let tz = tz0; tz <= tz1; tz++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const tox = tx * ts;
      const toz = tz * ts;
      if (tox < ox || toz < oz || tox + ts > ox + bw || toz + ts > oz + bh) continue;
      const cells = TILE_CELLS;
      const sx = (tox - ox) / scale;
      const sy = (toz - oz) / scale;
      const tile = document.createElement('canvas');
      tile.width = cells;
      tile.height = cells;
      tile.getContext('2d').drawImage(canvas, sx, sy, cells, cells, 0, 0, cells, cells);
      rememberTile(tileKey(tx, tz), { canvas: tile, ox: tox, oz: toz, bw: ts, bh: ts });
    }
  }
}

function missingBiomeBox(tight) {
  const ts = tileBlocks();
  const visible = visibleBounds();
  const extra = tight ? 0 : Math.round(visible.bw * 0.08);
  const ox = visible.ox - extra;
  const oz = visible.oz - extra;
  const bw = visible.bw + extra * 2;
  const bh = visible.bh + extra * 2;
  const tx0 = Math.floor(ox / ts);
  const tz0 = Math.floor(oz / ts);
  const tx1 = Math.floor((ox + bw - 1) / ts);
  const tz1 = Math.floor((oz + bh - 1) / ts);
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  let miss = 0;
  for (let tz = tz0; tz <= tz1; tz++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (biomeTiles.has(tileKey(tx, tz))) continue;
      miss += 1;
      minX = Math.min(minX, tx * ts);
      minZ = Math.min(minZ, tz * ts);
      maxX = Math.max(maxX, tx * ts + ts);
      maxZ = Math.max(maxZ, tz * ts + ts);
    }
  }
  if (miss === 0) return null;
  const cell = currentScale();
  const maxBlocks = 1024 * cell;
  let reqW = maxX - minX;
  let reqH = maxZ - minZ;
  if (reqW > maxBlocks || reqH > maxBlocks) return biomeBounds(tight);
  return { ox: minX, oz: minZ, bw: reqW, bh: reqH };
}

function visibleBounds() {
  return {
    ox: Math.floor(originX()),
    oz: Math.floor(originZ()),
    bw: Math.ceil(state.viewW),
    bh: Math.ceil(viewHeight())
  };
}

function biomeBounds(tight) {
  const visible = visibleBounds();
  const cell = currentScale();
  const maxBlocks = 1024 * cell;
  const extra = tight ? 1.02 : 1.15;
  let bw = Math.min(maxBlocks, Math.max(visible.bw, Math.round(visible.bw * extra)));
  let bh = Math.min(maxBlocks, Math.max(visible.bh, Math.round(visible.bh * extra)));
  return {
    ox: Math.round(state.cx - bw / 2),
    oz: Math.round(state.cz - bh / 2),
    bw,
    bh
  };
}

function needFreshBiomes() {
  if (state.features.biomes === false) return false;
  if (state.bmp && state.bmpScale === currentScale()) {
    const visible = visibleBounds();
    if (
      visible.ox >= state.bmpOx &&
      visible.oz >= state.bmpOz &&
      visible.ox + visible.bw <= state.bmpOx + state.bmpBw &&
      visible.oz + visible.bh <= state.bmpOz + state.bmpBh
    ) return false;
  }
  return missingBiomeBox(true) != null;
}

function needFreshStructures() {
  if (!state.stReady) return true;
  const visible = visibleBounds();
  return (
    visible.ox < state.stOx ||
    visible.oz < state.stOz ||
    visible.ox + visible.bw > state.stOx + state.stBw ||
    visible.oz + visible.bh > state.stOz + state.stBh
  );
}

function drawBiome() {
  const { w, h } = mapSize();
  ctx.fillStyle = state.dim === -1 ? '#2a1010' : state.dim === 1 ? '#140820' : '#102030';
  ctx.fillRect(0, 0, w, h);
  if (state.features.biomes === false) return;
  ctx.imageSmoothingEnabled = false;

  const ts = tileBlocks();
  const visible = visibleBounds();
  const tx0 = Math.floor(visible.ox / ts);
  const tz0 = Math.floor(visible.oz / ts);
  const tx1 = Math.floor((visible.ox + visible.bw - 1) / ts);
  const tz1 = Math.floor((visible.oz + visible.bh - 1) / ts);
  for (let tz = tz0; tz <= tz1; tz++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const tile = biomeTiles.get(tileKey(tx, tz));
      if (!tile) continue;
      const p0 = worldToCanvas(tile.ox, tile.oz);
      const p1 = worldToCanvas(tile.ox + tile.bw, tile.oz + tile.bh);
      ctx.drawImage(tile.canvas, 0, 0, tile.canvas.width, tile.canvas.height, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    }
  }

  if (!state.bmp) return;
  const p0 = worldToCanvas(state.bmpOx, state.bmpOz);
  const p1 = worldToCanvas(state.bmpOx + state.bmpBw, state.bmpOz + state.bmpBh);
  ctx.drawImage(
    state.bmp,
    0, 0, state.bmp.width, state.bmp.height,
    p0.x, p0.y, p1.x - p0.x, p1.y - p0.y
  );
}

function drawGrid() {
  if (!state.grid) return;
  const { w, h } = mapSize();
  const chunkPx = (16 / state.viewW) * w;
  if (chunkPx < 8) return;

  const ox = originX();
  const oz = originZ();
  const vh = viewHeight();
  const startX = Math.floor(ox / 16) * 16;
  const startZ = Math.floor(oz / 16) * 16;

  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  for (let x = startX; x <= ox + state.viewW + 16; x += 16) {
    const px = worldToCanvas(x, 0).x + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();
  }
  for (let z = startZ; z <= oz + vh + 16; z += 16) {
    const py = worldToCanvas(0, z).y + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(w, py);
    ctx.stroke();
  }
}

function renderAxes() {
  const visible = visibleBounds();
  const step = state.viewW > 40000 ? 4096 : state.viewW > 12000 ? 2048 : state.viewW > 5000 ? 1024 : state.viewW > 2500 ? 512 : state.viewW > 1200 ? 256 : 128;
  els.axisX.innerHTML = '';
  els.axisZ.innerHTML = '';

  for (let x = Math.floor(visible.ox / step) * step; x <= visible.ox + visible.bw; x += step) {
    const label = document.createElement('div');
    label.className = 'axis-label axis-label-x';
    label.style.left = `${worldToCanvas(x, 0).x}px`;
    label.textContent = x.toLocaleString('en-US');
    els.axisX.appendChild(label);
  }

  for (let z = Math.floor(visible.oz / step) * step; z <= visible.oz + visible.bh; z += step) {
    const label = document.createElement('div');
    label.className = 'axis-label axis-label-z';
    label.style.top = `${worldToCanvas(0, z).y}px`;
    label.textContent = z.toLocaleString('en-US');
    els.axisZ.appendChild(label);
  }
}

function markerInDim(marker) {
  if (marker.key === 'custom') return true;
  const dims = structDim.get(marker.key);
  if (!dims) return false;
  return dims.includes(state.dim) && state.features[marker.key] !== false;
}

function drawStructures() {
  const { w, h } = mapSize();
  const size = state.viewW > 20000 ? 10 : state.viewW > 8000 ? 14 : 18;
  hitList = [];
  const markers = state.structMarkers;
  const maxDraw = state.viewW > 40000 ? 600 : 1200;
  let drawn = 0;
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    if (marker.kind === 'box') continue;
    if (!markerInDim(marker)) continue;
    const p = worldToCanvas(marker.x, marker.z);
    if (p.x < -16 || p.y < -16 || p.x > w + 16 || p.y > h + 16) continue;
    if (drawn >= maxDraw && marker.key !== 'spawn' && marker.key !== 'stronghold') continue;
    drawn += 1;
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const img = iconImgs[marker.key];
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.strokeRect(x - size / 2 + 0.5, y - size / 2 + 0.5, size - 1, size - 1);
    if (img && (img.naturalWidth || img.width)) {
      ctx.drawImage(img, x - size / 2 + 2, y - size / 2 + 2, size - 4, size - 4);
    }
    hitList.push({ marker, x, y, size });
  }
}

function renderCustomMarker() {
  els.markerLayer.style.transform = '';
  els.markerLayer.innerHTML = '';
  if (!state.customMarker) return;
  const marker = state.customMarker;
  const p = worldToCanvas(marker.x, marker.z);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'marker-icon';
  btn.style.left = `${Math.round(p.x)}px`;
  btn.style.top = `${Math.round(p.y)}px`;
  btn.title = `${marker.name} X: ${marker.x} Z: ${marker.z}`;
  btn.innerHTML = window.FEATURE_ICONS.custom;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    showPopover(marker, p.x, p.y);
  });
  els.markerLayer.appendChild(btn);
}

function markerAt(px, py) {
  let best = null;
  let bestD = 18;
  for (let i = 0; i < hitList.length; i++) {
    const h = hitList[i];
    const d = Math.abs(h.x - px) + Math.abs(h.y - py);
    if (d < bestD) {
      bestD = d;
      best = h.marker;
    }
  }
  return best;
}

function render(keepMarkers) {
  fitCanvas();
  ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
  drawBiome();
  drawGrid();
  if (!keepMarkers) renderAxes();
  drawStructures();
  if (!keepMarkers) renderCustomMarker();
  const ver = els.version.selectedOptions[0]?.textContent || '';
  els.note.textContent = `Seed ${state.seed} for ${ver}`;
}

function updateMouseCoords(px, py) {
  if (px < 0 || py < 0 || px > els.canvas.width || py > els.canvas.height) return;
  const point = canvasToWorld(px, py);
  const hit = markerAt(px, py);
  if (hit) {
    els.mouseCoords.textContent = `${hit.name}  X: ${hit.x}  Z: ${hit.z}`;
    return;
  }
  els.mouseCoords.textContent = `X: ${point.x}  Z: ${point.z}`;
}

async function loadBiomes(force, tight) {
  if (state.features.biomes === false) {
    state.bmp = null;
    biomeTiles.clear();
    render();
    return;
  }
  if (!force && !needFreshBiomes()) return;
  if (state.biomeBusy) {
    state.biomeAgain = true;
    return;
  }

  const bounds = missingBiomeBox(tight) || biomeBounds(tight);
  state.biomeBusy = true;
  state.biomeAgain = false;
  const gen = state.biomeGen;
  const dim = state.dim;
  const scale = currentScale();
  const worldKey = biomeWorldKey();
  els.status.textContent = 'Loading biomes...';

  try {
    const result = await window.seedgrid.queryBiomes({
      seed: state.seed,
      versionId: state.versionId,
      dimension: dim,
      scale,
      y: state.y,
      terrain: state.terrain,
      ox: bounds.ox,
      oz: bounds.oz,
      bw: bounds.bw,
      bh: bounds.bh
    });
    if (gen !== state.biomeGen || dim !== state.dim || worldKey !== biomeWorldKey()) return;

    const canvas = document.createElement('canvas');
    canvas.width = result.gw;
    canvas.height = result.gh;
    const c = canvas.getContext('2d');
    const img = c.createImageData(result.gw, result.gh);
    const src = pixelsFromResult(result);
    if (src && src.length === img.data.length) img.data.set(src);
    c.putImageData(img, 0, 0);

    state.bmp = canvas;
    state.bmpOx = result.ox;
    state.bmpOz = result.oz;
    state.bmpBw = result.bw;
    state.bmpBh = result.bh;
    state.bmpScale = result.scale;
    stashBiomeTiles(canvas, result.ox, result.oz, result.bw, result.bh, result.scale);
    els.status.textContent = 'Ready';
    render();
  } catch (err) {
    if (gen !== state.biomeGen || dim !== state.dim) return;
    console.error(err);
    els.status.textContent = `Error: ${err.message}`;
  } finally {
    state.biomeBusy = false;
    if (state.biomeAgain) {
      state.biomeAgain = false;
      loadBiomes(false);
    }
  }
}

function pixelsFromResult(result) {
  const raw = result.pixels;
  if (raw) {
    if (raw instanceof Uint8ClampedArray) return raw;
    if (raw instanceof Uint8Array) return new Uint8ClampedArray(raw.buffer, raw.byteOffset, raw.byteLength);
    if (Array.isArray(raw)) return new Uint8ClampedArray(raw);
    if (raw.data) return new Uint8ClampedArray(raw.data);
  }
  if (result.b64) {
    const bin = atob(result.b64);
    const data = new Uint8ClampedArray(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    return data;
  }
  return null;
}

async function loadStructures() {
  if (state.structBusy) {
    state.structAgain = true;
    return;
  }
  state.structBusy = true;
  state.structAgain = false;
  const req = ++state.structReq;
  const dim = state.dim;
  try {
    const visible = visibleBounds();
    const cell = currentScale();
    const maxBlocks = 1024 * cell;
    const extra = 1.15;
    let bw = Math.min(maxBlocks, Math.max(visible.bw, Math.round(visible.bw * extra)));
    let bh = Math.min(maxBlocks, Math.max(visible.bh, Math.round(visible.bh * extra)));
    const result = await window.seedgrid.queryStructures({
      seed: state.seed,
      versionId: state.versionId,
      dimension: dim,
      ox: Math.round(state.cx - bw / 2),
      oz: Math.round(state.cz - bh / 2),
      bw,
      bh,
      features: state.features
    });
    if (req !== state.structReq || dim !== state.dim) return;
    if (result.dimension != null && result.dimension !== state.dim) return;
    const incoming = result.markers || [];
    const next = {};
    for (const marker of incoming) {
      if (!markerInDim(marker)) continue;
      next[uid(marker)] = marker;
    }
    state.structCache = next;
    state.structMarkers = Object.values(next);
    state.stOx = Math.round(state.cx - bw / 2);
    state.stOz = Math.round(state.cz - bh / 2);
    state.stBw = bw;
    state.stBh = bh;
    state.stReady = true;
    render();
  } catch (err) {
    if (req !== state.structReq) return;
    console.error(err);
  } finally {
    state.structBusy = false;
    if (state.structAgain) {
      state.structAgain = false;
      loadStructures();
    }
  }
}

function dropWorld() {
  state.biomeGen += 1;
  state.structReq += 1;
  state.bmp = null;
  biomeTiles.clear();
  state.structCache = {};
  state.structMarkers = [];
  state.stReady = false;
  state.biomeAgain = false;
  state.structAgain = false;
}

function fullLoad() {
  dropWorld();
  render();
  loadBiomes(true, true);
  loadStructures();
  scheduleEdgeLoad();
}

function jumpTo(x, z) {
  hidePopover();
  state.cx = x;
  state.cz = z;
  scheduleSave();
  render();
  loadBiomes(false, true);
  loadStructures();
  scheduleEdgeLoad();
}

let edgeTimer = null;
let prefetchAt = 0;
function prefetchView() {
  const t = performance.now();
  if (t - prefetchAt < 28) {
    scheduleEdgeLoad();
    return;
  }
  prefetchAt = t;
  if (needFreshBiomes()) loadBiomes(false);
  if (needFreshStructures()) loadStructures();
}

function scheduleEdgeLoad() {
  clearTimeout(edgeTimer);
  edgeTimer = setTimeout(() => {
    prefetchAt = performance.now();
    if (needFreshBiomes()) loadBiomes(false);
    if (needFreshStructures()) loadStructures();
  }, 40);
}

function markerToGame(marker) {
  return {
    id: uid(marker),
    name: marker.name || 'Marker',
    x: Math.round(marker.x),
    y: Number.isFinite(marker.y) ? Math.round(marker.y) : 64,
    z: Math.round(marker.z),
    dimension: state.dim,
    color: marker.color || '#4a8fd8',
    key: marker.key || 'custom'
  };
}

function dimLabel(dim) {
  if (dim === -1) return 'Nether';
  if (dim === 1) return 'End';
  return 'Overworld';
}

function marksEqual(a, b) {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i++) {
    if (!b[ak[i]]) return false;
  }
  return true;
}

function applyGameList(waypoints) {
  const next = {};
  for (const w of waypoints || []) {
    if (w && w.id) next[w.id] = w;
  }
  const changed = !marksEqual(state.gameMarks, next);
  state.gameMarks = next;
  renderMarksPanel();
  if (!changed) return;
  scheduleSave();
  if (popoverMarker && els.popover && !els.popover.classList.contains('hidden')) {
    showPopover(popoverMarker, popoverPx, popoverPy);
  }
}

function renderMarksPanel() {
  if (!els.marksList) return;
  const ids = Object.keys(state.gameMarks);
  if (!ids.length) {
    els.marksList.innerHTML = '<div class="marks-empty">No marks yet. Click a structure and press Show at game.</div>';
    return;
  }
  els.marksList.innerHTML = '';
  for (const id of ids) {
    const w = state.gameMarks[id];
    const row = document.createElement('div');
    row.className = 'marks-row';
    const text = document.createElement('div');
    text.className = 'marks-row-text';
    const nameEl = document.createElement('div');
    nameEl.className = 'marks-row-name';
    nameEl.textContent = w.name || id;
    const coordEl = document.createElement('div');
    coordEl.textContent = `X: ${w.x} Z: ${w.z}  ${dimLabel(w.dimension)}`;
    text.appendChild(nameEl);
    text.appendChild(coordEl);
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'popover-btn';
    go.textContent = 'Go';
    go.onclick = () => {
      if (w.dimension === 0 || w.dimension === -1 || w.dimension === 1) {
        els.dim.value = String(w.dimension);
        state.dim = w.dimension;
        buildFeatures(window.__structs || []);
      }
      jumpTo(Number(w.x) || 0, Number(w.z) || 0);
    };
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'popover-btn';
    rm.textContent = 'Remove';
    rm.onclick = () => hideInGame(id);
    row.appendChild(text);
    row.appendChild(go);
    row.appendChild(rm);
    els.marksList.appendChild(row);
  }
}

async function refreshGameMarks() {
  try {
    const result = await window.seedgrid.gameList();
    if (els.marksStatus) {
      els.marksStatus.textContent = result.live
        ? 'Minecraft is connected'
        : 'Minecraft is not connected. Marks still save for the next launch.';
    }
    applyGameList(result.waypoints);
  } catch (e) {
    if (els.marksStatus) els.marksStatus.textContent = 'Could not read marks file';
    renderMarksPanel();
  }
}

async function showInGame(marker) {
  const mark = markerToGame(marker);
  try {
    const result = await window.seedgrid.gameShow(mark);
    applyGameList(result.waypoints);
    els.status.textContent = result.live
      ? `Shown in game: ${mark.name}`
      : `Saved mark: ${mark.name}. Start Minecraft with the SeedGrid mod.`;
  } catch (e) {
    els.status.textContent = 'Could not send mark to game';
  }
}

async function hideInGame(id) {
  try {
    const result = await window.seedgrid.gameHide(id);
    applyGameList(result.waypoints);
    els.status.textContent = 'Mark removed';
  } catch (e) {
    els.status.textContent = 'Could not remove mark';
  }
}

function hidePopover() {
  els.popover.classList.add('hidden');
  popoverMarker = null;
}

function showPopover(marker, px, py) {
  const markerId = uid(marker);
  const done = !!state.completed[markerId];
  const inGame = !!state.gameMarks[markerId];
  const icon = window.FEATURE_ICONS[marker.key] || window.FEATURE_ICONS.custom;
  const biomeLine = marker.biomeName ? `<div class="popover-biome">Biome: ${marker.biomeName}</div>` : '';
  const gameBtn = inGame
    ? '<button class="popover-btn" id="popHideGame">Remove mark</button>'
    : '<button class="popover-btn" id="popShowGame">Show at game</button>';

  els.popover.innerHTML =
    `<div class="popover-title">${icon} ${marker.name}</div>` +
    `<div class="popover-coords">X: ${marker.x.toLocaleString('en-US')} Z: ${marker.z.toLocaleString('en-US')}</div>` +
    biomeLine +
    '<div class="popover-actions">' +
    '<button class="popover-btn" id="popCopy">Copy coords</button>' +
    '<button class="popover-btn" id="popClose">Close</button>' +
    '</div>' +
    `<div class="popover-actions-wrap">${gameBtn}</div>` +
    `<label class="popover-completed"><input type="checkbox" id="popDone" ${done ? 'checked' : ''}> Completed</label>`;

  const vw = els.viewport.clientWidth;
  const vh = els.viewport.clientHeight;
  let left = px + 14;
  let top = py - 24;
  if (left + 240 > vw) left = px - 246;
  if (top + 190 > vh) top = vh - 194;
  if (top < 4) top = 4;
  els.popover.style.left = `${left}px`;
  els.popover.style.top = `${top}px`;
  els.popover.classList.remove('hidden');
  popoverMarker = marker;
  popoverPx = px;
  popoverPy = py;

  $('popCopy').onclick = async () => {
    await window.seedgrid.copy(`X: ${marker.x}, Z: ${marker.z}`);
    els.status.textContent = 'Coords copied';
  };
  $('popClose').onclick = hidePopover;
  const showBtn = $('popShowGame');
  if (showBtn) {
    showBtn.onclick = async () => {
      await showInGame(marker);
      showPopover(marker, px, py);
    };
  }
  const hideBtn = $('popHideGame');
  if (hideBtn) {
    hideBtn.onclick = async () => {
      await hideInGame(markerId);
      showPopover(marker, px, py);
    };
  }
  $('popDone').onchange = (e) => {
    state.completed[markerId] = e.target.checked;
    scheduleSave();
    render();
  };
}

async function addCustomMarker(worldX, worldZ) {
  const marker = {
    key: 'custom',
    name: 'Marker',
    x: worldX,
    z: worldZ,
    biomeName: '...',
    color: '#d65a4a'
  };
  state.customMarker = marker;
  render();
  const p = worldToCanvas(marker.x, marker.z);
  showPopover(marker, p.x, p.y);
  els.status.textContent = 'Reading biome...';
  try {
    const info = await window.seedgrid.queryPointInfo({
      seed: state.seed,
      versionId: state.versionId,
      dimension: state.dim,
      x: worldX,
      z: worldZ,
      y: state.y
    });
    if (state.customMarker !== marker) return;
    marker.x = info.x;
    marker.z = info.z;
    marker.biomeName = info.biomeName;
    render();
    const p2 = worldToCanvas(marker.x, marker.z);
    showPopover(marker, p2.x, p2.y);
    els.status.textContent = `${info.biomeName}  X: ${info.x}  Z: ${info.z}`;
  } catch (err) {
    console.error(err);
    marker.biomeName = 'Unknown';
    render();
    els.status.textContent = `Error: ${err.message}`;
  }
}

function applyForm() {
  state.seed = els.seed.value.trim();
  state.versionId = els.version.value;
  state.dim = Number(els.dim.value);
  state.y = Number(els.ySelect.value);
  state.customMarker = null;
  buildFeatures(window.__structs || []);
  scheduleSave();
  fullLoad();
}

function zoomBy(factor, px, py) {
  const cx = px == null ? els.canvas.width / 2 : px;
  const cy = py == null ? els.canvas.height / 2 : py;
  const before = canvasToWorld(cx, cy);
  state.viewW = clampViewWidth(state.viewW * factor);
  const after = canvasToWorld(cx, cy);
  state.cx = Math.round(state.cx + (before.x - after.x));
  state.cz = Math.round(state.cz + (before.z - after.z));
  scheduleSave();
  render();
  prefetchView();
}

function bindEvents() {
  $('winMin').onclick = () => window.seedgrid.minimize();
  $('winMax').onclick = () => window.seedgrid.maximize();
  $('winClose').onclick = () => window.seedgrid.close();

  els.seed.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyForm();
  });
  $('randomBtn').onclick = async () => {
    els.seed.value = await window.seedgrid.randomSeed();
    applyForm();
  };
  els.version.addEventListener('change', applyForm);
  els.dim.addEventListener('change', () => {
    state.dim = Number(els.dim.value);
    buildFeatures(window.__structs || []);
    scheduleSave();
    fullLoad();
  });

  $('goBtn').onclick = () => {
    jumpTo(Number(els.goX.value) || 0, Number(els.goZ.value) || 0);
  };

  els.goX.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('goBtn').click();
  });
  els.goZ.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('goBtn').click();
  });

  $('zoomInBtn').onclick = () => {
    zoomBy(1 / 1.4);
  };
  $('zoomOutBtn').onclick = () => {
    zoomBy(1.4);
  };

  els.terrainCb.addEventListener('change', () => {
    state.terrain = els.terrainCb.checked;
    scheduleSave();
    fullLoad();
  });
  els.ySelect.addEventListener('change', () => {
    state.y = Number(els.ySelect.value);
    scheduleSave();
    fullLoad();
  });
  els.gridCb.addEventListener('change', () => {
    state.grid = els.gridCb.checked;
    scheduleSave();
    render();
  });

  $('shareBtn').onclick = async () => {
    await window.seedgrid.copy(`Seed: ${state.seed}\nVersion: ${els.version.value}\nX: ${state.cx} Z: ${state.cz}`);
    els.status.textContent = 'Copied';
  };

  $('marksBtn').onclick = () => {
    els.marksPanel.classList.toggle('hidden');
    if (!els.marksPanel.classList.contains('hidden')) refreshGameMarks();
  };
  $('marksClose').onclick = () => els.marksPanel.classList.add('hidden');
  $('marksClear').onclick = async () => {
    const result = await window.seedgrid.gameClear();
    applyGameList(result.waypoints);
    els.status.textContent = 'All marks removed';
  };

  let dragMoved = false;
  let dragRaf = 0;
  els.canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    hidePopover();
    dragMoved = false;
    state.drag = { sx: e.clientX, sy: e.clientY, cx: state.cx, cz: state.cz };
    els.canvas.classList.add('dragging');
  });

  window.addEventListener('mousemove', (e) => {
    const rect = els.canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * els.canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * els.canvas.height;
    updateMouseCoords(px, py);

    if (!state.drag) return;
    const dx = e.clientX - state.drag.sx;
    const dy = e.clientY - state.drag.sy;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;

    state.cx = Math.round(state.drag.cx - (dx * state.viewW) / els.canvas.width);
    state.cz = Math.round(state.drag.cz - (dy * viewHeight()) / els.canvas.height);
    els.markerLayer.style.transform = `translate(${dx}px, ${dy}px)`;
    if (!dragRaf) {
      dragRaf = requestAnimationFrame(() => {
        dragRaf = 0;
        if (state.drag) render(true);
      });
    }
    if (needFreshBiomes() || needFreshStructures()) prefetchView();
  });

  window.addEventListener('mouseup', () => {
    if (!state.drag) return;
    els.canvas.classList.remove('dragging');
    state.drag = null;
    els.markerLayer.style.transform = '';
    render();
    scheduleSave();
    scheduleEdgeLoad();
  });

  els.canvas.addEventListener('click', (e) => {
    if (dragMoved) return;
    if (e.button !== 0) return;
    const rect = els.canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * els.canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * els.canvas.height;
    const hit = markerAt(px, py);
    if (hit) {
      const p = worldToCanvas(hit.x, hit.z);
      showPopover(hit, p.x, p.y);
      return;
    }
    hidePopover();
  });

  els.canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  els.viewport.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.closest('.map-btn')) return;
    if (e.target.closest('.popover')) return;
    const rect = els.viewport.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * els.canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * els.canvas.height;
    const world = canvasToWorld(px, py);
    addCustomMarker(world.x, world.z);
  });

  els.canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    hidePopover();
    const rect = els.canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * els.canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * els.canvas.height;
    const factor = e.deltaY < 0 ? 1 / 1.28 : 1.28;
    zoomBy(factor, px, py);
  }, { passive: false });

  window.addEventListener('resize', () => {
    render();
    prefetchView();
  });
}

async function boot() {
  els.seed = $('seedInput');
  els.version = $('versionSelect');
  els.dim = $('dimensionSelect');
  els.features = $('featuresBar');
  els.status = $('statusLine');
  els.canvas = $('mapCanvas');
  els.viewport = $('mapViewport');
  els.axisX = $('axisTop');
  els.axisZ = $('axisLeft');
  els.goX = $('goX');
  els.goZ = $('goZ');
  els.ySelect = $('ySelect');
  els.terrainCb = $('terrainToggle');
  els.gridCb = $('gridToggle');
  els.popover = $('popover');
  els.markerLayer = $('markerLayer');
  els.note = $('mapNote');
  els.mouseCoords = $('mouseCoords');
  els.marksPanel = $('marksPanel');
  els.marksList = $('marksList');
  els.marksStatus = $('marksStatus');
  ctx = els.canvas.getContext('2d', { alpha: false });
  for (const key of Object.keys(window.FEATURE_ICONS || {})) {
    const img = new Image();
    img.onload = () => {
      const baked = document.createElement('canvas');
      baked.width = 32;
      baked.height = 32;
      baked.getContext('2d').drawImage(img, 0, 0, 32, 32);
      iconImgs[key] = baked;
      render();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(window.FEATURE_ICONS[key]);
  }

  const meta = await window.seedgrid.getMeta();
  window.__structs = meta.structures;
  structDim.clear();
  for (const s of meta.structures) structDim.set(s.key, s.dim);
  buildVersionSelect(meta.versions);
  state.features = defaultFeatures(meta.structures);
  restoreSettings();
  syncFormFromState();
  buildFeatures(meta.structures);
  bindEvents();
  window.addEventListener('beforeunload', saveSettings);
  fitCanvas();
  applyForm();
  refreshGameMarks();
  setInterval(() => {
    if (gamePollBusy) return;
    gamePollBusy = true;
    refreshGameMarks().finally(() => {
      gamePollBusy = false;
    });
  }, 800);
}

boot();
