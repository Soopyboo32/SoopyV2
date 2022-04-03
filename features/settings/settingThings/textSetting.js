
import SoopyContentChangeEvent from "../../../../guimanager/EventListener/SoopyContentChangeEvent";
import TextBox from "../../../../guimanager/GuiElement/TextBox";
import PasswordInput from "../../../../guimanager/GuiElement/PasswordInput"
import SettingBase from "./settingBase";

class TextSetting extends SettingBase {
    constructor(name, description, defaultVal, settingId, module, placeholder, isSecret){
        super(name, description, defaultVal, settingId, module)

        this.textObject = (isSecret?new PasswordInput():new TextBox()).setLocation(0, 0.2, 0.9, 0.6).setText(this.getValue()).setPlaceholder(placeholder)
        this.settingObject.addChild(this.textObject)

        this.settingObject.setLocation(0.6, 0, 0.4, 1)
        this.guiObject.text.setLocation(0, 0, 0.6, 0.6)
        this.guiObject.description.setLocation(0, 0.6, 0.55, 0.4)

        this.textObject.text.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun)=>{
            this.setValue(newVal)
        }))

    }
    update(){
        if(this.hasHelp()){
            this.guiObject.addChild(this.helpButton)

            this.guiObject.text.setLocation(0.075, 0, 0.6-0.075, 0.6)
        }else{
            this.guiObject.text.setLocation(0, 0, 0.6, 0.6)
        }
    }
    setValue(newVal){
        super.setValue(newVal)

        this.textObject.setText(newVal)

        return this
    }
}

export default TextSetting