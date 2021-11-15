import WebsiteCommunicator from "./../soopyApis/websiteCommunicator"
import socketData from "../soopyApis/socketData"
const Cosmetics = require("./features/cosmetics/index.js")

class SoopyV2Server extends WebsiteCommunicator {
    constructor(){
        super(socketData.serverNameToId.soopyv2)

        this.spammedMessages = []
    }

    onData(data){
        if(data.type === "updateCosmetics"){
            Cosmetics.class.setUserCosmeticsInformation.call(Cosmetics.class, data.uuid, data.cosmetics)
        }
        if(data.type === "spammedmessage"){
            this.spammedMessages.push(...data.messages)
        }
    }

    sendMessageToServer(message, lobbyId){
        this.sendData(this.sendData({
            type: "chatMessage",
            message: message,
            lobbyId: lobbyId
        }))
    }
}

let soopyV2Server = new SoopyV2Server()

export default soopyV2Server