/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import * as GuiManager from "../../../guimanager/index.js"
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import TextWithArrow from "../../../guimanager/GuiElement/TextWithArrow";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import SoopyOpenGuiEvent from "../../../guimanager/EventListener/SoopyOpenGuiEvent";


class SoopyGui extends Feature {
    constructor() {
        super()

        this.gui = undefined

        this.pages = []
        this.currentPage = 0
        this.backButton = undefined

        this.categoryPage = undefined
        this.currCategory = undefined
        this.activePages = []
        this.lastClickedOpen = undefined

        this.activeCategory = undefined
    }

    onEnable(){
        this.gui = new GuiManager.SoopyGui()

        // this.gui.isDebugEnabled = true

        this.registerCommand("soopyv2", this.openCommand)

        this.mainWindowElement = new SoopyBoxElement().setLocation(0.25, 0.2, 0.5, 0.6)

        this.mainWindowElement.addEvent(new SoopyOpenGuiEvent().setHandler(()=>{this.goToPageNum(0, false)}))

        //###############################################################################################
        //                                     Category Page
        //###############################################################################################

        this.categoryPage = new SoopyGuiElement().setLocation(0, 0, 1, 1)
        
        let title = new SoopyTextElement().setText("§0Soopy Addons!").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1)
        this.categoryPage.addChild(title)

        this.buttonListElm = new SoopyGuiElement().setLocation(0.1, 0.2, 0.8, 0.8).setScrollable(true)
        this.categoryPage.addChild(this.buttonListElm)

        //###############################################################################################
        //                             Back button for all second pages
        //###############################################################################################
        
        this.backButton = new TextWithArrow().setText("§0Back").setLocation(0.01, -0.2, 0.1, 0.1).setDirectionRight(false)
        let backButtonEvent = new SoopyMouseClickEvent().setHandler(()=>{this.clickedBackButton()})
        this.backButton.addEvent(backButtonEvent)
        
        this.mainWindowElement.addChild(this.categoryPage)

        this.sidebarPage = new SoopyBoxElement().setLocation(0.3, 0.2, 0.3, 0.6)
        // this.sidebarPage.visable = false

        this.gui.element.addChild(this.sidebarPage)
        this.gui.element.addChild(this.mainWindowElement)
        
        this.mainWindowElement.addChild(this.backButton)

        this.updateButtons()
    }

    openCommand(page){
        this.gui.open()

        if(page){
            this.pages.forEach(p=>{
                if(p.name.replace(/ /g, "_").toLowerCase() === page.toLowerCase()){
                    this.clickedOpen(p, false)
                }
            })
        }
    }

    addCategory(category){
        this.pages.push(category)
        this.sortPages()

        this.updateButtons()
    }

    updateButtons(){
        if(!this.buttonListElm) return;

        this.buttonListElm.children = []

        this.pages.forEach((p, i)=>{
            let settingsButton = new ButtonWithArrow().setText("§0" + p.name).setLocation(0, 0.225*i, 1, 0.2)
            settingsButton.addEvent(new SoopyMouseClickEvent().setHandler(()=>{this.clickedOpen(p)}))
            this.buttonListElm.addChild(settingsButton)
        })
    }

    clickedOpen(category, anim=true){
        if(!this.lastClickedOpen)this.lastClickedOpen = 0
        if(Date.now()-this.lastClickedOpen < 100) return //Stopping infinite loop where button getting reset causes click event to get fired again
        this.lastClickedOpen = Date.now()

        let theParent = this.mainWindowElement.innerObjectPaddingThing || this.mainWindowElement
        theParent.children = []

        this.mainWindowElement.addChild(this.categoryPage)
        this.mainWindowElement.addChild(this.backButton)

        this.activePages = category.pages
        this.currCategory = category

        Object.values(this.activePages).forEach(p=>{
            this.mainWindowElement.addChild(p)
        })

        this.goToPageNum(1, anim)

        category.onOpen()
    }

    sortPages(){
        this.pages = this.pages.sort((a, b)=>{
            return b.priority - a.priority
        })
    }

    onDisable(){
        this.gui.delete()

        this.gui = undefined

        this.pages = []
        this.currentPage = 0
        this.backButton = undefined
        this.activePages = []
        this.currCategory = undefined
        this.lastClickedOpen = undefined
    }

    clickedBackButton(){
        this.goToPageNum(this.currentPage-1)
    }

    goToPage(page, animate=true){
        let pageNum = page._soopyAddonsPageId
        
        if(pageNum == this.currentPage){
            return
        }

        this.currentPage = pageNum

        this.pages.forEach((p)=>{
            Object.values(p.pages).forEach((e, i)=>{
                e.location.location.x.set(i-pageNum+1, animate?1000:0)
            })
        })
        this.categoryPage.location.location.x.set(-pageNum, animate?1000:0)

        this.backButton.location.location.y.set((pageNum === 0 || !this.currCategory.showBackButton)?-0.2:0, animate?1000:0)
    }
    goToPageNum(pageNum, animate=true){
        if(pageNum<0) return;

        this.currentPage = pageNum
        if(pageNum===0){
            this.currCategory = undefined
            this.closeSidebarPage()
        }

        this.pages.forEach((p)=>{
            Object.values(p.pages).forEach((e, i)=>{
                e.location.location.x.set(i-pageNum+1, animate?1000:0)
            })
        })
        this.categoryPage.location.location.x.set(-pageNum, animate?1000:0)

        this.backButton.location.location.y.set((pageNum === 0 || !this.currCategory.showBackButton)?-0.2:0, animate?1000:0)
    }
    openSidebarPage(child){
        this.sidebarPage.location.location.x.set(0.625, 500)
        this.mainWindowElement.location.location.x.set(0.075, 500)

        // this.sidebarPage.visable = true
        this.sidebarPage.addChild(child)
    }

    closeSidebarPage(){
        this.sidebarPage.location.location.x.set(0.3, 500)
        this.mainWindowElement.location.location.x.set(0.25, 500)

        this.sidebarPage.clearChildren()
        // this.sidebarPage.visable = false
    }
}

module.exports = {
    class: new SoopyGui()
}