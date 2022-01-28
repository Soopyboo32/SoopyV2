const { f, m } = require("../../mappings/mappings");

if(!GlStateManager){
    var GL11 = Java.type("org.lwjgl.opengl.GL11"); //using var so it goes to global scope
    var GlStateManager = Java.type("net.minecraft.client.renderer.GlStateManager");
}
module.exports = {

    /* accepts parameters
     * h  Object = {h:x, s:y, v:z}
     * OR
     * h, s, v
    */
    HSVtoRGB:function (h, s, v) {
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
    drawLine:function (x, y, z, x2, y2, z2, r, g, b, thickness=1) {
    
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(thickness);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GL11.glDisable(GL11.GL_DEPTH_TEST);
        GL11.glDepthMask(false);
        GlStateManager.func_179094_E();
    
        Tessellator.begin(3).colorize(r, g, b);
    
        Tessellator.pos(x, y, z);
        Tessellator.pos(x2, y2, z2);
    
        Tessellator.draw();
    
    
        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glEnable(GL11.GL_DEPTH_TEST);
        GL11.glDepthMask(true);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawLineWithDepth:function (x, y, z, x2, y2, z2, r, g, b,t) {
    
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(t);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(false);
        GlStateManager.func_179094_E();
    
        Tessellator.begin(3).colorize(r, g, b);
    
        Tessellator.pos(x, y, z);
        Tessellator.pos(x2, y2, z2);
    
        Tessellator.draw();
    
    
        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(true);
        GL11.glDisable(GL11.GL_BLEND);
    },
    setupLineSmall: function(width){
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(width);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(false);
        GlStateManager.func_179094_E();
    },
    endLineSmall: function(){
        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(true);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawLineSmall:function (x, y, z, x2, y2, z2, r, g, b) {
    
        Tessellator.begin(3).colorize(r, g, b);
    
        Tessellator.pos(x, y, z);
        Tessellator.pos(x2, y2, z2);
    
        Tessellator.draw();
    },
    drawLinePoints: function(locations, r, g, b, thickness=1){
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(thickness);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(false);
        GlStateManager.func_179094_E();
    
        Tessellator.begin(3).colorize(r, g, b);
    
        locations.forEach(loc => {
            Tessellator.pos(...loc);
        });
    
        Tessellator.draw();
    
    
        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glDepthMask(true);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawBoxAtBlockNotVisThruWalls:function (x, y, z, colorR, colorG, colorB){
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(3);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GlStateManager.func_179094_E();
    
        x -= 0.005
        y -= 0.005
        z -= 0.005
        
        Tessellator.begin(3).colorize(colorR, colorG, colorB);
            
        Tessellator.pos(x+1.01,y+1.01,z+1.01);
        Tessellator.pos(x+1.01,y+1.01,z);
        Tessellator.pos(x,y+1.01,z);
        Tessellator.pos(x,y+1.01,z+1.01);
        Tessellator.pos(x+1.01,y+1.01,z+1.01);
        Tessellator.pos(x+1.01,y,z+1.01);
        Tessellator.pos(x+1.01,y,z);
        Tessellator.pos(x,y,z);
        Tessellator.pos(x,y,z+1.01);
        Tessellator.pos(x,y,z);
        Tessellator.pos(x,y+1.01,z);
        Tessellator.pos(x,y,z);
        Tessellator.pos(x+1.01,y,z);
        Tessellator.pos(x+1.01,y+1.01,z);
        Tessellator.pos(x+1.01,y,z);
        Tessellator.pos(x+1.01,y,z+1.01);
        Tessellator.pos(x,y,z+1.01);
        Tessellator.pos(x,y+1.01,z+1.01);
        Tessellator.pos(x+1.01,y+1.01,z+1.01);
    
        Tessellator.draw();
    
        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawBoxAtBlock:function (x, y, z, colorR, colorG, colorB){
    
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(3);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GL11.glDisable(GL11.GL_DEPTH_TEST);
        GL11.glDepthMask(false);
        GlStateManager[m.pushMatrix]()
    
        
        Tessellator.begin(3).colorize(colorR, colorG, colorB);
            
        Tessellator.pos(x+1,y+1,z+1);
        Tessellator.pos(x+1,y+1,z);
        Tessellator.pos(x,y+1,z);
        Tessellator.pos(x,y+1,z+1);
        Tessellator.pos(x+1,y+1,z+1);
        Tessellator.pos(x+1,y,z+1);
        Tessellator.pos(x+1,y,z);
        Tessellator.pos(x,y,z);
        Tessellator.pos(x,y,z+1);
        Tessellator.pos(x,y,z);
        Tessellator.pos(x,y+1,z);
        Tessellator.pos(x,y,z);
        Tessellator.pos(x+1,y,z);
        Tessellator.pos(x+1,y+1,z);
        Tessellator.pos(x+1,y,z);
        Tessellator.pos(x+1,y,z+1);
        Tessellator.pos(x,y,z+1);
        Tessellator.pos(x,y+1,z+1);
        Tessellator.pos(x+1,y+1,z+1);
    
        Tessellator.draw();
    
        GlStateManager[m.popMatrix]()
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        GL11.glEnable(GL11.GL_DEPTH_TEST);
        GL11.glDepthMask(true);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawBoxAtEntity:function (entity, colorR, colorG, colorB, width, height, partialTicks, lineWidth=2, phase=false){
        let x = entity.getX() + ((entity.getX()-entity.getLastX())*partialTicks)
        let y = entity.getY() + ((entity.getY()-entity.getLastY())*partialTicks)
        let z = entity.getZ() + ((entity.getZ()-entity.getLastZ())*partialTicks)
        
        if(width === null){
            width = entity.getWidth()/2
            height = entity.getHeight()
        }else{
            width = width/2
        }
        
    
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(GL11.GL_BLEND);
        GL11.glLineWidth(lineWidth);
        if(phase) GL11.glDisable(GL11.GL_DEPTH_TEST);
        GL11.glDisable(GL11.GL_TEXTURE_2D);
        GlStateManager.func_179094_E();
    
        
        Tessellator.begin(3).colorize(colorR, colorG, colorB);
            
        Tessellator.pos(x+width,y+height,z+width);
        Tessellator.pos(x+width,y+height,z-width);
        Tessellator.pos(x-width,y+height,z-width);
        Tessellator.pos(x-width,y+height,z+width);
        Tessellator.pos(x+width,y+height,z+width);
        Tessellator.pos(x+width,y,z+width);
        Tessellator.pos(x+width,y,z-width);
        Tessellator.pos(x-width,y,z-width);
        Tessellator.pos(x-width,y,z+width);
        Tessellator.pos(x-width,y,z-width);
        Tessellator.pos(x-width,y+height,z-width);
        Tessellator.pos(x-width,y,z-width);
        Tessellator.pos(x+width,y,z-width);
        Tessellator.pos(x+width,y+height,z-width);
        Tessellator.pos(x+width,y,z-width);
        Tessellator.pos(x+width,y,z+width);
        Tessellator.pos(x-width,y,z+width);
        Tessellator.pos(x-width,y+height,z+width);
        Tessellator.pos(x+width,y+height,z+width);
    
        Tessellator.draw();
    
        GlStateManager.func_179121_F();
        GL11.glEnable(GL11.GL_TEXTURE_2D);
        if(phase) GL11.glEnable(GL11.GL_DEPTH_TEST);
        GL11.glDisable(GL11.GL_BLEND);
    },
    drawFilledBox: function(x, y, z, w, h, red, green, blue, alpha, phase) { //FROM RENDERUTILS
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
    }
}