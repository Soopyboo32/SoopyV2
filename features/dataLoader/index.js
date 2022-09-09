/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import socketConnection from "../../socketConnection";
import { fetch } from "../../utils/networkUtils";

class DataLoader extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        this.stats = {}

        this.area = undefined
        this.areaFine = undefined

        this.isInSkyblock = false

        this.dungeonPercentCleared = 0

        this.registerStep(true, 2, this.step)

        this.registerStep(false, 170, this.loadApiStepThing)
        this.registerStep(false, 60 * 5, this.step_5min)

        this.registerEvent("worldLoad", this.worldLoad)

        this.api_loaded_event = this.createCustomEvent("apiLoad")

        this.checkingPing = false;
        this.lastPingCheck = 0;
        this.lastPings = [undefined, undefined, undefined];
        this.ping = 0;
        this.pingI = 0;

        this.registerChat("&b&bYou are currently connected to server &6${*}&r", (e) => {
            if (this.checkingPing) {
                this.lastPings[this.pingI % 3] = Date.now() - this.lastPingCheck;
                cancel(e);
                this.checkingPing = false;

                if (this.lastPings.includes(undefined)) {
                    this.ping = this.lastPings[this.pingI % 3];
                } else {
                    this.ping = [...this.lastPings].sort((a, b) => a - b)[1];
                }
                this.pingI++;
            }
        });

        this.lastServer = undefined
        this.lastSentServer = 0

        this.currentMayorPerks = new Set()

        this.loadedApiDatas = {}

        this.partyMembers = new Set()
        this.partyMembers.add(Player.getName())

        this.lastApiData = {
            "skyblock": undefined,
            "player": undefined,
            "skyblock_raw": undefined, //the _raw is loaded from hypixel api instead of soopy api
            "player_raw": undefined
        }

        this.worldLoaded = true

        this.loadApi()

        this.step_5min()

        this.firstLoaded = false;

        ["You are not currently in a party.", "You have been kicked from the party by ${*}", "You left the party.", "The party was disbanded because all invites expired and the party was empty", "${*} &r&ehas disbanded the party!&r"].forEach(m => this.registerChat(m, () => {
            this.partyMembers.clear()
            this.partyMembers.add(Player.getName())
        }));

        ["${mem} &r&ejoined the party.&r", "${mem} &r&einvited &r${*} &r&eto the party! They have &r&c60 &r&eseconds to accept.&r", "&dDungeon Finder &r&f> &r${mem} &r&ejoined the dungeon group! (&r&b${*}&r&e)&r"].forEach(m => this.registerChat(m, (mem) => {
            this.partyMembers.add(ChatLib.removeFormatting(mem.trim().split(" ").pop().trim()))
        }));
        ["${mem} &r&ehas been removed from the party.&r", "${mem} &r&ehas left the party.&r", "${mem} &r&ewas removed from your party because they disconnected&r", "Kicked ${mem} because they were offline."].forEach(m => this.registerChat(m, (mem) => {
            this.partyMembers.delete(ChatLib.removeFormatting(mem.trim().split(" ").pop().trim()))
        }))
        this.registerChat("&eYou have joined &r${mem}'s &r&eparty!&r", (mem) => {
            this.partyMembers.clear()
            this.partyMembers.add(Player.getName())
            this.partyMembers.add(ChatLib.removeFormatting(p = mem.trim().split(" ").pop().trim()))
        })
        this.registerChat("&eYou have joined &r${mem}' &r&eparty!&r", (mem) => {
            this.partyMembers.clear()
            this.partyMembers.add(Player.getName())
            this.partyMembers.add(ChatLib.removeFormatting(mem).trim())
        })
        this.registerChat("&eYou'll be partying with: ${mem}", (mem) => {
            mem.split(",").forEach(p => {
                this.partyMembers.add(ChatLib.removeFormatting(p.trim().split(" ").pop().trim()))
            })
        })
        this.registerChat("&eParty ${type}: ${mem}", (type, mem) => {
            if (type.toLowerCase().includes("leader")) this.partyMembers.clear()
            ChatLib.removeFormatting(mem).split("●").forEach(p => {
                if (!p.trim()) return
                this.partyMembers.add(p.trim().split(" ").pop().trim())
            })
        })
        this.registerCommand("pmembdebug", () => {
            ChatLib.chat([...this.partyMembers].join(" | "))
        })
    }

    getPing() {
        if (Date.now() - this.lastPingCheck > 60000 * 30 || (Date.now() - this.lastPingCheck > 60000 && this.lastPings.includes(undefined) && this.bloodX !== -1)) {
            this.lastPingCheck = Date.now();
            ChatLib.command("whereami");
            this.checkingPing = true;
        }
        return this.ping || 0
    }

    step_5min() {
        fetch("http://soopy.dev/api/v2/mayor").json(data => {
            if (!data.success) return
            this.mayorData = data.data
            this.currentMayorPerks = new Set(data.data.mayor.perks.map(a => a.name))
        })
    }

    worldLoad() {
        this.area = undefined
        this.areaFine = undefined
        this.dungeonFloor = undefined
        this.loadApiData("skyblock", false)
    }

    loadApiStepThing() {
        this.loadApiData("skyblock", false)
    }
    loadApi() {
        fetch("http://soopy.dev/api/v2/player_skyblock/" + Player.getUUID().replace(/-/g, "")).json(data => {

            if (!data.success) return

            this.api_loaded_event.trigger(data, "skyblock", true, true)
            this.lastApiData.skyblock = data
        })
    }

    loadApiData(type, soopyServer) {
        if (this.FeatureManager.features["globalSettings"] === undefined || this.FeatureManager.features["globalSettings"].class.apiKeySetting === undefined) {
            return
        }
        let key = this.FeatureManager.features["globalSettings"].class.apiKeySetting.getValue()
        if (!key) return

        if (this.loadedApiDatas[type] !== undefined) {
            if (Date.now() - this.loadedApiDatas[type] < 5000) return
        }

        this.loadedApiDatas[type] = Date.now()

        if (soopyServer) {

        } else {
            if (type === "skyblock") {
                fetch("https://api.hypixel.net/skyblock/profiles?key=" + key + "&uuid=" + Player.getUUID().replace(/-/g, "")).json(data => {
                    if (!data.success) return

                    this.api_loaded_event.trigger(data, "skyblock", false, true)
                    this.lastApiData.skyblock_raw = data
                })
            }
        }
    }

    step() { //2fps
        if (!this.firstLoaded) {
            if (!(this.FeatureManager.features["globalSettings"] === undefined || this.FeatureManager.features["globalSettings"].class.apiKeySetting === undefined)) {
                this.loadApiData("skyblock", false)
                this.firstLoaded = true
            }
        }
        this.isInSkyblock = Scoreboard.getTitle()?.removeFormatting().includes("SKYBLOCK")

        if (!this.isInSkyblock) {
            this.stats = {}
            this.isInDungeon = false
            this.dungeonFloor = undefined
            return
        }

        this.stats["Area"] = undefined
        this.stats["Dungeon"] = undefined

        if (World.isLoaded() && TabList.getNames()) {
            TabList.getNames().forEach(n => {
                n = ChatLib.removeFormatting(n)
                if (n.includes(": ")) {
                    if (n.includes('Secrets Found')) {
                        if (n.includes('%')) {
                            this.stats["Secrets Found%"] = n.split(": ")[1]
                        } else {
                            this.stats["Secrets Found"] = n.split(": ")[1]
                        }
                    } else {
                        this.stats[n.split(": ")[0].trim()] = n.split(": ")[1].trim()
                    }
                }
            })
        }

        if (this.stats["Dungeon"]) {
            this.stats["Area"] = this.stats["Dungeon"]
            this.isInDungeon = true
        } else {
            this.isInDungeon = false
        }

        this.slayerXpToSpawn = undefined
        Scoreboard.getLines().forEach(line => {
            let name = ChatLib.removeFormatting(line.getName()).replace(/[^A-z0-9 \:\(\)\.]/g, "")
            if (this.isInDungeon) {
                if (name.includes("The Catacombs (")) {
                    this.dungeonFloor = name.split("(")[1].split(")")[0].toUpperCase()
                }
            }
            if (ChatLib.removeFormatting(line).startsWith(" ⏣ ")) {
                this.areaFine = ChatLib.removeFormatting(line).split(" ⏣ ")[1].replace(/[^A-z0-9 \:\(\)\.\-]/g, "")
            }
            if (name.startsWith("Purse: ")) {
                this.purse = parseInt(name.split("Purse: ")[1].split(" ")[0])
            }
            if (name.startsWith("Bits: ")) {
                this.bits = parseInt(name.split("Bits: ")[1].split(" ")[0])
            }
            if (name.startsWith("Cleared: ")) {
                this.dungeonPercentCleared = parseInt(name.split(" ")[1]) / 100
            }

            if (name.endsWith("Combat XP")) {
                this.slayerXpToSpawn = ChatLib.removeFormatting(name).split("(")[1].split(")")[0].split("/").map(parseInt)
            }
        })

        this.area = this.stats["Area"]


        if (this.lastServer !== this.stats.Server || Date.now() - this.lastSentServer > 60000 * 5) {
            this.lastServer = this.stats.Server;
            this.lastSentServer = Date.now()

            socketConnection.setServer(this.stats.Server, this.area, this.areaFine);
        }
    }

    initVariables() {
        this.stats = undefined
        this.isInDungeon = false

        this.dungeonFloor = undefined
        this.area = undefined
        this.areaFine = undefined
        this.bits = undefined
        this.purse = undefined
        this.lastApiData = undefined
        this.isInSkyblock = undefined
    }

    onDisable() {
        this.initVariables()
    }
}

module.exports = {
    class: new DataLoader()
}