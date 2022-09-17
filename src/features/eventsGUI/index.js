/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Enum from "../../../guimanager/Enum";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import BoxWithLoading from "../../../guimanager/GuiElement/BoxWithLoading";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement";
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import TextBox from "../../../guimanager/GuiElement/TextBox";
import Feature from "../../featureClass/class";
import socketConnection from "../../socketConnection";
import { numberWithCommas, timeSince } from "../../utils/numberUtils";
import { firstLetterCapital, firstLetterWordCapital } from "../../utils/stringUtils";
import GuiPage from "../soopyGui/GuiPage";

class EventsGui extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        this.GuiPage = new EventsPage()

        // this.registerChat("&9&m-----------------------------------------------------&r&9${*}&r&9             ${*} &6Friends (Page ${pagenum} of ${maxpages})${friendslist}&r&9&m-----------------------------------------------------&r", (...args) => { this.GuiPage.friendListMessageEvent.call(this.GuiPage, ...args) })
        this.registerStep(true, 5, () => { this.GuiPage.regenGuiElements.call(this.GuiPage) })
        this.registerStep(false, 10, () => { this.GuiPage.pollData.call(this.GuiPage) })
    }

    eventsDataUpdated(data) {
        this.GuiPage.eventsDataUpdated(data)
    }

    joinEventResult(data) {
        this.GuiPage.joinEventResult(data)
    }

    pollEventData(admin) {
        this.GuiPage.pollEventData(admin)
    }

    initVariables() {
        this.GuiPage = undefined
    }

    onDisable() {
        this.initVariables()
    }
}


class EventsPage extends GuiPage {
    constructor() {
        super(8)

        this.name = "Events"

        this.pages = [this.newPage()]

        this.leaderboardElm = undefined
        this.memberData = undefined

        this.lastScroll = 1

        this.leaderboardChildren = []

        this.code = undefined

        this.finaliseLoading()
    }

    updateNotInEvent() {
        this.pages[0].clearChildren()

        this.pages[0].addChild(new SoopyTextElement().setText("§0You are not currently in any events").setMaxTextScale(3).setLocation(0.2, 0.1, 0.6, 0.2))
        this.pages[0].addChild(new SoopyTextElement().setText("§0If you have a join code enter it here").setMaxTextScale(1).setLocation(0.3, 0.4, 0.4, 0.1))
        let joinBox = new TextBox().setPlaceholder("Code here").setLocation(0.3, 0.5, 0.4, 0.1)
        this.pages[0].addChild(joinBox)

        this.pages[0].addChild(new ButtonWithArrow().setLocation(0.35, 0.6, 0.3, 0.1).setText("§0Join Event").addEvent(new SoopyMouseClickEvent().setHandler(() => {

            let code = joinBox.getText()

            this.pages[0].clearChildren()
            this.pages[0].addChild(new BoxWithLoading().setLocation(0.3, 0.3, 0.4, 0.4))

            socketConnection.pollEventCode(code)

            this.code = code
        })))
    }

    updateInEvent(data) {
        //MAIN PAGE

        this.pages[0].clearChildren()

        this.pages[0].addChild(new SoopyTextElement().setText("§0You are curently in an event managed by §6" + data.admin).setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.2))

        if (!data.members[Player.getUUID().toString().replace(/-/g, "")]) {
            this.pages[0].addChild(new ButtonWithArrow().setText("§0Join").setLocation(0.2, 0.2, 0.6, 0.1).addEvent(new SoopyMouseClickEvent().setHandler(() => {
                this.pages[0].clearChildren()
                this.pages[0].addChild(new BoxWithLoading().setLocation(0.3, 0.3, 0.4, 0.4))

                socketConnection.pollEventCode(data.code)

                this.code = data.code
            })))
        }

        let leaderboard = new SoopyGuiElement().setLocation(0.1, 0.3, 0.8, 0.7).setScrollable(true)

        this.pages[0].addChild(leaderboard)

        let playerPosition = -1

        if (this.leaderboardElm) {
            let scroll = this.leaderboardElm._scrollAmount

            leaderboard._scrollAmount = scroll
            leaderboard.location.scroll.y.set(scroll, 0)
        }

        this.leaderboardElm = leaderboard

        Object.values(data.members).sort((a, b) => b.progress - a.progress).forEach((m, i) => {
            let isPlayer = m.uuid === Player.getUUID().toString().replace(/-/g, "")

            if (isPlayer) playerPosition = i + 1

            let nameLine = new SoopyTextElement().setText(`${isPlayer ? "§d" : "§0"}#${i + 1} ${m.username}`).setLocation(0, i * 0.05, 0.5, 0.05).setLore(["Last updated " + timeSince(m.timestamp) + " ago", "Currently: " + (m.online ? "§aOnline" : "§cOffline")])
            nameLine.timestamp = m.timestamp
            nameLine.online = m.online
            leaderboard.addChild(nameLine)

            let lore = [
                `TOTAL: §e${numberWithCommas(Math.floor(m.progress))}`,
                ` `
            ]
            Object.keys(m.current.weights).map(w => {
                let progress = m.current.weights[w] - m.starting.weights[w]

                return [w, progress]
            }).sort((a, b) => b[1] - a[1]).forEach((l, i) => {
                if (i > 10) return

                lore.push(firstLetterWordCapital(l[0].replace(/_/g, " ").replace(/^.+? /, "")) + ": §e" + numberWithCommas(Math.floor(l[1])))
            })


            leaderboard.addChild(new SoopyTextElement().setText(`§0+${numberWithCommas(Math.floor(m.progress))}`).setLocation(0.5, i * 0.05, 0.5, 0.05).setLore(lore))
        })

        this.leaderboardChildren = [...leaderboard.children]

        this.lastScroll = 1

        if (playerPosition >= 0) {
            this.pages[0].addChild(new SoopyTextElement().setText("§0You are #" + playerPosition + " with +" + Math.floor(data.members[Player.getUUID().toString().replace(/-/g, "")].progress)).setMaxTextScale(2).setLocation(0.2, 0.2, 0.6, 0.1))
        }

        // SIDEBAR

        let sideBarElm = new SoopyGuiElement().setLocation(0, 0, 1, 1).setScrollable(true)

        sideBarElm.addChild(new SoopyTextElement().setText("§0Event Settings").setMaxTextScale(3).setLocation(0.1, 0, 0.8, 0.2))

        if (Player.getUUID().toString().replace(/-/g, "") === data.admin) {
            sideBarElm.addChild(new ButtonWithArrow().setText("§0Change").setMaxTextScale(3).setLocation(0.1, 0.2, 0.8, 0.2).addEvent(new SoopyMouseClickEvent().setHandler(() => {

            })))
        }

        sideBarElm.addChild(new SoopyMarkdownElement().setLocation(0.05, 0.2, 0.9, 1).setText("# Tracking: \n" + data.settings.tracking.map(a => firstLetterCapital(a.replace(/\w+?_/, "").replace(/_/g, " "))).join("\n")))

        this.openSidebarPage(sideBarElm)
    }

    regenGuiElements() {
        if (!this.isOpen()) return

        if (this.leaderboardElm) {
            let scroll = this.leaderboardElm.location.scroll.y.get()
            if (this.lastScroll !== scroll) {
                this.lastScroll = scroll

                this.leaderboardElm.children = []

                let min = this.leaderboardElm.location.getYExact() - 100
                let max = min + 200 + this.leaderboardElm.location.getHeightExact()
                let lastChildNotAdded = undefined
                this.leaderboardChildren.forEach(c => {
                    c.setParent(this.leaderboardElm)
                    c.triggerEvent(Enum.EVENT.RESET_FRAME_CACHES)

                    let y = c.location.getYExact()

                    if (y > min && y < max) {
                        this.leaderboardElm.children.push(c)
                    } else {
                        lastChildNotAdded = c
                    }
                })

                if (lastChildNotAdded) {
                    this.leaderboardElm.children.push(lastChildNotAdded)
                }
            }


            this.leaderboardChildren.forEach(c => {
                if (c.timestamp) {
                    c.setLore(["Last updated " + timeSince(c.timestamp) + " ago", "Currently: " + (c.online ? "§aOnline" : "§cOffline")])
                }
            })
        }
    }

    eventsDataUpdated(data) {
        if (!data.inEvent) {
            this.updateNotInEvent()
            return
        }

        this.updateInEvent(data)
    }

    pollEventData(admin) {
        if (!admin) {
            this.updateNotInEvent()
            this.pages[0].addChild(new SoopyTextElement().setText("§cInvalid code").setMaxTextScale(3).setLocation(0.2, 0.7, 0.6, 0.2))
            return
        }
        this.pages[0].clearChildren()
        this.pages[0].addChild(new SoopyTextElement().setText("§0Join §6" + admin + "§0's event?").setMaxTextScale(3).setLocation(0.2, 0.2, 0.6, 0.2))
        this.pages[0].addChild(new ButtonWithArrow().setText("§0Join").setLocation(0.4, 0.4, 0.4, 0.3).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            socketConnection.joinEvent(this.code)
            this.pages[0].clearChildren()
            this.pages[0].addChild(new BoxWithLoading().setLocation(0.3, 0.3, 0.4, 0.4))
        })))
        this.pages[0].addChild(new ButtonWithArrow().setText("§0Cancel").setLocation(0.2, 0.4, 0.2, 0.3).setDirectionRight(false).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.updateNotInEvent()
        })))
    }

    joinEventResult(data) {
        this.pages[0].clearChildren()
        if (data.success) {
            this.pages[0].addChild(new SoopyTextElement().setText("§0Joined event!").setMaxTextScale(3).setLocation(0.2, 0.2, 0.6, 0.2))
            this.pages[0].addChild(new ButtonWithArrow().setText("§0Ok").setLocation(0.3, 0.4, 0.4, 0.4).addEvent(new SoopyMouseClickEvent().setHandler(() => {
                this.pages[0].clearChildren()
                this.pages[0].addChild(new BoxWithLoading().setLocation(0.3, 0.3, 0.4, 0.4))

                socketConnection.pollEventData()
            })))
        } else {
            this.pages[0].addChild(new SoopyTextElement().setText("§0Unable to join event!").setMaxTextScale(3).setLocation(0.2, 0.2, 0.6, 0.1))
            this.pages[0].addChild(new SoopyTextElement().setText("§0" + data.reason).setMaxTextScale(3).setLocation(0.2, 0.3, 0.6, 0.1))
            this.pages[0].addChild(new ButtonWithArrow().setText("§0Ok").setLocation(0.3, 0.4, 0.4, 0.4).addEvent(new SoopyMouseClickEvent().setHandler(() => {
                this.pages[0].clearChildren()
                this.pages[0].addChild(new BoxWithLoading().setLocation(0.3, 0.3, 0.4, 0.4))

                socketConnection.pollEventData()
            })))
        }
    }

    pollData() {
        if (!this.isOpen()) return

        socketConnection.pollEventData()
    }

    onOpen() {
        this.pages[0].clearChildren()
        this.pages[0].addChild(new BoxWithLoading().setLocation(0.3, 0.3, 0.4, 0.4))

        this.leaderboardElm = undefined
        socketConnection.pollEventData()
    }
}

module.exports = {
    class: new EventsGui()
}