import DungeonRoomStaticData from "./DungeonRoomStaticData"

const Color = Java.type("java.awt.Color")

class DungeonMapRoom {

    static TYPE_SPAWN = 0
    static TYPE_NORMAL = 1
    static TYPE_PUZZLE = 2
    static TYPE_MINIBOSS = 3
    static TYPE_FAIRY = 4
    static TYPE_BLOOD = 5
    static TYPE_UNKNOWN = 6

    static SHAPE_1X1 = 0
    static SHAPE_1X2 = 1
    static SHAPE_1X3 = 2
    static SHAPE_1X4 = 3
    static SHAPE_2X2 = 4
    static SHAPE_L = 5

    static fromId(roomId, x, y, rotation) {
        let data = DungeonRoomStaticData.getDataFromId(roomId)
        let type = DungeonMapRoom.TYPE_NORMAL
        switch (data.type) {
            case "mobs":
                type = DungeonMapRoom.TYPE_NORMAL
                break
            case "miniboss":
                type = DungeonMapRoom.TYPE_NORMAL
                break
            case "spawn":
                type = DungeonMapRoom.TYPE_SPAWN
                break
            case "puzzle":
                type = DungeonMapRoom.TYPE_PUZZLE
                break
            case "gold":
                type = DungeonMapRoom.TYPE_MINIBOSS
                break
            case "fairy":
                type = DungeonMapRoom.TYPE_FAIRY
                break
            case "blood":
                type = DungeonMapRoom.TYPE_BLOOD
                break
        }

        let shape = DungeonMapRoom.SHAPE_1X1
        switch (data.shape) {
            case "1x1":
                shape = DungeonMapRoom.SHAPE_1X1
                break
            case "1x2":
                shape = DungeonMapRoom.SHAPE_1X2
                break
            case "1x3":
                shape = DungeonMapRoom.SHAPE_1X3
                break
            case "1x4":
                shape = DungeonMapRoom.SHAPE_1X4
                break
            case "2x2":
                shape = DungeonMapRoom.SHAPE_2X2
                break
            case "L":
                shape = DungeonMapRoom.SHAPE_L
                break
        }
        return new DungeonMapRoom(type, shape, rotation, x, y, roomId)
    }

    /**
     * 
     * @param {Number} type 
     * @param {Number} shape 
     * @param {Number} rotation 0-3
     * @param {Number} x 
     * @param {Number} y 
     * @param {String} roomId 
     */
    constructor(type, shape, rotation, x, y, roomId) {
        this.type = type
        this.shape = shape
        this.rotation = rotation
        this.roomId = roomId

        this.location = [x, y]
    }

    setId(id) {
        this.roomId = id
    }

    /**
     * Renders this room onto the given Graphics2D
     * @param {Graphics2D} graphics 
     */
    draw(graphics, xOff, yOff) {

        graphics.setColor(this.getRoomRenderColor())

        switch (this.shape) {
            case DungeonMapRoom.SHAPE_1X1:
                graphics.fillRect(this.location[0] + xOff + 3, this.location[1] + yOff + 3, 26, 26)
                break;
            case DungeonMapRoom.SHAPE_1X2:
                graphics.fillRect(this.location[0] + xOff + 3, this.location[1] + yOff + 3, 26 + 32, 26)
                break;
            case DungeonMapRoom.SHAPE_1X3:
                graphics.fillRect(this.location[0] + xOff + 3, this.location[1] + yOff + 3, 26 + 64, 26)
                break;
            case DungeonMapRoom.SHAPE_1X4:
                graphics.fillRect(this.location[0] + xOff + 3, this.location[1] + yOff + 3, 26 + 96, 26)
                break;
        }

    }

    getRoomRenderColor() {
        return roomColorMap.get(this.type)
    }
}

let roomColorMap = new Map()
roomColorMap.set(DungeonMapRoom.TYPE_SPAWN, new Color(Renderer.color(0, 124, 0, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_NORMAL, new Color(Renderer.color(114, 67, 27, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_PUZZLE, new Color(Renderer.color(178, 76, 216, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_MINIBOSS, new Color(Renderer.color(229, 229, 51, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_FAIRY, new Color(Renderer.color(242, 127, 165, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_BLOOD, new Color(Renderer.color(255, 0, 0, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_UNKNOWN, new Color(Renderer.color(65, 65, 65, 255)))

export default DungeonMapRoom