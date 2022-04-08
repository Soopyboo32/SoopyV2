class LocationSettingHolder {
    constructor() {
        this.data = [];
    }

    addLocationSetting(setting){
        this.data.push(setting)
    }

    getData(){
        return this.data
    }
}

if(!global.LocationSettingHolder){
    global.LocationSettingHolder = new LocationSettingHolder();
    
    register("gameUnload", ()=>{
        global.LocationSettingHolder = undefined
    })
}

export default global.LocationSettingHolder;