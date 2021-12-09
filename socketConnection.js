import WebsiteCommunicator from "./../soopyApis/websiteCommunicator"
import socketData from "../soopyApis/socketData"
import logger from "./logger"
import metadata from "./metadata"
const Cosmetics = require("./features/cosmetics/index.js")

class SoopyV2Server extends WebsiteCommunicator {
    constructor(){
        super(socketData.serverNameToId.soopyv2)

        this.spammedMessages = []

        this.errorsToReport = []

        this.reportErrorsSetting = undefined

        this.onPlayerStatsLoaded = undefined
    }

    onData(data){
        if(data.type === "updateCosmetics"){
            Cosmetics.class.setUserCosmeticsInformation.call(Cosmetics.class, data.uuid, data.cosmetics)
        }
        if(data.type === "spammedmessage"){
            this.spammedMessages.push(...data.messages)
        }
        if(data.type === "playerStatsQuick"){
            if(this.onPlayerStatsLoaded) this.onPlayerStatsLoaded(data.data)
        }
    }

    onConnect(){
        if(this.reportErrorsSetting && !this.reportErrorsSetting.getValue()) return
        new Thread(() => {
            while(!this.reportErrorsSetting){
                Thread.sleep(1000)
            }

            if(!this.reportErrorsSetting.getValue()) return
            
            this.errorsToReport.forEach(data => {
                this.sendData({
                    type: "error",
                    data: data
                })
            })
            this.errorsToReport = []
        }).start()
    }

    sendMessageToServer(message, lobbyId){
        this.sendData({
            type: "chatMessage",
            message: message,
            lobbyId: lobbyId
        })
    }

    reportError(error, description){
        // ChatLib.chat(JSON.stringify(error))
        if(this.reportErrorsSetting && !this.reportErrorsSetting.getValue()) return
        let data = {
            lineNumber: error.lineNumber,
            fileName: error.fileName.replace(/file:.+?ChatTriggers/g, "file:"), //The replace is to not leak irl names thru windows acct name
            message: error.message,
            description: description,
            stack: error.stack.replace(/file:.+?ChatTriggers/g, "file:"),
            modVersion: metadata.version,
            modVersionId: metadata.versionId,
        }

        if(this.connected && this.reportErrorsSetting){
            this.sendData({
                type: "error",
                data: data
            })
        }else{
            this.errorsToReport.push(data)
        }
    }

    requestPlayerStats(uuid){
        this.sendData({
            type: "loadStatsQuick",
            uuid: uuid
        })
    }
}

if(!global.soopyV2Server){
    global.soopyV2Server = new SoopyV2Server()
    
    register("gameUnload", ()=>{
        global.soopyV2Server = undefined
    })
}

export default global.soopyV2Server