/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import { drawBoxAtBlock, drawFilledBox, drawLinePoints } from "../../utils/renderUtils";
import SettingBase from "../settings/settingThings/settingBase";


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
        this.lastLocationUpdatedTime = Date.now()

        this.registerEvent("soundPlay", this.playSound)
        this.registerEvent("worldLoad", this.worldLoad)

        this.registerStep(true, 5, () => {
            if (this.recentLocations.length === 0
                || Math.trunc(Player.getX()) !== this.recentLocations[this.recentLocations.length - 1].loc[0]
                || Math.trunc(Player.getY()) !== this.recentLocations[this.recentLocations.length - 1].loc[1]
                || Math.trunc(Player.getZ()) !== this.recentLocations[this.recentLocations.length - 1].loc[2]) {

                this.recentLocations.push({ loc: [Math.trunc(Player.getX()), Math.trunc(Player.getY()), Math.trunc(Player.getZ())], id: this.actionId++ })

                if (this.recentLocations.length > 50) this.recentLocations.shift()
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
            if (this.recentLocations.length >= 2) drawLinePoints(this.recentLocations.map(a => [a.loc[0] - 0.5, a.loc[1] + 0.1, a.loc[2] - 0.5]), 0, 0, 255, 2, true)
        })
    }

    worldLoad() {
        this.recentEtherwarps = []
        this.recentMines = []
    }

    playSound(pos, name, volume, pitch, categoryName, event) {
        let nameSplitted = name.split(".")
        if (name === "mob.enderdragon.hit") { //etherwarp
            this.recentEtherwarps.push({ loc: pos, id: this.actionId++ })
            if (this.recentEtherwarps.length > 10) this.recentEtherwarps.shift()
        }
        if (nameSplitted[0] === "dig") { //mining block
            if (!this.recentMines.some(a =>
                a.loc.x === pos.x
                && a.loc.y === pos.y
                && a.loc.z === pos.z
            )) {
                this.recentMines.push({ loc: pos, id: this.actionId++ })
                if (this.recentMines.length > 10) this.recentMines.shift()
            }
        }
    }

    onDisable() {

    }

}

module.exports = {
    class: new DungeonRoutes()
}
