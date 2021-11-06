import SoopyGuiElement from '../../../guimanager/GuiElement/SoopyGuiElement.js';

class GuiPage{
    constructor(priority){
        this.currentPageId = 0;
        this.priority = priority

        this.soopyGui = require('./index.js').class;
        this.name = ""

        this.pages = {}

        this.showBackButton = true
    }

    finaliseLoading(){
        this.soopyGui.addCategory(this);
    }

    newPage(){
        this.currentPageId++
        let page = new SoopyGuiElement().setLocation(1*this.currentPageId,0,1,1)

        page._soopyAddonsPageId = this.currentPageId

        this.pages[this.currentPageId] = page

        return page
    }

    goToPage(page, anim){
        this.soopyGui.goToPageNum(page, anim)
    }

    openSidebarPage(child){
        this.soopyGui.openSidebarPage(child)
    }
    closeSidebarPage(){
        this.soopyGui.closeSidebarPage()
    }

    //Override me :D
    onOpen(){

    }
}

export default GuiPage;