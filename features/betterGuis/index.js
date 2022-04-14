/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import logger from "../../logger";
import { f } from "../../../mappings/mappings";
import ToggleSetting from "../settings/settingThings/toggle";
import MuseumGui from "./museumGui.js";
// import DungeonReadyGui from "./dungeonReadyGui";

class BetterGuis extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.museumGui = new MuseumGui()
        // this.dungeonReady = new DungeonReadyGui()

        this.replaceSbMenuClicks = new ToggleSetting("Improve Clicks on SBMENU", "This will change clicks to middle clicks, AND use commands where possible (eg /pets)", true, "sbmenu_clicks", this)
        this.reliableSbMenuClicks = {getValue: ()=>false}//removed because hypixel fixed, code kept incase hypixel adds back bug later //new ToggleSetting("Make SBMENU clicks reliable", "This will delay clicks on sbmenu to time them so they dont get canceled", true, "sbmenu_time", this)
        
        this.museumGuiEnabled = new ToggleSetting("Custom Museum GUI", "Custom gui for the Museum", true, "custom_museum_enabled", this)
        // this.dungeonReadyGuiEnabled = new ToggleSetting("Custom Dungeon Ready GUI", "Custom gui for the dungeon ready up menu", true, "custom_dungeon_ready_enabled", this)
    
        this.lastWindowId = 0
        this.shouldHold = 10
        this.clickSlot = -1
        this.clickSlotTime = 0

        this.middleClickGuis = [
            "Your SkyBlock Profile",
            "Your Skills",
            "Farming Skill",
            "Mining Skill",
            "Heart of the Mountain",
            "Combat Skill",
            "Foraging Skill",
            "Fishing Skill",
            "Enchanting Skill",
            "Alchemy Skill",
            "Carpentry Skill",
            "Runecrafting Skill",
            "Social Skill",
            "Taming Skill",
            "Dungeoneering",
            "Your Essence",
            "Healer Class Perks",
            "Mage Class Perks",
            "Beserk Class Perks",
            "Archer Class Perks",
            "Tank Class Perks",
            "Recipe Book",
            "Trades",
            "Quest Log",
            "Quest Log (Completed)",
            "Fairt Souls Guide",
            "Dungeon Journals",
            "Calendar and Events",
            "Booster Cookie",
            "Island Management",
            "Toggle Potion Effects",
            "Bank",
            "Bank Account Upgrades",
            "Co-op Bank Account",
            "Bank Deposit",
            "Bank Withdrawal",
            "Personal Bank Account",
            "Bazaar Orders",
            "Co-op Bazaar Orders",
            "Pets"
        ]
        this.middleClickStartsWith = [
            "Bestiary",
            "Private Island",
            "Hub",
            "Spiders Den",
            "Blazing Fortress",
            "The End",
            "Deep Caverns",
            "The Park",
            "Spooky Festival",
            "Catacombs",
            "The Catacombs",
            "Settings",
            "Bazaar",
            "Farming",
            "Mining",
            "Woods & Fishes",
            "Oddities"
        ]
        this.middleClickEndsWith = [
            "Recipe",
            "Recipes",
            ") Pets",
            "Collection",
            "Active Effects"
        ]

        this.registerEvent("guiMouseClick", this.guiClicked)
        this.registerEvent("guiOpened", (event)=>{
            if(this.museumGuiEnabled.getValue()) this.museumGui.guiOpened.call(this.museumGui, event)
            // if(this.dungeonReadyGuiEnabled.getValue()) this.dungeonReady.guiOpened.call(this.dungeonReady, event)
        })
        this.registerStep(true, 10, this.step)
        this.registerEvent("worldUnload", ()=>{this.museumGui.saveMuseumCache.call(this.museumGui)})
        this.registerStep(false, 30, ()=>{this.museumGui.saveMuseumCache.call(this.museumGui)})
    }

    guiClicked(mouseX, mouseY, button, gui, event){
        if(gui.class.toString()==="class net.minecraft.client.gui.inventory.GuiChest" && button===0 && this.replaceSbMenuClicks.getValue()){
            
            let hoveredSlot = gui.getSlotUnderMouse()
            if(!hoveredSlot) return

            let hoveredSlotId = hoveredSlot[f.slotNumber]

            // logger.logMessage(hoveredSlotId, 4)

            if(this.guiSlotClicked(ChatLib.removeFormatting(Player.getOpenedInventory().getName()), hoveredSlotId)){
                cancel(event)
            }
        }
    }

    step(){
        if(this.museumGuiEnabled.getValue()) this.museumGui.tick.call(this.museumGui)
        // if(this.dungeonReadyGuiEnabled.getValue()) this.dungeonReady.tick.call(this.dungeonReady)
        
        if(this.replaceSbMenuClicks.getValue()){
            if(Player.getOpenedInventory() && Player.getOpenedInventory().getName()==="SkyBlock Menu"){
                if(this.lastWindowId === 0){
                    this.lastWindowId = Player.getOpenedInventory().getWindowId()
                    return;
                }
                if(Player.getOpenedInventory().getWindowId()!==this.lastWindowId){
                    this.lastWindowId = Player.getOpenedInventory().getWindowId()
                    this.shouldHold+= 10
                    if(Date.now()-this.clickSlotTime >1000){
                        this.clickSlot = -1
                    }
                    if(this.clickSlot && this.clickSlot != -1){
                        Player.getOpenedInventory().click(this.clickSlot, false, "MIDDLE")
                        this.clickSlot = -1
                    }
                }else{
                    this.shouldHold--
                }
            }else{
                this.lastWindowId =0
            }
        }
    }

    guiSlotClicked(inventoryName, slotId){
        if(inventoryName.endsWith(" Sack")) return false
        switch(inventoryName){
            case "SkyBlock Menu":
                switch(slotId){
                    case 30:
                        ChatLib.command("pets")
                    break
                    case 25:
                        ChatLib.command("storage")
                    break
                    default:
                        if(this.shouldHold>0 && this.reliableSbMenuClicks.getValue()){
                            this.clickSlot = slotId
                            this.clickSlotTime = Date.now()
                        }else{
                            Player.getOpenedInventory().click(slotId, false, "MIDDLE")
                        }
                    break;
                }
                return true
            break
            default:
                if(this.middleClickGuis.includes(inventoryName)){
                    Player.getOpenedInventory().click(slotId, false, "MIDDLE")
                    return true
                }
                for(let thing of this.middleClickStartsWith){
                    if(inventoryName.startsWith(thing)){
                        Player.getOpenedInventory().click(slotId, false, "MIDDLE")
                        return true
                    }
                }
                for(let thing of this.middleClickEndsWith){
                    if(inventoryName.endsWith(thing)){
                        Player.getOpenedInventory().click(slotId, false, "MIDDLE")
                        return true
                    }
                }
                return false
            break
        }
    }

    initVariables(){
        this.replaceSbMenuClicks = undefined
        this.lastWindowId = undefined
        this.shouldHold = undefined
        this.clickSlot = undefined
        this.clickSlotTime = undefined
        this.reliableSbMenuClicks = undefined
        this.middleClickGuis = undefined
        this.middleClickStartsWith = undefined
        this.middleClickEndsWith = undefined

        this.museumGui = undefined
    }

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new BetterGuis()
}