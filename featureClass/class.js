/// <reference types="../../CTAutocomplete" />
/// <reference lib="es2015" />

class Feature {
    constructor(){
        this.FeatureManager = undefined
        this.events = {}
        this.customEvents = {}
        this.forgeEvents = {}
        this.soopyEvents = {}

        this.id = undefined

        this.enabled = false
    }

    setId(id){
        this.id = id
    }
    getId(){
        return this.id
    }

    _onDisable(){
        Object.values(this.events).forEach(e=>this.FeatureManager.unregisterEvent(e)) //calling parent unregister to avoid the set in unregister event
        Object.values(this.customEvents).forEach(e=>this.FeatureManager.unregisterCustom(e)) //calling parent unregister to avoid the set in unregister event
        Object.values(this.forgeEvents).forEach(e=>this.FeatureManager.unregisterForge(e)) //calling parent unregister to avoid the set in unregister event
        Object.values(this.soopyEvents).forEach(e=>this.FeatureManager.unregisterSoopy(e)) //calling parent unregister to avoid the set in unregister event

        this.onDisable()
        
        this.events = {}
        this.customEvents = {}
        this.enabled = false
    }

    _onEnable(parent){
        this.FeatureManager = parent

        this.enabled = true

        this.onEnable()
    }

    onDisable(){}
    onEnable(){}

    registerEvent(event, func){
        let theEvent = this.FeatureManager.registerEvent(event, func, this)

        this.events[theEvent.id] = theEvent

        return theEvent
    }

    unregisterEvent(event){
        this.FeatureManager.unregisterEvent(event)

        delete this.events[event.id]
    }
    registerSoopy(event, func){
        let theEvent = this.FeatureManager.registerSoopy(event, func, this)

        this.soopyEvents[theEvent.id] = theEvent

        return theEvent
    }

    unregisterSoopy(event){
        this.FeatureManager.unregisterSoopy(event)

        delete this.soopyEvents[event.id]
    }

    registerForge(event, func){
        let theEvent = this.FeatureManager.registerForge(event, func, this)

        this.forgeEvents[theEvent.id] = theEvent

        return theEvent
    }

    unregisterForge(event){
        this.FeatureManager.unregisterForge(event)

        delete this.forgeEvents[event.id]
    }

    registerChat(criteria, func){
        let theEvent = this.FeatureManager.registerChat(criteria, func, this)

        this.customEvents[theEvent.id] = theEvent

        return theEvent
    }
    registerActionBar(criteria, func){
        let theEvent = this.FeatureManager.registerActionBar(criteria, func, this)

        this.customEvents[theEvent.id] = theEvent

        return theEvent
    }
    registerStep(isFps, interval, func){
        let theEvent = this.FeatureManager.registerStep(isFps, interval, func, this)

        this.customEvents[theEvent.id] = theEvent

        return theEvent
    }

    registerCustom(event, func){
        let theEvent = this.FeatureManager.registerCustom(event, func, this)

        this.customEvents[theEvent.id] = theEvent

        return theEvent
    }

    registerCommand(name, func){
        this.FeatureManager.commandFuncs[name] = func

        this.FeatureManager.registerCommand(name, (...args)=>{
            if(this.FeatureManager.commandFuncs[name]){
                this.FeatureManager.commandFuncs[name].call(this, ...(args || []))
            }else{
                ChatLib.chat(this.FeatureManager.messagePrefix + "This command is not available atm")
            }
        }, this)
    }
    unregisterCommand(name){
        delete this.FeatureManager.commandFuncs[name]
    }

    unregisterCustom(event){
        this.FeatureManager.unregisterCustom(event)

        delete this.customEvents[event.id]
    }

    createCustomEvent(eventId){
        return this.FeatureManager.createCustomEvent(eventId)
    }
}

export default Feature