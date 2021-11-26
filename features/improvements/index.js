/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import ToggleSetting from "../settings/settingThings/toggle";

class Improvements extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.betterLineBreaks = new ToggleSetting("Better line breaks", "Changes all dashed lines (-------) in chat into solid lines", true, "better_line_breaks", this)

        this.registerChat("${color}-----------------------------------------------------&r", (color, event)=>{
            if(this.betterLineBreaks.getValue()){
                if(color.length > 6) return
                cancel(event)
                ChatLib.chat(color + "&m" + ChatLib.getChatBreak(" ") + "&r");
            }
        }).trigger.triggerIfCanceled(false)
    }


    initVariables(){
        this.betterLineBreaks = undefined
    }

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new Improvements()
}