/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";
import BoxWithLoading from "../../../guimanager/GuiElement/BoxWithLoading";
import BoxWithTextAndDescription from "../../../guimanager/GuiElement/BoxWithTextAndDescription";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import TextBox from "../../../guimanager/GuiElement/TextBox";
import SoopyKeyPressEvent from "../../../guimanager/EventListener/SoopyKeyPressEvent";
import { firstLetterWordCapital } from "../../utils/stringUtils";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import SoopyImageElement from "../../../guimanager/GuiElement/SoopyImageElement";
import renderLibs from "../../../guimanager/renderLibs";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import Dropdown from "../../../guimanager/GuiElement/Dropdown";
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent";

class StatHistoryGUI extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        this.GuiPage = new StatGraphPage()

    }

    initVariables() {
        this.GuiPage = undefined
    }

    onDisable() {
        this.initVariables()
    }
}


class StatGraphPage extends GuiPage {
    constructor() {
        super(7)

        this.name = "Stat Graphs"

        this.pages = [this.newPage()]

        this.pages[0].addChild(new SoopyTextElement().setText("§0Stat Graphs").setMaxTextScale(3).setLocation(0.1, 0.05, 0.6, 0.1))
        let button = new ButtonWithArrow().setText("§0Open in browser").setLocation(0.7, 0.05, 0.2, 0.1)
        this.pages[0].addChild(button)

        button.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            java.awt.Desktop.getDesktop().browse(
                new java.net.URI("https://soopy.dev/stathistory")
            );
        }))

        this.nameInput = new TextBox().setPlaceholder("Click to search").setLocation(0.1, 0.225, 0.8, 0.1)
        this.pages[0].addChild(this.nameInput)

        this.nameInput.addEvent(new SoopyKeyPressEvent().setHandler((key, keyId) => {
            if (this.nameInput.text.selected && keyId === 28) {
                this.playerLoad = this.nameInput.text.text
                this.nameInput.setText("")
                this.updateData(this.playerLoad)
            }
        }))

        this.statArea = new SoopyGuiElement().setLocation(0.05, 0.325, 0.9, 0.675).setScrollable(true)
        this.pages[0].addChild(this.statArea)

        this.loadingElm = new BoxWithLoading().setLocation(0.35, 0.4, 0.3, 0.2)
        this.errorElm = new BoxWithTextAndDescription().setLocation(0.2, 0.3, 0.6, 0.4).setText("Error!").setDesc("An error occured while loading the data!")
        this.statArea.addChild(this.loadingElm)

        this.playerLoad = undefined

        this.finaliseLoading()
    }

    async updateData(player, profIn) {
        this.closeSidebarPage()

        this.playerLoad = player

        this.statArea._scrollAmount = 0
        this.statArea.location.scroll.y.set(0, 100)

        this.statArea.clearChildren()
        this.statArea.addChild(this.loadingElm)

        let playerData = await fetch("https://soopy.dev/api/v2/player/" + player).json()

        if (player !== this.playerLoad) return

        if (!playerData.success) {
            this.statArea.clearChildren()
            this.statArea.addChild(this.errorElm)
            this.errorElm.setText("§0" + playerData.error.name)
            this.errorElm.setDesc("§0" + playerData.error.description)
            return
        }
        this.statArea.clearChildren()
        let nameElm = new SoopyTextElement().setText(playerData.data.stats.nameWithPrefix.replace(/§f/g, "§7")).setMaxTextScale(2).setLocation(0.1, 0.05, 0.5, 0.1)
        this.statArea.addChild(nameElm)
        this.statArea.addChild(this.loadingElm)

        let skyblockData = await fetch("https://soopy.dev/api/v2/player_skyblock/" + playerData.data.uuid).json()
        if (player !== this.playerLoad) return

        if (!skyblockData.success) {
            this.statArea.clearChildren()
            this.statArea.addChild(this.errorElm)
            this.errorElm.setText("§0" + skyblockData.error.name)
            this.errorElm.setDesc("§0" + skyblockData.error.description)
            return
        }

        let selectedProf = profIn || skyblockData.data.stats.bestProfileId
        let profOptions = {}
        Object.keys(skyblockData.data.profiles).forEach(p => {
            profOptions[p] = skyblockData.data.profiles[p].stats.cute_name
        })

        let profileSelect = new Dropdown().setOptions(profOptions).setSelectedOption(selectedProf).setLocation(0.6, 0.05, 0.3, 0.1).addEvent(new SoopyContentChangeEvent().setHandler(newval => {
            this.updateData(player, newval)
        }))
        this.statArea.addChild(profileSelect)

        fetch("https://soopy.dev/statgraphgenerations/" + playerData.data.uuid + "/" + selectedProf).json().then(graphData => {
            if (player !== this.playerLoad) return

            new Thread(() => {
                let y = 0.2
                Object.keys(graphData).forEach(type => {
                    let typeElm = new SoopyTextElement().setText("§0" + firstLetterWordCapital(type.replace("total", ""))).setMaxTextScale(2).setLocation(0.1, y, 0.8, 0.1)
                    this.statArea.addChild(typeElm)
                    y += 0.15
                    let graph = Object.keys(graphData[type])[0]
                    renderLibs.getImage(graphData[type][graph], true) //load image synchronously into cache so it knows the height
                    let graphElm = new SoopyImageElement()
                    this.statArea.addChild(graphElm)
                    graphElm.setImage(graphData[type][graph])

                    graphElm.setLocation(0.1, y, 0.8, 0.25)
                    graphElm.loadHeightFromImage()
                    y += graphElm.location.size.y.get() + 0.05

                    if (Object.keys(graphData[type]).length > 1) {
                        graphElm.setLore(["Click to show more graphs"])
                        graphElm.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                            let sideBarElm = new SoopyGuiElement().setLocation(0, 0, 1, 1)
                            sideBarElm.scrollable = true
                            this.openSidebarPage(sideBarElm)
                            let y2 = 0.05
                            new Thread(() => {
                                Object.keys(graphData[type]).forEach((graph, i) => {
                                    if (i === 0) return
                                    renderLibs.getImage(graphData[type][graph], true) //load image synchronously into cache so it knows the height
                                    let graphElm = new SoopyImageElement()
                                    sideBarElm.addChild(graphElm)
                                    graphElm.setImage(graphData[type][graph])

                                    graphElm.setLocation(0.1, y2, 0.8, 0.25)
                                    graphElm.loadHeightFromImage()
                                    y2 += graphElm.location.size.y.get() + 0.05
                                })
                            }).start()

                        }))
                    }

                })
            }).start()
        })
    }

    onOpen() {
        this.playerLoad = Player.getName()
        this.updateData(Player.getName())
    }
}

module.exports = {
    class: new StatHistoryGUI()
}