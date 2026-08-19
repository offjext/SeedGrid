package com.nullforge.seedgrid.client;

import com.mojang.blaze3d.platform.InputConstants;
import com.nullforge.seedgrid.SeedGridMod;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.command.v2.ClientCommands;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keymapping.v1.KeyMappingHelper;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.world.level.Level;

public class SeedGridClient implements ClientModInitializer {
	private static final KeyMapping.Category CATEGORY = KeyMapping.Category.register(
		Identifier.fromNamespaceAndPath(SeedGridMod.MOD_ID, "main")
	);
	private KeyMapping openMarks;
	private int watchTick;

	@Override
	public void onInitializeClient() {
		WaypointStore.loadFromDisk();
		WaypointBridge.start();
		WaypointRenderer.register();
		WaypointHud.register();

		this.openMarks = KeyMappingHelper.registerKeyMapping(new KeyMapping(
			"key.seedgrid.marks",
			InputConstants.Type.KEYSYM,
			InputConstants.KEY_K,
			CATEGORY
		));

		ClientTickEvents.END_CLIENT_TICK.register(client -> {
			while (this.openMarks.consumeClick()) {
				client.gui.setScreen(new WaypointScreen(client.gui.screen()));
			}
			this.watchTick += 1;
			if (this.watchTick % 40 == 0) {
				WaypointStore.tickWatch();
			}
		});

		ClientCommandRegistrationCallback.EVENT.register((dispatcher, access) -> {
			dispatcher.register(ClientCommands.literal("seedgrid")
				.then(ClientCommands.literal("list").executes(ctx -> {
					Minecraft mc = Minecraft.getInstance();
					mc.gui.setScreen(new WaypointScreen(mc.gui.screen()));
					return 1;
				}))
				.then(ClientCommands.literal("clear").executes(ctx -> {
					WaypointStore.clear();
					ctx.getSource().sendFeedback(Component.literal("Cleared SeedGrid marks"));
					return 1;
				}))
			);
		});
	}

	public static int dimId(Level level) {
		if (level == null) return 0;
		if (Level.NETHER.equals(level.dimension())) return -1;
		if (Level.END.equals(level.dimension())) return 1;
		return 0;
	}
}
