package com.nullforge.seedgrid;

import net.fabricmc.api.ModInitializer;
import net.minecraft.resources.Identifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SeedGridMod implements ModInitializer {
	public static final String MOD_ID = "seedgrid";
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);
	public static final int BRIDGE_PORT = 38471;

	@Override
	public void onInitialize() {
	}

	public static Identifier id(String path) {
		return Identifier.fromNamespaceAndPath(MOD_ID, path);
	}
}
