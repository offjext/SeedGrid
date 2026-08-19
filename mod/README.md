# SeedGrid Marks

Fabric client mod for the SeedGrid map app. **Show at game** drops a mark in Minecraft.

Built with **Stonecutter** so one codebase makes jars for several Minecraft versions.

## Versions

| Minecraft | Jar name | World pin |
| --- | --- | --- |
| 26.2 | seedgrid-1.0.0+26.2.jar | yes |
| 26.1 | seedgrid-1.0.0+26.1.jar | HUD only |
| 1.21.11 | seedgrid-1.0.0+1.21.11.jar | HUD only |
| 1.21.1 | seedgrid-1.0.0+1.21.1.jar | HUD only |

HUD, name, distance, and mark size are the same on every version. The world pin uses the 26.2 render pipeline.

## Install

1. Fabric Loader + Fabric API for that Minecraft version
2. Matching jar into `.minecraft/mods`
3. Start the game, then SeedGrid, click a structure, **Show at game**

## Build every version

Needs Java 21+ (Java 25 for 26.x). From this folder:

```
gradlew.bat build
```

Jars land in `versions/<mc>/build/libs`.

Switch the sources you edit:

```
gradlew.bat "Set active project to 26.2.x"
```

## In game

- Distance list on the left, a pin with name in the world
- **K** opens the mark list
- Size - / + on that screen, or `/seedgrid size 1.5` (0.5 to 3)
- `/seedgrid list` and `/seedgrid clear`

## Adding another Minecraft version

See PORTING.md. You add a block in `stonecutter.properties.toml` and a line in `settings.gradle.kts`, then wrap API differences with `//? if >=x.y {`.

## License

MIT, Exempler201

App: https://github.com/offjext/SeedGrid
