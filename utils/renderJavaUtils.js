import { m } from "../../mappings/mappings"
import { numberWithCommas } from "./numberUtils"

let SoopyV2Forge = Java.type("me.soopyboo32.soopyv2forge.SoopyV2Forge").INSTANCE

let LASTEST_SOOPYFORGE_VER = "1.1" //                                                          uncomment out on new soopyv2forge version
let canUseForgeRendering = net.minecraftforge.fml.common.Loader.isModLoaded("soopyv2forge")// && SoopyV2Forge.getVersion() === LASTEST_SOOPYFORGE_VER

let ArrayList = Java.type("java.util.ArrayList")

let Vec3 = Java.type("net.minecraft.util.Vec3")
let Vector2f = Java.type("javax.vecmath.Vector2f")
let RenderPointsC = Java.type("me.soopyboo32.soopyv2forge.RenderTypes.Points")
let RenderWorldTextC = Java.type("me.soopyboo32.soopyv2forge.RenderTypes.WorldText")
let RenderBeaconC = Java.type("me.soopyboo32.soopyv2forge.RenderTypes.Beacon")
let HudPointsC = Java.type("me.soopyboo32.soopyv2forge.RenderTypes.HudPoints")
let HudTextC = Java.type("me.soopyboo32.soopyv2forge.RenderTypes.HudText")

let addFix = false
if (!global.soopyv2RenderWorldThings) {
    global.soopyv2RenderWorldThings = new Set()
    addFix = true
}
if (!global.soopyv2RenderHudThings) global.soopyv2RenderHudThings = new Set()

register("gameUnload", () => {
    global.soopyv2RenderWorldThings.clear()
    SoopyV2Forge.setRenderWorldList(new ArrayList([]))
    global.soopyv2RenderHudThings.clear()
    SoopyV2Forge.setRenderHudList(new ArrayList([]))
})

let currentlyRendering = true
export function setRendering(rendering) {
    if (!rendering) {
        setRenderWorldList(new ArrayList([]))
        setRenderHudList(new ArrayList([]))
    }
    currentlyRendering = rendering
    if (rendering) {
        setRenderWorldList(new ArrayList([...global.soopyv2RenderWorldThings]))
        setRenderHudList(new ArrayList([...global.soopyv2RenderHudThings]))
    }
}

function setRenderWorldList(data) {
    if (currentlyRendering) SoopyV2Forge.setRenderWorldList(data)
}
function setRenderHudList(data) {
    if (currentlyRendering) SoopyV2Forge.setRenderHudList(data)
}

class RenderWorldAble {
    startRender(isBatched) {
        if (!canUseForgeRendering) return
        if (global.soopyv2RenderWorldThings.has(this.javaObj)) return this
        global.soopyv2RenderWorldThings.add(this.javaObj)
        if (!isBatched) setRenderWorldList(new ArrayList([...global.soopyv2RenderWorldThings]))
        return this
    }
    stopRender(isBatched) {
        if (!canUseForgeRendering) return
        if (!global.soopyv2RenderWorldThings.has(this.javaObj)) return this
        global.soopyv2RenderWorldThings.delete(this.javaObj)
        if (!isBatched) setRenderWorldList(new ArrayList([...global.soopyv2RenderWorldThings]))
        return this
    }
}
class RenderHudAble {
    startRender() {
        if (!canUseForgeRendering) return
        if (global.soopyv2RenderHudThings.has(this.javaObj)) return this
        global.soopyv2RenderHudThings.add(this.javaObj)
        setRenderHudList(new ArrayList([...global.soopyv2RenderHudThings]))
        return this
    }
    stopRender() {
        if (!canUseForgeRendering) return
        if (!global.soopyv2RenderHudThings.has(this.javaObj)) return this
        global.soopyv2RenderHudThings.delete(this.javaObj)
        setRenderHudList(new ArrayList([...global.soopyv2RenderHudThings]))
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
        this.javaObj.location = new Vec3(...location)
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
        this.javaObj.location = new Vec3(...location)
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

export class Waypoint extends FilledBox {
    constructor(x, y, z, r, g, b, { name = "", showDist = !!name, phase = false }) {
        this.rendering = false

        let distToPlayerSq = (x - Player.getRenderX()) ** 2 + (y - (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]())) ** 2 + (z - Player.getRenderZ()) ** 2

        let alpha = Math.min(1, Math.max(0, 1 - (distToPlayerSq - 10000) / 12500))

        super([x - 0.001, y - 0.001, z - 0.001], [1.002, 1.002, 1.002], r, g, b, 0.25 * alpha, 1, !phase)

        this.params = { x, y, z, r, g, b, name, showDist, phase }

        this.outLine = new Box([x - 0.002, y - 0.002, z - 0.002], [1.004, 1.004, 1.004], r, g, b, alpha, 3, !phase)
        this.beam = new Beacon([x, y + 1, z], r, g, b, Math.min(1, Math.max(0, (distToPlayerSq - 25) / 100)) * alpha, true)

        let distToPlayer = Math.sqrt(distToPlayerSq)

        let distRender = Math.min(distToPlayer, 50)

        let loc5 = [Player.getRenderX() + (x + 0.5 - Player.getRenderX()) / (distToPlayer / distRender), (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]()) + (y + 2 + 20 * distToPlayer / 300 - (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]())) / (distToPlayer / distRender), Player.getRenderZ() + (z + 0.5 - Player.getRenderZ()) / (distToPlayer / distRender)]
        let loc6 = [Player.getRenderX() + (x + 0.5 - Player.getRenderX()) / (distToPlayer / distRender), (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]()) + (y + 2 + 20 * distToPlayer / 300 - 10 * distToPlayer / 300 - (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]())) / (distToPlayer / distRender), Player.getRenderZ() + (z + 0.5 - Player.getRenderZ()) / (distToPlayer / distRender)]

        this.textLine1 = new WorldText([loc5[0], loc5[1], loc5[2]], "§a" + name, false, distRender / 12)
        this.textLine2 = new WorldText([(name ? loc6[0] : loc5[0]), (name ? loc6[1] : loc5[1]), (name ? loc6[2] : loc5[2])], "§b(" + numberWithCommas(Math.round(distToPlayer)) + "m)", false, distRender / 12)
    }

    update() {
        let { x, y, z, r, g, b, name, showDist } = this.params

        let distToPlayerSq = (x - Player.getRenderX()) ** 2 + (y - (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]())) ** 2 + (z - Player.getRenderZ()) ** 2

        let alpha = Math.min(1, Math.max(0, 1 - (distToPlayerSq - 10000) / 12500))

        this.setRGBA(r, g, b, 0.25 * alpha)
        this.outLine.setRGBA(r, g, b, alpha)
        this.beam.setRGBA(r, g, b, Math.min(1, Math.max(0, (distToPlayerSq - 25) / 100)) * alpha)

        if (name || showDist) {
            let distToPlayer = Math.sqrt(distToPlayerSq)

            let distRender = Math.min(distToPlayer, 100)

            let loc5 = [Player.getRenderX() + (x + 0.5 - Player.getRenderX()) / (distToPlayer / distRender), (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]()) + (y + 2 + 20 * distToPlayer / 300 - (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]())) / (distToPlayer / distRender), Player.getRenderZ() + (z + 0.5 - Player.getRenderZ()) / (distToPlayer / distRender)]
            let loc6 = [Player.getRenderX() + (x + 0.5 - Player.getRenderX()) / (distToPlayer / distRender), (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]()) + (y + 2 + 20 * distToPlayer / 300 - 10 * distToPlayer / 300 - (Player.getRenderY() + Player.getPlayer()[m.getEyeHeight]())) / (distToPlayer / distRender), Player.getRenderZ() + (z + 0.5 - Player.getRenderZ()) / (distToPlayer / distRender)]

            this.textLine1.setLocation([loc5[0], loc5[1], loc5[2]]).setScale(distRender / 12)
            this.textLine2.setLocation([(name ? loc6[0] : loc5[0]), (name ? loc6[1] : loc5[1]), (name ? loc6[2] : loc5[2])]).setScale(distRender / 12).setText("§b(" + numberWithCommas(Math.round(distToPlayer)) + "m)")
        }
    }

    startRender(isBatched) {
        if (this.rendering) return this
        this.rendering = true

        super.startRender(true)
        this.outLine.startRender(true)
        this.beam.startRender(true)
        if (this.params.name) this.textLine1.startRender(true)
        if (this.params.showDist) this.textLine2.startRender(true)

        if (!isBatched) setRenderWorldList(new ArrayList([...global.soopyv2RenderWorldThings]))
        return this
    }

    stopRender(isBatched) {
        if (!this.rendering) return this
        this.rendering = false

        super.stopRender(true)
        this.outLine.stopRender(true)
        this.beam.stopRender(true)
        this.textLine1.stopRender(true)
        this.textLine2.stopRender(true)

        if (!isBatched) setRenderWorldList(new ArrayList([...global.soopyv2RenderWorldThings]))
        return this
    }
}

register("worldLoad", () => {
    if (!net.minecraftforge.fml.common.Loader.isModLoaded("soopyv2forge")) {
        ChatLib.chat("&1" + ChatLib.getChatBreak("-").trim())
        ChatLib.chat("§cWARNING: You dont have the forge mod for soopyv2 installed")
        ChatLib.chat("§cWARNING: -> almost nothing can be rendered")
        new TextComponent(" &e[CLICK] &7- Download").setHover("show_text", "&2Download").setClick("open_url", "https://github.com/Soopyboo32/SoopyV2Forge/releases").chat()
        ChatLib.chat("Or if u want to remove soopyv2 run /ct delete soopyv2")
        ChatLib.chat("&1" + ChatLib.getChatBreak("-").trim())
    }
    if (SoopyV2Forge.getVersion() !== LASTEST_SOOPYFORGE_VER) {
        ChatLib.chat("&1" + ChatLib.getChatBreak("-").trim())
        ChatLib.chat("§cWARNING: Your forge version of soopyv2 is outdated")
        if (LASTEST_SOOPYFORGE_VER === "1.1") {
            ChatLib.chat("§cWARNING: this does not affect much at the moment, but has an incorect download url")
        } else {
            ChatLib.chat("§cWARNING: -> almost nothing can be rendered")
        }
        new TextComponent(" &e[CLICK] &7- Download").setHover("show_text", "&2Download update").setClick("open_url", "https://github.com/Soopyboo32/SoopyV2Forge/releases").chat()
        ChatLib.chat("&1" + ChatLib.getChatBreak("-").trim())
    }
})

if (addFix) {
    new Box([-1000000000, 0, 0], 0, 0, 0, 0, 0, 0, false).startRender()
}