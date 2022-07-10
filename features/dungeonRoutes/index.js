/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import { drawBoxAtBlock, drawBoxAtBlock2, drawFilledBox, drawLine, drawLinePoints } from "../../utils/renderUtils";
import SettingBase from "../settings/settingThings/settingBase";

const EntityItem = Java.type("net.minecraft.entity.item.EntityItem")

const EnumParticleTypes = Java.type('net.minecraft.util.EnumParticleTypes');

class DungeonRoutes extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        if (Player.getUUID().toString() !== "dc8c3964-7b29-4e03-ae9e-d13ebd65dd29") {
            new SettingBase("Coming soontm", "maby", undefined, "coming_soontm", this)
            return
        }

        this.recordingData = []
        this.currentActionIndex = 0
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
                this.recordingData = []

                this.currRoomData = this.getRoomWorldData()

                this.currentRouteDisplay = this.routesIndexMap.get(this.fullRoomData[this.idMap.get(roomId)].index)?.data
                ChatLib.chat(JSON.stringify(this.currentRouteDisplay, undefined, 2))
            }

            if (!this.recordRoute) return
            if (!this.recordingData[this.recordingData.length - 1]) return
            let locs = this.recordingData[this.recordingData.length - 1].locations
            if (locs.length === 0
                || Math.ceil(Player.getX()) !== locs[locs.length - 1][0]
                || Math.ceil(Player.getY()) !== locs[locs.length - 1][1]
                || Math.ceil(Player.getZ()) !== locs[locs.length - 1][2]) {

                this.addRecordingPoint("locations", [Math.ceil(Player.getX()), Math.ceil(Player.getY()), Math.ceil(Player.getZ())])
            }
        })

        this.registerEvent("renderWorld", () => {
            if (this.recordingData && this.recordingData[this.recordingData.length - 1]) {
                this.recordingData[this.recordingData.length - 1].etherwarps.forEach((loc) => {
                    drawFilledBox(loc[0], loc[1] - 1, loc[2], 1, 1, 1, 0, 0, 50 / 255, true)
                    drawBoxAtBlock(loc[0] - 0.5, loc[1] - 1, loc[2] - 0.5, 1, 0, 0, 1, 1, 1)
                })
                this.recordingData[this.recordingData.length - 1].mines.forEach((loc) => {
                    drawFilledBox(loc[0], loc[1] - 0.5, loc[2], 1, 1, 0, 1, 0, 50 / 255, true)
                })
                this.recordingData[this.recordingData.length - 1].tnts.forEach((loc) => {
                    drawFilledBox(loc[0], loc[1] - 0.5, loc[2], 1, 1, 1, 0, 0, 50 / 255, true)
                })
                this.recordingData[this.recordingData.length - 1].interacts.forEach(({ loc }) => {
                    drawFilledBox(loc[0], loc[1], loc[2], 1, 1, 0, 0, 1, 50 / 255, true)
                    drawBoxAtBlock(loc[0] - 0.5, loc[1], loc[2] - 0.5, 0, 0, 1, 1, 1, 1)
                })
                let locs = this.recordingData[this.recordingData.length - 1].locations
                if (locs.length >= 2) drawLinePoints(locs.map(a => [a[0] - 0.5, a[1] + 0.1, a[2] - 0.5]), 0, 0, 255, 2, false)
            }

            if (this.currRoomData) {
                drawBoxAtBlock(...this.toRoomCoordinates(0, 70, 0), 1, 0, 0, 1, 1, 1)
                if (this.currentRouteDisplay) {
                    this.currentRouteDisplay[this.currentActionIndex].etherwarps.forEach(loc => {
                        let coords = this.toRoomCoordinates(loc[0], loc[1] - 1, loc[2])
                        drawFilledBox(coords[0], coords[1], coords[2], 1, 1, 1, 0, 0, 50 / 255, true)
                        drawBoxAtBlock(coords[0] - 0.5, coords[1], coords[2] - 0.5, 1, 0, 0, 1, 1, 1)
                    })
                    this.currentRouteDisplay[this.currentActionIndex].mines.forEach(loc => {
                        let coords = this.toRoomCoordinates(loc[0], loc[1] - 1, loc[2])
                        drawFilledBox(coords[0], coords[1] + 0.5, coords[2], 1, 1, 0, 255, 0, 50 / 255, true)
                    })
                    this.currentRouteDisplay[this.currentActionIndex].tnts.forEach(loc => {
                        let coords = this.toRoomCoordinates(loc[0], loc[1] - 1, loc[2])
                        drawFilledBox(coords[0], coords[1] + 0.5, coords[2] + 0.5, 1, 1, 255, 0, 0, 50 / 255, true)
                    })
                    this.currentRouteDisplay[this.currentActionIndex].interacts.forEach((data) => {
                        let coords = this.toRoomCoordinates(data.loc[0], data.loc[1], data.loc[2])
                        drawFilledBox(coords[0], coords[1], coords[2], 1, 1, 0, 0, 1, 50 / 255, true)
                        drawBoxAtBlock(coords[0], coords[1], coords[2], 0, 0, 1, 1, 1, 1)
                    })

                    // if (this.currentRouteDisplay.locations.length >= 2) drawLinePoints(this.currentRouteDisplay.locations.map(a => this.toRoomCoordinates(...a)).map(a => [a[0] - 0.5, a[1] + 0.1, a[2] - 0.5]), 0, 0, 255, 2, false)

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
            this.recordingData = []
            this.addRecordingPoint()
            ChatLib.chat(this.FeatureManager.messagePrefix + "Started recording route!")
        })

        this.registerCommand("saveroute", () => {
            let data = {
                index: this.fullRoomData[this.idMap.get(this.lastRoomId)].index,
                data: this.recordingData.map(a => {
                    a.etherwarps = a.etherwarps.map(a => this.fromRoomCoordinates(a[0] + 0.5, a[1], a[2] + 0.5))
                    a.mines = a.mines.map(a => this.fromRoomCoordinates(a[0] + 0.5, a[1], a[2] + 0.5))
                    a.locations = a.locations.map(a => this.fromRoomCoordinates(...a))
                    a.interacts = a.interacts.map(b => {
                        b.pos = this.fromRoomCoordinates(...b.pos)
                        return b
                    })
                    a.tnts = a.tnts.map(a => this.fromRoomCoordinates(a[0] + 0.5, a[1], a[2] + 0.5))

                    return a
                })
            }
            // this.recordingData.push({
            //     etherwarps: [],
            //     mines: [],
            //     locations: [],
            //     interacts: [],
            //     tnts: []
            // })

            ChatLib.chat(JSON.stringify(data, undefined, 4))
            ChatLib.chat(this.FeatureManager.messagePrefix + "Saved route!")
            this.recordRoute = false
        })

        this.registerStep(true, 5, () => {
            if (this.currRoomData) {
                if (this.currentRouteDisplay) {
                    // this.currentRouteDisplay.etherwarps.forEach(loc => {
                    //     let coords = this.toRoomCoordinates(loc[0], loc[1] - 1, loc[2])
                    //     drawFilledBox(coords[0] + 0.5, coords[1], coords[2] + 0.5, 1, 1, 1, 0, 0, 50 / 255, true)
                    //     drawBoxAtBlock(coords[0], coords[1], coords[2], 1, 0, 0, 1, 1, 1)
                    // })
                    // this.currentRouteDisplay.mines.forEach(loc => {
                    //     let coords = this.toRoomCoordinates(loc[0], loc[1] - 1, loc[2])
                    //     drawFilledBox(coords[0] + 0.5, coords[1] + 0.5, coords[2] + 0.5, 1, 1, 0, 255, 0, 50 / 255, true)
                    // })
                    // this.currentRouteDisplay.tnts.forEach(loc => {
                    //     let coords = this.toRoomCoordinates(loc[0], loc[1] - 1, loc[2])
                    //     drawFilledBox(coords[0] + 0.5, coords[1] + 0.5, coords[2] + 0.5, 1, 1, 255, 0, 0, 50 / 255, true)
                    // })
                    // this.currentRouteDisplay.interacts.forEach(loc => {
                    //     let coords = this.toRoomCoordinates(loc[0], loc[1], loc[2])
                    //     drawFilledBox(coords[0] + 0.5, coords[1], coords[2] + 0.5, 1, 1, 0, 0, 1, 50 / 255, true)
                    //     drawBoxAtBlock(coords[0], coords[1], coords[2], 0, 0, 1, 1, 1, 1)
                    // })

                    if (this.currentRouteDisplay[this.currentActionIndex].locations.length >= 2) this.drawLineMultipleParticles(this.currentRouteDisplay[this.currentActionIndex].locations.map(a => this.toRoomCoordinates(a[0], a[1], a[2])))

                }
            }
        })
    }

    addRecordingPoint(type, point) {
        if (type) {
            this.recordingData[this.recordingData.length - 1][type].push(point)
        }
        if (!type || type === "interact") {
            this.recordingData.push({
                etherwarps: [],
                mines: [],
                locations: [],
                interacts: [],
                tnts: []
            })
        }
    }
    drawLineMultipleParticles(locations) {
        let lastLoc = undefined
        locations.forEach(loc => {
            if (!lastLoc) {
                lastLoc = loc
                return
            }

            this.drawLineParticles(lastLoc, loc)
            lastLoc = loc
        })
    }

    drawLineParticles(loc1, loc2) {
        let distance = Math.hypot(...loc1.map((a, i) => a - loc2[i]))
        let maxPoints = Math.ceil(distance * 1)
        for (let i = 0; i < maxPoints; i++) {
            let actualI = i + Math.random()
            let a = actualI / maxPoints
            let loc = [loc1[0] * a + loc2[0] * (1 - a) - 0.5, loc1[1] * a + loc2[1] * (1 - a) + 0.1, loc1[2] * a + loc2[2] * (1 - a) - 0.5]

            let a2 = (actualI + 0.02) / maxPoints
            let loc3 = [loc1[0] * a2 + loc2[0] * (1 - a2) - 0.5, loc1[1] * a2 + loc2[1] * (1 - a2) + 0.1, loc1[2] * a2 + loc2[2] * (1 - a2) - 0.5]
            loc3 = loc3.map((a, i) => loc[i] - a)

            this.spawnParticleAtLocation(loc, loc3, "FLAME")
        }
    }

    spawnParticleAtLocation(loc, velo, particle) {
        let particleType = EnumParticleTypes.valueOf(particle);
        let idField = particleType.getClass().getDeclaredField('field_179372_R');
        idField.setAccessible(true);
        let id = idField.get(particleType);

        Client.getMinecraft().field_71438_f.func_174974_b(
            id,   // particleID
            true, // shouldIgnoreRange
            loc[0],  // x
            loc[1],  // y
            loc[2],      // z
            velo[0],      // speedX
            velo[1],      // speedY
            velo[2],      // speedZ
        );
    }

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
            if (one === 0 && four === 0) return 3
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

            if (pos) this.addRecordingPoint("interacts", { loc: pos, type: "item" })
        }
    }

    playerInteract(action, position, event) {
        if (!this.recordRoute) return
        if (action.toString() !== "RIGHT_CLICK_BLOCK") return

        let pos = { x: Player.lookingAt().getX() + 0.5, y: Player.lookingAt().getY(), z: Player.lookingAt().getZ() + 0.5 }

        let id = Player.lookingAt().getType().getID()
        if (id !== 54 && id !== 144 && id !== 69) return

        this.addRecordingPoint("interacts", { loc: pos, type: "interact" })
    }

    playSound(pos, name, volume, pitch, categoryName, event) {
        if (!this.recordRoute) return

        let loc = [pos.x, pos.y, pos.z]
        let nameSplitted = name.split(".")
        if (name === "mob.enderdragon.hit") { //etherwarp
            this.addRecordingPoint("etherwarps", loc)
        }
        if (name === "random.explode" && pitch !== 1) { //tnt OR MIGHT BE spirit scepter
            this.addRecordingPoint("tnts", loc)
        }
        if (name === "mob.bat.death") {
            this.addRecordingPoint("interacts", { loc: loc, type: "bat" })
        }
        if (nameSplitted[0] === "dig") { //mining block
            if (!this.recordingData[this.recordingData.length - 1].mines.some(a =>
                a[0] === pos[0]
                && a[1] === pos[1]
                && a[2] === pos[2]
            )) {
                this.addRecordingPoint("mines", loc)
            }
        }
    }

    onDisable() {

    }

}

module.exports = {
    class: new DungeonRoutes()
}
