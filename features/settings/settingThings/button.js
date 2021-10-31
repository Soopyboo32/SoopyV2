import SoopyMouseClickEvent from "../../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from "../../../../guimanager/GuiElement/ButtonWithArrow";
import SettingBase from "./settingBase";

class ButtonSetting extends SettingBase {
    constructor(name, description, settingId, module, buttonText, buttonFunction, defaultValue=null){
        super(name, description, defaultValue, settingId, module)

        this.buttonObject = new ButtonWithArrow().setLocation(0, 0.3, 0.8, 0.4).setText("§0"+buttonText)
        this.settingObject.addChild(this.buttonObject)

        this.buttonObject.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            buttonFunction.call(this)
        }))
    }
}

export default ButtonSetting