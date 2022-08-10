/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import ButtonSetting from "../settings/settingThings/button";
import TextSetting from "../settings/settingThings/textSetting";
import ToggleSetting from "../settings/settingThings/toggle";
import firstLoadPages from "./firstLoadPages";
import GuiPage from "../soopyGui/GuiPage"
import Notification from "../../../guimanager/Notification";
import logger from "../../logger";
import { numberWithCommas } from "../../utils/numberUtils";
import { firstLetterCapital } from "../../utils/stringUtils";
import { fetch } from "../../utils/networkUtils";
import socketConnection from "../../socketConnection";
import renderLibs from "../../../guimanager/renderLibs";
import { f } from "../../../mappings/mappings";
import { addLore, getSBUUID } from "../../utils/utils";
const Files = Java.type("java.nio.file.Files")
const Paths = Java.type("java.nio.file.Paths")
const JavaString = Java.type("java.lang.String")
const JavaLong = Java.type("java.lang.Long")

let hecatombLevels = [2, 5, 10, 20, 30, 40, 60, 80, 100]
let championLevels = [50000, 100000, 250000, 500000, 1000000, 1500000, 2000000, 2500000, 3000000]

class GlobalSettings extends Feature {
    constructor() {
        super()

        this.initVariables()
    }

    initVariables() {
        this.apiKeySetting = undefined
        this.GuiPage = undefined
    }

    onEnable() {
        this.apiKeySetting = new TextSetting("Api Key", "Your hypixel api key", "", "api_key", this, "Run /api new to load", true)
        this.verifyApiKey = new ButtonSetting("Verify api key", "Click this to make sure the api key is working", "verify_key", this, "Click!", this.verifyKey2, undefined)
        this.newApiKey = new ButtonSetting("Run /api new", "This is here so u dont need to exit and re-enter", "api_new_command", this, "Click!", this.apiNewCommand, undefined)
        this.findApiKey = new ButtonSetting("Attempt to load api key from other mods", "This will scan other mods configs to attempt to find your key", "find_key", this, "Click!", () => { this.findKey() }, undefined)

        this.alertAllUpdates = new ToggleSetting("Send chat update avalible for all updates", "If disabled itll notify for new updates less", false, "alert_all_updates", this)

        this.fixNeuNetworth = new ToggleSetting("Change networth in NEU pv to soopynw", "This should make it a lot more accurate", true, "neu_nw_override", this)
        this.darkTheme = new ToggleSetting("Dark theme", "This might be scuffed because guis are still made in light theme", false, "dark_theme", this)
        // this.linkPreview = new ToggleSetting("Link preview", "Shows a preview of where a link will take you", true, "link_preview", this)

        // this.reportErrorsSetting = new ToggleSetting("Send module errors to soopy server", "This will allow me to more effectivly fix them", false, "privacy_send_errors", this)

        this.hideFallingBlocks = new ToggleSetting("Hide falling blocks", "NOTE: This setting is a bit laggy", false, "hide_falling_sand", this)
        this.twitchCommands = new ToggleSetting("Ingame twitch bot commands", "Allows u to use twitch bot commands ingame (eg -sa)", true, "twitch_commands_ingame", this)
        this.itemWorth = new ToggleSetting("(Approximate) Item worth in lore", "Accounts for stuff like enchants/recombs ect", false, "item_worth", this)
        this.showHecatomb = new ToggleSetting("Show hecatomb enchant info in lore", "", true, "show_hecatomb", this)
        this.showChampion = new ToggleSetting("Show champion enchant info in lore", "", true, "show_champion", this)
        this.oldMasterStars = new ToggleSetting("Use Old Master Stars", "replaces the ugly new master star on item name with the old fashion one", false, "old_master_star", this)

        this.registerEvent('itemTooltip', (lore, i, e) => {
            if (!this.oldMasterStars.getValue()) return
            if (!i) return
            let itemName = i.getName()
            let itemNameReformat = itemName.removeFormatting()
            if (itemNameReformat.endsWith("➊")) {
                i.setName(itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➊", "&c✪&6✪✪✪✪"))
                return
            }
            if (itemNameReformat.endsWith("➋")) {
                i.setName(itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➋", "&c✪✪&6✪✪✪"))
                return
            }
            if (itemNameReformat.endsWith("➌")) {
                i.setName(itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➌", "&c✪✪✪&6✪✪"))
                return
            }
            if (itemNameReformat.endsWith("➍")) {
                i.setName(itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➍", "&c✪✪✪✪&6✪"))
                return
            }
            if (itemNameReformat.endsWith("➎")) {
                i.setName(itemName.replace("§6✪§6✪§6✪§6✪§6✪§c➎", "&c✪✪✪✪✪"))
                return
            }
        })

        this.firstPageSettings = [this.darkTheme]

        this.firstLoadPageData = JSON.parse(FileLib.read("soopyAddonsData", "soopyv2firstloaddata.json") || "{}") || {}

        this.GuiPage = new FirstLoadingPage(this)

        // soopyV2Server.reportErrorsSetting = this.reportErrorsSetting

        this.registerChat("&aYour new API key is &r&b${key}&r", this.newKey)
        const EntityFallingBlock = Java.type("net.minecraft.entity.item.EntityFallingBlock");

        this.registerEvent('renderEntity', (entity, posVec, partialTicks, event) => {
            if (entity.getEntity() instanceof EntityFallingBlock) {
                cancel(event);
            }
        }).registeredWhen(() => this.hideFallingBlocks.getValue())

        this.ranFirstLoadThing = false

        if (!this.firstLoadPageData.shown) {
            new Thread(() => {
                while (!World.isLoaded() || !this.FeatureManager.finishedLoading) {
                    Thread.sleep(100)
                }
                Thread.sleep(500)
                this.showFirstLoadPage.call(this)
            }).start()
        }

        if (net.minecraftforge.fml.common.Loader.isModLoaded("notenoughupdates")) {
            this.GuiProfileViewer = Java.type("io.github.moulberry.notenoughupdates.profileviewer.GuiProfileViewer")
            this.currentPlayerOpen = undefined
            this.currentPlayerNetworth = {}
            this.registerEvent("tick", this.fixNEU)
        }

        this.requestingPrices = new Set()
        this.registerStep(false, 1, this.updateItemLores)
        this.registerEvent("worldLoad", () => {
            this.requestingPrices.clear()
        })

        try { //This enables links from soopy.dev to be shown in patcher image preview
            let hasHost = false

            for (let host of Java.type("gg.essential.util.TrustedHostsUtil").INSTANCE.getTrustedHosts()) {
                if (host.getName() === "soopy.dev") {
                    hasHost = true
                }
            }

            if (!hasHost) {
                let TrustedHost = Java.type("gg.essential.api.utils.TrustedHostsUtil").TrustedHost
                let TreeSet = Java.type("java.util.TreeSet")
                let hosts = new TreeSet()
                hosts.add("soopy.dev")

                let host = new TrustedHost(124123, "soopy.dev", hosts)

                Java.type("gg.essential.util.TrustedHostsUtil").INSTANCE.addTrustedHost(host)
            }
        } catch (e) { }

        this.registerCommand("soopyweight", (user = Player.getName()) => {
            this.soopyWeight(user)
        })
        this.registerCommand("sweight", (user = Player.getName()) => {
            this.soopyWeight(user)
        })
        this.registerCommand("lobbyday", () => {
            ChatLib.chat(this.FeatureManager.messagePrefix + "Current lobby is day " + (World.getTime() / 20 / 60 / 20).toFixed(2))
        })

        this.lastCookies = 0

        this.registerEvent("postGuiRender", () => {
            if (Player.getContainer() && Player.getContainer().getName() === "Cookie Clicker v0.01" && Player.getContainer().getStackInSlot(13)) this.renderCookie()
            // if (this.linkPreview.getValue() && Client.currentGui && Client.currentGui.get() && Client.currentGui.get().toString().startsWith("net.minecraft.client.gui.GuiConfirmOpenLink")) this.renderWebpage()
        })
        this.registerStep(false, 1, () => {
            if (Player.getContainer() && Player.getContainer().getName() === "Cookie Clicker v0.01" && Player.getContainer().getStackInSlot(13)) this.tickCookie()

            global.guiManagerSoopyGuisSetDarkThemeEnabled(this.darkTheme.getValue())
        })

        this.registerEvent("guiMouseClick", this.guiClicked)

        this.partyChatEnabled = true

        this.registerChat("&r&9Party &8> ${*}", (e) => {
            if (!this.partyChatEnabled) {
                cancel(e)
            }
        })

        this.registerEvent("messageSent", (message, event) => {
            if (!this.twitchCommands.getValue()) return

            if (message.startsWith("-") && message[1].toLowerCase().match(/[a-z]/)) {
                cancel(event)
                ChatLib.addToSentMessageHistory(message)
                fetch("http://soopy.dev/api/soopyv2/botcommand?m=" + encodeURIComponent(message.replace("-", "")) + "&u=" + Player.getName()).text(text => {
                    ChatLib.chat(this.FeatureManager.messagePrefix + "&7" + message)
                    let sendMessage = text
                    sendMessage = sendMessage.split(" ").map(a => {
                        if (a.match(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm)) {
                            return new TextComponent("&f&n" + a + ' ').setHover("show_text", "Click to open " + a).setClick("open_url", a)
                        } else {
                            return new TextComponent("&f" + a + ' ')
                        }
                    })
                    sendMessage.reduce((c, curr) => c.addTextComponent(curr), new Message().addTextComponent(new TextComponent(this.FeatureManager.messagePrefix))).chat()
                })
            }
        })
    }

    updateItemLores() {
        if (!this.itemWorth.getValue() && !this.showChampion.getValue() && !this.showHecatomb.getValue()) return;

        let items = [...Player.getInventory().getItems(), ...Player.getContainer().getItems()]

        items.forEach(i => {
            let uuid = getSBUUID(i)
            if (!uuid) return

            if (this.itemWorth.getValue()) {
                let a = socketConnection.itemPricesCache.get(uuid)

                if (!a && socketConnection.itemPricesCache2.get(uuid)) {
                    a = socketConnection.itemPricesCache2.get(uuid)
                    socketConnection.itemPricesCache.set(uuid, a)
                }

                if (a) {
                    addLore(i, "§eWorth: ", "§6$" + numberWithCommas(Math.round(a)))
                } else {
                    if (!this.requestingPrices.has(uuid)) {
                        this.requestingPrices.add(uuid)

                        let json = i.getNBT().toObject()
                        socketConnection.requestItemPrice(json, uuid)
                    }
                }

            }

            if (this.showChampion.getValue() && i?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getDouble("champion_combat_xp")) {
                let xp = i?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getDouble("champion_combat_xp")

                let level = 1
                championLevels.forEach(l => {
                    if (xp >= l) level++
                })
                let xpNext = championLevels[level - 1]

                addLore(i, "§eChampion: ", "§d" + level + " §6" + numberWithCommas(Math.round(xp)) + (xpNext ? " §7/ §6" + numberWithCommas(Math.round(xpNext)) : ""))
            }
            if (this.showHecatomb.getValue() && i?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getInteger("hecatomb_s_runs")) {
                let runs = i?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getInteger("hecatomb_s_runs")

                let level = 1
                hecatombLevels.forEach(l => {
                    if (runs >= l) level++
                })
                let xpNext = hecatombLevels[level - 1]

                addLore(i, "§eHecatomb: ", "§d" + level + " §6" + numberWithCommas(Math.round(runs)) + (xpNext ? " §7/ §6" + numberWithCommas(Math.round(xpNext)) : ""))
            }
        })
    }

    // renderWebpage() {
    //     let url = this.getField(Client.currentGui.get(), f.linkText)

    //     let image = renderLibs.getImage("https://soopy.dev/api/soopyv2/webpage?webpage=" + url)

    //     if (image) {
    //         let scale = Renderer.screen.getHeight() * 0.5 / image.getTextureHeight()
    //         image.draw(Renderer.screen.getWidth() / 2 - image.getTextureWidth() * scale / 2, Renderer.screen.getHeight() / 2, scale * image.getTextureWidth(), scale * image.getTextureHeight())
    //     } else {
    //         Renderer.drawString("Loading website preview...", Renderer.screen.getWidth() / 2 - Renderer.getStringWidth("Loading website preview...") / 2, Renderer.screen.getHeight() * 3 / 4)
    //     }
    // }

    guiClicked(mouseX, mouseY, button, gui, event) {
        if (gui.class.toString() === "class net.minecraft.client.gui.inventory.GuiChest" && Player.getContainer().getName() === "Cookie Clicker v0.01") {

            let hoveredSlot = gui.getSlotUnderMouse()
            if (!hoveredSlot) return

            let hoveredSlotId = hoveredSlot[f.slotNumber]

            // logger.logMessage(hoveredSlotId, 4)

            Player.getContainer().click(hoveredSlotId, false, "MIDDLE")
            cancel(event)
        }
    }

    tickCookie() {
        let cookies = parseInt(ChatLib.removeFormatting(Player.getContainer().getStackInSlot(13).getName().split(" ")[0]))

        let cookiesGained = cookies - this.lastCookies
        this.lastCookies = cookies
        if (cookiesGained > 50) cookiesGained = 0
        if (cookiesGained < 1) cookiesGained = 0
        if (!cookiesGained) cookiesGained = 0

        socketConnection.cookiesGained(cookiesGained)
    }

    renderCookie() {
        let cookies = parseInt(ChatLib.removeFormatting(Player.getContainer().getStackInSlot(13).getName().split(" ")[0]))

        let cookiesGained = cookies - this.lastCookies
        let cookieCount = socketConnection.cookieCount + ((cookiesGained < 50 && cookiesGained > 0) ? cookiesGained : 0)

        renderLibs.drawString("Lifetime Cookies: " + numberWithCommas(cookieCount), 10, 10, 1)

        if (socketConnection.cookieData) {
            // this.cookieData = {
            //     cookieLeaderboard: data.cookieLeaderboard,
            //     clickingNow: data.clickingNow
            // }

            let linesOfText = []

            linesOfText.push("---- CURRENTLY CLICKING ----")
            for (let data of socketConnection.cookieData.clickingNow) {
                linesOfText.push(data[0] + ": " + numberWithCommas(data[1]))

                if (linesOfText.length * 10 > Renderer.screen.getHeight() / 2) break
            }
            linesOfText.push("------- LEADERBOARD -------")
            let i = 0
            for (let data of socketConnection.cookieData.cookieLeaderboard) {
                i++

                linesOfText.push("#" + i + " " + data[0] + ": " + numberWithCommas(data[1]))

                if (linesOfText.length * 10 > Renderer.screen.getHeight() - 50) break
            }

            for (let i = 0; i < linesOfText.length; i++) {
                renderLibs.drawString(linesOfText[i], 10, 20 + 10 * i, 1)
            }
        }
    }

    fixNEU() {
        if (Client.currentGui && Client.currentGui.get() instanceof (this.GuiProfileViewer) && this.fixNeuNetworth.getValue()) {
            let guiProfileViewer = Client.currentGui.get()
            if (!guiProfileViewer.profile || !guiProfileViewer.profile.getHypixelProfile()) return
            let uuid = guiProfileViewer.profile.getHypixelProfile().get("uuid").getAsString().replace(/-/g, "")

            if (this.currentPlayerOpen != uuid) {
                this.currentPlayerOpen = uuid
                this.currentPlayerNetworth = {}

                fetch("http://soopy.dev/api/v2/player_skyblock/" + uuid).json(data => {
                    if (!data.success) return

                    if (this.currentPlayerOpen === data.data.uuid) {
                        Object.keys(data.data.profiles).forEach(profileId => {
                            if (!data.data.profiles[profileId].members[uuid].soopyNetworth.networth) return
                            this.currentPlayerNetworth[data.data.profiles[profileId].stats.cute_name] = JavaLong.valueOf(data.data.profiles[profileId].members[uuid].soopyNetworth.networth)
                        })
                    }
                })
            }

            let map = this.getField(guiProfileViewer.profile, "networth")
            Object.keys(this.currentPlayerNetworth).forEach(key => {
                map.put(new JavaString(key), new JavaLong(this.currentPlayerNetworth[key]))
            })
        }
    }

    getField(e, field) {
        let field2 = e.class.getDeclaredField(field);

        field2.setAccessible(true)

        return field2.get(e)
    }

    soopyWeight(user) {

        ChatLib.chat(this.FeatureManager.messagePrefix + "Finding senither weight for " + user)

        fetch("http://soopy.dev/api/v2/player/" + user).json(userData => {
            if (!userData.success) {
                ChatLib.chat(this.FeatureManager.messagePrefix + "&cError loading data: " + userData.error.description)
                return
            }

            fetch("http://soopy.dev/api/v2/player_skyblock/" + userData.data.uuid).json(sbData => {

                if (!sbData.success) {
                    ChatLib.chat(this.FeatureManager.messagePrefix + "&cError loading data: " + sbData.error.description)
                    return
                }

                ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
                ChatLib.chat(userData.data.stats.nameWithPrefix + "'s senither weight (best profile):")
                ChatLib.chat("&aTotal: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.total)))
                new Message(new TextComponent("&aSkills: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill.total)))
                    .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill).map(skill => {
                        if (skill === "total") {
                            return null
                        }
                        return "&a" + firstLetterCapital(skill) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill[skill].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill[skill].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill[skill].overflow)) + ")"
                    }).filter(a => a).join("\n"))).chat()
                new Message(new TextComponent("&aSlayer: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer.total)))
                    .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer).map(slayer => {
                        if (slayer === "total") {
                            return null
                        }
                        return "&a" + firstLetterCapital(slayer) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer[slayer].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer[slayer].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer[slayer].overflow)) + ")"
                    }).filter(a => a).join("\n"))).chat()
                new Message(new TextComponent("&aDungeon: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons.total)))
                    .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons).map(dungeons => {
                        if (dungeons === "total") {
                            return null
                        }
                        return "&a" + firstLetterCapital(dungeons) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons[dungeons].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons[dungeons].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons[dungeons].overflow)) + ")"
                    }).filter(a => a).join("\n"))).chat()
                if (sbData.data.stats.bestProfileId !== sbData.data.stats.currentProfileId) {
                    ChatLib.chat(userData.data.stats.nameWithPrefix + "'s senither weight (current profile):")
                    ChatLib.chat("&aTotal: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.total)))
                    new Message(new TextComponent("&aSkills: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill.total)))
                        .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill).map(skill => {
                            if (skill === "total") {
                                return null
                            }
                            return "&a" + firstLetterCapital(skill) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill[skill].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill[skill].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill[skill].overflow)) + ")"
                        }).filter(a => a).join("\n"))).chat()
                    new Message(new TextComponent("&aSlayer: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer.total)))
                        .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer).map(slayer => {
                            if (slayer === "total") {
                                return null
                            }
                            return "&a" + firstLetterCapital(slayer) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer[slayer].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer[slayer].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer[slayer].overflow)) + ")"
                        }).filter(a => a).join("\n"))).chat()
                    new Message(new TextComponent("&aDungeon: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons.total)))
                        .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons).map(dungeons => {
                            if (dungeons === "total") {
                                return null
                            }
                            return "&a" + firstLetterCapital(dungeons) + ": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons[dungeons].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons[dungeons].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons[dungeons].overflow)) + ")"
                        }).filter(a => a).join("\n"))).chat()
                }
                ChatLib.chat("&c" + ChatLib.getChatBreak("-"))

            })
        })
    }

    showFirstLoadPage() {
        if (!this.ranFirstLoadThing && World.isLoaded() && !this.firstLoadPageData.shown) {
            ChatLib.chat(this.FeatureManager.messagePrefix + "Opening first load page, if you accidentally close it run /soopyv2 and click the button")
            ChatLib.command("soopyv2 first_load_thing", true)
            this.ranFirstLoadThing = true
            this.firstLoadPageData.shown = true
            this.firstLoadPageData.version = 1
            FileLib.write("soopyAddonsData", "soopyv2firstloaddata.json", JSON.stringify(this.firstLoadPageData))
        }
    }
    verifyKey(key) {
        // console.log(key)
        if (key) {
            try {
                var url = "https://api.hypixel.net/key?key=" + key
                let data = fetch(url).json()

                // console.log(data)

                if (data.success) {
                    return true
                } else {
                    return false
                }
            } catch (e) {
                return false
            }
        } else {
            return false
        }
    }
    findKey() {
        new Notification("Finding key...", [])
        new Thread(() => {

            //       NEU
            try {
                let testKey = JSON.parse(new JavaString(Files.readAllBytes(Paths.get("./config/notenoughupdates/configNew.json")))).apiKey.apiKey
                if (testKey) {
                    if (this.verifyKey(testKey)) {
                        this.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in NotEnoughUpdates!"])
                        return;
                    } else {
                        logger.logMessage("Found invalid key in NotEnoughUpdates", 3)
                    }
                }
            } catch (_) { }

            //       SBE
            try {
                let testKey = JSON.parse(new JavaString(Files.readAllBytes(Paths.get("./config/SkyblockExtras.cfg")))).values.apiKey
                if (testKey) {
                    if (this.verifyKey(testKey)) {
                        this.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in SkyblockExtras!"])
                        return;
                    } else {
                        logger.logMessage("Found invalid key in SkyblockExtras", 3)
                    }
                }
            } catch (_) { }
            //       SKYTILS
            try {
                let testKey2 = new JavaString(Files.readAllBytes(Paths.get("./config/skytils/config.toml")))
                let testKey = undefined
                testKey2.split("\n").forEach(line => {
                    if (line.startsWith("		hypixel_api_key = \"")) {
                        testKey = line.split("\"")[1]
                    }
                })
                if (testKey) {
                    if (this.verifyKey(testKey)) {
                        this.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in Skytils!"])
                        return;
                    } else {
                        logger.logMessage("Found invalid key in Skytils", 3)
                    }
                }
            } catch (_) { }

            //       SOOPYADDONS DATA
            try {
                let testKey = FileLib.read("soopyAddonsData", "apikey.txt")
                if (testKey) {
                    if (this.verifyKey(testKey)) {
                        this.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in old soopyaddons version!"])
                        return;
                    } else {
                        logger.logMessage("Found invalid key in soopyaddonsData", 3)
                    }
                }
            } catch (_) { }

            //       HypixelApiKeyManager
            try {
                let testKey = JSON.parse(FileLib.read("HypixelApiKeyManager", "localdata.json")).key
                if (testKey) {
                    if (this.verifyKey(testKey)) {
                        this.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in HypixelApiKeyManager!"])
                        return;
                    } else {
                        logger.logMessage("Found invalid key in HypixelApiKeyManager", 3)
                    }
                }
            } catch (_) { }


            new Notification("§cUnable to find api key", [])
        }).start()
    }

    apiNewCommand() {
        ChatLib.command("api new")
    }

    verifyKey2(key) {
        if (key) {
            try {
                var url = "https://api.hypixel.net/key?key=" + key
                let data = fetch(url).json()

                if (data.success) {
                    return true
                } else {
                    return false
                }
            } catch (e) {
                return false
            }
        }
        if (this.module.apiKeySetting.getValue() == "") {
            new Notification("§cError!", ["You need to set an api key first!"])
            return
        }


        new Thread(() => {
            try {
                var url = "https://api.hypixel.net/key?key=" + this.module.apiKeySetting.getValue()
                let data = fetch(url).json()

                if (data.success) {
                    new Notification("§aSuccess!", ["Your api key is valid!"])
                    return
                } else {
                    new Notification("§cError!", ["Your api key is invalid!"])
                    return
                }
            } catch (e) {
                new Notification("§cError!", ["Your api key is invalid!"])
                return
            }
        }).start()
    }

    newKey(key, event) {
        ChatLib.chat(this.FeatureManager.messagePrefix + "Copied api key!")
        this.apiKeySetting.setValue(key)
    }

    onDisable() {
        this.initVariables()
    }
}

class FirstLoadingPage extends GuiPage {
    constructor(mainThing) {
        super(-10)

        this.showBackButton = false

        this.name = "First load thing"

        this.mainThing = mainThing

        this.pageThings = []

        firstLoadPages.forEach((page, i) => {
            let newPage = this.newPage()

            newPage.addChild(page)

            page.setLoc(i !== 0, i !== firstLoadPages.length - 1)
            page.guiPage = this

            this.pageThings.push(newPage)
        })

        this.pageNum = 0

        this.finaliseLoading()
    }

    nextPage() {
        this.pageNum++

        this.goToPage(this.pageNum)
    }

    prevPage() {
        this.pageNum--

        this.goToPage(this.pageNum)
    }

    onOpen() {
        this.pageNum = 0

        firstLoadPages.forEach((page, i) => {
            page.load()
        })
    }
}

module.exports = {
    class: new GlobalSettings()
}
