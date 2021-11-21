/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import { numberWithCommas } from "../../utils/numberUtils";
import { drawBoxAtBlock, drawBoxAtEntity, drawFilledBox, drawLine } from "../../utils/renderUtils";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";

class Slayers extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.expOnKill = new ToggleSetting("Show slayer exp on boss kill", "Says your slayer exp in chat when you kill a boss, also says time taken to spawn+kill", true, "slayer_xp", this)
        this.slainAlert = new ToggleSetting("Show boss slain alert", "This helps you to not kill mobs for ages with an inactive quest", true, "boss_slain_alert", this)
        this.spawnAlert = new ToggleSetting("Show boss spawned alert", "This helps you to not miss your boss when you spawn it", true, "boss_spawn_alert", this)


        this.boxAroundEmanBoss = new ToggleSetting("Box around enderman slayer boss", "This helps to know what boss it yours", true, "eman_box", this)
        this.boxToEmanBeacon = new ToggleSetting("Box and line to the enderman beacon", "This will help to find the beacon when the boss throws it", true, "eman_beacon", this)
        this.emanBeaconDinkDonk = new ToggleSetting("DinkDonk when beacon is spawned", "This will help to notice when the beacon is spawned", true, "eman_beacon_dinkdink", this)
        this.emanEyeThings = new ToggleSetting("Put box around the enderman eye things", "This will help to find them", true, "eman_eye_thing", this)
        this.emanHpGuiElement = new ToggleSetting("Render the enderman hp on your screen", "This will help you to know what stage u are in ect", true, "eman_hp", this)
        
        this.emanHpElement = new HudTextElement()
            .setToggleSetting(this.emanHpGuiElement)
            .setLocationSetting(new LocationSetting("Eman Hp Location", "Allows you to edit the location of the enderman hp", "eman_location", this, [10, 50, 1, 1])
                .requires(this.emanHpGuiElement)
                .editTempText("&6Enderman&7> &f&l30 Hits"))
        this.hudElements.push(this.emanHpElement)

        this.slayerExp = {}
        this.slayerExpLoaded = false
        
        this.lastSlayerType = ""
        this.lastSlayerExp = 0
        this.lastBossSlain = 0
        this.registerChat("&r  &r&a&lSLAYER QUEST COMPLETE!&r",(e)=>{
            this.slayerExp[this.lastSlayerType] = this.lastSlayerExp + (this.slayerExp[this.lastSlayerType] || 0)
            if(this.expOnKill.getValue()){
                cancel(e)
                ChatLib.chat("&r  &r&a&lSLAYER QUEST COMPLETE!&r")
                ChatLib.chat("&r   &r&aYou have &d" + numberWithCommas(this.slayerExp[this.lastSlayerType]) + " " + this.lastSlayerType + " XP&r&7!&r")
                ChatLib.chat("&r   &r&aYou have &d" + numberWithCommas(Object.values(this.slayerExp).reduce((a, t)=>t+a, 0)) + " total XP&r&7!&r")
                if(Date.now()-this.lastBossSlain < 60000*5) ChatLib.chat("&r   &r&aBoss took &d" + timeNumber((Date.now()-this.lastBossSlain)) + " &ato spawn and kill&r&7!&r") //TODO: Seperate setting for this
            }
            this.lastBossSlain = Date.now()
        })
        
        this.bossSlainMessage = false
        this.bossSpawnedMessage = false
        this.lastBossNotSpawnedTime = 0

        this.registerEvent("renderOverlay", this.renderOverlay)

        
        this.registerSoopy("apiLoad", this.apiLoad)
        if(this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock){
            this.apiLoad(this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock, "skyblock", true, true)
        }

        this.todoE = []
        this.beaconPoints = {}
        this.beaconE = []
        this.deadE = []
        this.beaconLocations = {}
        this.eyeE = []
        this.todoE2 = []
        this.emanBoss = undefined
        this.nextIsBoss = 0
        this.counter = 0

        this.entityAttackEventLoaded = false
        this.entityAttackEventE = undefined
        
        this.registerForge(net.minecraftforge.event.entity.EntityJoinWorldEvent, this.entityJoinWorldEvent)
        this.registerEvent("tick", this.tick)
        this.registerEvent("renderWorld", this.renderWorld)
        this.registerEvent("worldLoad", this.worldLoad)
        this.registerEvent("renderOverlay", this.renderHud)
    }

    renderHud(){
        for(let element of this.hudElements){
            element.render()
        }
    }

    worldLoad(){
        this.todoE = []
        this.beaconPoints = {}
        this.beaconE = []
        this.deadE = []
        this.todoE2 = []
        this.beaconLocations = {}
        this.eyeE = []
        this.emanBoss = undefined
    }

    entityAttackEvent(event){
        if(event.source.func_76346_g() === Player.getPlayer()){
            if(event.entity instanceof net.minecraft.entity.monster.EntityEnderman){
                World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach(e=>{
                    if(e.getName().includes("Voidgloom Seraph")){
                        //if distance from e to event.entity < 5
                        if((e.getX() - event.entity.field_70165_t)**2 + (e.getY() - event.entity.field_70163_u)**2 + (e.getZ() - event.entity.field_70161_v)**2 < 25){
                            this.emanBoss = e
                        }
                    }
                })
            }
        }
    }

    renderWorld(ticks){

        if(this.FeatureManager.features["dataLoader"].class.isInSkyblock){
            if(!this.entityAttackEventLoaded){
                this.entityAttackEventLoaded = true
                this.entityAttackEventE = this.registerForge(net.minecraftforge.event.entity.living.LivingAttackEvent, this.entityAttackEvent) //TODO: Use CT event when ct 2.0 because they made the ct event actually work
            }
        }else{
            if(this.entityAttackEventLoaded){
                this.entityAttackEventLoaded = false
                this.unregisterForge(this.entityAttackEventE)
            }
        }

        Object.values(this.beaconPoints).forEach(line=>{
            let lastPoint = undefined
            line.forEach(p=>{
                if(lastPoint){
                    drawLine(lastPoint[0], lastPoint[1], lastPoint[2], p[0], p[1], p[2], 0, 0, 255, 3)
                }
                lastPoint = p
            })
        })

        this.eyeE.forEach(e=>{ 
            let x = e.getX() + ((e.getX()-e.getLastX())*ticks)
            let y = e.getY() + ((e.getY()-e.getLastY())*ticks)
            let z = e.getZ() + ((e.getZ()-e.getLastZ())*ticks)

            drawBoxAtBlock(x-0.5, y+0.7, z-0.5, 255, 0, 0)
        })

        if(this.emanBoss) drawBoxAtEntity(this.emanBoss, 0, 255, 0, 1, -3, ticks, 4, false)

        Object.values(this.beaconLocations).forEach(loc=>{
            drawFilledBox(loc[0]+0.5, loc[1], loc[2]+0.5, 1.01, 1.01, 0, 0, 1, 1, true)
        })
    }

    entityJoinWorldEvent(event){
        this.todoE2.push(event.entity)
    }

    tick(){
        this.bossSlainMessage = false
        let dis1 = false
        Scoreboard.getLines().forEach((line, i) => {
            if(ChatLib.removeFormatting(line.getName()).includes("Slayer Quest")){
                let slayerInfo = ChatLib.removeFormatting(Scoreboard.getLines()[i-1].getName().replace(/§/g,"&"))
                let levelString = slayerInfo.split(" ").pop().trim()
                let slayerLevelToExp = {
                    "I": 5,
                    "II": 25,
                    "III": 100,
                    "IV": 500,
                    "V": 1500
                }
                this.lastSlayerExp = slayerLevelToExp[levelString]
                let slayerStrToType = {
                    "revenant": "zombie",
                    "tarantula": "spider",
                    "sven": "wolf",
                    "voidgloom":"enderman"
                }
                this.lastSlayerType = slayerStrToType[slayerInfo.split(" ")[0].toLowerCase()]
                //slayerExp[lastSlayerType] += lastSlayerExp
            }
            if (line.getName().includes('Boss slain!')) {
                this.bossSlainMessage = true
            }

            if (line.getName().includes('Slay the boss!')) {

                if(!this.bossSpawnedMessage && !this.emanBoss){
                    this.nextIsBoss = Date.now()
                }

                dis1 = true
                this.bossSpawnedMessage = true
            }
        })
        if (!dis1) {
            this.lastBossNotSpawnedTime = Date.now()
            this.bossSpawnedMessage = false
        }


        this.todoE.forEach(e=>{
            try{
                if(e instanceof net.minecraft.entity.item.EntityArmorStand && e.func_71124_b(4)){
                    if(e.func_71124_b(4).func_82833_r() === "Beacon"){
                        
                        let closestEIsGaming = false
                        let closestDist = Infinity
                        World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach(e2=>{
                            if(e2.getName().includes("Voidgloom Seraph")){
                                if((e2.getX() - e.field_70165_t)**2 + (e2.getY() - e.field_70163_u)**2 + (e2.getZ() - e.field_70161_v)**2 < closestDist){
                                    closestDist = (e2.getX() - e.field_70165_t)**2 + (e2.getY() - e.field_70163_u)**2 + (e2.getZ() - e.field_70161_v)**2
                                    closestEIsGaming = this.emanBoss?e2.getUUID().toString()===this.emanBoss.getUUID().toString():false
                                }
                            }
                        })
                        if(closestEIsGaming){
                            this.beaconE.push(e)
                        }
                    }
                    if(e.func_71124_b(4).func_82833_r().startsWith("§a")){

                        let closestEIsGaming = false
                        let closestDist = Infinity
                        World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach(e2=>{
                            if(e2.getName().includes("Voidgloom Seraph")){
                                if((e2.getX() - e.field_70165_t)**2 + (e2.getY() - e.field_70163_u)**2 + (e2.getZ() - e.field_70161_v)**2 < closestDist){
                                    closestDist = (e2.getX() - e.field_70165_t)**2 + (e2.getY() - e.field_70163_u)**2 + (e2.getZ() - e.field_70161_v)**2
                                    closestEIsGaming = this.emanBoss?e2.getUUID().toString()===this.emanBoss.getUUID().toString():false
                                }
                            }
                        })
                        
                        if(closestEIsGaming && new Item(e.func_71124_b(4)).getNBT().getCompoundTag("tag").getCompoundTag("SkullOwner").getCompoundTag("Properties").getRawNBT().func_150295_c("textures", 10).func_150305_b(0).func_74779_i("Value") === "eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZWIwNzU5NGUyZGYyNzM5MjFhNzdjMTAxZDBiZmRmYTExMTVhYmVkNWI5YjIwMjllYjQ5NmNlYmE5YmRiYjRiMyJ9fX0="){
                            this.eyeE.push(new Entity(e))
                        }
                        // console.log(":" + new Item(e.func_71124_b(4)).getNBT().getCompoundTag("tag").getCompoundTag("SkullOwner").getCompoundTag("Properties").getRawNBT().func_150295_c("textures", 10).func_150305_b(0).func_74779_i("Value"))
                    }
                }

                if(e.func_95999_t() && e.func_95999_t().includes("Voidgloom Seraph")){
                    if(Date.now()-this.nextIsBoss < 3000){
                        this.emanBoss = new Entity(e)
                        this.nextIsBoss = false
                    }
                }
            }catch(_){console.log(JSON.stringify(_, undefined, 2))}
        })
        this.todoE = this.todoE2
        this.todoE2 = []

        if(this.emanBoss && this.emanBoss.getEntity().field_70128_L) this.emanBoss = undefined
        this.eyeE = this.eyeE.filter(e=>!e.getEntity().field_70128_L)
        this.beaconE = this.beaconE.filter((e)=>{
            if(e.field_70128_L){
                this.deadE.push([Date.now(), e.func_110124_au().toString()])

                let pos = [e.field_70165_t+0.5, e.field_70163_u+0.7, e.field_70161_v+0.5]
                //check for a beacon block within 5 blocks of pos
                for(let x = pos[0] - 5; x <= pos[0] + 5; x++){
                    for(let y = pos[1] - 5; y <= pos[1] + 5; y++){
                        for(let z = pos[2] - 5; z <= pos[2] + 5; z++){
                            if(World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z)).getID() === 138){
                                this.beaconLocations[e.func_110124_au().toString()] = [Math.floor(x), Math.floor(y), Math.floor(z)]
                            }
                        }
                    }
                }

                // if(!this.beaconLocations[e.func_110124_au().toString()]){
                //     console.log("Diddnt find beacon wtf?????")
                // }

                return false
            }
            return true
        })

        this.beaconE.forEach((e)=>{
            if(!this.beaconPoints[e.func_110124_au().toString()])this.beaconPoints[e.func_110124_au().toString()] = []

            this.beaconPoints[e.func_110124_au().toString()].push([e.field_70165_t+0.5, e.field_70163_u+0.7, e.field_70161_v+0.5])//x, y, z
        })

        this.deadE = this.deadE.filter(e=>{
            if(Date.now()-e[0] > 5000){
                delete this.beaconPoints[e[1]]
                delete this.beaconLocations[e[1]]
                return false
            }

            let location = this.beaconLocations[e[1]]
            if(!location){
                delete this.beaconPoints[e[1]]
                delete this.beaconLocations[e[1]]
                return false
            }

            if(World.getBlockAt(location[0], location[1], location[2]).getID() === 138){
                Client.showTitle("&cGO TO BEACON!","&c" + (Math.max(0,5000-(Date.now()-e[0]))/1000).toFixed(1) + "s",0,20,10)
                World.playSound("note.pling",1,1)
            }else{
                delete this.beaconPoints[e[1]]
                delete this.beaconLocations[e[1]]
                return false
            }
            return true
        })

        if(this.emanBoss){
            this.emanHpElement.setText("&6Enderman&7> " + this.emanBoss.getName().split("Voidgloom Seraph")[1].trim())
        }else{
            this.emanHpElement.setText("")
        }
    }

    apiLoad(data, dataType, isSoopyServer, isLatest){
        if(!isSoopyServer || !isLatest) return
        if(dataType !== "skyblock") return

        this.slayerExp.zombie = data.data.profiles[data.data.stats.currentProfileId].members[Player.getUUID().replace(/-/g, "")].slayer.zombie.xp
        this.slayerExp.spider = data.data.profiles[data.data.stats.currentProfileId].members[Player.getUUID().replace(/-/g, "")].slayer.spider.xp
        this.slayerExp.wolf = data.data.profiles[data.data.stats.currentProfileId].members[Player.getUUID().replace(/-/g, "")].slayer.wolf.xp
        this.slayerExp.enderman = data.data.profiles[data.data.stats.currentProfileId].members[Player.getUUID().replace(/-/g, "")].slayer.enderman.xp
    }

    renderOverlay(){
        if(this.slainAlert.getValue() && this.bossSlainMessage){
            let scale = Renderer.getStringWidth(ChatLib.removeFormatting("BOSS SLAIN"))/(Renderer.screen.getWidth()*0.75)

            Renderer.scale(1/scale, 1/scale)
            Renderer.drawString("&4BOSS SLAIN", (Renderer.screen.getWidth()*0.125)*scale, (Renderer.screen.getHeight()/2-9/scale)*scale)
            Renderer.scale(1, 1)
        }
        if(this.spawnAlert.getValue() && this.bossSpawnedMessage && Date.now()-this.lastBossNotSpawnedTime<3000){
            let scale = Renderer.getStringWidth(ChatLib.removeFormatting("BOSS SPAWNED"))/(Renderer.screen.getWidth()*0.75)

            Renderer.scale(1/scale, 1/scale)
            Renderer.drawString("&4BOSS SPAWNED", (Renderer.screen.getWidth()*0.125)*scale, (Renderer.screen.getHeight()/2-9/scale)*scale)
            Renderer.scale(1, 1)
        }
    }

    initVariables(){
        this.expOnKill = undefined
        this.slainAlert = undefined
        this.spawnAlert = undefined
        this.slayerExp = undefined
        this.slayerExpLoaded = undefined
        this.lastSlayerType = undefined
        this.lastSlayerExp = undefined
        this.bossSpawnedMessage = undefined
        this.lastBossNotSpawnedTime = undefined
        this.bossSlainMessage = undefined
        this.todoE = undefined
        this.beaconPoints = undefined
        this.beaconE = undefined
        this.deadE = undefined
        this.beaconLocations = undefined
        this.emanBoss = undefined
        this.eyeE = undefined
        this.nextIsBoss = undefined
        this.hudElements = []
        this.entityAttackEventLoaded = undefined
        this.todoE2 = undefined
        this.entityAttackEventE = undefined
    }

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new Slayers()
}

function timeNumber(time){
    let mins = Math.floor(time/1000/60)
    let secs = Math.floor(time/1000)%60

    if(mins === 0) return secs + "s"
    return `${mins}m ${secs}s`
}