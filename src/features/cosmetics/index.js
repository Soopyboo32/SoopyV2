/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import DragonWings from "./cosmetic/dragon/dragonWings"
import Toggle from "../settings/settingThings/toggle"
import { f } from "../../../mappings/mappings";
import FakeRequireToggle from "../settings/settingThings/FakeRequireToggle";
import DragonPet from "./cosmetic/pet/dragon/dragon";
import socketConnection from "../../socketConnection";
import CustomPetName from "./cosmetic/petName";

let cosmeticCommandName = {
    dragwings: "dragon_wings",
    dw: "dragon_wings",
    dp: "pet_dragon"
}

class Cosmetics extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()
        this.loadedCosmetics = []
        this.uuidToCosmetic = {}
        this.uuidToCosmeticDirect = {}

        this.cosmeticsData = {}

        this.hiddenEssentialCosmetics = []

        this.cosmeticsList = {
            "dragon_wings": DragonWings,
            "pet_dragon": DragonPet,
            "custom_pet_names": CustomPetName
        }

        this.playerHasACosmeticA = false

        this.firstPersonVisable = new Toggle("Cosmetics visable in first person", "", false, "cosmetics_first_person_visable", this)
        this.lessFirstPersonVisable = new Toggle("Make cosmetics less visable in first person mode", "", true, "cosmetics_first_person_less_visable", this).requires(this.firstPersonVisable)
        this.ownCosmeticAudio = new Toggle("Audio for own cosmetics", "", false, "cosmetics_own_audio", this)

        this.lastDragonWingsOn = false
        this.dragon_wings_enabled = new Toggle("Dragon Wings Toggle", "", true, "cosmetic_dragon_wings_toggle", this).requires(new FakeRequireToggle(false)).onchange(this, () => {
            if (this.dragon_wings_enabled.getValue() === this.lastDragonWingsOn) return
            global.soopyV2Server.updateCosmeticsData({
                cosmetic: "dragon_wings",
                type: this.dragon_wings_enabled.getValue() ? "enable" : "disable"
            })
            this.lastDragonWingsOn = this.dragon_wings_enabled.getValue()
        })

        this.postRenderEntityTrigger = undefined

        this.loadCosmeticsData()

        this.registerEvent("tick", this.tick)
        this.registerEvent("renderWorld", this.renderWorld)
        this.registerEvent("playerJoined", this.playerJoined)
        this.registerEvent("playerLeft", this.playerLeft)
        this.registerEvent("worldLoad", this.worldLoad)
        this.registerStep(false, 2, this.step)
        this.registerEvent('gameUnload', () => {
            if (this.postRenderEntityTrigger) {
                this.postRenderEntityTrigger.unregister()
                this.postRenderEntityTrigger = undefined
            }
        })

        this.registerCommand("soopycosmetics", this.cosmeticCommand)
        this.registerCommand("soopyc", this.cosmeticCommand)

        // this.registerStep(false, 60*10, ()=>{
        //     new Thread(()=>{this.loadCosmeticsData.call(this)}).start()
        // })
        // this.registerEvent("renderEntity", this.renderEntity)

        if (global.soopyV2Server && global.soopyV2Server.userCosmeticPermissions) {
            this.updateUserCosmeticPermissionSettings()
        }

        this.worldLoad()
    }

    cosmeticCommand(cosmetic, ...args) {
        let cosmeticId = cosmeticCommandName[cosmetic] || cosmetic

        let sCosmetic = this.uuidToCosmetic[cosmeticId][Player.getUUID().toString().replace(/-/g, "")]
        if (!sCosmetic) return

        sCosmetic.onCommand(...args)
    }

    updateUserCosmeticPermissionSettings() {
        if (!this.enabled) return

        if (global.soopyV2Server.userCosmeticPermissions === "*" || global.soopyV2Server.userCosmeticPermissions.dragon_wings) {
            this.dragon_wings_enabled.requiresO.set(true)
        } else {
            this.dragon_wings_enabled.requiresO.set(false)
        }
    }

    renderWorld(ticks) {
        for (let i = 0; i < this.loadedCosmetics.length; i++) {
            this.loadedCosmetics[i].onRenderEntity(ticks, false)
        }
    }

    async loadCosmeticsData() {
        let data = await fetch("https://soopy.dev/api/soopyv2/cosmetics.json").json()

        this.cosmeticsData = data
        this.playerHasACosmeticA = !!data[Player.getUUID().toString().replace(/-/g, "")]

        this.lastDragonWingsOn = data[Player.getUUID().toString().replace(/-/g, "")]?.dragon_wings?.enabled || false
        this.dragon_wings_enabled.setValue(this.lastDragonWingsOn)

        if (this.playerHasACosmeticA && !this.postRenderEntityTrigger) {
            // this.registerEvent("postRenderEntity", this.renderEntity)
            this.postRenderEntityTrigger = register("postRenderEntity", (entity, pos, ticks, event) => {
                if (ticks !== 1) return
                if (this.uuidToCosmeticDirect[entity.getUUID().toString().replace(/-/g, "")]) {
                    let cosmetics = Object.values(this.uuidToCosmeticDirect[entity.getUUID().toString().replace(/-/g, "")])
                    for (let cosmetic of cosmetics) {
                        cosmetic.onRenderEntity(ticks, true)
                    }
                }
            })
        }

        this.scanForNewCosmetics()
    }

    cosmeticsDataFromUser(uuid, cosmeticId, data) {
        let cosmetics = this.uuidToCosmeticDirect[uuid.replace(/-/g, "")]
        if (!cosmetics) return

        let cosmetic = cosmetics[cosmeticId]
        if (!cosmetic) return

        cosmetic.onCosmeticMessage(data)
    }

    setUserCosmeticsInformation(uuid, cosmetics) {
        if (!this.enabled) return
        uuid = uuid.replace(/-/g, "")

        this.loadedCosmetics = this.loadedCosmetics.filter(cosmetic => {
            if (cosmetic.player.getUUID().toString().replace(/-/g, "") === uuid) {
                return false
            }
            return true
        })
        Object.keys(this.uuidToCosmetic).forEach(cosmeticName => {
            delete this.uuidToCosmetic[cosmeticName][uuid]
        })

        delete this.uuidToCosmeticDirect[uuid]

        if (uuid.replace(/-/g, "") === Player.getUUID().toString().replace(/-/g, "")) {
            this.lastDragonWingsOn = cosmetics?.dragon_wings?.enabled || false
            this.dragon_wings_enabled.setValue(this.lastDragonWingsOn)
        }

        if (!cosmetics) {
            delete this.cosmeticsData[uuid]
            return
        }
        this.cosmeticsData[uuid] = cosmetics

        this.scanForNewCosmetics()
    }

    step() {
        this.scanForNewCosmetics()

        this.filterUnloadedCosmetics(false)

        this.restoreEssentialCosmetics()

        this.loadedCosmetics.forEach(c => {
            c.removeEssentialCosmetics()
        })
    }
    scanForNewCosmetics() {
        this.loadCosmeticsForPlayer(Player)
        World.getAllPlayers().forEach(p => {
            if (p.getUUID().toString().replace(/-/g, "") === Player.getUUID().toString().replace(/-/g, "")) return
            this.loadCosmeticsForPlayer(p)
        })
    }

    sendCosmeticsData(cosmeticId, data) {
        socketConnection.sendCosmeticsData(cosmeticId, data)
    }

    loadCosmeticsForPlayer(player) {
        let hasC = false

        Object.keys(this.cosmeticsList).forEach(cosmeticName => {
            if (!this.uuidToCosmetic[cosmeticName]) this.uuidToCosmetic[cosmeticName] = {}

            if (this.uuidToCosmetic[cosmeticName][player.getUUID().toString().replace(/-/g, "")]) {
                hasC = true
                return
            }

            if (this.shouldPlayerHaveCosmetic(player, cosmeticName)) {
                // console.log(player.getName(), cosmeticName)
                let cosmetic = new (this.cosmeticsList[cosmeticName])(player, this)
                this.loadedCosmetics.push(cosmetic)
                this.uuidToCosmetic[cosmeticName][player.getUUID().toString().replace(/-/g, "")] = cosmetic

                if (!this.uuidToCosmeticDirect[player.getUUID.toString()]) this.uuidToCosmeticDirect[player.getUUID().toString().replace(/-/g, "")] = {}
                this.uuidToCosmeticDirect[player.getUUID().toString().replace(/-/g, "")][cosmeticName] = cosmetic
            }
        })

        if (hasC && player.getUUID().toString() !== Player.getUUID().toString()) {
            socketConnection.pingSeesUser(player.getUUID().toString().replace(/-/g, ""))
        }
    }

    worldLoad() {
        this.loadedCosmetics = []
        this.uuidToCosmetic = {}
        this.uuidToCosmeticDirect = {}

        this.loadCosmeticsForPlayer(Player)
        this.scanForNewCosmetics()
    }

    playerJoined(player) {
        if (player.getUUID().toString().replace(/-/g, "") === Player.getUUID().toString().replace(/-/g, "")) return

        this.loadCosmeticsForPlayer(player)
    }

    playerLeft(playerName) {
        this.loadedCosmetics = this.loadedCosmetics.filter(cosmetic => {
            if (cosmetic.player.getUUID().toString().replace(/-/g, "") === Player.getUUID().toString().replace(/-/g, "")) return true
            if (cosmetic.player.getName() === playerName) {
                this.uuidToCosmetic[cosmetic.id][cosmetic.player.getUUID().toString().replace(/-/g, "")] = undefined

                this.uuidToCosmeticDirect[cosmetic.player.getUUID().toString().replace(/-/g, "")] = undefined
                return false
            }
            return true
        })
    }

    shouldPlayerHaveCosmetic(player, cosmetic) {
        if (this.getPlayerCosmeticSettings(player, cosmetic)) {
            if (!this.getPlayerCosmeticSettings(player, cosmetic).enabled) return false
            return true
        }
        return false
    }
    getPlayerCosmeticSettings(player, cosmetic) {
        return this.cosmeticsData[player.getUUID().toString().replace(/-/g, "")]?.[cosmetic]
    }

    filterUnloadedCosmetics(tick = false) {
        this.loadedCosmetics = this.loadedCosmetics.filter(cosmetic => {
            if (tick) cosmetic.onTick()
            if (cosmetic.player.getUUID().toString().replace(/-/g, "") === Player.getUUID().toString().replace(/-/g, "")) return true
            if (cosmetic.player.getPlayer()[f.isDead]) {  //filter out players that are no longer loaded
                this.uuidToCosmetic[cosmetic.id][cosmetic.player.getUUID().toString().replace(/-/g, "")] = undefined

                this.uuidToCosmeticDirect[cosmetic.player.getUUID().toString().replace(/-/g, "")] = undefined
                return false
            }
            return true
        })
    }

    tick() {
        for (let cosmetic of this.loadedCosmetics) {
            cosmetic.onTick()
        }
    }

    restoreEssentialCosmetics() {
        this.hiddenEssentialCosmetics.forEach(cosmetic => {
            setField(cosmetic, "showModel", true)
        })
        this.hiddenEssentialCosmetics = []
    }

    initVariables() {
        this.loadedCosmetics = undefined
        this.uuidToCosmetic = undefined
        this.uuidToCosmeticDirect = {}
        this.playerHasACosmeticA = undefined
        this.cosmeticsData = undefined
        this.hiddenEssentialCosmetics = undefined
        this.hiddenEssentialCosmetics = undefined
        this.cosmeticsList = undefined
    }

    onDisable() {

        if (this.postRenderEntityTrigger) {
            this.postRenderEntityTrigger.unregister()
            this.postRenderEntityTrigger = undefined
        }

        this.restoreEssentialCosmetics()

        this.initVariables()
    }
}

let instance = new Cosmetics()

module.exports = {
    class: instance
}

function setField(e, field, value) {

    let field2 = e.class.getDeclaredField(field);

    field2.setAccessible(true)

    return field2.set(e, value)
}