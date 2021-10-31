/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import { newSideMessage, setLocation } from "../../../soopyApis";

class SpamHider extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.hideMessages = []
        this.hideMessagesRexex = []
        this.moveMessages = []
        this.moveMessagesRexex = []

        this.SpamHiderMessagesRenderer = new SpamHiderMessagesRenderer()

        this.loadSpamMessages()

        this.registerChat("${*}", this.onChat)

        this.registerEvent("renderOverlay", this.renderOverlay)
    }

    onChat(e){
        let msg = ChatLib.getChatMessage(e, true).replace(/§/g, "&").replace(/(?:^&r)|(?:&r$)/g, "")

        this.hideMessagesRexex.forEach(regex => {
            if(regex.test(msg)){
                cancel(e)
                return
            }
        })

        this.moveMessagesRexex.forEach(regex => {
            if(regex.test(msg)){
                this.SpamHiderMessagesRenderer.addMessage(msg)
                cancel(e)
                return
            }
        })
    }
    renderOverlay(){
        this.SpamHiderMessagesRenderer.render(100,100,1, 1)
    }

    loadSpamMessages(){
        let messages = JSON.parse(FileLib.getUrlContent("http://soopymc.my.to/api/soopyv2/spamHiderMessages.json"))
        this.hideMessages = messages.hideMessages
        this.moveMessages = messages.moveMessages

        this.hideMessagesRexex = []
        this.hideMessages.forEach(message=>{
            let regex = new RegExp(message.replace(/[\\^$*+?.()|[\]{}]/g, '\$&')
                        .replace(/\$\{\*\}/g, "(?:.+)"))
            this.hideMessagesRexex.push(regex)
        })

        this.moveMessagesRexex = []
        this.moveMessages.forEach(message=>{
            let regex = new RegExp(message.replace(/[\\^$*+?.()|[\]{}]/g, '\$&')
                        .replace(/\$\{\*\}/g, "(?:.+)"))
                        
            this.moveMessagesRexex.push(regex)
        })
    }

    initVariables(){
        this.hideMessages = undefined
        this.hideMessagesRexex = undefined
        this.moveMessages = undefined
        this.moveMessagesRexex = undefined
        this.SpamHiderMessagesRenderer = undefined
    }

    onDisable(){
        this.initVariables()
    }
}

class SpamHiderMessagesRenderer{
    constructor(){
        this.messages = []
        this.x = 0 //offset from corner, not absolute location
        this.y = 0 //offset from corner, not absolute location
        this.scale = 1
        this.corner = 2

        this.lastRender = 0
    }

    addMessage(str){
        this.messages.push([str, Date.now(), this.y])
    }

    render(){
        Renderer.drawString("", -100, -100)//Fixes skytils issue //idk if this is still needed, it was in old code and imma just leave it ig

        let now = Date.now()
        let animDiv = (now-this.lastRender) / 1000
        this.lastRender = now
        let swidth = Renderer.screen.getWidth()
        let sheight = Renderer.screen.getHeight()

        //loop over all messages backwards
        for(let i = this.messages.length - 1; i >= 0; i--){
            let message = this.messages[i]
            
            let [str, time, height] = message

            time = now-time

            let messageWidth = Renderer.getStringWidth(ChatLib.removeFormatting(str))

            let x = 0;
            let y = 0;
            if (this.corner === 0) { //top left
                x = 20
                this.messages[i][2] = height + (((this.messages.length-i) * -10) - height) * (animDiv * 5)
            }
            if (this.corner === 1) { //top right
                x = swidth - 20 - messageWidth
                this.messages[i][2] = height + (((this.messages.length-i) * -10) - height) * (animDiv * 5)
            }
            if (this.corner === 2) { //bottom right
                x = swidth - 20 - messageWidth
                this.messages[i][2] = height + (((this.messages.length-i) * 10) - height) * (animDiv * 5)
            }

            let animOnOff = 0
            if (time < 500) {
                animOnOff = 1 - (time / 500)
            }
            if (time > 3500) {
                animOnOff = ((time - 3500) / 500)
            }

            animOnOff *= 90
            animOnOff += 90

            animOnOff = animOnOff * Math.PI / 180;

            animOnOff = Math.sin(animOnOff)

            animOnOff *= -1
            animOnOff += 1

            if (this.corner === 0) { //top left
                x += ((animOnOff * -1) * (messageWidth + 30))
                y = 30 - (height)
            }
            if (this.corner === 1) { //top right
                x += (animOnOff * (messageWidth + 30))
                y = 30 - (height)
            }
            if (this.corner === 2) { //bottom right
                x += (animOnOff * (messageWidth + 30))
                y = sheight - 30 - (height)
            }

            Renderer.drawString(str, x + this.x, y + this.y);

            if (time > 4000) {
                this.messages.shift()
            }
        }
    }
}

module.exports = {
    class: new SpamHider()
}