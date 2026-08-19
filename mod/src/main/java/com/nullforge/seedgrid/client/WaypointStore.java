package com.nullforge.seedgrid.client;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

public final class WaypointStore {
	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
	private static final ConcurrentHashMap<String, Waypoint> MARKS = new ConcurrentHashMap<>();
	private static volatile long seenMtime = -1L;
	private static volatile boolean writing;

	private WaypointStore() {}

	public static Path file() {
		return FabricLoader.getInstance().getGameDir().resolve("seedgrid").resolve("waypoints.json");
	}

	public static List<Waypoint> snapshot() {
		return new ArrayList<>(MARKS.values());
	}

	public static Waypoint get(String id) {
		return MARKS.get(id);
	}

	public static void upsert(Waypoint mark) {
		if (mark == null || mark.id == null || mark.id.isBlank()) return;
		if (mark.name == null || mark.name.isBlank()) mark.name = "Mark";
		MARKS.put(mark.id, mark);
		save();
	}

	public static void remove(String id) {
		if (id == null) return;
		MARKS.remove(id);
		save();
	}

	public static void clear() {
		MARKS.clear();
		save();
	}

	public static JsonObject toJson() {
		JsonObject root = new JsonObject();
		root.addProperty("v", 1);
		JsonArray arr = new JsonArray();
		for (Waypoint w : snapshot()) {
			arr.add(GSON.toJsonTree(w));
		}
		root.add("waypoints", arr);
		return root;
	}

	public static void save() {
		Path path = file();
		writing = true;
		try {
			Files.createDirectories(path.getParent());
			Files.writeString(path, GSON.toJson(toJson()), StandardCharsets.UTF_8);
			try {
				seenMtime = Files.getLastModifiedTime(path).toMillis();
			} catch (IOException ignored) {
			}
		} catch (IOException e) {
			// keep marks in memory even if the file cannot be written
		} finally {
			writing = false;
		}
	}

	public static void loadFromDisk() {
		Path path = file();
		if (!Files.isRegularFile(path)) return;
		try {
			long mtime = Files.getLastModifiedTime(path).toMillis();
			if (mtime == seenMtime) return;
			if (writing) return;
			String raw = Files.readString(path, StandardCharsets.UTF_8);
			JsonObject root = GSON.fromJson(raw, JsonObject.class);
			if (root == null || !root.has("waypoints")) return;
			MARKS.clear();
			for (var el : root.getAsJsonArray("waypoints")) {
				Waypoint w = GSON.fromJson(el, Waypoint.class);
				if (w != null && w.id != null && !w.id.isBlank()) MARKS.put(w.id, w);
			}
			seenMtime = mtime;
		} catch (Exception e) {
			// leave current in-memory list
		}
	}

	public static void tickWatch() {
		loadFromDisk();
	}
}
