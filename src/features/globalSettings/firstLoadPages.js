import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import Notification from "../../../guimanager/Notification";
import FeatureManager from "../../featureClass/featureManager";
import FirstLoadPage from "./firstLoadPage";

class WelcomePage extends FirstLoadPage {
    constructor() {
        super()

        this.addChild(new SoopyTextElement().setText("§0Welcome to SoopyV2!").setLocation(0.1, 0.05, 0.8, 0.1).setMaxTextScale(10));

        this.addChild(new SoopyTextElement().setText("§7This menu will guide you through important settings").setLocation(0.1, 0.15, 0.8, 0.075).setMaxTextScale(10));
        // this.addChild(new SoopyTextElement().setText("§7First lets get privacy settings out of the way.").setLocation(0.1, 0.15,0.8,0.075).setMaxTextScale(10));

        this.settingsArea = new SoopyGuiElement().setLocation(0.1, 0.25, 0.8, 0.75);
        this.settingsArea.setScrollable(true)

        this.addChild(this.settingsArea);
    }

    load() {
        let y = 0

        this.guiPage.mainThing.firstPageSettings.forEach(setting => {
            setting = setting.getGuiObject()

            setting.location.location.y.set(y, 0)

            this.settingsArea.addChild(setting);

            y += 0.045 + setting.location.size.y.get()
        })
    }
}
class ApiKeyPage extends FirstLoadPage {
    constructor() {
        super()

        this.addChild(new SoopyTextElement().setText("§0First lets setup your api key!").setLocation(0.1, 0.05, 0.8, 0.1).setMaxTextScale(10));

        this.addChild(new SoopyTextElement().setText("§7You can skip this but some features may not work").setLocation(0.1, 0.15, 0.8, 0.075).setMaxTextScale(10));

        this.settingsArea = new SoopyGuiElement().setLocation(0.1, 0.25, 0.8, 0.75);
        this.settingsArea.setScrollable(true)

        this.addChild(this.settingsArea);
    }

    load() {
        let y = 0

        let settings = [this.guiPage.mainThing.apiKeySetting, this.guiPage.mainThing.verifyApiKey, this.guiPage.mainThing.findApiKey, this.guiPage.mainThing.newApiKey]
        settings.forEach(setting => {
            setting = setting.getGuiObject()

            setting.location.location.y.set(y, 0)

            this.settingsArea.addChild(setting);

            y += 0.045 + setting.location.size.y.get()
        })
    }
}

class HowToOpenMenuPage extends FirstLoadPage {
    constructor() {
        super()

        this.addChild(new SoopyTextElement().setText("§0Your all set!").setLocation(0.1, 0.1, 0.8, 0.3).setMaxTextScale(10));

        this.addChild(new SoopyTextElement().setText("§7To change any settings, or to access this menu again run §2/soopy§7.").setLocation(0.1, 0.3, 0.8, 0.1).setMaxTextScale(10));

        let openSettingsButton = new ButtonWithArrow().setText("§0Open settings").setLocation(0.1, 0.5, 0.3, 0.2).setDirectionRight(false)

        openSettingsButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            ChatLib.command("soopyv2", true)
        }))

        this.addChild(openSettingsButton);

        let closeButton = new ButtonWithArrow().setText("§0Close").setLocation(0.6, 0.5, 0.3, 0.2)

        closeButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            Client.currentGui.close()
        }))

        this.addChild(closeButton);

    }
}

class DisableFeatures extends FirstLoadPage {
    constructor() {
        super()

        this.addChild(new SoopyTextElement().setText("§0Lastly do you want to disable all features?").setLocation(0.1, 0.1, 0.8, 0.3).setMaxTextScale(10));

        this.addChild(new SoopyTextElement().setText("§7(So you can only enable the ones you want)").setLocation(0.1, 0.3, 0.8, 0.1).setMaxTextScale(10));

        let openSettingsButton = new ButtonWithArrow().setText("§0Disable all features").setLocation(0.35, 0.5, 0.3, 0.2)

        openSettingsButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {

            new Thread(() => {
                new Notification("Disabling features...", [])
                Object.keys(FeatureManager.featureMetas).forEach((f) => {
                    let meta = FeatureManager.featureMetas[f]

                    let isHidden = meta.isHidden
                    if (typeof isHidden === "string") {
                        return
                    }
                    if (isHidden) return
                    if (!meta.isTogglable) return

                    FeatureManager.featureSettingsData[f].enabled = false
                    FeatureManager.featureSettingsDataLastUpdated = true

                    if (FeatureManager.isFeatureLoaded(f)) {
                        FeatureManager.unloadFeature(f)
                    }
                })
                new Notification("Disabled all features!", [])
            }).start()
        }))

        this.addChild(openSettingsButton);

    }
}

export default [new WelcomePage(), new ApiKeyPage(), new DisableFeatures(), new HowToOpenMenuPage()]