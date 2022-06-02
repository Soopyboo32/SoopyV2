import SoopyContentChangeEvent from "../../../../guimanager/EventListener/SoopyContentChangeEvent";
import SoopyMouseClickEvent from "../../../../guimanager/EventListener/SoopyMouseClickEvent";
import BoxWithText from "../../../../guimanager/GuiElement/BoxWithText";
import BoxWithTextAndDescription from "../../../../guimanager/GuiElement/BoxWithTextAndDescription"
import SoopyGuiElement from "../../../../guimanager/GuiElement/SoopyGuiElement";
import renderLibs from "../../../../guimanager/renderLibs";
import helpDataLoader from "../helpDataLoader";
import settingsCommunicator from "../settingsCommunicator";
import SoopyMarkdownElement from "../../../../guimanager/GuiElement/SoopyMarkdownElement";

class SettingBase {
    constructor(name, description, defaultVal, settingId, module) {
        this.name = name;
        this.description = description;
        this.defaultVal = defaultVal;
        this.settingId = settingId
        this.module = module
        this.moduleId = module.getId()

        this.contributorVal = undefined

        this.val = defaultVal;

        this.guiObject = new BoxWithTextAndDescription().setDesc("§0" + this.description.replace(/\n/g, "\n§0")).setText("§0" + this.name).setLocation(0, 0, 1, 0.175)

        this.settingObject = new SoopyGuiElement().setLocation(0.8, 0, 0.2, 1)

        this.guiObject.addChild(this.settingObject)

        this.helpButton = new BoxWithText().setText("§0?").setLocation(3, 3, 0.05, 0.5)
        this.helpButton.location.location.setRelative(false, false)

        this.helpButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            module.FeatureManager.features.soopyGui.class.openSidebarPage(new SoopyGuiElement().setLocation(0.05, 0.05, 0.9, 0.9).setScrollable(true).addChild(new SoopyMarkdownElement().setLocation(0, 0, 1, 1).setText("Loading...")))

            this.getHelp(helpText => {
                module.FeatureManager.features.soopyGui.class.openSidebarPage(new SoopyGuiElement().setLocation(0.05, 0.05, 0.9, 0.9).setScrollable(true).addChild(new SoopyMarkdownElement().setLocation(0, 0, 1, 1).setText(helpText)))
            })
        }))

        this.helpButton.setLore(["Click for more information about this setting"])

        settingsCommunicator.addSetting(this.moduleId, settingId, this)

        if (!module.FeatureManager.featureSettingsData[this.moduleId]) {
            module.FeatureManager.featureSettingsData[this.moduleId] = {}
        }
        if (!module.FeatureManager.featureSettingsData[this.moduleId].subSettings) module.FeatureManager.featureSettingsData[this.moduleId].subSettings = {}
        if (!module.FeatureManager.featureSettingsData[this.moduleId].subSettings[settingId]) {
            module.FeatureManager.featureSettingsData[this.moduleId].subSettings[settingId] = {
                value: this.getDefaultValue(),
                temp_val: this.getDefaultValue()
            }

            module.FeatureManager.featureSettingsDataLastUpdated = true
        }
        let temp_val_temp = module.FeatureManager.featureSettingsData[this.moduleId].subSettings[settingId].temp_val
        this.setValue(module.FeatureManager.featureSettingsData[this.moduleId].subSettings[settingId].value)
        this.temp_val = temp_val_temp

        this.requiresO = undefined

        this.onchangethings = []

        this.initTime = Date.now()
    }

    update() {
        if (this.hasHelp()) {
            this.guiObject.addChild(this.helpButton)

            this.guiObject.text.setLocation(0.075, 0, 0.8 - 0.075, 0.6)
        } else {
            this.guiObject.text.setLocation(0, 0, 0.8, 0.6)
        }
    }

    hasHelp() {
        return helpDataLoader.hasData(this.moduleId, this.settingId)
    }

    getHelp(callback) {
        helpDataLoader.getData(this.moduleId, this.settingId, callback)
    }

    getValue() {
        return this.val;
    }

    setValue(val) {
        if (this.val === val) return
        this.val = val;

        if (!this.requiresO || this.requiresO.getValue()) {
            this.temp_val = val
        }

        if (this.module.FeatureManager.featureSettingsData[this.moduleId].subSettings[this.settingId].value !== val) {
            this.module.FeatureManager.featureSettingsData[this.moduleId].subSettings[this.settingId].value = val

            this.module.FeatureManager.featureSettingsDataLastUpdated = true
        }
        if (this.module.FeatureManager.featureSettingsData[this.moduleId].subSettings[this.settingId].temp_val !== this.temp_val) {
            this.module.FeatureManager.featureSettingsData[this.moduleId].subSettings[this.settingId].temp_val = this.temp_val

            this.module.FeatureManager.featureSettingsDataLastUpdated = true
        }

        if (this.onchangethings && Date.now() - this.initTime > 1000) this.onchangethings.forEach(([fun, context]) => { fun.call(context) })
    }

    getName() {
        return this.name;
    }

    getDescription() {
        return this.description;
    }

    getDefaultValue() {
        return this.defaultVal;
    }

    getGuiObject() {
        return this.guiObject;
    }

    requires(toggleSetting) {
        this.requiresO = toggleSetting

        toggleSetting.toggleObject.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun) => {
            if (newVal) {
                this.guiObject.location.size.y.set(0.2, 500)
            } else {
                this.guiObject.location.size.y.set(0, 500)
            }
        }))
        let newVal = this.requiresO.getValue()
        if (!newVal) {
            this.guiObject.location.size.y.set(0, 0)
        }

        return this
    }

    contributor(name) {
        this.contributorVal = name
        //TODO: this entire function
        return this
    }

    delete() {
        settingsCommunicator.removeSetting(this.module, this.settingId)
    }

    onchange(context, fun) {
        this.onchangethings.push([fun, context])
        return this
    }
}

export default SettingBase