/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />

const Color = Java.type("java.awt.Color")

import Feature from "../../featureClass/class";
import { f, m } from "../../../mappings/mappings";
import renderLibs from "../../../guimanager/renderLibs";
import ToggleSetting from "../settings/settingThings/toggle";
import { drawBoxAtBlock } from "../../utils/renderUtils";
import { SoopyGui, SoopyRenderEvent } from "../../../guimanager";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
const BufferedImage = Java.type("java.awt.image.BufferedImage")

class DungeonMap extends Feature {
    constructor() {
        super()
    }

    isInDungeon(){
        return this.FeatureManager.features["dataLoader"].class.isInDungeon
    }

    onEnable(){
        this.initVariables()

        this.renderMap = new ToggleSetting("Render Map", "Toggles Rendering the map on the hud (scuffed)", false, "dmap_render", this)
        this.brBox = new ToggleSetting("Box around doors in br", "In map category because it uses map to find location (no esp)", true, "dmap_door", this)
        this.spiritLeapOverlay = new ToggleSetting("Spirit leap overlay", "Cool overlay for the spirit leap menu", true, "spirit_leap_overlay", this)
        
        this.MAP_QUALITY_SCALE = 2
        this.IMAGE_SIZE = 128*this.MAP_QUALITY_SCALE

        this.defaultPlayerImage = new Image("skull-steve","https://cravatar.eu/avatar/dc8c39647b294e03ae9ed13ebd65dd29")
        this.playerImages = {}
        this.mapDataPlayers = {}
        this.offset = []
        this.people = []
        this.mapScale = 1
        this.puzzles = {}
        this.puzzlesTab = []
        this.roomWidth = 1
        this.newPuzzlesTab = []
        this.mortLocationOnMap = undefined
        this.brBoxLoc = undefined
        this.invMapImage = new BufferedImage(128, 128, BufferedImage.TYPE_INT_ARGB)
        this.renderImage = new BufferedImage(this.IMAGE_SIZE,this.IMAGE_SIZE, BufferedImage.TYPE_INT_ARGB)
        this.mapImage = new Image(this.renderImage)

        this.mapLocation = [10,10]
        this.mapRenderScale = 128/this.IMAGE_SIZE

        this.spiritLeapOverlayGui = new SpiritLeapOverlay(this)

        // this.registerEvent("tick", this.tick)
        this.registerStep(true, 3, this.step)
        this.registerEvent("renderOverlay", this.renderOverlay)
        this.registerEvent("renderWorld", this.renderWorld)
        this.registerEvent("worldLoad", this.worldLoad)
        
        this.registerEvent("guiOpened", (event)=>{
            if(this.spiritLeapOverlay.getValue()) this.spiritLeapOverlayGui.guiOpened.call(this.spiritLeapOverlayGui, event)
        })

        this.running = true
        this.registerEvent("gameUnload", ()=>{
            this.running = false
        })

        new Thread(()=>{
            while(this.running){
                if(this.isInDungeon()){
                    let startedUpdatingTime = Date.now()
                    // console.log("Updating map...")
                    this.updateMapImage()
                    // console.log("Finished updating map")
                    let time = Date.now()-startedUpdatingTime

                    if(time< 300)Thread.sleep(300-time)
                }else{
                    Thread.sleep(1000)
                }
            }
        }).start()

        this.registerChat("&r&r&r                     &r&cThe Catacombs &r&8- &r&eFloor ${*} Stats&r", ()=>{
            this.puzzles = {}
        })
    }

    worldLoad(){
        this.mortLocation = undefined
        // this.playerImages = {}
        this.mapDataPlayers = {}
        this.offset = []
        this.mapScale = 1
        this.puzzles = {}
        this.puzzlesTab = []
        this.brBoxLoc = undefined
        this.mortLocationOnMap = undefined
    }

    renderWorld(){
        if(this.isInDungeon() && this.brBox.getValue()){
            if(this.brBoxLoc){
                drawBoxAtBlock(this.brBoxLoc[0]-1.5, 69, this.brBoxLoc[1]-1.5, 255,0,0, 3, 4)
            }
        }
    }

    renderOverlay(){
        if(this.isInDungeon() && this.renderMap.getValue()){
            this.drawMap(...this.mapLocation, this.mapRenderScale*this.IMAGE_SIZE, this.mapRenderScale)
        }
    }

    drawMap(x, y, size, scale){
        if(this.mapImage){
            this.mapImage.draw(x, y, size, size)
            
            this.drawOtherMisc(x, y, size, scale)
            
            this.drawPlayersLocations(x, y, size, scale)
        }
    }

    drawOtherMisc(x2, y2, size2, scale){
        Object.keys(this.puzzles).forEach(loc=>{
            if(!this.puzzles[loc])  return
            let x = loc%128
            let y = Math.floor(loc/128)

            let lines = this.puzzles[loc].split(" ")

            lines.forEach((l, i)=>{
                renderLibs.drawStringCentered("&0&l" + l, x*scale*2+x2+this.roomWidth/2*scale*2-l.length/2*scale*2, y*scale*2+y2+this.roomWidth/3*scale*2+i*6*scale*2-((lines.length-1)*3+4)*scale*2, scale*2)
            })

        })
    }
    
    drawPlayersLocations(x, y, size, scale){

        let uuidToPlayer = {}
        World.getAllPlayers().forEach(player=>{
            if(player.getPing()===-1)return
            if(!this.people.includes(player.getName())) return
            uuidToPlayer[player.getUUID().toString()] = player
            this.mapDataPlayers[player.getUUID().toString()] = {
                x: player.getX(),
                y: player.getZ(),
                rot: player.getYaw()+180,
                username: player.getName(),
                uuid: player.getUUID().toString()
            }
        })

        Object.keys(this.mapDataPlayers).forEach((uuid)=>{

            let renderX = this.mapDataPlayers[uuid].x/this.mapScale/128*size//*16/this.roomWidth
            let renderY = this.mapDataPlayers[uuid].y/this.mapScale/128*size//*16/this.roomWidth

            Renderer.translate(renderX+x+this.offset[0]/128*size, renderY+y+this.offset[1]/128*size)
            Renderer.scale(scale*2, scale*2)
            Renderer.rotate(this.mapDataPlayers[uuid].rot)
            this.getImageForPlayer(uuid).draw(-5,-5, 10, 10)
        })
    }

    step(){
        if(!World.getWorld()) return
        // console.log("asjbfoasbgp")
        this.people = []
        this.puzzlesTab = []
        TabList.getNames().forEach(nameo=>{

            
//         Party (2) | Soopyboo32 (Mage XXXVI) |  Ultimate: Ready |  Revive Stones: 1 |  | zZzJAKE ♲ (DEAD) |  Ultimate: 00m 45s |  Revive Stones: 0 |  |  |  |  |  |  |  |  |  |  |  |  |        Player Stats | Downed: zZzJAKE |  Time: 00m 47s |  Revive: 01m 40s |  | Deaths: (2) |  Damage Dealt: 4.7M❤ |  Healing Done: 718❤ |  Milestone: ☠❸ |  | Discoveries: (0) |  Secrets Found: 0 |  Crypts: 0 |  |  |  |  |  |  |  |        Dungeon Stats | Dungeon: Catacombs |  Opened Rooms: 13 |  Completed Rooms: 12 |  Secrets Found: 0% |  Time: 01m 51s |  | Puzzles: (3) |  ???: [✦] |  ???: [✦] |  ???: [✦] |  |  |  |  |  |  |  |  |  |        Account Info | Profile: Pomegranate |  Pet Sitter: N/A |  Bank: 57M/11M |  Interest: 04h 19m 10s |  | Skills: Combat 60: MAX |  Speed: ✦457 |  Strength: ❁859 |  Crit Chance: ☣62 |  Crit Damage: ☠1479 |  Attack Speed: ⚔92 |  | Event: Election Over! |  Starts In: 2h 39m 10s |  | Election: 0d 2h 39m 10s |  Aatrox: |||||||||| (79%) |  Marina: |||||||||| (7%) |  Cole: |||||||||| (6%) | Soopyboo32
            let line = ChatLib.removeFormatting(nameo).trim().replace("♲ ","") //TODO: Remove bingo symbol
            if(line.endsWith(")") && line.includes(" (") && line.split(" (").length === 2 && line.split(" (")[0].split(" ").length === 1 && line.split(" (")[1].length>5){
                this.people.push(line.split(" ")[0])
            }

            name = ChatLib.removeFormatting(nameo).trim().split(" ")
            let end = name.pop()
            // console.log(end) Water Board: [✔] 
            if(end !== "[✦]" && end !== "[✔]") return
            name = name.join(" ").trim().replace(":", "")
            if(name.length > 1 && !name.includes("?")){
                this.puzzlesTab.push(name)
            }
            // console.log(name)
        })
        let puzzlesTab2 = this.puzzlesTab.map(a=>a)
        // console.log(this.puzzlesTab.length)
        Object.keys(this.puzzles).forEach(key=>{
            this.puzzles[key] = puzzlesTab2.shift()
            // console.log(key, this.puzzles[key], this.puzzlesTab.length)
        })

        this.spiritLeapOverlayGui.tick()
    }

    updateMapImage(){
        World.getAllPlayers().forEach(player=>{
            if(player.getPing()===-1)return
            if(!this.people.includes(player.getName())) return
            this.mapDataPlayers[Player.getUUID().toString()] = {
                x: player.getX(),
                y: player.getZ(),
                rot: player.getYaw()+180,
                username: player.getName(),
                uuid: player.getUUID().toString()
            }
        })
        if(!this.mortLocation){
            try{
            World.getAllEntities().forEach(entity=>{
                if(ChatLib.removeFormatting(entity.getName()) === ("Mort")){
                    this.mortLocation = [
                        entity.getX(),
                        entity.getZ()
                    ]
                }
            })
        }catch(e){}
        }

        let graphics = this.renderImage.getGraphics()

        // graphics.setColor(new Color(Renderer.color(255, 255, 255, 255)))
        graphics.fillRect(0,0,this.IMAGE_SIZE,this.IMAGE_SIZE)

        let mapData
        try {
            let item = Player.getInventory().getStackInSlot(8)
            mapData = item.getItem()[m.getMapData](item.getItemStack(), World.getWorld()); // ItemStack.getItem().getMapData()
        } catch (error) {
        }
        if(mapData){

            // console.log("has map data poggies")
            let bytes = mapData[f.colors.MapData]

            let x = 0
            let y = 0
            for(let i = 0; i < bytes.length; i++){
                // console.log(bytes[i]/4)

                if(bytes[i] !== 0){
                    let j = bytes[i]&255
                    let color = new Color(net.minecraft.block.material.MapColor[f.mapColorArray][j>>2][m.getMapColor.MapColor](j & 3))
                    // this.invMapImage.setRGB(x, y, color)
                    graphics.setColor(color)
                    graphics.fillRect(x*this.MAP_QUALITY_SCALE, y*this.MAP_QUALITY_SCALE, this.MAP_QUALITY_SCALE, this.MAP_QUALITY_SCALE)
                }
                x++
                if(x >= 128){
                    x=0
                    y++

                    if(y>128) break
                }

                // mapImage.getRGB()
            }

            // newImage.setRGB(0,0,128,128, ints, 0, 1)

            // graphics. ()
            //room size is 18
            //4 inbetween

            //finding room offsets
            let brBoxTemp = undefined
            let roomOffsets
            let roomWidth1 = 0
            let roomWidth2 = 0
            for(let x = 0;x<128;x++){
                for(let y = 0;y<128;y++){
                    if(bytes[x+y*128] === 30 && bytes[(x-1)+(y)*128] === 0){
                        roomWidth1++
                    }
                }
                if(roomWidth1 > 0) break;
            }
            for(let x = 0;x<128;x++){
                for(let y = 0;y<128;y++){
                    if(bytes[y+x*128] === 30 && bytes[(y)+(x-1)*128] === 0){
                        roomWidth2++
                    }
                }
                if(roomWidth2 > 0) break;
            }

            let roomWidth = Math.floor(Math.max(roomWidth1, roomWidth2)*5/4)
            this.mapScale = 32/roomWidth
            let mortLocationOnMap
            for(let x = 0;x<128;x++){
                for(let y = 0;y<128;y++){
                    if(bytes[x+y*128] === 30 && bytes[(x-1)+(y-1)*128] === 0){
                        if(roomOffsets) break;
                        roomOffsets = [x%roomWidth-3, y%roomWidth-3]

                        let dir = roomWidth/2-5/this.mapScale

                        //top
                        for(let i = 0;i<roomWidth;i++){
                            if(bytes[(i+x-3)+(y-3)*128] !== 0){
                                mortLocationOnMap = [x-2+roomWidth/2, y-2+roomWidth/2-dir]
                                break
                            }
                        }
                        // if(mortLocationOnMap) break
                        //bottom
                        for(let i = 0;i<roomWidth;i++){
                            if(bytes[(i+x-3)+(y+roomWidth-3)*128] !== 0){
                                mortLocationOnMap = [x-2+roomWidth/2, y-2+roomWidth/2+dir]
                                break
                            }
                        }
                        //left
                        for(let i = 0;i<roomWidth;i++){
                            if(bytes[(x-3)+(i+y-3)*128] !== 0){
                                mortLocationOnMap = [x-2+roomWidth/2-dir, y-2+roomWidth/2]
                                break
                            }
                        }
                        //right
                        for(let i = 0;i<roomWidth;i++){
                            if(bytes[(x+roomWidth-3)+(i+y-3)*128] !== 0){
                                mortLocationOnMap = [x-2+roomWidth/2+dir, y-2+roomWidth/2]
                            }
                        }

                        break
                    }
                    // mortLocationOnMap = mortLocationOnMap*16/this.roomWidth
                    if(bytes[x+y*128] === 66 && bytes[(x-1)+(y)*128] === 0 && bytes[(x)+(y-1)*128] === 0){
                        if(!this.puzzles[x+y*128]){
                            this.puzzles[x+y*128] = "Loading"
                        }
                    }

                }

            }
            if(mortLocationOnMap && this.mortLocation){
                
                for(let x = roomOffsets[0];x<128;x+=roomWidth){
                    for(let y = roomOffsets[1];y<128;y+=roomWidth){
                        let testLocs = [[x, y+roomWidth/2, false],[x+roomWidth/2, y, true]]
                        testLocs.forEach(([ux, uy, isX])=>{
                            
                            // console.log(bytes[~~ux+~~uy*128])
                            if(bytes[~~ux+~~uy*128] === 119 || bytes[~~ux+~~uy*128] === 18){
    
                                brBoxTemp = [
                                    (ux-mortLocationOnMap[0])/roomWidth*32+this.mortLocation[0],
                                    (uy-mortLocationOnMap[1])/roomWidth*32+this.mortLocation[1]
                                ]

                                if(isX){
                                    brBoxTemp[0] = Math.floor(brBoxTemp[0]/32+0.5)*32+16
                                    brBoxTemp[1] = Math.floor(brBoxTemp[1]/32+0.5)*32
                                }else{
                                    brBoxTemp[0] = Math.floor(brBoxTemp[0]/32+0.5)*32
                                    brBoxTemp[1] = Math.floor(brBoxTemp[1]/32+0.5)*32+16
                                }
    
                                brBoxTemp = [
                                    (~~brBoxTemp[0])-8.5,
                                    (~~brBoxTemp[1])-8.5
                                ]
                            }
                        })
                    }

                }
            }

            this.brBoxLoc = brBoxTemp

            if(roomOffsets && this.renderImage){
                // for(let x = 0;x<128;x++){
                //     for(let y = 0;y<128;y++){
                //         if((x-roomOffsets[0])%roomWidth===0 || (y-roomOffsets[1])%roomWidth===0){
                //             this.renderImage.setRGB(x*this.MAP_QUALITY_SCALE, y*this.MAP_QUALITY_SCALE, Renderer.color(0,0,0))
                //         }
                //     }
                // }
                
                // for(let x = roomOffsets[0];x<128;x+=roomWidth){
                //     for(let y = roomOffsets[1];y<128;y+=roomWidth){
                //         let testLocs = [[x, y+roomWidth/2],[x+roomWidth/2, y]]
                //         testLocs.forEach(([ux, uy])=>{
                //             ux = ~~ux
                //             uy = ~~uy
                            
                //             try{
                //             this.renderImage.setRGB(ux*this.MAP_QUALITY_SCALE, uy*this.MAP_QUALITY_SCALE, Renderer.color(255,0,0))
                //             }catch(e){}
                //         })
                //     }

                // }

                if(mortLocationOnMap && this.mortLocation){
                    this.offset = [mortLocationOnMap[0]-this.mortLocation[0]/this.mapScale, mortLocationOnMap[1]-this.mortLocation[1]/this.mapScale]
                    // this.renderImage.setRGB(mortLocationOnMap[0], mortLocationOnMap[1], Renderer.color(255, 0, 0))
                }
            }

            // console.log(bytes[Math.floor(Player.getX()/this.mapScale+this.offset[0])+Math.floor(Player.getZ()/this.mapScale + this.offset[1])*128])
            this.roomWidth = roomWidth
            
            this.mortLocationOnMap = this.mortLocationOnMap

            if(this.mortLocation && mortLocationOnMap && roomWidth){
                let deco = mapData[f.mapDecorations]
                this.extraDeco = []
                try{
                deco.forEach((icon, vec4b) => {
                    let x = vec4b.func_176112_b()
                    let y = vec4b.func_176113_c()
                    let rot = vec4b.func_176111_d()
                    x = x/2+64
                    y = y/2+64
                    rot=rot*360/16+180

                    
                    x= (x-mortLocationOnMap[0])/roomWidth*32+this.mortLocation[0]
                    y= (y-mortLocationOnMap[1])/roomWidth*32+this.mortLocation[1]
                    
        
                    //wtf is this
        
                    //vec4b.func_176110_a()

        
                    let closestP = undefined
                    let closestDistance = Infinity
                    Object.keys(this.mapDataPlayers).forEach((uuid)=>{
                        if((x-this.mapDataPlayers[uuid].x)**2+(y-this.mapDataPlayers[uuid].y)**2 < closestDistance){
                            closestDistance = (x-this.mapDataPlayers[uuid].x)**2+(y-this.mapDataPlayers[uuid].y)**2
                            closestP = uuid
                        }
                    })
                    if(closestP){
                        // console.log(closestP, x, y)
                        this.mapDataPlayers[closestP].x = x
                        this.mapDataPlayers[closestP].y = y
                        this.mapDataPlayers[closestP].rot = rot
                    }
                });
            }catch(e){}
            }
            let newMapImageThing = new Image(this.renderImage)
            this.mapImage = newMapImageThing
        }


        // this.mapImage.setImage(this.renderImage)
    }
    
    getImageForPlayer(uuid){
        if(!this.playerImages) return this.defaultPlayerImage
        uuid = uuid.replace(/-/g, "")
        if(this.playerImages[uuid] === "Loading") return this.defaultPlayerImage
        if(this.playerImages[uuid]) return this.playerImages[uuid]

        this.playerImages[uuid]= "Loading"
        new Thread(()=>{
            this.playerImages[uuid] = new Image("skull-" + uuid,"https://cravatar.eu/helmavatar/" + uuid)
        }).start()
        return this.defaultPlayerImage
    }
 
    initVariables(){
        this.mapImage = undefined
        this.defaultPlayerImage = undefined
        this.mortLocation = undefined
        this.playerImages = undefined
        this.offset = undefined
        this.puzzles = undefined
        this.puzzlesTab = undefined
        this.mapScale = undefined
        this.newPuzzlesTab = undefined
        this.renderImage = undefined
    }

    onDisable(){
        this.initVariables()
        this.running = false
    }
}

module.exports = {
    class: new DungeonMap()
}

const ContainerChest = Java.type("net.minecraft.inventory.ContainerChest")
class SpiritLeapOverlay {
    constructor(parent){
        this.parent = parent

        this.soopyGui = new SoopyGui()

        let renderThing = new soopyGuiMapRendererThing(this).setLocation(0,0,1,1)
        this.soopyGui.element.addChild(renderThing)

        this.buttonsContainer = new SoopyGuiElement().setLocation(0.25,0.6, 0.5, 0.4)
        this.soopyGui.element.addChild(this.buttonsContainer)

        this.items = {}
    }
    
    guiOpened(event){
        if(event.gui && event.gui.field_147002_h instanceof ContainerChest){
            name = event.gui.field_147002_h.func_85151_d().func_145748_c_().func_150260_c()
            if(name === "Spirit Leap"){
                this.soopyGui.open()
            }
        }
    }

    tick(){
        let itemsNew = {}

        if(Player.getOpenedInventory()?.getName() === "Spirit Leap"){
            for(let i = 1;i<9*3;i++){
                let item = Player.getOpenedInventory().getStackInSlot(i)
                if(item && item.getID()!==160){
                    itemsNew[item.getName()] = i
                }
            }
        }

        if(JSON.stringify(this.items) !== JSON.stringify(itemsNew)){
            this.items = itemsNew
            this.buttonsContainer.clearChildren()
            Object.keys(this.items).forEach((name, i)=>{ //TODO: make the button to leap to the last person to open a door a diff color AND MAKE IT UPDATE LIVE
                let button = new ButtonWithArrow().setText(name).addEvent(new SoopyMouseClickEvent().setHandler(()=>{
                    Player.getOpenedInventory().click(itemsNew[name])
                    ChatLib.chat("Leaping to " + name)
                })).setLocation(0,i/5,1,1/5)
                this.buttonsContainer.addChild(button)
            })
        }
    }
}

class soopyGuiMapRendererThing extends SoopyGuiElement {
    constructor(parent){
        super()

        this.parentE = parent

        this.addEvent(new SoopyRenderEvent().setHandler((mouseX, mouseY)=>{
            let size2 = Math.min(Renderer.screen.getWidth()/2, Renderer.screen.getHeight()/2)

            let [x, y, size, scale] = [Renderer.screen.getWidth()/2-size2/2,Renderer.screen.getHeight()/3-size2/2, size2, size2/this.parentE.parent.IMAGE_SIZE]

            this.parentE.parent.drawMap(x, y, size, scale)

            if(mouseY>y+size2) return
            let closestPlayer = this.getClosestPlayerTo(x, y, size, scale, mouseX, mouseY)

            if(closestPlayer){
                let renderX = closestPlayer.x/this.parentE.parent.mapScale/128*size//*16/this.roomWidth
                let renderY = closestPlayer.y/this.parentE.parent.mapScale/128*size//*16/this.roomWidth
    
                Renderer.translate(renderX+x+this.parentE.parent.offset[0]/128*size, renderY+y+this.parentE.parent.offset[1]/128*size)
                renderLibs.drawStringCentered("&a" + closestPlayer.username, 0,-10*scale*3, 2)
                Renderer.translate(renderX+x+this.parentE.parent.offset[0]/128*size, renderY+y+this.parentE.parent.offset[1]/128*size)
                Renderer.scale(scale*3, scale*3)
                Renderer.rotate(closestPlayer.rot)
                this.parentE.parent.getImageForPlayer(closestPlayer.uuid).draw(-5,-5, 10, 10)
            }
        }))
        this.addEvent(new SoopyMouseClickEvent().setHandler((mouseX, mouseY)=>{
            let size2 = Math.min(Renderer.screen.getWidth()/2, Renderer.screen.getHeight()/2)

            let [x, y, size, scale] = [Renderer.screen.getWidth()/2-size2/2,Renderer.screen.getHeight()/3-size2/2, size2, size2/this.parentE.parent.IMAGE_SIZE]

            if(mouseY>y+size2) return

            let closestPlayer = this.getClosestPlayerTo(x, y, size, scale, mouseX, mouseY)

            if(closestPlayer){
                if(Player.getOpenedInventory()?.getName() === "Spirit Leap"){
                    for(let i = 1;i<9*3;i++){
                        let item = Player.getOpenedInventory().getStackInSlot(i)
                        if(item && item.getID()!==160){
                            if(ChatLib.removeFormatting(item.getName()) === closestPlayer.username){
                                Player.getOpenedInventory().click(i)
                                ChatLib.chat("Leaping to " + closestPlayer.username)
                            }
                        }
                    }
                }
            }
        }))
    }

    getClosestPlayerTo(x, y, size, scale, scanX, scanY){
    
        let closest = null
        let closestD = Infinity
        Object.keys(this.parentE.parent.mapDataPlayers).forEach((uuid)=>{

            if(uuid === Player.getUUID()) return
            
            let renderX = this.parentE.parent.mapDataPlayers[uuid].x/this.parentE.parent.mapScale/128*size//*16/this.roomWidth
            let renderY = this.parentE.parent.mapDataPlayers[uuid].y/this.parentE.parent.mapScale/128*size//*16/this.roomWidth

           let distance = (renderX+x+this.parentE.parent.offset[0]/128*size-scanX)**2+ (renderY+y+this.parentE.parent.offset[1]/128*size-scanY)**2

            if(distance < closestD){
                closestD = distance
                closest = this.parentE.parent.mapDataPlayers[uuid]
            }
        })

        return closest
    }
}