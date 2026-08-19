# Porting SeedGrid Marks

The protocol does not depend on Minecraft:

- HTTP on 127.0.0.1:38471 (`/v1/waypoint`, `/v1/waypoints`, `/v1/clear`, `/v1/status`)
- File `.minecraft/seedgrid/waypoints.json`

Those live in `WaypointStore` and `WaypointBridge`. Leave them alone unless the JSON shape must change.

## What people usually bump

In `gradle.properties`:

```
minecraft_version=26.2
loader_version=0.19.3
loom_version=1.17-SNAPSHOT
fabric_api_version=0.157.0+26.2
```

Then:

1. Check https://fabricmc.net/develop for the new Loom, Loader, and Fabric API numbers.
2. Check the Fabric blog / docs "Porting to XX" page.
3. `gradlew genSources` and fix compile errors.

## Classes that break on a new version

These call Minecraft rendering and screens:

- `WaypointRenderer` - world beams (Fabric LevelRenderEvents)
- `WaypointHud` - distance text
- `WaypointScreen` - mark list
- `SeedGridClient` - keybind and `/seedgrid`
- `GameRendererMixin` - only if `GameRenderer.close` is renamed

HUD: `GuiGraphicsExtractor.text` / `fill`
Screen: `Button.builder`, `extractRenderState`
Keybind: `KeyMappingHelper` + `KeyMapping.Category.register`

## Multi-version later

Stonecutter or Architectury can keep one repo on several MC versions. Start from a working 26.2 tree, copy the version folder, change `gradle.properties`, then fix the files above.

Do not mix Overworld/Nether/End cell sizes in the desktop app when you add versions there. The mod only stores block X/Y/Z plus dimension id 0 / -1 / 1.
