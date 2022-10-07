/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import { toMessageWithLinks } from "../../utils/utils";
import ToggleSetting from "../settings/settingThings/toggle";
import TextSetting from "../settings/settingThings/textSetting";

class Guild extends Feature {
    constructor() {
        super()
    }

    onEnable() {

        this.bridgeBots = new Set()
        fetch("https://soopy.dev/api/soopyv2/gbots.json").json().then(bots => {
            bots.forEach(b => this.bridgeBots.add(b))
        })

        this.shortenPrefix = new ToggleSetting("Shorten guild message prefix", "from Guild > to G > ", false, "shorten_prefix", this)
        this.guildBot = new TextSetting("Bridge bot ign", "", "", "guild_bot_ign", this, "", false)

        //&r&2Guild > &6[MVP&0++&6] zZzSNOW &e[STAFF]&f: &r@niftynathan7, niftynathan7's weight: 20 087 (#1 198) (Skill: 8 771, Slayer: 1 263, Dungeons: 10 053)  ,.,,,..,.,,.,,,....,,,,,,,,,..,,,,,..,,,..,,,.,,.,,.,..,,....,,....,,..,.&r
        //&r&2Guild > &6[MVP&4++&6] Soopyboo32 &e[STAFF]&f: &rasd&r
        //&r&2Guild > &6[MVP&1++&6] niftynathan7 &e[E]&f: &r@Soopyboo32, Soopyboo32's networth: $8 424 131 866 (#2 592)  ,..,...,....,.,,,....,,,...,,,,,,,..,,.,,..,,.,.,,,.........,.....,,,,.....,..,,...,.,.,...,.,&r
        let ev = this.registerChat(/^&r&2Guild > ([\w\W]+?)&f: &r([\w\W]+)&r/, (player, msg, event) => {
            if (msg.includes("[ITEM:")) return
            if (player.includes(":")) return; //stop people sending weard messages to troll using this

            msg = msg.replace(/&[1-9a-emnk]/g, "&⭍")

            //player = &6[MVP&0++&6] zZzSNOW &e[STAFF]
            let [_, rank, ign, grank] = player.match(/(&7|&[0-9a-fmnl]\[\w+(?:&[0-9a-fmnl]\+*&[0-9a-fmnl])?\] )(\w+)( &[0-9a-fmnl]\[\w+\])?/)

            cancel(event)

            let message = ""
            if (this.bridgeBots.has(ign) || ign.toLowerCase() === this.guildBot.getValue().toLowerCase()) {
                let [name, other] = msg.split(/ ?[\>\:\»] /g)

                if (other) {
                    message = `&2B${this.shortenPrefix.getValue() ? "" : "ridge"} > &b${name.split(" replying to ").reverse().join(" &7⤷&b ").trim()}&f: ${msg.replace(name, "").replace(/^ ?[\>\:\»] /, "").trim()}`
                } else {
                    if (msg.includes("---------------------------------------------") || msg.includes("You have 60 seconds to accept. Click here to join!")) {
                        return //bridge bot bug
                    }
                    message = `&2B${this.shortenPrefix.getValue() ? "" : "ridge"} > &7⤷&f ${msg.trim()}`
                }
            } else {
                if (msg.match(/^@(\w+?), ([\w\W]+?) \[GBot:([0-9]+)\] [,. ]+$/)) {
                    let [_, name2, reply, gBotId] = msg.match(/^@(\w+?), ([\w\W]+?) \[GBot:([0-9]+)\] [,. ]+$/)
                    fetch("https://soopy.dev/api/botdown/" + gBotId).json().then(m => {
                        let message = new Message(`&2B${this.shortenPrefix.getValue() ? "" : "ridge"} > &b${name2} &7⤷&f `)

                        m.forEach(c => {
                            let component = new TextComponent(c.text)
                            if (c.click) component.setClick(c.click.action, c.click.value)
                            if (c.hover) component.setHover(c.hover.action, c.hover.value)
                            message.addTextComponent(component)
                        })

                        message.chat()
                    })
                    return
                } else {
                    message = `&2G${this.shortenPrefix.getValue() ? "" : "uild"} > ${rank}${ign}${grank || ""}&f: ${msg}`
                }
            }


            toMessageWithLinks(message).chat()
        })
        ev.trigger.triggerIfCanceled(false)
    }

    onDisable() {

    }
}

module.exports = {
    class: new Guild()
}