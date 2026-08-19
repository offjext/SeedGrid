# SeedGrid

Desktop Minecraft Java seed map. Pan, zoom, biomes, structures. Companion Fabric mod can drop those marks into the running game.

Author: Exempler201

## App

Windows: download `SeedGrid-1.0.0-win.exe` from [Releases](https://github.com/offjext/SeedGrid/releases). Node and Electron are inside that file. Double-click, no install.

From source (Node.js 18+):

```
npm install
npx electron .
```

Or `start.bat`. To pack the exe: `npm run pack` (output in `dist/`).

Settings (seed, version, dimension, feature checkboxes, map position, completed marks) save locally and come back on the next launch.

## Show at game

1. Install Fabric Loader and Fabric API for your Minecraft version (26.2, 26.1, 1.21.11, or 1.21.1).
2. Put the matching jar from [seedgrid-marks releases](https://github.com/offjext/seedgrid-marks/releases) into `.minecraft/mods`.
3. Start Minecraft, then SeedGrid.
4. Click a structure (or a custom marker) and press **Show at game**.

The game draws a beam at X/Z, shows distance on the HUD, and keeps a list of marks (key **K**, or `/seedgrid list`). **Remove mark** clears that one. **Marks** in the bottom bar lists all of them.

Mod source: `mod/` in this repo, also published as [seedgrid-marks](https://github.com/offjext/seedgrid-marks).

SeedGrid writes `%appdata%/.minecraft/seedgrid/waypoints.json` and talks to `127.0.0.1:38471` while the mod is running.

## License

MIT. Cubiomes is used for biome and structure lookup; see that project's license for the library itself.
