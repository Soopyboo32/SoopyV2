/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";

class FeatureBase extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()
    }

    initVariables(){
    }

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new FeatureBase()
}