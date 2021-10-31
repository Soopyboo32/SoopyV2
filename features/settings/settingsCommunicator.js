//So features can add settings by adding to this class, then the gui will load data from this class
//this makes it so i can add settings before the settings gui is loaded
//and so that settings gui can still be dynamicly reloaded and not break things

class SettingsCommunicator {
    constructor(){
        this.settings = {}
    }

    addSetting(module, settingID, settingObject){
        if(!this.settings[module]) this.settings[module] = {}

        this.settings[module][settingID] = settingObject
    }
    removeSetting(module, settingID){
        if(!this.settings[module]) return;
        delete this.settings[module][settingID]
    }
    getSetting(module, settingID){
        return this.settings[module][settingID]
    }
    getModuleSettings(module){
        return Object.values(this.settings[module] || [])
    }
}

const settingsCommunicator = new SettingsCommunicator()

export default settingsCommunicator