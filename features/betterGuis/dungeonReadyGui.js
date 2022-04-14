import { SoopyGui } from "../../../guimanager"


const ContainerChest = Java.type("net.minecraft.inventory.ContainerChest")

class DungeonReadyGui {
    constructor(){
        this.checkMenu = false

        this.soopyGui = new SoopyGui()

        this.soopyGui.optimisedLocations = true
    }

    tickMenu(){

    }

    guiOpened(event){
        let name = ""
        if(event.gui && event.gui.field_147002_h instanceof ContainerChest){
            name = event.gui.field_147002_h.func_85151_d().func_145748_c_().func_150260_c()
        }
        if(this.soopyGui.ctGui.isOpen()){
            if(event.gui && event.gui.field_147002_h){
                Player.getPlayer().field_71070_bA = event.gui.field_147002_h

                if(!Player.getOpenedInventory().getName().startsWith("Catacombs - Floor ")){
                    return   
                }

                event.gui = this.soopyGui.ctGui
                this.soopyGui.ctGui.open()
            }
            return
        }
        if(name === "Start Dungeon"){
            if(event.gui && event.gui.field_147002_h) Player.getPlayer().field_71070_bA = event.gui.field_147002_h

            this.soopyGui.open()
            event.gui = this.soopyGui.ctGui
        }
    }

    tick(){
        if(this.soopyGui.ctGui.isOpen()){
            this.tickMenu()
        }
    }
}

export default DungeonReadyGui;