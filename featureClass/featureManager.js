/// <reference types="../../CTAutocomplete" />
/// <reference lib="es2015" />
const Instant = Java.type("java.time.Instant");
import logger from "../logger";
const File = Java.type("java.io.File")
import metadata from "../metadata.js"
import soopyV2Server from "../socketConnection";
import { fetch } from "../utils/networkUtils";
import NonPooledThread from "../utils/nonPooledThread";
import { setRendering } from "../utils/renderJavaUtils";
import { registerForge as registerForgeBase, unregisterForge as unregisterForgeBase } from "./forgeEvents.js"

const JSLoader = Java.type("com.chattriggers.ctjs.engine.langs.js.JSLoader")
const UrlModuleSourceProvider = Java.type("org.mozilla.javascript.commonjs.module.provider.UrlModuleSourceProvider")
const UrlModuleSourceProviderInstance = new UrlModuleSourceProvider(null, null)
const StrongCachingModuleScriptProviderClass = Java.type("org.mozilla.javascript.commonjs.module.provider.StrongCachingModuleScriptProvider")
let StrongCachingModuleScriptProvider = new StrongCachingModuleScriptProviderClass(UrlModuleSourceProviderInstance)
let CTRequire = new JSLoader.CTRequire(StrongCachingModuleScriptProvider)

const System = Java.type("java.lang.System")

let loadedModules = new Set()
let shouldRequireForceNoCache = true

function RequireNoCache(place) {
    if (!shouldRequireForceNoCache) {
        if (!logger.isDev) return require(place)
        if (!loadedModules.has(place)) {
            loadedModules.add(place)
            return require(place) //performance optimisation
        }
    }

    StrongCachingModuleScriptProvider = new StrongCachingModuleScriptProviderClass(UrlModuleSourceProviderInstance)
    CTRequire = new JSLoader.CTRequire(StrongCachingModuleScriptProvider)
    return CTRequire(place)
}

class FeatureManager {
    constructor() {

        this.isDev = logger.isDev

        this.messagePrefix = "&6[SOOPY V2]&7 "
        this.enabled = true //make triggers work with this context

        this.features = {};
        this.events = {}
        this.eventObjects = {}
        this.soopyEventHandlers = {}

        this.parent = undefined

        this.finishedLoading = false

        this.commandFuncs = {}

        this.lastEventId = 0

        this.customEvents = {}
        this.lastChatEventId = 0

        this.forgeEvents = {}
        this.lastForgeEventId = 0

        this.lastSoopyEventId = 0

        this.featureSettingsDataLastUpdated = false

        //PERFORMANCE RECORDING
        this.recordingPerformanceUsage = false
        this.performanceUsage = {} //{<moduleName>: {<event>: {time: 0, count: 0}}}
        this.flameGraphData = []

        this.longEventTime = 20

        this.perfTrackingFeatures = false
        this.stack = []


        this.featureMetas = {}

        this.featureSettingsData = {}

        let fetchD = fetch("http://soopy.dev/api/soopyv2/ping").async(d => {
            if (fetchD.responseCode() >= 400 || fetchD.responseCode() === -1) {
                ChatLib.chat(this.messagePrefix + "&cError: Could not connect to Soopy's server. This may cause issues with some features but will (hopefully) be back soon.")
            }

            new Thread(() => {
                this.loadSoopy()
            }).start()
        }, true)

        this.registerStep(false, 30, () => {
            if (this.featureSettingsDataLastUpdated) {
                new Thread(() => {
                    this.saveFeatureSettings()
                }).start()
            }
        }, this)

        this.registerEvent("worldUnload", this.saveFeatureSettings, this)

        this.registerEvent("gameUnload", () => {
            this.saveFeatureSettings()
            this.unloadAllFeatures()

            this.enabled = false
        }, this)

        if (this.isDev) {
            this.registerStep(true, 2, () => {
                if (this.reloadModuleTime !== 0 && Date.now() - this.reloadModuleTime > 0) {
                    new Thread(() => {
                        this.reloadModuleTime = 0
                        this.reloadingModules.forEach(m => {
                            this.unloadFeature(m)
                        })
                        this.reloadingModules.forEach(m => {
                            this.loadFeature(m)
                        })
                        this.reloadingModules.clear()
                    }).start()
                }
            }, this)

            this.watches = {}
            this.addedWatches = new Set()
            this.watchService = Java.type("java.nio.file.FileSystems").getDefault().newWatchService();
            this.reloadingModules = new Set()
            this.reloadModuleTime = 0
            new NonPooledThread(() => {
                while (this.enabled) {
                    key = this.watchService.take();
                    let moduleToReload = this.watches[key]
                    if (this.features[moduleToReload] && !this.reloadingModules.has(moduleToReload)) { //if enabled && not alr in queue
                        this.reloadingModules.add(moduleToReload)
                        this.reloadModuleTime = Date.now() + 5000
                    }
                    key.pollEvents()/*.forEach(event=>{
                    logger.logMessage(event.context().toString(), 1)
                })*/
                    key.reset();
                }
            }).start()
        }

        this.registerCommand("soopyunloadfeature", (args) => {
            new Thread(() => {
                this.unloadFeature(args)
            }).start()
        }, this)
        this.registerCommand("soopyloadfeature", (args) => {
            new Thread(() => {
                this.loadFeature(args)
            }).start()
        }, this)
        this.registerCommand("soopyunload", () => {
            new Thread(() => {
                this.unloadSoopy()
            }).start()
        }, this)
        this.registerCommand("soopyload", () => {
            new Thread(() => {
                this.loadSoopy()
            }).start()
        }, this)
        this.registerCommand("soopyreload", () => {
            new Thread(() => {
                this.unloadSoopy()
                this.loadSoopy()
            }).start()
        }, this)
        this.registerCommand("soopyreloadfeature", (args) => {
            new Thread(() => {
                this.unloadFeature(args)

                this.loadFeature(args)
            }).start()
        }, this)
        this.registerCommand("soopysetlongeventtime", (args) => {
            this.longEventTime = parseInt(args)
        }, this)
        this.registerCommand("soopylaginformation", (args) => {
            this.loadPerformanceData()
        }, this)
        this.registerCommand("soopylaginformationfast", (args) => {
            this.loadPerformanceDataFast()
        }, this)
    }

    getId() {
        return "FeatureManager"
    }
    loadPerformanceDataFast() {
        new Thread(() => {
            this.loadEventLag(true)
        }).start()
    }

    loadPerformanceData() {
        new Thread(() => {
            ChatLib.chat(this.messagePrefix + "Recording performance impact, this will take around 60 seconds to complete!")
            shouldRequireForceNoCache = true
            let eventLagData = this.loadEventLag()
            ChatLib.chat(this.messagePrefix + "ETA: 40s")
            this.perfTrackingFeatures = true
            this.unloadSoopy()
            this.loadSoopy()
            Thread.sleep(1000)
            let eventLagDataFull = this.loadEventLag()
            this.perfTrackingFeatures = false
            this.unloadSoopy()
            this.loadSoopy()
            Thread.sleep(1000)
            ChatLib.chat(this.messagePrefix + "ETA: 25s")
            let forgeLagData = this.loadForgeRenderLag()
            ChatLib.chat(this.messagePrefix + "ETA: 15s")
            let soopyLagData = this.loadSoopyLag()

            let lagData = {
                eventLagDataFull,
                eventLagData,
                forgeLagData,
                soopyLagData
            }

            shouldRequireForceNoCache = false
            let url = this.reportLagData(lagData)
            ChatLib.chat(this.messagePrefix + "Done!")
            new TextComponent(this.messagePrefix + "See the report at " + url).setClick("open_url", url).setHover("show_text", "Click to open the report.").chat()


            this.performanceUsage = {}
            this.flameGraphData = []
        }).start()
    }

    reportLagData(data) {
        return fetch("http://soopy.dev/soopy/submitlag", { postData: data }).text()
    }

    loadSoopyLag() {
        // ChatLib.chat(this.messagePrefix + "Recording All Soopy Lag...")
        let framesWith = 0
        let framesWithOut = 0
        let event = this.registerEvent("renderWorld", () => {
            framesWith++
        }, this)

        Thread.sleep(5000)
        this.unregisterEvent(event)

        this.unloadSoopy()
        Thread.sleep(1000)
        event = this.registerEvent("renderWorld", () => {
            framesWithOut++
        }, this)

        Thread.sleep(5000)
        this.unregisterEvent(event)

        // ChatLib.chat(this.messagePrefix + "Soopy Lag:")
        // ChatLib.chat("&eFps without Soopy: &7" + (framesWithOut / 5))
        // ChatLib.chat("&eFps with Soopy: &7" + (framesWith / 5))

        this.loadSoopy()

        return {
            fpsWith: (framesWith / 5),
            fpsWithout: (framesWithOut / 5)
        }
    }

    loadForgeRenderLag() {
        // ChatLib.chat(this.messagePrefix + "Recording Forge-Rendering Lag...")
        let framesWith = 0
        let framesWithOut = 0
        let renderingForge = true
        let event = this.registerEvent("renderWorld", () => {
            if (renderingForge) {
                framesWith++
            } else {
                framesWithOut++
            }
        }, this)

        for (let i = 0; i < 10; i++) {
            Thread.sleep(1000)
            renderingForge = !renderingForge
            setRendering(renderingForge)
        }
        this.unregisterEvent(event)

        // ChatLib.chat(this.messagePrefix + "Forge Lag:")
        // ChatLib.chat("&eFps without forge: &7" + (framesWithOut / 5))
        // ChatLib.chat("&eFps with forge: &7" + (framesWith / 5))
        return {
            fpsWith: (framesWith / 5),
            fpsWithout: (framesWithOut / 5)
        }
    }

    loadEventLag(sendMessage = false) {
        this.recordingPerformanceUsage = true
        this.performanceUsage = {}
        this.flameGraphData = []
        if (sendMessage) ChatLib.chat(this.messagePrefix + "Recording Event Lag...")

        Thread.sleep(10000)

        let totalMsGlobal = 0
        this.recordingPerformanceUsage = false
        if (sendMessage) {
            ChatLib.chat(this.messagePrefix + "Event Lag:")
            Object.keys(this.performanceUsage).sort((a, b) => {
                let totalMsA = 0
                Object.keys(this.performanceUsage[a]).forEach((event) => {
                    totalMsA += this.performanceUsage[a][event].time
                })
                let totalMsB = 0
                Object.keys(this.performanceUsage[b]).forEach((event) => {
                    totalMsB += this.performanceUsage[b][event].time
                })

                return totalMsA - totalMsB
            }).forEach((moduleName) => {
                let totalMs = 0
                let totalCalls = 0
                Object.keys(this.performanceUsage[moduleName]).forEach((event) => {
                    totalMs += this.performanceUsage[moduleName][event].time
                    totalCalls += this.performanceUsage[moduleName][event].count
                })

                totalMsGlobal += totalMs

                ChatLib.chat("&eModule: &7" + moduleName)
                ChatLib.chat("&eTotal: &7" + totalMs.toFixed(2) + "ms (" + totalCalls + " calls)")
                Object.keys(this.performanceUsage[moduleName]).sort((a, b) => { return this.performanceUsage[moduleName][a].time - this.performanceUsage[moduleName][b].time }).forEach((event) => {
                    ChatLib.chat("  &eEvent:&7 " + event + " - " + this.performanceUsage[moduleName][event].time.toFixed(2) + "ms (" + this.performanceUsage[moduleName][event].count + " calls) [" + ((this.performanceUsage[moduleName][event].time / this.performanceUsage[moduleName][event].count).toFixed(2)) + "ms avg]")
                })
            })

            ChatLib.chat("&eTotal: &7" + totalMsGlobal.toFixed(2) + "ms")
        }
        return { performanceUsage: this.performanceUsage, flameGraphData: this.flameGraphData }
    }

    loadFeatureSettings() {
        logger.logMessage("Loading settings", 4)

        let data = FileLib.read("soopyAddonsData", "soopyaddonsbetafeaturesdata.json")

        if (!data) {
            this.loadDefaultFeatureSettings();
            return;
        }

        data = JSON.parse(data)

        this.featureSettingsData = data

        this.ensureNewSettingsExist()
    }

    saveFeatureSettings() {
        if (!this.featureSettingsDataLastUpdated) return

        FileLib.write("soopyAddonsData", "soopyaddonsbetafeaturesdata.json", JSON.stringify(this.featureSettingsData))

        this.featureSettingsDataLastUpdated = false

        logger.logMessage("Saved settings", 4)
    }

    loadDefaultFeatureSettings() {
        Object.keys(this.featureMetas).forEach((feature) => {
            this.featureSettingsData[feature] = {
                enabled: this.featureMetas[feature].defaultEnabled,
                subSettings: {}
            }
        })

        this.featureSettingsDataLastUpdated = true

        logger.logMessage("Loaded default settings", 4)
    }

    ensureNewSettingsExist() {
        Object.keys(this.featureMetas).forEach((feature) => {
            if (!this.featureSettingsData[feature]) {
                this.featureSettingsData[feature] = {
                    enabled: this.featureMetas[feature].defaultEnabled,
                    subSettings: {}
                }
                this.featureSettingsDataLastUpdated = true
                logger.logMessage("Loaded default settings for " + feature, 4)
            }
        })
    }

    startCatchingEvent(event) {
        if (this.eventObjects[event]) return

        //SBA compatability or something (removed)
        // if(event === "renderOverlay"){
        //     let lastPartialTick = undefined
        //     this.eventObjects[event] = register(event, (...args)=>{
        //         let pTicks = Tessellator.getPartialTicks()
        //         if(pTicks !== lastPartialTick){
        //             lastPartialTick = pTicks
        //             this.triggerEvent(event, args)
        //         }
        //     })
        // }else{

        this.eventObjects[event] = register(event, (...args) => {
            // let start = Date.now()
            this.triggerEvent(event, args)
            // this.eventTimingData[event] = (this.eventTimingData[event] || 0)+(Date.now()-start)
        })
        //}

        logger.logMessage("Registered " + event + " event", 4)
    }

    triggerEvent(event, args) {
        if (this.events[event]) {
            try {
                for (Event of Object.values(this.events[event])) {
                    if (Event.context.enabled) {
                        if (this.recordingPerformanceUsage) this.startRecordingPerformance(Event.context.getId(), event)
                        let start = Date.now()
                        Event.func.call(Event.context, ...args)
                        let time = Date.now() - start
                        if (time > this.longEventTime) {
                            logger.logMessage("Long event triggered [" + time + "ms] (" + Event.context.getId() + "/" + event + ")", 3)
                        }
                        if (this.recordingPerformanceUsage) this.stopRecordingPerformance(Event.context.getId(), event)
                    }
                }
            } catch (e) {
                logger.logMessage("Error in " + event + " event: " + JSON.stringify(e, undefined, 2), 2)
                logger.logMessage(e.stack, 1)

                soopyV2Server.reportError(e, "Error in " + event + " event.")
            }
        }
    }
    triggerSoopy(event, args) {
        if (this.soopyEventHandlers[event]) {
            try {
                for (Event of Object.values(this.soopyEventHandlers[event])) {
                    if (Event.context.enabled) {
                        if (this.recordingPerformanceUsage) this.startRecordingPerformance(Event.context.getId(), event)
                        let start = Date.now()
                        Event.func.call(Event.context, ...args)
                        let time = Date.now() - start
                        if (time > this.longEventTime) {
                            logger.logMessage("Long event triggered [" + time + "ms] (" + Event.context.getId() + "/" + event + ")", 3)
                        }
                        if (this.recordingPerformanceUsage) this.stopRecordingPerformance(Event.context.getId(), event)
                    }
                }
            } catch (e) {
                logger.logMessage("Error in soopy " + event + " event: " + JSON.stringify(e, undefined, 2), 2)
                logger.logMessage(e.stack, 1)
                soopyV2Server.reportError(e, "Error in soopy " + event + " event.")
            }
        }
    }

    stopCatchingEvent(event) {
        if (!this.eventObjects[event]) return

        this.eventObjects[event].unregister()
        delete this.eventObjects[event]
        delete this.events[event]
        logger.logMessage("Unregistered " + event + " event", 4)
    }

    registerEvent(event, func, context) {
        if (!this.events[event]) {
            this.events[event] = []
            this.startCatchingEvent(event)
        }

        let theEvent = {
            func: func,
            context: context,
            id: this.lastEventId++,
            event: event
        }
        this.events[event].push(theEvent)

        return theEvent
    }
    registerSoopy(event, func, context) {
        if (!this.soopyEventHandlers[event]) {
            this.soopyEventHandlers[event] = []
        }

        let theEvent = {
            func: func,
            context: context,
            id: this.lastSoopyEventId++,
            event: event
        }
        this.soopyEventHandlers[event].push(theEvent)

        return theEvent
    }

    registerChat(criteria, func, context) {
        let event = this.registerCustom("chat", func, context)

        event.trigger.setChatCriteria(criteria)

        return event
    }

    registerSoundPlay(criteria, func, context) {
        let event = this.registerCustom("soundPlay", func, context)

        event.trigger.setCriteria(criteria)

        return event
    }

    registerActionBar(criteria, func, context) {

        let event = this.registerCustom("actionBar", func, context)

        event.trigger.setChatCriteria(criteria)

        return event
    }
    registerCommand(commandName, func, context, completions) {

        let event = this.registerCustom("command", func, context)

        event.trigger.setName(commandName, true)
        
        if (completions) event.trigger.setName(commandName, true).setTabCompletions(completions)

        return event
    }
    registerStep(isFps, interval, func, context) {
        let event = this.registerCustom("step", func, context)

        event.trigger[isFps ? "setFps" : "setDelay"](interval)

        return event
    }

    registerCustom(type, func, context) {
        let id = this.lastChatEventId++

        if (!func) throw new Error("Function must not be null")

        this.customEvents[id] = {
            func: func,
            context: context,
            trigger: register(type, (...args) => {
                try {
                    if (context.enabled) {
                        if (this.recordingPerformanceUsage) this.startRecordingPerformance(context.getId(), type)
                        let start = Date.now()
                        func.call(context, ...(args || []))
                        let time = Date.now() - start
                        if (time > this.longEventTime) {
                            logger.logMessage("Long event triggered [" + time + "ms] (" + context.getId() + "/" + type + ")", 3)
                        }
                        if (this.recordingPerformanceUsage) this.stopRecordingPerformance(context.getId(), type)
                    }
                } catch (e) {
                    logger.logMessage("Error in " + type + " event: " + JSON.stringify(e, undefined, 2), 2)
                    logger.logMessage(e.stack, 1)

                    soopyV2Server.reportError(e, "Error in " + type + " event.")
                }
            }),
            id: id
        }

        return this.customEvents[id]
    }

    registerForge(event, func, priority, context) {
        let id = this.lastForgeEventId++

        this.forgeEvents[id] = {
            func: func,
            context: context,
            trigger: registerForgeBase(event, priority, (...args) => {
                try {
                    if (context.enabled) {
                        if (this.recordingPerformanceUsage) this.startRecordingPerformance(context.getId(), event.class.name)
                        let start = Date.now()
                        func.call(context, ...(args || []))
                        let time = Date.now() - start
                        if (time > this.longEventTime) {
                            logger.logMessage("Long (forge) event triggered (" + context.getId() + "/" + event.class.toString() + ")", 3)
                        }
                        if (this.recordingPerformanceUsage) this.stopRecordingPerformance(context.getId(), event.class.name)
                    }
                } catch (e) {
                    logger.logMessage("Error in " + event.class.toString() + " (forge) event: " + JSON.stringify(e, undefined, 2), 2)
                    logger.logMessage(e.stack, 1)

                    soopyV2Server.reportError(e, "Error in " + event.class.toString() + " (forge) event.")
                }
            }),
            id: id
        }

        return this.forgeEvents[id]
    }

    unregisterForge(event) {
        if (!this.forgeEvents[event.id]) return
        unregisterForgeBase(this.forgeEvents[event.id].trigger)
        delete this.forgeEvents[event.id]
    }

    unregisterCustom(event) {
        event.trigger.unregister()

        delete this.customEvents[event.id]
    }

    unregisterEvent(event) {
        if (!this.events[event.event]) return

        this.events[event.event] = this.events[event.event].filter((e) => {
            return e.id !== event.id
        })

        if (this.events[event.event].length === 0) {
            this.stopCatchingEvent(event.event)
            delete this.events[event.event]
        }
    }

    unregisterSoopy(event) {
        if (!this.soopyEventHandlers[event.event]) return

        this.soopyEventHandlers[event.event] = this.soopyEventHandlers[event.event].filter((e) => {
            return e.id !== event.id
        })

        if (this.soopyEventHandlers[event.event].length === 0) {
            delete this.events[event.event]
        }
    }

    loadFeatureMetas() {
        let featuresDir = new File("./config/ChatTriggers/modules/" + metadata.name + "/features")

        featuresDir.list().forEach((pathName) => {
            if (pathName.includes(".")) return;

            try {
                let data = JSON.parse(FileLib.read(metadata.name + "/features/" + pathName, "metadata.json"))
                if (data === null) {
                    return;
                }
                data.id = pathName
                this.featureMetas[pathName] = data
            } catch (e) {
                logger.logMessage("Error loading feature metadata for " + pathName, 1)
                logger.logMessage(JSON.stringify(e, undefined, 2), 1)
            }
        })
    }

    addPerformanceTracking(feature) {
        let featureId = feature.getId()
        if (!this.perfTrackingFeatures) return

        Object.getOwnPropertyNames(Object.getPrototypeOf(feature)).forEach(key => {
            if (typeof (feature[key]) === "function") {
                let fun = feature[key].bind(feature)
                feature[key] = (...args) => {
                    if (!this.recordingPerformanceUsage || Thread.currentThread().getId() !== 1 || !this.perfTrackingFeatures) {
                        let err = undefined
                        try {
                            args ? fun(...args) : fun()
                        } catch (e) {
                            err = e
                        }
                        if (err) throw err
                        return
                    }

                    let pushedId = false
                    let start = this.getExactTime()

                    if (this.stack.length === 0) {
                        this.stack.push([featureId, 0])
                        // this.flameGraphData.push({ isEnter: true, thing: featureId, time: start })
                        pushedId = true
                    }
                    this.stack.push([featureId + "." + key, 0])

                    // this.flameGraphData.push({ isEnter: true, thing: featureId + "." + key, time: start })
                    let err = undefined
                    try {
                        args ? fun(...args) : fun()
                    } catch (e) {
                        err = e
                    }
                    let nowTime = this.getExactTime()
                    let time = (nowTime - start) - this.stack[this.stack.length - 1][1]

                    this.stack[this.stack.length - 2][1] += nowTime - start

                    if (!this.performanceUsage[featureId]) this.performanceUsage[featureId] = {}
                    if (!this.performanceUsage[featureId].functions) this.performanceUsage[featureId].functions = {}
                    if (!this.performanceUsage[featureId].functions[key]) this.performanceUsage[featureId].functions[key] = { time: 0, count: 0 }
                    this.performanceUsage[featureId].functions[key].count++
                    this.performanceUsage[featureId].functions[key].time += nowTime - start

                    this.flameGraphData.push(this.stack.map(a => a[0]).join(";") + " " + (time))
                    this.stack.pop()[1]
                    if (pushedId) {
                        let time = (nowTime - start) - this.stack[this.stack.length - 1][1]
                        this.flameGraphData.push(this.stack.map(a => a[0]).join(";") + " " + (time))
                        this.stack.pop()
                    }

                    if (err) throw err
                }
            }
        })
    }

    unloadSoopy() {
        this.saveFeatureSettings()
        this.unloadAllFeatures()
    }

    loadSoopy() {
        this.loadFeatureMetas()

        this.loadFeatureSettings()

        Object.keys(this.featureMetas).forEach((feature) => {
            if (this.featureSettingsData[feature] && this.featureSettingsData[feature].enabled) {
                this.loadFeature(feature)
            }
        })

        this.finishedLoading = true
    }

    loadFeature(feature) { //run in seperate thread so onenable can do network requests
        if (this.features[feature]) return

        try {

            let LoadedFeature = RequireNoCache("../features/" + feature + "/index.js")
            // let LoadedFeature = RequireNoCache(new File("config/ChatTriggers/modules/" + metadata.name + "/features/" + feature + "/index.js"))

            this.features[feature] = LoadedFeature

            LoadedFeature.class.setId(feature)

            this.addPerformanceTracking(LoadedFeature.class)

            LoadedFeature.class._onEnable(this)

            logger.logMessage("Loaded feature " + feature, 3)

            if (this.isDev && !this.addedWatches.has(feature)) {
                this.addedWatches.add(feature)
                let path = Java.type("java.nio.file.Paths").get("./config/ChatTriggers/modules/SoopyV2/features/" + feature + "/");
                this.watches[path.register(this.watchService, Java.type("java.nio.file.StandardWatchEventKinds").ENTRY_MODIFY)] = feature
            }
        } catch (e) {
            logger.logMessage("Error loading feature " + feature, 1)
            logger.logMessage(JSON.stringify(e, undefined, 2), 1)
            logger.logMessage(e.stack, 1)
            ChatLib.chat(this.messagePrefix + "Error loading feature " + feature)

            soopyV2Server.reportError(e, "Error loading feature " + feature)
        }

        return this
    }

    unloadFeature(feature) {
        if (!this.features[feature]) return

        this.features[feature].class._onDisable()

        delete this.features[feature]

        logger.logMessage("Unloaded feature " + feature, 3)

        return this
    }

    unloadAllFeatures() {
        Object.keys(this.features).forEach((feature) => {
            this.unloadFeature(feature)
        })
    }

    isFeatureLoaded(feature) {
        return !!this.features[feature]
    }

    getLoadedFeatures() {
        return Object.keys(this.features)
    }

    createCustomEvent(eventId) {
        logger.logMessage("Registered custom " + eventId + " event", 4)

        return {
            trigger: (...args) => {
                this.triggerSoopy(eventId, args)
            }
        }
    }

    getExactTime() {
        return System.nanoTime() / 1000000
    }
    startRecordingPerformance(feature, event) {
        if (!this.recordingPerformanceUsage) return

        if (!this.performanceUsage[feature]) this.performanceUsage[feature] = {}
        if (!this.performanceUsage[feature][event]) this.performanceUsage[feature][event] = { time: 0, count: 0 }

        let time = this.getExactTime()

        this.performanceUsage[feature][event].startTime = time
    }
    stopRecordingPerformance(feature, event) {
        if (!this.recordingPerformanceUsage) return

        let time = this.getExactTime()

        this.performanceUsage[feature][event].time += (time - this.performanceUsage[feature][event].startTime)
        this.performanceUsage[feature][event].count++
    }
}

if (!global.soopyv2featuremanagerthing) {
    global.soopyv2featuremanagerthing = new FeatureManager()
    register("gameUnload", () => {
        global.soopyv2featuremanagerthing = undefined
    })
}
export default global.soopyv2featuremanagerthing
