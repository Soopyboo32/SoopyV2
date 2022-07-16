/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />

import Feature from "../../featureClass/class";
import renderLibs from "../../../guimanager/renderLibs";
import DungeonMapData from "./DungeonMapData";
import DungeonRoomStaticData from "./DungeonRoomStaticData";

const AlphaComposite = Java.type("java.awt.AlphaComposite")

class DungeonMap extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        if (Player.getUUID().toString() !== "dc8c3964-7b29-4e03-ae9e-d13ebd65dd29") {
            new SettingBase("Coming soontm", "maby", undefined, "coming_soontm", this)
            return
        }

        this.lastRoomId = undefined

        /**@type {DungeonMapData} */
        this.currentDungeon = undefined

        this.registerStep(true, 5, this.update)

        this.registerEvent("renderOverlay", this.renderOverlay)
    }

    update() {
        if (!this.isInDungeon()) {
            this.lastRoomId = undefined
            this.currentDungeon = undefined
            return
        }

        if (!this.currentDungeon) {
            this.currentDungeon = new DungeonMapData(this.FeatureManager.features["dataLoader"].class.dungeonFloor)
        }

        let roomid = this.getCurrentRoomId()
        if (!roomid.includes(",")) return

        if (roomid !== this.lastRoomId) {
            this.lastRoomId = roomid

            let roomWorldData = this.getRoomWorldData()
            this.currentDungeon.setRoom(roomWorldData.x, roomWorldData.y, roomWorldData.rotation, roomid)
        }
    }

    renderOverlay() {
        if (this.currentDungeon) {
            let x = 10
            let y = 10
            let size = 100
            this.currentDungeon.getImage().draw(x, y, size, size)

            Renderer.drawRect(Renderer.color(0, 0, 0), x, y, size, 2)
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y, 2, size)
            Renderer.drawRect(Renderer.color(0, 0, 0), x + size - 2, y, 2, size)
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size - 2, size, 2)
        }
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
            if (one === 0 && four === 0) return 2
            if (two === 0 && four === 0) return 3//3 IS SO TOXIK HGOLY HEL I HATE L SHAPE ROOMS WHY DO THIS TO ME
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
    getTopBlockAt2(x, z, y) {
        if (!y) y = this.getHeightAt(x, z)

        return World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId()
    }
    getImageForPlayer(uuid) {
        let img = renderLibs.getImage("https://crafatar.com/avatars/" + uuid.replace(/-/g, "") + "?size=8&overlay")
        if (!img) return this.defaultPlayerImage

        return img
    }
    onDisable() {
    }
}

module.exports = {
    class: new DungeonMap()
}