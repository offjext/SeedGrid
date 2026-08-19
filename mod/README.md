# SeedGrid Marks (Fabric 26.2)

Client mod for the SeedGrid map app. Click **Show at game** on a structure and a beam shows up in Minecraft, with distance on the HUD.

## Install

1. Minecraft Java **26.2**
2. Fabric Loader **0.19.3** or newer
3. Fabric API for 26.2
4. Drop the jar from `build/libs` into `.minecraft/mods`

Build:

```
gradlew.bat build
```

Needs **Java 25**. Gradle can download that JDK through the toolchain if your `java` command is older.

Jar: `build/libs/seedgrid-1.0.0.jar`

## In game

- Beams at the mark X/Z, visible through walls
- Distance list on the left
- **K** opens the mark list (change in Controls)
- `/seedgrid list` same screen
- `/seedgrid clear` removes every mark
- Each row has **X** to delete that mark

SeedGrid writes `%appdata%/.minecraft/seedgrid/waypoints.json` and talks to `127.0.0.1:38471` while this mod is running. If the game is closed, the file is still there for the next launch.

## Porting to other versions

See PORTING.md. Keep `WaypointStore` / `WaypointBridge` and only touch renderer, HUD, and screen classes when mappings change.

Mod source lives with the SeedGrid app: https://github.com/offjext/SeedGrid (folder `mod/`). This repo is the same Fabric project on its own so you can clone just the mod.

MIT, NullForge
