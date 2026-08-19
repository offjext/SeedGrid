package com.nullforge.seedgrid.client;

import net.minecraft.client.DeltaTracker;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphicsExtractor;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.resources.Identifier;
import net.fabricmc.fabric.api.client.rendering.v1.hud.HudElementRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.hud.VanillaHudElements;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class WaypointHud {
	private WaypointHud() {}

	public static void register() {
		HudElementRegistry.attachElementBefore(
			VanillaHudElements.CHAT,
			Identifier.fromNamespaceAndPath("seedgrid", "marks_hud"),
			WaypointHud::extract
		);
	}

	private static void extract(GuiGraphicsExtractor graphics, DeltaTracker tickCounter) {
		Minecraft mc = Minecraft.getInstance();
		LocalPlayer player = mc.player;
		if (player == null || mc.level == null) return;

		int dim = SeedGridClient.dimId(mc.level);
		List<Waypoint> list = new ArrayList<>();
		for (Waypoint w : WaypointStore.snapshot()) {
			if (w.dimension == dim) list.add(w);
		}
		if (list.isEmpty()) return;
		list.sort(Comparator.comparingDouble(w -> dist(player, w)));
		if (list.size() > 8) list = list.subList(0, 8);

		int line = mc.font.lineHeight + 2;
		int width = 0;
		List<String> lines = new ArrayList<>();
		lines.add("SeedGrid");
		for (Waypoint w : list) {
			int d = (int) Math.round(dist(player, w));
			String row = w.name + "  " + d + "m";
			lines.add(row);
			width = Math.max(width, mc.font.width(row));
		}
		width = Math.max(width, mc.font.width("SeedGrid"));
		int x = 6;
		int y = 6;
		int h = 4 + lines.size() * line;
		graphics.fill(x - 3, y - 3, x + width + 8, y + h, 0x88000000);
		for (int i = 0; i < lines.size(); i++) {
			int color = i == 0 ? 0xFFE8F0F8 : 0xFFFFFFFF;
			graphics.text(mc.font, lines.get(i), x, y + i * line, color, true);
		}
	}

	static double dist(LocalPlayer player, Waypoint w) {
		double dx = player.getX() - (w.x + 0.5);
		double dz = player.getZ() - (w.z + 0.5);
		return Math.sqrt(dx * dx + dz * dz);
	}
}
