/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import SoopyGuiElement from "../guimanager/GuiElement/SoopyGuiElement.js"
import SoopyBoxElement from "../guimanager/GuiElement/SoopyBoxElement"

SoopyGuiElement.prototype.clearChildren = function (){
    let theParent = this.innerObjectPaddingThing || this
    theParent.children.forEach(child => {
        child.setParent(undefined)
    });
    theParent.children = []
    return this
}
SoopyBoxElement.prototype.clearChildren = function (){
    let theParent = this.innerObjectPaddingThing || this
    theParent.children.forEach(child => {
        child.setParent(undefined)
    });
    theParent.children = []
    return this
}
class SoopyAddons {
    constructor(){
        this.FeatureManager = require("./featureClass/featureManager.js")

        this.FeatureManager.parent = this
    }
}

soopyAddons = new SoopyAddons() 