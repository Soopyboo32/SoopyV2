import Enum from "../../../../guimanager/Enum";
import SoopyContentChangeEvent from "../../../../guimanager/EventListener/SoopyContentChangeEvent";
import Toggle from "../../../../guimanager/GuiElement/Toggle";
import SettingBase from "./settingBase";

class ToggleSetting extends SettingBase {
    constructor(name, description, defaultVal, settingId, module) {
        super(name, description, defaultVal, settingId, module)

        this.onChange = undefined

        this.toggleObject = new Toggle().setLocation(0, 0.3, 0.8, 0.4).setValue(this.getValue())
        this.settingObject.addChild(this.toggleObject)

        this.toggleObject.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun) => {
            this.setValue(newVal)
        }))

    }

    setValue(newVal) {
        super.setValue(newVal)

        this.toggleObject.setValue(newVal)

        if (this.onChange) this.onChange()

        return this
    }

    requires(toggleSetting) {
        this.requiresO = toggleSetting

        toggleSetting.toggleObject.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun) => {
            if (newVal) {
                this.setValue(this.temp_val)

                this.toggleObject.triggerEvent(Enum.EVENT.CONTENT_CHANGE, [this.temp_val, false, () => { }])

                this.guiObject.location.size.y.set(0.2, 500)
            } else {
                this.temp_val = this.getValue()
                this.setValue(false)

                this.toggleObject.triggerEvent(Enum.EVENT.CONTENT_CHANGE, [false, this.temp_val, () => { }])

                this.guiObject.location.size.y.set(0, 500)
            }
        }))
        let newVal = this.requiresO.getValue()
        if (!newVal) {
            let temp_val = this.temp_val
            this.setValue(false)
            this.temp_val = temp_val
            this.guiObject.location.size.y.set(0, 0)
        }

        return this
    }
}

export default ToggleSetting