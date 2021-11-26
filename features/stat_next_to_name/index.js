/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import soopyV2Server from "../../socketConnection";
import SettingBase from "../settings/settingThings/settingBase";

class StatNextToName extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        new SettingBase("(ONLY WEIGHT ATM) NOTE: A pink star thing (&d⚝§0)", "Means that player is also using SoopyV2", true, "stat_next_to_name_description", this)

        this.userStats = {}

        this.loadingStats = []

        this.statsThing = "weight"
        this.decimalPlaces = 0

        soopyV2Server.onPlayerStatsLoaded = (stats)=>{this.playerStatsLoaded.call(this, stats)}

        this.registerStep(false, 5, this.loadPlayerStatsTick)
    }

    loadPlayerStatsTick(){
        let nearestPlayer = undefined
        let nearestDistance = Infinity

        World.getAllPlayers().forEach(player => {
            if(this.userStats[player.getUUID().toString().replace(/-/g, "")]){
                this.updatePlayerNametag(player)
                return
            }
            if(this.loadingStats.includes(player.getUUID().toString().replace(/-/g, ""))) return

            let dist = Math.pow(player.getX() - Player.getX(), 2) + Math.pow(player.getY() - Player.getY(), 2) + Math.pow(player.getZ() - Player.getZ(), 2)
            if(dist < nearestDistance){
                nearestDistance = dist
                nearestPlayer = player.getUUID().toString().replace(/-/g, "")
            }
        })

        if(nearestPlayer){
            this.loadPlayerStats(nearestPlayer)
        }
    }

    updatePlayerNametag(player){
        let stats = this.userStats[player.getUUID().toString().replace(/-/g, "")]

        let nameTagString = player.getName()

        nameTagString += " &2["
        if(stats.usingSoopyv2) nameTagString += "&d⚝&2"
        if(stats.exists && stats[this.statsThing]){
            nameTagString +=stats[this.statsThing].toFixed(this.decimalPlaces)
        }else{
            nameTagString += "?"
        }
        nameTagString += "]"
        player.setNametagName(new TextComponent(nameTagString));
    }

    loadPlayerStats(uuid){
        // console.log("loading stats for " + uuid)
        soopyV2Server.requestPlayerStats(uuid)
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