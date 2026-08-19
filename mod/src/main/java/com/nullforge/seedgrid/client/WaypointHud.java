package com.nullforge.seedgrid.client;

import com.nullforge.seedgrid.SeedGridMod;
import net.minecraft.client.Camera;
import net.minecraft.client.Minecraft;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.world.phys.Vec3;
import org.joml.Vector3fc;
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

	private record WorldLabel(int x, int y, String letter, String title, String meters, int rgb) {}

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
		if (lines != null) {
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
		if (ClientCompat.screen(mc) instanceof WaypointScreen) return;
		for (WorldLabel mark : worldLabels(mc)) {
			paintPin(mc, graphics, mark);
		}
	}

	private static void paintPin(Minecraft mc, GuiGraphicsExtractor graphics, WorldLabel mark) {
		int rgb = 0xFF000000 | mark.rgb;
		int x = mark.x;
		int y = mark.y;
		float s = SeedGridConfig.markScale();
		int half = Math.max(4, Math.round(6 * s));
		int head = Math.max(8, Math.round(12 * s));
		int stem = Math.max(1, Math.round(2 * s));
		graphics.fill(x - half - 1, y - head - 1, x + half + 1, y - 3, 0xFF101010);
		graphics.fill(x - half, y - head, x + half, y - 4, rgb);
		graphics.fill(x - stem - 1, y - 4, x + stem + 1, y + stem + 2, 0xFF101010);
		graphics.fill(x - stem, y - 4, x + stem, y + stem + 1, rgb);
		graphics.text(mc.font, mark.letter, x - 3, y - head + 1, 0xFFFFFFFF, true);
		int tw = mc.font.width(mark.title);
		int tx = x + half + 3;
		graphics.fill(tx - 2, y - head - 1, tx + 4 + tw, y - 4, 0x99000000);
		graphics.text(mc.font, mark.title, tx, y - head, 0xFFFFFFFF, true);
		graphics.text(mc.font, mark.meters, tx, y - 4, 0xFFD0D0D0, true);
	}
	//?} else if >=1.21.6 {
	/*private static void extract(GuiGraphics graphics, DeltaTracker tickCounter) {
		draw(Minecraft.getInstance(), graphics);
	}

	private static void draw(Minecraft mc, GuiGraphics graphics) {
		List<String> lines = rows(mc);
		if (lines != null) {
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
		if (ClientCompat.screen(mc) instanceof WaypointScreen) return;
		for (WorldLabel mark : worldLabels(mc)) {
			paintPin(mc, graphics, mark);
		}
	}

	private static void paintPin(Minecraft mc, GuiGraphics graphics, WorldLabel mark) {
		int rgb = 0xFF000000 | mark.rgb;
		int x = mark.x;
		int y = mark.y;
		float s = SeedGridConfig.markScale();
		int half = Math.max(4, Math.round(6 * s));
		int head = Math.max(8, Math.round(12 * s));
		int stem = Math.max(1, Math.round(2 * s));
		graphics.fill(x - half - 1, y - head - 1, x + half + 1, y - 3, 0xFF101010);
		graphics.fill(x - half, y - head, x + half, y - 4, rgb);
		graphics.fill(x - stem - 1, y - 4, x + stem + 1, y + stem + 2, 0xFF101010);
		graphics.fill(x - stem, y - 4, x + stem, y + stem + 1, rgb);
		graphics.drawString(mc.font, mark.letter, x - 3, y - head + 1, 0xFFFFFFFF, true);
		int tw = mc.font.width(mark.title);
		int tx = x + half + 3;
		graphics.fill(tx - 2, y - head - 1, tx + 4 + tw, y - 4, 0x99000000);
		graphics.drawString(mc.font, mark.title, tx, y - head, 0xFFFFFFFF, true);
		graphics.drawString(mc.font, mark.meters, tx, y - 4, 0xFFD0D0D0, true);
	}
	*///?} else {
	/*private static void draw(Minecraft mc, GuiGraphics graphics) {
		List<String> lines = rows(mc);
		if (lines != null) {
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
		if (ClientCompat.screen(mc) instanceof WaypointScreen) return;
		for (WorldLabel mark : worldLabels(mc)) {
			int rgb = 0xFF000000 | mark.rgb;
			int x = mark.x;
			int y = mark.y;
			float s = SeedGridConfig.markScale();
			int half = Math.max(4, Math.round(6 * s));
			int head = Math.max(8, Math.round(12 * s));
			int stem = Math.max(1, Math.round(2 * s));
			graphics.fill(x - half - 1, y - head - 1, x + half + 1, y - 3, 0xFF101010);
			graphics.fill(x - half, y - head, x + half, y - 4, rgb);
			graphics.fill(x - stem - 1, y - 4, x + stem + 1, y + stem + 2, 0xFF101010);
			graphics.fill(x - stem, y - 4, x + stem, y + stem + 1, rgb);
			graphics.drawString(mc.font, mark.letter, x - 3, y - head + 1, 0xFFFFFFFF, true);
			int tw = mc.font.width(mark.title);
			int tx = x + half + 3;
			graphics.fill(tx - 2, y - head - 1, tx + 4 + tw, y - 4, 0x99000000);
			graphics.drawString(mc.font, mark.title, tx, y - head, 0xFFFFFFFF, true);
			graphics.drawString(mc.font, mark.meters, tx, y - 4, 0xFFD0D0D0, true);
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

	private static List<WorldLabel> worldLabels(Minecraft mc) {
		List<WorldLabel> out = new ArrayList<>();
		LocalPlayer player = mc.player;
		if (player == null || mc.level == null) return out;
		int dim = SeedGridClient.dimId(mc.level);
		Camera cam = ClientCompat.camera(mc);
		Vec3 eye = ClientCompat.cameraPos(cam);
		Vector3fc look = ClientCompat.look(cam);
		Vector3fc up = ClientCompat.up(cam);
		Vector3fc left = ClientCompat.left(cam);
		int sw = ClientCompat.guiWidth(mc);
		int sh = ClientCompat.guiHeight(mc);
		if (sw <= 0 || sh <= 0) return out;
		double fov = Math.toRadians(Math.max(30, Math.min(110, ClientCompat.fov(mc))));
		double hy = Math.tan(fov * 0.5);
		double hx = hy * ((double) sw / (double) sh);

		List<Waypoint> list = new ArrayList<>();
		for (Waypoint w : WaypointStore.snapshot()) {
			if (w.dimension == dim) list.add(w);
		}
		list.sort(Comparator.comparingDouble(w -> dist(player, w)));
		int n = 0;
		for (Waypoint w : list) {
			if (n >= 16) break;
			double wx = w.x + 0.5;
			double wy = w.y + 2.3;
			double wz = w.z + 0.5;
			double dx = wx - eye.x;
			double dy = wy - eye.y;
			double dz = wz - eye.z;
			double vz = dx * look.x() + dy * look.y() + dz * look.z();
			if (vz < 0.35) continue;
			double vx = -(dx * left.x() + dy * left.y() + dz * left.z());
			double vy = dx * up.x() + dy * up.y() + dz * up.z();
			double ndcX = vx / (vz * hx);
			double ndcY = vy / (vz * hy);
			if (ndcX < -1.2 || ndcX > 1.2 || ndcY < -1.2 || ndcY > 1.2) continue;
			int sx = (int) Math.round((ndcX * 0.5 + 0.5) * sw);
			int sy = (int) Math.round((0.5 - ndcY * 0.5) * sh);
			if (sx < 8 || sx > sw - 8 || sy < 20 || sy > sh - 8) continue;
			String name = w.name == null || w.name.isBlank() ? "Mark" : w.name;
			String letter = name.substring(0, 1).toUpperCase();
			float[] c = w.rgb();
			int rgb = ((int) (c[0] * 255) << 16) | ((int) (c[1] * 255) << 8) | (int) (c[2] * 255);
			int d = (int) Math.round(dist(player, w));
			out.add(new WorldLabel(sx, sy, letter, name, d + "m", rgb));
			n += 1;
		}
		return out;
	}

	static double dist(LocalPlayer player, Waypoint w) {
		double dx = player.getX() - (w.x + 0.5);
		double dz = player.getZ() - (w.z + 0.5);
		return Math.sqrt(dx * dx + dz * dz);
	}
}
