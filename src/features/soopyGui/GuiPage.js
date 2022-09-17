import SoopyGuiElement from '../../../guimanager/GuiElement/SoopyGuiElement.js';
import categoryManager from './categoryManager.js';

class GuiPage {
    constructor(priority) {
        this.currentPageId = 0;
        this.priority = priority

        this.name = ""

        this.pages = {}

        this.showBackButton = true
        this.finalisedLoading = false
    }

    finaliseLoading() {
        categoryManager.addCategory(this);
    }

    getSoopyGui() {
        if (global.soopyv2featuremanagerthing.features["soopyGui"]) return global.soopyv2featuremanagerthing.features["soopyGui"].class;
    }

    isOpen() {
        if (!this.getSoopyGui()?.gui?.ctGui?.isOpen()) return false

        return this.getSoopyGui()?.currCategory === this
    }

    newPage() {
        this.currentPageId++
        let page = new SoopyGuiElement().setLocation(1 * this.currentPageId, 0, 1, 1)

        page._soopyAddonsPageId = this.currentPageId

        this.pages[this.currentPageId] = page

        return page
    }

    goToPage(page, anim) {
        this.getSoopyGui().goToPageNum(page, anim)
    }

    openSidebarPage(child) {
        this.getSoopyGui().openSidebarPage(child)
    }
    closeSidebarPage() {
        this.getSoopyGui().closeSidebarPage()
    }

    delete() {
        categoryManager.deleteCategory(this)
    }

    //Override me :D
    onOpen() {

    }

    //Override me :D
    onOpenPage(page) {

    }
}

export default GuiPage;