package com.nullforge.seedgrid.client;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;

public final class ClientCompat {
	private ClientCompat() {}

	public static void setScreen(Minecraft mc, Screen screen) {
		//? if >=26.2 {
		mc.gui.setScreen(screen);
		//?} else {
		/*mc.setScreen(screen);
		*///?}
	}

	public static Screen screen(Minecraft mc) {
		//? if >=26.2 {
		return mc.gui.screen();
		//?} else {
		/*return mc.screen;
		*///?}
	}

	public static void overlay(Minecraft mc, String text) {
		mc.execute(() -> {
			//? if >=26.2 {
			if (mc.gui != null && mc.gui.hud != null) {
				mc.gui.hud.setOverlayMessage(Component.literal(text), false);
			}
			//?} else {
			/*if (mc.gui != null) {
				mc.gui.setOverlayMessage(Component.literal(text), false);
			}
			*///?}
		});
	}
}
