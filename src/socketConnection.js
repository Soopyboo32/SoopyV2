import WebsiteCommunicator from "./../soopyApis/websiteCommunicator"
import socketData from "../soopyApis/socketData"
import logger from "./logger"
import metadata from "./metadata"

class SoopyV2Server extends WebsiteCommunicator {
    constructor() {
        super(socketData.serverNameToId.soopyv2)

        // this.spammedMessages = []

        this.errorsToReport = []

        this.lbdatathing = undefined
        this.lbdatathingupdated = 0

        this.reportErrorsSetting = undefined

        this.onPlayerStatsLoaded = undefined
        this.apithingo = undefined

        this.userCosmeticPermissions = undefined

        this.eventData = undefined

        this.itemPricesCache = new Map()
        this.itemPricesCache2 = new Map()

        this.cookieCount = 0
        this.cookieData = undefined
        this.cookieDataUpdated = 0

        this.chEvent = ["???", "???"]

        register("step", () => {
            if (this.cookieDataUpdated && Date.now() - this.cookieDataUpdated > 60000) {
                this.cookieData = 0
                this.cookieDataUpdated = 0
            }
        }).setDelay(60)

        register("worldLoad", () => {
            this.itemPricesCache2.clear()
            for (let val of this.itemPricesCache.values()) {
                this.itemPricesCache2.set(val[0], val[1])
            }
            this.itemPricesCache.clear()
        })
    }

    sendSbLvlData(data) {
        this.sendData({
            type: "sbLvl",
            data
        })
    }

    requestItemPrice(json, uuid) {
        this.sendData({
            type: "loadItemWorth",
            id: uuid,
            itemData: json
        })
    }

    joinApiQ() {
        this.sendData({
            type: "apiready"
        })
    }

    respondQueue(id, data) {
        this.sendData({
            type: "api",
            id,
            data
        })
    }

    onData(data) {
        if (data.type === "updateCosmeticPermissions") {
            this.userCosmeticPermissions = data.permissions
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.cosmetics) global.soopyv2featuremanagerthing.features.cosmetics.class.updateUserCosmeticPermissionSettings()
        }
        if (data.type === "updateCosmetics") {
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.cosmetics) global.soopyv2featuremanagerthing.features.cosmetics.class.setUserCosmeticsInformation(data.uuid, data.cosmetics)
        }
        // if(data.type === "spammedmessage"){
        //     this.spammedMessages.push(...data.messages)
        // }
        if (data.type === "playerStatsQuick") {
            if (this.onPlayerStatsLoaded) this.onPlayerStatsLoaded(data.data)
        }
        if (data.type === "updateLbDataThing") {
            this.lbdatathing = data.data
            this.lbdatathingupdated = data.lastUpdated
        }
        if (data.type === "dungeonMapData") {
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.dungeonMap) global.soopyv2featuremanagerthing.features.dungeonMap.class.updateDungeonMapData(data.data)
        }
        if (data.type === "dungeonMapData2") {
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.dungeonMap) global.soopyv2featuremanagerthing.features.dungeonMap.class.updateDungeonMapData2(data.data)
        }
        if (data.type === "slayerSpawnData") {
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.slayers) global.soopyv2featuremanagerthing.features.slayers.class.slayerLocationData(data.location, data.user)
        }
        if (data.type === "inquisData") {
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.events) global.soopyv2featuremanagerthing.features.events.class.inquisData(data.location, data.user)
        }
        if (data.type === "vancData") {
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.nether) global.soopyv2featuremanagerthing.features.nether.class.vanqData(data.location, data.user)
        }
        if (data.type === "cookies") {
            this.cookieCount = data.cookies
        }
        if (data.type === "cookieLbData") {
            this.cookieData = {
                cookieLeaderboard: data.cookieLeaderboard,
                clickingNow: data.clickingNow
            }

            this.cookieDataUpdated = Date.now()
        }
        if (data.type === "joinEventResult") {
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.eventsGUI) global.soopyv2featuremanagerthing.features.eventsGUI.class.joinEventResult(data.response)
        }
        if (data.type === "eventData") {
            this.eventData = data
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.eventsGUI) global.soopyv2featuremanagerthing.features.eventsGUI.class.eventsDataUpdated(data)
        }
        if (data.type === "pollEvent") {
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.eventsGUI) global.soopyv2featuremanagerthing.features.eventsGUI.class.pollEventData(data.admin)
        }
        if (data.type === "chEvent") {
            this.chEvent = data.event
        }
        if (data.type === "api") {
            if (this.apithingo) this.apithingo(data.uuid, data.packetId)
        }
        if (data.type === "itemWorth") {
            this.itemPricesCache.set(data.id, data.price)
        }
    }

    onConnect() {
        if (this.reportErrorsSetting && !this.reportErrorsSetting.getValue()) return

        this.errorsToReport.forEach(data => {
            this.sendData({
                type: "error",
                data: data
            })
        })
        this.errorsToReport = []
    }

    updateCosmeticsData(data) {
        this.sendData({
            type: "cosmeticSettings",
            data: data
        })
    }

    // sendMessageToServer(message, lobbyId){
    //     this.sendData({
    //         type: "chatMessage",
    //         message: message,
    //         lobbyId: lobbyId
    //     })
    // }

    reportError(error, description) {
        // ChatLib.chat(JSON.stringify(error))
        return
        if (this.reportErrorsSetting && !this.reportErrorsSetting.getValue()) return
        let data = {
            lineNumber: error.lineNumber,
            fileName: error.fileName.replace(/file:.+?ChatTriggers/g, "file:"), //The replace is to not leak irl names thru windows acct name
            message: error.message,
            description: description,
            stack: error.stack.replace(/file:.+?ChatTriggers/g, "file:"),
            modVersion: metadata.version,
            modVersionId: metadata.versionId,
        }

        if (this.connected && this.reportErrorsSetting) {
            this.sendData({
                type: "error",
                data: data
            })
        } else {
            this.errorsToReport.push(data)
        }
    }

    requestPlayerStats(uuid, username) {
        this.sendData({
            type: "loadStatsQuick",
            uuid: uuid,
            username: username
        })
    }

    requestPlayerStatsCache(uuid, username) {
        this.sendData({
            type: "loadStatsQuickCache",
            uuid: uuid,
            username: username
        })
    }

    sendDungeonData(names, data) {
        this.sendData({
            type: "dungeonMapData",
            names: names,
            data: data
        })
    }

    sendDungeonData2(names, data) {
        this.sendData({
            type: "dungeonMapData2",
            names: names,
            data: data
        })
    }

    sendSlayerSpawnData(data) {
        this.sendData({
            type: "slayerSpawnData",
            data: data,
            name: ChatLib.removeFormatting(Player.getDisplayName().text)
        })
    }
    sendInquisData(data) {
        this.sendData({
            type: "inquisData",
            data: data,
            name: ChatLib.removeFormatting(Player.getDisplayName().text)
        })
    }

    sendVancData(data) {
        this.sendData({
            type: "vancData",
            data: data,
            name: ChatLib.removeFormatting(Player.getDisplayName().text)
        })
    }

    setServer(server, area, areaFine) {
        this.sendData({
            type: "server",
            server,
            area,
            areaFine
        })
    }

    cookiesGained(amount) {
        this.cookieCount += amount

        this.sendData({
            type: "cookies",
            amount: amount
        })
    }

    joinEvent(code) {
        this.sendData({
            type: "joinEvent",
            code
        })
    }

    pollEventData() {
        this.sendData({
            type: "eventData"
        })
    }

    pollEventCode(code) {
        this.sendData({
            type: "pollEvent",
            code
        })
    }

    sendCHEventData(event, started) {
        this.sendData({
            type: "chEvent2",
            event,
            started
        })
    }
}

if (!global.soopyV2Server) {
    global.soopyV2Server = new SoopyV2Server()

    register("gameUnload", () => {
        global.soopyV2Server = undefined
    })
}

export default global.soopyV2Server