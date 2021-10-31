/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { SoopyGui, SoopyRenderEvent } from "../../../guimanager";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import renderLibs from "../../../guimanager/renderLibs";
import Feature from "../../featureClass/class";
import ToggleSetting from "../settings/settingThings/toggle";

class AgentThings extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.nearPlayerData = []
        while(this.nearPlayerData.length < 100){this.nearPlayerData.push({})}

        this.recordNearestPlayers = new ToggleSetting("Record nearby players", "You can then view this data with /nearplayers", true, "record_near_players", this)

        this.registerStep(false, 1, this.step)

        this.nearPlayersGui = new SoopyGui().setOpenCommand("nearplayers")

        this.nearPlayersGuiBox = new SoopyBoxElement().setLocation(0.25, 0.25, 0.5, 0.5)
        this.nearPlayersGui.element.addChild(this.nearPlayersGuiBox)

        this.nearPlayersRenderElement = new SoopyGuiElement()
        this.nearPlayersGuiBox.addChild(this.nearPlayersRenderElement)

        
        let selected = undefined
        let selectedDist = undefined
        let lastXY = 0
        this.nearPlayersRenderElement.addEvent(new SoopyRenderEvent().setHandler((mouseX, mouseY)=>{
            let moved = lastXY !== mouseX+mouseY
            lastXY = mouseX+mouseY

            let x = this.nearPlayersRenderElement.location.getXExact()
            let y = this.nearPlayersRenderElement.location.getYExact()
            let width = this.nearPlayersRenderElement.location.getWidthExact()
            let height = this.nearPlayersRenderElement.location.getHeightExact()

            x+=width*0.125
            y+=height*0.125
            width*=0.75
            height*=0.75

            Renderer.drawLine(Renderer.color(0, 0, 0), x, y+height, x+width, y+height, 2)//bottom axis line
            Renderer.drawLine(Renderer.color(0, 0, 0), x, y, x, y+height, 2)//left axis line

            renderLibs.drawStringCentered("&0100s ago", x, y+height+6, Renderer.screen.getWidth()/1000)
            renderLibs.drawStringCentered("&050s ago", x+width/2, y+height+6, Renderer.screen.getWidth()/1000)
            renderLibs.drawStringCentered("&0Now", x+width, y+height+6, Renderer.screen.getWidth()/1000) //bottom axis markers

            
            renderLibs.drawStringCenteredVertically("&025m away", x+3-Renderer.getStringWidth("&025m away")*Renderer.screen.getWidth()/1000, y, Renderer.screen.getWidth()/1000)
            renderLibs.drawStringCenteredVertically("&020m away", x+3-Renderer.getStringWidth("&020m away")*Renderer.screen.getWidth()/1000, y+height/5*1, Renderer.screen.getWidth()/1000)
            renderLibs.drawStringCenteredVertically("&010m away", x+3-Renderer.getStringWidth("&010m away")*Renderer.screen.getWidth()/1000, y+height/5*3, Renderer.screen.getWidth()/1000)
            renderLibs.drawStringCenteredVertically("&00m away", x+3-Renderer.getStringWidth("&00m away")*Renderer.screen.getWidth()/1000, y+height-6, Renderer.screen.getWidth()/1000)

            if(moved){
                selected = undefined
                selectedDist = undefined
            }
            let lastUuids = []
            this.nearPlayerData.forEach((data, i)=>{
                let newLastUuids = []
                Object.keys(data).forEach(uuid=>{
                    newLastUuids.push(uuid)
                    lastUuids = lastUuids.filter(a=>a!==uuid)

                    let dist = data[uuid].distance
                    let oldDist = this.nearPlayerData[i-1]?.[uuid]?.distance || 25

                    let thisX = x+(i)/100*width
                    let thisY = y+height-(dist/25)*height

                    if(moved && (thisX-mouseX)**2 + (thisY-mouseY)**2 < 3){
                        selected = uuid
                        selectedDist = dist
                    }

                    if(i !== 0){
                        Renderer.drawLine(Renderer.color(0, 0, 0), x+(i-1)/100*width, y+height-(oldDist/25)*height, thisX, thisY, 1)
                    }

                    Renderer.drawRect(Renderer.color(0, 0, 0), thisX-1, thisY-1, 3, 3)
                })

                lastUuids.forEach(uuid=>{
                    let dist = 25
                    let oldDist = this.nearPlayerData[i-1]?.[uuid]?.distance || 25

                    let thisX = x+(i)/100*width
                    let thisY = y+height-(dist/25)*height

                    if(i !== 0){
                        Renderer.drawLine(Renderer.color(0, 0, 0), x+(i-1)/100*width, y+height-(oldDist/25)*height, thisX, thisY, 1)
                    }
                })

                lastUuids = newLastUuids
            })

            if(selected){
                width = this.nearPlayersRenderElement.location.getWidthExact()
                height = this.nearPlayersRenderElement.location.getHeightExact()
    
                width*=0.75
                height*=0.75

                renderLibs.scizzorFast(0,0,Renderer.screen.getWidth(), Renderer.screen.getHeight())
                let selectedIgn = undefined
                let lastRenderedSelected = false
                this.nearPlayerData.forEach((data, i)=>{
                    if(data[selected]){
                        lastRenderedSelected = true

                        selectedIgn = data[selected].name

                        let dist = data[selected].distance
                        let oldDist = this.nearPlayerData[i-1]?.[selected]?.distance || 25

                        let thisX = x+(i)/100*width
                        let thisY = y+height-(dist/25)*height

                        if(i !== 0){
                            Renderer.drawLine(Renderer.color(255, 0, 0), x+(i-1)/100*width, y+height-(oldDist/25)*height, thisX, thisY, 3)
                        }
                    }else{
                        if(lastRenderedSelected){
                            lastRenderedSelected = false

                            let dist = 25
                            let oldDist = this.nearPlayerData[i-1]?.[selected]?.distance || 25
    
                            let thisX = x+(i)/100*width
                            let thisY = y+height-(dist/25)*height
    
                            if(i !== 0){
                                Renderer.drawLine(Renderer.color(255, 0, 0), x+(i-1)/100*width, y+height-(oldDist/25)*height, thisX, thisY, 3)
                            }
                        }
                    }
                })

                let width = Math.max(Renderer.getStringWidth(selectedIgn)*2, Renderer.getStringWidth("Distance: " + selectedDist.toFixed(1)))+8
                let height = 32
                renderLibs.drawBox([255, 255, 255], mouseX+10, mouseY-height/2, width,height, 3)
                renderLibs.drawString("&0" + selectedIgn, mouseX+14, mouseY-height/2+3, 2)
                renderLibs.drawString("&0Distance: &7" + selectedDist.toFixed(1) , mouseX+14, mouseY-height/2+21, 1)
            }
            
        }))
    }

    step(){
        if(!this.recordNearestPlayers.getValue()) return

        let thisSecondPlayerData = {}
        World.getAllPlayers().forEach(p=>{
            let distSq = (p.getX()-Player.getX())**2+(p.getY()-Player.getY())**2+(p.getZ()-Player.getZ())**2

            if(distSq < 25*25 && distSq !== 0){
                thisSecondPlayerData[p.getUUID().toString()] = {name: p.getName(), distance: Math.sqrt(distSq)}
            }
        })

        this.nearPlayerData.push(thisSecondPlayerData)

        if(this.nearPlayerData.length > 100) this.nearPlayerData.shift()
    }

    initVariables(){
        this.recordNearestPlayers = undefined
        this.nearPlayerData = undefined
        this.nearPlayersGui = undefined
        this.nearPlayersGuiBox = undefined
        this.nearPlayersRenderElement = undefined
    }

    onDisable(){
        this.nearPlayersGui.delete()

        this.initVariables()
    }
}

module.exports = {
    class: new AgentThings()
}