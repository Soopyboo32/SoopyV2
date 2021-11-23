/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
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

        this.hudElements.push(this.lividHpElement)
        
        this.registerStep(true, 2, this.step)
        this.registerEvent("worldLoad", this.onWorldLoad)
        
        this.registerEvent("renderOverlay", this.renderHud)
        this.registerEvent("renderWorld", this.renderWorld)
        // this.registerEvent("renderEntity", this.renderEntity)
        this.renderEntityEvent = undefined
    }

    renderWorld(ticks){
        if(this.lividFindBox.getValue()){
            if(this.lividData.correctLividEntity){
                renderUtils.drawBoxAtEntity(this.lividData.correctLividEntity, 255, 0, 0, 0.75, -2, ticks)
            }
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
    }

    onWorldLoad(){
        this.lividData.correctLividColor = undefined
        this.lividData.correctLividColorHP = undefined
        this.lividData.sayLividColors = []
        this.lividData.sayLividColors2 = []
        this.lividData.correctLividEntity = undefined
        this.lividHpElement && this.lividHpElement.setText("")
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