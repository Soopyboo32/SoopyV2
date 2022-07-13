/// <reference types="../../CTAutocomplete" />
/// <reference lib="es2015" />

class Feature {
    constructor() {
        this.FeatureManager = undefined
        this.events = {}
        this.customEvents = {}
        this.forgeEvents = {}
        this.soopyEvents = {}
        this.dynamicEvents = new Set()

        this.id = undefined

        this.enabled = false
    }

    setId(id) {
        this.id = id
    }
    getId() {
        return this.id
    }

    _onDisable() {
        Object.values(this.events).forEach(e => this.FeatureManager.unregisterEvent(e)) //calling parent unregister to avoid the set in unregister event
        Object.values(this.customEvents).forEach(e => this.FeatureManager.unregisterCustom(e)) //calling parent unregister to avoid the set in unregister event
        Object.values(this.forgeEvents).forEach(e => this.FeatureManager.unregisterForge(e)) //calling parent unregister to avoid the set in unregister event
        Object.values(this.soopyEvents).forEach(e => this.FeatureManager.unregisterSoopy(e)) //calling parent unregister to avoid the set in unregister event

        this.onDisable()

        this.events = {}
        this.customEvents = {}
        this.enabled = false

        this.dynamicEvents.clear()

        this.stepEvent.unregister()
    }

    _onEnable(parent) {
        this.FeatureManager = parent

        this.enabled = true

        this.stepEvent = this.registerStep(false, 5, () => {
            this.dynamicEvents.forEach(e => e.update())
        })

        this.onEnable()
    }

    onDisable() { }
    onEnable() { }

    registerEvent(event, func) {
        let theEvent = this.FeatureManager.registerEvent(event, func, this)

        this.events[theEvent.id] = theEvent

        return new CtEvent(theEvent, undefined, [event, func], this)
    }

    unregisterEvent(event) {
        this.FeatureManager.unregisterEvent(event)

        delete this.events[event.id]
    }
    registerSoopy(event, func) {
        let theEvent = this.FeatureManager.registerSoopy(event, func, this)

        this.soopyEvents[theEvent.id] = theEvent

        return new SoopyEvent(theEvent, undefined, [event, func], this)
    }

    unregisterSoopy(event) {
        this.FeatureManager.unregisterSoopy(event)

        delete this.soopyEvents[event.id]
    }

    registerForge(event, func, priority) {
        let theEvent
        try {
            theEvent = this.FeatureManager.registerForge(event, func, priority, this)
        } catch (e) {
            ChatLib.chat(this.FeatureManager.messagePrefix + "An error occured while registering the event " + event.class.toString().split(".").pop() + ", this may cause " + this.constructor.name + " to not work properly.")
        }
        if (theEvent) this.forgeEvents[theEvent.id] = theEvent

        return new ForgeEvent(theEvent, theEvent.trigger, [event, func, priority], this)
    }

    unregisterForge(event) {
        if (!event) return

        this.FeatureManager.unregisterForge(event)

        delete this.forgeEvents[event.id]
    }

    registerChat(criteria, func) {
        let theEvent = this.FeatureManager.registerChat(criteria, func, this)

        this.customEvents[theEvent.id] = theEvent

        return new CustomEvent(theEvent, theEvent.trigger, [criteria, func], this)
    }
    registerSoundPlay(criteria, func) {
        let theEvent = this.FeatureManager.registerSoundPlay(criteria, func, this)

        this.customEvents[theEvent.id] = theEvent

        return new CustomEvent(theEvent, theEvent.trigger, [criteria, func], this)
    }
    registerActionBar(criteria, func) {
        let theEvent = this.FeatureManager.registerActionBar(criteria, func, this)

        this.customEvents[theEvent.id] = theEvent

        return new CustomEvent(theEvent, theEvent.trigger, [criteria, func], this)
    }
    registerStep(isFps, interval, func) {
        let theEvent = this.FeatureManager.registerStep(isFps, interval, func, this)

        this.customEvents[theEvent.id] = theEvent

        return new CustomEvent(theEvent, theEvent.trigger, [isFps, interval, func], this)
    }

    registerCustom(event, func) {
        let theEvent = this.FeatureManager.registerCustom(event, func, this)

        this.customEvents[theEvent.id] = theEvent

        return new CustomEvent(theEvent, theEvent.trigger, [event, func], this)
    }

    registerCommand(name, func) {
        this.FeatureManager.commandFuncs[name] = func

        this.FeatureManager.registerCommand(name, (...args) => {
            if (this.FeatureManager.commandFuncs[name]) {
                this.FeatureManager.commandFuncs[name].call(this, ...(args || []))
            } else {
                ChatLib.chat(this.FeatureManager.messagePrefix + "This command is not available atm")
            }
        }, this)

        return new CommandEvent(name, undefined, [name, func], this)
    }
    unregisterCommand(name) {
        delete this.FeatureManager.commandFuncs[name]
    }

    unregisterCustom(event) {
        this.FeatureManager.unregisterCustom(event)

        delete this.customEvents[event.id]
    }

    createCustomEvent(eventId) {
        return this.FeatureManager.createCustomEvent(eventId)
    }
}

export default Feature

class Event {
    constructor(data, trigger, registerArgs = [], parent) {
        this.data = data
        this.trigger = trigger
        this.registerArgs = registerArgs
        this.parent = parent

        this.enabled = true

        this.when = undefined
    }

    update() {
        let shouldBeEnabled = !!this.when()
        if (this.enabled === shouldBeEnabled) return

        if (this.enabled) {
            this.unregister()
        } else {
            this.register()
        }
    }

    /**
     * Runs the function given as the argument every 5seconds
     * And will make sure that the event is only registered when the condition is true
     */
    registeredWhen(fun) {
        this.when = fun

        if (!fun()) {
            this.unregister()
        }

        this.parent.dynamicEvents.add(this)

        return this
    }

    register() {
        if (this.enabled) return

        this.enabled = true

        delay(0, () => {
            this.actuallyRegister()
        })
    }

    unregister() {
        if (!this.enabled) return

        this.enabled = false
        delay(0, () => {
            this.actuallyUnregister()
        })
    }

    actuallyRegister() { }

    actuallyUnregister() { }
}

class CtEvent extends Event {
    actuallyRegister() {
        let newEvent = this.parent.registerEvent(...this.registerArgs)
        this.data = newEvent.data
        this.trigger = newEvent.trigger
    }

    actuallyUnregister() {
        this.parent.unregisterEvent(this.data)
    }
}
class SoopyEvent extends Event {
    actuallyRegister() {
        let newEvent = this.parent.registerSoopy(...this.registerArgs)
        this.data = newEvent.data
        this.trigger = newEvent.trigger
    }

    actuallyUnregister() {
        this.parent.unregisterSoopy(this.data)
    }
}

class CommandEvent extends Event {
    actuallyRegister() {
        let newEvent = this.parent.registerCommand(...this.registerArgs)
        this.data = newEvent.data
        this.trigger = newEvent.trigger
    }

    actuallyUnregister() {
        this.parent.unregisterCommand(this.data)
    }
}

class ForgeEvent extends Event {
    actuallyRegister() {
        let newEvent = this.parent.registerForge(...this.registerArgs)
        this.data = newEvent.data
        this.trigger = newEvent.trigger
    }

    actuallyUnregister() {
        this.parent.unregisterForge(this.data)
    }
}

class CustomEvent extends Event {
    actuallyRegister() {
        let newEvent = this.trigger.register()
        this.data = newEvent.data
        this.trigger = newEvent.trigger
    }

    actuallyUnregister() {
        this.trigger.unregister()
    }
}
