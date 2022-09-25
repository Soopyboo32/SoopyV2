/// <reference types="../../CTAutocomplete" />

import NonPooledThread from "./utils/nonPooledThread.js"
/// <reference lib="es2015" />

if (net.minecraftforge.fml.common.Loader.isModLoaded("soopyv2forge")) {
    new NonPooledThread(() => {
        while (!Java.type("me.soopyboo32.soopyv2forge.SoopyV2Forge").INSTANCE) {
            Thread.sleep(1000)
        }

        Java.type("me.soopyboo32.soopyv2forge.SoopyV2Forge").INSTANCE.soopyIsInstalled()
    }).start()
}

class SoopyAddons {
    constructor() {
        this.FeatureManager = require("./featureClass/featureManager.js")

        this.FeatureManager.parent = this
    }
}

let a = register("worldLoad", () => {
    new SoopyAddons()

    a.unregister()
})