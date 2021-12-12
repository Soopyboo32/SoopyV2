/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import ToggleSetting from "../settings/settingThings/toggle";
import SoopyV2Server from "../../socketConnection"
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import { numberWithCommas, timeNumber2, timeSince } from "../../utils/numberUtils";

class LockedFeatures extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.guildEventLbPossible = new FakeRequireToggle(false)
        this.guildEventLb = new ToggleSetting("Guild event leaderboard", "A gui element for guild leaderboard progress", true, "guild_event_lb", this).requires(this.guildEventLbPossible)
        
        this.hudElements = []
        this.guildLbElement = new HudTextElement()
            .setToggleSetting(this.guildEventLb)
            .setLocationSetting(new LocationSetting("Guild Lb Location", "Allows you to edit the location of the guild leaderboard", "guild_lb_location", this, [50, 40, 1, 1])
                .requires(this.guildEventLb))
        this.hudElements.push(this.guildLbElement)

        this.registerStep(true, 1, this.step)
        this.registerEvent("renderOverlay", this.renderOverlay)
    }

    step(){
        if(!SoopyV2Server.lbdatathing){
            this.guildEventLbPossible.set(false)
            return;
        }
        
        this.guildEventLbPossible.set(true)

        if(!this.guildEventLb.getValue()) return

        let text = ""

        let playerPos = 0

        SoopyV2Server.lbdatathing.forEach((u, i)=>{
            if(u.uuid === Player.getUUID().toString().replace(/-/g, "")) playerPos = i
        })

        let prevProgress
        let playerProgress
        let nextProgress

        SoopyV2Server.lbdatathing.forEach((u, i)=>{
            if(i === playerPos-1) nextProgress = [parseFloat(u.startingAmount), u.progress]
            if(i === playerPos) playerProgress = [parseFloat(u.startingAmount), u.progress]
            if(i === playerPos+1) prevProgress = [parseFloat(u.startingAmount), u.progress]
            if(i === playerPos-1 || i === playerPos || i === playerPos+1){
                text += "§6#" + (i+1)
                text += "§7 - "
                text += "§e"+u.username
                text += "&7: §r"+numberWithCommas(Math.round(parseFloat(u.startingAmount)))
                if(u.progress) text += " §7("+ (u.progress>0?"+":"-")+Math.abs(Math.round(u.progress)) + "/h)"
                text += "\n"
            }
        })

        text += "&dLast updated " + timeSince(SoopyV2Server.lbdatathingupdated) + " ago"

        let timeTillIncrease = Infinity
        let timeTillDecrease = Infinity
        if(nextProgress[1]-playerProgress[1] < 0){
            timeTillIncrease = ((nextProgress[0]-playerProgress[0])/(playerProgress[1]-nextProgress[1])*60*60*1000)
        }
        if(prevProgress[1]-playerProgress[1] < 0){
            timeTillDecrease = ((playerProgress[0]-prevProgress[0])/(prevProgress[1]-playerProgress[1])*60*60*1000)
        }

        if((timeTillIncrease < timeTillDecrease || (timeTillIncrease > 0)) && timeTillDecrease < 0 && timeTillIncrease < 10000000000){
            text = "&d  ^ in " + timeNumber2(timeTillIncrease) + "\n"+text
        }
        if((timeTillIncrease > timeTillDecrease || (timeTillDecrease>0))&&timeTillIncrease<0 && timeTillDecrease < 10000000000){
            text = "&d  V in " + timeNumber2(timeTillDecrease) + "\n"+text
        }

        this.guildLbElement.setText(text)
    }

    renderOverlay(){
        this.hudElements.forEach(a=>a.render())
    }

    initVariables(){

    }

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new LockedFeatures()
}

class FakeRequireToggle{
    constructor(val){
        this.val = val

        this.thisToggleEvents = []

        this.toggleObject = {
            addEvent: (event)=>{
                this.thisToggleEvents.push(event)
            }
        }
    }

    set(newVal){
        if(this.val === newVal) return
        this.val = newVal

        this.thisToggleEvents.forEach(e=>e._trigger(this, [this.val]))
    }

    getValue(){
        return this.val
    }
}