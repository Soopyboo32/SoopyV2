let SoopyV2Forge = Java.type("me.soopyboo32.soopyv2forge.SoopyV2Forge").INSTANCE

let LASTEST_SOOPYFORGE_VER = "1.0"

let ArrayList = Java.type("java.util.ArrayList")

let Vec3 = Java.type("net.minecraft.util.Vec3")
let Vector2f = Java.type("javax.vecmath.Vector2f")
let RenderPointsC = Java.type("me.soopyboo32.soopyv2forge.RenderTypes.Points")
let RenderWorldTextC = Java.type("me.soopyboo32.soopyv2forge.RenderTypes.WorldText")
let RenderBeaconC = Java.type("me.soopyboo32.soopyv2forge.RenderTypes.Beacon")
let HudPointsC = Java.type("me.soopyboo32.soopyv2forge.RenderTypes.HudPoints")
let HudTextC = Java.type("me.soopyboo32.soopyv2forge.RenderTypes.HudText")

let RenderWorldThings = new Set()
let RenderHudThings = new Set()

class RenderWorldAble {
    startRender() {
        RenderWorldThings.add(this.javaObj)
        SoopyV2Forge.setRenderWorldList(new ArrayList([...RenderWorldThings]))
        return this
    }
    stopRender() {
        RenderWorldThings.delete(this.javaObj)
        SoopyV2Forge.setRenderWorldList(new ArrayList([...RenderWorldThings]))
        return this
    }
}
class RenderHudAble {
    startRender() {
        RenderHudThings.add(this.javaObj)
        SoopyV2Forge.setRenderHudList(new ArrayList([...RenderHudThings]))
        return this
    }
    stopRender() {
        RenderHudThings.delete(this.javaObj)
        SoopyV2Forge.setRenderHudList(new ArrayList([...RenderHudThings]))
        return this
    }
}

export class Points extends RenderWorldAble {
    constructor(points, r, g, b, a, thickness, depth) {
        this.javaObj = new RenderPointsC(new ArrayList(points.map(a => new Vec3(...a))), r, g, b, a, thickness, depth)
    }

    setPoints(points) {
        this.javaObj.points = new ArrayList(points.map(a => new Vec3(...a)))
        return this
    }
    setRGBA(r, g, b, a) {
        this.javaObj.red = r
        this.javaObj.green = g
        this.javaObj.blue = b
        this.javaObj.alpha = a
        return this
    }
    setThickness(thickness) {
        this.javaObj.thickness = thickness
        return this
    }
    setDepth(depth) {
        this.javaObj.depthtest = depth
        return this
    }
    setDisableCullFace(disable) {
        this.javaObj.disableCullFace = disable
        return this
    }
    setGLMode(glMode) {
        this.javaObj.glmode = glMode
        return this
    }
}
export class FilledPoints extends Points {
    constructor(points, r, g, b, a, thickness, depth) {
        super(points, r, g, b, a, thickness, depth)

        this.setGLMode(GL11.GL_QUADS)
        this.setDisableCullFace(true)
    }
}
export class Box extends Points {
    constructor(location, size, r, g, b, a, thickness, depth) {
        super(Box.getPointsFromLocationSize(location, size), r, g, b, a, thickness, depth)
    }

    setLocationSize(location, size) {
        this.setPoints(Box.getPointsFromLocationSize(location, size))
        return this
    }

    static getPointsFromLocationSize(location, size) {
        let [x, y, z] = location
        let [width, height, width2] = size

        return [[x + width, y + height, z + width2],
        [x + width, y + height, z],
        [x, y + height, z],
        [x, y + height, z + width2],
        [x + width, y + height, z + width2],
        [x + width, y, z + width2],
        [x + width, y, z],
        [x, y, z],
        [x, y, z + width2],
        [x, y, z],
        [x, y + height, z],
        [x, y, z],
        [x + width, y, z],
        [x + width, y + height, z],
        [x + width, y, z],
        [x + width, y, z + width2],
        [x, y, z + width2],
        [x, y + height, z + width2],
        [x + width, y + height, z + width2]]
    }
}
export class FilledBox extends FilledPoints {
    constructor(location, size, r, g, b, a, thickness, depth) {
        super(FilledBox.getPointsFromLocationSize(location, size), r, g, b, a, thickness, depth)
    }

    setLocationSize(location, size) {
        this.setPoints(FilledBox.getPointsFromLocationSize(location, size))
        return this
    }

    static getPointsFromLocationSize(location, size) {
        let [x, y, z] = location
        let [w, h, w2] = size

        return [
            [x + w, y + 0, z + w2],
            [x + w, y + 0, z],
            [x, y + 0, z],
            [x, y + 0, z + w2],

            [x + w, y + h, z + w2],
            [x + w, y + h, z],
            [x, y + h, z],
            [x, y + h, z + w2],

            [x, y + h, z + w2],
            [x, y + h, z],
            [x, y + 0, z],
            [x, y + 0, z + w2],

            [x + w, y + h, z + w2],
            [x + w, y + h, z],
            [x + w, y + 0, z],
            [x + w, y + 0, z + w2],

            [x + w, y + h, z],
            [x, y + h, z],
            [x, y + 0, z],
            [x + w, y + 0, z],

            [x, y + h, z + w2],
            [x + w, y + h, z + w2],
            [x + w, y + 0, z + w2],
            [x, y + 0, z + w2]
        ]
    }
}
export class WorldText extends RenderWorldAble {
    constructor(location, text, depth, scale) {
        this.javaObj = new RenderWorldTextC(new Vec3(...location), text, depth, scale)
    }

    setLocation(location) {
        this.javaObj.location = location
        return this
    }
    setText(text) {
        this.javaObj.text = text
        return this
    }
    setDepthtest(depthtest) {
        this.javaObj.depthtest = depthtest
        return this
    }
    setScale(scale) {
        this.javaObj.scale = scale
        return this
    }
    setShadow(shadow) {
        this.javaObj.shadow = shadow
        return this
    }
}

export class Beacon extends RenderWorldAble {
    constructor(location, r, g, b, a, depth) {
        this.javaObj = new RenderBeaconC(new Vec3(...location), r, g, b, a, depth)
    }

    setLocation(location) {
        this.javaObj.location = location
        return this
    }
    setRGBA(r, g, b, a) {
        this.javaObj.red = r
        this.javaObj.green = g
        this.javaObj.blue = b
        this.javaObj.alpha = a
        return this
    }
    setDepthtest(depthtest) {
        this.javaObj.depthtest = depthtest
        return this
    }

}
export class HudPoints extends RenderHudAble {
    constructor(points, r, g, b, a, thickness) {
        this.javaObj = new HudPointsC(new ArrayList(points.map(a => new Vector2f(...a))), r, g, b, a, thickness)
    }

    setPoints(points) {
        this.javaObj.points = new ArrayList(points.map(a => new Vec3(...a)))
        return this
    }
    setRGBA(r, g, b, a) {
        this.javaObj.colorR = r
        this.javaObj.colorG = g
        this.javaObj.colorB = b
        this.javaObj.colorA = a
        return this
    }
    setThickness(thickness) {
        this.javaObj.thickness = thickness
        return this
    }
    setGlmode(glmode) {
        this.javaObj.glmode = glmode
        return this
    }
}
export class HudText extends RenderHudAble {
    constructor(text, x, y, shadow) {
        this.javaObj = new HudTextC(text, x, y, shadow)
    }

    setText(text) {
        this.javaObj.textLines = text
        return this
    }
    setX(x) {
        this.javaObj.x = x
        return this
    }
    setY(y) {
        this.javaObj.y = y
        return this
    }
    setScale(scale) {
        this.javaObj.scale = scale
        return this
    }
    setShadow(shadow) {
        this.javaObj.shadow = shadow
        return this
    }
}

// let data = []

// data.push(createPoints([[108, 70, 63], [108, 71, 63], [108, 70, 67], [108, 70, 63]], 1, 0, 0, 1, 2, true))
// data.push(createWorldText([115, 73, 63], "Text §dWOW §6YEP", true, 1))
// data.push(createBeacon([115, 75, 63], 0, 1, 0, 1, true))

// SoopyV2Forge.setRenderWorldList(new ArrayList(data))

// let data2 = []

// data2.push(createHudPoints([[10, 10], [50, 10], [50, 20], [10, 10]], 0, 0, 1, 1, 5))
// data2[data2.length - 1].glmode = 5
// data2.push(createHudText("Text §dWOW §6YEP", 10, 30, true))

// SoopyV2Forge.setRenderHudList(new ArrayList(data2))

register("worldLoad", () => {
    if (!net.minecraftforge.fml.common.Loader.isModLoaded("soopyv2forge")) {
        ChatLib.chat("&1" + ChatLib.getChatBreak("-").trim())
        ChatLib.chat("§cWARNING: You dont have the forge mod for soopyv2 installed")
        ChatLib.chat("§cWARNING: If you have the mod installed it will take over rendering")
        ChatLib.chat("§cWARNING: And improve performance quite a bit")
        new TextComponent(" &e[CLICK] &7- Download").setHover("show_text", "&2Download").setClick("open_url", "https://github.com/Soopyboo32/SoopyV2Forge/releases").chat()
        ChatLib.chat("&1" + ChatLib.getChatBreak("-").trim())
    }
    if (SoopyV2Forge.getVersion() !== LASTEST_SOOPYFORGE_VER) {
        ChatLib.chat("&1" + ChatLib.getChatBreak("-").trim())
        ChatLib.chat("§cWARNING: Your forge version of soopyv2 is outdated")
        ChatLib.chat("§cWARNING: Chattriggers will take over rendering")
        ChatLib.chat("§cWARNING: This will hurt performance quite a bit")
        new TextComponent(" &e[CLICK] &7- Download").setHover("show_text", "&2Download update").setClick("open_url", "https://github.com/Soopyboo32/SoopyV2Forge/releases").chat()
        ChatLib.chat("&1" + ChatLib.getChatBreak("-").trim())
    }
})

let renderWorldList
let renderHudList

let shouldUseForgeRendering = net.minecraftforge.fml.common.Loader.isModLoaded("soopyv2forge") && SoopyV2Forge.getVersion() === LASTEST_SOOPYFORGE_VER

if (!shouldUseForgeRendering) {
    renderWorldList = []
    renderHudList = []
    register("renderOverlay", (ticks) => {

    })
    register("renderWorld", (ticks) => {

    })
}