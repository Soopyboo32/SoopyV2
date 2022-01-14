/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { f, m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import { numberWithCommas } from "../../utils/numberUtils";
import * as renderUtils from "../../utils/renderUtils";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";

class DungeonSolvers extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.lividData = {}
        this.lividData.lividColor = {
            "Vendetta": "&f",
            "Crossed": "&d",
            "Hockey": "&c",
            "Doctor": "&7",
            "Frog": "&2",
            "Smile": "&a",
            "Scream": "&1",
            "Purple": "&5",
            "Arcade": "&e"
        }
        this.onWorldLoad()

        this.lividFindEnabled = new ToggleSetting("Correct livid finder", "Finds the real livid to kill in the f5 boss fight", true, "livid_find_enabled", this)
        this.lividFindHud = new ToggleSetting("Show Livid Hp", "Shows the nametag of the correct livid", true, "livid_hud_enabled", this).requires(this.lividFindEnabled)
        this.lividHpElement = new HudTextElement()
            .setToggleSetting(this.lividFindHud)
            .setLocationSetting(new LocationSetting("Correct Livid Hp Location", "Allows you to edit the location of the correct livid hp text", "livid_hp_location", this, [10, 50, 1, 1])
                .requires(this.lividFindHud)
                .editTempText("§r§e﴾ §c§lLivid§r §a7M§c❤ §e﴿§r"))

        this.lividFindChat = new ToggleSetting("Say correct livid in chat", "Sends the correct livid in chat", false, "livid_chat_enabled", this).requires(this.lividFindEnabled)
        this.lividFindBox = new ToggleSetting("Put a box around the correct livid", "This helps to locate it in the group", true, "livid_box_enabled", this).requires(this.lividFindEnabled)
        this.lividFindNametags = new ToggleSetting("Hide the nametags of incorrect livids", "This helps to locate it in the group", true, "livid_nametags_enabled", this).requires(this.lividFindEnabled)
        
        this.spiritBowDestroyTimer = new ToggleSetting("Timer for when the spirit bow will self destruct", "", true, "spirit_bow_destroy_timer", this)
        this.spiritBowDestroyElement = new HudTextElement()
        .setToggleSetting(this.spiritBowDestroyTimer)
        .setLocationSetting(new LocationSetting("Spirit bow destroy timer location", "Allows you to edit the location of the timer", "spirit_destroy_location", this, [10, 70, 3, 1])
            .requires(this.spiritBowDestroyTimer)
            .editTempText("&dBow Destroyed in: &c15s"))

        this.hudElements.push(this.spiritBowDestroyElement)

        this.bloodCampAssist = new ToggleSetting("Assist blood camp", "Helps guess where and when blood mobs will spawn", true, "blood_camp_assist", this)

        this.runSpeedRates = new ToggleSetting("Show run speed and exp rates", "(Run speed includes downtime inbetween runs, only shows while doing dungeon runs)", true, "run_speed_rates", this)
        this.runSpeedRatesElement = new HudTextElement().setText("&eRun Speed: &floading...\n&eExp/hour: &floading...")
        .setToggleSetting(this.runSpeedRates)
        .setLocationSetting(new LocationSetting("Run speed and exp rates location", "Allows you to edit the location of the information", "run_speed_rates_location", this, [10, 100, 1, 1])
            .requires(this.runSpeedRates)
            .editTempText("&6Run speed&7> &f4:30\n&6Exp/hour&7> &f1,234,567\n&6Runs/hour&7> &f17"))

        this.lastDungFinishes = []
        this.lastDungExps = []
        this.registerChat("&r&r&r                      &r&8+&r&3${exp} Catacombs Experience&r", (exp)=>{
            this.lastDungExps.push(parseFloat(exp.replace(/,/gi, "")))
            if(this.lastDungExps.length > 5){
                this.lastDungExps.shift()
            }

            this.lastDungFinishes.push(Date.now())
            if(this.lastDungFinishes.length > 5){
                this.lastDungFinishes.shift()
            }
        })
    
        this.spiritBowPickUps = []
        this.registerChat("&r&aYou picked up the &r&5Spirit Bow&r&a! Use it to attack &r&cThorn&r&a!&r", ()=>{
            this.spiritBowPickUps.push(Date.now())
        })

        this.todoE = []
        this.eMovingThing = {}
        this.bloodX = -1
        this.bloodY = -1
        this.startSpawningTime = 0
        this.spawnIdThing = 0

        this.checkingPing = false
        this.lastPingCheck = 0
        this.lastPings = [undefined, undefined, undefined]
        this.ping = 0
        this.pingI = 0
        
        this.registerStep(true, 2, this.step)
        this.registerEvent("worldLoad", this.onWorldLoad)
        
        this.registerEvent("renderOverlay", this.renderHud)
        this.registerEvent("renderWorld", this.renderWorld)

        this.registerChat("&b&bYou are currently connected to server &6${*}&r", (e)=>{
            if(this.checkingPing){
                this.lastPings[this.pingI%3] = Date.now()-this.lastPingCheck
                cancel(e)
                this.checkingPing = false

                if(this.lastPings.includes(undefined)){
                    this.ping = this.lastPings[this.pingI%3]
                }else{
                    this.ping = ([...this.lastPings]).sort((a, b)=>a-b)[1]
                }
                this.pingI++
            }
        })

        this.registerForge(net.minecraftforge.event.entity.EntityJoinWorldEvent, this.entityJoinWorldEvent)
        // this.registerEvent("renderEntity", this.renderEntity)
        this.renderEntityEvent = undefined
    }

    entityJoinWorldEvent(event){
        if(this.bloodCampAssist.getValue())this.todoE.push(event.entity)
    }

    renderWorld(ticks){
        if(this.lividFindBox.getValue()){
            if(this.lividData.correctLividEntity){
                renderUtils.drawBoxAtEntity(this.lividData.correctLividEntity, 255, 0, 0, 0.75, -2, ticks)
            }
        }

        if(this.bloodCampAssist.getValue()){
        this.skulls.forEach(skull => {
            let skullE = skull.getEntity()
            // renderUtils.drawBoxAtEntity(skull, 255, 0, 0, 0.5, 0.5, ticks)

            let xSpeed = skullE[f.posX.Entity]-skullE[f.lastTickPosX]
            let ySpeed = skullE[f.posY.Entity]-skullE[f.lastTickPosY]
            let zSpeed = skullE[f.posZ.Entity]-skullE[f.lastTickPosZ]
            
            if(this.eMovingThing[skull.getUUID().toString()] && this.eMovingThing[skull.getUUID().toString()].timeTook){

                let startPoint = [skullE[f.posX.Entity], skullE[f.posY.Entity], skullE[f.posZ.Entity]]
                
                let xSpeed2 = (startPoint[0]-this.eMovingThing[skull.getUUID().toString()].startX)/this.eMovingThing[skull.getUUID().toString()].timeTook
                let ySpeed2 = (startPoint[1]-this.eMovingThing[skull.getUUID().toString()].startY)/this.eMovingThing[skull.getUUID().toString()].timeTook
                let zSpeed2 = (startPoint[2]-this.eMovingThing[skull.getUUID().toString()].startZ)/this.eMovingThing[skull.getUUID().toString()].timeTook

                let time = (this.spawnIdThing>=4?2900:4850)-this.eMovingThing[skull.getUUID().toString()].timeTook
                let endPoint = [startPoint[0]+xSpeed2*time, startPoint[1]+ySpeed2*time, startPoint[2]+zSpeed2*time]
                let pingPoint = [startPoint[0]+xSpeed2*(this.ping), startPoint[1]+(ySpeed2*this.ping), startPoint[2]+(zSpeed2*this.ping)]
                renderUtils.drawLineWithDepth(startPoint[0], startPoint[1]+2, startPoint[2], endPoint[0], endPoint[1]+2, endPoint[2], 255, 0, 0, 2)
                renderUtils.drawBoxAtBlockNotVisThruWalls(pingPoint[0]-0.5, pingPoint[1]+1, pingPoint[2]-0.5, 0, 255, 0)
                renderUtils.drawBoxAtBlockNotVisThruWalls(endPoint[0]-0.5, endPoint[1]+1, endPoint[2]-0.5, 255, 0, 0)

                // if(this.eMovingThing[skull.getUUID().toString()] && this.eMovingThing[skull.getUUID().toString()].timeTook){
                //     Tessellator.drawString((time/1000).toFixed(3)+"s", endPoint[0], endPoint[1]+2, endPoint[2])
                // }
            }


            //TODO: move this out of render world

            if(this.eMovingThing[skull.getUUID().toString()] && Date.now()-this.eMovingThing[skull.getUUID().toString()].startMovingTime > 5000){
                this.eMovingThing[skull.getUUID().toString()].logged = true
                this.spawnIdThing++

                delete this.eMovingThing[skull.getUUID().toString()] 
                this.skulls = this.skulls.filter(e=>{
                    if(e.getUUID().toString() === skull.getUUID().toString()){
                        return false
                    }
                    return true
                })
                return
            }

            if(xSpeed !== 0 || ySpeed !== 0){
                if(!this.eMovingThing[skull.getUUID().toString()])this.eMovingThing[skull.getUUID().toString()] = {startMovingTime: Date.now(),startX: skullE[f.posX.Entity],startY: skullE[f.posY.Entity],startZ: skullE[f.posZ.Entity]}


                if(this.eMovingThing[skull.getUUID().toString()].lastX !== skullE[f.posX.Entity]
                || this.eMovingThing[skull.getUUID().toString()].lastY !== skullE[f.posY.Entity]){
                    this.eMovingThing[skull.getUUID().toString()].timeTook = Date.now()-this.eMovingThing[skull.getUUID().toString()].startMovingTime
                }else if(!this.eMovingThing[skull.getUUID().toString()].logged && (
                    skullE[f.isDead]
                    || !skullE[m.getEquipmentInSlot](4)
                    || !skullE[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().endsWith("Head")
                )){
                    this.eMovingThing[skull.getUUID().toString()].logged = true
                    this.spawnIdThing++

                    delete this.eMovingThing[skull.getUUID().toString()] 
                    this.skulls = this.skulls.filter(e=>{
                        if(e.getUUID().toString() === skull.getUUID().toString()){
                            return false
                        }
                        return true
                    })
                    return
                }

                this.eMovingThing[skull.getUUID().toString()].lastX= skullE[f.posX.Entity]
                this.eMovingThing[skull.getUUID().toString()].lastY= skullE[f.posY.Entity]

                if(!this.startSpawningTime) this.startSpawningTime = Date.now()
            }
        })
    }
    }

    renderEntity(entity, position, ticks, event){
        if(this.lividFindNametags.getValue()){
            if(this.lividData.correctLividEntity){
                if(entity.getName().includes("Livid") && entity.getName().includes("❤") && entity.getUUID() !== this.lividData.correctLividEntity.getUUID()){
                    cancel(event)
                }
            }
        }
    }
    
    renderHud(){
        for(let element of this.hudElements){
            element.render()
        }

        this.runSpeedRatesElement.render()
    }

    onWorldLoad(){
        this.lividData.correctLividColor = undefined
        this.lividData.correctLividColorHP = undefined
        this.lividData.sayLividColors = []
        this.lividData.sayLividColors2 = []
        this.lividData.correctLividEntity = undefined
        this.lividHpElement && this.lividHpElement.setText("")

        this.startSpawningTime = 0
        this.spawnIdThing = 0
        this.eMovingThing = {}
        this.bloodX = -1
        this.bloodY = -1
        this.skulls = []
        World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach(e=>{
            if(e.getEntity()[m.getEquipmentInSlot](4) && e.getEntity()[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().endsWith("Head")){
                this.addSkull(e)
            }
        })
    }

    addSkull(skull){
        if(this.bloodX !== -1){
            let xA = skull.getX()-(skull.getX()%32)
            let yA = skull.getZ()-(skull.getZ()%32)

            if(xA !== this.bloodX || yA !== this.bloodY) return
        }else{
            if(skull.getEntity()[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().trim() === Player.getName() + "'s Head"
            || skull.getEntity()[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().trim() === Player.getName() + "' Head"){
                this.bloodX = skull.getX()-(skull.getX()%32)
                this.bloodY = skull.getZ()-(skull.getZ()%32)
                this.skulls = []
                World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach(e=>{
                    if(e.getEntity()[m.getEquipmentInSlot](4) && e.getEntity()[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().endsWith("Head")){
                        this.addSkull(e)
                    }
                })
            }
            return
        }
        this.skulls.push(skull)

    }

    step(){ //2fps
        if(this.lividFindEnabled.getValue() && (this.FeatureManager.features["dataLoader"].class.dungeonFloor === "F5")){ //TODO: fix on M5 (detect correct livid based on roof color)
            World.getAllEntities().forEach(entity => {
                let entityName = entity.getName()
				if (/(?:Vendetta|Crossed|Hockey|Doctor|Frog|Smile|Scream|Purple|Arcade) Livid/g.test(entityName)) {
					let lividName = entityName.replace(" Livid", "")

					if (!this.lividData.sayLividColors2.includes(lividName)) {
						this.lividData.sayLividColors2.push(lividName)
						if (this.lividData.sayLividColors2.length === 1) {
							this.lividData.correctLividColor = lividName
						}
						if (this.lividData.sayLividColors2.length === 9) {
                            if(this.lividFindChat.getValue()){
                                ChatLib.chat(this.FeatureManager.messagePrefix + "Correct livid is: " + this.lividData.lividColor[lividName] + lividName)
                            }
							this.lividData.correctLividColor = lividName
						}
					}
					return;
				}
                if (entityName.includes("Livid") && entityName.includes("❤")) {
                    if (!this.lividData.sayLividColors.includes(entityName.substr(0, 3))) {
                        this.lividData.sayLividColors.push(entityName.substr(0, 3))
                        if (this.lividData.sayLividColors.length === 9) {
                            this.lividData.correctLividColorHP = entityName.substr(0, 3)
                        }
                        if (this.lividData.sayLividColors.length === 1) {
                            this.lividData.correctLividColorHP = entityName.substr(0, 3)
                        }
                    }

                    if (this.lividData.sayLividColors.length === 1) {
                        if (entityName.includes("Livid") && entityName.includes("❤")) {
                            this.lividHpElement.setText(entityName)
                        }
                    } else {
                        if (this.lividData.correctLividColorHP !== undefined) {
                            // if (this.lividData.correctLividColor === "Arcade") {
                            //     this.lividHpElement.setText("Unknown Health (Yellow Livid)")
                            // } else {
                                if (entityName.includes(this.lividData.correctLividColorHP)) {
                                    this.lividHpElement.setText(entityName)
                                    this.lividData.correctLividEntity = entity
                                }
                            // }
                        }
                    }

                }
            })
        }

        if(this.lividData.correctLividEntity){
            if(!this.renderEntityEvent){
                this.renderEntityEvent = this.registerEvent("renderEntity", this.renderEntity)
            }
        }else{
            if(this.renderEntityEvent){
                this.unregisterEvent(this.renderEntityEvent)
            }
        }

        this.spiritBowPickUps = this.spiritBowPickUps.filter(pickUp => Date.now() - pickUp < 20000)
        if(this.spiritBowPickUps[0]){
            this.spiritBowDestroyElement.setText("&dBow Destroyed in: &c" + Math.round((this.spiritBowPickUps[0] + 20000 - Date.now()) / 1000) + "s")
        }else{
            this.spiritBowDestroyElement.setText("")
        }
        // this.spiritBowPickUps
        if(this.bloodCampAssist.getValue()){
            this.todoE.forEach(e=>{
                let en = new Entity(e)
                // console.log(en.getName())
                if(en.getName().trim() === "Armor Stand" && e[m.getEquipmentInSlot](4) && e[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().endsWith("Head")){
                    this.addSkull(en)
                }
            })
                
            this.todoE = []

            if(Date.now()-this.lastPingCheck> 60000*30
            || Date.now()-this.lastPingCheck> 60000 && this.lastPings.includes(undefined)){
                this.lastPingCheck = Date.now()
                ChatLib.command("whereami")
                this.checkingPing = true
            }
        }

        let averageExp = this.lastDungExps.reduce((a, b) => a + b, 0) / this.lastDungExps.length
        let averageLength = (this.lastDungFinishes[this.lastDungFinishes.length-1] - this.lastDungFinishes[0])/(this.lastDungFinishes.length-1)
        let runsperHour = 60000*60/averageLength
        let expPerHour = averageExp*runsperHour

        if(Date.now()-this.lastDungFinishes[this.lastDungFinishes.length-1] < 60000*5 || (this.FeatureManager.features["dataLoader"].class.dungeonFloor)){
            if(this.lastDungFinishes.length > 1){
                this.runSpeedRatesElement.setText("&6Run speed&7> &f" + Math.floor(averageLength/60000) + ":" + ((Math.floor(averageLength/1000)%60<10?"0":"") + Math.floor(averageLength/1000)%60) + "\n&6Exp/hour&7> &f" + numberWithCommas(Math.round(expPerHour)) + "\n&6Runs/hour&7> &f" + Math.floor(runsperHour))
            }else{
                this.runSpeedRatesElement.setText("&6Run speed&7> &floading...\n&6Exp/hour&7> &floading...\n&6Runs/hour&7> &floading...")
            }
        }else{
            this.runSpeedRatesElement.setText("")
        }
    }

    initVariables(){
        this.lividFindEnabled = undefined
        this.lividData = undefined
        this.hudElements = []
    }

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new DungeonSolvers()
}