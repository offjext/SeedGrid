package com.nullforge.seedgrid.client;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import net.fabricmc.loader.api.FabricLoader;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public final class SeedGridConfig {
	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
	private static float markScale = 1f;

	private SeedGridConfig() {}

	public static Path file() {
		return FabricLoader.getInstance().getGameDir().resolve("seedgrid").resolve("config.json");
	}

	public static float markScale() {
		return markScale;
	}

	public static void setScale(float value) {
		markScale = clamp(value);
		save();
	}

	public static void load() {
		Path path = file();
		if (!Files.isRegularFile(path)) return;
		try {
			JsonObject json = GSON.fromJson(Files.readString(path, StandardCharsets.UTF_8), JsonObject.class);
			if (json != null && json.has("markScale")) {
				markScale = clamp(json.get("markScale").getAsFloat());
			}
		} catch (Exception e) {
			markScale = 1f;
		}
	}

	public static void save() {
		try {
			Files.createDirectories(file().getParent());
			JsonObject json = new JsonObject();
			json.addProperty("markScale", markScale);
			Files.writeString(file(), GSON.toJson(json), StandardCharsets.UTF_8);
		} catch (Exception e) {
			// keep the in-memory value
		}
	}

	private static float clamp(float value) {
		if (value < 0.5f) return 0.5f;
		if (value > 3f) return 3f;
		return Math.round(value * 20f) / 20f;
	}
}
