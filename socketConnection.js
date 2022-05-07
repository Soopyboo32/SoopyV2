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

        this.userCosmeticPermissions = undefined
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
        if (data.type === "slayerSpawnData") {
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.slayers) global.soopyv2featuremanagerthing.features.slayers.class.slayerLocationData(data.location, data.user)
        }
        if (data.type === "inquisData") {
            if (global.soopyv2featuremanagerthing && global.soopyv2featuremanagerthing.features.events) global.soopyv2featuremanagerthing.features.events.class.inquisData(data.location, data.user)
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

    sendSlayerSpawnData(data) {
        this.sendData({
            type: "slayerSpawnData",
            data: data
        })
    }
    sendInquisData(data) {
        this.sendData({
            type: "inquisData",
            data: data
        })
    }

    sendVancData(data) {
        this.sendData({
            type: "vancData",
            data: data
        })
    }

    setServer(server) {
        this.sendData({
            type: "server",
            server: server
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