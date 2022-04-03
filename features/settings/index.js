/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import TextWithArrow from "../../../guimanager/GuiElement/TextWithArrow";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import BoxWithToggleAndDescription from "../../../guimanager/GuiElement/BoxWithToggleAndDescription";
import ButtonWithArrowAndDescription from "../../../guimanager/GuiElement/ButtonWithArrowAndDescription";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent";
import SoopyOpenGuiEvent from "../../../guimanager/EventListener/SoopyOpenGuiEvent";
import settingsCommunicator from "./settingsCommunicator";
import GuiPage from "../soopyGui/GuiPage"
import { SoopyRenderEvent } from "../../../guimanager";
import TextBox from "../../../guimanager/GuiElement/TextBox";


class SettingsRenderer extends Feature {
    constructor() {
        super()

        this.gui = undefined

        this.pages = []
        this.currentPage = 0
        this.backButton = undefined
        this.settingsCategoryArea = undefined
        this.settingsTitle = undefined
        this.settingsArea = undefined
        this.modifyingFeature = false
        this.featureLoadedTextBox = undefined

        this.SettingPage = undefined
    }

    onEnable(){

        this.SettingPage = new SettingPage()
        this.SettingPage.FeatureManager = this.FeatureManager

        return;
    }

    onDisable(){
        this.SettingPage = undefined
        return;
        this.gui.delete()

        this.pages = []
        this.currentPage = 0
        this.backButton = undefined
        this.settingsArea = undefined
        this.settingsTitle = undefined
        this.settingsCategoryArea = undefined
        this.modifyingFeature = false
        this.featureLoadedTextBox = undefined
    }

    clickedOpenSettings(){


        this.goToPage(1)
    }

    clickedBackButton(){
        this.goToPage(this.currentPage-1)
    }

    goToPage(pageNum, animate=true){
        pageNum = Math.max(0, Math.min(pageNum, this.pages.length-1))
        
        if(pageNum == this.currentPage){
            return
        }

        this.currentPage = pageNum

        this.pages.forEach((p, i)=>{
            p.forEach(e=>{
                e.location.location.x.set(i-pageNum, animate?1000:0)
            })
        })

        this.backButton.location.location.y.set(pageNum === 0?-0.2:0, animate?1000:0)
    }
}

class SettingPage extends GuiPage {
    constructor(){
        super(10)
        
        this.name = "Settings"

        this.pages = [this.newPage(), this.newPage()]

        this.settingsCategoryArea = undefined
        this.settingsTitle = undefined
        this.settingsArea = undefined
        this.modifyingFeature = false
        this.featureLoadedTextBox = undefined

        this.SettingPage = undefined

        this.pages[0].addEvent(new SoopyRenderEvent().setHandler(()=>{this.updateLocs()}))

        //###############################################################################################
        //                                     Settings Category Page
        //###############################################################################################

        
        let settingsCategoryTitle = new SoopyTextElement().setText("§0Settings").setMaxTextScale(3).setLocation(0.1, 0.05, 0.5, 0.1)
        this.pages[0].addChild(settingsCategoryTitle)

        this.settingsCategorySearch = new TextBox().setPlaceholder("Search...").setLocation(0.6, 0.05, 0.3, 0.1)
        this.pages[0].addChild(this.settingsCategorySearch)

        this.settingsCategorySearch.text.addEvent(new SoopyContentChangeEvent().setHandler(()=>{
            this.updateSettingCategories()
        }))

        this.settingsCategoryArea = new SoopyGuiElement().setLocation(0.1, 0.2, 0.8, 0.8).setScrollable(true)
        this.pages[0].addChild(this.settingsCategoryArea)


        //###############################################################################################
        //                                     Settings Page
        //###############################################################################################

        this.settingsTitle = new SoopyTextElement().setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1)
        this.pages[1].addChild(this.settingsTitle)

        this.settingsArea = new SoopyGuiElement().setLocation(0.1, 0.2, 0.8, 0.8).setScrollable(true)
        this.pages[1].addChild(this.settingsArea)


        this.finaliseLoading()
    }

    onOpen(){
        this.updateSettingCategories()
        this.settingsCategoryArea.location.scroll.x.set(0, 0)
        this.settingsCategoryArea.location.scroll.y.set(0, 0)
        this.settingsCategoryArea._scrollAmount = 0

        this.settingsCategorySearch.setText("")
        this.updateSettingCategories()
    }

    onOpenPage(p){
        if(p===1) this.updateSettingCategories()

        this.closeSidebarPage()
    }

    updateSettingCategories(){

        let search = this.settingsCategorySearch.text.text

        this.settingsCategoryArea.children = []

        let height = 0

        Object.keys(this.FeatureManager.featureMetas).sort((a, b)=>{return a.sortA-b.sortA}).forEach((f)=>{

            let meta = this.FeatureManager.featureMetas[f]

            let showing = search.length === 0

            if(!showing){
                showing = meta.name.toLowerCase().includes(search.toLowerCase()) || meta.description.toLowerCase().includes(search.toLowerCase())
            }

            if(!showing){
                settingsCommunicator.getModuleSettings(f).forEach(setting=>{

                    if(setting && (setting.name.toLowerCase().includes(search.toLowerCase()) || setting.description.toLowerCase().includes(search.toLowerCase()))){
                        showing = true
                    }
                })
            }

            if(!showing) return

            let isHidden = meta.isHidden
            if(typeof isHidden === "string"){
                isHidden = require("../" + f + "/" + isHidden).hidden(this.FeatureManager)
            }
            if(isHidden) return

            let category = new ButtonWithArrowAndDescription().setText("&0" + meta.name).setDesc("&0" +meta.description).setLocation(0, height, 1, 0.2)
            category.addEvent(new SoopyMouseClickEvent().setHandler(()=>{this.clickedOpenCategory(f)}))

            this.settingsCategoryArea.addChild(category)

            height+=0.225

            
            if(search.length > 0){
                settingsCommunicator.getModuleSettings(f).forEach(setting=>{

                    if(setting && (setting.name.toLowerCase().includes(search.toLowerCase()) || setting.description.toLowerCase().includes(search.toLowerCase()))){

                        setting.getGuiObject().location.location.y.set(height, 0)
                        this.settingsCategoryArea.addChild(setting.getGuiObject())
            
                        height += 0.025+setting.getGuiObject().location.size.y.get()

                        setting.update()
                    }
                })
            }
        })


        // this.FeatureManager.features = {}; enabled features
    }

    updateSettings(category){
        let meta = this.FeatureManager.featureMetas[category]

        this.settingsArea.children = []

        this.settingsTitle.setText("&0" + this.FeatureManager.featureMetas[category].name)

        let height = 0

        if(meta.isTogglable){
            let toggle = new BoxWithToggleAndDescription().setLocation(0, height, 1, 0.2).setText("&0Main toggle").setDesc("&0This is the main toggle for the whole category")
            this.settingsArea.addChild(toggle)

            toggle.toggle.setValue(this.FeatureManager.isFeatureLoaded(category), 0)

            toggle.toggle.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun)=>{
                //dont allow editing if currenately loading/unloading it
                if(this.modifyingFeature){
                    resetFun()
                    return
                }

                //toggle the feature
                this.modifyingFeature = true
                new Thread(()=>{
                    this.FeatureManager.featureSettingsData[category].enabled = newVal
                    this.FeatureManager.featureSettingsDataLastUpdated = true

                    if(!newVal && this.FeatureManager.isFeatureLoaded(category)){
                        this.FeatureManager.unloadFeature(category)
                    }
                    if(newVal && !this.FeatureManager.isFeatureLoaded(category)){
                        this.FeatureManager.loadFeature(category)
                    }

                    Thread.sleep(100)

                    this.modifyingFeature = false
                    
                    this.updateSettings(category)
                }).start()
            }))
            height += toggle.location.size.y.get()+0.045
        }

        if(!this.FeatureManager.isFeatureLoaded(category)){

            //only show if feature issnt loaded

            let textBox = new SoopyBoxElement().setLocation(0, height, 1, 0.2)
            .addChild(new SoopyTextElement().setText("&0Feature not loaded").setLocation(0, 0, 1, 0.5))
            .addChild(new SoopyTextElement().setText("&0Load feature to access settings").setLocation(0, 0.5, 1, 0.5))
            this.settingsArea.addChild(textBox)
            return;
        }

        settingsCommunicator.getModuleSettings(category).forEach(setting=>{
            setting.getGuiObject().location.location.y.set(height, 0)
            this.settingsArea.addChild(setting.getGuiObject())

            height += 0.045+setting.getGuiObject().location.size.y.get()
            
            setting.update()
        })
    }

    updateLocs(){
        let totalHeight = 0

        this.settingsArea.children.forEach(e=>{
            e.location.location.y.set(totalHeight, 0)

            totalHeight += e.location.size.y.get()+Math.min(0.045,e.location.size.y.get())
        })

        totalHeight = 0

        this.settingsCategoryArea.children.forEach(e=>{
            e.location.location.y.set(totalHeight, 0)

            totalHeight += e.location.size.y.get()+Math.min(0.025,e.location.size.y.get())
        })
    }

    clickedOpenCategory(category){
        this.updateSettings(category)
        this.goToPage(2)

        this.settingsArea.location.scroll.x.set(0, 0)
        this.settingsArea.location.scroll.y.set(0, 0)
        this.settingsArea._scrollAmount = 0
    }
}

module.exports = {
    class: new SettingsRenderer()
}