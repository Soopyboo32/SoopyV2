/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import { Waypoint } from "../../utils/renderJavaUtils";
import { drawCoolWaypoint, drawLine } from "../../utils/renderUtils";
import { calculateDistanceQuick } from "../../utils/utils";
import SettingBase from "../settings/settingThings/settingBase";
import ToggleSetting from "../settings/settingThings/toggle";
import minewaypoints_socket from "./minewaypoints_socket";

const DataOutputStream = Java.type("java.io.DataOutputStream")
const ByteArrayOutputStream = Java.type("java.io.ByteArrayOutputStream")
const Base64 = Java.type("java.util.Base64")
const DataInputStream = Java.type("java.io.DataInputStream")
const ByteArrayInputStream = Java.type("java.io.ByteArrayInputStream")
const WAYPOINT_DATAFILE_VERSION = 1

let areas = {
    "MinesofDivan": "Mines of Divan",
    "LostPrecursorCity": "Lost Precursor City",
    "JungleTemple": "Jungle Temple",
    "GoblinQueensDen": "Goblin Queen's Den",
    "Khazaddm": "Khazad-dûm",
    "KingYolkar": "§6King Yolkar",
    "BossCorleone": "§cBoss Corleone"
}

class Waypoints extends Feature {
    constructor() {
        super()
    }

    isInCH() {
        if (!this.FeatureManager || !this.FeatureManager.features["dataLoader"]) return false
        return this.FeatureManager.features["dataLoader"].class.area === "Crystal Hollows"
    }

    onEnable() {
        this.initVariables()

        new SettingBase("/addwaypoint [name] [x] [y] [z] [r?] [g?] [b?] [area?]", "Allows you to create a waypoint", undefined, "create_waypoint", this)
        new SettingBase("/delwaypoint [name]", "Allows you to delete a waypoint", undefined, "delete_waypoint", this)
        new SettingBase("/clearwaypoints", "Allows you to clear all the waypoints", undefined, "clear_waypoints", this)
        new SettingBase("/savewaypoints", "Copys the waypoints to your clipboard", undefined, "save_waypoints", this)
        new SettingBase("/loadwaypoints", "Loads waypoints from your clipboard", undefined, "load_waypoints", this)
        this.showInfoInChat = new ToggleSetting("Show info in chat", "Should chat msg be sent when theres waypoint added/cleared/removed", true, "waypoints_send_message", this);

        this.loadWaypointsFromSendCoords = new ToggleSetting("Load waypoints from /patcher sendcoords messages", "Will dissapear after 1min", true, "load_waypoints_from_sendcoords", this)
        this.mineWaypointsSetting = new ToggleSetting("CH waypoints", "Will sync between users", true, "minwaypoints", this)

        this.orderedWaypointsLine = new ToggleSetting("Ordered waypoints line", "Draw a line from you to next ordered waypoint", false, "order_waypoints_line", this)

        try {
            this.userWaypoints = JSON.parse(FileLib.read("soopyAddonsData", "soopyv2userwaypoints.json") || "{}")
        } catch (e) {
            ChatLib.chat(this.messagePrefix + "&cYour waypoints file corrupted and could not be read! Resetting to defaults.")
            this.userWaypoints = {}
        }
        this.userWaypointsHash = {}
        this.userWaypointsAll = []
        this.lastArea = undefined
        this.userWaypointsArr = Object.values(this.userWaypoints)
        this.updateWaypointsHashes()
        this.waypointsChanged = false

        this.patcherWaypoints = []

        this.registerCommand("addwaypoint", (name, x = Math.floor(Player.getX()).toString(), y = Math.floor(Player.getY()).toString(), z = Math.floor(Player.getZ()).toString(), r = "0", g = "255", b = "0", area = "") => {
            let lx = 0
            let ly = 0
            let lz = 0

            if (Player.lookingAt().getX) {
                lx = Player.lookingAt().getX()
                ly = Player.lookingAt().getY()
                lz = Player.lookingAt().getZ()

                if (Player.lookingAt().getWidth) {
                    lx += -0.5
                    lz += -0.5
                }
            }

            this.userWaypoints[name] = {
                x: parseFloat(x.replace("l", lx).replace('p', Math.floor(Player.getX()))),
                y: parseFloat(y.replace("l", ly).replace('p', Math.floor(Player.getY()))),
                z: parseFloat(z.replace("l", lz).replace('p', Math.floor(Player.getZ()))),
                r: parseInt(r) / 255,
                g: parseInt(g) / 255,
                b: parseInt(b) / 255,
                area: area === "a" ? this.FeatureManager.features["dataLoader"].class.area : area.replace(/_/g, " "),
                options: { name: ChatLib.addColor(name.replace(/_/g, " ")) }
            }

            this.userWaypointsArr = Object.values(this.userWaypoints)
            this.waypointsChanged = true
            this.updateWaypointsHashes()
            if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Added waypoint " + name + "!")
        })

        this.registerCommand("delwaypoint", (name) => {
            delete this.userWaypoints[name]
            this.userWaypointsArr = Object.values(this.userWaypoints)
            this.waypointsChanged = true
            this.updateWaypointsHashes()
            if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Deleted waypoint " + name + "!")
        })
        this.registerCommand("clearwaypoints", () => {
            this.userWaypointsAll.forEach(w => w.stopRender())
            Object.values(this.userWaypointsHash).forEach(a => a.forEach(w => w.stopRender()))
            this.userWaypoints = {}
            this.userWaypointsArr = []
            this.waypointsChanged = true
            this.updateWaypointsHashes()
            if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Cleared waypoints!")
        })
        this.registerCommand("savewaypoints", () => {
            try {
                let wayStr = writeWaypointsJSONToString(this.userWaypoints)

                if (wayStr[0] === true) { //Needs to check for exactly 'true' as it should not run if its an object instead
                    ChatLib.chat(this.FeatureManager.messagePrefix + wayStr[1])
                    return
                }

                Java.type("net.minecraft.client.gui.GuiScreen")[m.setClipboardString](wayStr)

                ChatLib.chat(this.FeatureManager.messagePrefix + "Saved waypoints to clipboard!")
            } catch (e) {
                Java.type("net.minecraft.client.gui.GuiScreen")[m.setClipboardString](JSON.stringify(this.userWaypoints))
                ChatLib.chat(this.FeatureManager.messagePrefix + "Error saving waypoints, copied raw json to clipboard instead D:")
            }
        })
        this.registerCommand("loadwaypoints", () => {
            try {
                let waypointData = readWaypointsJSONFromString(Java.type("net.minecraft.client.gui.GuiScreen")[m.getClipboardString]())
                if (waypointData[0] === true) { //Needs to check for exactly 'true' as it should not run if its an object instead
                    ChatLib.chat(this.FeatureManager.messagePrefix + waypointData[1])
                    return
                }
                this.userWaypoints = waypointData

                this.userWaypointsArr = Object.values(this.userWaypoints)
                this.waypointsChanged = true
                this.updateWaypointsHashes()
                if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Loaded waypoints from clipboard!")
            } catch (e) {
                if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Error loading from clipboard!")
                console.log(JSON.stringify(e, undefined, 2))
                console.log(e.stack)
            }
        })

        this.orderedWaypoints = new Map()
        this.currentOrderedWaypointIndex = -1
        this.registerCommand("loadorderedwaypoints", () => {
            try {
                let waypointData = readWaypointsJSONFromString(Java.type("net.minecraft.client.gui.GuiScreen")["func_146277_j"]());
                this.userWaypointsArr=Object.values(waypointData);

                this.userWaypointsArr.forEach((w)=>{
                    let k = w.options.name;
                    this.orderedWaypoints.set(parseInt(k),[w.x, w.y, w.z, k]);
                });

                this.currentOrderedWaypointIndex = 0;
            
                if(this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Loaded waypoints from clipboard!");
            } catch (e) {
                if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Error loading from clipboard!")
                console.log(JSON.stringify(e, undefined, 2))
                console.log(e.stack)
            }
        })
        this.registerCommand("converttoorder", () => {
            try {
                this.userWaypointsArr.forEach(w => {
                    let k = w.options.name
                    this.orderedWaypoints.set(parseInt(k), [w.x, w.y, w.z, k])
                })
                this.currentOrderedWaypointIndex = 0

                if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Converted into order. You might need to do /clearwaypoints to see (WARNING WILL CLEAR NORMAL WAYPOINTS)!")
            } catch (e) {
                if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Error loading!")
                console.log(JSON.stringify(e, undefined, 2))
                console.log(e.stack)
            }
        })
        this.registerCommand("clearorderedwaypoints", () => {
            this.currentOrderedWaypointIndex = -1
            this.orderedWaypoints.clear()
            if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Cleared waypoints!")
        })
        this.registerCommand("setorderwaypointindex", (ind) => {
            this.currentOrderedWaypointIndex = parseInt(ind)
            if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Set index to " + ind + "!")
        })
        this.registerCommand("detectorderwaypointindex", (ind) => {
            let numCheck = 0
            let currentWaypoint = this.orderedWaypoints.get(numCheck)
            let minDist = currentWaypoint ? Math.hypot(Player.getX() - currentWaypoint[0], Player.getY() - currentWaypoint[1], Player.getZ() - currentWaypoint[2]) : Infinity
            let closest = 0
            while (this.orderedWaypoints.get(numCheck + 1)) {
                numCheck++
                let currentWaypoint = this.orderedWaypoints.get(numCheck)
                let dist = Math.hypot(Player.getX() - currentWaypoint[0], Player.getY() - currentWaypoint[1], Player.getZ() - currentWaypoint[2])
                if (dist < minDist) {
                    minDist = dist
                    closest = numCheck
                }
            }
            this.currentOrderedWaypointIndex = closest
            if (this.showInfoInChat.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + "Set index to " + closest + "!")
        })
        this.lastCloser = 0
        this.registerEvent("renderWorld", () => {
            if (this.currentOrderedWaypointIndex === -1) return

            let currentWaypoint = this.orderedWaypoints.get(this.currentOrderedWaypointIndex)
            let distanceTo1 = Infinity
            if (currentWaypoint) {
                distanceTo1 = Math.hypot(Player.getX() - currentWaypoint[0], Player.getY() - currentWaypoint[1], Player.getZ() - currentWaypoint[2])
                drawCoolWaypoint(currentWaypoint[0], currentWaypoint[1], currentWaypoint[2], 0, 255, 0, { name: currentWaypoint[3] })
            }

            let nextWaypoint = this.orderedWaypoints.get(this.currentOrderedWaypointIndex + 1)
            if (!nextWaypoint) {
                if (this.orderedWaypoints.get(0)) {
                    nextWaypoint = this.orderedWaypoints.get(0)
                } else if (this.orderedWaypoints.get(1)) {
                    nextWaypoint = this.orderedWaypoints.get(1)
                }
            }
            let distanceTo2 = Infinity
            if (nextWaypoint) {
                distanceTo2 = Math.hypot(Player.getX() - nextWaypoint[0], Player.getY() - nextWaypoint[1], Player.getZ() - nextWaypoint[2])
                drawCoolWaypoint(nextWaypoint[0], nextWaypoint[1], nextWaypoint[2], 0, 255, 0, { name: nextWaypoint[3] })
            }

            if (this.orderedWaypointsLine.getValue() && nextWaypoint) {
                if(Player.isSneaking())
                    drawLine(Player.getRenderX(), Player.getRenderY() + 1.54, Player.getRenderZ(), nextWaypoint[0] + 0.5, nextWaypoint[1],nextWaypoint[2] + 0.5, 0, 255, 0);
                else
                    drawLine(Player.getRenderX(), Player.getRenderY() + 1.62, Player.getRenderZ(), nextWaypoint[0] + 0.5, nextWaypoint[1],nextWaypoint[2] + 0.5, 0, 255, 0);
            }

            if (this.lastCloser === this.currentOrderedWaypointIndex && distanceTo1 > distanceTo2 && distanceTo2 < 15) {
                this.currentOrderedWaypointIndex++
                if (!this.orderedWaypoints.get(this.currentOrderedWaypointIndex)) {
                    this.currentOrderedWaypointIndex = 0
                }
                return
            }
            if (distanceTo1 < 5) {
                this.lastCloser = this.currentOrderedWaypointIndex
            }
            if (distanceTo2 < 5) {
                this.currentOrderedWaypointIndex++
                if (!this.orderedWaypoints.get(this.currentOrderedWaypointIndex)) {
                    this.currentOrderedWaypointIndex = 0
                }
            }
        })


        this.ignorePlayers = new Set()

        this.registerCommand("waypointignoreadd", (player) => {
            this.ignorePlayers.add(player)
            ChatLib.chat(this.FeatureManager.messagePrefix + "Added " + player + " to waypoint ignore list, this will be cleared next game start!")

            this.patcherWaypoints = this.patcherWaypoints.filter(w => {
                if (ChatLib.removeFormatting(w[1].params.name).trim().split(" ").pop() === player) {
                    w[1].stopRender()
                    return false
                }

                return true
            })
        })

        this.registerChat("&r${*} &8> ${player}&f: &rx: ${x}, y: ${y}, z: ${z}", (player, x, y, z, e) => {
            let p = ChatLib.removeFormatting(player).trim().split(" ").pop()
            if (this.loadWaypointsFromSendCoords.getValue() && !this.ignorePlayers.has(p)) {
                new TextComponent(this.FeatureManager.messagePrefix + "Loaded waypoint from &6" + p + "&7, &cCLICK HERE &7to ignore waypoints from them.").setClick("run_command", "/waypointignoreadd " + p).chat()
                this.patcherWaypoints.push([Date.now(), new Waypoint(parseInt(x), parseInt(y), parseInt(ChatLib.removeFormatting(z)), 0, 0, 1, { name: ChatLib.addColor(player), showDist: true }).startRender()])
                if (this.patcherWaypoints.length > 10) this.patcherWaypoints.shift()[1].stopRender()
            }
        })
        this.registerChat("${player}&r&f: x: ${x}, y: ${y}, z: ${z}", (player, x, y, z, e) => {
            if (player.includes(">")) return
            let p = ChatLib.removeFormatting(player).trim().split(" ").pop()
            if (this.loadWaypointsFromSendCoords.getValue() && !this.ignorePlayers.has(p)) {//parseInt(x), parseInt(y), parseInt(ChatLib.removeFormatting(z)), ChatLib.addColor(player)
                new TextComponent(this.FeatureManager.messagePrefix + "Loaded waypoint from &6" + p + "&7, &cCLICK HERE &7to ignore waypoints from them.").setClick("run_command", "/waypointignoreadd " + p).chat()
                this.patcherWaypoints.push([Date.now(), new Waypoint(parseInt(x), parseInt(y), parseInt(ChatLib.removeFormatting(z)), 0, 0, 1, { name: ChatLib.addColor(player), showDist: true }).startRender()])
                if (this.patcherWaypoints.length > 10) this.patcherWaypoints.shift()[1].stopRender()
            }
        })

        this.registerStep(false, 5, () => {
            while (this.patcherWaypoints[0]?.[0] < Date.now() - 60000) {
                this.patcherWaypoints.shift()[1].stopRender()
            }
        })

        let lastX = 0
        let lastY = 0
        let lastZ = 0
        let lastTick = 0
        this.registerEvent("renderWorld", () => {
            if (Math.round(Player.getX()) !== lastX
                || Math.round(Player.getY()) !== lastY
                || Math.round(Player.getZ()) !== lastZ
                || Date.now() - lastTick > 500) {
                lastX = Math.round(Player.getX())
                lastY = Math.round(Player.getY())
                lastZ = Math.round(Player.getZ())
                lastTick = Date.now()

                this.tickWaypoints()
            }
        })


        this.lastSend = 0
        this.locations = {}
        minewaypoints_socket.setLocationHandler = (area, loc) => {
            this.locations[area || loc[0].area] = loc;
        }
        let lastLoc = [0, 0, 0]
        this.lastTp = 0
        this.registerEvent("tick", () => {
            if (!this.isInCH()) return
            try {
                if (Scoreboard.getLines().length < 2) return;
                let server = ChatLib.removeFormatting(Scoreboard.getLineByIndex(Scoreboard.getLines().length - 1)).split(" ")

                if (server.length === 2) {
                    server = server[1].replace(/[^0-9A-z]/g, "")
                } else {
                    return;
                }

                minewaypoints_socket.setServer(server, World.getWorld().func_82737_E())

                let loc = [Player.getX(), Player.getY(), Player.getZ()]
                if (calculateDistanceQuick(lastLoc, loc) > 20 ** 2) {
                    this.lastTp = Date.now()
                }
                lastLoc = loc

                if (Date.now() - this.lastSend > 1000 && Date.now() - this.lastTp > 5000) {
                    Scoreboard.getLines().forEach(line => {
                        line = ChatLib.removeFormatting(line.getName()).replace(/[^0-9A-z]/g, "")
                        if (Object.keys(areas).includes(line)) {
                            minewaypoints_socket.setLocation(line, { x: Math.floor(Player.getX()), y: Math.floor(Player.getY()), z: Math.floor(Player.getZ()) })
                        }
                    })
                    this.lastSend = Date.now()
                }
            } catch (e) {
                console.log("SOOPYV2MINEWAYPOINTS ERROR")
                console.log(JSON.stringify(e, undefined, 2))
            }
        })

        this.registerStep(false, 5, () => {

            World.getAllEntities().forEach(e => {
                if (Math.max(Math.abs(Player.getX() - e.getX()), Math.abs(Player.getY() - e.getY()), Math.abs(Player.getZ() - e.getZ())) > 20) return;

                if (!this.locations["KingYolkar"]) {
                    if (ChatLib.removeFormatting(e.getName()) === "King Yolkar") {
                        minewaypoints_socket.setLocation("KingYolkar", { x: e.getX(), y: e.getY() + 3.5, z: e.getZ() })
                    }
                }
                if (ChatLib.removeFormatting(e.getName()).includes("Boss Corleone")) {
                    minewaypoints_socket.setLocation("BossCorleone", { x: e.getX(), y: e.getY() + 3.5, z: e.getZ() })
                }
            })
            // console.log(JSON.stringify(locations, undefined, 2))
        })

        this.registerEvent("renderWorld", () => {
            if (!this.mineWaypointsSetting.getValue()) return
            if (this.FeatureManager.features["dataLoader"].class.area !== "Crystal Hollows") return
            Object.values(this.locations).forEach(item => {
                if (!item) return;
                item.forEach(loc => {
                    // console.log(JSON.stringify(loc, undefined, 2))
                    if (loc.loc.x) {
                        drawCoolWaypoint(loc.loc.x, loc.loc.y, loc.loc.z, 0, 255, 0, { name: areas[loc.area] })
                    } else {
                        drawCoolWaypoint(loc.loc.minX / 2 + loc.loc.maxX / 2, loc.loc.minY / 2 + loc.loc.maxY / 2, loc.loc.minZ / 2 + loc.loc.maxZ / 2, 0, 255, 0, { name: areas[loc.area] })
                    }
                })
            })
        }).registeredWhen(() => this.mineWaypointsSetting.getValue())

        this.registerEvent("worldLoad", () => {
            this.locations = {}
            if (this.currentOrderedWaypointIndex >= 0) this.currentOrderedWaypointIndex = 0
        })
    }

    tickWaypoints() {
        for (let waypoint of this.userWaypointsAll) {
            waypoint.update()
        }
        for (let waypoint of this.patcherWaypoints) {
            waypoint[1].update()
        }
        let area = this.FeatureManager.features["dataLoader"].class.area
        if (this.lastArea && this.lastArea !== area) {
            if (this.userWaypointsHash[this.lastArea]) {
                for (let waypoint of this.userWaypointsHash[lastArea]) {
                    waypoint.stopRender()
                }

            }
        }
        this.lastArea = area

        if (this.userWaypointsHash[area]) {
            for (let waypoint of this.userWaypointsHash[area]) {
                waypoint.update()
                waypoint.startRender()
            }
        }
    }

    updateWaypointsHashes() {
        this.userWaypointsAll.forEach(w => w.stopRender())
        Object.values(this.userWaypointsHash).forEach(a => a.forEach(w => w.stopRender()))

        this.userWaypointsAll = []
        this.userWaypointsHash = {}
        for (let waypoint of this.userWaypointsArr) {
            if (!waypoint.area) {
                this.userWaypointsAll.push(new Waypoint(waypoint.x, waypoint.y, waypoint.z, waypoint.r, waypoint.g, waypoint.b, waypoint.options).startRender())
            } else {
                if (!this.userWaypointsHash[waypoint.area]) this.userWaypointsHash[waypoint.area] = []
                this.userWaypointsHash[waypoint.area].push(new Waypoint(waypoint.x, waypoint.y, waypoint.z, waypoint.r, waypoint.g, waypoint.b, waypoint.options))
            }
        }
    }

    initVariables() {

    }

    onDisable() {
        this.userWaypointsAll.forEach(w => w.stopRender())
        Object.values(this.userWaypointsHash).forEach(a => a.forEach(w => w.stopRender()))
        this.patcherWaypoints.forEach(p => p[1].stopRender())

        if (this.waypointsChanged) {
            FileLib.write("soopyAddonsData", "soopyv2userwaypoints.json", JSON.stringify(this.userWaypoints))
        }

        this.initVariables()
    }
}

module.exports = {
    class: new Waypoints()
}

function readWaypointsJSONFromString(str) {
    try {
        return JSON.parse(str)
    } catch (e) { }

    try {
        let byteArray = Base64.getDecoder().decode(str)

        let dataIS = new DataInputStream(new ByteArrayInputStream(byteArray))

        let dataVersion = dataIS.readByte()
        if (dataVersion !== WAYPOINT_DATAFILE_VERSION) {
            return [true, "Invalid waypoint data version!"]
        }

        let json = {}

        let numbWaypoints = dataIS.readInt()

        for (let i = 0; i < numbWaypoints; i++) {
            let waypointD = {}
            let waypointID = dataIS.readUTF()

            waypointD.x = dataIS.readFloat()
            waypointD.y = dataIS.readFloat()
            waypointD.z = dataIS.readFloat()
            waypointD.r = dataIS.readByte() / (255 / 2)
            waypointD.g = dataIS.readByte() / (255 / 2)
            waypointD.b = dataIS.readByte() / (255 / 2)
            waypointD.area = dataIS.readUTF()
            waypointD.options = { name: dataIS.readUTF() }

            json[waypointID] = waypointD
        }

        return json
    } catch (e) {
        console.log("SOOPY READ WAYPOINTS ERROR!")
        console.log(JSON.stringify(e, undefined, true))
        return [true, "An unknown error occured D:"]
    }
}

function writeWaypointsJSONToString(json) {
    try {
        let byteOS = new ByteArrayOutputStream()
        let dataOS = new DataOutputStream(byteOS)

        dataOS.writeByte(WAYPOINT_DATAFILE_VERSION)

        let waypoints = Object.keys(json)

        dataOS.writeInt(waypoints.length)

        for (let waypointId of waypoints) {
            let waypointData = json[waypointId]

            dataOS.writeUTF(waypointId)
            dataOS.writeFloat(waypointData.x)
            dataOS.writeFloat(waypointData.y)
            dataOS.writeFloat(waypointData.z)
            dataOS.writeByte(Math.floor(waypointData.r * (255 / 2)))
            dataOS.writeByte(Math.floor(waypointData.g * (255 / 2)))
            dataOS.writeByte(Math.floor(waypointData.b * (255 / 2)))
            dataOS.writeUTF(waypointData.area)
            dataOS.writeUTF(waypointData.options.name)
        }

        let encodedString = Base64.getEncoder().encodeToString(byteOS.toByteArray())
        return encodedString
    } catch (e) {
        console.log("SOOPY READ WAYPOINTS ERROR!")
        console.log(JSON.stringify(e, undefined, true))
        return [true, "An unknown error occured D:"]
    }
}

//DATA FORMAT FOR WAYPOINTS:
/**
 * byte versionID
 * int numWaypoints
 * For each waypoint:
 *      String id (UTF8)
 *      float x
 *      float y
 *      float z
 *      byte r (0-255)
 *      byte g (0-255)
 *      byte b (0-255)
 *      String area (UTF8)
 *      String name (UTF8)
 */