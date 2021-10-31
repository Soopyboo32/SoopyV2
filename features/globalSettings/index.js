/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import ButtonSetting from "../settings/settingThings/button";
import TextSetting from "../settings/settingThings/textSetting";

class Hud extends Feature {
    constructor() {
        super()
    
        this.initVariables()
    }

    initVariables(){

        this.apiKeySetting = undefined
    }

    onEnable(){
        this.apiKeySetting = new TextSetting("Api Key", "Your hypixel api key", "", "api_key", this, "Run /api new to load", true)
        this.verifyApiKey = new ButtonSetting("Verify api key", "Click this to make sure the api key is working", "verify_key", this, "Click!", this.verifyKey, undefined)

        this.registerChat("&aYour new API key is &r&b${key}&r", this.newKey)
    }

    verifyKey(){
        if(this.module.apiKeySetting.getValue() == ""){
            ChatLib.chat("&c[SOOPY V2] You need to set an api key first!")
            return
        }

        var url = "https://api.hypixel.net/key?key=" + this.module.apiKeySetting.getValue()
        
        ChatLib.chat("&c[SOOPY V2] The rest of checking is yet to be coded!")
    }

    newKey(key){
        ChatLib.chat("&c[SOOPY V2] Copied api key!")
        this.apiKeySetting.setValue(key)
    }

    onDisable(){
        this.fpsEnabledSetting.delete()

        this.initVariables()
    }
}

module.exports = {
    class: new Hud()
}