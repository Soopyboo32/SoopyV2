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
        this.recentTnts = []
        this.lastLocationUpdatedTime = Date.now()

        this.registerEvent("soundPlay", this.playSound)
        this.registerEvent("worldLoad", this.worldLoad)

        this.registerStep(true, 5, () => {
            if (this.recentLocations.length === 0
                || Math.ceil(Player.getX()) !== this.recentLocations[this.recentLocations.length - 1].loc[0]
                || Math.ceil(Player.getY()) !== this.recentLocations[this.recentLocations.length - 1].loc[1]
                || Math.ceil(Player.getZ()) !== this.recentLocations[this.recentLocations.length - 1].loc[2]) {

                this.recentLocations.push({ loc: [Math.ceil(Player.getX()), Math.ceil(Player.getY()), Math.ceil(Player.getZ())], id: this.actionId++ })

                this.checkForRemove()
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
        this.recentLocations = []
        this.recentTnts = []
    }

    checkForRemove() {
        if (this.recentLocations.length + this.recentMines.length + this.recentEtherwarps.length + this.recentTnts.length > 50) {
            let arrs = [this.recentLocations, this.recentMines, this.recentEtherwarps, this.recentTnts]
            let smallestArr = undefined
            
            if (this.recentLocations[0].id < this.recentMines[0].id && this.recentLocations[0].id < this.recentEtherwarps[0].id) {
                this.recentLocations.shift()
                return
            }
            if (this.recentMines[0].id < this.recentLocations[0].id && this.recentMines[0].id < this.recentEtherwarps[0].id) {
                this.recentMines.shift()
                return
            }
            if (this.recentEtherwarps[0].id < this.recentMines[0].id && this.recentEtherwarps[0].id < this.recentLocations[0].id) {
                this.recentEtherwarps.shift()
                return
            }
        }
    }

    playSound(pos, name, volume, pitch, categoryName, event) {
        let nameSplitted = name.split(".")
        if (name === "mob.enderdragon.hit") { //etherwarp
            this.recentEtherwarps.push({ loc: pos, id: this.actionId++ })
            this.checkForRemove()
        }
        if (name === "random.explode") { //etherwarp
            this.recentTnts.push({ loc: pos, id: this.actionId++ })
            this.checkForRemove()
        }
        if (nameSplitted[0] === "dig") { //mining block
            if (!this.recentMines.some(a =>
                a.loc.x === pos.x
                && a.loc.y === pos.y
                && a.loc.z === pos.z
            )) {
                this.recentMines.push({ loc: pos, id: this.actionId++ })
                this.checkForRemove()
            }
        }
    }

    onDisable() {

    }

}

module.exports = {
    class: new DungeonRoutes()
}
