package com.nullforge.seedgrid.client;

import com.mojang.blaze3d.platform.InputConstants;
import com.nullforge.seedgrid.SeedGridMod;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.network.chat.Component;
import net.minecraft.world.level.Level;
//? if >=26.1 {
import net.fabricmc.fabric.api.client.command.v2.ClientCommands;
import net.fabricmc.fabric.api.client.keymapping.v1.KeyMappingHelper;
//?} else {
/*import net.fabricmc.fabric.api.client.command.v2.ClientCommandManager;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
*///?}

public class SeedGridClient implements ClientModInitializer {
	//? if >=1.21.9 {
	private static final KeyMapping.Category CATEGORY = KeyMapping.Category.register(
		SeedGridMod.id("main")
	);
	//?}
	private KeyMapping openMarks;
	private int watchTick;

	@Override
	public void onInitializeClient() {
		WaypointStore.loadFromDisk();
		WaypointBridge.start();
		WaypointRenderer.register();
		WaypointHud.register();

		//? if >=26.1 {
		this.openMarks = KeyMappingHelper.registerKeyMapping(new KeyMapping(
			"key.seedgrid.marks",
			InputConstants.Type.KEYSYM,
			InputConstants.KEY_K,
			CATEGORY
		));
		//?} else if >=1.21.9 {
		/*this.openMarks = KeyBindingHelper.registerKeyBinding(new KeyMapping(
			"key.seedgrid.marks",
			InputConstants.Type.KEYSYM,
			InputConstants.KEY_K,
			CATEGORY
		));
		*///?} else {
		/*this.openMarks = KeyBindingHelper.registerKeyBinding(new KeyMapping(
			"key.seedgrid.marks",
			InputConstants.Type.KEYSYM,
			InputConstants.KEY_K,
			"key.categories.misc"
		));
		*///?}

		ClientTickEvents.END_CLIENT_TICK.register(client -> {
			while (this.openMarks.consumeClick()) {
				ClientCompat.setScreen(client, new WaypointScreen(ClientCompat.screen(client)));
			}
			this.watchTick += 1;
			if (this.watchTick % 40 == 0) {
				WaypointStore.tickWatch();
			}
		});

		ClientCommandRegistrationCallback.EVENT.register((dispatcher, access) -> {
			//? if >=26.1 {
			dispatcher.register(ClientCommands.literal("seedgrid")
				.then(ClientCommands.literal("list").executes(ctx -> {
					Minecraft mc = Minecraft.getInstance();
					ClientCompat.setScreen(mc, new WaypointScreen(ClientCompat.screen(mc)));
					return 1;
				}))
				.then(ClientCommands.literal("clear").executes(ctx -> {
					WaypointStore.clear();
					ctx.getSource().sendFeedback(Component.literal("Cleared SeedGrid marks"));
					return 1;
				}))
			);
			//?} else {
			/*dispatcher.register(ClientCommandManager.literal("seedgrid")
				.then(ClientCommandManager.literal("list").executes(ctx -> {
					Minecraft mc = Minecraft.getInstance();
					ClientCompat.setScreen(mc, new WaypointScreen(ClientCompat.screen(mc)));
					return 1;
				}))
				.then(ClientCommandManager.literal("clear").executes(ctx -> {
					WaypointStore.clear();
					ctx.getSource().sendFeedback(Component.literal("Cleared SeedGrid marks"));
					return 1;
				}))
			);
			*///?}
		});
	}

	public static int dimId(Level level) {
		if (level == null) return 0;
		if (Level.NETHER.equals(level.dimension())) return -1;
		if (Level.END.equals(level.dimension())) return 1;
		return 0;
	}
}
