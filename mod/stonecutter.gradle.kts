plugins {
	id("dev.kikugie.stonecutter")
}

stonecutter active "26.2.x"

stonecutter parameters {
	swaps["mod_version"] = "\"${property("mod.version")}\";"
	swaps["minecraft"] = "\"${node.metadata.version}\";"
	dependencies["fapi"] = node.project.property("deps.fabric_api") as String

	replacements {
		string(current.parsed < "1.21.11") {
			replace("net.minecraft.resources.Identifier", "net.minecraft.resources.ResourceLocation")
			replace("public static Identifier id", "public static ResourceLocation id")
			replace("return Identifier.fromNamespaceAndPath", "return ResourceLocation.fromNamespaceAndPath")
		}
	}
}
