import DungeonRoomStaticData from "./DungeonRoomStaticData"

const Color = Java.type("java.awt.Color")

class DungeonMapRoom {

    static TYPE_SPAWN = 0
    static TYPE_NORMAL = 1
    static TYPE_PUZZLE = 2
    static TYPE_MINIBOSS = 3
    static TYPE_FAIRY = 4
    static TYPE_BLOOD = 5
    static TYPE_TRAP = 7
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
            case "trap":
                type = DungeonMapRoom.TYPE_TRAP
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
        this.maxSecrets = roomId ? DungeonRoomStaticData.getDataFromId(roomId).secrets : 0
        this.secrets = 0

        this.checkedState = 0

        this.location = [x, y]
    }

    setSecrets(curr, max) {
        if (this.maxSecrets === 0) return
        this.maxSecrets = max
        this.secrets = curr
    }

    getSecrets() {
        let checkColor = "&8"
        if (this.checkedState === 1) checkColor = "&f"
        if (this.checkedState === 2) checkColor = "&a"
        return checkColor + this.secrets + "/" + this.maxSecrets
    }

    setId(id) {
        if (this.roomId !== id) {
            this.roomId = id

            let newRoomData = DungeonMapRoom.fromId(id)
            this.type = newRoomData.type
            this.shape = newRoomData.shape
            this.maxSecrets = newRoomData.maxSecrets
        }
    }

    setCheckedState(state) { }

    /**
     * Renders this room onto the given Graphics2D
     * @param {Graphics2D} graphics 
     */
    draw(graphics, renderTicks) {

        let [roomWidth, roomHeight] = this.getRoomWidthHeight()

        let translateX = this.location[0] + 3 + roomWidth / 2
        let translateY = this.location[1] + 3 + roomHeight / 2

        graphics.translate(translateX, translateY)

        graphics.setColor(this.getRoomRenderColor())

        switch (this.shape) {
            case DungeonMapRoom.SHAPE_1X1:
            case DungeonMapRoom.SHAPE_1X2:
            case DungeonMapRoom.SHAPE_1X3:
            case DungeonMapRoom.SHAPE_1X4:
            case DungeonMapRoom.SHAPE_2X2:
                graphics.fillRect(-roomWidth / 2 + 3, -roomHeight / 2 + 3, roomWidth - 6, roomHeight - 6)
                break;
            case DungeonMapRoom.SHAPE_L:
                graphics.rotate(this.rotation * Math.PI / 2)
                graphics.fillRect(-(26 + 32) / 2, -(26 + 32) / 2, 26, 26 + 32)
                graphics.fillRect(-(26 + 32) / 2, -(26 + 32) / 2, 26 + 32, 26)
                graphics.rotate(-this.rotation * Math.PI / 2)
                break;
        }

        graphics.translate(-translateX, -translateY)

        if (renderTicks || this.maxSecrets === 0) {
            if (this.checkedState === 1) {
                let loc = this.getIconLocation()
                graphics.drawImage(whiteCheck, loc[0] - 2, loc[1] - 2, 10, 10, null)
            }
            if (this.checkedState === 2) {
                let loc = this.getIconLocation()
                graphics.drawImage(greenCheck, loc[0] - 2, loc[1] - 2, 10, 10, null)
            }
        }
    }

    getRoomWidthHeight() {
        let roomWidth = 32
        let roomHeight = 32

        switch (this.shape) {
            case DungeonMapRoom.SHAPE_1X2:
                roomWidth = 64
                break;
            case DungeonMapRoom.SHAPE_1X3:
                roomWidth = 96
                break;
            case DungeonMapRoom.SHAPE_1X4:
                roomWidth = 128
                break;
            case DungeonMapRoom.SHAPE_2X2:
            case DungeonMapRoom.SHAPE_L:
                roomWidth = 64
                roomHeight = 64
                break;
        }

        if (this.rotation === 1 || this.rotation === 3) {
            let tmp = roomWidth
            roomWidth = roomHeight
            roomHeight = tmp
        }

        return [roomWidth, roomHeight]
    }

    getRoomRenderColor() {
        return roomColorMap.get(this.type)
    }

    getIconLocation() {
        let [width, height] = this.getRoomWidthHeight()
        if (this.shape === DungeonMapRoom.SHAPE_L && this.rotation === 0) {
            return [this.location[0] + 16, this.location[1] + 16]
        }
        if (this.shape === DungeonMapRoom.SHAPE_L && this.rotation === 1) {
            return [this.location[0] + 16 + 32, this.location[1] + 16]
        }
        if (this.shape === DungeonMapRoom.SHAPE_L && this.rotation === 2) {
            return [this.location[0] + 16 + 31, this.location[1] + 16 + 31]
        }
        if (this.shape === DungeonMapRoom.SHAPE_L && this.rotation === 2) {
            return [this.location[0] + 16, this.location[1] + 16 + 32]
        }

        return [this.location[0] + width / 2, this.location[1] + height / 2]
    }

    static drawUnknownRoom(graphics, x, y) {
        let roomWidth = 32
        let roomHeight = 32

        let translateX = x + 3 + roomWidth / 2
        let translateY = y + 3 + roomHeight / 2

        graphics.translate(translateX, translateY)

        graphics.setColor(roomColorMap.get(DungeonMapRoom.TYPE_UNKNOWN))

        graphics.fillRect(-13, -13, 26, 26)

        graphics.drawImage(questionMark, -4, -7, 8, 14, null)

        graphics.translate(-translateX, -translateY)
    }
}

let roomColorMap = new Map()
roomColorMap.set(DungeonMapRoom.TYPE_SPAWN, new Color(Renderer.color(0, 124, 0, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_NORMAL, new Color(Renderer.color(114, 67, 27, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_PUZZLE, new Color(Renderer.color(178, 76, 216, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_MINIBOSS, new Color(Renderer.color(229, 229, 51, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_FAIRY, new Color(Renderer.color(242, 127, 165, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_BLOOD, new Color(Renderer.color(255, 0, 0, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_TRAP, new Color(Renderer.color(216, 127, 51, 255)))
roomColorMap.set(DungeonMapRoom.TYPE_UNKNOWN, new Color(Renderer.color(65, 65, 65, 255)))

const greenCheck = new Image("greenCheckVanilla.png", "https://i.imgur.com/h2WM1LO.png").image
const whiteCheck = new Image("whiteCheckVanilla.png", "https://i.imgur.com/hwEAcnI.png").image
const failedRoom = new Image("failedRoomVanilla.png", "https://i.imgur.com/WqW69z3.png").image
const questionMark = new Image("questionMarkVanilla.png", "https://i.imgur.com/1jyxH9I.png").image

export default DungeonMapRoom