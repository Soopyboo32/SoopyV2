import Feature from "../../featureClass/class";
import SettingBase from "../settings/settingThings/settingBase";
import { numberWithCommas, timeNumber } from "../../utils/numberUtils";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";
import { delay } from "../../utils/delayUtils";
import TextSetting from "../settings/settingThings/textSetting";
import { drawBoxAtBlock, drawFilledBox } from "../../utils/renderUtils";
import RenderLib2D from "../../utils/renderLib2d";

class PowderAndScatha extends Feature {
    constructor() {
        super();
    }

    onEnable() {
        this.initVariables();
        new SettingBase("Chest Miner", "Powder mining feature here are made mainly for powder chest grinding", undefined, "chest_mining_info", this);
        this.compactedChat = new ToggleSetting("Compact Powder Messages", "same as the one in skytils but support following setting", false, "compact_powder_chat", this)
        this.fixChatForDoublePowder = new ToggleSetting("Fix Chat Messages During Double Powder", "so it's the correct amount of powder you received during the event", false, "fix_chat_dpowder", this)
        this.fixChatForDoublePowderSuffix = new TextSetting("Suffix of previous message", "(so you can tell )change it yourself!", "&a(&b2X Powder&a)", "chat_dpowder_suffix", this, "(none)", false).requires(this.fixChatForDoublePowder);
        this.PowderElement = new ToggleSetting("Powder Mining Info Hud (MAIN TOGGLE)", "This will show your current powder mining section (only in CH)", true, "powder_mining_hud", this).contributor("EmeraldMerchant");
        this.PowderOverlayElement = new HudTextElement()
            .setText("")
            .setToggleSetting(this.PowderElement)
            .setLocationSetting(new LocationSetting("Powder Mining Info Hud Location", "Allows you to edit the location of Powder Mining Info Hud", "powder_mining_hud_location", this, [10, 50, 1, 1]).requires(this.PowderElement).editTempText(`&b2x Powder: &cINACTIVE\n&aChests: &b32\n&bMithril: &d12,768\n&bGems: &d21,325`).contributor("EmeraldMerchant"));
        this.hudElements.push(this.PowderOverlayElement);
        this.PowderOverlayElement.disableRendering()

        new SettingBase("/resetpowderdata", "to reset powder mining data", undefined, "reset_powder_data_command_info", this).requires(this.PowderElement);
        this.resetPowderWhenLeaveCH = new ToggleSetting("Reset Powder When Left CH", "Should it reset powder hud whenever you left ch", false, "reset_powder_when_left_ch", this).requires(this.PowderElement);
        this.resetPowderWhenLeaveGame = new ToggleSetting("Reset Powder When Left Game", "Should it reset powder hud whenever you left game", false, "reset_powder_when_left_game", this).requires(this.PowderElement);
        this.chestUncoverAlert = new ToggleSetting("Alert When You Dug a Chest Out", "so you don't miss it", false, "chest_uncover_alert", this).requires(this.PowderElement);
        this.chestUnlockHelper = new ToggleSetting("Chest unlock helper", "so you don't miss it", true, "chest_unlock_help", this).requires(this.PowderElement);
        this.chestUncoverAlertSound = new ToggleSetting("Alert Sound for Chest Alert", "should the alert also play a sound? (sound: levelup)", false, "chest_uncover_alert_sound", this).requires(this.chestUncoverAlert);
        this.hideGemstoneMessage = new ToggleSetting("Gemstone Messages Hider", "like: &r&aYou received &r&f16 &r&f❈ &r&fRough Amethyst Gemstone&r&a.&r", false, "gemstone_message_hider", this).requires(this.PowderElement)
        this.showFlawlessGemstone = new ToggleSetting("Gemstone Messages Hider Show Flawless", "should the hider ^ ignore flawless gemstones?", false, "gemstone_show_flawless", this).requires(this.hideGemstoneMessage)
        this.hideWishingCompassMessage = new ToggleSetting("Wishing Compass Message Hider", "like: &r&aYou received &r&f1 &r&aWishing Compass&r&a.&r", false, "compass_message_hider", this).requires(this.PowderElement)
        this.hideAscensionRope = new ToggleSetting("Ascension Rope Hider", "like: &r&aYou received &r&f1 &r&9Ascension Rope&r&a.&r", false, "ascension_rope_hider", this).requires(this.PowderElement)

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
        this.sL = Renderer.getStringWidth(" ")

        this.overlayLeft = []
        this.overlayRight = []

        this.leftCH = false;
        this.registerEvent("worldLoad", () => {
            if (this.inCrystalHollows) {
                this.leftCH = true;
                this.inCrystalHollows = false;
                if (this.resetPowderWhenLeaveCH.getValue()) {
                    this.resetMiningData("powder")
                }
                this.chests.clear()
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

        this.lastPowderReceived = { mithril: 0, gemstone: 0 }
        this.lastPowderReceivedExecuted = false;
        this.registerChat("&r&aYou received &r&b+${amount} &r&aMithril Powder&r", (amount, e) => {
            let p = (this.dPowder ? 2 : 1) * parseInt(amount)
            this.miningData.powder.mithril += p
            if (this.compactedChat.getValue()) {
                cancel(e)
                this.lastPowderReceived.mithril += p
                return
            }
            if (this.fixChatForDoublePowder.getValue() && this.dPowder) {
                cancel(e)
                let suffix = "";
                if (this.fixChatForDoublePowderSuffix.getValue() !== "") suffix = this.fixChatForDoublePowderSuffix.getValue()
                ChatLib.chat(`&r&aYou received &r&b+${2 * amount} &r&aMithril Powder&r ${suffix}`)
            }
        })
        this.registerChat("&r&aYou received &r&b+${amount} &r&aGemstone Powder&r", (amount, e) => {
            let p = (this.dPowder ? 2 : 1) * parseInt(amount)
            this.miningData.powder.gemstone += p
            if (this.compactedChat.getValue()) {
                cancel(e)
                this.lastPowderReceived.gemstone += p
                return
            }
            if (this.fixChatForDoublePowder.getValue() && this.dPowder) {
                cancel(e)
                let suffix = "";
                if (this.fixChatForDoublePowderSuffix.getValue() !== "") suffix = this.fixChatForDoublePowderSuffix.getValue()
                ChatLib.chat(`&r&aYou received &r&b+${2 * amount} &r&aGemstone Powder&r ${suffix}`)
            }
        })

        this.registerStep(true, 5, this.compactPowderChat)

        this.chests = new Map()


        this.registerEvent("renderOverlay", this.renderOverlay)
        this.registerEvent("renderWorld", () => {
            if (!this.inCrystalHollows || !this.chestUnlockHelper.getValue()) return

            let del = []
            for (let key of this.chests.keys()) {
                let pos = this.chests.get(key)
                let size = 0.2
                let { x1, y1, x2, y2 } = RenderLib2D.calculateBoundingBox(new net.minecraft.util.AxisAlignedBB(pos[1] - size / 2, pos[2] - size / 2, pos[3] - size / 2, pos[1] + size / 2, pos[2] + size / 2, pos[3] + size / 2))

                let hovered = (x1 < Renderer.screen.getWidth() / 2 && x2 > Renderer.screen.getWidth() / 2 && y1 < Renderer.screen.getHeight() / 2 && y2 > Renderer.screen.getHeight() / 2)

                drawFilledBox(pos[1], pos[2] - size / 2, pos[3], size, size, hovered ? 0 : 255, hovered ? 255 : 0, 0, 1, false)

                if (Date.now() - pos[0] > 5000) {
                    del.push(key)
                }
            }

            del.forEach(k => this.chests.delete(k))
        })
        this.registerEvent("spawnParticle", this.spawnParticle)

        //==============================================Scatha=Feature=Below================================================================

        if (!this.miningData.scatha) this.miningData.scatha = { total_worms: 0, worms: 0, scathas: 0, rare: 0, epic: 0, legandary: 0, since_scatha: 0, since_pet: 0 }
        this.saveMiningData();

        this.scathaMain = new ToggleSetting("SCATHA!", "This is the main toggle of Scatha Feature", false, "scatha_main", this);

        this.scathaCounter = new ToggleSetting("Scatha Counter Hud", "This will show your scatha mining progress (only in CH)", false, "scatha_mining_hud", this).requires(this.scathaMain).contributor("EmeraldMerchant");
        this.scathaCounterElement = new HudTextElement()
            .setText("")
            .setToggleSetting(this.scathaCounter)
            .setLocationSetting(new LocationSetting("Scatha Counter Hud Location", "Allows you to edit the location of Scatha Counter Hud", "scatha_mining_hud_location", this, [10, 50, 1, 1]).requires(this.scathaCounter).editTempText(`&6Scatha Counter\n&bKills: 1,000\n&bWorms: 800\n&bScathas: 200\n&bSince Scatha: 10\n&9Rare Scatha Pets: 5\n&5Epic Scatha Pets: 3\n&6Leg Scatha Pets: 1\n&bSince Pet: 20`));
        this.hudElements.push(this.scathaCounterElement);

        new SettingBase("/scathaset <thing> <value>", "This command will change values in the counter", undefined, "scatha_cmd", this).requires(this.scathaMain);
        new SettingBase("/ss <thing> <value> works too", "you can press TAB for <thing> auto-complete", undefined, "scatha_cmd2", this).requires(this.scathaMain);
        this.scathaCmdComp = ["worms", "scathas", "rare", "epic", "legandary", "since_scatha", "since_pet"]
        this.registerCommand("scathaset", (thing, value) => this.scathaCmd(thing, value), this.scathaCmdComp);
        this.registerCommand("ss", (thing, value) => this.scathaCmd(thing, value), this.scathaCmdComp);

        this.wormSpawnedWarn = new ToggleSetting("Worm/Scatha Spawned Alert", "make a title and a sound when a worm/scatha spawned", false, "worm_spawned_alert", this).requires(this.scathaMain);
        this.registerChat("&r&7&oYou hear the sound of something approaching...&r", this.wormSpawning);
        this.wormSpawnedChatMessage = new ToggleSetting("Worm/Scatha Spawned Chat Message", "if a chat info should be sent when a worm/scatha spawned", false, "worm_spawned_chat_message", this).requires(this.scathaMain);
        this.petDroppedAlert = new ToggleSetting("Pet Dropped Alert", "Big title when a scatha pet dropped", false, "scatha_pet_dropped_alert", this).requires(this.scathaMain);
        this.colorToRarity = { "&9": "rare", "&5": "epic", "&6": "legandary" }
        this.registerChat("&r&6&lPET DROP! &r${rarity}Scatha &r&b(+${mf}% ✯ Magic Find!)&r", (rarity, mf, e) => {
            let r = this.colorToRarity[rarity]
            this.miningData.scatha[r]++
            this.miningData.scatha.since_pet = 0
            this.saveMiningData()
            if (this.petDroppedAlert.getValue()) {
                World.playSound('note.pling', 1, 1);
                Client.showTitle(`${rarity}${r.toUpperCase()} SCATHA PET!`, ChatLib.getChatMessage(e), 0, 100, 10);
            }
        })
 
        this.registerStep(true, 2, this.step2fps);
        this.registerStep(true, 3, this.wormStep);
    }

    spawnParticle(particle, type, event) {
        if (this.inCrystalHollows && this.chestUnlockHelper.getValue() && particle.toString().startsWith("EntityCrit2FX,")) {
            if (World.getBlockAt(particle.getX() + 1, particle.getY(), particle.getZ()).type.getID() === 54
                || World.getBlockAt(particle.getX() - 1, particle.getY(), particle.getZ()).type.getID() === 54
                || World.getBlockAt(particle.getX(), particle.getY(), particle.getZ() + 1).type.getID() === 54
                || World.getBlockAt(particle.getX(), particle.getY(), particle.getZ() - 1).type.getID() === 54) {
                this.chests.set(Math.floor(particle.getX()) + "," + Math.floor(particle.getY()) + "," + Math.floor(particle.getZ()), [Date.now(), particle.getX(), particle.getY(), particle.getZ()])
                cancel(event)
            }
        }
    }

    resetMiningData(type) {
        if (type === "powder") {
            Object.keys(this.miningData.powder).forEach(thing => this.miningData.powder[thing] = 0)
            this.expRateInfo = []
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
                Renderer.drawStringWithShadow(l, 0, 10 * i)
            })

            this.overlayRight.forEach((l, i) => {
                Renderer.drawStringWithShadow(l, width - Renderer.getStringWidth(l), 10 * i)
            })

            Renderer.retainTransforms(false)
        }
    }

    step2fps() {
        if (!this.foundWither) {
            World.getAllEntitiesOfType(net.minecraft.entity.boss.EntityWither)?.forEach(e => {
                if (e.getName().startsWith("§e§lPASSIVE EVENT §b§l2X POWDER §e§lRUNNING FOR §a§l")) {
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
            this.overlayRight.push(this.dPowder ? "&a" + timeNumber(Math.max(0, this.dPowder - Date.now())) : "&cINACTIVE")

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
        if (this.scathaCounter.getValue() && this.inCrystalHollows) {
            let tempText = `&6Scatha Counter\n&bKills: ${this.miningData.scatha.total_worms}\n&bWorms: ${this.miningData.scatha.worms}\n&bScathas: ${this.miningData.scatha.scathas}\n&bSince Scatha: ${this.miningData.scatha.since_scatha}\n`
            if (this.miningData.scatha.rare > 0) tempText += `&9Rare Scatha Pets: ${this.miningData.scatha.rare}\n`
            if (this.miningData.scatha.epic > 0) tempText += `&5Epic Scatha Pets: ${this.miningData.scatha.epic}\n`
            if (this.miningData.scatha.legandary > 0) tempText += `&6Leg Scatha Pets: ${this.miningData.scatha.legandary}`
            if (this.miningData.scatha.rare + this.miningData.scatha.epic + this.miningData.scatha.legandary > 0) tempText += `&bSince Pet: ${this.miningData.scatha.since_pet}`
            this.scathaCounterElement.setText(tempText)
        }
    }

    compactPowderChat() {
        if (this.lastPowderReceived.mithril > 0 && this.lastPowderReceived.gemstone > 0 && !this.lastPowderReceivedExecuted) {
            this.lastPowderReceivedExecuted = true
            delay(300, () => {
                let m = this.lastPowderReceived.mithril
                let g = this.lastPowderReceived.gemstone
                let msg = ""
                if (g > 0) msg += `&r&aYou received &r&b+${g} &r&aGemstone `
                if (m > 0) {
                    if (!msg) msg += `&r&aYou received &r&b+${m} &r&aMithril `
                    else msg += `and &r&b+${m} &r&aMithril `
                }
                msg += `Powder&r`
                if (this.dPowder) {
                    let suffix = "";
                    if (this.fixChatForDoublePowderSuffix.getValue() !== "") suffix = this.fixChatForDoublePowderSuffix.getValue()
                    ChatLib.chat(`${msg} ${suffix}`)
                } else ChatLib.chat(msg)
                this.lastPowderReceived = { mithril: 0, gemstone: 0 }
                this.lastPowderReceivedExecuted = false
            })
        }
    }

    scathaCmd(thing, value) {
        if (!this.scathaCmdComp.includes(thing) || parseInt(value) === NaN) {
            ChatLib.chat(this.FeatureManager.messagePrefix + "Invalid inputs! Usage: /scathaset <thing> <value>")
            return
        }
        let v = parseInt(value);
        this.miningData.scatha[thing] = v;
        this.miningData.scatha.total_worms = this.miningData.scatha.worms + this.miningData.scatha.scathas
        ChatLib.chat(this.FeatureManager.messagePrefix + "Successfully set " + thing + " to " + v + "!")
        this.saveMiningData();
    }

    wormSpawning() {
        if (this.wormSpawnedWarn.getValue()) {
            World.playSound('note.pling', 1, 1);
            Client.showTitle("&cWorm Spawning", "", 0, 20, 10);
            this.wormSpawned = true
        }
    }

    wormStep() {
        if (!this.inCrystalHollows || !this.scathaMain.getValue()) {
            this.scathaCounterElement.setText("")
            return
        }
        if (!this.wormSpawned) return
        World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach(entity => {
            let name = entity.getName()
            //§8[§7Lv5§8] §cWorm§r §e5§c❤
            if (name.startsWith("§8[§7Lv5§8] §cWorm")) {
                if (this.wormSpawnedChatMessage.getValue()) ChatLib.chat("&c&lWorm Spawned. (Since Scatha: " + (this.miningData.scatha.since_scatha + 1) + ")");
                if (this.wormSpawnedWarn.getValue()) Client.showTitle("&c&lWorm Spawned.", "", 0, 20, 10);
                this.miningData.scatha.total_worms++;
                this.miningData.scatha.worms++;
                this.miningData.scatha.since_scatha++;
                this.saveMiningData()
                this.wormSpawned = false;
            }
            if (name.startsWith("§8[§7Lv10§8] §cScatha")) {
                if (this.wormSpawnedChatMessage.getValue()) ChatLib.chat("&c&lScatha Spawned.");
                if (this.wormSpawnedWarn.getValue()) Client.showTitle("&c&lScatha Spawned.", "", 0, 20, 10);
                this.miningData.scatha.total_worms++;
                this.miningData.scatha.scathas++;
                this.miningData.scatha.since_pet++;
                this.miningData.scatha.since_scatha = 0
                this.saveMiningData()
                this.wormSpawned = false;
            }
        });
    }

    initVariables() {
        this.hudElements = [];
        this.inCrystalHollows = false;
        this.foundWither = true;
        this.dPowder = 0;
        this.wormSpawned = false;
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
