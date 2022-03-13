/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";

class DataLoader extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.stats = {}

        this.area = undefined

        this.isInSkyblock = false

        this.registerStep(true, 2, this.step)

        this.registerEvent("worldLoad", this.worldLoad)

        this.api_loaded_event = this.createCustomEvent("apiLoad")

        this.loadedApiDatas = {}

        this.lastApiData = {
            "skyblock": undefined,
            "player": undefined,
            "skyblock_raw": undefined, //the _raw is loaded from hypixel api instead of soopy api
            "player_raw": undefined
        }

        this.loadApi()
    }

    worldLoad(){
        this.area = undefined
    }

    loadApi(){
        try{
            let data = JSON.parse(FileLib.getUrlContent("http://soopymc.my.to/api/v2/player_skyblock/" + Player.getUUID().replace(/-/g, "")))

            if(!data.success) return

            this.api_loaded_event.trigger(data, "skyblock", true, true)
            this.lastApiData.skyblock = data
        }catch(e){}
    }

    loadApiData(type, soopyServer){
        while(this.FeatureManager.features["globalSettings"] === undefined || this.FeatureManager.features["globalSettings"].class.apiKeySetting === undefined){
            Thread.sleep(100)
        }
        let key = this.FeatureManager.features["globalSettings"].class.apiKeySetting.getValue()
        if(!key) return

        if(this.loadedApiDatas[type] !== undefined){
            if(Date.now()-this.loadedApiDatas[type] < 5000) return
        }

        this.loadedApiDatas[type] = Date.now()

        if(soopyServer){

        }else{
            if(type === "skyblock"){
                try{
                    let data = JSON.parse(FileLib.getUrlContent("https://api.hypixel.net/skyblock/profiles?key=" + key + "&uuid=" + Player.getUUID().replace(/-/g, "")))
            
                    if(!data.success) return
            
                    this.api_loaded_event.trigger(data, "skyblock", false, true)
                    this.lastApiData.skyblock_raw = data
                }catch(e){}
            }
        }
    }

    step(){ //2fps
        this.stats["Area"] = undefined
        this.stats["Dungeon"] = undefined

        if(World.isLoaded() && TabList.getNames()){
            TabList.getNames().forEach(n=>{
                n = ChatLib.removeFormatting(n)
                if(n.includes(": ")){
                    this.stats[n.split(": ")[0].trim()] = n.split(": ")[1].trim()
                }
            })
        }

        if(this.stats["Dungeon"]){
            this.stats["Area"] = this.stats["Dungeon"]
            this.isInDungeon = true
        }else{
            this.isInDungeon = false
        }

        this.dungeonFloor = undefined
        this.slayerXpToSpawn = undefined
        Scoreboard.getLines().forEach(line=>{
            let name = ChatLib.removeFormatting(line.getName()).replace(/[^A-z0-9 \:\(\)\.]/g, "")
            if(this.isInDungeon){
                if(name.includes("The Catacombs (")){
                    this.dungeonFloor = name.split("(")[1].split(")")[0].toUpperCase()
                }
            }
            if(ChatLib.removeFormatting(line).startsWith(" ⏣ ")){
                this.areaFine = ChatLib.removeFormatting(line).split(" ⏣ ")[1].replace(/[^A-z0-9 \:\(\)\.\-]/g, "")
            }
            if(name.startsWith("Purse: ")){
                this.purse = parseInt(name.split("Purse: ")[1].split(" ")[0])
            }
            if(name.startsWith("Bits: ")){
                this.bits = parseInt(name.split("Bits: ")[1].split(" ")[0])
            }

            if(name.endsWith("Combat XP")){
                this.slayerXpToSpawn = ChatLib.removeFormatting(name).split("(")[1].split(")")[0].split("/").map(parseInt)
            }
        })

        this.isInSkyblock = Scoreboard.getTitle()?.removeFormatting().includes("SKYBLOCK")
        this.area = this.stats["Area"]
    }

    initVariables(){
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

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new DataLoader()
}