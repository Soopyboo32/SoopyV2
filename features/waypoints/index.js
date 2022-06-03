/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import { Waypoint } from "../../utils/renderJavaUtils";
import { drawCoolWaypoint } from "../../utils/renderUtils";
import SettingBase from "../settings/settingThings/settingBase";
import ToggleSetting from "../settings/settingThings/toggle";


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
