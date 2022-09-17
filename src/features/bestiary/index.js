/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import { numberWithCommas } from "../../utils/numberUtils";
import HudTextElement from "../hud/HudTextElement";
import DropdownSetting from "../settings/settingThings/dropdownSetting";
import LocationSetting from "../settings/settingThings/location";
import SettingBase from "../settings/settingThings/settingBase";
import ToggleSetting from "../settings/settingThings/toggle";

let dontUseApi = new Set()
dontUseApi.add("arachne")
dontUseApi.add("barbarian_duke_x")
dontUseApi.add("bladesoul")
dontUseApi.add("mage_outlaw")
dontUseApi.add("ashfang")
dontUseApi.add("magma_cube_boss")
dontUseApi.add("headless_horseman")
dontUseApi.add("dragon")


class Bestiary extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.bestiaryData = JSON.parse(FileLib.read("soopyAddonsData", "bestiaryData.json") || "{}")
        this.bestiaryChanged = false

        this.bestiaryApiTracking = {}

        this.registerStep(true, 5, this.scanInv)
        this.registerStep(false, 5, this.saveData)


        this.bestiaryStatTypes = {
            "barbarian_duke_x": "Barbarian Duke X"
        }
        Object.keys(this.bestiaryData).forEach(k => {
            if (this.bestiaryData[k].guiName) this.bestiaryStatTypes[k] = this.bestiaryData[k].guiName
        })

        new SettingBase("NOTE: u need to open ur bestiary menu", "before this will work", true, "info_bestiary", this)
        this.hudStat = []
        for (let i = 0; i < 10; i++) {
            this.hudStat[i] = {}
            this.hudStat[i].enabled = new ToggleSetting("Bestiary Slot #" + (i + 1), "Allows you to render a custom besiary kills on your hud", false, "bestiary_stat_" + i, this)
            this.hudStat[i].type = new DropdownSetting("Bestiary Slot #" + (i + 1) + " Type", "The bestiary type", "barbarian_duke_x", "bestiary_stat_" + i + "_type", this, this.bestiaryStatTypes)
            this.hudStat[i].location = new LocationSetting("Bestiary Slot #" + (i + 1) + " Location", "Allows you to edit the location of the bestiary stat", "bestiary_stat_" + i + "_location", this, [10, 50 + i * 10, 1, 1]).editTempText("&6Bestiary Stat Stat&7> &f12,345")
            this.hudStat[i].textElement = new HudTextElement().setToggleSetting(this.hudStat[i].enabled).setLocationSetting(this.hudStat[i].location).setText("&6Bestiary Stat&7> &fLoading...")
            this.hudStat[i].onlySb = new ToggleSetting("Bestiary Slot #" + (i + 1) + " Only SB", "Only render this stat when you are in skyblock", true, "bestiary_stat_" + i + "_only_sb", this).requires(this.hudStat[i].enabled)

            this.hudStat[i].location.requires(this.hudStat[i].enabled)
            this.hudStat[i].type.requires(this.hudStat[i].enabled)
            if (this.hudStat[i - 1]) {
                this.hudStat[i].enabled.requires(this.hudStat[i - 1].enabled)
            }
        }

        this.registerStep(false, 5, this.updateHudElements)
        let lastThing = undefined
        let lastThingTime = 0
        this.registerChat("${chat}", (chat) => {
            let thing
            switch (chat.trim()) {
                case "MAGE OUTLAW DOWN!":
                    thing = "mage_outlaw"
                    break;
                case "BARBARIAN DUKE X DOWN!":
                    thing = "barbarian_duke_x"
                    break;
                case "BLADESOUL DOWN!":
                    thing = "bladesoul"
                    break;
                case "ASHFANG DOWN!":
                    thing = "ashfang"
                    break;
                // case "MAGMA BOSS DOWN!":
                //     thing = "magma_cube_boss"
                //     break;
                case "ARACHNE DOWN!":
                    lastThing = "arachne"
                    lastThingTime = Date.now()
                    break;
                case "HORSEMAN DOWN!":
                    lastThing = "arachne"
                    lastThingTime = Date.now()
                    break;
                default:
                    break;
            }
            if (chat.includes("DRAGON")) {
                lastThing = "dragon"
                lastThingTime = Date.now()
            }

            if (chat.trim().startsWith("Your Damage: ")) {
                let dmg = parseInt(chat.trim().split("Your Damage: ")[1].split(" ")[0])
                if (dmg > 0 && Date.now() - lastThingTime < 1000) {
                    thing = lastThing
                    lastThing = ""
                    lastThingTime = 0
                }
            }

            if (thing) {
                this.bestiaryData[thing].guessCount++
                this.bestiaryChanged = true
            }
        })
        this.registerSoopy("apiLoad", this.apiLoad);

        if (this.FeatureManager.features["dataLoader"] && this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock_raw) {
            this.apiLoad(this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock_raw, "skyblock", false, true);
        }
    }

    getBestiaryCount(id) {
        if (!this.bestiaryData[id]) return "???"
        let count = this.bestiaryData[id].count

        if (!dontUseApi.has(id)) {
            let currApiData = this.bestiaryApiTracking[id]

            count += currApiData - this.bestiaryData[id].apiCount
        }

        count += this.bestiaryData[id].guessCount

        return count
    }

    updateHudElements() {
        if (!this.FeatureManager.features["dataLoader"]) return

        let insb = this.FeatureManager.features["dataLoader"].class.isInSkyblock

        this.hudStat.forEach(stat => {
            if (stat.enabled.getValue()) {
                if (!insb && stat.onlySb.getValue()) {
                    stat.textElement.setText("")
                    return
                }

                let type = stat.type.getValue()

                stat.textElement.setText(`&6${this.bestiaryData[type]?.guiName}&7> &f${numberWithCommas(this.getBestiaryCount(type))}`)
            } else {
                stat.textElement.setText("")
            }
        })
    }

    apiLoad(data, dataType, isSoopyServer, isLatest) {
        if (isSoopyServer || !isLatest) return;
        if (dataType !== "skyblock") return;

        let currentProfile = {}
        let currentProfileTime = 0

        data.profiles.forEach(p => {
            if (p.members[Player.getUUID().toString().replace(/-/g, "")].last_save > currentProfileTime) {
                currentProfileTime = p.members[Player.getUUID().toString().replace(/-/g, "")].last_save
                currentProfile = p.members[Player.getUUID().toString().replace(/-/g, "")]
            }
        })

        Object.keys(currentProfile.stats).forEach(key => {
            if (key.startsWith("kills_")) {
                this.bestiaryApiTracking[key.replace("kills_", "")] = currentProfile.stats[key]
            }
        })
    }

    scanInv() {
        if (!Player.getContainer()) return
        if (!Player.getContainer().getName().startsWith("Bestiary ➜ ")) return
        let tempChanged = false
        let seen = new Set()

        for (let item of Player.getContainer().getItems()) {
            if (!item) continue
            let name = ChatLib.removeFormatting(item.getName()).split(" ")
            name.pop()
            let apiName = name.join("_").toLowerCase()
            if (seen.has(apiName)) continue
            seen.add(apiName)

            if (apiName === "skeletor_prime") continue

            if (this.bestiaryApiTracking[apiName] || dontUseApi.has(apiName)) {

                let count = 0

                for (let l of item.getLore()) {
                    l = ChatLib.removeFormatting(l)

                    if (l.startsWith("Kills: ")) {
                        count = parseInt(l.split("Kills: ")[1].replace(/,/g, ""))
                        break;
                    }
                }

                let needsChange = !this.bestiaryData[apiName] || this.bestiaryData[apiName].guiName !== name.join(" ") || this.bestiaryData[apiName].count !== count || this.bestiaryData[apiName].apiCount !== (this.bestiaryApiTracking[apiName] || 0) || this.bestiaryData[apiName].guessCount !== 0
                if (needsChange) {
                    this.bestiaryData[apiName] = {
                        guiName: name.join(" "),
                        count,
                        apiCount: this.bestiaryApiTracking[apiName] || 0,
                        guessCount: 0
                    }
                    this.bestiaryChanged = true

                    tempChanged = true

                }
            }
        }

        if (tempChanged) {
            this.bestiaryStatTypes = {}
            Object.keys(this.bestiaryData).forEach(k => {
                if (this.bestiaryData[k]?.guiName) this.bestiaryStatTypes[k] = this.bestiaryData[k].guiName
            })

            this.hudStat.forEach(s => {
                s.type.dropdownObject.setOptions(this.bestiaryStatTypes)
            })

            this.updateHudElements()
        }
        start = Date.now()
    }

    saveData() {
        if (this.bestiaryChanged) {
            FileLib.write("soopyAddonsData", "bestiaryData.json", JSON.stringify(this.bestiaryData))
        }
    }

    onDisable() {
        this.hudStat.forEach(h => h.textElement.delete())
        this.saveData()
    }

}
module.exports = {
    class: new Bestiary()
}
