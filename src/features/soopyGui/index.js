/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import TextWithArrow from "../../../guimanager/GuiElement/TextWithArrow";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import SoopyOpenGuiEvent from "../../../guimanager/EventListener/SoopyOpenGuiEvent";
import SoopyGui2 from "../../../guimanager/SoopyGui";
import categoryManager from "./categoryManager";


class SoopyGui extends Feature {
    constructor() {
        super()

        this.gui = undefined

        this.currentPage = 0
        this.backButton = undefined

        this.categoryPage = undefined
        this.currCategory = undefined
        this.activePages = []
        this.lastClickedOpen = undefined

        this.activeCategory = undefined
    }

    onEnable() {
        this.gui = new SoopyGui2()


        this.registerCommand("soopyv2", this.openCommand)
        this.registerCommand("soopy", this.openCommand)
        this.registerCommand("snoopyv2", this.openCommand)
        this.registerCommand("snoopy", this.openCommand)
        this.registerCommand("spoopy", this.openCommand)
        this.registerCommand("spoopyv2", this.openCommand)

        this.mainWindowElement = new SoopyBoxElement().setLocation(0.25, 0.1, 0.5, 0.8)

        this.mainWindowElement.addEvent(new SoopyOpenGuiEvent().setHandler(() => { this.goToPageNum(0, false) }))

        //###############################################################################################
        //                                     Category Page
        //###############################################################################################

        this.categoryPage = new SoopyGuiElement().setLocation(0, 0, 1, 1)

        let title = new SoopyTextElement().setText("§0SoopyV2!").setMaxTextScale(3).setLocation(0.1, 0.05, 0.5, 0.1)
        this.categoryPage.addChild(title)

        let discordButton = new ButtonWithArrow().setText("§0Discord").setLocation(0.7, 0.05 + 0.0125, 0.25, 0.075)
        discordButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            java.awt.Desktop.getDesktop().browse(
                new java.net.URI("https://discord.gg/dfSMq96RSN")
            );
        }))
        this.categoryPage.addChild(discordButton)

        this.buttonListElm = new SoopyGuiElement().setLocation(0.1, 0.2, 0.8, 0.8).setScrollable(true)
        this.categoryPage.addChild(this.buttonListElm)

        //###############################################################################################
        //                             Back button for all second pages
        //###############################################################################################

        this.backButton = new TextWithArrow().setText("§0Back").setLocation(0.01, -0.2, 0.1, 0.1).setDirectionRight(false)
        let backButtonEvent = new SoopyMouseClickEvent().setHandler(() => { this.clickedBackButton() })
        this.backButton.addEvent(backButtonEvent)

        this.mainWindowElement.addChild(this.categoryPage)

        this.sidebarPage = new SoopyBoxElement().setLocation(0.3, 0.1, 0.3, 0.8)
        // this.sidebarPage.visable = false

        this.gui.element.addChild(this.sidebarPage)
        this.gui.element.addChild(this.mainWindowElement)

        this.mainWindowElement.addChild(this.backButton)

        this.updateButtons()
    }

    openCommand(page) {
        this.gui.open()

        if (page) {
            this.getPages().forEach(p => {
                if (p.name.replace(/ /g, "_").toLowerCase() === page.toLowerCase()) {
                    this.clickedOpen(p, false)
                }
            })
        }
    }

    getPages() {
        return categoryManager.arr
    }

    updateButtons() {
        if (!this.buttonListElm) return;

        this.buttonListElm.children = []

        if (this.getPages()) this.getPages().forEach((p, i) => {
            let settingsButton = new ButtonWithArrow().setText("§0" + p.name).setLocation(0, 0.175 * i, 1, 0.15)
            settingsButton.addEvent(new SoopyMouseClickEvent().setHandler(() => { this.clickedOpen(p) }))
            this.buttonListElm.addChild(settingsButton)
        })
    }

    clickedOpen(category, anim = true) {
        if (!this.lastClickedOpen) this.lastClickedOpen = 0
        if (Date.now() - this.lastClickedOpen < 100) return //Stopping infinite loop where button getting reset causes click event to get fired again
        this.lastClickedOpen = Date.now()

        let theParent = this.mainWindowElement.innerObjectPaddingThing || this.mainWindowElement
        theParent.children = []

        this.mainWindowElement.addChild(this.categoryPage)

        this.activePages = category.pages
        this.currCategory = category

        Object.values(this.activePages).forEach(p => {
            this.mainWindowElement.addChild(p)
        })

        this.mainWindowElement.addChild(this.backButton)

        category.onOpen()

        this.goToPageNum(1, anim)
    }

    onDisable() {
        this.gui.delete()

        this.gui = undefined

        this.currentPage = 0
        this.backButton = undefined
        this.activePages = []
        this.currCategory = undefined
        this.lastClickedOpen = undefined
    }

    clickedBackButton() {
        this.goToPageNum(this.currentPage - 1)
    }

    goToPage(page, animate = true) {
        let pageNum = page._soopyAddonsPageId

        if (pageNum == this.currentPage) {
            return
        }

        this.currentPage = pageNum

        this.getPages().forEach((p) => {
            Object.values(p.pages).forEach((e, i) => {
                e.location.location.x.set(i - pageNum + 1, animate ? 500 : 0)
            })
        })
        this.categoryPage.location.location.x.set(-pageNum, animate ? 500 : 0)

        this.backButton.location.location.y.set((pageNum === 0 || !this.currCategory.showBackButton) ? -0.2 : 0, animate ? 500 : 0)
    }
    goToPageNum(pageNum, animate = true) {
        if (pageNum < 0) return;

        this.currentPage = pageNum
        if (pageNum === 0) {
            this.currCategory = undefined
            this.closeSidebarPage()
            this.updateButtons()
        }

        this.getPages().forEach((p) => {
            Object.values(p.pages).forEach((e, i) => {
                e.location.location.x.set(i - pageNum + 1, animate ? 500 : 0)
            })
        })
        this.categoryPage.location.location.x.set(-pageNum, animate ? 500 : 0)

        this.backButton.location.location.y.set((pageNum === 0 || !this.currCategory.showBackButton) ? -0.2 : 0, animate ? 500 : 0)

        if (this.currCategory) this.currCategory.onOpenPage(pageNum)
    }
    openSidebarPage(child) {
        this.sidebarPage.location.location.x.set(0.625, 500)
        this.mainWindowElement.location.location.x.set(0.075, 500)

        // this.sidebarPage.visable = true
        this.sidebarPage.clearChildren()
        this.sidebarPage.addChild(child)
    }

    closeSidebarPage() {
        this.sidebarPage.location.location.x.set(0.3, 500)
        this.mainWindowElement.location.location.x.set(0.25, 500)

        this.sidebarPage.clearChildren()
        // this.sidebarPage.visable = false
    }
}

module.exports = {
    class: new SoopyGui()
}