import { f, m } from "../../../mappings/mappings"
import DungeonMapRoom from "./DungeonMapRoom"
import DungeonRoomStaticData from "./DungeonRoomStaticData"

const Color = Java.type("java.awt.Color")
const BufferedImage = Java.type("java.awt.image.BufferedImage")

let DEFAULT_DOOR_COLOR = new Color(Renderer.color(114, 67, 27, 255))
let PUZZLE_DOOR_COLOR = new Color(Renderer.color(178, 76, 216, 255))
let MINIBOSS_DOOR_COLOR = new Color(Renderer.color(229, 229, 51, 255))
let BLOOD_DOOR_COLOR = new Color(Renderer.color(255, 0, 0, 255))
let TRAP_DOOR_COLOR = new Color(Renderer.color(216, 127, 51, 255))
let WITHER_DOOR_COLOR = new Color(Renderer.color(0, 0, 0, 255))

let mapDataScale = {
    "E": 22,
    "1": 22,
    "2": 22,
    "3": 22,
    "4": 20,
    "5": 20,
    "6": 20,
    "7": 20
}

// let TabOverlayListField = Java.type("net.minecraft.client.gui.GuiPlayerTabOverlay").class.getDeclaredField("field_175252_a")
// TabOverlayListField.setAccessible(true)
// let TabOverlayList = TabOverlayListField.get(null)
let PlayerComparator = Java.type("net.minecraft.client.gui.GuiPlayerTabOverlay").PlayerComparator
let c = PlayerComparator.class.getDeclaredConstructor()
c.setAccessible(true);
let sorter = c.newInstance()
let nethandlerplayclient = Player.getPlayer()[f.sendQueue.EntityPlayerSP]

class DungeonMapData {
    constructor(floor) {
        this.floor = floor

        this.roomScaleMap = mapDataScale[floor[floor.length - 1]] //how many pixels on the map is 32 blocks
        this.roomOffsetMap = [0, 0] //How offset is the map

        /**
         * @type {Map<String,DungeonMapRoom>}
         */
        this.rooms = new Map()
        /**
         * @type {Map<String,Number>}
         */
        this.doors = new Map()

        this.greenRoomCoords = undefined

        this.image = undefined
        this.oldImage = undefined

        this.renderTicks = false

        this.players = []
        this.playersNameToId = {}
    }

    updatePlayers() {
        let pl = nethandlerplayclient[m.getPlayerInfoMap]().sort((a, b) => sorter.compare(a, b))
        let i = 0
        for (let p of pl) {
            if (!p[m.getDisplayName.NetworkPlayerInfo]()) continue
            let line = p[m.getDisplayName.NetworkPlayerInfo]()[m.getUnformattedText]().trim().replace("♲ ", "") //TODO: Remove bingo symbol
            if (line.endsWith(")") && line.includes(" (") && line.split(" (").length === 2 && line.split(" (")[0].split(" ").length === 1 && line.split(" (")[1].length > 5) {
                let name = line.split(" ")[0]

                if (!this.players[i]) {
                    this.players[i] = {
                        name: "",
                        x: 0,
                        y: 0,
                        rotate: 0,
                        skin: undefined
                    }
                }
                this.players[i].name = name
                this.players[i].skin = p[m.getLocationSkin.NetworkPlayerInfo]()
                this.playersNameToId[name] = i

                i++
            }
        }
    }

    updatePlayersFast() {
        World.getAllPlayers().forEach(player => {
            let p = this.players[this.playersNameToId[ChatLib.removeFormatting(player.getName()).trim()]]
            if (!p) return

            p.x = player.getX()
            p.y = player.getZ()
            p.rotate = player.getYaw() + 180
        })
    }

    loadPlayersFromDecoration(deco) {

        let i = 0
        deco.forEach((icon, vec4b) => {

            if (!this.players[i]) return

            let x = vec4b.func_176112_b()
            let y = vec4b.func_176113_c()
            let rot = vec4b.func_176111_d()
            x = x / 2 + this.roomScaleMap
            y = y / 2 + this.roomScaleMap
            rot = rot * 360 / 16 + 180

            this.players[i].rotate = rot
            this.players[i].x = (x) / this.roomScaleMap * 32 - this.roomOffsetMap[0]
            this.players[i].y = (y) / this.roomScaleMap * 32 - this.roomOffsetMap[1]

            i++
        });
    }

    updateHotbarData() {

        let mapData
        try {
            let item = Player.getInventory().getStackInSlot(8)
            mapData = item.getItem()[m.getMapData](item.getItemStack(), World.getWorld()); // ItemStack.getItem().getMapData()
        } catch (error) {
        }
        if (mapData) {
            this.loadPlayersFromDecoration(mapData[f.mapDecorations])

            let bytes = mapData[f.colors.MapData]
            if (!this.greenRoomCoords) return
            //30 = green
            //0 = transparent
            //66 = puzzle
            //34 = white

            let rx = 0
            let ry = 0
            for (let x = 0; x < 128; x += 5) {
                for (let y = 0; y < 128; y += 5) {
                    if (bytes[x + y * 128] === 30
                        && bytes[x + 1 + y * 128] === 30
                        && bytes[x + 2 + y * 128] === 30
                        && bytes[x + 3 + y * 128] === 30) {
                        rx = x
                        ry = y
                        while (bytes[(rx - 1) + ry * 128] === 30) {
                            rx--
                        }
                        while (bytes[(rx) + (ry - 1) * 128] === 30) {
                            ry--
                        }
                        break;
                    }
                }
                if (rx) break;
            }
            rx += (this.roomScaleMap / 4 * 5) / 2 - this.roomScaleMap
            ry += (this.roomScaleMap / 4 * 5) / 2 - this.roomScaleMap
            this.roomOffsetMap[0] = -((this.greenRoomCoords[0]) / 32 * this.roomScaleMap + 2 * this.roomScaleMap - rx) / this.roomScaleMap * 32
            this.roomOffsetMap[1] = -((this.greenRoomCoords[1]) / 32 * this.roomScaleMap + 2 * this.roomScaleMap - ry) / this.roomScaleMap * 32

            console.log(this.roomOffsetMap.join(","))


            let toMap = (x2, y2) => {
                return Math.round(((x2 + this.roomOffsetMap[0]) / 32 * this.roomScaleMap + 2 * this.roomScaleMap)) + Math.round(((y2 + this.roomOffsetMap[1]) / 32 * this.roomScaleMap + 2 * this.roomScaleMap)) * 128
            }

            console.log(bytes[toMap(Player.getX(), Player.getZ())])

            let loadRoomAt = (x, y) => {
                x = Math.floor((x + 8) / 32) * 32 - 8
                y = Math.floor((y + 8) / 32) * 32 - 8

                if (bytes[toMap(x + 16, y + 16)] === 30) {
                    this.setRoomFull(x, y, 0, DungeonMapRoom.TYPE_SPAWN, DungeonMapRoom.SHAPE_1X1, 0)
                }
                if (bytes[toMap(x + 16, y + 16)] === 66) {
                    this.setRoomFull(x, y, 0, DungeonMapRoom.TYPE_PUZZLE, DungeonMapRoom.SHAPE_1X1, 0)
                }
                if (bytes[toMap(x + 16, y + 16)] === 82) {
                    this.setRoomFull(x, y, 0, DungeonMapRoom.TYPE_FAIRY, DungeonMapRoom.SHAPE_1X1, 0)
                }
                if (bytes[toMap(x + 16, y + 16)] === 18) {
                    this.setRoomFull(x, y, 0, DungeonMapRoom.TYPE_BLOOD, DungeonMapRoom.SHAPE_1X1, 0)
                }
                if (bytes[toMap(x + 16, y + 16)] === 64) {
                    this.setRoomFull(x, y, 0, DungeonMapRoom.TYPE_TRAP, DungeonMapRoom.SHAPE_1X1, 0)
                }
                if (bytes[toMap(x + 16, y + 16)] === 63) {
                    let width = 32
                    let height = 32
                    while (bytes[toMap(x, y + 5)] === 63) {
                        x -= 32
                        width += 32
                    }
                    while (bytes[toMap(x + 5, y)] === 63) {
                        y -= 32
                        height += 32
                    }
                    while (bytes[toMap(x + width, y + 5)] === 63) {
                        width += 32
                    }
                    while (bytes[toMap(x + 5, y + height)] === 63) {
                        height += 32
                    }

                    let shape = DungeonMapRoom.SHAPE_1X1
                    let rotation = 0

                    if (width === height) {
                        if (width === 64) {
                            shape = DungeonMapRoom.SHAPE_2X2
                        }
                    }
                    if (width > height) {
                        if (width === 64) {
                            shape = DungeonMapRoom.SHAPE_1X2
                        }
                        if (width === 96) {
                            shape = DungeonMapRoom.SHAPE_1X3
                        }
                        if (width === 128) {
                            shape = DungeonMapRoom.SHAPE_1X4
                        }
                    }
                    if (width < height) {
                        rotation = 1
                        if (height === 64) {
                            shape = DungeonMapRoom.SHAPE_1X2
                        }
                        if (height === 96) {
                            shape = DungeonMapRoom.SHAPE_1X3
                        }
                        if (height === 128) {
                            shape = DungeonMapRoom.SHAPE_1X4
                        }
                    }

                    this.setRoomFull(x, y, rotation, DungeonMapRoom.TYPE_NORMAL, shape, 0)
                }
            }
            for (let x = -200; x < 100; x += 32) {
                for (let y = -200; y < 100; y += 32) {
                    loadRoomAt(x, y)
                }
            }
        }
    }

    setRenderTicks(val) {
        if (this.renderTicks !== val) {
            this.mapChanged()
        }
        this.renderTicks = val
    }

    setDoor(x, y, doorType, rotation) {//doorType 0=normal, 1=wither, 2=blood
        if (doorType === -1) {
            let id = World.getBlockStateAt(new BlockPos(x, 69, y)).getBlockId()
            if (id === 0) doorType = 0
            else if (id === 97) doorType = 0
            else if (id === 173) doorType = 1
            else if (id === 159) doorType = 2
            else return
        }
        if (this.doors.get(x + "," + y)?.join(",") !== doorType + "," + rotation) {
            this.doors.set(x + "," + y, [doorType, rotation])
            this.mapChanged()
        }
    }

    setRoomFull(x, y, rotation, roomType, shape, checkedState) {
        let locstr = x + "," + y

        if (shape === DungeonMapRoom.SHAPE_L && rotation === 2) {
            locstr = x + "," + (y + 32)
        }

        if (this.rooms.get(locstr) && this.rooms.get(locstr).type !== roomType) {
            this.rooms.get(locstr).type = roomType
            this.mapChanged()
            return
        }
        if (this.rooms.get(locstr) && this.rooms.get(locstr).checkedState !== checkedState) {
            this.rooms.get(locstr).setCheckedState(checkedState)
            this.mapChanged()
            return
        }
        if (this.rooms.get(locstr) && this.rooms.get(locstr).shape !== shape) {
            this.rooms.get(locstr).shape = shape
            this.mapChanged()
            return
        }
        if (this.rooms.get(locstr) && this.rooms.get(locstr).rotation !== rotation) {
            this.rooms.get(locstr).rotation = rotation
            this.mapChanged()
            return
        }
        if (this.rooms.get(locstr)) {
            return
        }

        let room = new DungeonMapRoom(roomType, shape, rotation, x, y, undefined)

        this.rooms.set(locstr, room)

        this.mapChanged()
    }

    setRoom(x, y, rotation, id) {
        let locstr = x + "," + y

        if (DungeonRoomStaticData.getDataFromId(id).shape === 'L' && rotation === 2) {
            locstr = x + "," + (y + 32)
        }

        if (this.rooms.get(locstr) && this.rooms.get(locstr).roomId !== id) {
            this.rooms.get(locstr).setId(id)
            this.mapChanged()
            return
        }
        if (this.rooms.get(locstr)) {
            return
        }

        let room = DungeonMapRoom.fromId(id, x, y, rotation)

        if (room.type === DungeonMapRoom.TYPE_SPAWN) {
            this.greenRoomCoords = [x, y]
        }

        this.rooms.set(locstr, room)

        this.mapChanged()
    }

    getPlayers() {
        return this.players
    }

    roomSecrets(x, y, rotation, id, curr, max) {
        let locstr = x + "," + y

        if (DungeonRoomStaticData.getDataFromId(id).shape === 'L' && rotation === 2) {
            locstr = x + "," + (y - 32)
        }

        if (this.rooms.get(locstr)) {
            this.rooms.get(locstr).setSecrets(curr, max)
        }
    }

    destroy() {
        this.oldImage.getTexture()[m.deleteGlTexture]()
        this.image.getTexture()[m.deleteGlTexture]()
        this.oldImage = undefined
        this.image = undefined
    }

    mapChanged() {
        if (this.image) {
            if (this.oldImage) this.oldImage.getTexture()[m.deleteGlTexture]()
            this.oldImage = this.image
            this.image = undefined
        }
    }

    /**
     * @returns {Image}
     */
    getImage() {
        if (!this.image) {
            this.image = new Image(this.render())
            this.image.draw(0, 0, 0, 0)
            if (this.oldImage) return this.oldImage
        }

        return this.image
    }

    renderSecrets(size) {
        for (let data of this.rooms.entries()) {
            let room = data[1]

            if (room.maxSecrets === 0) continue

            let text = room.getSecrets()
            let text2 = "&0" + ChatLib.removeFormatting(text)
            let width = Renderer.getStringWidth(text) - 6

            let location = room.getIconLocation()

            Renderer.drawString(text2, this.toImageX(location[0]) * size - width / 2 - 1, this.toImageY(location[1]) * size)
            Renderer.drawString(text2, this.toImageX(location[0]) * size - width / 2 + 1, this.toImageY(location[1]) * size)
            Renderer.drawString(text2, this.toImageX(location[0]) * size - width / 2, this.toImageY(location[1]) * size - 1)
            Renderer.drawString(text2, this.toImageX(location[0]) * size - width / 2, this.toImageY(location[1]) * size + 1)
            Renderer.drawString(text, this.toImageX(location[0]) * size - width / 2, this.toImageY(location[1]) * size)
        }
    }

    /**
     * @returns {BufferedImage}
     */
    render() {
        //create 256x256 image
        let image = new BufferedImage(256, 256, BufferedImage.TYPE_INT_ARGB)

        //create graphics rendering context
        let graphics = image.createGraphics()

        graphics.translate(256 - 32, 256 - 32)

        //render doors
        for (let data of this.doors.entries()) {
            let [location, [type, rotation]] = data
            location = location.split(",")
            let x = parseInt(location[0])
            let y = parseInt(location[1])

            let doorColor = type === 0 ? DEFAULT_DOOR_COLOR : (type === 1 ? WITHER_DOOR_COLOR : BLOOD_DOOR_COLOR)

            if (rotation === 0) {
                if (this.rooms.get((x - 15) + "," + (y + 1))?.type === DungeonMapRoom.TYPE_BLOOD) {
                    doorColor = BLOOD_DOOR_COLOR
                }
                if (this.rooms.get((x - 15) + "," + (y + 1))?.type === DungeonMapRoom.TYPE_PUZZLE) {
                    doorColor = PUZZLE_DOOR_COLOR
                }
                if (this.rooms.get((x - 15) + "," + (y + 1))?.type === DungeonMapRoom.TYPE_TRAP) {
                    doorColor = TRAP_DOOR_COLOR
                }
                if (this.rooms.get((x - 15) + "," + (y + 1))?.type === DungeonMapRoom.TYPE_MINIBOSS) {
                    doorColor = MINIBOSS_DOOR_COLOR
                }
                if (this.rooms.get((x - 15) + "," + (y - 31))?.type === DungeonMapRoom.TYPE_BLOOD) {
                    doorColor = BLOOD_DOOR_COLOR
                }
                if (this.rooms.get((x - 15) + "," + (y - 31))?.type === DungeonMapRoom.TYPE_PUZZLE) {
                    doorColor = PUZZLE_DOOR_COLOR
                }
                if (this.rooms.get((x - 15) + "," + (y - 31))?.type === DungeonMapRoom.TYPE_TRAP) {
                    doorColor = TRAP_DOOR_COLOR
                }
                if (this.rooms.get((x - 15) + "," + (y - 31))?.type === DungeonMapRoom.TYPE_MINIBOSS) {
                    doorColor = MINIBOSS_DOOR_COLOR
                }
            }
            if (rotation === 1) {
                if (this.rooms.get((x - 31) + "," + (y - 15))?.type === DungeonMapRoom.TYPE_BLOOD) {
                    doorColor = BLOOD_DOOR_COLOR
                }
                if (this.rooms.get((x - 31) + "," + (y - 15))?.type === DungeonMapRoom.TYPE_PUZZLE) {
                    doorColor = PUZZLE_DOOR_COLOR
                }
                if (this.rooms.get((x - 31) + "," + (y - 15))?.type === DungeonMapRoom.TYPE_TRAP) {
                    doorColor = TRAP_DOOR_COLOR
                }
                if (this.rooms.get((x - 31) + "," + (y - 15))?.type === DungeonMapRoom.TYPE_MINIBOSS) {
                    doorColor = MINIBOSS_DOOR_COLOR
                }
                if (this.rooms.get((x + 1) + "," + (y - 15))?.type === DungeonMapRoom.TYPE_BLOOD) {
                    doorColor = BLOOD_DOOR_COLOR
                }
                if (this.rooms.get((x + 1) + "," + (y - 15))?.type === DungeonMapRoom.TYPE_PUZZLE) {
                    doorColor = PUZZLE_DOOR_COLOR
                }
                if (this.rooms.get((x + 1) + "," + (y - 15))?.type === DungeonMapRoom.TYPE_TRAP) {
                    doorColor = TRAP_DOOR_COLOR
                }
                if (this.rooms.get((x + 1) + "," + (y - 15))?.type === DungeonMapRoom.TYPE_MINIBOSS) {
                    doorColor = MINIBOSS_DOOR_COLOR
                }
            }

            graphics.setColor(doorColor)

            graphics.fillRect(x + (rotation === 0 ? 0 : 1), y + (rotation === 1 ? 0 : 1), rotation === 0 ? 8 : 6, rotation === 1 ? 8 : 6)

            if (rotation === 0) {
                DungeonMapRoom.drawUnknownRoom(graphics, x - 15, y + 1)
                DungeonMapRoom.drawUnknownRoom(graphics, x - 15, y - 31)
            }
            if (rotation === 1) {
                DungeonMapRoom.drawUnknownRoom(graphics, x - 31, y - 15)
                DungeonMapRoom.drawUnknownRoom(graphics, x + 1, y - 15)
            }
        }

        //render rooms
        for (let data of this.rooms.entries()) {
            let room = data[1]
            room.draw(graphics, this.renderTicks)
        }

        graphics.translate(-256 + 32, -256 + 32)

        return image
    }

    toImageX(x) {
        return (x + 255 - 32) / 256
    }

    toImageY(y) {
        return (y + 255 - 32) / 256
    }
}

export default DungeonMapData