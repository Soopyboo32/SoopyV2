import { fetch } from "../../utils/networkUtils";

class HelpDataLoader {
    constructor() {
        this.availableHelpData = {}
        this.dataCach = {}

        fetch("http://soopymc.my.to/api/soopyv2/settingshelpoptions.json").json(data=>{
            Object.keys(data).forEach(category=>{
                this.availableHelpData[category] = new Set(data[category])
            });
        })
    }

    hasData(category, id){
        return this.availableHelpData[category] && this.availableHelpData[category].has(id)
    }

    getData(category, id, callback){
        if(!this.hasData(category, id)){
            callback("")
            return
        }

        if(this.dataCach[category] && this.dataCach[category][id]){
            callback(this.dataCach[category][id])
            return
        }

        fetch("http://soopymc.my.to/api/soopyv2/settingshelp/" + category + "/" + id).text(data=>{
            if(!this.dataCach[category]){
                this.dataCach[category] = {}
            }

            this.dataCach[category][id] = data

            callback(data)
        })
    }
}

if(!global.helpDataLoader){
    global.helpDataLoader = new HelpDataLoader();
}

export default global.helpDataLoader;