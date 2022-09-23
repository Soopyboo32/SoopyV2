class HelpDataLoader {
    constructor() {
        this.availableHelpData = {}
        this.dataCach = {}

        fetch("https://soopy.dev/api/soopyv2/settingshelpoptions.json").json().then(data => {
            Object.keys(data).forEach(category => {
                this.availableHelpData[category] = new Set(data[category])
            });
        })
    }

    hasData(category, id) {
        return this.availableHelpData[category] && this.availableHelpData[category].has(id)
    }

    async getData(category, id) {
        if (!this.hasData(category, id)) {
            return ""
        }

        if (this.dataCach[category] && this.dataCach[category][id]) {
            return this.dataCach[category][id]
        }

        let data = await fetch("https://soopy.dev/api/soopyv2/settingshelp/" + category + "/" + id).text()
        if (!this.dataCach[category]) {
            this.dataCach[category] = {}
        }

        this.dataCach[category][id] = data

        callback(data)
    }
}

if (!global.helpDataLoader) {
    global.helpDataLoader = new HelpDataLoader();

    register("gameUnload", () => {
        global.helpDataLoader = undefined
    })
}

export default global.helpDataLoader;