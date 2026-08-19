'use strict';

const MASK = (1n << 48n) - 1n;
const MULT = 0x5deece66dn;
const ADD = 0xbn;

const PIECE = [
  [9, 3, 9],
  [11, 1, 11],
  [4, 5, 1],
  [4, 6, 7],
  [4, 5, 3],
  [4, 6, 3],
  [12, 3, 12],
  [12, 7, 12],
  [16, 5, 16],
  [11, 7, 11],
  [11, 7, 11],
  [13, 1, 13],
  [12, 23, 28],
  [13, 7, 13],
  [13, 7, 13],
  [15, 1, 15],
  [6, 6, 6],
  [6, 3, 6],
  [6, 3, 6],
  [8, 4, 8]
];

const BASE_FLOOR = 0;
const BASE_ROOF = 1;
const BRIDGE_END = 2;
const BRIDGE_GENTLE_STAIRS = 3;
const BRIDGE_PIECE = 4;
const BRIDGE_STEEP_STAIRS = 5;
const FAT_TOWER_BASE = 6;
const FAT_TOWER_MIDDLE = 7;
const FAT_TOWER_TOP = 8;
const SECOND_FLOOR_1 = 9;
const SECOND_FLOOR_2 = 10;
const SECOND_ROOF = 11;
const END_SHIP = 12;
const THIRD_FLOOR_1 = 13;
const THIRD_FLOOR_2 = 14;
const THIRD_ROOF = 15;
const TOWER_BASE = 16;
const TOWER_PIECE = 18;
const TOWER_TOP = 19;

function u64(n) {
  return BigInt.asUintN(64, typeof n === 'bigint' ? n : BigInt(n));
}

function setSeed(rng, value) {
  rng.seed = (u64(value) ^ MULT) & MASK;
}

function next(rng, bits) {
  rng.seed = (rng.seed * MULT + ADD) & MASK;
  let v = Number(rng.seed >> BigInt(48 - bits));
  if (bits === 32 && v >= 0x80000000) v -= 0x100000000;
  return v;
}

function nextInt(rng, n) {
  const m = n - 1;
  if ((m & n) === 0) {
    const x = u64(n) * u64(next(rng, 31));
    return Number(BigInt.asIntN(32, BigInt.asIntN(64, x) >> 31n));
  }
  let bits;
  let val;
  do {
    bits = next(rng, 31);
    val = bits % n;
  } while (((bits - val + m) | 0) < 0);
  return val;
}

function nextLong(rng) {
  return u64((BigInt(next(rng, 32)) << 32n) + BigInt(next(rng, 32)));
}

function chunkRng(worldSeed, chunkX, chunkZ) {
  const rng = { seed: 0n };
  const seed = u64(worldSeed);
  setSeed(rng, seed);
  const mixed = (nextLong(rng) * u64(chunkX)) ^ (nextLong(rng) * u64(chunkZ)) ^ seed;
  setSeed(rng, mixed);
  return rng;
}

function addPiece(env, prev, rot, px, py, pz, typ) {
  const info = PIECE[typ];
  const p = {
    rot,
    type: typ,
    depth: 0,
    pos: { x: px, y: py, z: pz },
    bb0: { x: px, y: py, z: pz },
    bb1: { x: px, y: py, z: pz }
  };
  if (prev) {
    p.pos.x = prev.pos.x;
    p.pos.y = prev.pos.y;
    p.pos.z = prev.pos.z;
    p.bb0.x = p.pos.x;
    p.bb0.y = p.pos.y;
    p.bb0.z = p.pos.z;
    p.bb1.x = p.pos.x;
    p.bb1.y = p.pos.y;
    p.bb1.z = p.pos.z;
  }
  p.bb1.y += info[1];
  if (rot === 0) {
    p.bb1.x += info[0];
    p.bb1.z += info[2];
  } else if (rot === 1) {
    p.bb0.x -= info[2];
    p.bb1.z += info[0];
  } else if (rot === 2) {
    p.bb0.x -= info[0];
    p.bb0.z -= info[2];
  } else {
    p.bb1.x += info[2];
    p.bb0.z -= info[0];
  }
  if (prev) {
    let dx = 0;
    const dy = py;
    let dz = 0;
    if (prev.rot === 0) {
      dx += px;
      dz += pz;
    } else if (prev.rot === 1) {
      dx -= pz;
      dz += px;
    } else if (prev.rot === 2) {
      dx -= px;
      dz -= pz;
    } else {
      dx += pz;
      dz -= px;
    }
    p.pos.x += dx;
    p.pos.y += dy;
    p.pos.z += dz;
    p.bb0.x += dx;
    p.bb0.y += dy;
    p.bb0.z += dz;
    p.bb1.x += dx;
    p.bb1.y += dy;
    p.bb1.z += dz;
  }
  env.list[env.n] = p;
  env.n += 1;
  if (typ === END_SHIP) env.ship.v = 1;
  return p;
}

function overlap(a, b) {
  return a.bb1.x >= b.bb0.x && a.bb0.x <= b.bb1.x
    && a.bb1.z >= b.bb0.z && a.bb0.z <= b.bb1.z
    && a.bb1.y >= b.bb0.y && a.bb0.y <= b.bb1.y;
}

function genPieces(gen, env, current, depth) {
  if (env.ship.v) return 1;
  if (depth > 8) return 0;
  const nStart = env.n;
  const local = {
    list: env.list,
    n: nStart,
    rng: env.rng,
    ship: env.ship,
    y: env.y
  };
  if (!gen(local, current, depth)) return 0;
  const nLocal = local.n - nStart;
  const gendepth = next(env.rng, 32);
  for (let i = 0; i < nLocal; i++) {
    const p = env.list[nStart + i];
    p.depth = gendepth;
    for (let j = 0; j < nStart; j++) {
      const q = env.list[j];
      if (overlap(q, p)) {
        if (current.depth !== q.depth) return 0;
        break;
      }
    }
  }
  env.n = nStart + nLocal;
  return 1;
}

function genTower(env, current, depth) {
  if (env.ship.v) return 1;
  const rot = current.rot;
  const x = 3 + nextInt(env.rng, 2);
  const z = 3 + nextInt(env.rng, 2);
  let base = current;
  base = addPiece(env, base, rot, x, -3, z, TOWER_BASE);
  base = addPiece(env, base, rot, 0, 7, 0, TOWER_PIECE);
  let floor = nextInt(env.rng, 3) === 0 ? base : null;
  const floorcnt = 1 + nextInt(env.rng, 3);
  for (let i = 0; i < floorcnt; i++) {
    base = addPiece(env, base, rot, 0, 4, 0, TOWER_PIECE);
    if (i < floorcnt - 1 && next(env.rng, 1)) floor = base;
  }
  if (floor) {
    const binfo = [
      [0, 1, -1, 0],
      [1, 6, -1, 1],
      [3, 0, -1, 5],
      [2, 5, -1, 6]
    ];
    for (let i = 0; i < 4; i++) {
      if (!next(env.rng, 1)) continue;
      const brot = (rot + binfo[i][0]) & 3;
      const bridge = addPiece(env, base, brot, binfo[i][1], binfo[i][2], binfo[i][3], BRIDGE_END);
      genPieces(genBridge, env, bridge, depth + 1);
      if (env.ship.v) return 1;
    }
  } else if (depth !== 7) {
    return genPieces(genFatTower, env, base, depth + 1);
  }
  addPiece(env, base, rot, -1, 4, -1, TOWER_TOP);
  return 1;
}

function genBridge(env, current, depth) {
  if (env.ship.v) return 1;
  const rot = current.rot;
  const floorcnt = 1 + nextInt(env.rng, 4);
  let base = current;
  base = addPiece(env, base, rot, 0, 0, -4, BRIDGE_PIECE);
  base.depth = -1;
  let y = 0;
  for (let i = 0; i < floorcnt; i++) {
    if (next(env.rng, 1)) {
      base = addPiece(env, base, rot, 0, y, -4, BRIDGE_PIECE);
      y = 0;
      continue;
    }
    if (next(env.rng, 1)) base = addPiece(env, base, rot, 0, y, -4, BRIDGE_STEEP_STAIRS);
    else base = addPiece(env, base, rot, 0, y, -8, BRIDGE_GENTLE_STAIRS);
    y = 4;
  }
  if (!env.ship.v && nextInt(env.rng, 10 - depth) === 0) {
    const x = -8 + nextInt(env.rng, 8);
    const z = -70 + nextInt(env.rng, 10);
    addPiece(env, base, rot, x, y, z, END_SHIP);
    env.ship.v = 1;
    return 1;
  }
  env.y = y + 1;
  if (!genPieces(genHouseTower, env, base, depth + 1)) return 0;
  base = addPiece(env, base, (rot + 2) & 3, 4, y, 0, BRIDGE_END);
  base.depth = -1;
  return 1;
}

function genHouseTower(env, current, depth) {
  if (env.ship.v) return 1;
  if (depth > 8) return 0;
  const rot = current.rot;
  let base = current;
  base = addPiece(env, base, rot, -3, env.y, -11, BASE_FLOOR);
  const size = nextInt(env.rng, 3);
  if (size === 0) {
    addPiece(env, base, rot, -1, 4, -1, BASE_ROOF);
    return 1;
  }
  base = addPiece(env, base, rot, -1, 0, -1, SECOND_FLOOR_2);
  if (size === 1) {
    base = addPiece(env, base, rot, -1, 8, -1, SECOND_ROOF);
  } else {
    base = addPiece(env, base, rot, -1, 4, -1, THIRD_FLOOR_2);
    base = addPiece(env, base, rot, -1, 8, -1, THIRD_ROOF);
  }
  genPieces(genTower, env, base, depth + 1);
  return 1;
}

function genFatTower(env, current, depth) {
  if (env.ship.v) return 1;
  const rot = current.rot;
  let base = current;
  base = addPiece(env, base, rot, -3, 4, -3, FAT_TOWER_BASE);
  base = addPiece(env, base, rot, 0, 4, 0, FAT_TOWER_MIDDLE);
  const binfo = [
    [0, 4, -1, 0],
    [1, 12, -1, 4],
    [3, 0, -1, 8],
    [2, 8, -1, 12]
  ];
  for (let j = 0; j < 2 && nextInt(env.rng, 3) !== 0; j++) {
    base = addPiece(env, base, rot, 0, 8, 0, FAT_TOWER_MIDDLE);
    for (let i = 0; i < 4; i++) {
      if (!next(env.rng, 1)) continue;
      const brot = (rot + binfo[i][0]) & 3;
      const bridge = addPiece(env, base, brot, binfo[i][1], binfo[i][2], binfo[i][3], BRIDGE_END);
      genPieces(genBridge, env, bridge, depth + 1);
      if (env.ship.v) return 1;
    }
  }
  addPiece(env, base, rot, -2, 8, -2, FAT_TOWER_TOP);
  return 1;
}

function endCityHasShip(worldSeed, blockX, blockZ) {
  const chunkX = Math.floor(blockX / 16);
  const chunkZ = Math.floor(blockZ / 16);
  const rng = chunkRng(worldSeed, chunkX, chunkZ);
  const rot = nextInt(rng, 4);
  const ship = { v: 0 };
  const env = {
    list: new Array(421),
    n: 0,
    rng,
    ship,
    y: 0
  };
  const x = chunkX * 16 + 8;
  const z = chunkZ * 16 + 8;
  let base = addPiece(env, null, rot, x, 0, z, BASE_FLOOR);
  base = addPiece(env, base, rot, -1, 0, -1, SECOND_FLOOR_1);
  base = addPiece(env, base, rot, -1, 4, -1, THIRD_FLOOR_1);
  base = addPiece(env, base, rot, -1, 8, -1, THIRD_ROOF);
  genPieces(genTower, env, base, 1);
  return ship.v === 1;
}

module.exports = { endCityHasShip };
