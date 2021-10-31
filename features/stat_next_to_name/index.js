/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";

class StatNextToName extends Feature {
    constructor() {
        super()
    }

    onEnable(){
    }

    onDisable(){
    }
}

module.exports = {
    class: new StatNextToName()
}