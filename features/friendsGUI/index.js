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
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import ProgressBar from "../../../guimanager/GuiElement/ProgressBar";
import logger from "../../logger";
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement";

class FriendsGui extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        this.GuiPage = new SettingPage()

        this.registerChat("&9&m-----------------------------------------------------&r&9${*}&r&9             ${*} &6Friends (Page ${pagenum} of ${maxpages})${friendslist}&r&9&m-----------------------------------------------------&r", (...args) => { this.GuiPage.friendListMessageEvent.call(this.GuiPage, ...args) })
        this.registerStep(true, 5, () => { this.GuiPage.regenGuiElements.call(this.GuiPage) })

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

        this.loadedPages = new Set()

        this.selectedFriends = new Set()

        this.allFriendsLoaded = false

        this.pageCount = undefined

        this.sidebar = new SoopyGuiElement()

        this.sidebarCustomPage = undefined

        this.sidebarMainPage = new SoopyGuiElement().setLocation(0, 0, 1, 1)

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

        this.updateSidebar()

        this.finaliseLoading()
    }

    loadAllFriends() {
        let commands = []
        for (let i = this.maxLoadedPage + 1; i < this.pageCount + 1; i++) {
            commands.push("/friend list " + i)
        }

        this.runCommandsArray(commands)
    }

    runCommandsArray(commands, callback) {
        this.sidebarCustomPage = new SoopyGuiElement().setLocation(0, 0, 1, 1)


        this.sidebarCustomPage.addChild(
            new ButtonWithArrow().setText("§0CANCEL!").setLocation(0.1, 0.20, 0.8, 0.1)
                .addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    this.commandQueue = []
                    this.sidebarCustomPage = undefined

                    this.updateSidebar()

                    if (callback) callback()
                })))

        this.sidebarCustomPage.addChild(new SoopyTextElement().setText("§0Running commands...").setLocation(0.2, 0.1, 0.6, 0.1).setMaxTextScale(10))


        let progressBar = new ProgressBar().setProgress(0).setLocation(0.2, 0.3, 0.6, 0.1)

        let elements = []

        this.sidebarCustomPage.addChild(progressBar)
        for (let i = 0; i < commands.length; i++) {
            let i2 = i

            elements.push(new SoopyTextElement().setText("§0" + commands[i]).setLocation(0.2, 0.4 + i * 0.05, 0.6, 0.05))

            this.runCommand(commands[i], () => {
                progressBar.setProgress(i2 / (commands.length - 1), 1000)

                let e = elements.shift()
                this.sidebarCustomPage.removeChild(e)

                elements.forEach((e, i) => {
                    e.location.location.y.set(0.4 + i * 0.05, 500)
                })

                if (i2 === commands.length - 1) {
                    this.sidebarCustomPage = undefined

                    this.updateSidebar()

                    if (callback) callback()
                }
            })
        }

        for (let e of elements) {
            this.sidebarCustomPage.addChild(e)
        }
    }

    updateSidebar() {
        this.sidebar.clearChildren()
        if (this.sidebarCustomPage) {
            this.sidebar.addChild(this.sidebarCustomPage)
            return
        }

        this.sidebarMainPage.clearChildren()
        if (this.selectedFriends.size > 0) {
            this.sidebarMainPage.addChild(
                new SoopyTextElement().setText("§0" + this.selectedFriends.size + " friends selected").setMaxTextScale(2).setLocation(0.1, 0.05, 0.8, 0.1))

            this.sidebarMainPage.addChild(
                new ButtonWithArrow().setText("§0Deselect all").setLocation(0.1, 0.15, 0.8, 0.1)
                    .addEvent(new SoopyMouseClickEvent().setHandler(() => {
                        this.selectedFriends.clear()

                        this.regenGuiElements()
                        this.updateSidebar()
                    })))
            this.sidebarMainPage.addChild(
                new ButtonWithArrow().setText("§0Unfriend all").setLocation(0.1, 0.25, 0.8, 0.1)
                    .addEvent(new SoopyMouseClickEvent().setHandler(() => {
                        let commands = []

                        for (let f of this.selectedFriends) {
                            this.loadedFriends[f].exists = false
                            commands.push("/friend remove " + f)
                        }
                        this.selectedFriends.clear()

                        this.runCommandsArray(commands)
                        this.updateSidebar()
                    })))


        } else {
            if (!this.allFriendsLoaded) {
                this.sidebarMainPage.addChild(
                    new ButtonWithArrow().setText("§0Load all friends").setLocation(0.1, 0.1, 0.8, 0.2)
                        .addEvent(new SoopyMouseClickEvent().setHandler(() => {
                            this.loadAllFriends()

                            this.updateSidebar()
                        })))
            } else {
                this.sidebarMainPage.addChild(
                    new ButtonWithArrow().setText("§0Select all").setLocation(0.1, 0.1, 0.8, 0.2)
                        .addEvent(new SoopyMouseClickEvent().setHandler(() => {

                            Object.keys(this.loadedFriends).forEach((ign, i) => {
                                if (this.loadedFriends[ign].exists) {
                                    this.selectedFriends.add(ign)
                                }
                            })

                            this.regenGuiElements()
                            this.updateSidebar()
                        })))
            }
        }

        this.sidebar.addChild(this.sidebarMainPage)
    }

    runCommand(command, callback) {
        this.commandQueue.push([command, callback])
    }

    runComm() {
        if (this.commandQueue.length > 0 && this.isOpen()) {
            let [c, callback] = this.commandQueue.shift()
            ChatLib.say(c)
            logger.logMessage("running command " + c, 3)
            callback()
        }
    }

    friendListMessageEvent(pagenum, maxpages, friendslist, event) {
        if (Date.now() - this.lastLoadedPage < 3000 || this.isOpen()) {
            cancel(event)
            // console.log("Canceling")
        } else {
            return
        }

        this.maxLoadedPage = parseInt(pagenum)

        this.pageCount = parseInt(maxpages)

        this.allFriendsLoaded = this.maxLoadedPage === this.pageCount

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
                            this.clickedOn(ChatLib.removeFormatting(name))
                        }))
                    }
                    this.loadedFriends[ChatLib.removeFormatting(name)].element.location.location.y.set(this.heightPerFriend * Object.keys(this.loadedFriends).length - this.heightPerFriend, 500 + 100 * i)
                }
            }
        });

        this.regenGuiElements()
    }

    clickedOn(name) {
        if (this.selectedFriends.has(name)) {
            this.selectedFriends.delete(name)
        } else {
            this.selectedFriends.add(name)
        }
        // this.commandQueue.push("/friend remove " + ChatLib.removeFormatting(name))

        // this.loadedFriends[ChatLib.removeFormatting(name)].exists = false

        this.regenGuiElements()
        this.updateSidebar()
    }

    regenGuiElements() {
        if (Date.now() - this.lastRender < 1000) {
            this.friendsArea.children = []

            let scroll = this.friendsArea.location.scroll.y.get() / this.friendsArea.location.getHeightExact()

            let minY = -scroll - this.heightPerFriend * 0.875 - 0.5

            let maxY = -scroll + 1.5

            Object.keys(this.loadedFriends).forEach((ign, i) => {
                /**@type {ButtonWithArrowAndDescription} */
                let e = this.loadedFriends[ign].element

                if (this.loadedFriends[ign].exists && e.location.location.y.get() > minY && e.location.location.y.get() < maxY) {
                    this.friendsArea.addChild(e)

                    if (this.selectedFriends.has(ign)) {
                        e.setColor(100, 255, 100)
                    } else {
                        e.setColor(253, 255, 227)
                    }
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

    loadFriendPage(page, callback) {
        if (this.loadedPages.has(page)) return

        this.loadedPages.add(page)
        this.runCommand("/friends list " + page, () => {
            this.lastLoadedPage = Date.now()
            if (callback) callback()
        })
    }

    onOpen() {
        this.loadedFriends = {}
        this.pageCount = undefined
        this.lastLoadedPage = 0
        this.maxLoadedPage = 0

        this.sidebarCustomPage = undefined
        this.commandQueue = []

        this.loadedPages.clear()

        this.regenGuiElements()

        this.loadFriendPage(1)
        this.openSidebarPage(this.sidebar)
        this.updateSidebar()
    }
}

module.exports = {
    class: new FriendsGui()
}