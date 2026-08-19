plugins {
	id("dev.kikugie.loom-back-compat")
}

version = "${property("mod.version")}+${sc.current.version}"
base.archivesName = property("mod.id") as String

val requiredJava: JavaVersion = when {
	sc.current.parsed >= "26.1" -> JavaVersion.VERSION_25
	else -> JavaVersion.VERSION_21
}

repositories {
}

dependencies {
	minecraft("com.mojang:minecraft:${sc.current.version}")
	loomx.applyMojangMappings()
	modImplementation("net.fabricmc:fabric-loader:${property("deps.fabric_loader")}")
	modImplementation("net.fabricmc.fabric-api:fabric-api:${sc.properties["deps.fabric_api"] as String}")
}

loom {
	runConfigs.all {
		preferGradleTask = true
		generateRunConfig = true
		runDirectory = rootProject.file("run")
	}
}

java {
	withSourcesJar()
	targetCompatibility = requiredJava
	sourceCompatibility = requiredJava
	toolchain {
		vendor = JvmVendorSpec.ADOPTIUM
		languageVersion = JavaLanguageVersion.of(requiredJava.majorVersion)
	}
}

tasks {
	processResources {
		val id: String = sc.properties["mod.id"]
		val name: String = sc.properties["mod.name"]
		val ver: String = sc.properties["mod.version"]
		val mc: String = sc.properties["mod.mc_compat"]
		val javaDep: String = sc.properties["mod.java"]
		val props = mapOf(
			"id" to id,
			"name" to name,
			"version" to ver,
			"minecraft" to mc,
			"java" to javaDep,
			"java_mixin" to "JAVA_${requiredJava.majorVersion}"
		)
		inputs.properties(props)
		filesMatching("fabric.mod.json") { expand(props) }
		filesMatching("*.mixins.json") { expand("java_mixin" to props.getValue("java_mixin")) }
	}

	register<Copy>("buildAndCollect") {
		group = "build"
		description = "Build this version and copy the jar to build/libs"
		from(loomx.modJar.flatMap { it.archiveFile })
		into(rootProject.layout.buildDirectory.dir("libs"))
	}
}
