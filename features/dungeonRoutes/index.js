/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import { drawBoxAtBlock, drawBoxAtBlock2, drawFilledBox, drawLine, drawLinePoints } from "../../utils/renderUtils";
import SettingBase from "../settings/settingThings/settingBase";

const EntityItem = Java.type("net.minecraft.entity.item.EntityItem")


class DungeonRoutes extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        if (Player.getUUID().toString() !== "dc8c3964-7b29-4e03-ae9e-d13ebd65dd29") {
            new SettingBase("Coming soontm", "maby", undefined, "coming_soontm", this)
            return
        }

        this.actionId = 0

        this.recentEtherwarps = []
        this.recentMines = []
        this.recentLocations = []
        this.recentInteracts = []
        this.recentTnts = []
        this.lastLocationUpdatedTime = Date.now()

        this.registerEvent("soundPlay", this.playSound)
        this.registerEvent("worldLoad", this.worldLoad)
        this.registerEvent("playerInteract", this.playerInteract)
        this.registerForge(net.minecraftforge.event.entity.EntityJoinWorldEvent, this.entityJoinWorldEvent)
        let packetRecieved = this.registerCustom("packetReceived", this.pickupItem)

        try {
            packetRecieved.trigger.setPacketClasses([net.minecraft.network.play.server.S0DPacketCollectItem])
        } catch (e) { }//older ct version

        this.registerStep(true, 5, () => {
            let roomId = this.getCurrentRoomId()
            if (this.lastRoomId !== roomId) {
                this.lastRoomId = roomId
                this.actionId = 0
                this.recentEtherwarps = []
                this.recentMines = []
                this.recentLocations = []
                this.recentTnts = []
                this.recentInteracts = []

                this.currRoomData = this.getRoomWorldData()

                this.currentRouteDisplay = this.routesIndexMap.get(this.fullRoomData[this.idMap.get(roomId)].index)
                ChatLib.chat(JSON.stringify(this.currentRouteDisplay, undefined, 2))
            }

            if (!this.recordRoute) return
            if (this.recentLocations.length === 0
                || Math.ceil(Player.getX()) !== this.recentLocations[this.recentLocations.length - 1].loc[0]
                || Math.ceil(Player.getY()) !== this.recentLocations[this.recentLocations.length - 1].loc[1]
                || Math.ceil(Player.getZ()) !== this.recentLocations[this.recentLocations.length - 1].loc[2]) {

                this.recentLocations.push({ loc: [Math.ceil(Player.getX()), Math.ceil(Player.getY()), Math.ceil(Player.getZ())], id: this.actionId++ })
            }
        })

        this.registerEvent("renderWorld", () => {
            this.recentEtherwarps.forEach(({ loc }) => {
                drawFilledBox(loc.x, loc.y - 1, loc.z, 1, 1, 1, 0, 0, 50 / 255, true)
                drawBoxAtBlock(loc.x - 0.5, loc.y - 1, loc.z - 0.5, 1, 0, 0, 1, 1, 1)
            })
            this.recentMines.forEach(({ loc }) => {
                drawFilledBox(loc.x, loc.y - 0.5, loc.z, 1, 1, 0, 1, 0, 50 / 255, true)
            })
            this.recentTnts.forEach(({ loc }) => {
                drawFilledBox(loc.x, loc.y - 0.5, loc.z, 1, 1, 1, 0, 0, 50 / 255, true)
            })
            this.recentInteracts.forEach(({ loc }) => {
                drawFilledBox(loc.x, loc.y, loc.z, 1, 1, 0, 0, 1, 50 / 255, true)
                drawBoxAtBlock(loc.x - 0.5, loc.y, loc.z - 0.5, 0, 0, 1, 1, 1, 1)
            })
            if (this.recentLocations.length >= 2) drawLinePoints(this.recentLocations.map(a => [a.loc[0] - 0.5, a.loc[1] + 0.1, a.loc[2] - 0.5]), 0, 0, 255, 2, false)

            if (this.currRoomData) {
                if (this.currentRouteDisplay) {
                    this.currentRouteDisplay.etherwarps.forEach(loc => {
                        let coords = this.toRoomCoordinates(loc[0], loc[1] - 1, loc[2])
                        drawFilledBox(coords[0] + 0.5, coords[1], coords[2] + 0.5, 1, 1, 1, 0, 0, 50 / 255, true)
                        drawBoxAtBlock(coords[0], coords[1], coords[2], 1, 0, 0, 1, 1, 1)
                    })
                    this.currentRouteDisplay.mines.forEach(loc => {
                        let coords = this.toRoomCoordinates(loc[0], loc[1] - 1, loc[2])
                        drawFilledBox(coords[0] + 0.5, coords[1] + 0.5, coords[2] + 0.5, 1, 1, 0, 255, 0, 50 / 255, true)
                    })
                    this.currentRouteDisplay.tnts.forEach(loc => {
                        let coords = this.toRoomCoordinates(loc[0], loc[1] - 1, loc[2])
                        drawFilledBox(coords[0] + 0.5, coords[1] + 0.5, coords[2] + 0.5, 1, 1, 255, 0, 0, 50 / 255, true)
                    })
                    this.currentRouteDisplay.interacts.forEach(loc => {
                        let coords = this.toRoomCoordinates(loc[0], loc[1], loc[2])
                        drawFilledBox(coords[0] + 0.5, coords[1], coords[2] + 0.5, 1, 1, 0, 0, 1, 50 / 255, true)
                        drawBoxAtBlock(coords[0], coords[1], coords[2], 0, 0, 1, 1, 1, 1)
                    })

                    if (this.currentRouteDisplay.locations.length >= 2) drawLinePoints(this.currentRouteDisplay.locations.map(a => this.toRoomCoordinates(...a)).map(a => [a[0] - 0.5, a[1] + 0.1, a[2] - 0.5]), 0, 0, 255, 2, false)

                }
            }

        })

        this.tempItemIdLocs = new Map()

        this.idMap = new Map()
        this.routesIndexMap = new Map()
        this.fullRoomData = JSON.parse(FileLib.read("SoopyV2", "features/dungeonRoutes/temproomdata.json"))
        this.fullRoutesData = JSON.parse(FileLib.read("SoopyV2", "features/dungeonRoutes/routesData.json"))
        this.fullRoomData.forEach((d, i) => {
            d.id.forEach(id => {
                this.idMap.set(id, i)
            })
            this.idMap.set(d.index, i)
        })
        this.fullRoutesData.forEach((d, i) => {
            this.routesIndexMap.set(d.index, d)
        })
        this.lastRoomId = undefined

        this.currRoomData = undefined
        this.currentRouteDisplay = undefined

        this.registerCommand("roomid", (...name) => {
            ChatLib.chat(JSON.stringify(this.getCurrentRoomData(), undefined, 2))
            ChatLib.chat(JSON.stringify(this.getRoomWorldData(), undefined, 2))
        })
        this.recordRoute = false

        this.registerCommand("startroute", (...name) => {
            this.recordRoute = true
            this.recentEtherwarps = []
            this.recentMines = []
            this.recentLocations = []
            this.recentInteracts = []
            this.recentTnts = []
            ChatLib.chat(this.FeatureManager.messagePrefix + "Started recording route!")
        })

        this.registerCommand("saveroute", () => {
            let data = {
                index: this.fullRoomData[this.idMap.get(this.lastRoomId)].index,
                etherwarps: this.recentEtherwarps.map(ether => this.fromRoomCoordinates(ether.loc.x - 0.5, ether.loc.y, ether.loc.z - 0.5)),
                mines: this.recentMines.map(ether => this.fromRoomCoordinates(ether.loc.x - 0.5, ether.loc.y, ether.loc.z - 0.5)),
                locations: this.recentLocations.map(ether => this.fromRoomCoordinates(ether.loc[0], ether.loc[1], ether.loc[2])),
                interacts: this.recentInteracts.map(ether => this.fromRoomCoordinates(ether.loc.x - 0.5, ether.loc.y, ether.loc.z - 0.5)),
                tnts: this.recentTnts.map(ether => this.fromRoomCoordinates(ether.loc.x - 0.5, ether.loc.y, ether.loc.z - 0.5)),
            }

            ChatLib.chat(JSON.stringify(data, undefined, 4))
            ChatLib.chat(this.FeatureManager.messagePrefix + "Saved route!")
            this.recordRoute = false
        })
    }
    /*const EnumParticleTypes = Java.type('net.minecraft.util.EnumParticleTypes'); //TODO: make path rendering use particles
World.particle.getParticleNames().forEach(name => { console.log(name) }) // All names
let particleType = EnumParticleTypes.valueOf('EXPLOSION_HUGE');
let idField = particleType.getClass().getDeclaredField('field_179372_R');
idField.setAccessible(true);
let id = idField.get(particleType);

Client.getMinecraft().field_71438_f.func_174974_b(
    id,   // particleID
    true, // shouldIgnoreRange
    -19,  // x
    113,  // y
    6,      // z
    0,      // speedX
    0,      // speedY
    0,      // speedZ
);*/

    toRoomCoordinates(x, y, z) { //From relative coords to world coords
        if (!this.currRoomData) return null

        if (this.currRoomData.rotation === 2) {
            z *= -1;
            [x, z] = [z, x]
        } else if (this.currRoomData.rotation === 3) {
            x *= -1
            z *= -1
        } else if (this.currRoomData.rotation === 4) {
            x *= -1;
            [x, z] = [z, x]
        }

        return [this.currRoomData.cx + x, y, this.currRoomData.cy + z]
    }
    fromRoomCoordinates(x, y, z) { //from world coords to relative coords
        if (!this.currRoomData) return null

        x -= this.currRoomData.cx
        z -= this.currRoomData.cy

        if (this.currRoomData.rotation === 2) {
            [x, z] = [z, x]
            z *= -1
        } else if (this.currRoomData.rotation === 3) {
            x *= -1
            z *= -1
        } else if (this.currRoomData.rotation === 4) {
            [x, z] = [z, x]
            x *= -1
        }

        return [x, y, z]
    }

    getRotation(x, y, width, height, roofY) {
        let currRoomData = this.getCurrentRoomData()
        if (!currRoomData) return -1

        if (currRoomData.shape !== "L") {
            if (this.getTopBlockAt(x, y, roofY) === 11) return 1
            if (this.getTopBlockAt(x + width, y, roofY) === 11) return 2
            if (this.getTopBlockAt(x + width, y + height, roofY) === 11) return 3
            if (this.getTopBlockAt(x, y + height, roofY) === 11) return 4
        } else {
            let one = this.getTopBlockAt2(x + width / 2 + 1, y + height / 2, roofY)
            let two = this.getTopBlockAt2(x + width / 2 - 1, y + height / 2, roofY)
            let three = this.getTopBlockAt2(x + width / 2, y + height / 2 + 1, roofY)
            let four = this.getTopBlockAt2(x + width / 2, y + height / 2 - 1, roofY)

            if (one === 0 && three === 0) return 1
            if (two === 0 && three === 0) return 2
            if (one === 0 && three === 0) return 3
            if (two === 0 && four === 0) return 4
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

    getCurrentRoomData() {
        let roomId = this.idMap.get(this.getCurrentRoomId())
        if (roomId === undefined) return null

        return this.fullRoomData[roomId]
    }

    getCurrentRoomId() {
        let id = Scoreboard.getLineByIndex(Scoreboard.getLines().length - 1).getName().trim().split(" ").pop()

        return id
    }

    worldLoad() {
        this.recentEtherwarps = []
        this.recentMines = []
        this.recentLocations = []
        this.recentInteracts = []
        this.recentTnts = []
    }

    entityJoinWorldEvent(event) {
        if (event.entity instanceof EntityItem) {
            // console.log("Blaze joined world")
            let e = new Entity(event.entity)
            let pos = { x: e.getX(), y: e.getY(), z: e.getZ() }

            this.tempItemIdLocs.set(event.entity[m.getEntityId.Entity](), pos)
            // console.log(event.entity[m.getEntityId.Entity]())
        }
    }

    pickupItem(packet) {
        if (!this.recordRoute) return
        let packetType = new String(packet.class.getSimpleName()).valueOf()
        if (packetType === "S0DPacketCollectItem") {
            let pos = this.tempItemIdLocs.get(packet[m.getCollectedItemEntityID]())

            if (pos) this.recentInteracts.push({ loc: pos, id: this.actionId++ })
        }
    }

    playerInteract(action, position, event) {
        if (!this.recordRoute) return
        if (action.toString() !== "RIGHT_CLICK_BLOCK") return

        let pos = { x: Player.lookingAt().getX() + 0.5, y: Player.lookingAt().getY(), z: Player.lookingAt().getZ() + 0.5 }

        let id = Player.lookingAt().getType().getID()
        if (id !== 54 && id !== 144 && id !== 69) return

        this.recentInteracts.push({ loc: pos, id: this.actionId++ })
    }

    playSound(pos, name, volume, pitch, categoryName, event) {
        if (!this.recordRoute) return

        let nameSplitted = name.split(".")
        if (name === "mob.enderdragon.hit") { //etherwarp
            this.recentEtherwarps.push({ loc: pos, id: this.actionId++ })
        }
        if (name === "random.explode" && pitch !== 1) { //tnt OR MIGHT BE spirit scepter
            this.recentTnts.push({ loc: pos, id: this.actionId++ })
        }
        if (name === "mob.bat.death") {
            this.recentInteracts.push({ loc: pos, id: this.actionId++ })
        }
        if (nameSplitted[0] === "dig") { //mining block
            if (!this.recentMines.some(a =>
                a.loc.x === pos.x
                && a.loc.y === pos.y
                && a.loc.z === pos.z
            )) {
                this.recentMines.push({ loc: pos, id: this.actionId++ })
            }
        }
    }

    onDisable() {

    }

}

module.exports = {
    class: new DungeonRoutes()
}
