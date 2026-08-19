package com.nullforge.seedgrid.client;

public final class Waypoint {
	public String id = "";
	public String name = "Mark";
	public int x;
	public int y = 64;
	public int z;
	public int dimension;
	public String color = "#4a8fd8";
	public String key = "";

	public float[] rgb() {
		String hex = color == null ? "4a8fd8" : color.trim();
		if (hex.startsWith("#")) hex = hex.substring(1);
		if (hex.length() < 6) hex = "4a8fd8";
		try {
			int v = Integer.parseInt(hex.substring(0, 6), 16);
			return new float[] {
				((v >> 16) & 255) / 255f,
				((v >> 8) & 255) / 255f,
				(v & 255) / 255f
			};
		} catch (NumberFormatException e) {
			return new float[] { 0.29f, 0.56f, 0.85f };
		}
	}

	public String dimName() {
		if (dimension == -1) return "Nether";
		if (dimension == 1) return "End";
		return "Overworld";
	}
}
