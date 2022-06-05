/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import SettingBase from "../settings/settingThings/settingBase";


class DungeonRoutes extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        if (Player.getUUID().toString() !== "dc8c3964-7b29-4e03-ae9e-d13ebd65dd29") {
            new SettingBase("Coming soontm", "maby", undefined, "coming_soontm", this)
            return
        }
    }

    onDisable() {

    }

}

module.exports = {
    class: new DungeonRoutes()
}
