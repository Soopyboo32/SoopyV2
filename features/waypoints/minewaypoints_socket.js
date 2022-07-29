import socketData from "../../../soopyApis/socketData";
import WebsiteCommunicator from "../../../soopyApis/websiteCommunicator";

class MineWayPointsServer extends WebsiteCommunicator {
    constructor() {
        super(socketData.serverNameToId.minewaypoints);

        this.setLocationHandler = undefined
        this.hypixelServer = undefined
        this.lastSend = Date.now()
    }

    onConnect() {
        this.hypixelServer = undefined
    }

    onData(data) {
        switch (data.type) {
            case "setLocation":
                if (this.setLocationHandler) {
                    this.setLocationHandler(data.area, data.location);
                }
                break;
        }
    }

    setLocation(area, loc) {
        this.sendData({
            type: "setLocation",
            area: area,
            location: loc
        });
    }

    setServer(server, worldTime) {
        if (this.hypixelServer === server && Date.now() - this.lastSend < 10000) return;

        this.lastSend = Date.now()
        this.hypixelServer = server
        this.sendData({
            type: "setServer",
            server: server,
            time: worldTime
        });
    }
}

global.soopyV2mineWayPointsServer = new MineWayPointsServer()
export default global.soopyV2mineWayPointsServer;