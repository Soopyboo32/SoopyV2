/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import SoopyNumber from "../../../guimanager/Classes/SoopyNumber";
import Feature from "../../featureClass/class";
import { m } from "../../../mappings/mappings";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";
import HudTextElement from "./HudTextElement";
import DropdownSetting from "../settings/settingThings/dropdownSetting";
import { getLevelByXp } from "../../utils/statUtils";
import { firstLetterCapital } from "../../utils/stringUtils";
import renderLibs from "../../../guimanager/renderLibs";

const ProcessBuilder = Java.type("java.lang.ProcessBuilder")
const Scanner = Java.type("java.util.Scanner")

class Hud extends Feature {
    constructor() {
        super()
    }

    initVariables() {

        this.hudElements = []

        this.fpsElement = undefined
        this.cpsElement = undefined
        this.soulflowElement = undefined
        this.petElement = undefined
        this.fpsEnabledSetting = undefined
        this.cpsEnabledSetting = undefined
        this.soulflowEnabledSetting = undefined
        this.soulflowShowWarningSetting = undefined
        this.soulflowShowWhen0Setting = undefined
        this.petEnabledSetting = undefined
        this.fpsFastSetting = undefined
        this.fpsLowSetting = undefined
        this.cpsSeperate = undefined
        this.cpsIncludeRight = undefined

        this.petLevels = undefined

        this.lastTickTime = undefined
        this.framesSince = undefined
        this.lastframe = undefined
        this.Instant = undefined

        this.lastFrameRates = undefined

        this.fps = undefined
        this.lowFps = undefined

        this.slowestFrameTime = undefined
        this.lastFrameRatesS = undefined
        this.numberUtils = undefined

        this.petText = undefined

        this.lastWitherImpact = undefined
        this.aup = undefined
        this.lastTickEventEpochTimestamp = undefined
        this.lastAbsorbtion = undefined
        this.impactTest = undefined
    }

    onEnable() {
        this.initVariables()

        this.numberUtils = require("../../utils/numberUtils.js")

        this.fpsEnabledSetting = new ToggleSetting("Fps enabled", "Whether the fps is rendered onto the screen", true, "fps_enabled", this)
        this.fpsFastSetting = new ToggleSetting("Fast fps update", "Whether the fps is updated fast instead of once per second", true, "fps_fast", this).requires(this.fpsEnabledSetting)
        this.fpsLowSetting = new ToggleSetting("Low fps display", "Display the minumum frame time next to fps (usefull for finding framedrops)", true, "fps_low", this).requires(this.fpsFastSetting)

        this.fpsElement = new HudTextElement()
            .setToggleSetting(this.fpsEnabledSetting)
            .setLocationSetting(new LocationSetting("Show FPS", "Allows you to edit the location of the fps text", "fps_location", this, [10, 10, 1, 1])
                .requires(this.fpsEnabledSetting))
        this.hudElements.push(this.fpsElement)

        this.cpsEnabledSetting = new ToggleSetting("Show CPS", "Whether the cps is rendered onto the screen", true, "cps_enabled", this)
        this.cpsIncludeRight = new ToggleSetting("CPS include right click", "Whether right clicks are shown in the CPS", true, "cps_right", this).requires(this.cpsEnabledSetting)
        this.cpsSeperate = new ToggleSetting("CPS seperate right", "Seperates right clicks from left clicks", true, "cps_seperate", this).requires(this.cpsIncludeRight)

        this.cpsElement = new HudTextElement()
            .setToggleSetting(this.cpsEnabledSetting)
            .setLocationSetting(new LocationSetting("Cps Location", "Allows you to edit the location of the cps text", "cps_location", this, [10, 20, 1, 1])
                .requires(this.cpsEnabledSetting))
        this.hudElements.push(this.cpsElement)

        this.petEnabledSetting = new ToggleSetting("Show Current Pet", "Whether the current pet is rendered onto the screen", true, "pet_enabled", this)
        this.petElement = new HudTextElement()
            .setToggleSetting(this.petEnabledSetting)
            .setLocationSetting(new LocationSetting("Pet Location", "Allows you to edit the location of the pet text", "pet_location", this, [10, 30, 1, 1])
                .requires(this.petEnabledSetting)
                .editTempText("&6Pet&7> &7[Lvl 100] &aEnderman"))
        this.hudElements.push(this.petElement)

        this.soulflowEnabledSetting = new ToggleSetting("Show Soulflow", "Whether the soulflow count is rendered onto the screen", true, "soulflow_enabled", this)
        this.soulflowShowWarningSetting = new ToggleSetting("Show no Talisman Warning", "Shows a warning if you dont have a soulflow talis in ur inv", true, "soulflow_notalis_warning", this).requires(this.soulflowEnabledSetting)
        this.soulflowShowWhen0Setting = new ToggleSetting("Show When 0 Soulflow", "If this is off it wont render when you have 0 soulflow", true, "soulflow_showwhen_0", this).requires(this.soulflowEnabledSetting)
        this.soulflowElement = new HudTextElement()
            .setToggleSetting(this.soulflowEnabledSetting)
            .setLocationSetting(new LocationSetting("Soulflow Location", "Allows you to edit the location of the soulflow text", "soulflow_location", this, [10, 40, 1, 1])
                .requires(this.soulflowEnabledSetting)
                .editTempText("&6Soulflow&7> &f12,345"))
        this.hudElements.push(this.soulflowElement)

        this.witherImpactCooldownSetting = new ToggleSetting("Show Wither Impact Cooldown", "This will render a small cooldown above your crosshair", true, "wither_impact_cooldown_enabled", this)

        this.guidedSheepCooldownSetting = new ToggleSetting("Show Guided Sheep / Explosive Shot Cooldown", "This will render a small cooldown below your crosshair", true, "guided_sheep_cooldown_enabled", this)

        this.showSpotifyPlaying = new ToggleSetting("Show Current Playing Spotify Song", "(WINDOWS + Spotify Desktop only)", false, "spotify_now_playing", this)
        this.spotifyElement = new HudTextElement()
            .setText("&6Spotify&7> ")
            .setBaseEditWidth(Renderer.getStringWidth("Spotify> ") + 150)
            .setToggleSetting(this.showSpotifyPlaying)
            .setLocationSetting(new LocationSetting("Spotify Location", "Allows you to edit the location of the spotify text", "spotify_now_playing_location", this, [10, 80, 1, 1])
                .requires(this.showSpotifyPlaying)
                .editTempText("&6Spotify&7> &cNot open"))
        this.spotifyElement2 = new HudTextElement().setToggleSetting(this.showSpotifyPlaying).setLocationSetting({
            setParent: () => { },
            x: this.spotifyElement.locationSetting.x + this.spotifyElement.getWidth(),
            y: this.spotifyElement.locationSetting.y,
            scale: this.spotifyElement.locationSetting.scale,
            shadowType: this.spotifyElement.locationSetting.shadowType
        })

        let hudStatTypes = {
            "cata": "Catacombs level + Exp",
            "totaldeaths": "Total deaths"
        }

        this.skillLevelCaps = {
            "experience_skill_combat": 60,
            "experience_skill_foraging": 50,
            "experience_skill_farming": 60,
            "experience_skill_fishing": 50,
            "experience_skill_alchemy": 50,
            "experience_skill_enchanting": 60,
            "experience_skill_mining": 60,
            "experience_skill_taming": 50,
        };

        Object.keys(this.skillLevelCaps).forEach(skill => {
            hudStatTypes[skill] = firstLetterCapital(skill.split("_").pop()) + " level + Exp"
        })

        hudStatTypes.completions_enterance = "Enterance completions"
        for (let i = 1; i < 8; i++) {
            hudStatTypes["completions_floor_" + i] = "Floor " + i + " completions"
        }
        for (let i = 1; i < 8; i++) {
            hudStatTypes["completions_master_" + i] = "Master " + i + " completions"
        }
        for (let i = 1; i < 8; i++) {
            hudStatTypes["completions_dungeon_" + i] = "Dungeon " + i + " completions"
        }

        this.hudStat = []
        for (let i = 0; i < 5; i++) {
            this.hudStat[i] = {}
            this.hudStat[i].enabled = new ToggleSetting("Hud Stat Slot #" + (i + 1), "Allows you to render a custom stat on your hud", false, "hud_stat_" + i, this)
            this.hudStat[i].type = new DropdownSetting("Hud Stat Slot #" + (i + 1) + " Type", "The type of stat to render", "weight", "hud_stat_" + i + "_type", this, hudStatTypes)
            this.hudStat[i].location = new LocationSetting("Hud Stat Slot #" + (i + 1) + " Location", "Allows you to edit the location of the hud stat", "hud_stat_" + i + "_location", this, [10, 50 + i * 10, 1, 1]).editTempText("&6Hud Stat&7> &f12,345")
            this.hudStat[i].textElement = new HudTextElement().setToggleSetting(this.hudStat[i].enabled).setLocationSetting(this.hudStat[i].location).setText("&6Hud Stat&7> &fLoading...")
            this.hudStat[i].onlySb = new ToggleSetting("Hud Stat Slot #" + (i + 1) + " Only SB", "Only render this stat when you are in skyblock", true, "hud_stat_" + i + "_only_sb", this).requires(this.hudStat[i].enabled)

            this.hudStat[i].location.requires(this.hudStat[i].enabled)
            this.hudStat[i].type.requires(this.hudStat[i].enabled)
            if (this.hudStat[i - 1]) {
                this.hudStat[i].enabled.requires(this.hudStat[i - 1].enabled)
            }
        }


        // this.showDragonDamages = new ToggleSetting("Show dragon damages", "This will render the top 3 damages + your damage during a dragon fight", true, "dragon_dmg_enable", this).requires(this.soulflowEnabledSetting)
        // this.dragonDamageElement = new HudTextElement()
        //     .setToggleSetting(this.showDragonDamages)
        //     .setLocationSetting(new LocationSetting("Damage Location", "Allows you to edit the location of the damage leaderboard", "dragon_dmg_location", this, [50, 40, 1, 1])
        //         .requires(this.showDragonDamages)
        //         .editTempText("Test Line 1\nTest line 2\nTest line 3\nTest line 4 (longer KEKW)"))
        // this.hudElements.push(this.dragonDamageElement)

        this.step_5second()

        this.lastTickTime = 0
        this.framesSince = 0
        this.lastframe = 0
        this.slowestFrameTime = 0

        this.lastSwappedPet = 0

        this.lastWitherImpact = 0
        this.aup = 0
        this.lastTickEventEpochTimestamp = 0
        this.lastAbsorbtion = 0
        this.impactTest = false

        this.lastUpdatedStatData = 0

        this.lastStatData = undefined

        this.lastFrameRates = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        this.lastFrameRatesS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

        this.Instant = Java.type("java.time.Instant");

        this.fps = new SoopyNumber(0)
        this.lowFps = new SoopyNumber(0)

        this.registerEvent("renderOverlay", this.renderHud)
        this.registerStep(true, 5, this.step)
        this.registerStep(false, 5, this.step_5second)
        this.registerEvent("renderWorld", this.renderWorld)
        this.registerEvent("worldLoad", this.worldLoad)

        this.petLevels = {}
        this.petText = "&6Pet&7> &fLoading..."
        this.petElement.setText(this.petText)
        this.registerChat("&cAutopet &eequipped your ${pet}&e! &a&lVIEW RULE&r", (pet) => {
            this.petElement.setText("&6Pet&7> " + pet)
            this.petText = "&6Pet&7> " + pet

            this.lastSwappedPet = Date.now()
        })
        this.registerChat("&r&aYou summoned your &r${pet}&r&a!&r", (pet) => {
            this.petElement.setText("&6Pet&7> &7[Lvl " + (this.petLevels[pet.replace("&", "§")] || "??") + "] " + pet)
            this.petText = "&6Pet&7> &7[Lvl " + (this.petLevels[pet.replace("&", "§")] || "??") + "] " + pet

            this.lastSwappedPet = Date.now()
        })
        this.registerChat("&r&aYou despawned your &r${*}&r&a!&r", () => {
            this.petElement.setText("&6Pet&7> &cNone")
            this.petText = "&6Pet&7> &cNone"

            this.lastSwappedPet = Date.now()
        })
        this.registerChat("&r&aYour &r${pet} &r&alevelled up to level &r&9${level}&r&a!&r", (pet, level) => {
            this.petElement.setText("&6Pet&7> &7[Lvl " + (level || "??") + "] " + pet)
            this.petText = "&6Pet&7> &7[Lvl " + (level || "??") + "] " + pet

            this.lastSwappedPet = Date.now()
        })

        this.registerSoopy("apiLoad", this.apiLoad)
        if (this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock) {
            this.apiLoad(this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock, "skyblock", true, true)

            this.lastSwappedPet = Date.now()
        }
        if (this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock_raw) {
            this.apiLoad(this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock_raw, "skyblock", false, true)
        }

        new Thread(() => { //TODO: dont create this thread if you have the feature disabled
            while (this.enabled) {
                this.updateSpotify()
                Thread.sleep(5000)
            }
        }).start()

        this.registerActionBar("${m}", this.actionbarMessage)
    }

    onDisable() {
        this.fpsEnabledSetting.delete()
        this.fpsFastSetting.delete()
        this.cpsEnabledSetting.delete()

        this.initVariables()
    }

    renderHud() {
        if (this.fpsFastSetting.getValue()) {
            if (this.fpsLowSetting.getValue()) {
                this.fpsElement.setText("&6Fps&7> &f" + Math.round(this.fps.get()) + "&7/" + Math.round(this.lowFps.get()))
            } else {
                this.fpsElement.setText("&6Fps&7> &f" + Math.round(this.fps.get()))
            }
        }

        for (let element of this.hudElements) {
            element.render()
        }

        if (this.showSpotifyPlaying.getValue() && Date.now() - this.spotifyElement.tempDisableTime > 100) {
            let scale = this.spotifyElement.locationSetting.scale
            let spotifyWidth1 = this.spotifyElement.getWidth() * scale
            this.spotifyElement.render()
            this.spotifyElement2.locationSetting.x = this.spotifyElement.locationSetting.x + spotifyWidth1
            this.spotifyElement2.locationSetting.y = this.spotifyElement.locationSetting.y
            this.spotifyElement2.locationSetting.scale = scale
            this.spotifyElement2.locationSetting.shadowType = this.spotifyElement.locationSetting.shadowType

            let spotifyWidth2 = this.spotifyElement2.getWidth() * scale
            if (spotifyWidth2 > 150 * scale) {
                let w2 = spotifyWidth2 / scale - 150
                let offX = (Date.now() / 50) % (w2 * 2 + 100)
                offX = Math.max(0, offX - 50)
                if (offX > w2 + 50) {
                    offX = w2 - (offX - w2 - 50)
                } else if (offX > w2) {
                    offX = w2
                }
                this.spotifyElement2.locationSetting.x = this.spotifyElement.locationSetting.x + spotifyWidth1 - offX * scale

                renderLibs.scizzorFast(this.spotifyElement.locationSetting.x + spotifyWidth1, this.spotifyElement2.locationSetting.y, 150 * scale, this.spotifyElement2.getHeight() * scale)
                this.spotifyElement2.render()
                renderLibs.stopScizzor()
            } else {
                this.spotifyElement2.render()
            }
        }

        if (this.witherImpactCooldownSetting.getValue() && Date.now() - this.lastWitherImpact < 10000) {
            Renderer.drawString(Math.max(0, Math.ceil((5000 - (Date.now() - this.lastWitherImpact)) / 1000)) + "s", Renderer.screen.getWidth() / 2 - Renderer.getStringWidth(Math.max(0, Math.ceil((5000 - (Date.now() - this.lastWitherImpact)) / 1000)) + "s") / 2, Renderer.screen.getHeight() / 2 - 15)
        }

        for (let stat of this.hudStat) {
            stat.textElement.render()
        }
    }

    renderWorld() {
        if (!this.fpsEnabledSetting.getValue() || !this.fpsFastSetting.getValue()) return
        this.framesSince++

        let instant = this.Instant.now()
        let time = instant.getEpochSecond() + (instant.getNano() / 1000000000);

        let thisframeTime = time - this.lastFrame

        if (thisframeTime > this.slowestFrameTime) {
            this.slowestFrameTime = thisframeTime
        }

        this.lastFrame = time
    }

    actionbarMessage(m) {
        if (ChatLib.removeFormatting(m).includes("(Wither Impact)")) {
            if (Date.now() - this.aup < 750) {
                this.lastWitherImpact = Date.now()
                this.aup = 0
            } else {
                this.impactTest = Date.now()
            }
        }
    }

    step() {
        if (!Player.getPlayer()) return
        this.updateHudThingos()
        let fps = 0

        if (this.fpsEnabledSetting.getValue() && this.fpsFastSetting.getValue()) {
            //set fps to fast fps
            // console.log(`${this.framesSince} ${this.lastFrame-this.lastTickTime}`)
            fps = this.framesSince / (this.lastFrame - this.lastTickTime)
            if (this.lastFrame === this.lastTickTime) fps = 0
            this.lastTickTime = this.lastFrame
            this.framesSince = 0

            this.lastFrameRates.push(fps)
            this.lastFrameRates.shift()

            if (this.slowestFrameTime > 0) {
                this.lastFrameRatesS.push(1 / this.slowestFrameTime)
            } else {
                this.lastFrameRatesS.push(0)
            }
            this.lastFrameRatesS.shift()
            this.slowestFrameTime = 0

            fps = this.lastFrameRates.reduce((a, b) => a + b, 0) / this.lastFrameRates.length
            this.fps.set(fps, 200)
            if (this.fpsLowSetting.getValue()) this.lowFps.set(this.lastFrameRatesS.reduce((a, b) => a + b, 0) / this.lastFrameRatesS.length, 200)
        } else {
            fps = Client.getFPS()
            this.fpsElement.setText("&6Fps&7> &f" + fps)
        }

        let cpsText = CPS.getLeftClicksAverage()

        if (this.cpsIncludeRight.getValue()) {
            if (this.cpsSeperate.getValue()) {
                cpsText += "&7 | &f" + CPS.getRightClicksAverage()
            } else {
                cpsText += CPS.getRightClicksAverage()
            }
        }
        this.cpsElement.setText("&6Cps&7> &f" + cpsText)

        //Scan opened inventory for all pet levels
        if (Player && Player.getContainer() && Player.getContainer().getName().includes(") Pets")) {
            let inv = Player.getContainer().getItems()
            for (let i = 0; i < inv.length; i++) {
                if (inv[i] != null && inv[i].getName().includes("[Lvl ")) {
                    let level = inv[i].getName().split(" ")[1].replace("]", "")
                    if (!this.petLevels[inv[i].getName().split("] ")[1]] || this.petLevels[inv[i].getName().split("] ")[1]] < level) this.petLevels[inv[i].getName().split("] ")[1]] = level

                    if (Date.now() - this.lastSwappedPet > 1000) {
                        inv[i].getLore().forEach(line => {
                            if (line.includes("Click to despawn.")) {
                                this.petElement.setText("&6Pet&7> &7" + inv[i].getName().split("(")[0])
                                this.petText = "&6Pet&7> &7" + inv[i].getName().split("(")[0]
                            }
                        })
                    }
                }
            }
        }

        if (Player.getPlayer()[m.getAbsorptionAmount]() > this.lastAbsorbtion) {
            if (Date.now() - this.impactTest < 750) {
                this.lastWitherImpact = Date.now()
                this.impactTest = 0
            } else {
                this.aup = Date.now()
            }
        }
        this.lastAbsorbtion = Player.getPlayer()[m.getAbsorptionAmount]()
    }

    step_5second() {
        if (!this.soulflowEnabledSetting.getValue()) return
        if (!Player.getPlayer()) return
        if (!Player.getInventory()) return

        if (!this.FeatureManager.features["dataLoader"].class.isInSkyblock) {
            this.soulflowElement.setText("")
            this.petElement.setText("")
            return
        } else {
            this.petElement.setText(this.petText)
        }

        let soulflowCount = 0
        let hasSoulflowItem = false
        Player.getInventory().getItems().forEach(i => {

            let id;
            try {
                id = i.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getString("id")
            } catch (e) { }

            if (id === "SOULFLOW_PILE" || id === "SOULFLOW_BATTERY" || id === "SOULFLOW_SUPERCELL") {
                //soulflowCount
                i.getLore().forEach(line => {
                    if (line.startsWith("§5§o§7Internalized:")) {
                        hasSoulflowItem = true
                        soulflowCount = parseInt(ChatLib.removeFormatting(line).substr("Internalized: ".length).split("⸎")[0].replace(/,/g, ""))
                    }
                })
            }
        })
        if (!hasSoulflowItem) {
            if (this.soulflowShowWarningSetting.getValue()) {
                this.soulflowElement.setText("&6Soulflow&7> &cNO TALISMAN")
            } else {
                this.soulflowElement.setText("")
            }
            return;
        }
        if (soulflowCount > 0 && !this.soulflowShowWhen0Setting.getValue()) {
            this.soulflowElement.setText("")
            return;
        }

        this.soulflowElement.setText("&6Soulflow&7> &f" + this.numberUtils.numberWithCommas(soulflowCount))
    }

    statApiLoadThingo(data) {
        data.profiles.forEach(p => {
            if (!this.lastStatData || (p.members[Player.getUUID().toString().replace(/-/g, "")] && p.members[Player.getUUID().toString().replace(/-/g, "")].last_save > this.lastStatData.last_save)) {
                this.lastStatData = p.members[Player.getUUID().toString().replace(/-/g, "")]
            }
        })

        this.updateHudThingos()
    }

    updateSpotify() {
        if (!this.showSpotifyPlaying.getValue()) return

        let currentSong = "&cNot open"
        let spotifyProcesses = []
        let process = new ProcessBuilder("tasklist.exe", "/fo", "csv", "/nh").start();
        let sc = new Scanner(process.getInputStream());
        if (sc.hasNextLine()) sc.nextLine();
        while (sc.hasNextLine()) {
            let line = sc.nextLine();
            let parts = line.replace("\"", "").split("\",\"");
            let unq = parts[0]
            let pid = parts[1]
            if (unq === "Spotify.exe") {
                spotifyProcesses.push(pid)
                // console.log(parts.join(" "));
            }
        }
        process.waitFor();

        while (spotifyProcesses.length > 0) {
            let pid = spotifyProcesses.pop()
            // console.log("Loading pid " + pid)
            let process = new ProcessBuilder("tasklist.exe", "/FO", "csv", "/V", "/FI", "\"PID eq " + pid + "\"").start();
            let sc = new Scanner(process.getInputStream());
            if (sc.hasNextLine()) sc.nextLine();
            while (sc.hasNextLine()) {
                let line = sc.nextLine();
                let parts = line.replace("\"", "").split("\",\"");
                let song = parts[parts.length - 1].substr(0, parts[parts.length - 1].length - 1)
                if (song === "N/A") continue

                if (song === "Spotify Free" || song === "Spotify Premium" || song === "AngleHiddenWindow") {
                    currentSong = "&cPaused"
                } else {
                    if (song === "Spotify") song = "Advertisement"
                    currentSong = "&a" + song.replace(/&/g, "&⭍").replace(" - ", " &7-&b ")
                }

            }
            process.waitFor();
        }

        this.spotifyElement2.setText(currentSong.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    }

    updateHudThingos() {
        let insb = this.FeatureManager.features["dataLoader"].class.isInSkyblock
        if (Date.now() - this.lastUpdatedStatData > 5 * 60000 && this.hudStat[0].enabled.getValue() && (!this.lastStatData || insb || this.hudStat.map(a => (!a.enabled.getValue() || a.onlySb.getValue())).includes(false))) {

            this.FeatureManager.features["dataLoader"].class.loadApiData("skyblock", false)

            this.lastUpdatedStatData = Date.now()
            return
        }

        this.hudStat.forEach(stat => {
            if (stat.enabled.getValue()) {
                this.updateHudThing(stat, insb)
            }
        })
    }

    updateHudThing(thing, insb) {
        if (!this.lastStatData) return

        if (!insb && thing.onlySb.getValue()) {
            thing.textElement.setText("")
            return
        }

        let type = thing.type.getValue()

        let string = "Unknown stat"
        if (type === "totaldeaths") {
            string = "&6Deaths&7> &f" + this.numberUtils.numberWithCommas(this.lastStatData.death_count)
        }
        if (type === "cata") {
            let cataData = getLevelByXp(this.lastStatData.dungeons.dungeon_types.catacombs.experience, 2, Infinity)
            string = "&6Cata&7> &f" + (~~((cataData.level + cataData.progress) * 100) / 100).toFixed(2) + " &7(" + this.numberUtils.numberWithCommas(cataData.xpCurrent) + (cataData.level === 50 ? "" : "/" + this.numberUtils.numberWithCommas(cataData.xpForNext)) + ")"
        }

        Object.keys(this.skillLevelCaps).forEach(skill => {
            if (type === skill) {
                let skillData = getLevelByXp(this.lastStatData[skill], 0, this.skillLevelCaps[skill])
                string = "&6" + firstLetterCapital(skill.split("_").pop()) + "&7> &f" + (skillData.level + skillData.progress).toFixed(2) + " &7(" + this.numberUtils.numberWithCommas(skillData.xpCurrent) + (skillData.level === this.skillLevelCaps[skill] ? "" : "/" + this.numberUtils.numberWithCommas(skillData.xpForNext)) + ")"
            }
        })

        if (type === "completions_enterance") {
            string = "&6E Comps&7> &f" + this.numberUtils.numberWithCommas((this.lastStatData.dungeons?.dungeon_types?.catacombs?.tier_completions?.[0] || 0))
        }
        if (type.startsWith("completions_floor_")) {
            let floor = parseInt(type.split("_").pop())
            string = "&6F" + floor + " Comps&7> &f" + this.numberUtils.numberWithCommas((this.lastStatData.dungeons?.dungeon_types?.catacombs?.tier_completions?.[floor] || 0))
        }
        if (type.startsWith("completions_master_")) {
            let floor = parseInt(type.split("_").pop())
            string = "&6M" + floor + " Comps&7> &f" + this.numberUtils.numberWithCommas((this.lastStatData.dungeons?.dungeon_types?.master_catacombs?.tier_completions?.[floor] || 0))
        }
        if (type.startsWith("completions_dungeon_")) {
            let floor = parseInt(type.split("_").pop())
            string = "&6Dungeon " + floor + " Comps&7> &f" + this.numberUtils.numberWithCommas((this.lastStatData.dungeons?.dungeon_types?.catacombs?.tier_completions?.[floor] || 0) + (this.lastStatData.dungeons?.dungeon_types?.master_catacombs?.tier_completions?.[floor] || 0))
        }

        thing.textElement.setText(string)
    }

    apiLoad(data, dataType, isSoopyServer, isLatest) {
        if (dataType === "skyblock" && !isSoopyServer) {
            this.statApiLoadThingo(data)
        }
        if (!isSoopyServer || !isLatest) return
        if (dataType !== "skyblock") return

        let pet = data.data.profiles[data.data.stats.currentProfileId].members[Player.getUUID().replace(/-/g, "")].selectedPet

        if (!pet) {
            this.petElement.setText("&6Pet&7> &cNone")
            this.petText = "&6Pet&7> &cNone"
            return;
        }

        let petTierColor = {
            "COMMON": "&f",
            "UNCOMMON": "&a",
            "RARE": "&9",
            "EPIC": "&5",
            "LEGENDARY": "&6",
            "MYTHIC": "&d"
        }

        this.petElement.setText("&6Pet&7> &7[Lvl " + (pet.level.level || "??") + "] " + petTierColor[pet.tier] + pet.name)
        this.petText = "&6Pet&7> &7[Lvl " + (pet.level.level || "??") + "] " + petTierColor[pet.tier] + pet.name
    }

    worldLoad() {
        this.lastUpdatedStatData = 0
    }
}

module.exports = {
    class: new Hud()
}