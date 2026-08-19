'use strict';

const { parentPort } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const { biomeColor } = require('./biome-colors');
const { biomeName, villageName } = require('./biome-names');
const { getVersion } = require('./versions');
const { STRUCTURES } = require('./structures');
const { endCityHasShip } = require('./end-city');

const ROOT = path.join(__dirname, '..');
let m = null;
let currentVersionId = null;
let currentSeedStr = null;
let currentDim = null;
let strongholdCacheKey = '';
let strongholdCache = [];
let elytraCacheKey = '';
const elytraCache = new Map();

function parseSeed(input) {
  const text = String(input).trim();
  if (!text) return 0n;
  if (/^-?\d+$/.test(text)) {
    let v = BigInt(text);
    if (v < 0n) v += 1n << 64n;
    return v;
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  let v = BigInt(hash);
  if (v < 0n) v += 1n << 64n;
  return v;
}

function biomeAreaY(yBlock, dim) {
  if (dim === 1) return 64;
  if (dim === -1) return 32;
  if (yBlock <= 0) return 0;
  if (yBlock >= 200) return 64;
  return 16;
}

function clampCells(n) {
  return Math.max(1, Math.min(1024, Math.round(n)));
}

function villageBiomeId(x, z) {
  const y = 64;
  const bid = m._get_biome(x, y, z);
  if (!isWaterBiome(bid) && bid !== 127) return bid;
  const offs = [8, -8, 16, -16];
  for (let i = 0; i < offs.length; i++) {
    for (let j = 0; j < offs.length; j++) {
      const id = m._get_biome(x + offs[i], y, z + offs[j]);
      if (!isWaterBiome(id) && id !== 127) return id;
    }
  }
  return bid;
}

function isWaterBiome(id) {
  return id === 0 || id === 7 || id === 10 || id === 11 || id === 24
    || (id >= 44 && id <= 50);
}

function ensureVersion(vkey) {
  const ver = getVersion(vkey);
  const mcId = m._get_mc_version_id_patch(ver.major, ver.minor, ver.patch);
  if (currentVersionId !== mcId) {
    m._init_generator_flags(mcId, 0);
    currentVersionId = mcId;
    currentSeedStr = null;
    currentDim = null;
  }
  return ver;
}

function doSetSeed(dim, seedValue) {
  m._set_seed(dim, Number(seedValue & 0xffffffffn) >>> 0, Number((seedValue >> 32n) & 0xffffffffn) >>> 0);
}

async function init() {
  const CubiomesModule = require(path.join(ROOT, 'cubiomes.js'));
  const wasmBinary = fs.readFileSync(path.join(ROOT, 'cubiomes.wasm'));
  m = await CubiomesModule({
    instantiateWasm(info, recv) {
      WebAssembly.instantiate(wasmBinary, info).then((r) => recv(r.instance));
      return {};
    }
  });
  parentPort.postMessage({ type: 'ready' });
}

function queryBiomes(p) {
  ensureVersion(p.versionId);
  const seedValue = parseSeed(p.seed);
  const dim = Number(p.dimension || 0);
  const y = biomeAreaY(Number(p.y ?? 64), dim);
  const terrain = !!p.terrain;
  const cell = dim === 1 ? 64 : dim === -1 ? 32 : 16;

  const ox = Math.round(Number(p.ox));
  const oz = Math.round(Number(p.oz));
  const bw = Math.max(cell, Math.round(Number(p.bw)));
  const bh = Math.max(cell, Math.round(Number(p.bh)));

  doSetSeed(dim, seedValue);
  currentSeedStr = p.seed;
  currentDim = dim;

  const x0 = Math.floor(ox / cell);
  const z0 = Math.floor(oz / cell);
  const sx = clampCells(Math.ceil(bw / cell));
  const sz = clampCells(Math.ceil(bh / cell));
  const worldOx = x0 * cell;
  const worldOz = z0 * cell;
  const worldBw = sx * cell;
  const worldBh = sz * cell;

  const biomePtr = m._get_biomes_area(x0, z0, sx, sz, y, 4);
  if (!biomePtr) {
    throw new Error('Biome area failed');
  }

  let heights = null;
  if (terrain) {
    const hPtr = m._get_height_area(x0, z0, sx, sz, 4);
    if (hPtr) {
      heights = new Float32Array(sx * sz);
      for (let i = 0; i < sx * sz; i++) heights[i] = m.HEAPF32[(hPtr >> 2) + i];
    }
  }

  const gw = sx;
  const gh = sz;
  const pixels = new Uint8ClampedArray(gw * gh * 4);
  for (let z = 0; z < gh; z++) {
    for (let x = 0; x < gw; x++) {
      const i = z * gw + x;
      const bid = m.HEAP32[(biomePtr >> 2) + i];
      let [r, g, b] = biomeColor(bid);
      if (heights) {
        const h = heights[i];
        const hW = x > 0 ? heights[i - 1] : h;
        const hN = z > 0 ? heights[i - gw] : h;
        const slope = (h - hW) + (h - hN);
        let shade = 1 + slope / 18;
        if (isWaterBiome(bid)) {
          const depth = Math.max(0, 62 - h);
          shade *= Math.max(0.52, 1 - depth / 70);
        } else {
          shade *= Math.max(0.55, Math.min(1.35, 0.82 + (h - 64) / 140));
        }
        shade = Math.max(0.4, Math.min(1.65, shade));
        r = Math.min(255, Math.max(12, Math.round(r * shade)));
        g = Math.min(255, Math.max(12, Math.round(g * shade)));
        b = Math.min(255, Math.max(12, Math.round(b * shade)));
      }
      const o = i * 4;
      pixels[o] = r;
      pixels[o + 1] = g;
      pixels[o + 2] = b;
      pixels[o + 3] = 255;
    }
  }

  return {
    pixels: Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength),
    gw,
    gh,
    ox: worldOx,
    oz: worldOz,
    bw: worldBw,
    bh: worldBh,
    scale: cell
  };
}

function queryStructures(p) {
  ensureVersion(p.versionId);
  const seedValue = parseSeed(p.seed);
  const dim = Number(p.dimension || 0);

  const ox = Math.round(Number(p.ox));
  const oz = Math.round(Number(p.oz));
  const bw = Math.round(Number(p.bw));
  const bh = Math.round(Number(p.bh));
  const x2 = ox + bw;
  const z2 = oz + bh;

  doSetSeed(dim, seedValue);
  currentSeedStr = p.seed;
  currentDim = dim;

  const enabled = p.features || {};
  const markers = [];

  if (dim === 0 && enabled.spawn !== false) {
    markers.push({ key: 'spawn', name: 'World Spawn', x: m._get_spawn_x(), z: m._get_spawn_z(), color: '#ff4040' });
  }

  if (dim === 0 && enabled.stronghold !== false) {
    const shKey = `${p.seed}|${p.versionId}`;
    if (strongholdCacheKey !== shKey) {
      const cnt = m._find_strongholds();
      const ptr = m._get_stronghold_buf_ptr();
      strongholdCache = [];
      for (let i = 0; i < cnt; i++) {
        strongholdCache.push({
          key: 'stronghold',
          name: 'Stronghold',
          x: m.HEAP32[(ptr >> 2) + i * 2],
          z: m.HEAP32[(ptr >> 2) + i * 2 + 1],
          color: '#303030'
        });
      }
      strongholdCacheKey = shKey;
    }
    for (const sh of strongholdCache) {
      if (sh.x >= ox && sh.x <= x2 && sh.z >= oz && sh.z <= z2) markers.push(sh);
    }
  }

  if (dim === 0 && enabled.slime) {
    const cx1 = Math.floor(ox / 16), cz1 = Math.floor(oz / 16);
    const cx2 = Math.floor(x2 / 16), cz2 = Math.floor(z2 / 16);
    const cnt = m._find_slime_chunks(cx1, cz1, cx2, cz2);
    const ptr = m._get_slime_buf_ptr();
    for (let i = 0; i < Math.min(cnt, 500); i++) {
      markers.push({
        key: 'slime', name: 'Slime Chunk', kind: 'box',
        x: m.HEAP32[(ptr >> 2) + i * 2] * 16, z: m.HEAP32[(ptr >> 2) + i * 2 + 1] * 16,
        w: 16, h: 16, color: '#7ecf5a'
      });
    }
  }

  if (dim === 1 && (enabled.endcity || enabled.elytra)) {
    const cnt = m._find_structures(20, ox, oz, x2, z2, 1);
    const ptr = m._get_struct_buf_ptr();
    if (elytraCacheKey !== p.seed) {
      elytraCache.clear();
      elytraCacheKey = p.seed;
    }
    for (let i = 0; i < Math.min(cnt, 2500); i++) {
      const x = m.HEAP32[(ptr >> 2) + i * 3 + 1];
      const z = m.HEAP32[(ptr >> 2) + i * 3 + 2];
      let ship = false;
      if (enabled.elytra) {
        const ck = `${x},${z}`;
        if (elytraCache.has(ck)) ship = elytraCache.get(ck);
        else {
          ship = endCityHasShip(seedValue, x, z);
          elytraCache.set(ck, ship);
        }
      }
      if (enabled.elytra && ship) {
        markers.push({ key: 'elytra', name: 'End City Elytra', x, z, color: '#e8d070' });
      } else if (enabled.endcity) {
        markers.push({ key: 'endcity', name: 'End City', x, z, color: '#d0b0ff' });
      }
    }
  }

  for (const def of STRUCTURES) {
    if (def.kind !== 'struct') continue;
    if (def.key === 'endcity' || def.key === 'elytra') continue;
    if (!def.dim.includes(dim)) continue;
    if (!enabled[def.key]) continue;
    const cnt = m._find_structures(def.type, ox, oz, x2, z2, 1);
    const ptr = m._get_struct_buf_ptr();
    const cap = def.cap || 2500;
    for (let i = 0; i < Math.min(cnt, cap); i++) {
      const x = m.HEAP32[(ptr >> 2) + i * 3 + 1];
      const z = m.HEAP32[(ptr >> 2) + i * 3 + 2];
      const marker = {
        key: def.key, name: def.name,
        x, z,
        color: def.color
      };
      if (def.key === 'village') {
        const bid = villageBiomeId(x, z);
        marker.name = villageName(bid);
        marker.biomeName = biomeName(bid);
      }
      markers.push(marker);
    }
  }

  return { markers, dimension: dim };
}

function queryPointInfo(p) {
  ensureVersion(p.versionId);
  const seedValue = parseSeed(p.seed);
  const dim = Number(p.dimension || 0);
  const x = Math.round(Number(p.x || 0));
  const z = Math.round(Number(p.z || 0));
  const yBlock = dim === 1 ? 64 : dim === -1 ? 32 : Number(p.y ?? 64);

  doSetSeed(dim, seedValue);
  currentSeedStr = p.seed;
  currentDim = dim;

  const id = m._get_biome(x, yBlock, z);
  return {
    x,
    z,
    biomeId: id,
    biomeName: biomeName(id)
  };
}

parentPort.on('message', (msg) => {
  try {
    if (msg.type === 'biomes') {
      const result = queryBiomes(msg.params);
      parentPort.postMessage({ type: 'biomes', id: msg.id, result });
    } else if (msg.type === 'structures') {
      const result = queryStructures(msg.params);
      parentPort.postMessage({ type: 'structures', id: msg.id, result });
    } else if (msg.type === 'pointInfo') {
      const result = queryPointInfo(msg.params);
      parentPort.postMessage({ type: 'pointInfo', id: msg.id, result });
    }
  } catch (err) {
    parentPort.postMessage({ type: 'error', id: msg.id, error: err.message });
  }
});

init().catch((e) => parentPort.postMessage({ type: 'error', id: 0, error: e.message }));
