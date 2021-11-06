/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import ButtonSetting from "../settings/settingThings/button";
import TextSetting from "../settings/settingThings/textSetting";
import ToggleSetting from "../settings/settingThings/toggle";
import firstLoadPages from "./firstLoadPages";
import GuiPage from "../soopyGui/GuiPage"
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";

class Hud extends Feature {
    constructor() {
        super()
    
        this.initVariables()
    }

    initVariables(){
        this.apiKeySetting = undefined
        this.GuiPage = undefined
    }

    onEnable(){
        this.apiKeySetting = new TextSetting("Api Key", "Your hypixel api key", "", "api_key", this, "Run /api new to load", true)
        this.verifyApiKey = new ButtonSetting("Verify api key", "Click this to make sure the api key is working", "verify_key", this, "Click!", this.verifyKey, undefined)

        this.notifyNewVersion = new ToggleSetting("Notify when there is a new update", "Will notify you when there is a new version of soopyv2 avalible for download", true, "notify_update", this) //TODO: Make false by default when uploaded on ct website


        // this.reportErrorsSetting = new ToggleSetting("Send module errors to soopy server", "This will allow me to more effectivly fix them", false, "privacy_send_errors", this)
        // this.sendChatSetting = new ToggleSetting("Send (hashed) chat messages to soopy server", "This will allow the hide spam feature to detect messages that are spam", false, "privacy_send_chat", this)

        // this.privacySettings = [this.reportErrorsSetting, this.sendChatSetting]

        // this.GuiPage = new FirstLoadingPage(this)

        this.registerChat("&aYour new API key is &r&b${key}&r", this.newKey)

        // new Thread(()=>{
        //     Thread.sleep(1000)
        //     ChatLib.command("soopyv2 first_load_thing", true)//TODO: ONLY RUN ON FIRST INSTALL
        // }).start()
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

class FirstLoadingPage extends GuiPage {
    constructor(mainThing){
        super(-10)

        this.showBackButton = false
        
        this.name = "First load thing"

        this.mainThing = mainThing

        this.pageThings = []

        firstLoadPages.forEach((page, i)=>{
            let newPage = this.newPage()

            newPage.addChild(page)

            page.setLoc(i!==0, i!== firstLoadPages.length-1)
            page.guiPage = this

            this.pageThings.push(newPage)
        })

        this.pageNum = 0

        this.finaliseLoading()
    }

    nextPage(){
        this.pageNum++

        this.goToPage(this.pageNum)
    }

    prevPage(){
        this.pageNum--

        this.goToPage(this.pageNum)
    }

    onOpen(){
        this.pageNum = 0

        firstLoadPages.forEach((page, i)=>{
            page.load()
        })
    }
}

module.exports = {
    class: new Hud()
}