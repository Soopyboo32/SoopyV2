class LocationSettingHolder {
    constructor() {
        this.data = new Set();
    }

    addLocationSetting(setting) {
        this.data.add(setting)
    }

    removeLocationSetting(setting) {
        this.data.delete(setting)
    }

    getData() {
        return [...this.data]
    }
}

if (!global.LocationSettingHolder) {
    global.LocationSettingHolder = new LocationSettingHolder();

    register("gameUnload", () => {
        global.LocationSettingHolder = undefined
    })
}

export default global.LocationSettingHolder;