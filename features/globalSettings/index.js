/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import ButtonSetting from "../settings/settingThings/button";
import TextSetting from "../settings/settingThings/textSetting";
import ToggleSetting from "../settings/settingThings/toggle";
import firstLoadPages from "./firstLoadPages";
import GuiPage from "../soopyGui/GuiPage"
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import Notification from "../../../guimanager/Notification";
import logger from "../../logger";
import soopyV2Server from "../../socketConnection";
import { numberWithCommas } from "../../utils/numberUtils";
import { firstLetterCapital } from "../../utils/stringUtils";
const Files = Java.type("java.nio.file.Files")
const Paths = Java.type("java.nio.file.Paths")
const JavaString = Java.type("java.lang.String")

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
        this.verifyApiKey = new ButtonSetting("Verify api key", "Click this to make sure the api key is working", "verify_key", this, "Click!", this.verifyKey2, undefined)
        this.newApiKey = new ButtonSetting("Run /api new", "This is here so u dont need to exit and re-enter", "api_new_command", this, "Click!", this.apiNewCommand, undefined)
        this.findApiKey = new ButtonSetting("Attempt to load api key from other mods", "This will scan other mods configs to attempt to find your key", "find_key", this, "Click!", this.findKey, undefined)


        // this.notifyNewVersion = new ToggleSetting("Notify when there is a new update", "Will notify you when there is a new version of soopyv2 avalible for download", false, "notify_update", this)


        this.reportErrorsSetting = new ToggleSetting("Send module errors to soopy server", "This will allow me to more effectivly fix them", false, "privacy_send_errors", this)
        this.sendChatSetting = new ToggleSetting("Send (hashed) chat messages to soopy server", "This will allow the hide spam feature to detect messages that are spam", false, "privacy_send_chat", this)

        this.privacySettings = [this.reportErrorsSetting, this.sendChatSetting]

        this.firstLoadPageData = JSON.parse(FileLib.read("soopyAddonsData", "soopyv2firstloaddata.json") || "{}") || {}

        this.GuiPage = new FirstLoadingPage(this)

        soopyV2Server.reportErrorsSetting = this.reportErrorsSetting

        this.registerChat("&aYour new API key is &r&b${key}&r", this.newKey)

        this.ranFirstLoadThing = false

        if(!this.firstLoadPageData.shown){
            new Thread(()=>{
                while(!World || !this.FeatureManager.finishedLoading){
                    Thread.sleep(100)
                }
                Thread.sleep(500)
                this.showFirstLoadPage.call(this)
            }).start()
        }
        

        this.registerCommand("soopyweight", (user=Player.getName())=>{
            new Thread(()=>{
                this.soopyWeight(user)
            }).start()
        })
        this.registerCommand("sweight", (user=Player.getName())=>{
            new Thread(()=>{
                this.soopyWeight(user)
            }).start()
        })
    }

    soopyWeight(user){

        ChatLib.chat(this.FeatureManager.messagePrefix + " Finding senither weight for " + user)

        let userData = JSON.parse(FileLib.getUrlContent("http://soopymc.my.to/api/v2/player/"+user))

        if(!userData.success){
            ChatLib.chat(this.FeatureManager.messagePrefix + "&cError loading data: " + userData.error.description)
            return
        }

        let sbData = JSON.parse(FileLib.getUrlContent("http://soopymc.my.to/api/v2/player_skyblock/"+userData.data.uuid))

        if(!sbData.success){
            ChatLib.chat(this.FeatureManager.messagePrefix + "&cError loading data: " + sbData.error.description)
            return
        }

        ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
        ChatLib.chat(userData.data.stats.nameWithPrefix + "'s senither weight (best profile):")
        ChatLib.chat("&aTotal: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.total)))
        new Message(new TextComponent("&aSkills: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill.total)))
        .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill).map(skill=>{
            if(skill === "total"){
                return null
            }
            return "&a"+firstLetterCapital(skill)+": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill[skill].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill[skill].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.skill[skill].overflow)) + ")"
        }).filter(a=>a).join("\n"))).chat()
        new Message(new TextComponent("&aSlayer: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer.total)))
        .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer).map(slayer=>{
            if(slayer === "total"){
                return null
            }
            return "&a"+firstLetterCapital(slayer)+": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer[slayer].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer[slayer].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.slayer[slayer].overflow)) + ")"
        }).filter(a=>a).join("\n"))).chat()
        new Message(new TextComponent("&aDungeon: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons.total)))
        .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons).map(dungeons=>{
            if(dungeons === "total"){
                return null
            }
            return "&a"+firstLetterCapital(dungeons)+": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons[dungeons].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons[dungeons].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.bestProfileId].members[userData.data.uuid].weight.dungeons[dungeons].overflow)) + ")"
        }).filter(a=>a).join("\n"))).chat()
        if(sbData.data.stats.bestProfileId !== sbData.data.stats.currentProfileId){
            ChatLib.chat(userData.data.stats.nameWithPrefix + "'s senither weight (best profile):")
            ChatLib.chat("&aTotal: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.total)))
            new Message(new TextComponent("&aSkills: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill.total)))
            .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill).map(skill=>{
                if(skill === "total"){
                    return null
                }
                return "&a"+firstLetterCapital(skill)+": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill[skill].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill[skill].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.skill[skill].overflow)) + ")"
            }).filter(a=>a).join("\n"))).chat()
            new Message(new TextComponent("&aSlayer: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer.total)))
            .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer).map(slayer=>{
                if(slayer === "total"){
                    return null
                }
                return "&a"+firstLetterCapital(slayer)+": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer[slayer].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer[slayer].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.slayer[slayer].overflow)) + ")"
            }).filter(a=>a).join("\n"))).chat()
            new Message(new TextComponent("&aDungeon: &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons.total)))
            .setHover("show_text", Object.keys(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons).map(dungeons=>{
                if(dungeons === "total"){
                    return null
                }
                return "&a"+firstLetterCapital(dungeons)+": &b" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons[dungeons].total)) + " &7(" + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons[dungeons].weight)) + " | " + numberWithCommas(Math.round(sbData.data.profiles[sbData.data.stats.currentProfileId].members[userData.data.uuid].weight.dungeons[dungeons].overflow)) + ")"
            }).filter(a=>a).join("\n"))).chat()
        }
        ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
    }

    showFirstLoadPage(){
        if(!this.ranFirstLoadThing && World && !this.firstLoadPageData.shown){
            ChatLib.chat(this.FeatureManager.messagePrefix + "Opening first load page, if you accidentally close it run /soopyv2 and click the button")
            ChatLib.command("soopyv2 first_load_thing", true)
            this.ranFirstLoadThing = true
            this.firstLoadPageData.shown = true
            this.firstLoadPageData.version = 1
            FileLib.write("soopyAddonsData", "soopyv2firstloaddata.json", JSON.stringify(this.firstLoadPageData))
        }
    }
    verifyKey(key){
        // console.log(key)
        if(key){
            try{
                var url = "https://api.hypixel.net/key?key=" + key
                let data = JSON.parse(FileLib.getUrlContent(url))

                // console.log(data)

                if(data.success){
                    return true
                }else{
                    return false
                }
            }catch(e){
                return false
            }
        }else{
            return false
        }
    }
    findKey(){
        new Notification("Finding key...", [])
        new Thread(()=>{

            //       NEU
            try{
                let testKey = JSON.parse(new JavaString(Files.readAllBytes(Paths.get("./config/notenoughupdates/configNew.json")))).apiKey.apiKey
                if(testKey){
                    if(this.verifyKey(testKey)){
                        this.module.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in NotEnoughUpdates!"])
                        return;
                    }else{
                        logger.logMessage("Found invalid key in NotEnoughUpdates", 3)
                    }
                }
            }catch(_){}

            //       SBE
            // try{
                let testKey = JSON.parse(new JavaString(Files.readAllBytes(Paths.get("./config/SkyblockExtras.cfg")))).values.apiKey
                if(testKey){
                    if(this.verifyKey(testKey)){
                        this.module.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in SkyblockExtras!"])
                        return;
                    }else{
                        logger.logMessage("Found invalid key in SkyblockExtras", 3)
                    }
                }
            // }catch(_){}
            //       SKYTILS
            try{
                let testKey2 = new JavaString(Files.readAllBytes(Paths.get("./config/skytils/config.toml")))
                let testKey = undefined
                testKey2.split("\n").forEach(line=>{
                    if(line.startsWith("		hypixel_api_key = \"")){
                        testKey = line.split("\"")[1]
                    }
                })
                if(testKey){
                    if(this.verifyKey(testKey)){
                        this.module.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in Skytils!"])
                        return;
                    }else{
                        logger.logMessage("Found invalid key in Skytils", 3)
                    }
                }
            }catch(_){}

            //       SOOPYADDONS DATA
            try{
                let testKey = FileLib.read("soopyAddonsData", "apikey.txt")
                if(testKey){
                    if(this.verifyKey(testKey)){
                        this.module.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in old soopyaddons version!"])
                        return;
                    }else{
                        logger.logMessage("Found invalid key in soopyaddonsData", 3)
                    }
                }
            }catch(_){}

            //       HypixelApiKeyManager
            try{
                let testKey = JSON.parse(FileLib.read("HypixelApiKeyManager", "localdata.json")).key
                if(testKey){
                    if(this.verifyKey(testKey)){
                        this.module.apiKeySetting.setValue(testKey)
                        new Notification("§aSuccess!", ["Found api key in HypixelApiKeyManager!"])
                        return;
                    }else{
                        logger.logMessage("Found invalid key in HypixelApiKeyManager", 3)
                    }
                }
            }catch(_){}

            
            new Notification("§cUnable to find api key", [])
        }).start()
    }

    apiNewCommand(){
        ChatLib.command("api new")
    }

    verifyKey2(key){
        if(key){
            try{
                var url = "https://api.hypixel.net/key?key=" + key
                let data = JSON.parse(FileLib.getUrlContent(url))

                if(data.success){
                    return true
                }else{
                    return false
                }
            }catch(e){
                return false
            }
        }
        if(this.module.apiKeySetting.getValue() == ""){
            new Notification("§cError!", ["You need to set an api key first!"])
            return
        }

        
        new Thread(()=>{
            try{
                var url = "https://api.hypixel.net/key?key=" + this.module.apiKeySetting.getValue()
                let data = JSON.parse(FileLib.getUrlContent(url))

                if(data.success){
                    new Notification("§aSuccess!", ["Your api key is valid!"])
                    return
                }else{
                    new Notification("§cError!", ["Your api key is invalid!"])
                    return
                }
            }catch(e){
                new Notification("§cError!", ["Your api key is invalid!"])
                return
            }
        }).start()
    }

    newKey(key, event){
        ChatLib.chat(this.FeatureManager.messagePrefix + "Copied api key!")
        this.apiKeySetting.setValue(key)
    }

    onDisable(){
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