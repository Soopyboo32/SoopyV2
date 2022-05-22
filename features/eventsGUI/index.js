/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import BoxWithLoading from "../../../guimanager/GuiElement/BoxWithLoading";
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";

class EventsGui extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        // this.GuiPage = new EventsPage() //TODO: SOON(tm)

        // this.registerChat("&9&m-----------------------------------------------------&r&9${*}&r&9             ${*} &6Friends (Page ${pagenum} of ${maxpages})${friendslist}&r&9&m-----------------------------------------------------&r", (...args) => { this.GuiPage.friendListMessageEvent.call(this.GuiPage, ...args) })
        // this.registerStep(true, 5, () => { this.GuiPage.regenGuiElements.call(this.GuiPage) })
    }

    initVariables() {
        this.GuiPage = undefined
    }

    onDisable() {
        this.initVariables()
    }
}


class EventsPage extends GuiPage {
    constructor() {
        super(8)

        this.name = "Guild Events"

        this.pages = [this.newPage()]

        this.pages[0].addChild(new BoxWithLoading().setLocation(0.3, 0.3, 0.4, 0.4))

        this.finaliseLoading()
    }

    onOpen() {

    }
}

module.exports = {
    class: new EventsGui()
}