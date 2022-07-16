import { m } from "../../../mappings/mappings"
import DungeonMapRoom from "./DungeonMapRoom"

const BufferedImage = Java.type("java.awt.image.BufferedImage")

class DungeonMapData {
    constructor(floor) {
        this.floor = floor

        this.greenRoom = undefined
        /**
         * @type {Map<String,DungeonMapRoom>}
         */
        this.rooms = new Map()

        this.image = undefined
    }

    setRoom(x, y, rotation, id) {
        let locstr = x + "," + y

        if (this.rooms.get(locstr) && this.rooms.get(locstr).roomId !== id) {
            this.rooms.get(locstr).setId(id)
            this.mapChanged()
            return
        }

        let room = DungeonMapRoom.fromId(id, x, y, rotation)

        if (room.type === DungeonMapRoom.TYPE_SPAWN) {
            this.greenRoom = locstr
        }
        console.log(room.type)

        this.rooms.set(locstr, room)

        this.mapChanged()
    }

    mapChanged() {
        if (this.image) {
            this.image.getTexture()[m.deleteGlTexture]()
            this.image = undefined
        }
    }

    /**
     * @returns {Image}
     */
    getImage() {
        if (!this.image) {
            this.image = new Image(this.render())
        }
        return this.image
    }

    /**
     * @returns {BufferedImage}
     */
    render() {
        //create 256x256 image
        let image = new BufferedImage(256, 256, BufferedImage.TYPE_INT_ARGB)

        //if green room data not found yet then map should be empty
        if (!this.greenRoom) return image

        //create graphics rendering context
        let graphics = image.createGraphics()

        //render rooms
        for (let data of this.rooms.entries()) {
            let room = data[1]
            room.draw(graphics, 256, 256)
        }

        return image
    }
}

export default DungeonMapData