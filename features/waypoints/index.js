/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import { Waypoint } from "../../utils/renderJavaUtils";
import { drawCoolWaypoint } from "../../utils/renderUtils";
import SettingBase from "../settings/settingThings/settingBase";
import ToggleSetting from "../settings/settingThings/toggle";
import minewaypoints_socket from "./minewaypoints_socket";


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

        this.userWaypoints = JSON.parse(FileLib.read("soopyAddonsData", "soopyv2userwaypoints.json") || "{}")
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
            Java.type("net.minecraft.client.gui.GuiScreen")[m.setClipboardString](JSON.stringify(this.userWaypoints))
            ChatLib.chat(this.FeatureManager.messagePrefix + "Saved waypoints to clipboard!")
        })
        this.registerCommand("loadwaypoints", () => {
            try {
                this.userWaypoints = JSON.parse(Java.type("net.minecraft.client.gui.GuiScreen")[m.getClipboardString]())

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

        this.registerChat("&r${*} &8> ${player}&f: &rx: ${x}, y: ${y}, z: ${z}", (player, x, y, z, e) => {
            if (this.loadWaypointsFromSendCoords.getValue()) {
                this.patcherWaypoints.push([Date.now(), new Waypoint(parseInt(x), parseInt(y), parseInt(ChatLib.removeFormatting(z)), 0, 0, 1, { name: ChatLib.addColor(player), showDist: true }).startRender()])
                if (this.patcherWaypoints.length > 10) this.patcherWaypoints.shift()[1].stopRender()
            }
        })
        this.registerChat("${player}&r&f: x: ${x}, y: ${y}, z: ${z}", (player, x, y, z, e) => {
            if (player.includes(">")) return
            if (this.loadWaypointsFromSendCoords.getValue()) {//parseInt(x), parseInt(y), parseInt(ChatLib.removeFormatting(z)), ChatLib.addColor(player)
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
            if (!area) return
            if (area == "undefined") return
            this.locations[area] = loc;
            // console.log(JSON.stringify(loc, undefined, 2))
        }

        this.registerEvent("tick", () => {
            try {
                if (Scoreboard.getLines().length < 2) return;
                let server = ChatLib.removeFormatting(Scoreboard.getLineByIndex(Scoreboard.getLines().length - 1)).split(" ")

                if (server.length === 2) {
                    server = server[1].replace(/[^0-9A-z]/g, "")
                } else {
                    return;
                }

                minewaypoints_socket.setServer(server, World.getWorld().func_82737_E())

                if (Date.now() - this.lastSend > 1000) {
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
    }

    tickWaypoints() {
        for (let waypoint of this.userWaypointsAll) {
            waypoint.update()
        }
        for (let waypoint of this.patcherWaypoints) {
            waypoint[1].update()
        }
        let area = this.FeatureManager.features["dataLoader"] ? this.FeatureManager.features["dataLoader"].class.area : "NONE"
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
