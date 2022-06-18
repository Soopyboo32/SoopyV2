/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";
import BoxWithLoading from "../../../guimanager/GuiElement/BoxWithLoading";
import BoxWithTextAndDescription from "../../../guimanager/GuiElement/BoxWithTextAndDescription";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import TextBox from "../../../guimanager/GuiElement/TextBox";
import SoopyKeyPressEvent from "../../../guimanager/EventListener/SoopyKeyPressEvent";
import { numberWithCommas } from "../../utils/numberUtils";
import { firstLetterWordCapital } from "../../utils/stringUtils";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import { fetch } from "../../utils/networkUtils";
import Dropdown from "../../../guimanager/GuiElement/Dropdown";
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent";

class NetworthGui extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        this.GuiPage = new NetworthPage()

    }

    initVariables() {
        this.GuiPage = undefined
    }

    onDisable() {
        this.initVariables()
    }
}


class NetworthPage extends GuiPage {
    constructor() {
        super(7)

        this.name = "Networth"

        this.pages = [this.newPage()]

        this.pages[0].addChild(new SoopyTextElement().setText("§0Networth").setMaxTextScale(3).setLocation(0.1, 0.05, 0.6, 0.1))
        this.pages[0].addChild(new SoopyTextElement().setText("§0(This is in beta and may be inaccurate)").setMaxTextScale(3).setLocation(0.1, 0.15, 0.8, 0.075))
        let button = new ButtonWithArrow().setText("§0Open in browser").setLocation(0.7, 0.05, 0.2, 0.1)
        this.pages[0].addChild(button)

        button.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            java.awt.Desktop.getDesktop().browse(
                new java.net.URI("https://soopymc.my.to/networth")
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

        this.sidebarElement = new SoopyGuiElement().setLocation(0, 0, 1, 1)

        this.sidebarUsernameSearch = new TextBox().setLocation(0.15, 0.05, 0.7, 0.1).setPlaceholder("Click to search")
        this.sidebarElement.addChild(this.sidebarUsernameSearch)

        this.sidebarUsernameSearch.addEvent(new SoopyKeyPressEvent().setHandler((key, keyId) => {
            if (this.sidebarUsernameSearch.text.selected && keyId === 28) {
                let search = this.sidebarUsernameSearch.text.text
                this.sidebarUsernameSearch.setText("")
                this.sidebarSearch(search)
            }
        }))

        this.lbBackButton = new ButtonWithArrow().setLocation(0.05, 0.05, 0.1, 0.1).setText("§0Back").setDirectionRight(false)
        this.lbNextButton = new ButtonWithArrow().setLocation(0.85, 0.05, 0.1, 0.1).setText("§0Next")
        this.sidebarElement.addChild(this.lbBackButton)
        this.sidebarElement.addChild(this.lbNextButton)
        this.lbBackButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            if (this.currentLbPage > 0) this.goToLeaderboardPage(this.currentLbPage - 1)
        }))
        this.lbNextButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.goToLeaderboardPage(this.currentLbPage + 1)
        }))

        this.leaderboardArea = new SoopyGuiElement().setLocation(0.05, 0.15, 0.9, 0.85).setScrollable(true)
        this.sidebarElement.addChild(this.leaderboardArea)

        this.currentLbPage = 0

        this.finaliseLoading()
    }

    updateData(player, profIn) {
        this.playerLoad = player

        this.statArea._scrollAmount = 0
        this.statArea.location.scroll.y.set(0, 100)

        this.statArea.clearChildren()
        this.statArea.addChild(this.loadingElm)

        fetch("http://soopymc.my.to/api/v2/player/" + player).json(playerData => {

            if (player !== this.playerLoad) return

            if (!playerData.success) {
                this.statArea.clearChildren()
                this.statArea.addChild(this.errorElm)
                this.errorElm.setText("§0" + playerData.error.name)
                this.errorElm.setDesc("§0" + playerData.error.description)
                return
            }

            fetch("http://soopymc.my.to/api/v2/player_skyblock/" + playerData.data.uuid).json(skyblockData => {

                if (player !== this.playerLoad) return

                this.statArea.clearChildren()

                if (!skyblockData.success) {
                    this.statArea.addChild(this.errorElm)
                    this.errorElm.setText("§0" + skyblockData.error.name)
                    this.errorElm.setDesc("§0" + skyblockData.error.description)
                    return
                }

                let selectedProf = profIn || skyblockData.data.stats.bestProfileId

                let nwData = skyblockData.data.profiles[selectedProf].members[playerData.data.uuid].soopyNetworth
                let nameElm = new SoopyTextElement().setText(playerData.data.stats.nameWithPrefix.replace(/§f/g, "§7")).setMaxTextScale(2).setLocation(0.1, 0.05, 0.8, 0.1)
                this.statArea.addChild(nameElm)

                let profOptions = {}
                Object.keys(skyblockData.data.profiles).forEach(p => {
                    profOptions[p] = skyblockData.data.profiles[p].stats.cute_name
                })

                let profileSelect = new Dropdown().setOptions(profOptions).setSelectedOption(selectedProf).setLocation(0.1, 0.15, 0.3, 0.1).addEvent(new SoopyContentChangeEvent().setHandler(newval => {
                    this.updateData(player, newval)
                }))
                this.statArea.addChild(profileSelect)
                this.statArea.addChild(new SoopyTextElement().setText("§0Networth: §2$" + numberWithCommas(Math.round(nwData.networth)).replace(/,/g, "§7,§2")).setMaxTextScale(1.5).setLocation(0.45, 0.15, 0.4, 0.1))
                this.statArea.addChild(new SoopyTextElement().setText("§0Purse: §2$" + numberWithCommas(Math.round(nwData.purse)).replace(/,/g, "§7,§2") + "§0 | Bank: §2$" + numberWithCommas(Math.round(nwData.bank)).replace(/,/g, "§7,§2") + "§0 | Sack: §2$" + numberWithCommas(Math.round(nwData.sack)).replace(/,/g, "§7,§2")).setMaxTextScale(1.5).setLocation(0.1, 0.25, 0.8, 0.1))

                Object.keys(nwData.categories).sort((a, b) => nwData.categories[b].total - nwData.categories[a].total).forEach((name, i) => {
                    let renderName = firstLetterWordCapital(name.replace(/_/g, " "))

                    let data = nwData.categories[name]

                    let box = new SoopyBoxElement().setLocation(i % 2 === 0 ? 0 : 0.525, 0.45 + Math.floor(i / 2) * 0.35, 0.475, 0.25)

                    box.addChild(new SoopyMarkdownElement().setLocation(0, 0, 1, 1).setText(data.items.filter(i => i.name).splice(0, 5).map(a => {
                        let name = (a.name.startsWith("§f") || a.name.startsWith("§7[Lvl ")) ? a.name.replace("§f", "§7") : a.name
                        return "§0" + name + "§0: §2$" + numberWithCommas(Math.round(a.p)).replace(/,/g, "§7,§2")
                    }).join("\n")))

                    let boxName = new SoopyTextElement().setLocation(i % 2 === 0 ? 0 : 0.525, 0.4 + Math.floor(i / 2) * 0.35, 0.475, 0.05).setText("§0" + renderName + "§0: §2$" + numberWithCommas(Math.round(data.total)).replace(/,/g, "§7,§2"))

                    this.statArea.addChild(box)
                    this.statArea.addChild(boxName)
                })

                if (selectedProf === skyblockData.data.stats.bestProfileId) {
                    fetch("http://soopymc.my.to/api/v2/leaderboard/networth/user/" + playerData.data.uuid).json(leaderboardData => {
                        if (player !== this.playerLoad) return

                        if (leaderboardData.success) nameElm.setText("§0#" + numberWithCommas(leaderboardData.data.data.position + 1) + " " + playerData.data.stats.nameWithPrefix.replace(/§f/g, "§7"))
                    })
                }
            })
        })
    }

    onOpen() {
        this.playerLoad = Player.getName()
        this.updateData(Player.getName())

        this.goToLeaderboardPage(0)

        this.openSidebarPage(this.sidebarElement)
    }

    sidebarSearch(user) {
        fetch("http://soopymc.my.to/api/v2/leaderboard/networth/user/" + user).json(data => {
            if (!data.success) {
                return
            }

            let position = data.data.data.position

            this.goToLeaderboardPage(Math.floor(position / 100), false)

            this.leaderboardArea._scrollAmount = -((position % 100) * 0.1 - 0.45) * this.leaderboardArea.location.getHeightExact()
            this.leaderboardArea.location.scroll.y.set(-((position % 100) * 0.1 - 0.45) * this.leaderboardArea.location.getHeightExact(), 100)
        })
    }

    goToLeaderboardPage(page, scroll = true) {
        this.currentLbPage = page

        if (scroll) this.leaderboardArea._scrollAmount = 0
        if (scroll) this.leaderboardArea.location.scroll.y.set(0, 100)

        fetch("http://soopymc.my.to/api/v2/leaderboard/networth/" + page).json(data => {
            this.leaderboardArea.clearChildren()
            data.data.data.forEach((user, i) => {
                this.leaderboardArea.addChild(
                    new SoopyTextElement().setText("§0#" + numberWithCommas(i + 1 + page * 100) + ": " + user.username).setMaxTextScale(1.5).setLocation(0.05, i * 0.1, 0.5, 0.1).setLore(["Click to show detailed stats"]).addEvent(new SoopyMouseClickEvent().setHandler(() => {
                        this.updateData(user.uuid)
                    }))
                )
                this.leaderboardArea.addChild(
                    new SoopyTextElement().setText("§2$" + numberWithCommas(Math.round(user.networth)).replace(/,/g, "§7,§2")).setMaxTextScale(1.5).setLocation(0.6, i * 0.1, 0.35, 0.1)
                )
            })
        })
    }
}

module.exports = {
    class: new NetworthGui()
}