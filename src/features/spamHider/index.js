/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent";
import Feature from "../../featureClass/class";
import soopyV2Server from "../../socketConnection";
import ToggleSetting from "../settings/settingThings/toggle";

class SpamHider extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        this.hideMessages = []
        this.hideMessagesRexex = []
        this.moveMessages = []
        this.moveMessagesRexex = []

        this.moveMessagesDict = {
            all: []
        }
        this.hideMessagesDict = {
            all: []
        }

        this.hideMessagesSetting = new ToggleSetting("Hide some messages", "This will completely remove some spammy messages from chat", true, "completely_hide_spam", this)
        this.moveMessagesSetting = new ToggleSetting("Move some messages to spam hider", "This will move some (potentially) usefull messages into a 'second chat'", true, "move_spam", this)
        this.moveChatMessages = new ToggleSetting("Move spammed chat messages to spam hider", "This will move messages spammed in hubs to spam hider\n(eg the website advertisment bots)", true, "move_spam_chat", this)
        this.textShadowSetting = new ToggleSetting("Spam Hider Text Shadow", "Whether to give the spam hider text shadow", true, "spam_text_shadow", this)
        this.showFriendMessages = new ToggleSetting("Show friend message", "should it show friend join/leave message", false, "spam_text_friend", this)
        this.showGuildMessages = new ToggleSetting("Show guild message", "should it show guild mate join/leave message", false, "spam_text_guild", this)
        this.showPetLevelUpMessage = new ToggleSetting("Show pet level message", "should it show pet level up message", false, "spam_text_pet_level", this)
        this.removeBlocksInTheWay = new ToggleSetting("Remove limited tp msg", "completely erases 'There are blocks in the way!' message from gui", false, "limited_tp_msg", this)
        this.showAutoPetRule = new ToggleSetting("Show autopet rule", "Should it show autopet rule messages", false, "autopet_msg", this)

        this.SpamHiderMessagesRenderer = new SpamHiderMessagesRenderer()
        this.textShadowSetting.toggleObject.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun) => {
            this.SpamHiderMessagesRenderer.textShadow = this.textShadowSetting.getValue()
        }))

        this.loadSpamMessages()

        this.registerChat("${*}", this.onChat)

        this.registerEvent("renderOverlay", this.renderOverlay).registeredWhen(() => this.moveMessagesSetting.getValue())

        // this.registerChat("&r${userandrank}&r&f: ${message}&r", this.chatPlayerMessage)
    }

    // chatPlayerMessage(userandrank, message, e){
    //     if(!this.FeatureManager.features["generalSettings"]) return
    //     if(userandrank.includes(">")) return
    //     if(message.length < 10) return //Short messages like 'LOL' are bound to get repeated

    //     let msg = sha256(message + "This is a salt PogU")

    //     if(soopyV2Server.spammedMessages.includes(msg)){
    //         if(this.moveChatMessages.getValue()){
    //             this.SpamHiderMessagesRenderer.addMessage(ChatLib.getChatMessage(e, true))
    //             cancel(e)
    //         }
    //         return
    //     }

    //     if(this.FeatureManager.features["generalSettings"].class.sendChatSetting && this.FeatureManager.features["generalSettings"].class.sendChatSetting.getValue()){
    //         soopyV2Server.sendMessageToServer(msg, sha256(this.FeatureManager.features["dataLoader"].class.stats["Server"] + "This is a salt PogU"))
    //     }
    // }

    onChat(e) {
        let msg = ChatLib.getChatMessage(e, true).replace(/§/g, "&").replace(/(?:^&r)|(?:&r$)/g, "")
        if (msg.length > 1000) return //performance

        //&r&aFriend > &r&6Soopyboo32 &r&ejoined.&r
        if (this.showFriendMessages.getValue() && msg.includes("&aFriend")) return

        //&r&2Guild > &r&6Soopyboo32 &r&ejoined.&r
        if (this.showGuildMessages.getValue() && msg.includes("&2Guild")) return

        //&r&aYour &r&6Golden Dragon &r&alevelled up to level &r&9200&r&a!&r
        if (this.showPetLevelUpMessage.getValue() && msg.includes("&alevelled up")) return

        //&r&cThere are blocks in the way!&r
        //completely erases this
        if (this.removeBlocksInTheWay.getValue() && msg.includes("There are blocks in the way!")) {
            cancel(e)
            return
        }

        //&cAutopet &eequipped your &7[Lvl 200] &6Golden Dragon&e! &a&lVIEW RULE&r
        if (this.showAutoPetRule.getValue() && msg.includes("&cAutopet")) return

        if (this.hideMessagesSetting.getValue()) {
            // console.log("testing " + (this.hideMessagesDict[msg.substring(0,5)]?.length || 0) + this.hideMessagesDict.all.length + " hide messages")
            this.hideMessagesDict[msg.substring(0, 5)]?.forEach(regex => {
                if (regex.test(msg)) {
                    cancel(e)
                    return
                }
            })
            this.hideMessagesDict.all.forEach(regex => {
                if (regex.test(msg)) {
                    cancel(e)
                    return
                }
            })
        }

        if (this.moveMessagesSetting.getValue()) {
            // console.log("testing " + (this.moveMessagesDict[msg.substring(0,5)]?.length || 0) + this.moveMessagesDict.all.length + " spam messages")
            this.moveMessagesDict[msg.substring(0, 5)]?.forEach(regex => {
                if (regex.test(msg)) {
                    this.SpamHiderMessagesRenderer.addMessage(msg)
                    cancel(e)
                    return
                }
            })
            this.moveMessagesDict.all.forEach(regex => {
                if (regex.test(msg)) {
                    this.SpamHiderMessagesRenderer.addMessage(msg)
                    cancel(e)
                    return
                }
            })
        }
    }
    renderOverlay() { //TODO: move this to java?
        this.SpamHiderMessagesRenderer.render(100, 100, 1, 1)
    }

    async loadSpamMessages() {
        let messages = await fetch("https://soopy.dev/api/soopyv2/spamHiderMessages.json").json()
        this.hideMessages = messages.hideMessages
        this.moveMessages = messages.moveMessages

        this.hideMessagesDict = {
            all: []
        }

        this.hideMessagesRexex = []
        this.hideMessages.forEach(message => {
            let regex = new RegExp(message.replace(/[\\^$*+?.()|[\]{}]/g, '$&')
                .replace(/\$\{\*\}/g, "(?:.+)"))
            if (!message.substring(0, 5).includes("$")) {
                if (!this.hideMessagesDict[message.substring(0, 5)]) this.hideMessagesDict[message.substring(0, 5)] = []
                this.hideMessagesDict[message.substring(0, 5)].push(regex)
            } else {
                this.hideMessagesDict.all.push(regex)
            }
            this.hideMessagesRexex.push(regex)
        })

        this.moveMessagesDict = {
            all: []
        }

        this.moveMessagesRexex = []
        this.moveMessages.forEach(message => {
            let regex = new RegExp(message.replace(/[\\^$*+?.()|[\]{}]/g, '$&')
                .replace(/\$\{\*\}/g, "(?:.+)"))

            if (!message.substring(0, 5).includes("$")) {
                if (!this.moveMessagesDict[message.substring(0, 5)]) this.moveMessagesDict[message.substring(0, 5)] = []
                this.moveMessagesDict[message.substring(0, 5)].push(regex)
            } else {
                this.moveMessagesDict.all.push(regex)
            }
            this.moveMessagesRexex.push(regex)
        })
    }

    initVariables() {
        this.hideMessages = undefined
        this.hideMessagesRexex = undefined
        this.moveMessages = undefined
        this.moveMessagesRexex = undefined
        this.SpamHiderMessagesRenderer = undefined
    }

    onDisable() {
        this.initVariables()
    }
}

class SpamHiderMessagesRenderer {
    constructor() {
        this.messages = []
        this.x = 0 //offset from corner, not absolute location
        this.y = 0 //offset from corner, not absolute location
        this.scale = 1
        this.corner = 2

        this.lastRender = 0

        this.textShadow = true
    }

    addMessage(str) {
        this.messages.push([str, Date.now(), this.y])
    }

    render() {
        Renderer.drawString("", -100, -100)//Fixes skytils issue //idk if this is still needed, it was in old code and imma just leave it ig

        let now = Date.now()
        let animDiv = (now - this.lastRender) / 1000
        this.lastRender = now
        let swidth = Renderer.screen.getWidth()
        let sheight = Renderer.screen.getHeight()

        //loop over all messages backwards
        for (let i = this.messages.length - 1; i >= 0; i--) {
            let message = this.messages[i]

            let [str, time, height] = message

            time = now - time

            let messageWidth = Renderer.getStringWidth(ChatLib.removeFormatting(str))

            let x = 0;
            let y = 0;
            if (this.corner === 0) { //top left
                x = 20
                this.messages[i][2] = height + (((this.messages.length - i) * -10) - height) * (animDiv * 5)
            }
            if (this.corner === 1) { //top right
                x = swidth - 20 - messageWidth
                this.messages[i][2] = height + (((this.messages.length - i) * -10) - height) * (animDiv * 5)
            }
            if (this.corner === 2) { //bottom right
                x = swidth - 20 - messageWidth
                this.messages[i][2] = height + (((this.messages.length - i) * 10) - height) * (animDiv * 5)
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

            if (this.textShadow) {
                Renderer.drawStringWithShadow(str, x + this.x, y + this.y);
            } else {
                Renderer.drawString(str, x + this.x, y + this.y);
            }

            if (time > 4000) {
                this.messages.shift()
            }
        }
    }
}

module.exports = {
    class: new SpamHider()
}

var sha256 = function a(b) {
    function c(a, b) {
        return (a >>> b) | (a << (32 - b));
    }
    for (
        var d,
        e,
        f = Math.pow,
        g = f(2, 32),
        h = "length",
        i = "",
        j = [],
        k = 8 * b[h],
        l = (a.h = a.h || []),
        m = (a.k = a.k || []),
        n = m[h],
        o = {},
        p = 2;
        64 > n;
        p++
    )
        if (!o[p]) {
            for (d = 0; 313 > d; d += p) o[d] = p;
            (l[n] = (f(p, 0.5) * g) | 0), (m[n++] = (f(p, 1 / 3) * g) | 0);
        }
    for (b += "\x80"; (b[h] % 64) - 56;) b += "\x00";
    for (d = 0; d < b[h]; d++) {
        if (((e = b.charCodeAt(d)), e >> 8)) return;
        j[d >> 2] |= e << (((3 - d) % 4) * 8);
    }
    for (j[j[h]] = (k / g) | 0, j[j[h]] = k, e = 0; e < j[h];) {
        var q = j.slice(e, (e += 16)),
            r = l;
        for (l = l.slice(0, 8), d = 0; 64 > d; d++) {
            var s = q[d - 15],
                t = q[d - 2],
                u = l[0],
                v = l[4],
                w =
                    l[7] +
                    (c(v, 6) ^ c(v, 11) ^ c(v, 25)) +
                    ((v & l[5]) ^ (~v & l[6])) +
                    m[d] +
                    (q[d] =
                        16 > d
                            ? q[d]
                            : (q[d - 16] +
                                (c(s, 7) ^ c(s, 18) ^ (s >>> 3)) +
                                q[d - 7] +
                                (c(t, 17) ^ c(t, 19) ^ (t >>> 10))) |
                            0),
                x =
                    (c(u, 2) ^ c(u, 13) ^ c(u, 22)) +
                    ((u & l[1]) ^ (u & l[2]) ^ (l[1] & l[2]));
            (l = [(w + x) | 0].concat(l)), (l[4] = (l[4] + w) | 0);
        }
        for (d = 0; 8 > d; d++) l[d] = (l[d] + r[d]) | 0;
    }
    for (d = 0; 8 > d; d++)
        for (e = 3; e + 1; e--) {
            var y = (l[d] >> (8 * e)) & 255;
            i += (16 > y ? 0 : "") + y.toString(16);
        }
    return i;
};
