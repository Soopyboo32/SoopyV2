/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import SettingBase from "../settings/settingThings/settingBase";
import ToggleSetting from "../settings/settingThings/toggle";

class FragBot extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.hostingFragBot = false
        this.fragBotQueue = []
        this.commandQueue = []

        new SettingBase("To host a fragbot use /fragbot", "", undefined, "host_fragbot_info", this)

        this.uploadToWebsite = new ToggleSetting("Advertise fragbot status", "Will show up as a fragbot in other peoples fragbot lists", true, "advertise_fragbot", this)

        this.registerCommand("fragbot", this.fragbotCommand)

        this.registerStep(false, 5, this.step)
        this.registerStep(true, 2, this.step2)

        this.registerChat("&9&m-----------------------------&r&9\n&r${player} &r&ehas invited you to join their party!\n&r&eYou have &r&c60 &r&eseconds to accept. &r&6Click here to join!&r&9\n&r&9&m-----------------------------&r", this.recievedPartyInvite)
    }

    step(){
        if(!this.hostingFragBot) return

        if(this.fragBotQueue.length > 0){
            let player = this.fragBotQueue.shift()
            if(player){
                this.commandQueue.push("/party leave")

                this.commandQueue.push("/party accept " + player)
            }
        }
    }
    step2(){
        if(!this.hostingFragBot) return

        if(this.commandQueue.length > 0){
            let command = this.commandQueue.shift()
            if(command){
                ChatLib.say(command)
            }
        }
    }
    recievedPartyInvite(player){
        if(!this.hostingFragBot) return
        
        player = ChatLib.removeFormatting(player).split(" ").pop()

        this.fragBotQueue.push(player)
    }

    fragbotCommand(...args){
        if(this.hostingFragBot){
            this.hostingFragBot = false
            ChatLib.chat(this.FeatureManager.messagePrefix + "Fragbot has been disabled")
        }else{
            this.hostingFragBot = true
            ChatLib.chat(this.FeatureManager.messagePrefix + "Now acting as a fragbot, run /fragbot again to disable")
        }
    }

    initVariables(){
        this.hostingFragBot = undefined
        this.fragBotQueue = undefined
        this.commandQueue = undefined
    }

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new FragBot()
}