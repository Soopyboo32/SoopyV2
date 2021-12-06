/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import { f, m } from "../../mappings/mappings";
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

        this.defaultPlayerImage = new Image("skull-steve","https://cravatar.eu/avatar/dc8c39647b294e03ae9ed13ebd65dd29")
        this.playerImages = {}
        this.mapDataPlayers = {}
        this.offset = []
        this.mapScale = 1
        this.puzzles = []
        this.puzzlesTab = []
        this.newPuzzlesTab = []

        // this.registerEvent("tick", this.tick)
        this.registerStep(true, 5, this.step)
        this.registerEvent("renderOverlay", this.renderOverlay)
        this.registerEvent("worldLoad", this.worldLoad)
    }

    worldLoad(){
        this.mortLocation = undefined
        this.playerImages = {}
        this.mapDataPlayers = {}
        this.offset = []
        this.mapScale = 1
        this.puzzles = []
        this.puzzlesTab = []
        this.newPuzzlesTab = []
    }

    renderOverlay(){
        if(this.isInDungeon()){
            if(this.mapImage){
                this.mapImage.draw(50,50)
                
                this.drawPlayersLocations()
            }
        }
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

            Renderer.translate(this.mapDataPlayers[uuid].x+50+this.offset[0], this.mapDataPlayers[uuid].y+50+this.offset[1])
            Renderer.rotate(this.mapDataPlayers[uuid].rot)
            this.getImageForPlayer(uuid).draw(-5,-5, 10, 10)
        })
    }

    step(){
        TabList.getNames().forEach(name=>{
            name = ChatLib.removeFormatting(name).split()
            if(name[1].trim() === "[✦]" && !name[0].includes("???") && !this.puzzlesTab.includes(name[0].trim())){
                this.newPuzzlesTab.push(name[0].trim())
                this.puzzlesTab.push(name[0].trim())
            }
        })

        if(this.isInDungeon()){
            this.updateMapImage()
        }else{
            this.mapImage = undefined
        }
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

        let IMAGE_SIZE = 128
        let newImage = new BufferedImage(IMAGE_SIZE,IMAGE_SIZE, BufferedImage.TYPE_INT_RGB)
        let graphics = newImage.getGraphics()

        graphics.fillRect(0,0,IMAGE_SIZE,IMAGE_SIZE)

        let mapImage = new BufferedImage(128, 128, BufferedImage.TYPE_INT_ARGB)
        let mapData
        try {
            let item = Player.getInventory().getStackInSlot(8)
            mapData = item.getItem()[m.getMapData](item.getItemStack(), World.getWorld()); // ItemStack.getItem().getMapData()
        } catch (error) {
        }
        if(mapData){
            mapData[f.mapDecorations].forEach((icon, vec4b) => {
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
                    let color = net.minecraft.block.material.MapColor[f.mapColorArray][j>>2][m.getMapColor](j & 3);
                    mapImage.setRGB(x, y, color)
                    newImage.setRGB(x, y, color)
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
            let mortLocationOnMap = undefined
            let roomWidth = 0
            for(let x = 0;x<128;x++){
                for(let y = 0;y<128;y++){
                    if(bytes[x+y*128] === 30 && bytes[(x-1)+(y-1)*128] === 0){
                        roomWidth++
                    }
                }
                if(roomWidth > 0) break;
            }

            roomWidth = Math.floor(roomWidth*5/4)
            this.mapScale = 32/roomWidth
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
                        if(mortLocationOnMap) break
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
                    if(bytes[x+y*128] === 66 && bytes[(x-1)+(y)*128] === 0 && bytes[(x)+(y-1)*128] === 0){
                        if(!this.puzzles[x+y*128]){
                            this.puzzles[x+y*128] = this.newPuzzlesTab.shift()
                        }
                    }
                }

            }

            if(roomOffsets){
                for(let x = 0;x<128;x++){
                    for(let y = 0;y<128;y++){
                        if((x-roomOffsets[0])%roomWidth===0 || (y-roomOffsets[1])%roomWidth===0){
                            newImage.setRGB(x, y, 0)
                        }
                    }
                }

                if(mortLocationOnMap && this.mortLocation){
                    this.offset = [mortLocationOnMap[0]-this.mortLocation[0]/this.mapScale, mortLocationOnMap[1]-this.mortLocation[1]/this.mapScale]
                    newImage.setRGB(mortLocationOnMap[0], mortLocationOnMap[1], Renderer.color(255, 0, 0))
                }
            }

            // console.log(bytes[Math.floor(Player.getX()/this.mapScale+this.offset[0])+Math.floor(Player.getZ()/this.mapScale + this.offset[1])*128])

        }

        

        this.mapImage = new Image(newImage)
    }
    
    getImageForPlayer(uuid){
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
    }

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new DungeonMap()
}