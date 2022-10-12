import Feature from "../../featureClass/class";
import { m } from "../../../mappings/mappings";
import { numberWithCommas } from "../../utils/numberUtils";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";
import SettingBase from "../settings/settingThings/settingBase";
import { delay } from "../../utils/delayUtils";
import TextSetting from "../settings/settingThings/textSetting";
import { firstLetterCapital } from "../../utils/stringUtils";

class rngMeter extends Feature {
    constructor() {
        super();
    }

    inSkyblock() {
        return this.FeatureManager.features["dataLoader"] && this.FeatureManager.features["dataLoader"].class.isInSkyblock
    }

    isInDungeon() {
        if (!this.FeatureManager || !this.FeatureManager.features["dataLoader"]) return false;
        return this.FeatureManager.features["dataLoader"].class.isInDungeon;
    }

    inEnd() {
        if (!this.FeatureManager || !this.FeatureManager.features["dataLoader"]) return false;
        return this.FeatureManager.features["dataLoader"].class.area === "The End";
    }

    inCI() {
        if (!this.FeatureManager || !this.FeatureManager.features["dataLoader"]) return false;
        return this.FeatureManager.features["dataLoader"].class.area === "Crimson Isle";
    }

    //this is slayer only, returns a value using % as unit
    baseMeterToChance(baseMeter) {
        let slayer = this.lastSlayerType
        if (!slayer) return undefined
        if (!baseMeter) {
            ChatLib.chat(this.FeatureManager.messagePrefix + " An Error Occurred while proccessing RNG Meter data, please report this to our Discord!")
            ChatLib.chat(`${this.FeatureManager.messagePrefix} Function \"baseMeterToChance\" expected (baseMeter: number) but received (undefined)`)
            return undefined
        }
        return (100 * (slayer === "zombie" ? 1500 : 500) / baseMeter).toFixed(4)
    }

    onEnable() {
        this.initVariables();

        this.rngMeterData = JSON.parse(FileLib.read("soopyAddonsData", "rngMeterData.json") || "{}") || {}
        this.saveMeterData = () => {
            new Thread(() => {
                FileLib.write("soopyAddonsData", "rngMeterData.json", JSON.stringify(this.rngMeterData));
            }).start();
        }
        if (!this.rngMeterData.slayer) {
            this.rngMeterData.slayer = {};
            ["zombie", "spider", "wolf", "enderman", "blaze"].forEach(slayerType => {
                this.rngMeterData.slayer[slayerType] = { chosenItem: "", currentMeter: 0, fullMeter: 0, baseChance: 0 }
            })
        }
        if (!this.rngMeterData.dungeon) {
            this.rngMeterData.dungeon = {};
            ["f", "m"].forEach(tier => {
                for (floor = 1; floor <= 7; floor++) {
                    this.rngMeterData.dungeon[`${tier}${floor}`] = { chosenItem: "", currentMeter: 0, fullMeter: 0, baseChance: 0 }
                }
            })
        }
        this.saveMeterData();

        this.slayerStrToType = {
            revenant: "zombie",
            tarantula: "spider",
            sven: "wolf",
            voidgloom: "enderman",
            inferno: "blaze"
        }

        this.currentMeterType = undefined

        this.meterTitle = new ToggleSetting("RNG Meter Info Display", "shows you the RNG Meter info of the thing you currently are doing", false, "rng_meter_display", this)
        this.meterTitleElement = new HudTextElement()
            .setText("")
            .setToggleSetting(this.meterTitle)
            .setLocationSetting(new LocationSetting("RNG Meter Info Display location", "Allows you to change the location of RNG Meter Info Display", "rng_meter_display_location", this, [10, 100, 1, 1]).requires(this.meterTitle).editTempText(""));

        this.hudElements.push(this.meterTitleElement);

        this.slayerMeterResetAlert = new ToggleSetting("Slayer Meter Reset Alert", "sends you a warn when your slayer meter reset, and you have to re'select it again", false, "meter_reset_alert_slayer", this)
        this.slayerRngAlert = new ToggleSetting("Slayer RNG Drop Title", "Renders a big title on your screen whenever a rng drop dropped", false, "slayer_rng_title_hud", this)
        this.slayerRngExtraInfo = new SettingBase("Slayer RNG Title Details", "this setting only renders title when a Rng that's not from lootshare loot table dropped.", true, "rng_extra_info", this).requires(this.slayerRngAlert)

        this.slayerRng = {
            zombie: new Set(["◆ Snake Rune I", "Beheaded Horror", "Scythe Blade", "Smite VII", "Shard of the Shredded", "Warden Heart"]),
            spider: new Set(["Tarantula Talisman", "Fly Swatter", "Digested Mosquito"]),
            wolf: new Set(["Red Claw Egg", "◆ Couture Rune I", "Grizzly Bait", "Overflux Capacitor"]),
            enderman: new Set(["Pocket Espresso Machine", "Handy Blood Chalice", "Void-Conqueror Enderman Skin", "◆ Enchant Rune I", "Judgement Core", "Exceedingly Rare Ender Artifact Upgrader", "Ender Slayer VII"]),
            blaze: new Set(["◆ Fiery Burst Rune I", "High Class Archfiend Dice", "Wilson's Engineering Plans", "Subzero Inverter"])
        }
        this.tempItem = ""
        this.lastSlayerType = ""

        //"&r&b&lRARE DROP! &r&7(&r&f&r&761x &r&f&r&aToxic Arrow Poison&r&7) &r&b(+323% Magic Find!)&r"
        this.registerChat("&r${a} DROP!${*}&r&7(${drop})${*}", (a, drop, e) => {
            if (a.includes(">") || a.includes(":")) return
            let rng = ""
            let drops = "", dropsWithoutNumber = "";
            let xSplit = drop.includes("x") ? drop.split("x")[0].removeFormatting() : undefined
            // if theres a drop with ${amount}x ${item} prefix, if (String(Number(xSplit)) === xSplit) makes sure it's a number in case e.g. Duplex I
            let dropSplit = drop.split("&r")
            if (xSplit) {
                if (String(Number(xSplit)) === xSplit) {
                    drops = dropSplit[2] + dropSplit[4]
                    dropsWithoutNumber = dropSplit[4]
                } else {
                    dropsWithoutNumber = dropSplit[2]
                }
            } else {
                dropsWithoutNumber = dropSplit[2]
            }
            let dropsRF = dropsWithoutNumber.removeFormatting()
            //ChatLib.chat(`dropsrf : ${dropsRF}`)
            //ChatLib.chat(`chosenitem : ${this.rngMeterData.slayer[this.lastSlayerType].chosenItem}`)
            if (this.slayerRngAlert.getValue() && this.slayerRng[this.lastSlayerType].has(dropsRF) && (a.includes("CRAZY") || a.includes("INSANE"))) {
                World.playSound('note.pling', 10, 4);
                // color code + upper case drop
                Client.showTitle(`${dropsWithoutNumber.substring(0, 2)}${dropsWithoutNumber.removeFormatting().toUpperCase()}!`, "", 0, 70, 20);
            } else if (this.slayerRngAlert.getValue() && dropsRF === this.rngMeterData.slayer[this.lastSlayerType].chosenItem) {
                World.playSound('note.pling', 10, 4);
                // color code + upper case drop
                Client.showTitle(`${dropsWithoutNumber.substring(0, 2)}${dropsWithoutNumber.removeFormatting().toUpperCase()}!`, "", 0, 70, 20);
            }
            if (this.slayerMeterResetAlert.getValue()) {
                if (dropsRF === this.rngMeterData.slayer[this.lastSlayerType].chosenItem) {
                    //this.rngMeterData.slayer[this.lastSlayerType].currentMeter would be set at "   &dRNG Meter &f- &d${xp} Stored XP&r" chat register
                    this.rngMeterData.slayer[this.lastSlayerType].chosenItem = ""
                    this.rngMeterData.slayer[this.lastSlayerType].baseChance = 0
                    this.rngMeterData.slayer[this.lastSlayerType].fullMeter = 0
                    delay(7000, () => {
                        this.tempItem = dropsWithoutNumber
                    })
                }
            }
        })
        this.registerStep(true, 3, this.resetMeterAlertStep);
        this.registerStep(true, 2, this.updateLastSlayerType);

        this.registerChat("   &dRNG Meter &f- &d${xp} Stored XP&r", (xp, e) => {
            xp = Number(xp.replace(",", ""))
            this.rngMeterData.slayer[this.lastSlayerType].currentMeter = xp
            let item = this.rngMeterData.slayer[this.lastSlayerType].chosenItem
            let baseMeter = this.baseMeter.slayer[this.lastSlayerType][item].baseMeter
            let dropRarity = this.baseMeter.slayer[this.lastSlayerType][item].dropRarity
            let baseChance = this.baseMeterToChance(this.baseMeter.slayer[this.lastSlayerType][item].baseMeter)
            let currDevideBase = 100 * (xp / baseMeter)
            let buffedChance = (baseChance * (1 + currDevideBase.toFixed(2) / 50)).toFixed(4)
            let meterText = `${this.baseMeter.slayer[this.lastSlayerType][item].thing}&r&d Meter: ${numberWithCommas(xp)}&5/&d${numberWithCommas(baseMeter)} (${currDevideBase.toFixed(1)}&5%&d)\n&7Odds: ${dropRarity} &7(&8&m${baseChance}%&r &7${buffedChance}%)`
            this.meterTitleElement.setText(meterText)
            this.saveMeterData();
        })

        this.registerChat("&r&aYou set your &r${slayerType} RNG Meter &r&ato drop &r${item}&r&a!&r", (slayerType, item, e) => {
            if (item && this.tempItem) {
                if (item.removeFormatting().toLowerCase() === this.tempItem.removeFormatting().toLowerCase()) this.tempItem = ""
            }
            slayerType = this.slayerStrToType[slayerType.removeFormatting().split(" ")[0].toLowerCase()]
            let I = item.removeFormatting()
            this.rngMeterData.slayer[slayerType].chosenItem = I
            this.rngMeterData.slayer[slayerType].fullMeter = this.baseMeter.slayer[slayerType][I].baseMeter
            this.rngMeterData.slayer[slayerType].baseChance = this.baseMeterToChance(this.baseMeter.slayer[slayerType][I].baseMeter)
            
            let xp = this.rngMeterData.slayer[slayerType].currentMeter
            let Item = this.rngMeterData.slayer[slayerType].chosenItem
            let baseMeter = this.baseMeter.slayer[slayerType][Item].baseMeter
            let dropRarity = this.baseMeter.slayer[slayerType][Item].dropRarity
            let baseChance = this.baseMeterToChance(this.baseMeter.slayer[slayerType][Item].baseMeter)
            let currDevideBase = 100 * (xp / baseMeter)
            let buffedChance = (baseChance * (1 + currDevideBase.toFixed(2) / 50)).toFixed(4)
            let meterText = `${this.baseMeter.slayer[slayerType][Item].thing}&r&d Meter: ${numberWithCommas(xp)}&5/&d${numberWithCommas(baseMeter)} (${currDevideBase.toFixed(1)}&5%&d)\n&7Odds: ${dropRarity} &7(&8&m${baseChance}%&r &7${buffedChance}%)`
            this.meterTitleElement.setText(meterText)
            this.saveMeterData();
        })
    }

    resetMeterAlertStep() {
        if (this.tempItem && this.slayerMeterResetAlert.getValue()) {
            Client.showTitle(`&dRESET ${this.tempItem} &r&dMETER!`, "", 0, 5, 1)
        }
    }

    updateLastSlayerType() {
        Scoreboard.getLines().forEach((line, i) => {
            if (ChatLib.removeFormatting(line.getName()).includes("Slayer Quest")) {
                let slayerInfo = ChatLib.removeFormatting(Scoreboard.getLines()[i - 1].getName().replace(/§/g, "&"));
                this.lastSlayerType = this.slayerStrToType[slayerInfo.split(" ")[0].toLowerCase()];
            }
        });
        if (!this.meterTitleElementSetText && this.lastSlayerType && this.baseMeter) {
            this.meterTitleElementSetText = true
            xp = this.rngMeterData.slayer[this.lastSlayerType].currentMeter
            let item = this.rngMeterData.slayer[this.lastSlayerType].chosenItem
            let baseMeter = this.baseMeter.slayer[this.lastSlayerType][item].baseMeter
            let dropRarity = this.baseMeter.slayer[this.lastSlayerType][item].dropRarity
            let baseChance = this.baseMeterToChance(this.baseMeter.slayer[this.lastSlayerType][item].baseMeter)
            let currDevideBase = 100 * (xp / baseMeter)
            let buffedChance = (baseChance * (1 + currDevideBase.toFixed(2) / 50)).toFixed(4)
            let meterText = `${this.baseMeter.slayer[this.lastSlayerType][item].thing}&r&d Meter: ${numberWithCommas(xp)}&5/&d${numberWithCommas(baseMeter)} (${currDevideBase.toFixed(1)}&5%&d)\n&7Odds: ${dropRarity} &7(&8&m${baseChance}%&r &7${buffedChance}%)`
            this.meterTitleElement.setText(meterText)
        }
    }

    initBaseMeter() {
        new Thread(() => {
            try {
                this.baseMeter = JSON.parse(FileLib.read("./config/ChatTriggers/modules/SoopyV2/features/rngMeter/meterdata.json"))
            } catch(e) {
                delay(500, () => {
                    this.baseMeter = JSON.parse(FileLib.read("./config/ChatTriggers/modules/SoopyV2/features/rngMeter/meterdata.json"))
                })
            }
        }).start();
    }

    initVariables() {
        this.hudElements = [];
        this.meterTitleElementSetText = false
        this.initBaseMeter();
    }

    onDisable() {
        this.hudElements.forEach(h => h.delete())
        this.initVariables();
    }
}

module.exports = {
    class: new rngMeter(),
};