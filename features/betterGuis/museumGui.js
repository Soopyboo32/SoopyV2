import { SoopyGui, SoopyRenderEvent } from "../../../guimanager"
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent"
import SoopyHoverChangeEvent from "../../../guimanager/EventListener/SoopyHoverChangeEvent"
import SoopyKeyPressEvent from "../../../guimanager/EventListener/SoopyKeyPressEvent"
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent"
import SoopyOpenGuiEvent from "../../../guimanager/EventListener/SoopyOpenGuiEvent"
import BoxWithText from "../../../guimanager/GuiElement/BoxWithText"
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow"
import ProgressBar from "../../../guimanager/GuiElement/ProgressBar"
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement"
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement"
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement"
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement"
import TextBox from "../../../guimanager/GuiElement/TextBox"
import Notification from "../../../guimanager/Notification"
import renderLibs from "../../../guimanager/renderLibs"
import { m } from "../../../mappings/mappings"
import * as utils from "../../utils/utils"


const ContainerChest = Java.type("net.minecraft.inventory.ContainerChest")

class MuseumGui {
    constructor() {
        this.checkMenu = false

        this.isInMuseum = false
        this.guiOpenTickThing = false
        this.dontOpen = 0
        this.lastClosed = 0
        this.itemsInPages = JSON.parse(FileLib.read("soopyAddonsData", "museumItemsCache.json") || "{}") || {}
        this.itemsInPagesSaved = true

        this.soopyGui = new SoopyGui()

        this.soopyGui.optimisedLocations = true

        this.soopyGui.element.addEvent(new SoopyKeyPressEvent().setHandler((...args) => {
            this.keyPress(...args)
        }))

        this.mainPage = new SoopyGuiElement().setLocation(0, 0, 1, 1)
        this.soopyGui.element.addChild(this.mainPage)

        let widthPer = 0.2
        let leftOffset = (1 - widthPer * 3 - widthPer * 4 / 5) / 2

        this.weaponsIndicator = new SoopyBoxElement().setLocation(leftOffset, 0.05, widthPer * 4 / 5, 0.15)
        this.weaponsIndicator.addEvent(new SoopyRenderEvent().setHandler(() => {
            if (this.weaponsIndicator.hovered && ChatLib.removeFormatting(Player.getContainer().getStackInSlot(4).getName()) !== "Weapons") {
                this.weaponText.location.location.x.set(0.05, 500)
                this.weaponText.location.size.x.set(0.9, 500)
                this.weaponText.location.location.y.set(0.025, 500)
                this.weaponText.location.size.y.set(0.35, 500)

                this.weaponsIndicator.setColorOffset(-20, -20, -20, 100)

                Renderer.translate(0, 0, 100)
                Renderer.drawRect(Renderer.color(0, 0, 0, 100), this.weaponsIndicator.location.getXExact(), this.weaponsIndicator.location.getYExact(), this.weaponsIndicator.location.getWidthExact(), this.weaponsIndicator.location.getHeightExact())
                let clicks = Player.getContainer().getName() === "Your Museum" ? "1" : "2"
                Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredFull(clicks, this.weaponsIndicator.location.getXExact() + this.weaponsIndicator.location.getWidthExact() / 2, this.weaponsIndicator.location.getYExact() + this.weaponsIndicator.location.getHeightExact() / 2, Math.min(this.weaponsIndicator.location.getWidthExact() / Renderer.getStringWidth(clicks) / 4, this.weaponsIndicator.location.getHeightExact() / 4 / 2))
            } else {
                this.weaponText.location.location.x.set(0.1, 500)
                this.weaponText.location.size.x.set(0.8, 500)
                this.weaponText.location.location.y.set(0.05, 500)
                this.weaponText.location.size.y.set(0.3, 500)

                this.weaponsIndicator.setColorOffset(0, 0, 0, 100)
            }
        })).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.clickedTopButton("Weapons")
        }))

        this.weaponText = new SoopyTextElement().setText("§5Weapons").setMaxTextScale(10).setLocation(0.1, 0.05, 0.8, 0.3)
        this.weaponsIndicator.addChild(this.weaponText)
        this.weaponsPercentageText = new SoopyTextElement().setLocation(0.1, 0.4, 0.8, 0.2).setText("§0Items Donated: §7Loading...").setMaxTextScale(10)
        this.weaponsIndicator.addChild(this.weaponsPercentageText)
        this.weaponsProgressBar = new ProgressBar().setLocation(0.1, 0.6, 0.8, 0.35).showPercentage(true)
        this.weaponsIndicator.addChild(this.weaponsProgressBar)
        this.mainPage.addChild(this.weaponsIndicator)

        this.armourIndicator = new SoopyBoxElement().setLocation(leftOffset + widthPer, 0.05, widthPer * 4 / 5, 0.15)
        this.armourIndicator.addEvent(new SoopyRenderEvent().setHandler(() => {
            if (this.armourIndicator.hovered && ChatLib.removeFormatting(Player.getContainer().getStackInSlot(4).getName()) !== "Armor Sets") {
                this.armourText.location.location.x.set(0.05, 500)
                this.armourText.location.size.x.set(0.9, 500)
                this.armourText.location.location.y.set(0.025, 500)
                this.armourText.location.size.y.set(0.35, 500)

                this.armourIndicator.setColorOffset(-20, -20, -20, 100)

                Renderer.translate(0, 0, 100)
                Renderer.drawRect(Renderer.color(0, 0, 0, 100), this.armourIndicator.location.getXExact(), this.armourIndicator.location.getYExact(), this.armourIndicator.location.getWidthExact(), this.armourIndicator.location.getHeightExact())
                let clicks = Player.getContainer().getName() === "Your Museum" ? "1" : "2"
                Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredFull(clicks, this.armourIndicator.location.getXExact() + this.armourIndicator.location.getWidthExact() / 2, this.armourIndicator.location.getYExact() + this.armourIndicator.location.getHeightExact() / 2, Math.min(this.armourIndicator.location.getWidthExact() / Renderer.getStringWidth(clicks) / 4, this.armourIndicator.location.getHeightExact() / 4 / 2))
            } else {
                this.armourText.location.location.x.set(0.1, 500)
                this.armourText.location.size.x.set(0.8, 500)
                this.armourText.location.location.y.set(0.05, 500)
                this.armourText.location.size.y.set(0.3, 500)

                this.armourIndicator.setColorOffset(0, 0, 0, 100)
            }
        })).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.clickedTopButton("Armor Sets")
        }))

        this.armourText = new SoopyTextElement().setText("§5Armor Sets").setMaxTextScale(10).setLocation(0.1, 0.05, 0.8, 0.3)
        this.armourIndicator.addChild(this.armourText)
        this.armourPercentageText = new SoopyTextElement().setLocation(0.1, 0.4, 0.8, 0.2).setText("§0Items Donated: §7Loading...").setMaxTextScale(10)
        this.armourIndicator.addChild(this.armourPercentageText)
        this.armourProgressBar = new ProgressBar().setLocation(0.1, 0.6, 0.8, 0.35).showPercentage(true)
        this.armourIndicator.addChild(this.armourProgressBar)
        this.mainPage.addChild(this.armourIndicator)

        this.raritiesIndicator = new SoopyBoxElement().setLocation(leftOffset + widthPer * 2, 0.05, widthPer * 4 / 5, 0.15)
        this.raritiesIndicator.addEvent(new SoopyRenderEvent().setHandler(() => {
            if (this.raritiesIndicator.hovered && ChatLib.removeFormatting(Player.getContainer().getStackInSlot(4).getName()) !== "Rarities") {
                this.raritiesText.location.location.x.set(0.05, 500)
                this.raritiesText.location.size.x.set(0.9, 500)
                this.raritiesText.location.location.y.set(0.025, 500)
                this.raritiesText.location.size.y.set(0.35, 500)

                this.raritiesIndicator.setColorOffset(-20, -20, -20, 100)

                Renderer.translate(0, 0, 100)
                Renderer.drawRect(Renderer.color(0, 0, 0, 100), this.raritiesIndicator.location.getXExact(), this.raritiesIndicator.location.getYExact(), this.raritiesIndicator.location.getWidthExact(), this.raritiesIndicator.location.getHeightExact())
                let clicks = Player.getContainer().getName() === "Your Museum" ? "1" : "2"
                Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredFull(clicks, this.raritiesIndicator.location.getXExact() + this.raritiesIndicator.location.getWidthExact() / 2, this.raritiesIndicator.location.getYExact() + this.raritiesIndicator.location.getHeightExact() / 2, Math.min(this.raritiesIndicator.location.getWidthExact() / Renderer.getStringWidth(clicks) / 4, this.raritiesIndicator.location.getHeightExact() / 4 / 2))
            } else {
                this.raritiesText.location.location.x.set(0.1, 500)
                this.raritiesText.location.size.x.set(0.8, 500)
                this.raritiesText.location.location.y.set(0.05, 500)
                this.raritiesText.location.size.y.set(0.3, 500)

                this.raritiesIndicator.setColorOffset(0, 0, 0, 100)
            }
        })).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.clickedTopButton("Rarities")
        }))

        this.raritiesText = new SoopyTextElement().setText("§5Rarities").setMaxTextScale(10).setLocation(0.1, 0.05, 0.8, 0.3)
        this.raritiesIndicator.addChild(this.raritiesText)
        this.raritiesPercentageText = new SoopyTextElement().setLocation(0.1, 0.4, 0.8, 0.2).setText("§0Items Donated: §7Loading...").setMaxTextScale(10)
        this.raritiesIndicator.addChild(this.raritiesPercentageText)
        this.raritiesProgressBar = new ProgressBar().setLocation(0.1, 0.6, 0.8, 0.35).showPercentage(true)
        this.raritiesIndicator.addChild(this.raritiesProgressBar)
        this.mainPage.addChild(this.raritiesIndicator)

        this.specialIndicator = new SoopyBoxElement().setLocation(leftOffset + widthPer * 3, 0.05, widthPer * 4 / 5, 0.15)
        this.specialIndicator.addEvent(new SoopyRenderEvent().setHandler(() => {
            if (this.specialIndicator.hovered && ChatLib.removeFormatting(Player.getContainer().getStackInSlot(4).getName()) !== "Special Items") {
                this.specialText.location.location.x.set(0.05, 500)
                this.specialText.location.size.x.set(0.9, 500)
                this.specialText.location.location.y.set(0.025, 500)
                this.specialText.location.size.y.set(0.35, 500)

                this.specialIndicator.setColorOffset(-20, -20, -20, 100)

                Renderer.translate(0, 0, 100)
                Renderer.drawRect(Renderer.color(0, 0, 0, 100), this.specialIndicator.location.getXExact(), this.specialIndicator.location.getYExact(), this.specialIndicator.location.getWidthExact(), this.specialIndicator.location.getHeightExact())
                let clicks = Player.getContainer().getName() === "Your Museum" ? "1" : "2"
                Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredFull(clicks, this.specialIndicator.location.getXExact() + this.specialIndicator.location.getWidthExact() / 2, this.specialIndicator.location.getYExact() + this.specialIndicator.location.getHeightExact() / 2, Math.min(this.specialIndicator.location.getWidthExact() / Renderer.getStringWidth(clicks) / 4, this.specialIndicator.location.getHeightExact() / 4 / 2))

            } else {
                this.specialText.location.location.x.set(0.1, 500)
                this.specialText.location.size.x.set(0.8, 500)
                this.specialText.location.location.y.set(0.05, 500)
                this.specialText.location.size.y.set(0.3, 500)

                this.specialIndicator.setColorOffset(0, 0, 0, 100)
            }
        })).addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.clickedTopButton("Special Items")
        }))

        this.specialText = new SoopyTextElement().setText("§5Special Items").setMaxTextScale(10).setLocation(0.1, 0.05, 0.8, 0.3)
        this.specialIndicator.addChild(this.specialText)
        this.specialPercentageText = new SoopyTextElement().setLocation(0.1, 0.4, 0.8, 0.6).setText("§0Items Donated: §7Loading...").setMaxTextScale(10)
        this.specialIndicator.addChild(this.specialPercentageText)
        this.mainPage.addChild(this.specialIndicator)

        let box = new SoopyBoxElement().setLocation(0.5 - widthPer * 0.75, 0.25, widthPer * 2 * 0.75, 0.075).setLore(["Click to search"])
        this.pageTitle = new SoopyTextElement().setText("§5Your Museum").setMaxTextScale(10).setLocation(0, 0, 1, 1)
        box.addChild(this.pageTitle)
        this.mainPage.addChild(box)

        this.searchText = ""
        let search = new TextBox().setLocation(0.5 - widthPer * 0.75, 0.25, widthPer * 2 * 0.75, 0.075)
        box.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            box.visable = false
            search.visable = true
            search.select()
        }))
        search.visable = false
        search.text.mouseClickG = (mouseX, mouseY) => {
            if (search.text.selected && !this.searchText) {
                box.visable = true
                search.visable = false
            }
            search.text.selected = false
        }
        search.text.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFunction) => {
            this.searchText = newVal
            this.showSearchItems()
        }))
        this.mainPage.addChild(search)
        this.mainPage.addEvent(new SoopyOpenGuiEvent().setHandler(() => {
            box.visable = true
            search.visable = false
            search.text.selected = false
            search.setText("")
            this.searchText = ""
        }))

        this.nextButton = new ButtonWithArrow().setLocation(0.5 + widthPer * 3 / 2 - widthPer / 2, 0.25, widthPer / 2, 0.075).setText("§0Next Page")
        this.nextButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            if (this.nextButton.visable) this.nextPage()
        }))
        this.mainPage.addChild(this.nextButton)

        this.previousButton = new ButtonWithArrow().setLocation(0.5 - widthPer * 3 / 2, 0.25, widthPer / 2, 0.075).setText("§0Previous Page").setDirectionRight(false)
        this.previousButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            if (this.previousButton.visable) this.previousPage()
        }))
        this.mainPage.addChild(this.previousButton)

        this.nextButton.visable = false
        this.previousButton.visable = false

        this.donateTitleBox = new SoopyBoxElement().setLocation(0.5 + widthPer * 3 / 2 + 0.025, 0.25, 0.5 - widthPer * 1.5 - 0.05, 0.075)
        let donateTitle = new SoopyTextElement().setText("§5Donate").setMaxTextScale(10).setLocation(0, 0, 1, 1)

        this.donateTitleBox.addChild(donateTitle)
        this.mainPage.addChild(this.donateTitleBox)

        this.donateBox = new SoopyBoxElement().setLocation(0.5 + widthPer * 3 / 2 + 0.025, 0.35, 0.5 - widthPer * 1.5 - 0.05, 0.6).setScrollable(true).enableFrameBuffer()
        this.mainPage.addChild(this.donateBox)

        this.favoriteTitleBox = new SoopyBoxElement().setLocation(0.025, 0.25, 0.5 - widthPer * 1.5 - 0.05, 0.075)
        let favoriteTitle = new SoopyTextElement().setText("§5Favourite Items").setMaxTextScale(10).setLocation(0, 0, 1, 1)

        this.favoriteTitleBox.addChild(favoriteTitle)
        this.mainPage.addChild(this.favoriteTitleBox)

        this.favoriteBox = new SoopyBoxElement().setLocation(0.025, 0.35, 0.5 - widthPer * 1.5 - 0.05, 0.6).setScrollable(true).enableFrameBuffer()
        this.mainPage.addChild(this.favoriteBox)

        this.itemsBox = new SoopyBoxElement().setLocation(0.5 - widthPer * 3 / 2, 0.35, widthPer * 3, 0.6).enableFrameBuffer()
        this.mainPage.addChild(this.itemsBox)

        new Array(this.donateBox, this.favoriteBox, this.itemsBox).forEach((box, i) => {
            box.addEvent(new SoopyHoverChangeEvent().setHandler((hovered) => {
                if (i === 2) {
                    if (this.searchText) {

                    } else {
                        box.enableFrameBuffer()
                        return
                    }
                }
                if (hovered) {
                    box.disableFrameBuffer()
                } else {
                    box.enableFrameBuffer()
                    box.dirtyFrameBuffer(1000)
                }
            }))
        })

        this.donateItems = []

        this.confirm_temp = ""

        this.replacePage = {
            "Your Museum": "Museum",
            " Weapons": "Weapons",
            " Armor Sets": "Armor Sets",
            " Rarities": "Rarities",
            " Special Items": "Special Items"
        }

        this.tickI = 0

        this.lastGuiTitle = ""

        this.favoriteItems = JSON.parse(FileLib.read("soopyAddonsData", "museumFavoriteData.json") || "[]") || []
        this.favoriteIds = this.favoriteItems.map(a => a.sb_id)
        this.updatedFavorites(false)
    }

    saveMuseumCache() {
        //Called on worldUnload, and ever 30 seconds
        if (this.itemsInPagesSaved) return
        this.itemsInPagesSaved = true

        new Thread(() => {
            FileLib.write("soopyAddonsData", "museumItemsCache.json", JSON.stringify(this.itemsInPages))
        }).start()
    }

    clickedTopButton(type) {
        if (ChatLib.removeFormatting(Player.getContainer().getStackInSlot(4).getName()) === type) return

        if (Player.getContainer().getName() === "Your Museum") {
            //if on main page can just directly click on it
            switch (type) {
                case "Weapons":
                    Player.getContainer().click(19, false, "MIDDLE")
                    break
                case "Armor Sets":
                    Player.getContainer().click(21, false, "MIDDLE")
                    break
                case "Rarities":
                    Player.getContainer().click(23, false, "MIDDLE")
                    break
                case "Special Items":
                    Player.getContainer().click(25, false, "MIDDLE")
                    break
            }
        } else {
            Player.getContainer().click(48, false, "MIDDLE")
        }
    }

    nextPage() {
        let itempages = ["Weapons", "Armor Sets", "Rarities", "Special Items"]
        if (itempages.includes(this.replacePage[Player.getContainer().getName().split("➜").pop()])) {
            Player.getContainer().click(53, false, "MIDDLE")

            let [currPage, pageNum] = Player.getContainer().getName().split(")")[0].split("(")[1].split("/").map(a => parseInt(a))
            this.regenItems(currPage + 1)
        }
    }

    previousPage() {
        let itempages = ["Weapons", "Armor Sets", "Rarities", "Special Items"]
        if (itempages.includes(this.replacePage[Player.getContainer().getName().split("➜").pop()])) {
            Player.getContainer().click(45, false, "MIDDLE")

            let [currPage, pageNum] = Player.getContainer().getName().split(")")[0].split("(")[1].split("/").map(a => parseInt(a))
            this.regenItems(currPage - 1)
        }
    }

    tickMenu(first = false) {
        if (!first && (this.tickI++) % 5 !== 0) {
            if (this.lastGuiTitle === Player.getContainer().getName()) {
                return
            }
        }
        this.lastGuiTitle = Player.getContainer().getName()

        if (Player.getContainer().getName() === "Your Museum") {//main page
            if (!Player.getContainer().getStackInSlot(19)) return

            let lore = Player.getContainer().getStackInSlot(19).getLore()
            lore.forEach((line, i) => {
                if (i === 0) return

                if (line.split(" ")?.[1]?.includes("/")) {
                    let data = ChatLib.removeFormatting(line).split(" ")[1].split("/")

                    this.weaponsProgressBar.setProgress(parseInt(data[0]) / parseInt(data[1]))
                    this.weaponsPercentageText.setText("§0Items Donated: §7" + data[0] + "/" + data[1])
                }
            })
            this.weaponsIndicator.setLore(lore)

            lore = Player.getContainer().getStackInSlot(21).getLore()
            lore.forEach((line, i) => {
                if (i === 0) return

                if (line.split(" ")?.[1]?.includes("/")) {
                    let data = ChatLib.removeFormatting(line).split(" ")[1].split("/")

                    this.armourProgressBar.setProgress(parseInt(data[0]) / parseInt(data[1]))
                    this.armourPercentageText.setText("§0Items Donated: §7" + data[0] + "/" + data[1])
                }
            })
            this.armourIndicator.setLore(lore)

            lore = Player.getContainer().getStackInSlot(23).getLore()
            lore.forEach((line, i) => {
                if (i === 0) return

                if (line.split(" ")?.[1]?.includes("/")) {
                    let data = ChatLib.removeFormatting(line).split(" ")[1].split("/")

                    this.raritiesProgressBar.setProgress(parseInt(data[0]) / parseInt(data[1]))
                    this.raritiesPercentageText.setText("§0Items Donated: §7" + data[0] + "/" + data[1])
                }
            })
            this.raritiesIndicator.setLore(lore)

            lore = Player.getContainer().getStackInSlot(25).getLore()
            lore.forEach((line, i) => {
                if (i === 0) return

                if (ChatLib.removeFormatting(line).startsWith("Items Donated: ")) {
                    this.specialPercentageText.setText("§0Items Donated: §7" + ChatLib.removeFormatting(line).split(": ")[1])
                }
            })
            this.specialIndicator.setLore(lore)

            if ((this.pageTitle.text !== ("§5" + Player.getContainer().getName()) || first) && !this.searchText) {
                this.itemsBox.clearChildren()
                let rewardsButton = new ButtonWithArrow().setText("§5Rewards").setLocation(0.1, 0.05, 0.8, 0.2)
                rewardsButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    Player.getContainer().click(40, false, "MIDDLE")
                }))
                this.itemsBox.addChild(rewardsButton)
                let browserButton = new ButtonWithArrow().setText("§5Museum Browser").setLocation(0.1, 0.3, 0.8, 0.2)
                browserButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    Player.getContainer().click(50, false, "MIDDLE")
                }))
                this.itemsBox.addChild(browserButton)

                this.itemsBox.dirtyFrameBuffer()
            }
        }

        this.nextButton.visable = false
        this.previousButton.visable = false

        this.donateTitleBox.visable = false
        this.donateBox.visable = false

        let itempages = ["Weapons", "Armor Sets", "Rarities", "Special Items"]
        if (itempages.includes(this.replacePage[Player.getContainer().getName().split("➜").pop()])) {
            let page = this.replacePage[Player.getContainer().getName().split("➜").pop()]
            let currPage = 0
            let pageNum = Player.getContainer().getStackInSlot(4) ? Math.ceil(ChatLib.removeFormatting(Player.getContainer().getStackInSlot(4).getLore().pop().split("/").pop()) / 28) : 0

            // {
            //     let item = Player.getContainer().getStackInSlot(45)
            //     if (item) {
            //         let lore = item.getLore()
            //         let lastLine = ChatLib.removeFormatting(lore[lore.length - 1]).trim()
            //         let num = lastLine.match(/(\d+)$/g)
            //         currPage = parseInt(num) + 1
            //     }
            // }
            // {
            //     let item = Player.getContainer().getStackInSlot(53)
            //     if (item) {
            //         let lore = item.getLore()
            //         let lastLine = ChatLib.removeFormatting(lore[lore.length - 1]).trim()
            //         let num = lastLine.match(/(\d+)$/g)
            //         currPage = parseInt(num) - 1
            //     }
            // }
            console.log(currPage, pageNum)

            if (!this.searchText) {
                if (currPage > 1) {
                    this.previousButton.visable = true
                    if (Player.getContainer().getStackInSlot(45)) this.previousButton.setLore(Player.getContainer().getStackInSlot(45).getLore())
                }
                if (currPage < pageNum) {
                    this.nextButton.visable = true
                    if (Player.getContainer().getStackInSlot(53)) this.nextButton.setLore(Player.getContainer().getStackInSlot(53).getLore())
                }
            }

            this.donateTitleBox.visable = true
            this.donateBox.visable = true
            let oldDonateItems = JSON.stringify(this.donateItems)
            this.donateItems = []
            let donateArmorSets = {}
            let slot = 0
            for (let item of Player.getContainer().getItems()) {
                if (!item) continue
                if (item.getID() === -1) continue
                let lore = item.itemStack[m.getTooltip](Player.getPlayer(), false)
                for (let line of lore) {
                    if (ChatLib.removeFormatting(line) === "Click to donate item!") {
                        let sb_id = utils.getSBID(item)

                        this.donateItems.push({
                            sb_id: sb_id || "NA",
                            name: item.getName() || "",
                            lore: item.getLore() || [],
                            slot: slot
                        })
                    }
                    if (ChatLib.removeFormatting(line) === "Click to donate armor set!") {
                        let sb_id = utils.getSBID(item)

                        let setId = sb_id.split("_")
                        setId.pop()
                        setId = setId.join("_")

                        donateArmorSets[setId] = (donateArmorSets[setId] || 0) + 1

                        if (donateArmorSets[setId] === 3) {
                            this.donateItems.push({
                                sb_id: sb_id || "NA",
                                name: item.getName() || "",
                                lore: item.getLore() || [],
                                slot: slot
                            })
                        }

                    }
                }
                slot++
            }
            if (oldDonateItems !== JSON.stringify(this.donateItems)) {
                this.regenDonateItems()
            }

            if (!this.itemsInPages[page]) this.itemsInPages[page] = []

            //10-16 43
            let changed = false
            for (let i = 0; i < 4; i++) {
                for (let j = 10; j < 17; j++) {
                    let slot = i * 9 + j
                    let item = Player.getContainer().getStackInSlot(slot)
                    let sb_id = utils.getSBID(item)
                    if (!this.itemsInPages[page][currPage]) this.itemsInPages[page][currPage] = []

                    if (item && item.getID() !== -1) {

                        let itemData = {
                            sb_id: "NA",
                            name: item.getName() || "",
                            lore: item.getLore() || []
                        }

                        if (sb_id) {
                            itemData.sb_id = sb_id
                        }
                        if (!this.itemsInPages[page][currPage][slot] || this.itemsInPages[page][currPage][slot].sb_id !== itemData.sb_id) {
                            this.itemsInPages[page][currPage][slot] = itemData

                            changed = true
                            this.itemsInPagesSaved = false
                        }
                    } else {
                        if (this.itemsInPages[page][currPage][slot]) {
                            delete this.itemsInPages[page][currPage][slot]

                            changed = true
                            this.itemsInPagesSaved = false
                        }
                    }
                }
            }
            if (changed || this.guiUpdated || first) this.regenItems(currPage)
        }

        if (Player.getContainer().getName() === "Confirm Donation") {
            let this_confirm_temp_str = (Player.getContainer().getStackInSlot(4)?.getName() || "") + (Player.getContainer().getStackInSlot(2)?.getName() || "") + (Player.getContainer().getStackInSlot(20)?.getName() || "") + (Player.getContainer().getStackInSlot(24)?.getName() || "")//4, 24, 20
            if (this.confirm_temp !== this_confirm_temp_str || first) {
                this.confirm_temp = this_confirm_temp_str

                this.itemsBox.clearChildren()

                let isArmour = utils.getSBID(Player.getContainer().getStackInSlot(4)) === null
                if (isArmour) {
                    let name = Player.getContainer().getStackInSlot(2).getName()
                    let itemBox = new BoxWithText().setText(name.startsWith("§f") ? "&7" + name.substr(2) : name).setLocation(0.1, 0.05, 0.8, 0.2).setLore(Player.getContainer().getStackInSlot(2).getLore())

                    this.itemsBox.addChild(itemBox)
                } else {
                    let name = Player.getContainer().getStackInSlot(4).getName()
                    let itemBox = new BoxWithText().setText(name.startsWith("§f") ? "&7" + name.substr(2) : name).setLocation(0.1, 0.05, 0.8, 0.2).setLore(Player.getContainer().getStackInSlot(4).getLore())

                    this.itemsBox.addChild(itemBox)
                }

                if (Player.getContainer().getStackInSlot(24) && Player.getContainer().getStackInSlot(20)) {

                    let cancelButton = new ButtonWithArrow().setText("§cCancel").setLocation(0.1, 0.4, 0.35, 0.2).setDirectionRight(false).setLore(Player.getContainer().getStackInSlot(24).getLore())
                    cancelButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                        Player.getContainer().click(24, false, "LEFT")
                    }))
                    this.itemsBox.addChild(cancelButton)

                    let confirmButton = new ButtonWithArrow().setText("§aConfirm Donation").setLocation(0.55, 0.4, 0.35, 0.2).setLore(Player.getContainer().getStackInSlot(20).getLore())
                    confirmButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                        Player.getContainer().click(20, false, "LEFT")
                    }))
                    this.itemsBox.addChild(confirmButton)
                }

                this.itemsBox.dirtyFrameBuffer()
            }

            this.favoriteBox.visable = false
            this.favoriteTitleBox.visable = false
        } else {
            if (this.confirm_temp && this.searchText) {
                this.showSearchItems()
            }
            this.confirm_temp = ""

            this.favoriteBox.visable = true
            this.favoriteTitleBox.visable = true
        }

        this.pageTitle.setText("§5" + Player.getContainer().getName())
        this.guiUpdated = false
    }

    regenDonateItems() {
        this.donateBox.clearChildren()
        this.donateItems.forEach((item, i) => {
            let itemButton = new ButtonWithArrow().setText(item.name.startsWith("§f") ? "&7" + item.name.substr(2) : item.name).setLocation(0.05, 0.025 + 0.125 * i, 0.9, 0.1).setLore(item.lore)
            itemButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                Player.getContainer().click(item.slot, false, "LEFT")
            }))
            this.donateBox.addChild(itemButton)
        })

        this.donateBox.dirtyFrameBuffer()
    }

    showSearchItems() {
        if (Player.getContainer().getName() === "Confirm Donation") return

        if (!this.searchText) {
            this.tickMenu(true)
            return
        }


        this.itemsBox.clearChildren()

        let items = []

        // this.itemsInPages[page][page2]
        Object.keys(this.itemsInPages).forEach((pageKey) => {
            let page = this.itemsInPages[pageKey]
            page.forEach((page2, page2I) => {
                if (!page2) return
                if (items.length >= 4 * 7) return
                page2.forEach((item, slotNum) => {
                    if (!item) return
                    if (items.length >= 4 * 7) return
                    if (item.name.toLowerCase().includes(this.searchText.toLowerCase())) {
                        let loreNew = []
                        Object.values(item.lore).forEach(a => {
                            loreNew.push(a)
                        })
                        item.lore = loreNew
                        item.page = pageKey //category eg: Weapons, armour sets ect
                        item.page2 = page2I //pagenum of category
                        item.slotNum = slotNum //slotnum

                        items.push(item)
                    }
                })
            })
        })

        let y = 0.0325
        let itemNum = 0
        let width = 3
        let widthPer = 1 / (width + 1)
        let offset = 0.0125

        items.forEach((slot, slotNum) => {
            if (!slot) return

            let child

            if (slot.sb_id === "NA") {
                child = new BoxWithText().setText(slot.name.startsWith("§f") ? "&7" + slot.name.substr(2) : slot.name).setLore(slot.lore)
                if (slot.name.startsWith("§c")) {
                    child.setColor(255, 100, 100)
                    child.setText("&0" + slot.name.substr(2))
                }
                if (slot.name.startsWith("§e")) {
                    child.setColor(255, 255, 100)
                    child.setText("&0" + slot.name.substr(2))
                }
            } else {
                let fItem = slot
                child = new ButtonWithArrow().setText(slot.name.startsWith("§f") ? "&7" + slot.name.substr(2) : slot.name).setLore(slot.lore)
                child.addEvent(new SoopyMouseClickEvent().setHandler((mouseX, mouseY, button) => {
                    if (button === 2) { //middle click -> add item to favorites
                        this.addItemToFavorites(fItem, fItem.page, fItem.page2, fItem.slotNum)
                        return
                    }
                    // Player.getContainer().click(item.slotNum, false,button===1?"RIGHT":"LEFT")

                    let currPage, pageNum
                    if (Player.getContainer().getName().includes("/")) {
                        [currPage, pageNum] = Player.getContainer().getName().split(")")[0].split("(")[1].split("/").map(a => parseInt(a))
                    }

                    if (this.replacePage[Player.getContainer().getName().split("➜").pop()] === fItem.page) {
                        if (currPage === fItem.page2) {
                            Player.getContainer().click(fItem.slotNum, false, "LEFT")
                        } else {
                            if (currPage < fItem.page2) {
                                Player.getContainer().click(53, false, "MIDDLE")
                            } else {
                                Player.getContainer().click(45, false, "MIDDLE")
                            }
                        }
                    } else {
                        this.clickedTopButton(fItem.page)
                    }
                })).addEvent(new SoopyRenderEvent().setHandler(() => {
                    if (child.hovered) {

                        child.setColorOffset(-20, -20, -20, 100)

                        Renderer.translate(0, 0, 100)
                        Renderer.drawRect(Renderer.color(0, 0, 0, 100), child.location.getXExact(), child.location.getYExact(), child.location.getWidthExact(), child.location.getHeightExact())

                        let clicks = "?"
                        let currPage, pageNum
                        if (Player.getContainer().getName().includes("/")) {
                            [currPage, pageNum] = Player.getContainer().getName().split(")")[0].split("(")[1].split("/").map(a => parseInt(a))
                        }
                        let pageClicks = Math.abs(currPage - fItem.page2)
                        if (this.replacePage[Player.getContainer().getName().split("➜").pop()] === fItem.page) {
                            clicks = (pageClicks + 1) + ""
                        } else {
                            if (Player.getContainer().getName() === "Your Museum") {
                                clicks = (1 + fItem.page2) + ""
                            } else {
                                clicks = (2 + fItem.page2) + ""
                            }
                        }

                        Renderer.translate(0, 0, 100)
                        renderLibs.drawStringCenteredFull(clicks, child.location.getXExact() + child.location.getWidthExact() / 2, child.location.getYExact() + child.location.getHeightExact() / 2, Math.min(child.location.getWidthExact() / Renderer.getStringWidth(clicks) / 4, child.location.getHeightExact() / 4 / 2))

                    }
                }))
                if (this.favoriteIds.includes(slot.sb_id)) {
                    child.setColor(200, 255, 200)
                }
            }
            child.setLocation(offset + widthPer * itemNum, y, widthPer * 9 / 10, 0.125)
            this.itemsBox.addChild(child)

            itemNum++
            if (itemNum > width) {
                itemNum = 0
                y += 0.135
            }
        })

        this.itemsBox.dirtyFrameBuffer()
    }

    regenItems(page2) {
        if (this.searchText) return

        this.itemsBox.clearChildren()

        let page = this.replacePage[Player.getContainer().getName().split("➜").pop()]

        let y = 0.0325
        let itemNum = 0
        let width = 3
        let widthPer = 1 / (width + 1)
        let offset = 0.0125

        if (!this.itemsInPages[page][page2]) this.itemsInPages[page][page2] = []

        this.itemsInPages[page][page2].forEach((slot, slotNum) => {
            if (!slot) return

            let child

            if (slot.sb_id === "NA") {
                child = new BoxWithText().setText(slot.name.startsWith("§f") ? "&7" + slot.name.substr(2) : slot.name).setLore(slot.lore)
                if (slot.name.startsWith("§c")) {
                    child.setColor(255, 100, 100)
                    child.setText("&0" + slot.name.substr(2))
                }
                if (slot.name.startsWith("§e")) {
                    child.setColor(255, 255, 100)
                    child.setText("&0" + slot.name.substr(2))
                }
            } else {
                child = new ButtonWithArrow().setText(slot.name.startsWith("§f") ? "&7" + slot.name.substr(2) : slot.name).setLore(slot.lore)
                child.addEvent(new SoopyMouseClickEvent().setHandler((mouseX, mouseY, button) => {
                    if (button === 2) { //middle click -> add item to favorites
                        this.addItemToFavorites(slot, page, page2, slotNum)
                        return
                    }
                    // Player.getContainer().click(slotNum, false,button===1?"RIGHT":"LEFT")
                    Player.getContainer().click(slotNum, false, "LEFT") //TODO: add right click support for viewing armour sets
                }))
                if (this.favoriteIds.includes(slot.sb_id)) {
                    child.setColor(200, 255, 200)
                }
            }
            child.setLocation(offset + widthPer * itemNum, y, widthPer * 9 / 10, 0.125)
            this.itemsBox.addChild(child)

            itemNum++
            if (itemNum > width) {
                itemNum = 0
                y += 0.135
            }
        })

        this.itemsBox.dirtyFrameBuffer()
    }

    addItemToFavorites(slot, page, page2, slotNum) {
        if (page === "Special Items") {
            new Notification("§cError!", ["You cant add Special Items", ["to favorites"]])
            return
        }
        if (this.favoriteItems.map(a => a.sb_id).includes(slot.sb_id)) {
            //remove from favorites
            this.favoriteItems = this.favoriteItems.filter(a => a.sb_id !== slot.sb_id)
            this.favoriteIds = this.favoriteIds.filter(a => a !== slot.sb_id)
            this.regenItems(page2)
            this.updatedFavorites()
            return
        }
        let loreNew = []
        slot.lore.forEach(a => {
            loreNew.push(a)
        })
        slot.lore = loreNew
        slot.page = page //category eg: Weapons, armour sets ect
        slot.page2 = page2 //pagenum of category
        slot.slotNum = slotNum //slotnum
        this.favoriteItems.push(slot)
        this.favoriteIds.push(slot.sb_id)
        this.regenItems(page2)
        this.updatedFavorites()
    }

    updatedFavorites(saveToFile = true) {
        this.favoriteBox.clearChildren()

        if (this.favoriteItems.length === 0) {
            let item = new SoopyMarkdownElement().setText("Middle click to add an item to your favorites list").setLocation(0.05, 0.025, 0.9, 0.9)

            this.favoriteBox.addChild(item)
        }

        this.favoriteItems.forEach((fItem, i) => {
            let item = new ButtonWithArrow().setText(fItem.name.startsWith("§f") ? "&7" + fItem.name.substr(2) : fItem.name).setLocation(0.05, 0.025 + 0.125 * i, 0.9, 0.1).setLore(fItem.lore)

            item.addEvent(new SoopyMouseClickEvent().setHandler((mouseX, mouseY, button) => {
                if (button === 2) { //middle click -> remove item from favorites (calling add will remove because it alr exists)
                    this.addItemToFavorites(fItem, fItem.page, fItem.page2, fItem.slotNum)
                    return
                }
                // Player.getContainer().click(item.slotNum, false,button===1?"RIGHT":"LEFT")

                let currPage, pageNum
                if (Player.getContainer().getName().includes("/")) {
                    [currPage, pageNum] = Player.getContainer().getName().split(")")[0].split("(")[1].split("/").map(a => parseInt(a))
                }

                if (this.replacePage[Player.getContainer().getName().split("➜").pop()] === fItem.page) {
                    if (currPage === fItem.page2) {
                        Player.getContainer().click(fItem.slotNum, false, "LEFT")
                    } else {
                        if (currPage < fItem.page2) {
                            Player.getContainer().click(53, false, "MIDDLE")
                        } else {
                            Player.getContainer().click(45, false, "MIDDLE")
                        }
                    }
                } else {
                    this.clickedTopButton(fItem.page)
                }
            })).addEvent(new SoopyRenderEvent().setHandler(() => {
                if (item.hovered) {

                    item.setColorOffset(-20, -20, -20, 100)

                    Renderer.translate(0, 0, 100)
                    Renderer.drawRect(Renderer.color(0, 0, 0, 100), item.location.getXExact(), item.location.getYExact(), item.location.getWidthExact(), item.location.getHeightExact())

                    let clicks = "?"
                    let currPage, pageNum
                    if (Player.getContainer().getName().includes("/")) {
                        [currPage, pageNum] = Player.getContainer().getName().split(")")[0].split("(")[1].split("/").map(a => parseInt(a))
                    }
                    let pageClicks = Math.abs(currPage - fItem.page2)
                    if (this.replacePage[Player.getContainer().getName().split("➜").pop()] === fItem.page) {
                        clicks = (pageClicks + 1) + ""
                    } else {
                        if (Player.getContainer().getName() === "Your Museum") {
                            clicks = (1 + fItem.page2) + ""
                        } else {
                            clicks = (2 + fItem.page2) + ""
                        }
                    }

                    Renderer.translate(0, 0, 100)
                    renderLibs.drawStringCenteredFull(clicks, item.location.getXExact() + item.location.getWidthExact() / 2, item.location.getYExact() + item.location.getHeightExact() / 2, Math.min(item.location.getWidthExact() / Renderer.getStringWidth(clicks) / 4, item.location.getHeightExact() / 4 / 2))

                }
            }))

            this.favoriteBox.addChild(item)
        })

        if (saveToFile) {
            new Thread(() => {
                FileLib.write("soopyAddonsData", "museumFavoriteData.json", JSON.stringify(this.favoriteItems))
            }).start()
        }

        this.favoriteBox.dirtyFrameBuffer()
    }

    guiOpened(event) {
        let name = ""
        if (event.gui && event.gui.field_147002_h instanceof ContainerChest) {
            name = event.gui.field_147002_h.func_85151_d().func_145748_c_().func_150260_c()
        }
        if (this.dontOpen > 0) {
            this.dontOpen--
        }
        if (this.soopyGui.ctGui.isOpen()) {
            if (event.gui && event.gui.field_147002_h) {
                Player.getPlayer().field_71070_bA = event.gui.field_147002_h

                if (Player.getContainer().getName() === "Museum Rewards") {
                    return
                }
                if (Player.getContainer().getName().startsWith("Museum Browser")) {
                    return
                }

                event.gui = this.soopyGui.ctGui
                this.guiUpdated = true
                this.soopyGui.ctGui.open()

                this.itemsBox.dirtyFrameBuffer()
            }
            return
        }
        if (this.isInMuseum) {
            this.soopyGui.ctGui.open()

            this.itemsBox.dirtyFrameBuffer()
        } else {
            if (name === "Your Museum" && !this.isInMuseum) {

                if (event.gui && event.gui.field_147002_h) Player.getPlayer().field_71070_bA = event.gui.field_147002_h

                this.isInMuseum = true

                this.soopyGui.open()
                event.gui = this.soopyGui.ctGui
                this.guiOpenTickThing = true

                this.itemsBox.clearChildren()
                let rewardsButton = new ButtonWithArrow().setText("§5Rewards").setLocation(0.1, 0.05, 0.8, 0.2)
                rewardsButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    Player.getContainer().click(40, false, "MIDDLE")
                }))
                this.itemsBox.addChild(rewardsButton)
                let browserButton = new ButtonWithArrow().setText("§5Museum Browser").setLocation(0.1, 0.3, 0.8, 0.2)
                browserButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    Player.getContainer().click(50, false, "MIDDLE")
                }))
                this.itemsBox.addChild(browserButton)

                this.nextButton.visable = false
                this.previousButton.visable = false

                this.donateTitleBox.visable = false
                this.donateBox.visable = false

                this.pageTitle.setText("§5" + name)

                this.tickMenu(true)

                this.itemsBox.dirtyFrameBuffer()
            }
        }
    }

    keyPress(key, keyId) {
        if (keyId === 1) { //escape key
            this.isInMuseum = false
            // this.dontOpen = 1
            Client.currentGui.close()
        }
    }

    tick() {
        if (this.isInMuseum) {
            if (this.soopyGui.ctGui.isOpen() || this.guiOpenTickThing) {
                this.tickMenu()

                this.guiOpenTickThing = false
            } else {
                // Client.currentGui.close()
                this.isInMuseum = false

                this.lastClosed = Date.now()
            }
        }

        if (!(this.soopyGui.ctGui.isOpen() || this.guiOpenTickThing) && Date.now() - this.lastClosed > 1000) {
            this.weaponsProgressBar.setProgress(0)
            this.armourProgressBar.setProgress(0)
            this.raritiesProgressBar.setProgress(0)
        }

        if (this.dontOpen > 0) {
            Client.currentGui.close()
        }
    }
}

export default MuseumGui;