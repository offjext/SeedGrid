# Porting SeedGrid Marks

This project uses Stonecutter (https://stonecutter.kikugie.dev) plus loom-back-compat. That is the usual Fabric way to keep one `src/` tree and emit a jar per Minecraft version.

## Add a version

1. `settings.gradle.kts` inside `stonecutter { create(rootProject) { ... } }`:

```
versions("1.21.1", "1.21.11", "1.22")
```

or `version("26.3.x", "26.3")` when the game id differs from the folder name.

2. `stonecutter.properties.toml`:

```
["26.3.x"]
mod.mc_compat = "~26.3"
mod.java = ">=25"
deps.fabric_api = "x.y.z+26.3"
```

Get Fabric API numbers from https://fabricmc.net/develop

3. `gradlew.bat` refresh. Fix compile errors with `//? if` in the Java files.

4. Keep `WaypointStore` and `WaypointBridge` untouched if you can. They only talk HTTP and a json file.

## Where code splits

- `>=26.2` - `Minecraft.gui.setScreen`, overlay on `gui.hud`, world beams
- `>=26.1` - `GuiGraphicsExtractor`, `KeyMappingHelper`, `ClientCommands`
- `>=1.21.9` - `KeyMapping.Category`
- `>=1.21.11` - `Identifier` instead of `ResourceLocation`
- `>=1.21.6` - `HudElementRegistry` instead of `HudRenderCallback`
- `>=26.1` - client commands class is `ClientCommands`, older is `ClientCommandManager`

Active checkout is 26.2.x. That is the file you edit. Stonecutter copies and strips branches for the other versions.

## Commands

```
gradlew.bat "Set active project to 1.21.1"
gradlew.bat :1.21.1:build
gradlew.bat :26.2.x:build
```
