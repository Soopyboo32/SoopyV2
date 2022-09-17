if(!global.soopyaddonsv2metathing){
    global.soopyaddonsv2metathing = JSON.parse(FileLib.read("SoopyV2", "metadata.json"))
    
    register("gameUnload", ()=>{
        global.soopyaddonsv2metathing = undefined
    })
}

export default global.soopyaddonsv2metathing