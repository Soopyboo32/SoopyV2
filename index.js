/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

class SoopyAddons {
    constructor() {
        this.FeatureManager = require("./featureClass/featureManager.js")

        this.FeatureManager.parent = this
    }
}
register("command", ()=>{
    require("./mappings/mappingCreator.js")
}).setName("soopyreloadmappingsfile")

new SoopyAddons()
