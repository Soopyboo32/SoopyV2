import Feature from "../../featureClass/class";
import SettingBase from "../settings/settingThings/settingBase";
import { numberWithCommas, timeNumber } from "../../utils/numberUtils";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";
import { delay } from "../../utils/delayUtils";

class PowderAndScatha extends Feature {
    constructor() {
        super();
    }

    onEnable() {
        this.initVariables();
        new SettingBase("Chest Miner", "Powder mining feature here are made mainly for powder chest grinding", undefined, "chest_mining_info", this);
        this.PowderElement = new ToggleSetting("Powder Mining Info Hud (MAIN TOGGLE)", "This will show your current powder mining section (only in CH)", false, "powder_mining_hud", this).contributor("EmeraldMerchant");
        this.PowderOverlayElement = new HudTextElement()
            .setText("")
            .setToggleSetting(this.PowderElement)
            .setLocationSetting(new LocationSetting("Powder Mining Info Hud Location", "Allows you to edit the location of Powder Mining Info Hud", "powder_mining_hud_location", this, [10, 50, 1, 1]).requires(this.PowderElement).editTempText(`&b2x Powder: "&cINACTIVE"\n&aChests: &b32\n&bMithril: &d12,768\n&bGems: &d21,325`).contributor("EmeraldMerchant"));
        this.hudElements.push(this.PowderOverlayElement);
        this.PowderOverlayElement.disableRendering()

        new SettingBase("/resetpowderdata", "to reset powder mining data", undefined, "reset_powder_data_command_info", this).requires(this.PowderElement);
        this.resetPowderWhenLeaveCH = new ToggleSetting("Reset Powder When Left CH", "Should it reset powder hud whenever you left ch", false, "reset_powder_when_left_ch", this).requires(this.PowderElement);
        this.resetPowderWhenLeaveGame = new ToggleSetting("Reset Powder When Left Game", "Should it reset powder hud whenever you left game", false, "reset_powder_when_left_game", this).requires(this.PowderElement);
        this.chestUncoverAlert = new ToggleSetting("Alert When You Dug a Chest Out", "so you don't miss it", false, "chest_uncover_alert", this).requires(this.PowderElement);
        this.chestUncoverAlertSound = new ToggleSetting("Alert Sound for Chest Alert", "should the alert also play a sound? (sound: levelup)", false, "chest_uncover_alert_sound", this).requires(this.chestUncoverAlert);
        this.hideGemstoneMessage = new ToggleSetting("Gemstone Messages Hider", "like: &r&aYou received &r&f16 &r&f❈ &r&fRough Amethyst Gemstone&r&a.&r", false, "gemstone_message_hider", this).requires(this.PowderElement)
        this.showFlawlessGemstone = new ToggleSetting("Gemstone Messages Hider Show Flawless", "should the hider ^ ignore flawless gemstones?", false, "gemstone_show_flawless", this).requires(this.hideGemstoneMessage)
        this.hideWishingCompassMessage = new ToggleSetting("Wishing Compass Message Hider", "like: &r&aYou received &r&f1 &r&aWishing Compass&r&a.&r", false, "compass_message_hider", this).requires(this.PowderElement)
        this.hideAscensionRope = new ToggleSetting("Ascension Rope Hider", "like: &r&aYou received &r&f1 &r&9Ascension Rope&r&a.&r", false, "ascension_rope_hider", this).requires(this.PowderElement)

        new SettingBase("SCATHA FEATURE TODO!", "This will come in a later date...", undefined, "scatha_todo", this);

        this.registerChat("&r&aYou received ${thing}&r&a.&r", (thing, e) => {
            if (this.hideGemstoneMessage.getValue() && thing.endsWith("Gemstone") && (this.showFlawlessGemstone.getValue() ? !thing.includes("Flawless") : true)) cancel(e)
            if (this.hideWishingCompassMessage.getValue() && thing.endsWith("Wishing Compass")) cancel(e)
            if (this.hideAscensionRope.getValue() && thing.endsWith("Ascension Rope")) cancel(e)
        })

        this.registerStep(true, 1, () => {
            if (this.FeatureManager.features["dataLoader"].class.area === "Crystal Hollows") {
                if (!this.leftCH && !this.inCrystalHollows) {
                    this.foundWither = false
                    this.inCrystalHollows = true
                }
            } else if (this.inCHfromChest) {
                this.inCrystalHollows = true
                this.dPowder = 0
                this.inCHfromChest = false
            }
        })
        this.dPowder = 0;
        this.registerStep(true, 2, this.step2fps);
        this.sL = Renderer.getStringWidth(" ")

        this.overlayLeft = []
        this.overlayRight = []

        this.leftCH = false;
        this.registerChat("&7Sending to server ${s}&r", (s, e) => {
            if (this.inCrystalHollows) {
                this.leftCH = true;
                this.inCrystalHollows = false;
                if (this.resetPowderWhenLeaveCH.getValue()) {
                    this.resetMiningData("powder")
                }
            } else this.leftCH = false
        })

        this.miningData = {}
        this.saveMiningData = () => {
            new Thread(() => {
                FileLib.write("soopyAddonsData", "miningData.json", JSON.stringify(this.miningData));
            }).start();
        }
        this.miningData = JSON.parse(FileLib.read("soopyAddonsData", "miningData.json") || "{}") || {}
        if (!this.miningData.powder) this.miningData.powder = { chests: 0, mithril: 0, gemstone: 0 }
        this.expRateInfo = []
        this.mythrilRate = 0
        this.gemstoneRate = 0
        //TODO if (!this.miningData.scatha) this.miningData.scatha = {}
        this.saveMiningData();

        this.registerCommand("resetpowderdata", () => {
            this.resetMiningData("powder");
            ChatLib.chat(this.FeatureManager.messagePrefix + "Successfully reset powder data.")
        }, this)

        this.registerChat("&r&aYou uncovered a treasure chest!&r", (e) => {
            if (!this.inCrystalHollows) {
                this.inCrystalHollows = true
                this.inCHfromChest = true
            }
            if (this.chestUncoverAlert.getValue()) Client.showTitle("&aTreasure Chest!", "", 0, 60, 20);
            if (this.chestUncoverAlertSound.getValue()) World.playSound("random.levelup", 1, 1);
        })

        this.registerChat("&r&r&r${space}&r&b&l2X POWDER ${status}!&r", (space, status, e) => {
            if (status.removeFormatting() === "STARTED") {
                this.dPowder = Date.now() + 15 * 1000 * 60
            } else this.dPowder = 0
        })
        this.inCHfromChest = false;
        this.registerChat("&r&6You have successfully picked the lock on this chest!&r", (e) => {
            this.miningData.powder.chests++
            delay(100, () => {
                this.expRateInfo.push([Date.now(), this.miningData.powder.mithril, this.miningData.powder.gemstone])
                if (this.expRateInfo.length > 20) this.expRateInfo.shift()

                let [time, mythril, gemstone] = this.expRateInfo[0]

                this.mythrilRate = (this.miningData.powder.mithril - mythril) / (Date.now() - time)
                this.gemstoneRate = (this.miningData.powder.gemstone - gemstone) / (Date.now() - time)
            })
        })
        this.registerChat("&r&aYou received &r&b+${amount} &r&aMithril Powder&r", (amount, e) => {
            this.miningData.powder.mithril += (this.dPowder ? 2 : 1) * parseInt(amount)
        })
        this.registerChat("&r&aYou received &r&b+${amount} &r&aGemstone Powder&r", (amount, e) => {
            this.miningData.powder.gemstone += (this.dPowder ? 2 : 1) * parseInt(amount)
        })

        this.registerEvent("renderOverlay", this.renderOverlay)
        this.registerEvent("spawnParticle", this.spawnParticle)
    }

    spawnParticle(particle, type, event) {
        if (particle.toString().startsWith("EntityCritFX,")) {

        }
    }

    resetMiningData(type) {
        if (type === "powder") {
            Object.keys(this.miningData.powder).forEach(thing => this.miningData.powder[thing] = 0)
        } else if (type === "scatha") {
            //TODO
        }
    }

    renderOverlay() {
        if (this.PowderOverlayElement.isEnabled()) {
            let width = Renderer.getStringWidth("&b2x Powder: &cINACTIVE")

            let x = this.PowderOverlayElement.locationSetting.x
            let y = this.PowderOverlayElement.locationSetting.y
            let scale = this.PowderOverlayElement.locationSetting.scale

            Renderer.retainTransforms(true)
            Renderer.scale(scale)
            Renderer.translate(x / scale, y / scale)

            this.overlayLeft.forEach((l, i) => {
                Renderer.drawString(l, 0, 10 * i)
            })

            this.overlayRight.forEach((l, i) => {
                Renderer.drawString(l, width - Renderer.getStringWidth(l), 10 * i)
            })

            Renderer.retainTransforms(false)
        }
    }

    step2fps() {
        if (!this.foundWither) {
            World.getAllEntitiesOfType(net.minecraft.entity.boss.EntityWither)?.forEach(e => {
                if (e.getName().includes("§e§lPASSIVE EVENT §b§l2X POWDER §e§lRUNNING FOR §a§l")) {
                    this.dPowder = Date.now();
                    let time = ChatLib.removeFormatting(e.getName()).split("RUNNING FOR ").pop()

                    let [m, s] = time.split(":")
                    this.dPowder += 1000 * parseInt(s)
                    this.dPowder += 60 * 1000 * parseInt(m)
                };
                this.foundWither = true;
            });
        }

        this.overlayLeft = []
        this.overlayRight = []

        if (this.PowderElement.getValue() && this.inCrystalHollows) {
            this.overlayLeft.push(`&b2x Powder:`)
            this.overlayRight.push(this.dPowder ? "&a" + timeNumber(this.dPowder - Date.now()) : "&cINACTIVE")

            if (this.miningData.powder.chests) {
                let c = this.miningData.powder.chests

                this.overlayLeft.push(`&aChests:`)
                this.overlayRight.push(`&b${numberWithCommas(c)}`)
            }
            if (this.miningData.powder.mithril) {
                let m = this.miningData.powder.mithril

                this.overlayLeft.push(`&bMithril:`)
                this.overlayRight.push(`&d${numberWithCommas(m)}`)
            }
            if (this.miningData.powder.gemstone) {
                let g = this.miningData.powder.gemstone

                this.overlayLeft.push(`&bGems:`)
                this.overlayRight.push(`&d${numberWithCommas(g)}`)
            }
            if (this.mythrilRate) {
                this.overlayLeft.push(`&bMithril/h:`)
                this.overlayRight.push(`&d${numberWithCommas(Math.round(this.mythrilRate * 1000 * 60 * 60))}`)
            }
            if (this.gemstoneRate) {
                this.overlayLeft.push(`&bGems/h:`)
                this.overlayRight.push(`&d${numberWithCommas(Math.round(this.gemstoneRate * 1000 * 60 * 60))}`)
            }
        }
    }

    initVariables() {
        this.hudElements = [];
        this.inCrystalHollows = false;
        this.foundWither = true;
        this.dPowder = false;
    }

    onDisable() {
        this.hudElements.forEach(h => h.delete())
        this.saveMiningData();
        if (this.resetPowderWhenLeaveGame.getValue()) {
            this.resetMiningData("powder");
        }
        this.initVariables();
    }
}

module.exports = {
    class: new PowderAndScatha(),
};
