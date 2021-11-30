
//--------------------------------------------------------------------------
//                          CODE BY DJtheRedstoner
//             IM COPYING THIS BECAUSE THE UPLOADED VERSION IS FOR
//                             CT 2.0.0 ONLY
//
//  Edit: iv added some features to this so might keep as is
//--------------------------------------------------------------------------



const GL11 = Java.type("org.lwjgl.opengl.GL11");
const GlStateManager = Java.type("net.minecraft.client.renderer.GlStateManager");

const BufferUtils = org.lwjgl.BufferUtils;
const Project = org.lwjgl.util.glu.Project;

const modelViewMatrix = BufferUtils.createFloatBuffer(16);
const projectionMatrix = BufferUtils.createFloatBuffer(16);
const viewportDims = BufferUtils.createIntBuffer(16);

const ScaledResolution = net.minecraft.client.gui.ScaledResolution;

const AxisAlignedBB = Java.type("net.minecraft.util.AxisAlignedBB")

register('renderWorld', () => {
    GlStateManager.func_179094_E();

	let x = Player.getX();
	let y = Player.getY();
	let z = Player.getZ();

	Tessellator.translate(-x, -y, -z);

	GL11.glGetFloat(GL11.GL_MODELVIEW_MATRIX, modelViewMatrix);
	GL11.glGetFloat(GL11.GL_PROJECTION_MATRIX, projectionMatrix);

	GlStateManager.func_179121_F();

	GL11.glGetInteger(GL11.GL_VIEWPORT, viewportDims);
});

export default class RenderLib2D {
    // Utils

    // Original made by DJtheRedstoner
    static projectPoint = (posX, posY, posZ) => {
        const coords = BufferUtils.createFloatBuffer(3);
        const success = Project.gluProject(
            posX,
            posY,
            posZ,
            modelViewMatrix,
            projectionMatrix,
            viewportDims,
            coords
        );
    
        const z = coords.get(2);
        if (!success || !(z > 0 && z < 1)) return null;
    
        const sr = new ScaledResolution(Client.getMinecraft());
    
        const x = coords.get(0) / sr.func_78325_e(); // getScaleFactor
        let y = coords.get(1) / sr.func_78325_e(); // getScaleFactor
        // OpenGL starts at bottom left, mc starts at top left
        y = sr.func_78328_b() - y; // getScaledHeight
    
        return { x, y, z };
    }

    static drawLine(x1, y1, z1, x2, y2, z2, color, thickness=1) {
        let pos1 = RenderLib2D.projectPoint(x1, y1, z1);
        let pos2 = RenderLib2D.projectPoint(x2, y2, z2);

        if(!pos1 || !pos2) return;

        let {x, y} = pos1
        let {x:ox, y:oy} = pos2

        console.log(x, y, ox, oy, thickness)
        Renderer.drawLine(color, x, y, ox, oy, thickness);
    }

    // Original made by DJtheRedstoner
    static calculateBoundingBox = (box) => {
        let vertices = RenderLib2D.getVertices(box);
    
        let x1 = java.lang.Float.MAX_VALUE;
        let x2 = 0;
        let y1 = java.lang.Float.MAX_VALUE;
        let y2 = 0;

        vertices.forEach(vertex => {
            let vec = RenderLib2D.projectPoint(vertex.x, vertex.y, vertex.z);
            if (vec == null) return null;
    
            let x = vec.x;
            let y = vec.y;
    
            if (x < x1) x1 = x;
            if (x > x2) x2 = x;
            if (y < y1) y1 = y;
            if (y > y2) y2 = y;
        });
    
        return { x1, y1, x2, y2 };
    }
    
    static getVertices = (box) => {
        let list = [];
    
        list.push({ x: box.field_72340_a, y: box.field_72338_b, z: box.field_72339_c });
        list.push({ x: box.field_72336_d, y: box.field_72338_b, z: box.field_72339_c });
        list.push({ x: box.field_72336_d, y: box.field_72337_e, z: box.field_72339_c });
        list.push({ x: box.field_72340_a, y: box.field_72337_e, z: box.field_72339_c });
        list.push({ x: box.field_72340_a, y: box.field_72338_b, z: box.field_72334_f });
        list.push({ x: box.field_72336_d, y: box.field_72338_b, z: box.field_72334_f });
        list.push({ x: box.field_72336_d, y: box.field_72337_e, z: box.field_72334_f });
        list.push({ x: box.field_72340_a, y: box.field_72337_e, z: box.field_72334_f });
    
        return list;
    }
    
    // Rendering Functions

    static drawNameTag = (vec, string) => {
        if (vec === null) return;
    
        Renderer.drawStringWithShadow(string, vec.x - Renderer.getStringWidth(string) / 2, vec.y);
    }

    static draw2DESP = (aabb, color, thickness) => {
        let bb = RenderLib2D.calculateBoundingBox(aabb);
    
        Renderer.drawLine(color, bb.x1, bb.y1, bb.x1, bb.y2, thickness);
        Renderer.drawLine(color, bb.x1, bb.y1, bb.x2, bb.y1, thickness);
        Renderer.drawLine(color, bb.x2, bb.y2, bb.x2, bb.y1, thickness);
        Renderer.drawLine(color, bb.x2, bb.y2, bb.x1, bb.y2, thickness);
    }

    static draw3DESP = (aabb, color, thickness) => {
        let vertices = RenderLib2D.getVertices(aabb);
        let projected = [];

        vertices.forEach(vertex => {
            let vec = RenderLib2D.projectPoint(vertex.x, vertex.y, vertex.z);
            if (vec == null) return null;
            projected.push(vec);
        });

        if (projected[0] && projected[1]) Renderer.drawLine(color, projected[0].x, projected[0].y, projected[1].x, projected[1].y, thickness);
        if (projected[0] && projected[4]) Renderer.drawLine(color, projected[0].x, projected[0].y, projected[4].x, projected[4].y, thickness);
        if (projected[5] && projected[1]) Renderer.drawLine(color, projected[5].x, projected[5].y, projected[1].x, projected[1].y, thickness);
        if (projected[5] && projected[4]) Renderer.drawLine(color, projected[5].x, projected[5].y, projected[4].x, projected[4].y, thickness);
        if (projected[3] && projected[2]) Renderer.drawLine(color, projected[3].x, projected[3].y, projected[2].x, projected[2].y, thickness);
        if (projected[3] && projected[7]) Renderer.drawLine(color, projected[3].x, projected[3].y, projected[7].x, projected[7].y, thickness);
        if (projected[6] && projected[2]) Renderer.drawLine(color, projected[6].x, projected[6].y, projected[2].x, projected[2].y, thickness);
        if (projected[6] && projected[7]) Renderer.drawLine(color, projected[6].x, projected[6].y, projected[7].x, projected[7].y, thickness);
        if (projected[1] && projected[2]) Renderer.drawLine(color, projected[1].x, projected[1].y, projected[2].x, projected[2].y, thickness);
        if (projected[0] && projected[3]) Renderer.drawLine(color, projected[0].x, projected[0].y, projected[3].x, projected[3].y, thickness);
        if (projected[4] && projected[7]) Renderer.drawLine(color, projected[4].x, projected[4].y, projected[7].x, projected[7].y, thickness);
        if (projected[5] && projected[6]) Renderer.drawLine(color, projected[5].x, projected[5].y, projected[6].x, projected[6].y, thickness);
    }

    static getBlockAABB = (x, y, z) => {
        return new AxisAlignedBB(x, y, z, x + 1, y + 1, z + 1);
    }
}
