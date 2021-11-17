/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import DragonWings from "./cosmetic/dragon/dragonWings"
import Toggle from "../settings/settingThings/toggle"

class Cosmetics extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()
        this.loadedCosmetics = []
        this.uuidToCosmetic = {}

        this.cosmeticsData = {}
        
        this.hiddenEssentialCosmetics = []

        this.cosmeticsList = {
            "dragon_wings": DragonWings
        }

        this.playerHasACosmeticA = false

        this.firstPersonVisable = new Toggle("Cosmetics visable in first person", "", false, "cosmetics_first_person_visable", this)
        this.lessFirstPersonVisable = new Toggle("Make cosmetics less visable in first person mode", "", true, "cosmetics_first_person_less_visable", this).requires(this.firstPersonVisable)

        this.loadCosmeticsData()

        this.worldLoad()

        this.registerEvent("tick", this.tick)
        this.registerEvent("renderWorld", this.renderWorld)
        this.registerEvent("playerJoined", this.playerJoined)
        this.registerEvent("playerLeft", this.playerLeft)
        this.registerEvent("worldLoad", this.worldLoad)
        this.registerStep(false, 5, this.step)
        this.registerStep(false, 60*10, ()=>{
            new Thread(()=>{this.loadCosmeticsData.call(this)}).start()
        })
    }

    loadCosmeticsData(){
        let data = JSON.parse(FileLib.getUrlContent("http://soopymc.my.to/api/soopyv2/cosmetics.json"))

        this.cosmeticsData = data
        this.playerHasACosmeticA = !!data[Player.getUUID().toString().replace(/-/g,"")]

        this.scanForNewCosmetics()
    }

    setUserCosmeticsInformation(uuid, cosmetics){
        if(!this.enabled) return
        
        this.filterUnloadedCosmetics()

        if(!cosmetics){
            delete this.cosmeticsData[uuid]
            return
        }
        this.cosmeticsData[uuid] = cosmetics
        this.scanForNewCosmetics()
    }

    step(){
        this.scanForNewCosmetics()
    }
    scanForNewCosmetics(){
        World.getAllPlayers().forEach(p=>{
            this.loadCosmeticsForPlayer(p)
        })
    }

    loadCosmeticsForPlayer(player){
        Object.keys(this.cosmeticsList).forEach(cosmeticName=>{
            if(!this.uuidToCosmetic[cosmeticName]) this.uuidToCosmetic[cosmeticName] = {}

            if(this.uuidToCosmetic[cosmeticName][player.getUUID().toString().replace(/-/g,"")]) return

            if(this.shouldPlayerHaveCosmetic(player, cosmeticName)){
                let cosmetic = new (this.cosmeticsList[cosmeticName])(player, this)
                this.loadedCosmetics.push(cosmetic)
                this.uuidToCosmetic[cosmeticName][player.getUUID().toString().replace(/-/g,"")] = cosmetic
            }
        })
    }

    worldLoad(){
        this.loadedCosmetics = []
        this.uuidToCosmetic = {}

        this.scanForNewCosmetics()
    }

    playerJoined(player){
        if(player.getUUID().toString().replace(/-/g,"") === Player.getUUID().toString().replace(/-/g,"")) return
        
        this.loadCosmeticsForPlayer(player)
    }

    playerLeft(playerName){
        this.loadedCosmetics.filter(cosmetic=>{
            if(cosmetic.player.getName() === playerName){
                this.uuidToCosmetic[cosmetic.id][cosmetic.player.getUUID().toString().replace(/-/g,"")] = undefined
                return false
            }
            return true
        })
    }

    shouldPlayerHaveCosmetic(player, cosmetic){
        if(!!this.cosmeticsData[player.getUUID().toString().replace(/-/g,"")]?.[cosmetic]){
            if(!this.getPlayerCosmeticSettings(player, cosmetic).enabled) return false
            return true
        }
        return false
    }
    getPlayerCosmeticSettings(player, cosmetic){
        return this.cosmeticsData[player.getUUID().toString().replace(/-/g,"")]?.[cosmetic]
    }

    filterUnloadedCosmetics(tick=false){
        this.loadedCosmetics = this.loadedCosmetics.filter(cosmetic => {
            if(tick) cosmetic.onTick()
            if(cosmetic.player.getPlayer().field_70128_L){  //filter out players that are no longer loaded
                this.uuidToCosmetic[cosmetic.id][cosmetic.player.getUUID().toString().replace(/-/g,"")] = undefined
                return false
            }
            return true
        })
    }

    tick(){
        this.restoreEssentialCosmetics()

        this.filterUnloadedCosmetics(true)
    }

    restoreEssentialCosmetics(){
        this.hiddenEssentialCosmetics.forEach(cosmetic=>{
            cosmetic.isHidden = false
        })
        this.hiddenEssentialCosmetics = []
    }

    renderWorld(ticks){
        this.loadedCosmetics.forEach(cosmetic => {
            cosmetic.onRender(ticks)
        })
    }

    initVariables(){
        this.loadedCosmetics = undefined
        this.uuidToCosmetic = undefined
        this.playerHasACosmeticA = undefined
        this.cosmeticsData = undefined
        this.hiddenEssentialCosmetics = undefined
        this.hiddenEssentialCosmetics = undefined
        this.cosmeticsList = undefined
    }

    onDisable(){
        this.restoreEssentialCosmetics()

        this.initVariables()
    }
}

module.exports = {
    class: new Cosmetics()
}