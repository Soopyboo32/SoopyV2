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
    if(FileLib.read("soopyAddonsData", "firstload.txt") !== "true"){
        new Thread(()=>{
            ChatLib.chat("&7Loading SoopyV2 required modules...") //idk what to say to chat, but it requires an extra ct load after starting to load stuff like mappings (maby this should be part of mappings module, but i put it here so it doesent try to load the first load page thingo)
            FileLib.write("soopyAddonsData", "firstload.txt", "true")
            Thread.sleep(2000)
        
        
            ChatLib.command("ct reload", true)
        }).start()
    }else{
        new SoopyAddons()
    }
}