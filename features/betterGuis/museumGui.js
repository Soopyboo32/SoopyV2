import { SoopyGui, SoopyRenderEvent } from "../../../guimanager"
import SoopyKeyPressEvent from "../../../guimanager/EventListener/SoopyKeyPressEvent"
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent"
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow"
import ProgressBar from "../../../guimanager/GuiElement/ProgressBar"
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement"
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement"
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement"
import renderLibs from "../../../guimanager/renderLibs"
import utils from "../../utils/utils"

class MuseumGui {
    constructor(){
        this.checkMenu = false

        this.isInMuseum = false
        this.guiOpenTickThing = false
        this.dontOpen = 0
        this.lastClosed = 0
        this.itemsInPages = {}

        this.soopyGui = new SoopyGui()

        this.soopyGui.element.addEvent(new SoopyKeyPressEvent().setHandler((...args)=>{
            this.keyPress(...args)
        }))

        this.mainPage = new SoopyGuiElement().setLocation(0,0,1,1)
        this.soopyGui.element.addChild(this.mainPage)

        let widthPer = 0.2
        let leftOffset = (1-widthPer*3-widthPer*4/5)/2

        this.weaponsIndicator = new SoopyBoxElement().setLocation(leftOffset, 0.05, widthPer*4/5, 0.15)
        this.weaponsIndicator.addEvent(new SoopyRenderEvent().setHandler(()=>{
            if(this.weaponsIndicator.hovered && ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName()) !== "Weapons"){
                this.weaponText.location.location.x.set(0.05, 500)
                this.weaponText.location.size.x.set(0.9, 500)
                this.weaponText.location.location.y.set(0.025, 500)
                this.weaponText.location.size.y.set(0.35, 500)
                
                this.weaponsIndicator.setColorOffset(-20, -20, -20, 100)

                Renderer.translate(0,0,100)
                Renderer.drawRect(Renderer.color(0,0,0,100), this.weaponsIndicator.location.getXExact(), this.weaponsIndicator.location.getYExact(), this.weaponsIndicator.location.getWidthExact(), this.weaponsIndicator.location.getHeightExact())
                let clicks = ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName())==="Museum"?"1":"2"
                Renderer.translate(0,0,100)
                renderLibs.drawStringCenteredFull(clicks, this.weaponsIndicator.location.getXExact()+this.weaponsIndicator.location.getWidthExact()/2, this.weaponsIndicator.location.getYExact()+this.weaponsIndicator.location.getHeightExact()/2, Math.min(this.weaponsIndicator.location.getWidthExact()/Renderer.getStringWidth(clicks)/4, this.weaponsIndicator.location.getHeightExact()/4/2))
            }else{
                this.weaponText.location.location.x.set(0.1, 500)
                this.weaponText.location.size.x.set(0.8, 500)
                this.weaponText.location.location.y.set(0.05, 500)
                this.weaponText.location.size.y.set(0.3, 500)

                this.weaponsIndicator.setColorOffset(0, 0, 0, 100)
            }
        })).addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            this.clickedTopButton("Weapons")
        }))

        this.weaponText = new SoopyTextElement().setText("§5Weapons").setMaxTextScale(10).setLocation(0.1,0.05,0.8,0.3)
        this.weaponsIndicator.addChild(this.weaponText)
        this.weaponsPercentageText = new SoopyTextElement().setLocation(0.1,0.4,0.8,0.2).setText("§0Items Donated: §7Loading...").setMaxTextScale(10)
        this.weaponsIndicator.addChild(this.weaponsPercentageText)
        this.weaponsProgressBar = new ProgressBar().setLocation(0.1,0.6,0.8,0.35).showPercentage(true)
        this.weaponsIndicator.addChild(this.weaponsProgressBar)
        this.mainPage.addChild(this.weaponsIndicator)

        this.armourIndicator = new SoopyBoxElement().setLocation(leftOffset+widthPer, 0.05, widthPer*4/5, 0.15)
        this.armourIndicator.addEvent(new SoopyRenderEvent().setHandler(()=>{
            if(this.armourIndicator.hovered && ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName()) !== "Armor Sets"){
                this.armourText.location.location.x.set(0.05, 500)
                this.armourText.location.size.x.set(0.9, 500)
                this.armourText.location.location.y.set(0.025, 500)
                this.armourText.location.size.y.set(0.35, 500)
                
                this.armourIndicator.setColorOffset(-20, -20, -20, 100)

                Renderer.translate(0,0,100)
                Renderer.drawRect(Renderer.color(0,0,0,100), this.armourIndicator.location.getXExact(), this.armourIndicator.location.getYExact(), this.armourIndicator.location.getWidthExact(), this.armourIndicator.location.getHeightExact())
                let clicks = ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName())==="Museum"?"1":"2"
                Renderer.translate(0,0,100)
                renderLibs.drawStringCenteredFull(clicks, this.armourIndicator.location.getXExact()+this.armourIndicator.location.getWidthExact()/2, this.armourIndicator.location.getYExact()+this.armourIndicator.location.getHeightExact()/2, Math.min(this.armourIndicator.location.getWidthExact()/Renderer.getStringWidth(clicks)/4, this.armourIndicator.location.getHeightExact()/4/2))
            }else{
                this.armourText.location.location.x.set(0.1, 500)
                this.armourText.location.size.x.set(0.8, 500)
                this.armourText.location.location.y.set(0.05, 500)
                this.armourText.location.size.y.set(0.3, 500)

                this.armourIndicator.setColorOffset(0, 0, 0, 100)}
        })).addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            this.clickedTopButton("Armor Sets")
        }))

        this.armourText = new SoopyTextElement().setText("§5Armor Sets").setMaxTextScale(10).setLocation(0.1,0.05,0.8,0.3)
        this.armourIndicator.addChild(this.armourText)
        this.armourPercentageText = new SoopyTextElement().setLocation(0.1,0.4,0.8,0.2).setText("§0Items Donated: §7Loading...").setMaxTextScale(10)
        this.armourIndicator.addChild(this.armourPercentageText)
        this.armourProgressBar = new ProgressBar().setLocation(0.1,0.6,0.8,0.35).showPercentage(true)
        this.armourIndicator.addChild(this.armourProgressBar)
        this.mainPage.addChild(this.armourIndicator)

        this.raritiesIndicator = new SoopyBoxElement().setLocation(leftOffset+widthPer*2, 0.05, widthPer*4/5, 0.15)
        this.raritiesIndicator.addEvent(new SoopyRenderEvent().setHandler(()=>{
            if(this.raritiesIndicator.hovered && ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName()) !== "Rarities"){
                this.raritiesText.location.location.x.set(0.05, 500)
                this.raritiesText.location.size.x.set(0.9, 500)
                this.raritiesText.location.location.y.set(0.025, 500)
                this.raritiesText.location.size.y.set(0.35, 500)
                
                this.raritiesIndicator.setColorOffset(-20, -20, -20, 100)

                Renderer.translate(0,0,100)
                Renderer.drawRect(Renderer.color(0,0,0,100), this.raritiesIndicator.location.getXExact(), this.raritiesIndicator.location.getYExact(), this.raritiesIndicator.location.getWidthExact(), this.raritiesIndicator.location.getHeightExact())
                let clicks = ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName())==="Museum"?"1":"2"
                Renderer.translate(0,0,100)
                renderLibs.drawStringCenteredFull(clicks, this.raritiesIndicator.location.getXExact()+this.raritiesIndicator.location.getWidthExact()/2, this.raritiesIndicator.location.getYExact()+this.raritiesIndicator.location.getHeightExact()/2, Math.min(this.raritiesIndicator.location.getWidthExact()/Renderer.getStringWidth(clicks)/4, this.raritiesIndicator.location.getHeightExact()/4/2))
            }else{
                this.raritiesText.location.location.x.set(0.1, 500)
                this.raritiesText.location.size.x.set(0.8, 500)
                this.raritiesText.location.location.y.set(0.05, 500)
                this.raritiesText.location.size.y.set(0.3, 500)

                this.raritiesIndicator.setColorOffset(0, 0, 0, 100)
            }
        })).addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            this.clickedTopButton("Rarities")
        }))

        this.raritiesText = new SoopyTextElement().setText("§5Rarities").setMaxTextScale(10).setLocation(0.1,0.05,0.8,0.3)
        this.raritiesIndicator.addChild(this.raritiesText)
        this.raritiesPercentageText = new SoopyTextElement().setLocation(0.1,0.4,0.8,0.2).setText("§0Items Donated: §7Loading...").setMaxTextScale(10)
        this.raritiesIndicator.addChild(this.raritiesPercentageText)
        this.raritiesProgressBar = new ProgressBar().setLocation(0.1,0.6,0.8,0.35).showPercentage(true)
        this.raritiesIndicator.addChild(this.raritiesProgressBar)
        this.mainPage.addChild(this.raritiesIndicator)

        this.specialIndicator = new SoopyBoxElement().setLocation(leftOffset+widthPer*3, 0.05, widthPer*4/5, 0.15)
        this.specialIndicator.addEvent(new SoopyRenderEvent().setHandler(()=>{
            if(this.specialIndicator.hovered && ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName()) !== "Special Items"){
                this.specialText.location.location.x.set(0.05, 500)
                this.specialText.location.size.x.set(0.9, 500)
                this.specialText.location.location.y.set(0.025, 500)
                this.specialText.location.size.y.set(0.35, 500)
                
                this.specialIndicator.setColorOffset(-20, -20, -20, 100)

                Renderer.translate(0,0,100)
                Renderer.drawRect(Renderer.color(0,0,0,100), this.specialIndicator.location.getXExact(), this.specialIndicator.location.getYExact(), this.specialIndicator.location.getWidthExact(), this.specialIndicator.location.getHeightExact())
                let clicks = ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName())==="Museum"?"1":"2"
                Renderer.translate(0,0,100)
                renderLibs.drawStringCenteredFull(clicks, this.specialIndicator.location.getXExact()+this.specialIndicator.location.getWidthExact()/2, this.specialIndicator.location.getYExact()+this.specialIndicator.location.getHeightExact()/2, Math.min(this.specialIndicator.location.getWidthExact()/Renderer.getStringWidth(clicks)/4, this.specialIndicator.location.getHeightExact()/4/2))
            
            }else{
                this.specialText.location.location.x.set(0.1, 500)
                this.specialText.location.size.x.set(0.8, 500)
                this.specialText.location.location.y.set(0.05, 500)
                this.specialText.location.size.y.set(0.3, 500)

                this.specialIndicator.setColorOffset(0, 0, 0, 100)
            }
        })).addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            this.clickedTopButton("Special Items")
        }))

        this.specialText = new SoopyTextElement().setText("§5Special Items").setMaxTextScale(10).setLocation(0.1,0.05,0.8,0.3)
        this.specialIndicator.addChild(this.specialText)
        this.specialPercentageText = new SoopyTextElement().setLocation(0.1,0.4,0.8,0.6).setText("§0Items Donated: §7Loading...").setMaxTextScale(10)
        this.specialIndicator.addChild(this.specialPercentageText)
        this.mainPage.addChild(this.specialIndicator)

        let box = new SoopyBoxElement().setLocation(0.5-widthPer/2, 0.25, widthPer, 0.075)
        this.pageTitle = new SoopyTextElement().setText("§5Museum").setMaxTextScale(10).setLocation(0,0,1,1)
        box.addChild(this.pageTitle)
        this.mainPage.addChild(box)

        this.itemsBox = new SoopyBoxElement().setLocation(0.5-widthPer*3/2, 0.35, widthPer*3, 0.6).setScrollable(true)
        this.mainPage.addChild(this.itemsBox)
    }

    clickedTopButton(type){
        if(ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName())===type) return

        if(ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName())==="Museum"){
            //if on main page can just directly click on it
            switch(type){
                case "Weapons":
                    Player.getOpenedInventory().click(19, false, "MIDDLE")
                    break
                case "Armor Sets":
                    Player.getOpenedInventory().click(21, false, "MIDDLE")
                    break
                case "Rarities":
                    Player.getOpenedInventory().click(23, false, "MIDDLE")
                    break
                case "Special Items":
                    Player.getOpenedInventory().click(25, false, "MIDDLE")
                    break
            }
        }else{
            Player.getOpenedInventory().click(48, false, "MIDDLE")
        }
    }

    tickMenu(){
        this.pageTitle.setText("§5"+ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName()))
        if(ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName())==="Museum"){
            if(!Player.getOpenedInventory().getStackInSlot(19)) return
            
            let lore = Player.getOpenedInventory().getStackInSlot(19).getLore()
            lore.forEach((line, i)=>{
                if(i===0) return
                
                if(line.split(" ")?.[1]?.includes("/")){
                    let data = ChatLib.removeFormatting(line).split(" ")[1].split("/")

                    this.weaponsProgressBar.setProgress(parseInt(data[0])/parseInt(data[1]))
                    this.weaponsPercentageText.setText("§0Items Donated: §7"+data[0]+"/"+data[1])
                }
            })
            this.weaponsIndicator.setLore(lore)
            
            lore = Player.getOpenedInventory().getStackInSlot(21).getLore()
            lore.forEach((line, i)=>{
                if(i===0) return
                
                if(line.split(" ")?.[1]?.includes("/")){
                    let data = ChatLib.removeFormatting(line).split(" ")[1].split("/")

                    this.armourProgressBar.setProgress(parseInt(data[0])/parseInt(data[1]))
                    this.armourPercentageText.setText("§0Items Donated: §7"+data[0]+"/"+data[1])
                }
            })
            this.armourIndicator.setLore(lore)
            
            lore = Player.getOpenedInventory().getStackInSlot(23).getLore()
            lore.forEach((line, i)=>{
                if(i===0) return

                if(line.split(" ")?.[1]?.includes("/")){
                    let data = ChatLib.removeFormatting(line).split(" ")[1].split("/")
                    
                    this.raritiesProgressBar.setProgress(parseInt(data[0])/parseInt(data[1]))
                    this.raritiesPercentageText.setText("§0Items Donated: §7"+data[0]+"/"+data[1])
                }
            })
            this.raritiesIndicator.setLore(lore)
            
            lore = Player.getOpenedInventory().getStackInSlot(25).getLore()
            lore.forEach((line, i)=>{
                if(i===0) return
                
                if(ChatLib.removeFormatting(line).startsWith("Items Donated: ")){
                    this.specialPercentageText.setText("§0Items Donated: §7"+ChatLib.removeFormatting(line).split(": ")[1])
                }
            })
            this.specialIndicator.setLore(lore)
        }

        let itempages = ["Weapons", "Armor Sets", "Rarities", "Special Items"]
        if(itempages.includes(ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName()))){
            let page = ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName())
            let pageNum = 0
            Player.getOpenedInventory().getStackInSlot(45).getLore().forEach(line=>{
                if(ChatLib.removeFormatting(line).startsWith("Page ")) pageNum = parseInt(ChatLib.removeFormatting(line).split(" ")[1])+1
            })
            Player.getOpenedInventory().getStackInSlot(53).getLore().forEach(line=>{
                if(ChatLib.removeFormatting(line).startsWith("Page ")) pageNum = parseInt(ChatLib.removeFormatting(line).split(" ")[1])-1
            })

            if(!this.itemsInPages[page]) this.itemsInPages[page] = []

            //10-16 43
            let changed = false
            for(let i = 0;i<3;i++){
                for(let j = 10;j<16;j++){
                    let slot = i*9+j
                    let item = Player.getOpenedInventory().getStackInSlot(slot)
                    let sb_id = utils.getSBID(item)
                    if(sb_id){
                        if(!this.itemsInPages[page][pageNum]) this.itemsInPages[page][pageNum] = []
                        if(!this.itemsInPages[page][pageNum][i]) this.itemsInPages[page][pageNum][i] = []

                        let itemData = {
                            sb_id: sb_id,
                            name: item.getName(),
                            lore: item.getLore()
                        }

                        if(JSON.stringify(this.itemsInPages[page][pageNum][i][j]) !== JSON.stringify(itemData)){
                            this.itemsInPages[page][pageNum][i][j] = itemData
                            
                            changed = true
                        }
                    }
                }
            }
            if(changed) this.regenItems()
        }
    }

    regenItems(){
        this.itemsBox.clearChildren()

        let page = ChatLib.removeFormatting(Player.getOpenedInventory().getStackInSlot(4).getName())

        let y = 0.1
        let itemNum = 0
        let width = 2
        let widthPer = 0.9/(width+1)
        let offset = 0.0125

        this.itemsInPages[page].forEach(page=>{
            if(page === null) return
            page.forEach(row=>{
                if(row === null) return
                row.forEach(slot=>{
                    if(slot === null) return

                    let child = new ButtonWithArrow().setText(slot.name.startsWith("§f")?"&7"+slot.name.substr(2):slot.name).setLore(slot.lore).setLocation(0.05+offset+widthPer*itemNum,y,widthPer*9/10,0.15)
                    this.itemsBox.addChild(child)

                    itemNum++
                    if(itemNum>width){
                        itemNum = 0
                        y+=0.175
                    }
                })
            })
        })
    }

    guiOpened(event){
        if(this.dontOpen > 0){
            this.dontOpen--
            return
        }
        if(this.soopyGui.ctGui.isOpen()){
            cancel(event)
            // this.soopyGui.ctGui.open()
            return
        }
        if(this.isInMuseum){
            this.soopyGui.ctGui.open()
        }else{
            this.checkMenu = true
        }
    }

    keyPress(key, keyId){
        if(keyId === 1){ //escape key
            this.isInMuseum = false
            this.dontOpen = 3
        }
    }

    tick(){
        if(this.isInMuseum){
            if(this.soopyGui.ctGui.isOpen() || this.guiOpenTickThing){
                this.tickMenu()
                
                this.guiOpenTickThing = false
            }else{
                // Client.currentGui.close()
                this.isInMuseum = false
                
                this.lastClosed = Date.now()
            }
        }

        if(!(this.soopyGui.ctGui.isOpen() || this.guiOpenTickThing) && Date.now()-this.lastClosed > 1000){
            this.weaponsProgressBar.setProgress(0)
            this.armourProgressBar.setProgress(0)
            this.raritiesProgressBar.setProgress(0)
        }

        if(this.checkMenu){
            if(Player.getOpenedInventory().getName() === "Your Museum" && !this.isInMuseum){
                this.isInMuseum = true

                this.soopyGui.open()
                this.guiOpenTickThing = true
            }
            this.checkMenu = false
        }

        if(this.dontOpen > 0){
            Client.currentGui.close()
        }
    }
}

export default MuseumGui;