/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement";
import SoopyImageElement from "../../../guimanager/GuiElement/SoopyImageElement";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import BoxWithText from "../../../guimanager/GuiElement/BoxWithText";
import { fetch } from "../../utils/networkUtils";

class FpsImproveGui extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        this.GuiPage = new FpsPage()

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
    class: new StreamsGui()
}