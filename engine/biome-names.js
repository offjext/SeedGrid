'use strict';

const BIOME_NAMES = {
  0: 'Ocean',
  1: 'Plains',
  2: 'Desert',
  3: 'Windswept Hills',
  4: 'Forest',
  5: 'Taiga',
  6: 'Swamp',
  7: 'River',
  8: 'Nether Wastes',
  9: 'The End',
  10: 'Frozen Ocean',
  11: 'Frozen River',
  12: 'Snowy Plains',
  13: 'Mushroom Fields',
  14: 'Mushroom Field Shore',
  16: 'Beach',
  17: 'Desert Hills',
  18: 'Wooded Hills',
  19: 'Taiga Hills',
  20: 'Mountain Edge',
  21: 'Jungle',
  22: 'Jungle Hills',
  23: 'Sparse Jungle',
  24: 'Deep Ocean',
  25: 'Stony Shore',
  26: 'Snowy Beach',
  27: 'Birch Forest',
  28: 'Birch Forest Hills',
  29: 'Dark Forest',
  30: 'Snowy Taiga',
  31: 'Snowy Taiga Hills',
  32: 'Old Growth Pine Taiga',
  33: 'Giant Tree Taiga Hills',
  34: 'Wooded Mountains',
  35: 'Savanna',
  36: 'Savanna Plateau',
  37: 'Badlands',
  38: 'Wooded Badlands Plateau',
  39: 'Badlands Plateau',
  40: 'Small End Islands',
  41: 'End Midlands',
  42: 'End Highlands',
  43: 'End Barrens',
  44: 'Warm Ocean',
  45: 'Lukewarm Ocean',
  46: 'Deep Lukewarm Ocean',
  47: 'Cold Ocean',
  48: 'Deep Cold Ocean',
  49: 'Deep Frozen Ocean',
  127: 'The Void',
  129: 'Sunflower Plains',
  130: 'Desert Lakes',
  131: 'Windswept Gravelly Hills',
  132: 'Flower Forest',
  133: 'Taiga Mountains',
  134: 'Swamp Hills',
  140: 'Ice Spikes',
  149: 'Modified Jungle',
  151: 'Modified Jungle Edge',
  155: 'Tall Birch Forest',
  156: 'Tall Birch Hills',
  157: 'Dark Forest Hills',
  158: 'Snowy Taiga Mountains',
  160: 'Old Growth Spruce Taiga',
  161: 'Giant Spruce Taiga Hills',
  162: 'Gravelly Mountains+',
  163: 'Shattered Savanna Plateau',
  164: 'Shattered Savanna',
  165: 'Eroded Badlands',
  166: 'Modified Wooded Badlands',
  167: 'Modified Badlands Plateau',
  168: 'Bamboo Jungle',
  169: 'Bamboo Jungle Hills',
  170: 'Soul Sand Valley',
  171: 'Crimson Forest',
  172: 'Warped Forest',
  173: 'Basalt Deltas',
  174: 'Dripstone Caves',
  175: 'Lush Caves',
  177: 'Meadow',
  178: 'Grove',
  179: 'Snowy Slopes',
  180: 'Stony Peaks',
  181: 'Jagged Peaks',
  182: 'Frozen Peaks',
  183: 'Deep Dark',
  184: 'Mangrove Swamp',
  185: 'Cherry Grove',
  186: 'Pale Garden'
};

function biomeName(id) {
  return BIOME_NAMES[id] || `Biome ${id}`;
}

function villageType(biomeId) {
  if (biomeId === 2 || biomeId === 17 || biomeId === 130) return 'Desert';
  if (biomeId === 35 || biomeId === 36 || biomeId === 163 || biomeId === 164) return 'Savanna';
  if (biomeId === 5 || biomeId === 19 || biomeId === 32 || biomeId === 33
    || biomeId === 133 || biomeId === 160 || biomeId === 161) return 'Taiga';
  if (biomeId === 12 || biomeId === 30 || biomeId === 31 || biomeId === 140
    || biomeId === 158 || biomeId === 178 || biomeId === 179
    || biomeId === 181 || biomeId === 182) return 'Snowy';
  return 'Plains';
}

function villageName(biomeId) {
  return villageType(biomeId) + ' Village';
}

module.exports = { biomeName, BIOME_NAMES, villageType, villageName };
