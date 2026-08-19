'use strict';

const STRUCTURES = [
  { key: 'biomes', name: 'Biomes', kind: 'layer', dim: [0, -1, 1], color: '#4a90c4' },
  { key: 'slime', name: 'Slime Chunks', kind: 'slime', dim: [0], color: '#7ecf5a' },
  { key: 'village', name: 'Village', kind: 'struct', type: 5, dim: [0], color: '#8b6914' },
  { key: 'outpost', name: 'Pillager Outpost', kind: 'struct', type: 10, dim: [0], color: '#505050' },
  { key: 'mansion', name: 'Woodland Mansion', kind: 'struct', type: 9, dim: [0], color: '#4a2810' },
  { key: 'monument', name: 'Ocean Monument', kind: 'struct', type: 8, dim: [0], color: '#2060a0' },
  { key: 'pyramid', name: 'Desert Temple', kind: 'struct', type: 1, dim: [0], color: '#d4a030' },
  { key: 'jungle', name: 'Jungle Temple', kind: 'struct', type: 2, dim: [0], color: '#208020' },
  { key: 'hut', name: 'Witch Hut', kind: 'struct', type: 3, dim: [0], color: '#602060' },
  { key: 'igloo', name: 'Igloo', kind: 'struct', type: 4, dim: [0], color: '#d0f0ff' },
  { key: 'ruins', name: 'Ruined Portal', kind: 'struct', type: 6, dim: [0], color: '#8040a0' },
  { key: 'shipwreck', name: 'Shipwreck', kind: 'struct', type: 7, dim: [0], color: '#604020' },
  { key: 'treasure', name: 'Buried Treasure', kind: 'struct', type: 14, dim: [0], color: '#ffd700' },
  { key: 'mineshaft', name: 'Mineshaft', kind: 'struct', type: 15, dim: [0], color: '#806040', cap: 400 },
  { key: 'ancient', name: 'Ancient City', kind: 'struct', type: 13, dim: [0], color: '#203040' },
  { key: 'trail', name: 'Trail Ruins', kind: 'struct', type: 23, dim: [0], color: '#806050' },
  { key: 'trial', name: 'Trial Chambers', kind: 'struct', type: 24, dim: [0], color: '#505878' },
  { key: 'camp', name: 'Trail Camp', kind: 'struct', type: 25, dim: [0], color: '#708040' },
  { key: 'portal', name: 'Ruined Portal (Alt)', kind: 'struct', type: 11, dim: [0], color: '#9050b0' },
  { key: 'portal2', name: 'Ruined Portal (Alt 2)', kind: 'struct', type: 12, dim: [0], color: '#9050b0' },
  { key: 'well', name: 'Desert Well', kind: 'struct', type: 16, dim: [0], color: '#c0a060' },
  { key: 'geode', name: 'Geode', kind: 'struct', type: 17, dim: [0], color: '#b090ff', cap: 250 },
  { key: 'stronghold', name: 'Stronghold', kind: 'stronghold', dim: [0], color: '#303030' },
  { key: 'fortress', name: 'Nether Fortress', kind: 'struct', type: 18, dim: [-1], color: '#702020' },
  { key: 'bastion', name: 'Bastion', kind: 'struct', type: 19, dim: [-1], color: '#403030' },
  { key: 'endcity', name: 'End City', kind: 'struct', type: 20, dim: [1], color: '#d0b0ff' },
  { key: 'elytra', name: 'End City Elytra', kind: 'elytra', type: 20, dim: [1], color: '#e8d070' },
  { key: 'gateway', name: 'End Gateway', kind: 'struct', type: 21, dim: [1], color: '#80ffe0' },
  { key: 'spawn', name: 'Spawn', kind: 'spawn', dim: [0], color: '#ff4040' }
];

const STRUCTURE_BY_KEY = new Map(STRUCTURES.map((s) => [s.key, s]));

module.exports = { STRUCTURES, STRUCTURE_BY_KEY };
