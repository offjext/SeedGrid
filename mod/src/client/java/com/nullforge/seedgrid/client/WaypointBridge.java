package com.nullforge.seedgrid.client;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.nullforge.seedgrid.SeedGridMod;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import net.minecraft.client.Minecraft;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.network.chat.Component;
import net.minecraft.world.level.Level;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

public final class WaypointBridge {
	private static final Gson GSON = new Gson();
	private static HttpServer server;

	private WaypointBridge() {}

	public static void start() {
		if (server != null) return;
		try {
			server = HttpServer.create(new InetSocketAddress("127.0.0.1", SeedGridMod.BRIDGE_PORT), 0);
			server.createContext("/v1/status", WaypointBridge::status);
			server.createContext("/v1/waypoints", WaypointBridge::waypoints);
			server.createContext("/v1/waypoint", WaypointBridge::waypoint);
			server.createContext("/v1/clear", WaypointBridge::clear);
			server.setExecutor(Executors.newSingleThreadExecutor(r -> {
				Thread t = new Thread(r, "seedgrid-bridge");
				t.setDaemon(true);
				return t;
			}));
			server.start();
			SeedGridMod.LOGGER.info("SeedGrid bridge on 127.0.0.1:{}", SeedGridMod.BRIDGE_PORT);
		} catch (IOException e) {
			SeedGridMod.LOGGER.warn("Could not bind SeedGrid bridge: {}", e.getMessage());
			server = null;
		}
	}

	public static void stop() {
		if (server == null) return;
		server.stop(0);
		server = null;
	}

	private static void status(HttpExchange ex) throws IOException {
		if (preflight(ex)) return;
		if (!"GET".equals(ex.getRequestMethod())) {
			send(ex, 405, "{\"ok\":false}");
			return;
		}
		Minecraft mc = Minecraft.getInstance();
		JsonObject json = new JsonObject();
		json.addProperty("ok", true);
		LocalPlayer player = mc.player;
		Level level = mc.level;
		if (player == null || level == null) {
			json.addProperty("ingame", false);
		} else {
			json.addProperty("ingame", true);
			json.addProperty("dimension", SeedGridClient.dimId(level));
			json.addProperty("x", player.blockPosition().getX());
			json.addProperty("y", player.blockPosition().getY());
			json.addProperty("z", player.blockPosition().getZ());
		}
		send(ex, 200, json.toString());
	}

	private static void waypoints(HttpExchange ex) throws IOException {
		if (preflight(ex)) return;
		if (!"GET".equals(ex.getRequestMethod())) {
			send(ex, 405, "{\"ok\":false}");
			return;
		}
		send(ex, 200, WaypointStore.toJson().toString());
	}

	private static void waypoint(HttpExchange ex) throws IOException {
		if (preflight(ex)) return;
		String method = ex.getRequestMethod();
		if ("POST".equals(method) || "PUT".equals(method)) {
			String body = readBody(ex);
			Waypoint mark = GSON.fromJson(body, Waypoint.class);
			if (mark == null || mark.id == null || mark.id.isBlank()) {
				send(ex, 400, "{\"ok\":false}");
				return;
			}
			WaypointStore.upsert(mark);
			tell("SeedGrid: " + mark.name);
			send(ex, 200, WaypointStore.toJson().toString());
			return;
		}
		if ("DELETE".equals(method)) {
			String body = readBody(ex);
			JsonObject obj = GSON.fromJson(body, JsonObject.class);
			String id = obj != null && obj.has("id") ? obj.get("id").getAsString() : "";
			WaypointStore.remove(id);
			tell("SeedGrid: mark removed");
			send(ex, 200, WaypointStore.toJson().toString());
			return;
		}
		send(ex, 405, "{\"ok\":false}");
	}

	private static void clear(HttpExchange ex) throws IOException {
		if (preflight(ex)) return;
		if (!"POST".equals(ex.getRequestMethod()) && !"DELETE".equals(ex.getRequestMethod())) {
			send(ex, 405, "{\"ok\":false}");
			return;
		}
		WaypointStore.clear();
		tell("SeedGrid: all marks removed");
		send(ex, 200, WaypointStore.toJson().toString());
	}

	private static void tell(String text) {
		Minecraft mc = Minecraft.getInstance();
		mc.execute(() -> {
			if (mc.gui != null && mc.gui.hud != null) {
				mc.gui.hud.setOverlayMessage(Component.literal(text), false);
			}
		});
	}

	private static boolean preflight(HttpExchange ex) throws IOException {
		ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
		ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
		ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
		if ("OPTIONS".equals(ex.getRequestMethod())) {
			ex.sendResponseHeaders(204, -1);
			ex.close();
			return true;
		}
		return false;
	}

	private static String readBody(HttpExchange ex) throws IOException {
		try (InputStream in = ex.getRequestBody()) {
			return new String(in.readAllBytes(), StandardCharsets.UTF_8);
		}
	}

	private static void send(HttpExchange ex, int code, String body) throws IOException {
		byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
		ex.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
		ex.sendResponseHeaders(code, bytes.length);
		ex.getResponseBody().write(bytes);
		ex.close();
	}
}
