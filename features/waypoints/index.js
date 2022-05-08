/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
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

        this.loadWaypointsFromSendCoords = new ToggleSetting("Load waypoints from /patcher sendcoords messages", "Will dissapear after 1min", true, "load_waypoints_from_sendcoords", this)

        this.userWaypoints = JSON.parse(FileLib.read("soopyAddonsData", "soopyv2userwaypoints.json") || "{}")
        this.userWaypointsHash = {}
        this.userWaypointsAll = []
        this.userWaypointsArr = Object.values(this.userWaypoints)
        this.updateWaypointsHashes()
        this.waypointsChanged = false

        this.patcherWaypoints = []

        this.registerEvent("renderWorld", this.renderWorld)

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
            ChatLib.chat(this.FeatureManager.messagePrefix + "Added waypoint " + name + "!")
        })

        this.registerCommand("delwaypoint", (name) => {
            delete this.userWaypoints[name]
            this.userWaypointsArr = Object.values(this.userWaypoints)
            this.waypointsChanged = true
            this.updateWaypointsHashes()
            ChatLib.chat(this.FeatureManager.messagePrefix + "Deleted waypoint " + name + "!")
        })
        this.registerCommand("clearwaypoints", () => {
            this.userWaypoints = {}
            this.userWaypointsArr = []
            this.waypointsChanged = true
            this.updateWaypointsHashes()
            ChatLib.chat(this.FeatureManager.messagePrefix + "Cleared waypoints!")
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
                ChatLib.chat(this.FeatureManager.messagePrefix + "Loaded waypoints from clipboard!")
            } catch (e) {
                ChatLib.chat(this.FeatureManager.messagePrefix + "Error loading from clipboard!")
            }
        })
        //&r&9Party &8> &6[MVP&4++&6] Soopyboo32&f: &rx: -150, y: 73, z: -97 &r
        //&r&6[MVP&r&4++&r&6] Soopyboo32&r&f: x: 23, y: 100, z: -2&r
        //&r&6[MVP&r&4++&r&6] Soopyboo32&r&f: x: -22, y: 100, z: 7&r
        this.registerChat("&r${*} &8> ${player}&f: &rx: ${x}, y: ${y}, z: ${z}", (player, x, y, z, e) => {
            if (this.loadWaypointsFromSendCoords.getValue()) {
                this.patcherWaypoints.push([Date.now(), parseInt(x), parseInt(y), parseInt(ChatLib.removeFormatting(z)), ChatLib.addColor(player)])
            }
        })
        this.registerChat("${player}&r&f: x: ${x}, y: ${y}, z: ${z}", (player, x, y, z, e) => {
            if (player.includes(">")) return
            if (this.loadWaypointsFromSendCoords.getValue()) {
                this.patcherWaypoints.push([Date.now(), parseInt(x), parseInt(y), parseInt(ChatLib.removeFormatting(z)), ChatLib.addColor(player)])
            }
        })

        this.registerStep(false, 5, () => {
            while (this.patcherWaypoints[0]?.[0] < Date.now() - 60000) {
                this.patcherWaypoints.shift()
            }
        })
    }

    updateWaypointsHashes() {
        this.userWaypointsAll = []
        this.userWaypointsHash = {}
        for (let waypoint of this.userWaypointsArr) {
            if (!waypoint.area) {
                this.userWaypointsAll.push(waypoint)
            } else {
                if (!this.userWaypointsHash[waypoint.area]) this.userWaypointsHash[waypoint.area] = []
                this.userWaypointsHash[waypoint.area].push(waypoint)
            }
        }
    }

    renderWorld() {
        for (let waypoint of this.userWaypointsAll) {
            drawCoolWaypoint(waypoint.x, waypoint.y, waypoint.z, waypoint.r, waypoint.g, waypoint.b, waypoint.options)
        }
        if (this.userWaypointsHash[this.FeatureManager.features["dataLoader"].class.area]) {
            for (let waypoint of this.userWaypointsHash[this.FeatureManager.features["dataLoader"].class.area]) {
                drawCoolWaypoint(waypoint.x, waypoint.y, waypoint.z, waypoint.r, waypoint.g, waypoint.b, waypoint.options)
            }
        }
        for (let waypoint of this.patcherWaypoints) {
            drawCoolWaypoint(waypoint[1], waypoint[2], waypoint[3], 0, 255, 0, { name: waypoint[4] })
        }
    }

    initVariables() {

    }

    onDisable() {
        if (this.waypointsChanged) {
            FileLib.write("soopyAddonsData", "soopyv2userwaypoints.json", JSON.stringify(this.userWaypoints))
        }

        this.initVariables()
    }
}

module.exports = {
    class: new Waypoints()
}