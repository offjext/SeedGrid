package com.nullforge.seedgrid.client;

import net.minecraft.client.Camera;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import net.minecraft.world.phys.Vec3;
import org.joml.Vector3fc;

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

	public static Camera camera(Minecraft mc) {
		//? if >=26.2 {
		return mc.gameRenderer.mainCamera();
		//?} else {
		/*return mc.gameRenderer.getMainCamera();
		*///?}
	}

	public static Vec3 cameraPos(Camera cam) {
		//? if >=1.21.11 {
		return cam.position();
		//?} else {
		/*return cam.getPosition();
		*///?}
	}

	public static Vector3fc look(Camera cam) {
		//? if >=1.21.11 {
		return cam.forwardVector();
		//?} else {
		/*return cam.getLookVector();
		*///?}
	}

	public static Vector3fc up(Camera cam) {
		//? if >=1.21.11 {
		return cam.upVector();
		//?} else {
		/*return cam.getUpVector();
		*///?}
	}

	public static Vector3fc left(Camera cam) {
		//? if >=1.21.11 {
		return cam.leftVector();
		//?} else {
		/*return cam.getLeftVector();
		*///?}
	}

	public static int guiWidth(Minecraft mc) {
		return mc.getWindow().getGuiScaledWidth();
	}

	public static int guiHeight(Minecraft mc) {
		return mc.getWindow().getGuiScaledHeight();
	}

	public static double fov(Minecraft mc) {
		return mc.options.fov().get();
	}
}
