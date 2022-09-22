/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import soopyV2Server from "../../socketConnection";
import SettingBase from "../settings/settingThings/settingBase";
import * as numberUtils from "../../utils/numberUtils";
import DropdownSetting from "../settings/settingThings/dropdownSetting";
import ToggleSetting from "../settings/settingThings/toggle";
import NonPooledThread from "../../utils/nonPooledThread";

class StatNextToName extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        new SettingBase("NOTE: A pink star thing (&d⚝§0)", "Means that player is also using SoopyV2", true, "stat_next_to_name_description", this)
        this.statToShow = new DropdownSetting("Stat to show", "", "weight", "stat_selected_nexttoname", this, {
            "weight": "Weight",
            "catacombsLevel": "Catacombs Level",
            "skillAvg": "Skill Average",
            "skillAvgOver60": "Skill Average (Over 60)",
            "totalSlayer": "Total Slayer Exp",
            "networth": "Networth",
            "classAverage": "Class Average",
            "bestiary": "Bestiary"
        })

        this.decimals = {
            "weight": 0,
            "catacombsLevel": 2,
            "skillAvg": 2,
            "skillAvgOver60": 2,
            "totalSlayer": 0,
            "classAverage": 2,
            "bestiary": 1,
            "networth": "small"
        }

        this.userStats = {}

        this.loadingStats = []
        this.lastWorldLoad = undefined
        this.apiKeyThing = new ToggleSetting("Use ur api key for data loading", "Max of 12 requests/min", true, "api_key_stat_load", this)

        soopyV2Server.onPlayerStatsLoaded = (stats) => { this.playerStatsLoaded.call(this, stats) }

        soopyV2Server.apithingo = async (uuid, packetId) => {
            let key = this.FeatureManager.features["globalSettings"].class.apiKeySetting.getValue()
            if (!key) return

            let t = await fetch(`https://api.hypixel.net/skyblock/profiles?key=${key}&uuid=${uuid}`).text()
            soopyV2Server.respondQueue(packetId, t)
        }

        this.registerStep(false, 1, this.loadPlayerStatsTick)
        this.registerEvent("worldLoad", this.worldLoad)

        this.registerEvent("playerJoined", this.playerJoined)

        this.worldLoad()


        // respondQueue(id, data) {
        //     this.sendData({
        //         type: "api",
        //         id,
        //         data
        //     })
        // }

        this.registerStep(false, 5, () => {
            if (keyValid && this.apiKeyThing.getValue()) soopyV2Server.joinApiQ()
        })

        let keyValid = false
        let key = undefined
        new NonPooledThread(() => {
            while (!this.FeatureManager.features["globalSettings"]?.class) {
                Thread.sleep(1000)
            }

            key = this.FeatureManager.features["globalSettings"].class.apiKeySetting.getValue()
            fetch("https://api.hypixel.net/key?key=" + key).json().then(d => {
                if (d.success) {
                    keyValid = true
                }
            })
        }).start()
    }

    loadPlayerStatsTick() {

        if (this.lastWorldLoad && Date.now() - this.lastWorldLoad > 1000) {
            World.getAllPlayers().forEach(player => {
                if (this.userStats[player.getUUID().toString().replace(/-/g, "")]) return
                if (Player.getUUID().replace(/-/g, "").toString().substr(12, 1) !== "4") return
                this.loadPlayerStatsCache(player.getUUID().toString().replace(/-/g, ""), player.getName())
            })
            this.lastWorldLoad = undefined
        }

        let nearestPlayer = undefined
        let nearestPlayerName = undefined
        let nearestDistance = Infinity

        World.getAllPlayers().forEach(player => {
            if (this.userStats[player.getUUID().toString().replace(/-/g, "")]) {
                this.updatePlayerNametag(player)
                return
            }
            if (this.loadingStats.includes(player.getUUID().toString().replace(/-/g, ""))) return
            if (Player.getUUID().replace(/-/g, "").toString().substr(12, 1) !== "4") return

            let dist = Math.pow(player.getX() - Player.getX(), 2) + Math.pow(player.getY() - Player.getY(), 2) + Math.pow(player.getZ() - Player.getZ(), 2)
            if (dist < nearestDistance) {
                nearestDistance = dist
                nearestPlayer = player.getUUID().toString().replace(/-/g, "")
                nearestPlayerName = player.getName()
            }
        })

        if (nearestPlayer) {
            this.loadPlayerStats(nearestPlayer, nearestPlayerName)
        }
    }

    worldLoad() {
        let playerStats = this.userStats[Player.getUUID().toString().replace(/-/g, "")]
        this.userStats = {}
        this.loadingStats = []
        if (playerStats) {
            this.userStats[Player.getUUID().toString().replace(/-/g, "")] = playerStats
        }

        this.lastWorldLoad = Date.now()

        this.loadPlayerStatsCache(Player.getUUID().toString().replace(/-/g, ""), Player.getName())
    }

    playerJoined(player) {
        if (player.getUUID().toString().replace(/-/g, "") === Player.getUUID().toString().replace(/-/g, "")) return
        if (this.userStats[player.getUUID().toString().replace(/-/g, "")]) return
        if (Player.getUUID().replace(/-/g, "").toString().substr(12, 1) !== "4") return

        this.loadPlayerStatsCache(player.getUUID().toString().replace(/-/g, ""), player.getName())
    }

    updatePlayerNametag(player) {
        let stats = this.userStats[player.getUUID().toString().replace(/-/g, "")]

        let nameTagString = player.getName()

        nameTagString += " &2["
        if (stats.usingSoopyv2) nameTagString += "&d⚝&2"
        if (stats.exists && stats[this.statToShow.getValue()] !== undefined && stats[this.statToShow.getValue()] !== null) {
            if (this.decimals[this.statToShow.getValue()] === "small") {
                nameTagString += numberUtils.addNotation("oneLetters", Math.round(stats[this.statToShow.getValue()]))
            } else {
                nameTagString += numberUtils.numberWithCommas(stats[this.statToShow.getValue()].toFixed(this.decimals[this.statToShow.getValue()]))
            }
        } else {
            nameTagString += "?"
        }
        nameTagString += "]"
        player.setNametagName(new TextComponent(nameTagString));
    }

    loadPlayerStats(uuid, username) {
        // console.log("loading stats for " + uuid)
        soopyV2Server.requestPlayerStats(uuid, username)
        this.loadingStats.push(uuid)
    }

    loadPlayerStatsCache(uuid, username) {
        // console.log("loading stats for " + uuid)
        soopyV2Server.requestPlayerStatsCache(uuid, username)
    }

    playerStatsLoaded(stats) {
        stats.bestiary /= 10
        this.userStats[stats.uuid] = stats


        World.getAllPlayers().forEach(player => {
            if (player.getUUID().toString().replace(/-/g, "") === stats.uuid) {
                this.updatePlayerNametag(player)
                return
            }
        })
    }

    onDisable() {
        this.userStats = undefined
    }
}

module.exports = {
    class: new StatNextToName()
}