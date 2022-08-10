/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";
import BoxWithLoading from "../../../guimanager/GuiElement/BoxWithLoading";
import BoxWithTextAndDescription from "../../../guimanager/GuiElement/BoxWithTextAndDescription";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import PasswordInput from "../../../guimanager/GuiElement/PasswordInput";
import SoopyKeyPressEvent from "../../../guimanager/EventListener/SoopyKeyPressEvent";
import { numberWithCommas } from "../../utils/numberUtils";
import { firstLetterWordCapital } from "../../utils/stringUtils";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import Dropdown from "../../../guimanager/GuiElement/Dropdown";
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent";
import { fetch } from "../../utils/networkUtils";

let allowed = new Set(["dc8c39647b294e03ae9ed13ebd65dd29", "83c5626ede2d4754b86064d558809615"])

class SuggestionGui extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        this.GuiPage = new SuggestionPage()

    }

    initVariables() {
        this.GuiPage = undefined
    }

    onDisable() {
        this.initVariables()
    }
}


class SuggestionPage extends GuiPage {
    constructor() {
        super(7)

        this.name = "Suggestions"

        this.pages = [this.newPage()]

        this.password = ""

        if (allowed.has(Player.getUUID().toString().replace(/-/g, ""))) {
            let elm = new PasswordInput().setPlaceholder("Suggestions").setLocation(0.125, 0.05, 0.3, 0.1)
            this.pages[0].addChild(elm)

            elm.addEvent(new SoopyKeyPressEvent().setHandler((key, keyId) => {
                if (elm.text.selected && keyId === 28) {
                    this.password = elm.text.text
                    elm.setText("")
                    elm.text.selected = false
                }
            }))
        } else {
            this.pages[0].addChild(new SoopyTextElement().setText("§0Suggestions").setMaxTextScale(3).setLocation(0.125, 0.05, 0.3, 0.1))
        }

        let button = new ButtonWithArrow().setText("§0Suggest feature (Opens in browser)").setLocation(0.45, 0.05, 0.5, 0.1)
        this.pages[0].addChild(button)

        button.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            java.awt.Desktop.getDesktop().browse(
                new java.net.URI("https://soopy.dev/soopyv2suggestion?uuid=" + Player.getUUID().toString().replace(/-/g, ""))
            );
        }))

        this.suggestionElements = {}

        this.suggestionsArea = new SoopyGuiElement().setLocation(0.05, 0.2, 0.9, 0.8).setScrollable(true)
        this.pages[0].addChild(this.suggestionsArea)


        fetch("http://soopy.dev/api/soopyv2/suggestionTags.json").json(data => {
            this.tags = data
        })

        this.finaliseLoading()
    }

    loadSuggestionPage() {

        fetch("http://soopy.dev/api/soopyv2/suggestion/new").json(data => {
            this.suggestionElements = {}
            this.suggestionsArea.clearChildren()

            let i = 0

            data.suggestions.forEach((suggestion) => {

                if (suggestion.status === "pending_review" || suggestion.status === "closed") {
                    if (suggestion.uuid !== Player.getUUID().toString().replace(/-/g, "") && !allowed.has(Player.getUUID().toString().replace(/-/g, ""))) return
                }

                let box = new SoopyBoxElement().setLocation(0, 0.175 * i, 1, 0.15).setLore(["Click for more information + vote buttons"])
                this.suggestionsArea.addChild(box)

                let title = new SoopyTextElement().setText("§0" + suggestion.title + " §7(" + this.tags.suggestionTags[suggestion.tag] + ")").setMaxTextScale(2).setLocation(0, 0, 0.8, 1)
                box.addChild(title)

                let popularity = new SoopyTextElement().setText("§0Opinion: " + numberWithCommas(suggestion.likes - suggestion.dislikes)).setMaxTextScale(2).setLocation(0.85, 0, 0.1, 1)
                box.addChild(popularity)

                this.suggestionElements[suggestion._id] = {
                    title: title,
                    popularity: popularity
                }

                box.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    this.loadSuggestion(suggestion._id)
                }))

                i++
            });
        })
    }

    loadSuggestion(id) {
        fetch("http://soopy.dev/api/soopyv2/suggestion/" + id + "/user/" + Player.getUUID().toString().replace(/-/g, "")).json(data => {
            let sideBarElm = new SoopyGuiElement().setLocation(0, 0, 1, 1).setScrollable(true)
            if (!data.success) {
                sideBarElm.addChild(new SoopyTextElement().setText("§cError loading suggestion").setMaxTextScale(3).setLocation(0.5, 0.5, 0.5, 0.5))
                this.openSidebarPage(sideBarElm)
                return
            }

            this.suggestionElements[id].title.setText("§0" + data.suggestion.title + " §7(" + this.tags.suggestionTags[data.suggestion.tag] + ")")
            this.suggestionElements[id].popularity.setText("§0Opinion: " + numberWithCommas(data.suggestion.likes - data.suggestion.dislikes))


            let title = new SoopyTextElement().setText("§0" + data.suggestion.title + " §7(" + this.tags.suggestionTags[data.suggestion.tag] + ")").setMaxTextScale(2).setLocation(0.05, 0.05, 0.9, 0.1)
            sideBarElm.addChild(title)

            if (!allowed.has(Player.getUUID().toString().replace(/-/g, ""))) {
                let suggestor = new SoopyTextElement().setText("§7Suggested by " + data.suggestion.username + " | Status: " + this.tags.statusTags[data.suggestion.status]).setMaxTextScale(1).setLocation(0.05, 0.15, 0.9, 0.05)
                sideBarElm.addChild(suggestor)
            } else {
                let suggestor = new SoopyTextElement().setText("§7Suggested by " + data.suggestion.username + " | Status: ").setMaxTextScale(1).setLocation(0.05, 0.15, 0.6, 0.05)
                sideBarElm.addChild(suggestor)

                let drop = new Dropdown().setLocation(0.65, 0.13, 0.3, 0.09).setOptions({ ...this.tags.statusTags, "delete": "Delete" }).setSelectedOption(data.suggestion.status)
                sideBarElm.addChild(drop)

                drop.addEvent(new SoopyContentChangeEvent().setHandler((newVal) => {
                    if (newVal === "delete") {
                        fetch("http://soopy.dev/api/soopyv2/suggestion/" + id + "/delete/" + this.password).async()

                        this.loadSuggestionPage()
                        this.closeSidebarPage()
                        return
                    }
                    fetch("http://soopy.dev/api/soopyv2/suggestion/" + id + "/status/" + newVal + "/" + this.password).async()

                    this.loadSuggestion(id)
                }))
            }

            let likesText = new SoopyTextElement().setText("§0Dislikes: " + numberWithCommas(data.suggestion.dislikes) + " Likes: " + numberWithCommas(data.suggestion.likes)).setMaxTextScale(1).setLocation(0.35, 0.225, 0.3, 0.1)
            sideBarElm.addChild(likesText)
            if (!data.suggestion.hasDisliked) {
                let dislikeButton = new ButtonWithArrow().setDirectionRight(false).setText("§cDislike").setLocation(0.05, 0.225, 0.275, 0.1)
                sideBarElm.addChild(dislikeButton)
                dislikeButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    this.voteSuggestion(id, "dislike")
                }))
            } else {
                let dislikeButton = new ButtonWithArrow().setDirectionRight(false).setText("§cUndislike").setLocation(0.05, 0.225, 0.275, 0.1)
                sideBarElm.addChild(dislikeButton)
                dislikeButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    this.voteSuggestion(id, "clear")
                }))
            }
            if (!data.suggestion.hasLiked) {
                let likeButton = new ButtonWithArrow().setText("§aLike").setLocation(0.675, 0.225, 0.275, 0.1)
                sideBarElm.addChild(likeButton)
                likeButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    this.voteSuggestion(id, "like")
                }))
            } else {
                let likeButton = new ButtonWithArrow().setText("§aUnlike").setLocation(0.675, 0.225, 0.275, 0.1)
                sideBarElm.addChild(likeButton)
                likeButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    this.voteSuggestion(id, "clear")
                }))
            }


            let description = new SoopyMarkdownElement().setText(data.suggestion.description).setLocation(0.05, 0.325, 0.9, 0.6)
            sideBarElm.addChild(description)

            this.openSidebarPage(sideBarElm)
        })
    }

    voteSuggestion(id, type) {
        fetch("http://soopy.dev/api/soopyv2/suggestion/" + id + "/vote/" + (type) + "/" + Player.getUUID().toString().replace(/-/g, "")).async()

        this.loadSuggestion(id)
    }

    onOpen() {
        this.loadSuggestionPage()
    }
}

module.exports = {
    class: new SuggestionGui()
}