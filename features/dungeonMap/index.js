/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />

const Color = Java.type("java.awt.Color")

import Feature from "../../featureClass/class";
import { f, m } from "../../../mappings/mappings";
import renderLibs from "../../../guimanager/renderLibs";
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

        
        this.MAP_QUALITY_SCALE = 2
        this.IMAGE_SIZE = 128*this.MAP_QUALITY_SCALE

        this.defaultPlayerImage = new Image("skull-steve","https://cravatar.eu/avatar/dc8c39647b294e03ae9ed13ebd65dd29")
        this.playerImages = {}
        this.mapDataPlayers = {}
        this.offset = []
        this.mapScale = 1
        this.puzzles = {}
        this.puzzlesTab = []
        this.roomWidth = 1
        this.newPuzzlesTab = []
        this.invMapImage = new BufferedImage(128, 128, BufferedImage.TYPE_INT_ARGB)
        this.renderImage = new BufferedImage(this.IMAGE_SIZE,this.IMAGE_SIZE, BufferedImage.TYPE_INT_ARGB)
        this.mapImage = new Image(this.renderImage)

        this.mapLocation = [10,10]
        this.mapRenderScale = 128/this.IMAGE_SIZE

        // this.registerEvent("tick", this.tick)
        this.registerStep(true, 3, this.step)
        this.registerEvent("renderOverlay", this.renderOverlay)
        this.registerEvent("worldLoad", this.worldLoad)

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
        this.newPuzzlesTab = []
    }

    renderOverlay(){
        if(this.isInDungeon()){
            if(this.mapImage){
                this.mapImage.draw(...this.mapLocation, this.mapRenderScale*this.IMAGE_SIZE, this.mapRenderScale*this.IMAGE_SIZE)
                
                this.drawPlayersLocations()

                this.drawOtherMisc()
            }
        }
    }

    drawOtherMisc(){
        Object.keys(this.puzzles).forEach(loc=>{
            let x = loc%128
            let y = Math.floor(loc/128)

            let lines = this.puzzles[loc].split(" ")

            lines.forEach((l, i)=>{
                renderLibs.drawStringCentered("&0&l" + l, x+this.mapLocation[0]+this.roomWidth/2*this.mapRenderScale*2-l.length/2*this.mapRenderScale*2, y+this.mapLocation[1]+this.roomWidth/3*this.mapRenderScale*2+i*6*this.mapRenderScale*2-((lines.length-1)*3+4)*this.mapRenderScale*2, this.mapRenderScale*2)
            })

        })
    }
    
    drawPlayersLocations(){

        let uuidToPlayer = {}
        World.getAllPlayers().forEach(player=>{
            uuidToPlayer[player.getUUID().toString()] = player
        })

        Object.keys(this.mapDataPlayers).forEach((uuid)=>{
            let player = uuidToPlayer[uuid]
            if(player){
                this.mapDataPlayers[uuid] = {
                    x: player.getX()/this.mapScale,
                    y: player.getZ()/this.mapScale,
                    rot: player.getYaw()+180
                }
            }


            let renderX = this.mapDataPlayers[uuid].x/128*this.mapRenderScale*this.IMAGE_SIZE//*16/this.roomWidth
            let renderY = this.mapDataPlayers[uuid].y/128*this.mapRenderScale*this.IMAGE_SIZE//*16/this.roomWidth

            Renderer.translate(renderX+this.mapLocation[0]+this.offset[0]/128*this.mapRenderScale*this.IMAGE_SIZE, renderY+this.mapLocation[1]+this.offset[1]/128*this.mapRenderScale*this.IMAGE_SIZE)
            Renderer.rotate(this.mapDataPlayers[uuid].rot)
            this.getImageForPlayer(uuid).draw(-5,-5, 10, 10)
        })
    }

    step(){
        // console.log("asjbfoasbgp")
        TabList.getNames().forEach(name=>{
            name = ChatLib.removeFormatting(name).trim().split(" ")
            let end = name.pop()
            if(end !== "[✦]") return
            name = name.join(" ").trim().replace(":", "")
            if(name.length > 1 && !name.includes("?") && !this.puzzlesTab.includes(name)){
                this.newPuzzlesTab.push(name)
                this.puzzlesTab.push(name)
            }
        })
    }

    updateMapImage(){
        World.getAllPlayers().forEach(player=>{
            this.mapDataPlayers[Player.getUUID().toString()] = {
                x: player.getX()/this.mapScale,
                y: player.getZ()/this.mapScale,
                rot: player.getYaw()+180
            }
        })
        if(!this.mortLocation){
            World.getAllEntities().forEach(entity=>{
                if(ChatLib.removeFormatting(entity.getName()) === ("Mort")){
                    this.mortLocation = [
                        entity.getX(),
                        entity.getZ()
                    ]
                }
            })
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
            let deco = mapData[f.mapDecorations]
            deco.forEach((icon, vec4b) => {
                let x = vec4b.func_176112_b()
                let y = vec4b.func_176113_c()
                let rot = vec4b.func_176111_d()
    
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

                this.mapDataPlayers[closestP].x = x
                this.mapDataPlayers[closestP].y = y
                this.mapDataPlayers[closestP].rot = rot
            });

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
                        if(!this.puzzles[x+y*128] && this.newPuzzlesTab.length > 0){
                            this.puzzles[x+y*128] = this.newPuzzlesTab.shift()
                        }
                    }
                }

            }

            if(roomOffsets){
                // for(let x = 0;x<128;x++){
                //     for(let y = 0;y<128;y++){
                //         if((x-roomOffsets[0])%roomWidth===0 || (y-roomOffsets[1])%roomWidth===0){
                //             this.renderImage.setRGB(x*this.MAP_QUALITY_SCALE, y*this.MAP_QUALITY_SCALE, Renderer.color(0,0,0))
                //         }
                //     }
                // }

                if(mortLocationOnMap && this.mortLocation){
                    this.offset = [mortLocationOnMap[0]-this.mortLocation[0]/this.mapScale, mortLocationOnMap[1]-this.mortLocation[1]/this.mapScale]
                    // this.renderImage.setRGB(mortLocationOnMap[0], mortLocationOnMap[1], Renderer.color(255, 0, 0))
                }
            }

            // console.log(bytes[Math.floor(Player.getX()/this.mapScale+this.offset[0])+Math.floor(Player.getZ()/this.mapScale + this.offset[1])*128])
            this.roomWidth = roomWidth

        }


        let newMapImageThing = new Image(this.renderImage)
        this.mapImage = newMapImageThing
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