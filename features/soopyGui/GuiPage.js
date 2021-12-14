import SoopyGuiElement from '../../../guimanager/GuiElement/SoopyGuiElement.js';

class GuiPage{
    constructor(priority){
        this.currentPageId = 0;
        this.priority = priority

        this.soopyGui = undefined;
        new Thread(()=>{
            while(global.soopyv2featuremanagerthing === undefined || global.soopyv2featuremanagerthing.features === undefined || global.soopyv2featuremanagerthing.features["soopyGui"] === undefined){
                Thread.sleep(100)
            }
            
            this.soopyGui = global.soopyv2featuremanagerthing.features["soopyGui"].class;

            if(this.finalisedLoading){
                this.finaliseLoading()
            }
        }).start()
        this.name = ""

        this.pages = {}

        this.showBackButton = true
        this.finalisedLoading = false
    }

    finaliseLoading(){
        if(!this.soopyGui){
            this.finalisedLoading = true
            return
        }
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

    delete(){
        this.soopyGui.deleteCategory(this);
    }

    //Override me :D
    onOpen(){

    }
}

export default GuiPage;