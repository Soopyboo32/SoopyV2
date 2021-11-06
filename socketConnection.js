import WebsiteCommunicator from "./../soopyApis/websiteCommunicator"
import socketData from "../soopyApis/socketData"

class SoopyV2Server extends WebsiteCommunicator {
    constructor(){
        super(socketData.serverNameToId.soopyv2)
    }
}

let soopyV2Server = new SoopyV2Server()

export default soopyV2Server