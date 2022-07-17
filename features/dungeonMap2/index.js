/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />

import Feature from "../../featureClass/class";
import renderLibs from "../../../guimanager/renderLibs";
import DungeonMapData from "./DungeonMapData";
import DungeonRoomStaticData from "./DungeonRoomStaticData";
import ImageLocationSetting from "../settings/settingThings/imageLocation";
import ToggleSetting from "../settings/settingThings/toggle";
import { f, m } from "../../../mappings/mappings";

const DefaultVertexFormats = Java.type("net.minecraft.client.renderer.vertex.DefaultVertexFormats")
const MCTessellator = Java.type("net.minecraft.client.renderer.Tessellator")

class DungeonMap extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        if (Player.getUUID().toString() !== "dc8c3964-7b29-4e03-ae9e-d13ebd65dd29") {
            new SettingBase("Coming soontm", "maby", undefined, "coming_soontm", this)
            return
        }
        this.mapLocation = new ImageLocationSetting("Map Location", "Sets the location of the map on the hud", "dmap_location", this, [10, 10, 1], new Image(javax.imageio.ImageIO.read(new java.io.File("./config/ChatTriggers/modules/SoopyV2/features/dungeonMap/map.png"))), 150, 150)
        this.mapSecrets = new ToggleSetting("Show secret count instead of tick", "Syncs between soopyv2 users", true, "dmap_secrets", this)

        this.lastRoomId = undefined

        /**@type {DungeonMapData} */
        this.currentDungeon = undefined
        this.lastChange = 0

        this.roomXY = this.getRoomXYWorld().join(",")
        this.lastXY = undefined

        let registerActionBar = this.registerCustom("actionbar", (curr, max) => {

            let roomid = this.getCurrentRoomId()
            let roomWorldData = this.getRoomWorldData()

            let rotation = roomWorldData.width > roomWorldData.height ? 0 : 1

            if (this.getCurrentRoomData().shape === "L") rotation = roomWorldData.rotation
            if (this.getCurrentRoomData().type === "spawn") {
                roomWorldData.x = x + 1
                roomWorldData.y = y + 1
            }

            this.currentDungeon.roomSecrets(roomWorldData.x, roomWorldData.y, rotation, roomid, curr, max)
        })
        registerActionBar.trigger.setCriteria('&7${curr}/${max} Secrets').setParameter('contains');

        this.registerStep(true, 5, this.update)

        this.registerEvent("renderOverlay", this.renderOverlay)
        this.registerEvent("worldLoad", this.worldLoad)

    }

    update() {
        if (!this.isInDungeon()) {
            if (this.currentDungeon) {
                this.currentDungeon.destroy()
                this.lastRoomId = undefined
                this.currentDungeon = undefined
            }
            return
        }

        if (!this.currentDungeon) {
            this.currentDungeon = new DungeonMapData(this.FeatureManager.features["dataLoader"].class.dungeonFloor)
        }
        this.currentDungeon.setRenderTicks(!this.mapSecrets.getValue())

        this.currentDungeon.updatePlayers()
        this.currentDungeon.updateHotbarData()

        let roomid = this.getCurrentRoomId()
        if (!roomid.includes(",")) return
        if (this.roomXY !== this.getRoomXYWorld().join(",")) {
            this.roomXY = this.getRoomXYWorld().join(",")
            this.lastChange = Date.now()
        }

        let x = Math.floor((Player.getX() + 8) / 32) * 32 - 9
        let y = Math.floor((Player.getZ() + 8) / 32) * 32 - 9

        if (roomid !== this.lastRoomId && Date.now() - this.lastChange > 500) {
            this.lastRoomId = roomid

            let roomWorldData = this.getRoomWorldData()

            let rotation = roomWorldData.width > roomWorldData.height ? 0 : 1

            if (this.getCurrentRoomData().shape === "L") rotation = roomWorldData.rotation
            if (this.getCurrentRoomData().type === "spawn") {
                roomWorldData.x = x + 1
                roomWorldData.y = y + 1
            }

            this.currentDungeon.setRoom(roomWorldData.x, roomWorldData.y, rotation, roomid)
        }


        if (this.lastXY !== x + "," + y) {
            this.lastXY = x + "," + y
            if (this.getBlockAt(x + 16, 73, y) !== 0) {
                this.currentDungeon.setDoor(x + 16, y, -1, 0)
            }
            if (this.getBlockAt(x, 73, y + 16) !== 0) {
                this.currentDungeon.setDoor(x, y + 16, -1, 1)
            }
            if (this.getBlockAt(x + 16, 73, y + 32) !== 0) {
                this.currentDungeon.setDoor(x + 16, y + 32, -1, 0)
            }
            if (this.getBlockAt(x + 32, 73, y + 16) !== 0) {
                this.currentDungeon.setDoor(x + 32, y + 16, -1, 1)
            }
        }
    }

    renderOverlay() {
        if (this.currentDungeon) {
            this.currentDungeon.updatePlayersFast()

            let x = this.mapLocation.getValue()[0]
            let y = this.mapLocation.getValue()[1]
            let size = 150 * this.mapLocation.getValue()[2]
            Renderer.drawRect(Renderer.color(0, 0, 0, 100), x, y, size, size)

            this.currentDungeon.getImage().draw(x, y, size, size)

            Renderer.drawRect(Renderer.color(0, 0, 0), x, y, size, 2)
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y, 2, size)
            Renderer.drawRect(Renderer.color(0, 0, 0), x + size - 2, y, 2, size)
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size - 2, size, 2)

            for (let player of this.currentDungeon.getPlayers()) {
                let x2 = this.currentDungeon.toImageX(player.x) * size + x
                let y2 = this.currentDungeon.toImageY(player.y) * size + y
                let rx = -6
                let ry = -6
                let rw = 12
                let rh = 12

                Renderer.translate(x2, y2)
                Renderer.rotate(player.rotate)
                GlStateManager[m.enableBlend]()
                GlStateManager[m.scale](1, 1, 50)
                Client.getMinecraft()[m.getTextureManager]()[m.bindTexture.TextureManager](player.skin)
                GlStateManager[m.enableTexture2D]()

                let tessellator = MCTessellator[m.getInstance.Tessellator]()
                let worldRenderer = tessellator[m.getWorldRenderer]()
                worldRenderer[m.begin](7, DefaultVertexFormats[f.POSITION_TEX])

                worldRenderer[m.pos](rx, ry + rh, 0.0)[m.tex](8 / 64, 16 / 64)[m.endVertex]()
                worldRenderer[m.pos](rx + rw, ry + rh, 0.0)[m.tex](16 / 64, 16 / 64)[m.endVertex]()
                worldRenderer[m.pos](rx + rw, ry, 0.0)[m.tex](16 / 64, 8 / 64)[m.endVertex]()
                worldRenderer[m.pos](rx, ry, 0.0)[m.tex](8 / 64, 8 / 64)[m.endVertex]()
                tessellator[m.draw.Tessellator]()

                Tessellator.popMatrix()
                Tessellator.pushMatrix()
            }

            if (this.mapSecrets.getValue()) {
                Renderer.retainTransforms(true)
                Renderer.translate(x, y)
                this.currentDungeon.renderSecrets(size)
                Renderer.translate(-x, -y)
                Renderer.retainTransforms(false)
            }
        }
    }

    worldLoad() {
        if (this.currentDungeon) this.currentDungeon.destroy()
        this.lastRoomId = undefined
        this.currentDungeon = undefined
    }

    getCurrentRoomId() {
        if (Scoreboard.getLines().length === 0) return undefined
        let id = Scoreboard.getLineByIndex(Scoreboard.getLines().length - 1).getName().trim().split(" ").pop()

        return id
    }

    isInDungeon() {
        if (!this.FeatureManager || !this.FeatureManager.features["dataLoader"]) return false
        return this.FeatureManager.features["dataLoader"].class.isInDungeon
    }

    getRoomXYWorld() {
        let roomData = this.getRoomWorldData()
        if (roomData.rotation === 4) {
            return [roomData.x, roomData.y + 32]
        }

        return [roomData.x, roomData.y]
    }

    getCurrentRoomData() {
        return DungeonRoomStaticData.getDataFromId(this.getCurrentRoomId())
    }

    getRotation(x, y, width, height, roofY) {
        let currRoomData = this.getCurrentRoomData()
        if (!currRoomData) return -1

        if (currRoomData.shape !== "L") {
            if (this.getTopBlockAt(x, y, roofY) === 11) return 0
            if (this.getTopBlockAt(x + width, y, roofY) === 11) return 1
            if (this.getTopBlockAt(x + width, y + height, roofY) === 11) return 2
            if (this.getTopBlockAt(x, y + height, roofY) === 11) return 3
        } else {
            let one = this.getTopBlockAt2(x + width / 2 + 1, y + height / 2, roofY)
            let two = this.getTopBlockAt2(x + width / 2 - 1, y + height / 2, roofY)
            let three = this.getTopBlockAt2(x + width / 2, y + height / 2 + 1, roofY)
            let four = this.getTopBlockAt2(x + width / 2, y + height / 2 - 1, roofY)

            if (one === 0 && three === 0) return 0
            if (two === 0 && three === 0) return 1
            if (one === 0 && four === 0) return 3
            if (two === 0 && four === 0) return 2//3 IS SO TOXIK HGOLY HEL I HATE L SHAPE ROOMS WHY DO THIS TO ME
        }

        return -1
    }

    getRoomWorldData() {
        let x = Math.floor((Player.getX() + 8) / 32) * 32 - 8
        let y = Math.floor((Player.getZ() + 8) / 32) * 32 - 8
        let width = 30
        let height = 30

        let roofY = this.getRoofAt(x, y)

        while (World.getBlockStateAt(new BlockPos(x - 1, roofY, y)).getBlockId() !== 0) {
            x -= 32
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x, roofY, y - 1)).getBlockId() !== 0) {
            y -= 32
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x - 1, roofY, y)).getBlockId() !== 0) { //second iteration incase of L shape
            x -= 32
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width + 1, roofY, y)).getBlockId() !== 0) {
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x, roofY, y + height + 1)).getBlockId() !== 0) {
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width, roofY, y + height + 1)).getBlockId() !== 0) { //second iteration incase of L shape
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width + 1, roofY, y + height)).getBlockId() !== 0) { //second iteration incase of L shape
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width, roofY, y - 1)).getBlockId() !== 0) {//second iteration incase of L shape
            y -= 32
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x - 1, roofY, y + height)).getBlockId() !== 0) { //third iteration incase of L shape
            x -= 32
            width += 32
        }


        return {
            x,
            y,
            width,
            height,
            cx: x + width / 2,
            cy: y + height / 2,
            rotation: this.getRotation(x, y, width, height, roofY)
        }
    }

    getRoofAt(x, z) {
        let y = 255
        while (y > 0 && World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId() === 0) y--

        return y
    }

    getTopBlockAt(x, z, y) {
        if (!y) y = this.getHeightAt(x, z)

        return World.getBlockStateAt(new BlockPos(x, y, z)).getMetadata()
    }
    getBlockAt(x, y, z) {
        return World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId()
    }
    getTopBlockAt2(x, z, y) {
        if (!y) y = this.getHeightAt(x, z)

        return World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId()
    }
    onDisable() {
    }
}

module.exports = {
    class: new DungeonMap()
}