/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import SettingBase from "../settings/settingThings/settingBase";

class StatNextToName extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        new SettingBase("NOTE: this does not work", "COMING SOON(tm) (sooner than sb 1.0)", true, "stat_next_to_name_description", this)
    }

    onDisable(){
    }
}

module.exports = {
    class: new StatNextToName()
}