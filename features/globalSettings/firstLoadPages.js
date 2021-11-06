import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import FirstLoadPage from "./firstLoadPage";

class WelcomePage extends FirstLoadPage{
    constructor(){
        super()

        this.addChild(new SoopyTextElement().setText("§0Welcome to SoopyAddons V2!").setLocation(0.1, 0.05,0.8,0.1).setMaxTextScale(10));

        this.addChild(new SoopyTextElement().setText("§7First lets get privacy settings out of the way.").setLocation(0.1, 0.15,0.8,0.075).setMaxTextScale(10));

        this.settingsArea = new SoopyGuiElement().setLocation(0.1, 0.25,0.8,0.75);

        this.addChild(this.settingsArea);
    }

    load(){
        let y = 0

        this.guiPage.mainThing.privacySettings.forEach(setting => {
            setting = setting.getGuiObject()

            setting.location.location.y.set(y, 0)

            this.settingsArea.addChild(setting);

            y += 0.045+setting.location.size.y.get()
        })
    }
}

class HowToOpenMenuPage extends FirstLoadPage{
    constructor(){
        super()

        this.addChild(new SoopyTextElement().setText("§0Your all set!").setLocation(0.1, 0.1,0.8,0.3).setMaxTextScale(10));

        this.addChild(new SoopyTextElement().setText("§7To change any settings, or to access this menu again run §2/soopyaddons§7.").setLocation(0.1, 0.3,0.8,0.1).setMaxTextScale(10));

        let openSettingsButton = new ButtonWithArrow().setText("§0Open settings").setLocation(0.1, 0.5,0.3,0.2).setDirectionRight(false)

        openSettingsButton.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            ChatLib.command("soopyv2", true)
        }))

        this.addChild(openSettingsButton);

        let closeButton = new ButtonWithArrow().setText("§0Close").setLocation(0.6, 0.5,0.3,0.2)

        closeButton.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            Client.currentGui.close()
        }))

        this.addChild(closeButton);

    }
}

export default [new WelcomePage(), new HowToOpenMenuPage()]