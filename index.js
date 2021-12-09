/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

class SoopyAddons {
    constructor() {
        this.FeatureManager = require("./featureClass/featureManager.js")

        this.FeatureManager.parent = this
    }
}

if(FileLib.read("soopyAddonsData", "deletesoopyv1please.txt") === "true"){
    new Thread(()=>{
        Thread.sleep(2000)
        const File = Java.type("java.io.File")
        FileLib.deleteDirectory(new File("./config/ChatTriggers/modules/soopyAddons"))
    
        FileLib.write("soopyAddonsData", "deletesoopyv1please.txt", "false")
    
        ChatLib.command("ct reload", true)
    }).start()
}else{
    new SoopyAddons()
}