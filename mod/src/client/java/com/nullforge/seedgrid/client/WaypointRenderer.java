package com.nullforge.seedgrid.client;

import com.mojang.blaze3d.PrimitiveTopology;
import com.mojang.blaze3d.buffers.GpuBufferSlice;
import com.mojang.blaze3d.pipeline.RenderPipeline;
import com.mojang.blaze3d.pipeline.RenderTarget;
import com.mojang.blaze3d.systems.RenderPass;
import com.mojang.blaze3d.systems.RenderSystem;
import com.mojang.blaze3d.textures.GpuTextureView;
import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.blaze3d.vertex.VertexConsumer;
import com.mojang.blaze3d.vertex.VertexFormat;
import com.nullforge.seedgrid.SeedGridMod;
import net.minecraft.client.Minecraft;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.client.renderer.StagedVertexBuffer;
import net.minecraft.client.renderer.rendertype.RenderType;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;
import net.fabricmc.fabric.api.client.rendering.v1.level.LevelExtractionContext;
import net.fabricmc.fabric.api.client.rendering.v1.level.LevelExtractionEvents;
import net.fabricmc.fabric.api.client.rendering.v1.level.LevelRenderContext;
import net.fabricmc.fabric.api.client.rendering.v1.level.LevelRenderEvents;
import org.joml.Matrix4f;
import org.joml.Matrix4fc;
import org.joml.Vector3f;
import org.joml.Vector4f;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.OptionalDouble;

public final class WaypointRenderer {
	private static final RenderPipeline FILLED_THROUGH_WALLS = RenderPipelines.register(RenderPipeline.builder(RenderPipelines.DEBUG_FILLED_SNIPPET)
		.withLocation(SeedGridMod.id("pipeline/mark_beam"))
		.withDepthStencilState(Optional.empty())
		.build()
	);
	private static final Vector4f COLOR_MODULATOR = new Vector4f(1f, 1f, 1f, 1f);
	private static final Vector3f MODEL_OFFSET = new Vector3f();
	private static final Matrix4f TEXTURE_MATRIX = new Matrix4f();
	private static final StagedVertexBuffer BUFFER = new StagedVertexBuffer(() -> "SeedGrid Marks", RenderType.SMALL_BUFFER_SIZE);

	private static List<Beam> beams = List.of();

	private record Beam(float x, float y0, float y1, float z, float r, float g, float b, float a) {}

	private WaypointRenderer() {}

	public static void register() {
		LevelExtractionEvents.END_EXTRACTION.register(WaypointRenderer::extract);
		LevelRenderEvents.AFTER_TRANSLUCENT_TERRAIN.register(WaypointRenderer::draw);
	}

	private static void extract(LevelExtractionContext context) {
		Minecraft mc = Minecraft.getInstance();
		Level level = mc.level;
		List<Beam> next = new ArrayList<>();
		if (level != null) {
			int dim = SeedGridClient.dimId(level);
			for (Waypoint w : WaypointStore.snapshot()) {
				if (w.dimension != dim) continue;
				float[] rgb = w.rgb();
				float x = w.x + 0.5f;
				float z = w.z + 0.5f;
				next.add(new Beam(x, -64f, 320f, z, rgb[0], rgb[1], rgb[2], 0.38f));
			}
		}
		beams = List.copyOf(next);
	}

	private static void draw(LevelRenderContext context) {
		if (beams.isEmpty()) return;

		RenderPipeline pipeline = FILLED_THROUGH_WALLS;
		VertexFormat formatBinding = pipeline.getVertexFormatBinding(0);
		if (formatBinding == null) return;

		PrimitiveTopology primitive = pipeline.getPrimitiveTopology();
		StagedVertexBuffer.Draw draw = BUFFER.appendDraw(
			formatBinding,
			primitive,
			primitive == PrimitiveTopology.QUADS ? RenderSystem.getProjectionType().vertexSorting() : null
		);

		PoseStack matrices = context.poseStack();
		Vec3 camera = context.levelState().cameraRenderState.pos;
		matrices.pushPose();
		matrices.translate(-camera.x, -camera.y, -camera.z);
		VertexConsumer builder = BUFFER.getVertexBuilder(draw);
		Matrix4fc pose = matrices.last().pose();
		for (Beam b : beams) {
			float s = 0.18f;
			filledBox(pose, builder, b.x - s, b.y0, b.z - s, b.x + s, b.y1, b.z + s, b.r, b.g, b.b, b.a);
		}
		matrices.popPose();

		BUFFER.upload();
		StagedVertexBuffer.ExecuteInfo info = BUFFER.getExecuteInfo(draw);
		if (info != null) {
			submit(Minecraft.getInstance(), info, pipeline);
		}
		BUFFER.endFrame();
	}

	private static void filledBox(Matrix4fc m, VertexConsumer buf, float minX, float minY, float minZ, float maxX, float maxY, float maxZ, float r, float g, float b, float a) {
		buf.addVertex(m, minX, minY, maxZ).setColor(r, g, b, a);
		buf.addVertex(m, maxX, minY, maxZ).setColor(r, g, b, a);
		buf.addVertex(m, maxX, maxY, maxZ).setColor(r, g, b, a);
		buf.addVertex(m, minX, maxY, maxZ).setColor(r, g, b, a);

		buf.addVertex(m, maxX, minY, minZ).setColor(r, g, b, a);
		buf.addVertex(m, minX, minY, minZ).setColor(r, g, b, a);
		buf.addVertex(m, minX, maxY, minZ).setColor(r, g, b, a);
		buf.addVertex(m, maxX, maxY, minZ).setColor(r, g, b, a);

		buf.addVertex(m, minX, minY, minZ).setColor(r, g, b, a);
		buf.addVertex(m, minX, minY, maxZ).setColor(r, g, b, a);
		buf.addVertex(m, minX, maxY, maxZ).setColor(r, g, b, a);
		buf.addVertex(m, minX, maxY, minZ).setColor(r, g, b, a);

		buf.addVertex(m, maxX, minY, maxZ).setColor(r, g, b, a);
		buf.addVertex(m, maxX, minY, minZ).setColor(r, g, b, a);
		buf.addVertex(m, maxX, maxY, minZ).setColor(r, g, b, a);
		buf.addVertex(m, maxX, maxY, maxZ).setColor(r, g, b, a);

		buf.addVertex(m, minX, maxY, maxZ).setColor(r, g, b, a);
		buf.addVertex(m, maxX, maxY, maxZ).setColor(r, g, b, a);
		buf.addVertex(m, maxX, maxY, minZ).setColor(r, g, b, a);
		buf.addVertex(m, minX, maxY, minZ).setColor(r, g, b, a);

		buf.addVertex(m, minX, minY, minZ).setColor(r, g, b, a);
		buf.addVertex(m, maxX, minY, minZ).setColor(r, g, b, a);
		buf.addVertex(m, maxX, minY, maxZ).setColor(r, g, b, a);
		buf.addVertex(m, minX, minY, maxZ).setColor(r, g, b, a);
	}

	private static void submit(Minecraft client, StagedVertexBuffer.ExecuteInfo info, RenderPipeline pipeline) {
		GpuBufferSlice dynamicTransforms = RenderSystem.getDynamicUniforms()
			.writeTransform(RenderSystem.getModelViewMatrixCopy(), COLOR_MODULATOR, MODEL_OFFSET, TEXTURE_MATRIX);
		RenderTarget mainTarget = client.gameRenderer.mainRenderTarget();
		GpuTextureView colorTexture = mainTarget.getColorTextureView();
		if (colorTexture == null) return;

		try (RenderPass renderPass = RenderSystem.getDevice()
			.createCommandEncoder()
			.createRenderPass(() -> "seedgrid marks", colorTexture, Optional.empty(), mainTarget.getDepthTextureView(), OptionalDouble.empty())) {
			renderPass.setPipeline(pipeline);
			RenderSystem.bindDefaultUniforms(renderPass);
			renderPass.setUniform("DynamicTransforms", dynamicTransforms);
			renderPass.setVertexBuffer(0, info.vertexBuffer().slice());
			renderPass.setIndexBuffer(info.indexBuffer(), info.indexType());
			renderPass.drawIndexed(info.indexCount(), 1, info.firstIndex(), info.baseVertex(), 0);
		}
	}

	public static void close() {
		BUFFER.close();
	}
}
