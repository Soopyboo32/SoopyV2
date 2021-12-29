/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import soopyV2Server from "../../socketConnection";
import SettingBase from "../settings/settingThings/settingBase";
import * as numberUtils from "../../utils/numberUtils";
import DropdownSetting from "../settings/settingThings/dropdownSetting";

class StatNextToName extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        new SettingBase("NOTE: A pink star thing (&d⚝§0)", "Means that player is also using SoopyV2", true, "stat_next_to_name_description", this)
        this.statToShow = new DropdownSetting("Stat to show", "", "weight", "stat_selected_nexttoname", this, {
            "weight": "Weight",
            "catacombsLevel": "Catacombs Level",
            "skillAvg": "Skill Average",
            "totalSlayer": "Total Slayer Exp",
            "networth": "Networth"
        })

        this.decimals = {
            "weight": 0,
            "catacombsLevel": 2,
            "skillAvg": 2,
            "totalSlayer": 0,
            "networth": "small"
        }

        this.userStats = {}

        this.loadingStats = []

        soopyV2Server.onPlayerStatsLoaded = (stats)=>{this.playerStatsLoaded.call(this, stats)}

        this.registerStep(false, 5, this.loadPlayerStatsTick)
        this.registerEvent("worldLoad", this.worldLoad)
    }

    loadPlayerStatsTick(){
        let nearestPlayer = undefined
        let nearestPlayerName = undefined
        let nearestDistance = Infinity

        World.getAllPlayers().forEach(player => {
            if(this.userStats[player.getUUID().toString().replace(/-/g, "")]){
                this.updatePlayerNametag(player)
                return
            }
            if(this.loadingStats.includes(player.getUUID().toString().replace(/-/g, ""))) return
            if(Player.getUUID().replace(/-/g, "").toString().substr(12, 1) !== "4") return

            let dist = Math.pow(player.getX() - Player.getX(), 2) + Math.pow(player.getY() - Player.getY(), 2) + Math.pow(player.getZ() - Player.getZ(), 2)
            if(dist < nearestDistance){
                nearestDistance = dist
                nearestPlayer = player.getUUID().toString().replace(/-/g, "")
                nearestPlayerName = player.getName()
            }
        })

        if(nearestPlayer){
            this.loadPlayerStats(nearestPlayer, nearestPlayerName)
        }
    }

    worldLoad(){
        let playerStats = this.userStats[Player.getUUID().toString().replace(/-/g, "")]
        this.userStats = {}
        this.loadingStats = []
        if(playerStats){
            this.userStats[Player.getUUID().toString().replace(/-/g, "")] = playerStats
        }
    }

    updatePlayerNametag(player){
        let stats = this.userStats[player.getUUID().toString().replace(/-/g, "")]

        let nameTagString = player.getName()

        nameTagString += " &2["
        if(stats.usingSoopyv2) nameTagString += "&d⚝&2"
        if(stats.exists && stats[this.statToShow.getValue()]){
            if(this.decimals[this.statToShow.getValue()] === "small"){
                nameTagString += numberUtils.addNotation("oneLetters",Math.round(stats[this.statToShow.getValue()]))
            }else{
                nameTagString += numberUtils.numberWithCommas(stats[this.statToShow.getValue()].toFixed(this.decimals[this.statToShow.getValue()]))
            }
        }else{
            nameTagString += "?"
        }
        nameTagString += "]"
        player.setNametagName(new TextComponent(nameTagString));
    }

    loadPlayerStats(uuid, username){
        // console.log("loading stats for " + uuid)
        soopyV2Server.requestPlayerStats(uuid, username)
        this.loadingStats.push(uuid)
    }

    playerStatsLoaded(stats){
        // console.log(JSON.stringify(stats, undefined, 2))
        this.userStats[stats.uuid] = stats
    
    }

    onDisable(){
        this.userStats = undefined
    }
}

module.exports = {
    class: new StatNextToName()
}