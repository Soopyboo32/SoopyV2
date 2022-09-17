/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";

class FpsImproveGui extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        // this.GuiPage = new FpsPage()

    }

    initVariables() {
        this.GuiPage = undefined
    }

    onDisable() {
        this.initVariables()
    }
}


class FpsPage extends GuiPage {
    constructor() {
        super(7)

        this.name = "Fps Improve Tips"

        this.pages = [this.newPage()]

        // this.pages[0].addChild(this.streamsBox)

        this.finaliseLoading()
    }

    onOpen() {
        this.updateStreams()
    }
}


module.exports = {
    class: new FpsImproveGui()
}