package com.nullforge.seedgrid.client;

import com.nullforge.seedgrid.SeedGridMod;
import net.minecraft.client.Minecraft;
import net.minecraft.client.player.LocalPlayer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

//? if >=26.1 {
import net.minecraft.client.DeltaTracker;
import net.minecraft.client.gui.GuiGraphicsExtractor;
import net.fabricmc.fabric.api.client.rendering.v1.hud.HudElementRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.hud.VanillaHudElements;
//?} else if >=1.21.6 {
/*import net.minecraft.client.DeltaTracker;
import net.minecraft.client.gui.GuiGraphics;
import net.fabricmc.fabric.api.client.rendering.v1.hud.HudElementRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.hud.VanillaHudElements;
*///?} else {
/*import net.minecraft.client.gui.GuiGraphics;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
*///?}

public final class WaypointHud {
	private WaypointHud() {}

	public static void register() {
		//? if >=1.21.6 {
		HudElementRegistry.attachElementBefore(
			VanillaHudElements.CHAT,
			SeedGridMod.id("marks_hud"),
			WaypointHud::extract
		);
		//?} else {
		/*HudRenderCallback.EVENT.register((graphics, tickDelta) -> draw(Minecraft.getInstance(), graphics));
		*///?}
	}

	//? if >=26.1 {
	private static void extract(GuiGraphicsExtractor graphics, DeltaTracker tickCounter) {
		draw(Minecraft.getInstance(), graphics);
	}

	private static void draw(Minecraft mc, GuiGraphicsExtractor graphics) {
		List<String> lines = rows(mc);
		if (lines == null) return;
		int line = mc.font.lineHeight + 2;
		int width = 0;
		for (String row : lines) width = Math.max(width, mc.font.width(row));
		int x = 6;
		int y = 6;
		int h = 4 + lines.size() * line;
		graphics.fill(x - 3, y - 3, x + width + 8, y + h, 0x88000000);
		for (int i = 0; i < lines.size(); i++) {
			int color = i == 0 ? 0xFFE8F0F8 : 0xFFFFFFFF;
			graphics.text(mc.font, lines.get(i), x, y + i * line, color, true);
		}
	}
	//?} else if >=1.21.6 {
	/*private static void extract(GuiGraphics graphics, DeltaTracker tickCounter) {
		draw(Minecraft.getInstance(), graphics);
	}

	private static void draw(Minecraft mc, GuiGraphics graphics) {
		List<String> lines = rows(mc);
		if (lines == null) return;
		int line = mc.font.lineHeight + 2;
		int width = 0;
		for (String row : lines) width = Math.max(width, mc.font.width(row));
		int x = 6;
		int y = 6;
		int h = 4 + lines.size() * line;
		graphics.fill(x - 3, y - 3, x + width + 8, y + h, 0x88000000);
		for (int i = 0; i < lines.size(); i++) {
			int color = i == 0 ? 0xFFE8F0F8 : 0xFFFFFFFF;
			graphics.drawString(mc.font, lines.get(i), x, y + i * line, color, true);
		}
	}
	*///?} else {
	/*private static void draw(Minecraft mc, GuiGraphics graphics) {
		List<String> lines = rows(mc);
		if (lines == null) return;
		int line = mc.font.lineHeight + 2;
		int width = 0;
		for (String row : lines) width = Math.max(width, mc.font.width(row));
		int x = 6;
		int y = 6;
		int h = 4 + lines.size() * line;
		graphics.fill(x - 3, y - 3, x + width + 8, y + h, 0x88000000);
		for (int i = 0; i < lines.size(); i++) {
			int color = i == 0 ? 0xFFE8F0F8 : 0xFFFFFFFF;
			graphics.drawString(mc.font, lines.get(i), x, y + i * line, color, true);
		}
	}
	*///?}

	private static List<String> rows(Minecraft mc) {
		LocalPlayer player = mc.player;
		if (player == null || mc.level == null) return null;

		int dim = SeedGridClient.dimId(mc.level);
		List<Waypoint> list = new ArrayList<>();
		for (Waypoint w : WaypointStore.snapshot()) {
			if (w.dimension == dim) list.add(w);
		}
		if (list.isEmpty()) return null;
		list.sort(Comparator.comparingDouble(w -> dist(player, w)));
		if (list.size() > 8) list = list.subList(0, 8);

		List<String> lines = new ArrayList<>();
		lines.add("SeedGrid");
		for (Waypoint w : list) {
			int d = (int) Math.round(dist(player, w));
			lines.add(w.name + "  " + d + "m");
		}
		return lines;
	}

	static double dist(LocalPlayer player, Waypoint w) {
		double dx = player.getX() - (w.x + 0.5);
		double dz = player.getZ() - (w.z + 0.5);
		return Math.sqrt(dx * dx + dz * dz);
	}
}
