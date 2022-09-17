
import SoopyContentChangeEvent from "../../../../guimanager/EventListener/SoopyContentChangeEvent";
import SettingBase from "./settingBase";
import Dropdown from "../../../../guimanager/GuiElement/Dropdown";

class DropdownSetting extends SettingBase {
    constructor(name, description, defaultVal, settingId, module, optionsData){
        super(name, description, defaultVal, settingId, module)

        this.dropdownObject = new Dropdown().setLocation(0, 0.2, 0.9, 0.6).setOptions(optionsData).setSelectedOption(this.getValue())
        this.settingObject.addChild(this.dropdownObject)

        this.settingObject.setLocation(0.6, 0, 0.4, 1)
        this.guiObject.text.setLocation(0, 0, 0.6, 0.6)
        this.guiObject.description.setLocation(0, 0.6, 0.55, 0.4)

        this.dropdownObject.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun)=>{
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
        
        this.dropdownObject.setSelectedOption(newVal)

        return this
    }
}

export default DropdownSetting