import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent"
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow"
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement"

class FirstLoadPage extends SoopyGuiElement {
    constructor() {
        super()

        this.setLocation(0, 0, 1, 1)

        this.guiPage = undefined
    }

    setLoc(addBack, addNext) {
        if (addBack) {
            let backButton = new ButtonWithArrow().setLocation(0.05, 0.85, 0.2, 0.1).setDirectionRight(false).setText("§0Back")

            backButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                this.guiPage.prevPage()
                this.guiPage.closeSidebarPage()
            }))

            this.addChild(backButton)
        }
        if (addNext) {
            let nextButton = new ButtonWithArrow().setLocation(0.75, 0.85, 0.2, 0.1).setText("§0Next")

            nextButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                this.guiPage.nextPage()
                this.guiPage.closeSidebarPage()
            }))

            this.addChild(nextButton)
        }
    }

    load() {

    }
}

export default FirstLoadPage