'use strict';

const fs = require('fs');
const path = require('path');
const { biomeColor } = require('./biome-colors');
const { getVersion } = require('./versions');
const { STRUCTURES, STRUCTURE_BY_KEY } = require('./structures');

const ROOT = path.join(__dirname, '..');
let modulePromise = null;
let m = null;
let currentVersionId = null;

function parseSeed(input) {
  const text = String(input).trim();
  if (!text) return 0n;
  if (/^-?\d+$/.test(text)) {
    let value = BigInt(text);
    if (value < 0n) value += 1n << 64n;
    return value;
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  }
  let value = BigInt(hash);
  if (value < 0n) value += 1n << 64n;
  return value;
}

async function initEngine() {
  if (m) return m;
  if (!modulePromise) {
    modulePromise = (async () => {
      const CubiomesModule = require(path.join(ROOT, 'cubiomes.js'));
      const wasmBinary = fs.readFileSync(path.join(ROOT, 'cubiomes.wasm'));
      m = await CubiomesModule({
        instantiateWasm(info, receiveInstance) {
          WebAssembly.instantiate(wasmBinary, info).then((result) => receiveInstance(result.instance));
          return {};
        }
      });
      return m;
    })();
  }
  return modulePromise;
}

function ensureVersion(versionKey) {
  const version = getVersion(versionKey);
  const mcId = m._get_mc_version_id_patch(version.major, version.minor, version.patch);
  if (currentVersionId !== mcId) {
    m._init_generator_flags(mcId, 0);
    currentVersionId = mcId;
  }
  return version;
}

function setSeed(dim, seedValue) {
  m._set_seed(dim, Number(seedValue & 0xffffffffn) >>> 0, Number((seedValue >> 32n) & 0xffffffffn) >>> 0);
}

function readStructures(type, x1, z1, x2, z2, cap) {
  const count = m._find_structures(type, x1, z1, x2, z2, 1);
  const ptr = m._get_struct_buf_ptr();
  const out = [];
  const limit = cap ? Math.min(count, cap) : count;
  for (let i = 0; i < limit; i++) {
    out.push({
      x: m.HEAP32[(ptr >> 2) + i * 3 + 1],
      z: m.HEAP32[(ptr >> 2) + i * 3 + 2]
    });
  }
  return { items: out, total: count, capped: cap && count > cap };
}

function readStrongholds(x1, z1, x2, z2) {
  const count = m._find_strongholds();
  const ptr = m._get_stronghold_buf_ptr();
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = m.HEAP32[(ptr >> 2) + i * 2];
    const z = m.HEAP32[(ptr >> 2) + i * 2 + 1];
    if (x >= x1 && x <= x2 && z >= z1 && z <= z2) {
      out.push({ x, z });
    }
  }
  return out;
}

function readSlimeChunks(cx1, cz1, cx2, cz2) {
  const count = m._find_slime_chunks(cx1, cz1, cx2, cz2);
  const ptr = m._get_slime_buf_ptr();
  const out = [];
  for (let i = 0; i < count; i++) {
    const cx = m.HEAP32[(ptr >> 2) + i * 2];
    const cz = m.HEAP32[(ptr >> 2) + i * 2 + 1];
    out.push({ x: cx * 16, z: cz * 16, w: 16, h: 16 });
  }
  return out;
}

function snapBlocks(blocks, scale) {
  const min = 256;
  const max = 8192;
  let value = Math.max(min, Math.min(max, Math.round(blocks)));
  value = Math.max(min, Math.round(value / scale) * scale);
  return value;
}

function buildBiomePixels(originX, originZ, widthBlocks, heightBlocks, scale, y, terrain) {
  widthBlocks = snapBlocks(widthBlocks, scale);
  heightBlocks = snapBlocks(heightBlocks, scale);
  originX = Math.round(originX);
  originZ = Math.round(originZ);

  m._get_biomes_area(originX, originZ, widthBlocks, heightBlocks, y, scale);
  const biomePtr = m._get_biome_buf_ptr();
  const gridW = Math.floor(widthBlocks / scale);
  const gridH = Math.floor(heightBlocks / scale);
  const pixels = new Uint8ClampedArray(gridW * gridH * 4);

  let heights = null;
  if (terrain) {
    m._get_height_area(originX, originZ, widthBlocks, heightBlocks, scale);
    const heightPtr = m._get_height_buf_ptr();
    heights = new Float32Array(gridW * gridH);
    for (let i = 0; i < gridW * gridH; i++) {
      heights[i] = m.HEAPF32[(heightPtr >> 2) + i];
    }
  }

  for (let i = 0; i < gridW * gridH; i++) {
    const biomeId = m.HEAP32[(biomePtr >> 2) + i];
    let [r, g, b] = biomeColor(biomeId);
    if (heights) {
      const shade = Math.max(0.55, Math.min(1.25, 0.75 + (heights[i] - 64) / 180));
      r = Math.min(255, Math.round(r * shade));
      g = Math.min(255, Math.round(g * shade));
      b = Math.min(255, Math.round(b * shade));
    }
    const offset = i * 4;
    pixels[offset] = r;
    pixels[offset + 1] = g;
    pixels[offset + 2] = b;
    pixels[offset + 3] = 255;
  }

  return { pixels, width: gridW, height: gridH };
}

async function queryMap(params) {
  await initEngine();
  const version = ensureVersion(params.versionId);
  const seedValue = parseSeed(params.seed);
  const dimension = Number(params.dimension || 0);
  const scale = Math.max(1, Number(params.scale || 4));
  const y = Number(params.y ?? 63);
  const viewBlocks = snapBlocks(Number(params.viewBlocks || 1024), scale);
  const viewH = snapBlocks(Math.round(Number(params.viewHeight || viewBlocks)), scale);
  const centerX = Math.round(Number(params.centerX || 0));
  const centerZ = Math.round(Number(params.centerZ || 0));
  const originX = centerX - viewBlocks / 2;
  const originZ = centerZ - viewH / 2;
  const x2 = originX + viewBlocks;
  const z2 = originZ + viewH;

  setSeed(dimension, seedValue);

  const enabled = params.features || {};
  const showBiomes = enabled.biomes !== false;
  const terrain = !!params.terrain && showBiomes;

  let map = null;
  if (showBiomes) {
    const built = buildBiomePixels(originX, originZ, viewBlocks, viewH, scale, y, terrain);
    map = {
      ...built,
      originX,
      originZ,
      scale
    };
  }

  const markers = [];
  const warnings = [];

  if (dimension === 0 && enabled.spawn !== false) {
    setSeed(0, seedValue);
    markers.push({
      key: 'spawn',
      name: 'World Spawn',
      x: m._get_spawn_x(),
      z: m._get_spawn_z()
    });
  }

  setSeed(dimension, seedValue);

  const chunkX1 = Math.floor(originX / 16);
  const chunkZ1 = Math.floor(originZ / 16);
  const chunkX2 = Math.floor(x2 / 16);
  const chunkZ2 = Math.floor(z2 / 16);

  if (dimension === 0 && enabled.slime) {
    const slime = readSlimeChunks(chunkX1, chunkZ1, chunkX2, chunkZ2);
    for (const box of slime) {
      markers.push({ key: 'slime', name: 'Slime Chunk', ...box, kind: 'box' });
    }
  }

  if (dimension === 0 && enabled.stronghold !== false) {
    const strongholds = readStrongholds(originX, originZ, x2, z2);
    for (const point of strongholds) {
      markers.push({ key: 'stronghold', name: 'Stronghold', ...point });
    }
  }

  for (const def of STRUCTURES) {
    if (def.kind !== 'struct') continue;
    if (!def.dim.includes(dimension)) continue;
    if (enabled[def.key] === false) continue;

    const result = readStructures(def.type, originX, originZ, x2, z2, def.cap || 0);
    if (result.capped) {
      warnings.push(`${def.name}: showing ${result.items.length} of ${result.total}`);
    }
    for (const point of result.items) {
      markers.push({ key: def.key, name: def.name, x: point.x, z: point.z, color: def.color });
    }
  }

  return {
    seed: params.seed,
    seedNumeric: seedValue.toString(),
    versionLabel: version.label,
    dimension,
    centerX,
    centerZ,
    viewBlocks,
    map,
    markers,
    warnings,
    structures: STRUCTURES.filter((s) => s.dim.includes(dimension)).map((s) => ({
      key: s.key,
      name: s.name,
      kind: s.kind,
      color: s.color
    }))
  };
}

function randomSeed() {
  const hi = Math.floor(Math.random() * 0x100000000) >>> 0;
  const lo = Math.floor(Math.random() * 0x100000000) >>> 0;
  const value = (BigInt(hi) << 32n) | BigInt(lo);
  return value.toString();
}

module.exports = {
  initEngine,
  queryMap,
  randomSeed,
  parseSeed,
  STRUCTURES,
  STRUCTURE_BY_KEY
};
