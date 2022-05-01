const { f, m } = require("../../mappings/mappings");

const { default: renderBeaconBeam2 } = require("../../BeaconBeam/index");
const numberUtils = require("./numberUtils");
const { default: RenderLib2D } = require("./renderLib2d");

if (!GlStateManager) {
    var GL11 = Java.type("org.lwjgl.opengl.GL11"); //using var so it goes to global scope
    var GlStateManager = Java.type("net.minecraft.client.renderer.GlStateManager");
}
let ret = {

    /* accepts parameters
     * h  Object = {h:x, s:y, v:z}
     * OR
     * h, s, v
    */
    HSVtoRGB: function (h, s, v) {
        var r, g, b, i, f, p, q, t;
        if (arguments.length === 1) {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return {
            r: r * 255,
            g: g * 255,
            b: b * 255
        };
    },
    drawLine: function (x, y, z, x2, y2, z2, r, g, b, thickness = 1) {

        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(thickness);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GL11.glDisable(GL11.GL_DEPTH_TEST);
        GL11.glDepthMask(false);
        GlStateManager.func_179094_E();

        Tessellator.begin(2).colorize(r, g, b);

        Tessellator.pos(x, y, z);
        Tessellator.pos(x2, y2, z2);

        Tessellator.draw();


        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glEnable(GL11.GL_DEPTH_TEST);
        GL11.glDepthMask(true);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawLineWithDepth: function (x, y, z, x2, y2, z2, r, g, b, t = 1) {

        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(t);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(false);
        GlStateManager.func_179094_E();

        Tessellator.begin(2).colorize(r, g, b);

        Tessellator.pos(x, y, z);
        Tessellator.pos(x2, y2, z2);

        Tessellator.draw();


        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(true);
        GL11.glDisable(GL11.GL_BLEND);
    },
    setupLineSmall: function (width) {
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(width);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(false);
        GlStateManager.func_179094_E();
    },
    endLineSmall: function () {
        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(true);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawLineSmall: function (x, y, z, x2, y2, z2, r, g, b) {

        Tessellator.begin(2).colorize(r, g, b);

        Tessellator.pos(x, y, z);
        Tessellator.pos(x2, y2, z2);

        Tessellator.draw();
    },
    drawLinePoints: function (locations, r, g, b, thickness = 1) {
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(thickness);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(false);
        GlStateManager.func_179094_E();

        Tessellator.begin(2).colorize(r, g, b);

        locations.forEach(loc => {
            Tessellator.pos(...loc);
        });

        Tessellator.draw();


        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(true);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawBoxAtBlockNotVisThruWalls: function (x, y, z, colorR, colorG, colorB, w = 1, h = 1, a = 1) {
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(3);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GlStateManager.func_179094_E();

        x -= 0.005
        y -= 0.005
        z -= 0.005
        w += 0.01
        h += 0.01

        Tessellator.begin(2).colorize(colorR, colorG, colorB, a);

        Tessellator.pos(x + w, y + h, z + w);
        Tessellator.pos(x + w, y + h, z);
        Tessellator.pos(x, y + h, z);
        Tessellator.pos(x, y + h, z + w);
        Tessellator.pos(x + w, y + h, z + w);
        Tessellator.pos(x + w, y, z + w);
        Tessellator.pos(x + w, y, z);
        Tessellator.pos(x, y, z);
        Tessellator.pos(x, y, z + w);
        Tessellator.pos(x, y, z);
        Tessellator.pos(x, y + h, z);
        Tessellator.pos(x, y, z);
        Tessellator.pos(x + w, y, z);
        Tessellator.pos(x + w, y + h, z);
        Tessellator.pos(x + w, y, z);
        Tessellator.pos(x + w, y, z + w);
        Tessellator.pos(x, y, z + w);
        Tessellator.pos(x, y + h, z + w);
        Tessellator.pos(x + w, y + h, z + w);

        Tessellator.draw();

        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawBoxAtBlock: function (x, y, z, colorR, colorG, colorB, w = 1, h = 1, a = 1) {

        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(3);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GL11.glDisable(GL11.GL_DEPTH_TEST);
        GL11.glDepthMask(false);
        GlStateManager[m.pushMatrix]()


        Tessellator.begin(2).colorize(colorR, colorG, colorB, a);

        Tessellator.pos(x + w, y + h, z + w);
        Tessellator.pos(x + w, y + h, z);
        Tessellator.pos(x, y + h, z);
        Tessellator.pos(x, y + h, z + w);
        Tessellator.pos(x + w, y + h, z + w);
        Tessellator.pos(x + w, y, z + w);
        Tessellator.pos(x + w, y, z);
        Tessellator.pos(x, y, z);
        Tessellator.pos(x, y, z + w);
        Tessellator.pos(x, y, z);
        Tessellator.pos(x, y + h, z);
        Tessellator.pos(x, y, z);
        Tessellator.pos(x + w, y, z);
        Tessellator.pos(x + w, y + h, z);
        Tessellator.pos(x + w, y, z);
        Tessellator.pos(x + w, y, z + w);
        Tessellator.pos(x, y, z + w);
        Tessellator.pos(x, y + h, z + w);
        Tessellator.pos(x + w, y + h, z + w);

        Tessellator.draw();

        GlStateManager[m.popMatrix]()
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glEnable(GL11.GL_DEPTH_TEST);
        GL11.glDepthMask(true);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawBoxAtEntity: function (entity, colorR, colorG, colorB, width, height, partialTicks, lineWidth = 2, phase = false) {
        let x = entity.getX() + ((entity.getX() - entity.getLastX()) * partialTicks)
        let y = entity.getY() + ((entity.getY() - entity.getLastY()) * partialTicks)
        let z = entity.getZ() + ((entity.getZ() - entity.getLastZ()) * partialTicks)

        if (width === null) {
            width = entity.getWidth() / 2
            height = entity.getHeight()
        } else {
            width = width / 2
        }


        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(lineWidth);
        if (phase) GL11.glDisable(GL11.GL_DEPTH_TEST);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GlStateManager.func_179094_E();


        Tessellator.begin(2).colorize(colorR, colorG, colorB);

        Tessellator.pos(x + width, y + height, z + width);
        Tessellator.pos(x + width, y + height, z - width);
        Tessellator.pos(x - width, y + height, z - width);
        Tessellator.pos(x - width, y + height, z + width);
        Tessellator.pos(x + width, y + height, z + width);
        Tessellator.pos(x + width, y, z + width);
        Tessellator.pos(x + width, y, z - width);
        Tessellator.pos(x - width, y, z - width);
        Tessellator.pos(x - width, y, z + width);
        Tessellator.pos(x - width, y, z - width);
        Tessellator.pos(x - width, y + height, z - width);
        Tessellator.pos(x - width, y, z - width);
        Tessellator.pos(x + width, y, z - width);
        Tessellator.pos(x + width, y + height, z - width);
        Tessellator.pos(x + width, y, z - width);
        Tessellator.pos(x + width, y, z + width);
        Tessellator.pos(x - width, y, z + width);
        Tessellator.pos(x - width, y + height, z + width);
        Tessellator.pos(x + width, y + height, z + width);

        Tessellator.draw();

        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        if (phase) GL11.glEnable(GL11.GL_DEPTH_TEST);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawFilledBox: function (x, y, z, w, h, red, green, blue, alpha, phase) { //FROM RENDERUTILS
        GL11.glDisable(GL11.GL_CULL_FACE);
        if (phase) {
            GL11.glBlendFunc(770, 771);
            GL11.glEnable(GL11.GL_BLEND);
            GL11.glLineWidth(2.0);
            GL11.glDisable(GL11.GL_TEXTURE_2D);
            GL11.glDisable(GL11.GL_DEPTH_TEST);
            GL11.glDepthMask(false);
            GlStateManager.func_179094_E();
        } else {
            GL11.glDisable(GL11.GL_TEXTURE_2D);
            GL11.glBlendFunc(770, 771);
            GL11.glEnable(GL11.GL_BLEND);
            GL11.glLineWidth(2.0);
            GL11.glDepthMask(false);
            GlStateManager.func_179094_E();
        }

        w /= 2;

        Tessellator.begin(GL11.GL_QUADS, false);
        Tessellator.colorize(red, green, blue, alpha);

        Tessellator.translate(x, y, z)
            .pos(w, 0, w)
            .pos(w, 0, -w)
            .pos(-w, 0, -w)
            .pos(-w, 0, w)

            .pos(w, h, w)
            .pos(w, h, -w)
            .pos(-w, h, -w)
            .pos(-w, h, w)

            .pos(-w, h, w)
            .pos(-w, h, -w)
            .pos(-w, 0, -w)
            .pos(-w, 0, w)

            .pos(w, h, w)
            .pos(w, h, -w)
            .pos(w, 0, -w)
            .pos(w, 0, w)

            .pos(w, h, -w)
            .pos(-w, h, -w)
            .pos(-w, 0, -w)
            .pos(w, 0, -w)

            .pos(-w, h, w)
            .pos(w, h, w)
            .pos(w, 0, w)
            .pos(-w, 0, w)
            .draw();

        GL11.glEnable(GL11.GL_CULL_FACE);
        if (phase) {
            GlStateManager.func_179121_F();
            GL11.glEnable(GL11.GL_TEXTURE_2D);
            GL11.glEnable(GL11.GL_DEPTH_TEST);
            GL11.glDepthMask(true);
            GL11.glDisable(GL11.GL_BLEND);
        } else {
            GL11.glEnable(GL11.GL_TEXTURE_2D);
            GlStateManager.func_179121_F();
            GL11.glDepthMask(true);
            GL11.glDisable(GL11.GL_BLEND);
        }
    },
    renderBeaconBeam(x, y, z, r, g, b, alpha, phase) {
        renderBeaconBeam2(x, y, z, r, g, b, alpha, !phase)
    },
    drawCoolWaypoint(x, y, z, r, g, b, { name = "", showDist = !!name, phase = false }) {
        let distToPlayerSq = (x - Player.getRenderX()) ** 2 + (y - (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]())) ** 2 + (z - Player.getRenderZ()) ** 2

        let alpha = Math.min(1, Math.max(0, 1 - (distToPlayerSq - 10000) / 12500))

        ret[phase ? "drawBoxAtBlock" : "drawBoxAtBlockNotVisThruWalls"](x - 0.005, y - 0.005, z - 0.005, r, g, b, 1.01, 1.01, alpha)
        ret.drawFilledBox(x + 0.5, y, z + 0.5, 1.02, 1.01, r, g, b, 0.25 * alpha, phase)
        renderBeaconBeam2(x, y + 1, z, r, g, b, Math.min(1, Math.max(0, (distToPlayerSq - 25) / 100)) * alpha, true)

        if (name || showDist) {
            let distToPlayer = Math.sqrt(distToPlayerSq)

            let distRender = Math.min(distToPlayer, 50)

            let loc5 = [Player.getRenderX() + (x + 0.5 - Player.getRenderX()) / (distToPlayer / distRender), (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]()) + (y + 2 + 20 * distToPlayer / 300 - (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]())) / (distToPlayer / distRender), Player.getRenderZ() + (z + 0.5 - Player.getRenderZ()) / (distToPlayer / distRender)]
            let loc6 = [Player.getRenderX() + (x + 0.5 - Player.getRenderX()) / (distToPlayer / distRender), (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]()) + (y + 2 + 20 * distToPlayer / 300 - 10 * distToPlayer / 300 - (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]())) / (distToPlayer / distRender), Player.getRenderZ() + (z + 0.5 - Player.getRenderZ()) / (distToPlayer / distRender)]

            if (name) Tessellator.drawString("§a" + name, loc5[0], loc5[1], loc5[2], 0, true, distRender / 300, false)
            if (showDist) Tessellator.drawString("§b(" + numberUtils.numberWithCommas(Math.round(distToPlayer)) + "m)", (name ? loc6[0] : loc5[0]), (name ? loc6[1] : loc5[1]), (name ? loc6[2] : loc5[2]), 0, false, distRender / 300, false)
        }
    }
}

module.exports = ret