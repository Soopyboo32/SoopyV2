/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { SoopyRenderEvent } from "../../../guimanager";
import ButtonWithArrowAndDescription from "../../../guimanager/GuiElement/ButtonWithArrowAndDescription";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import BoxWithLoading from "../../../guimanager/GuiElement/BoxWithLoading";
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";

class FriendsGui extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        this.GuiPage = new SettingPage()

        this.registerChat("&9&m-----------------------------------------------------&r&9${*}&r&9             ${*} &6Friends (Page ${pagenum} of ${maxpages})${friendslist}&r&9&m-----------------------------------------------------&r", (...args) => { this.GuiPage.friendListMessageEvent.call(this.GuiPage, ...args) })
        this.registerStep(true, 5, () => { this.GuiPage.regenGuiElements.call(this.GuiPage) })

        this.registerCommand("soopyunfriendthing", () => {
            this.GuiPage.unfriendMode = !this.GuiPage.unfriendMode
            ChatLib.chat("UNFRIEND MODE NOW " + this.GuiPage.unfriendMode)
        })
        this.registerStep(false, 1, () => { this.GuiPage.runComm.call(this.GuiPage) })

    }

    initVariables() {
        this.GuiPage = undefined
    }

    onDisable() {
        this.initVariables()
    }
}


class SettingPage extends GuiPage {
    constructor() {
        super(7)

        this.name = "Friends"

        this.pages = [this.newPage()]

        this.lastRender = 0

        this.pages[0].addEvent(new SoopyRenderEvent().setHandler(() => { this.lastRender = Date.now() }))


        let friendsTitle = new SoopyTextElement().setText("§0Friends").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1)
        this.pages[0].addChild(friendsTitle)

        this.friendsArea = new SoopyGuiElement().setLocation(0.1, 0.2, 0.8, 0.8).setScrollable(true)
        this.pages[0].addChild(this.friendsArea)

        this.loadedFriends = {}

        this.pageCount = undefined

        this.heightPerFriend = 0.2
        this.loadingElement = new BoxWithLoading().setLocation(0, 0, 1, 0.175)
        this.lastLoadedPage = 0
        this.maxLoadedPage = 0

        this.unfriendMode = false

        this.loadingElement.addEvent(new SoopyRenderEvent().setHandler(() => {
            if (Date.now() - this.lastLoadedPage > 1000) {
                this.loadFriendPage(this.maxLoadedPage + 1)
            }
        }))

        this.commandQueue = []


        this.finaliseLoading()
    }

    runComm() {
        if (this.commandQueue.length > 0) {
            let c = this.commandQueue.shift()
            ChatLib.say(c)
        }
    }

    friendListMessageEvent(pagenum, maxpages, friendslist, event) {
        if (Date.now() - this.lastRender < 1000) {
            cancel(event)
            // console.log("Canceling")
        } else {
            return
        }

        this.maxLoadedPage = parseInt(pagenum)

        this.pageCount = parseInt(maxpages)

        friendslist = friendslist.replace(/\-\>newLine\<\-/g, "\n").split("\n")
        friendslist.shift()

        friendslist.pop()

        friendslist.forEach((line, i) => {
            let [name, location] = line.split(" is ")

            if (location) {
                if (this.loadedFriends[ChatLib.removeFormatting(name)]) {
                    this.loadedFriends[ChatLib.removeFormatting(name)].nameWithFormatting = name
                    this.loadedFriends[ChatLib.removeFormatting(name)].exists = true
                    this.loadedFriends[ChatLib.removeFormatting(name)].currentGame = location.replace("in ", "").replace("currently offline", "&cCurrently offline")
                    this.loadedFriends[ChatLib.removeFormatting(name)].element.setText(name).setDesc("&7" + location.replace("in ", "").replace("currently offline", "&cCurrently offline"))
                } else {
                    this.loadedFriends[ChatLib.removeFormatting(name)] = {
                        nameWithFormatting: name,
                        exists: true,
                        currentGame: location.replace("in ", "").replace("currently offline", "&cCurrently offline"),
                        element: new ButtonWithArrowAndDescription().setLocation(0, this.heightPerFriend * Object.keys(this.loadedFriends).length + 1, 1, this.heightPerFriend * 0.875).setText(name).setDesc("&7" + location.replace("in ", "").replace("currently offline", "&cCurrently offline")).addEvent(new SoopyMouseClickEvent().setHandler(() => {
                            if (this.unfriendMode) {
                                this.commandQueue.push("/friend remove " + ChatLib.removeFormatting(name))

                                this.loadedFriends[ChatLib.removeFormatting(name)].exists = false

                                this.regenGuiElements()
                            }
                        }))
                    }
                    this.loadedFriends[ChatLib.removeFormatting(name)].element.location.location.y.set(this.heightPerFriend * Object.keys(this.loadedFriends).length - this.heightPerFriend, 500 + 100 * i)
                }
            }
        });

        this.regenGuiElements()
    }

    regenGuiElements() {
        if (Date.now() - this.lastRender < 1000) {
            this.friendsArea.children = []

            let scroll = this.friendsArea.location.scroll.y.get() / this.friendsArea.location.getHeightExact()

            let minY = -scroll - this.heightPerFriend * 0.875 - 0.5

            let maxY = -scroll + 1.5

            Object.keys(this.loadedFriends).forEach((ign, i) => {
                if (this.loadedFriends[ign].exists && this.loadedFriends[ign].element.location.location.y.get() > minY && this.loadedFriends[ign].element.location.location.y.get() < maxY) {
                    this.friendsArea.addChild(this.loadedFriends[ign].element)
                }
            })

            this.loadingElement.location.location.y.set(this.heightPerFriend * Object.keys(this.loadedFriends).length, 500)
            this.friendsArea.addChild(this.loadingElement)

            if (this.maxLoadedPage !== this.pageCount) {
                this.loadingElement.visable = true
            } else {
                this.loadingElement.visable = false
            }
        }
    }

    loadFriendPage(page) {
        ChatLib.command("friends list " + page)
        this.lastLoadedPage = Date.now()
    }

    onOpen() {
        this.loadedFriends = {}
        this.pageCount = undefined
        this.lastLoadedPage = 0
        this.maxLoadedPage = 0

        this.regenGuiElements()

        this.loadFriendPage(1)
    }
}

module.exports = {
    class: new FriendsGui()
}