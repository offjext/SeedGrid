package com.nullforge.seedgrid.client;

import net.minecraft.client.gui.GuiGraphicsExtractor;
import net.minecraft.client.gui.components.Button;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.network.chat.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class WaypointScreen extends Screen {
	private final Screen parent;

	public WaypointScreen(Screen parent) {
		super(Component.translatable("seedgrid.screen.marks"));
		this.parent = parent;
	}

	@Override
	protected void init() {
		LocalPlayer player = this.minecraft != null ? this.minecraft.player : null;
		int dim = this.minecraft != null && this.minecraft.level != null
			? SeedGridClient.dimId(this.minecraft.level)
			: 0;

		List<Waypoint> list = new ArrayList<>(WaypointStore.snapshot());
		list.sort(Comparator.comparing(w -> w.name == null ? "" : w.name.toLowerCase()));

		int top = 32;
		int rowH = 22;
		int max = Math.max(1, (this.height - 70) / rowH);
		int shown = 0;
		for (Waypoint w : list) {
			if (shown >= max) break;
			int y = top + shown * rowH;
			String dist = "";
			if (player != null && w.dimension == dim) {
				dist = "  " + (int) Math.round(WaypointHud.dist(player, w)) + "m";
			}
			String label = (w.name == null ? "Mark" : w.name)
				+ "  " + w.x + " " + w.z
				+ "  " + w.dimName()
				+ dist;
			if (label.length() > 42) label = label.substring(0, 41) + "...";
			this.addRenderableWidget(Button.builder(Component.literal("X"), btn -> {
				WaypointStore.remove(w.id);
				this.rebuildWidgets();
			}).bounds(this.width / 2 + 120, y, 20, 20).build());
			this.addRenderableWidget(Button.builder(Component.literal(label), btn -> {})
				.bounds(this.width / 2 - 140, y, 256, 20)
				.build());
			shown += 1;
		}

		this.addRenderableWidget(Button.builder(Component.literal("Remove all"), btn -> {
			WaypointStore.clear();
			this.rebuildWidgets();
		}).bounds(this.width / 2 - 140, this.height - 28, 100, 20).build());

		this.addRenderableWidget(Button.builder(Component.literal("Close"), btn -> this.onClose())
			.bounds(this.width / 2 + 40, this.height - 28, 100, 20)
			.build());
	}

	@Override
	public void extractRenderState(GuiGraphicsExtractor graphics, int mouseX, int mouseY, float delta) {
		super.extractRenderState(graphics, mouseX, mouseY, delta);
		graphics.centeredText(this.font, this.title, this.width / 2, 12, 0xFFFFFFFF, true);
		if (WaypointStore.snapshot().isEmpty()) {
			graphics.centeredText(this.font, Component.literal("No marks"), this.width / 2, this.height / 2 - 10, 0xFFAAAAAA, false);
		}
	}

	@Override
	public void onClose() {
		if (this.minecraft != null) this.minecraft.setScreen(this.parent);
	}
}
