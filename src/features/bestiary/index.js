/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import { numberWithCommas } from "../../utils/numberUtils";
import { drawBoxAtEntity } from "../../utils/renderUtils";
import { getBestiaryTier } from "../../utils/statUtils";
import { firstLetterWordCapital } from "../../utils/stringUtils";
import HudTextElement from "../hud/HudTextElement";
import DropdownSetting from "../settings/settingThings/dropdownSetting";
import LocationSetting from "../settings/settingThings/location";
import SettingBase from "../settings/settingThings/settingBase";
import ToggleSetting from "../settings/settingThings/toggle";

// let dontUseApi = new Set()
// dontUseApi.add("arachne")
// dontUseApi.add("barbarian_duke_x")
// dontUseApi.add("bladesoul")
// dontUseApi.add("mage_outlaw")
// dontUseApi.add("ashfang")
// dontUseApi.add("magma_cube_boss")
// dontUseApi.add("headless_horseman")
// dontUseApi.add("dragon")

const EntityArmorStand = Java.type("net.minecraft.entity.item.EntityArmorStand")
const EntityPlayer = Java.type("net.minecraft.entity.player.EntityPlayer")
const EntityCaveSpider = Java.type("net.minecraft.entity.monster.EntityCaveSpider")
const EntitySkeleton = Java.type("net.minecraft.entity.monster.EntitySkeleton")
const EntitySpider = Java.type("net.minecraft.entity.monster.EntitySpider")
const EntityCreeper = Java.type("net.minecraft.entity.monster.EntityCreeper")

class Bestiary extends Feature {
    constructor() {
        super()
    }

    onEnable() {

        this.bestiaryMobBox = new ToggleSetting("Box around bestiary mobs", "", false, "bestiary_box", this)

        this.bestiaryStatTypes = {
            "barbarian_duke_x": "Barbarian Duke X"
        }
        this.bestiaryData = {}

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
                this.bestiaryData[thing].totalKills++

                let { level, killsLeft, killsForNext } = getBestiaryTier(thing, this.bestiaryData[thing].totalKills)

                this.bestiaryData[thing].tier = level
                this.bestiaryData[thing].killsThisTier = killsLeft
                this.bestiaryData[thing].killsForNext = killsForNext
            }
        })
        this.registerSoopy("apiLoad", this.apiLoad);
        this.registerEvent("renderWorld", this.renderWorld)

        if (this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock_raw) {
            this.apiLoad(this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock_raw, "skyblock", false, true);
        }

        this.boxRendEs = []

        this.registerStep(true, 1, this.updateMobs)
    }

    updateMobs() {
        this.boxRendEs = []
        if (!this.bestiaryMobBox.getValue()) return

        let entities = World.getAllEntitiesOfType(EntityArmorStand)
        for (let entity of entities) {
            let name = entity.getName()
            let mcEntity = entity.entity
            let entityClass = null

            let color = [0, 100, 100]
            if (name.includes("Butterfly")) {
            } else if (name.includes("Matcho")) {
                entityClass = EntityPlayer
                color = [75, 0, 130]
            } else if (name.includes("Brood Mother")) {
                entityClass = EntitySpider
                color = [0, 0, 255]
            } else if (name.includes("Arachne Keeper")) {
                entityClass = EntityCaveSpider
                color = [0, 0, 255]
            } else if (name.includes("Sneaky Creeper")) {
                entityClass = EntityCreeper
                color = [0, 255, 0]
            } else if (name.includes("Wither Skeleton")) {
                entityClass = EntitySkeleton
                color = [255, 255, 255]
            } else {
                // exit if no relevant name is detected
                continue
            }
            // Get a list of entities near the detected armor stand and loop through them 
            let entityList = World.getWorld().func_72839_b(mcEntity, mcEntity.func_174813_aQ().func_72317_d(0, -1, 0))
            entityList.forEach((e) => {
                // never highlight the player
                if (e == Client.getMinecraft().field_71439_g) return

                // if we didn't specify a class to look for, highlight anything
                // otherwise, check if it is the class
                if (entityClass == null || e instanceof entityClass) {
                    this.boxRendEs.push([new Entity(e), color])
                }
            })
        }
    }

    renderWorld(ticks) {
        if (!this.bestiaryMobBox.getValue()) return
        for (let data of this.boxRendEs) {
            if (data[0][f.isDead]) {
                this.boxRendEs.splice(IndexOf(data));
            }
            drawBoxAtEntity(data[0], data[1][0], data[1][1], data[1][2], null, null, ticks)
        }
    }

    getBestiaryCount(id) {
        if (!this.bestiaryData[id]) return "???"

        return `${this.bestiaryData[id].tier}&7:&f ${numberWithCommas(this.bestiaryData[id].killsThisTier)}&7/&f${numberWithCommas(this.bestiaryData[id].killsForNext)}`
    }

    updateHudElements() {
        let insb = this.FeatureManager.features["dataLoader"].class.isInSkyblock

        this.hudStat.forEach(stat => {
            if (stat.enabled.getValue()) {
                if (!insb && stat.onlySb.getValue()) {
                    stat.textElement.setText("")
                    return
                }

                let type = stat.type.getValue()

                stat.textElement.setText(`&6${this.bestiaryStatTypes[type]}&7> &f${this.getBestiaryCount(type)}`)
            } else {
                stat.textElement.setText("")
            }
        })
    }

    apiLoad(data, dataType, isSoopyServer, isLatest) {
        if (isSoopyServer || !isLatest) return;
        if (dataType !== "skyblock") return;

        let currentProfile = {}

        data.profiles.forEach(p => {
            if (p.selected) {
                currentProfile = p.members[Player.getUUID().toString().replace(/-/g, "")]
            }
        })

        Object.entries(currentProfile.bestiary).forEach(([key, val]) => {
            if (key.startsWith("kills_family_")) {
                let family = key.replace("kills_family_", "")

                if (!this.bestiaryData[family]) {
                    this.bestiaryData[family] = {
                        tier: 0,
                        totalKills: 0,
                        killsThisTier: 0,
                        killsForNext: 0
                    }
                }

                this.bestiaryData[family].totalKills = val

                let { level, killsLeft, killsForNext } = getBestiaryTier(family, val)

                this.bestiaryData[family].tier = level
                this.bestiaryData[family].killsThisTier = killsLeft
                this.bestiaryData[family].killsForNext = killsForNext
            }
        })
        let changed = false
        Object.keys(this.bestiaryData).forEach(k => {
            if (!this.bestiaryStatTypes[k]) {
                this.bestiaryStatTypes[k] = firstLetterWordCapital(k.replace(/_/g, " "))
                changed = true
            }
        })
        if (changed) {
            this.hudStat.forEach(s => {
                s.type.dropdownObject.setOptions(this.bestiaryStatTypes)
            })
        }
    }

    onDisable() {
        this.hudStat.forEach(h => h.textElement.delete())
    }
}
module.exports = {
    class: new Bestiary()
}
