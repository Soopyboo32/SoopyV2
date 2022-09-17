class DungeonRoomStaticData {
    constructor() {
        this.fullRoomData = JSON.parse(FileLib.read("SoopyV2", "data/roomdata.json"))

        this.idMap = new Map()
        this.fullRoomData.forEach((d, i) => {
            d.id.forEach(id => {
                this.idMap.set(id, i)
            })
            this.idMap.set(d.index, i)
        })
    }

    getDataFromId(id) {
        return this.fullRoomData[this.idMap.get(id)]
    }
}

export default new DungeonRoomStaticData()