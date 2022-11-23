/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { f, m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import socketConnection from "../../socketConnection";
import { drawBoxAtBlock, drawBoxAtBlockNotVisThruWalls, drawCoolWaypoint, drawFilledBox, drawLine } from "../../utils/renderUtils";
import { calculateDistance, calculateDistanceQuick, getLore } from "../../utils/utils";
import SettingBase from "../settings/settingThings/settingBase";
import ToggleSetting from "../settings/settingThings/toggle";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ButtonSetting from "../settings/settingThings/button";
import TextSetting from "../settings/settingThings/textSetting";
import { basiclyEqual } from "../../utils/numberUtils";

let warpData = {
	"castle": [-250, 130, 45],
	"da": [91, 75, 176],
	"museum": [-75, 76, 80],
	"hub": [-2, 70, -69]
}
function getKeyBindFromKey(key, description) {
	var mcKeyBind = undefined //MinecraftVars.getKeyBindFromKey(key);

	if (mcKeyBind == null || mcKeyBind == undefined) {
		mcKeyBind = new KeyBind(description, key);
	}

	return mcKeyBind;
}

class Events extends Feature {
	constructor() {
		super()
	}

	onEnable() {
		this.initVariables()

		this.burrialData = {
			points: [],
			locations: [],
			historicalLocations: []
		}
		this.lastWorldChange = 0
		this.lastRequest = 0
		this.potentialParticleLocs = {}
		this.showingWaypoints = false
		this.lastPath = []
		this.updatingPath = false
		this.lastPathCords = undefined
		this.openedWarpsMenu = false


		this.loadFromParticles = new ToggleSetting("Load burrials from particles", "Will load particles from burrows in the world", true, "burrial_from_partles", this)
		this.showBurrialGuess = new ToggleSetting("Estimate burrial location from ability", "Will show a line + box where it thinks the burrial is", true, "burrial_guess", this)
		new ButtonSetting("NOTE: You must have music disabled", "for burrial guessess to work (/togglemusic)", "togglemusis_button", this, "toggle", () => {
			ChatLib.command("togglemusic")
		}, false).requires(this.showBurrialGuess)

		this.otherInquisWaypoints = new ToggleSetting("Show other users inquis locations", "If disabled others wont be able to see urs", true, "inquis_location_other", this).requires(this.loadFromParticles)
		this.otherInquisPing = new ToggleSetting("Show cool title when someone's inquis spawned", "May be usefull for loot share", true, "inquis_ping_other", this).requires(this.loadFromParticles)
		this.limitPMemb = new ToggleSetting("Only send inquis ping to party members", "If not in a party it works as default", true, "inquis_ping_party", this).requires(this.otherInquisPing)
		this.limitPMembRecieve = new ToggleSetting("Only RECIEVE inquis ping from party members", "To prevent trolling for streamers", false, "recieve_inquis_ping_party", this).requires(this.otherInquisPing)
		this.shinyBlocks = []
		this.glowingMushrooms = []

		this.MythMobsHPGuiElement = new ToggleSetting("Render Mythological Mobs hp on your screen", "This will help you to know their HP.", true, "myth_mobs_hp", this).contributor("EmeraldMerchant");
		this.MythMobsHP = new HudTextElement().setToggleSetting(this.MythMobsHPGuiElement).setLocationSetting(new LocationSetting("Mythological Mobs Hp Location", "Allows you to edit the location of Mythological Mobs hp", "myth_mobs_location", this, [10, 50, 1, 1]).requires(this.MythMobsHPGuiElement).editTempText("&8[&7Lv750&8] &2Exalted Minos Inquisitor &a40M&f/&a40M&c❤&r"));
		this.hudElements.push(this.MythMobsHP);
		this.abiphoneSolver = new ToggleSetting("Tia fairy task thingo", "", true, "abi_solver", this)


		this.Mobs = []
		this.lastDing = 0
		this.lastDingPitch = 0
		this.firstPitch = 0
		this.lastParticlePoint = undefined
		this.firstParticlePoint = undefined
		this.particlePoint = undefined
		this.guessPoint = undefined
		this.distance = undefined
		this.dingIndex = 0
		this.dingSlope = []

		this.ignorePlayers = new Set()

		new SettingBase("There is also a hotkey to warp near", "see minecraft controls menu", true, "warp_info_hotkey", this)
		this.warpBindDefault = new TextSetting("Default warp keybind", "Eg KEY_F", "CHAR_NONE", "inquis_keybind_default", this, "", false)

		try {
			this.warpBind = getKeyBindFromKey(Keyboard[this.warpBindDefault.getValue()], "Warp to nearest location to burrial guess");
		} catch (e) {
			ChatLib.chat(this.FeatureManager.messagePrefix + this.warpBindDefault.getValue() + " is an invalid keyboard key, see https://legacy.lwjgl.org/javadoc/org/lwjgl/input/Keyboard.html")
			this.warpBind = getKeyBindFromKey(Keyboard.CHAR_NONE, "Warp to nearest location to burrial guess");
		}

		this.slayerLocationDataH = {}
		this.todoE = []

		this.hasWarps = new Set()

		this.shinyBlockOverlayEnabled = new ToggleSetting("Shiny blocks highlight", "Will highlight shiny blocks in the end", false, "shiny_blocks_overlay", this)
		this.showGlowingMushrooms = new ToggleSetting("Glowing mushrooms highlight", "Will highlight glowing mushrooms", false, "glowing_mushrooms_overlay", this)
		this.trevorAngleSovler = new ToggleSetting("Trevor theodite solver", "semi not accurate cus hypixel rounds the nubmers :madge:", true, "trevor_angle_solver", this)
		this.dropZapperFarmCooldown = new ToggleSetting("Block zapper farm cooldown", "", false, "block_zap_farm_cool", this)
		// this.treavorTrackerWaypoints = new ToggleSetting("Trevor the tracker waypoints", "", false, "trevor_waypoints", this)
		//TODO: add tracker waypoints

		this.registerEvent("worldLoad", this.worldLoad)
		this.registerEvent("spawnParticle", this.spawnParticle).registeredWhen(() => this.showingWaypoints || this.shinyBlockOverlayEnabled.getValue() || this.showGlowingMushrooms.getValue())
		this.registerEvent("renderWorld", this.renderWorld).registeredWhen(() => this.showingWaypoints || this.shinyBlockOverlayEnabled.getValue() || this.showGlowingMushrooms.getValue())
		this.registerStep(true, 2, this.step)
		this.registerStep(false, 5, this.step_5s)

		this.registerEvent("soundPlay", this.playSound).registeredWhen(() => this.showingWaypoints)
		this.registerForge(net.minecraftforge.event.entity.EntityJoinWorldEvent, this.entityJoinWorldEvent).registeredWhen(() => this.showingWaypoints);

		this.registerChat("&r&eYou dug out a Griffin Burrow! &r&7(${*}/4)&r", this.burrialClicked)
		this.registerChat("&r&eYou finished the Griffin burrow chain! &r&7(4/4)&r", this.burrialClicked)
		this.inquisWaypointSpawned = false

		this.registerEvent("tick", () => {
			if (this.warpBind.isPressed()) {

				if (!this.openedWarpsMenu) {
					ChatLib.chat(this.FeatureManager.messagePrefix + "Please open the warps menu first (/warp)")
					ChatLib.chat(this.FeatureManager.messagePrefix + "(So the mod knows what warps u have access to)")
				}
				let loc = this.getClosestWarp()

				if (loc) ChatLib.command(loc)
			}
		})

		this.registerStep(true, 1, this.step_1fps)
		this.registerStep(true, 10, this.step_10fps)


		this.registerCommand("inqwaypointignoreadd", (player) => {
			this.ignorePlayers.add(player)
			ChatLib.chat(this.FeatureManager.messagePrefix + "Added " + player + " to inquis waypoint ignore list, this will be cleared next game start!")

			delete this.slayerLocationDataH[player]
		})
		this.registerCommand("cleardianawaypoints", () => {
			this.burrialData.points = []
			this.burrialData.locations = []
			this.burrialData.historicalLocations = []
			ChatLib.chat(this.FeatureManager.messagePrefix + "Cleared all diana waypoints!")
		})

		this.locs = []
		this.predictions = []

		this.abiSolverX = 0
		this.abiSolverSolition = []
		// this.predictionsOld = []
		// this.registerEvent("renderWorld", () => {
		// 	for (let loc of this.locs) {
		// 		drawBoxAtBlock(loc[0], loc[1], loc[2], 255, 0, 0, 0.05, 0.05)
		// 	}
		// 	for (let loc of this.predictions) {
		// 		drawBoxAtBlock(loc[0], loc[1], loc[2], 0, 255, 0, 0.05, 0.05)
		// 	}
		// })

		// this.registerCommand("clearlocs", () => {
		// 	this.locs = []
		// 	this.predictions = []
		// 	// this.predictionsOld = []
		// 	ChatLib.chat(this.FeatureManager.messagePrefix + "Cleared all locs!")
		// })
		this.trackerData = []

		this.registerEvent("soundPlay", this.abiSolverSoundPlay).registeredWhen(() => this.abiphoneSolver.getValue())
		this.registerEvent("guiMouseClick", this.abiSolverGuiClick).registeredWhen(() => this.abiphoneSolver.getValue())
		this.registerEvent("postGuiRender", this.abiSolverGuiRender).registeredWhen(() => this.abiphoneSolver.getValue())
		this.registerEvent("guiOpened", this.abiSolverGuiOpen).registeredWhen(() => this.abiphoneSolver.getValue())
		this.registerChat("&r&aThe target is around &r&e${height} blocks below&r&a, at a &r&b${angle} degrees &r&aangle!&r", (a, b) => this.mobAt(a, b, false))
		this.registerChat("&r&aThe target is around &r&e${height} blocks above&r&a, at a &r&b${angle} degrees &r&aangle!&r", (a, b) => this.mobAt(a, b, true))
		this.registerChat("&r&aReturn to the Trapper soon to get a new animal to hunt!&r", () => {
			this.trackerData = []
		})
		this.registerEvent("renderWorld", this.drawTrackerStuff)

		let zaps = 0
		this.registerChat("&eZapped ${blokc} &eblocks! &a&lUNDO&r", () => {
			zaps++
			if (zaps === 20) {
				if (this.dropZapperFarmCooldown.getValue()) {
					ChatLib.chat(this.FeatureManager.messagePrefix + "BLOCK ZAPPER COOLDOWN")
					Client.showTitle("&cBLOCK ZAPPER COOLDOWN", "!", 0, 20 * 3, 20)
				}
			}
		})
		this.registerEvent("worldLoad", () => {
			if (zaps === 20) {
				if (this.dropZapperFarmCooldown.getValue()) {
					Client.scheduleTask(20 * 8, () => {
						ChatLib.chat(this.FeatureManager.messagePrefix + "BLOCK ZAPPER OFF COOLDOWN")
						Client.showTitle("&aBLOCK ZAPPER OFF COOLDOWN", "!", 0, 20 * 3, 20)
					})
				}
			}
			zaps = 0
		})
	}

	drawTrackerStuff() {
		if (!this.trevorAngleSovler.getValue()) return

		for (let data of this.trackerData) {
			let [x, z, yMin, yMax, hDistMin, hDistMax] = data

			GL11.glDisable(GL11.GL_TEXTURE_2D);
			GL11.glDisable(GL11.GL_CULL_FACE);
			GL11.glBlendFunc(770, 771);
			GL11.glEnable(GL11.GL_BLEND);
			GL11.glLineWidth(4.0);
			GL11.glDepthMask(false);
			GlStateManager.func_179094_E();

			Tessellator.begin(GL11.GL_LINES, false);
			Tessellator.colorize(255, 0, 0);

			for (i = 0; i < Math.ceil(hDistMax); i++) {
				let angle = 2 * Math.PI * i / Math.ceil(hDistMax);

				Tessellator.pos(x + hDistMin * Math.sin(angle), yMin, z + hDistMin * Math.cos(angle));
				Tessellator.pos(x + hDistMin * Math.sin(angle), yMax, z + hDistMin * Math.cos(angle));

				Tessellator.pos(x + hDistMin * Math.sin(angle), yMax, z + hDistMin * Math.cos(angle));
				Tessellator.pos(x + hDistMax * Math.sin(angle), yMax, z + hDistMax * Math.cos(angle));

				Tessellator.pos(x + hDistMax * Math.sin(angle), yMax, z + hDistMax * Math.cos(angle));
				Tessellator.pos(x + hDistMax * Math.sin(angle), yMin, z + hDistMax * Math.cos(angle));

				Tessellator.pos(x + hDistMax * Math.sin(angle), yMin, z + hDistMax * Math.cos(angle));
				Tessellator.pos(x + hDistMin * Math.sin(angle), yMin, z + hDistMin * Math.cos(angle));
			}
			Tessellator.draw();

			GL11.glEnable(GL11.GL_TEXTURE_2D);
			GL11.glEnable(GL11.GL_CULL_FACE);
			GlStateManager.func_179121_F();
			GL11.glDepthMask(true);
			GL11.glDisable(GL11.GL_BLEND);
		}

	}

	mobAt(height, angle, above) {
		let y = Math.round(Player.getY()) + (above ? parseInt(height) : -parseInt(height))

		let heightMin = parseInt(height) - 2.5
		let heightMax = parseInt(height) + 2.5

		let yMin = y - 2.5
		let yMax = y + 2.5

		let angleMin = parseInt(angle) - 2.5
		let angleMax = parseInt(angle) + 2.5

		angleMin = Math.max(0.0001, angleMin)

		let hDistMin = Math.round(heightMin / Math.tan(angleMax / 180 * Math.PI))
		let hDistMax = Math.round(heightMax / Math.tan(angleMin / 180 * Math.PI))
		ChatLib.chat(this.FeatureManager.messagePrefix + "Horisontal distance: " + hDistMin + " - " + hDistMax)
		if (hDistMax > 1000) return

		this.trackerData.push([Player.getX(), Player.getZ(), yMin, yMax, hDistMin, hDistMax])
		if (this.trackerData.length > 1) this.trackerData.shift()

	}

	step_1fps() {
		if (!this.MythMobsHPGuiElement.getValue() || !this.showingWaypoints) return
		World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach((mob) => {
			let name = mob.getName()
			if (!this.Mobs?.map(a => a.getUUID().toString()).includes(mob.getUUID().toString())) {
				if ((name.includes("Exalted") || name.includes("Stalwart")) && !name.split(" ")[2].startsWith("0")) {
					this.Mobs.push(mob)
				}
			}
		})
		this.Mobs = this.Mobs.filter((e) => !e.getEntity()[f.isDead]);
	}

	step_10fps() {
		if (!this.MythMobsHPGuiElement.getValue()) return
		let names = []
		this.Mobs.forEach(nameTag => {
			names.push(nameTag.getName())
		})
		this.MythMobsHP.setText(names.join("\n"))
	}

	entityJoinWorldEvent(e) {
		if (this.otherInquisWaypoints.getValue()) this.todoE.push(e.entity);
	}

	inquisData(loc, user) {
		if (this.ignorePlayers.has(user) && user !== Player.getName()) return
		if (!loc) {
			delete this.slayerLocationDataH[user]
			return
		}

		if (this.limitPMembRecieve.getValue()) {
			if (!this.FeatureManager.features["dataLoader"].class.partyMembers.has(user)) return
		}
		this.slayerLocationDataH[user] = [loc, Date.now()]
		if (this.otherInquisPing.getValue()) {
			Client.showTitle("&r&6&l[&b&l&kO&6&l] MINOS INQUISITOR [&b&l&kO&6&l]", `${user}'s Inquisitor`, 0, 50, 10);
			new TextComponent(this.FeatureManager.messagePrefix + `${user} spawned an inquis &7(waypoint added), &cCLICK HERE &7to ignore waypoints from them.`).setClick("run_command", "/inqwaypointignoreadd " + user).chat()
		}
	}

	renderWorld(ticks) {
		let drawnBlocks = new Set()
		this.shinyBlocks.forEach(([loc]) => {
			if (drawnBlocks.has(loc.join(","))) return
			drawnBlocks.add(loc.join(","))
			drawCoolWaypoint(loc[0], loc[1], loc[2], 0, 255, 0, { renderBeacon: false })
		})

		this.glowingMushrooms.forEach(([loc]) => {
			drawBoxAtBlockNotVisThruWalls(loc[0] - 0.2, loc[1], loc[2] - 0.2, 0, 255, 0, 0.4, 0.4)
		})
		if (this.showingWaypoints) {
			if (this.guessPoint && this.showBurrialGuess.getValue()) {
				let warpLoc = this.getClosestWarp()
				if (this.guessPoint2) {
					let gY = 131
					while (World.getBlockAt(this.guessPoint2[0], gY, this.guessPoint2[2]).getType().getID() !== 2 && gY > 70) {
						gY--
					}
					drawCoolWaypoint(this.guessPoint2[0], gY + 3, this.guessPoint2[2], 255, 255, 0, { name: "§eGuess" + (warpLoc ? " §7(" + warpLoc + ")" : "") })
				}
				// drawCoolWaypoint(this.guessPoint[0], this.guessPoint[1], this.guessPoint[2], 255, 255, 0, { name: "§7OLD Guess" + (warpLoc ? " §7(" + warpLoc + ")" : "") })
			}
			this.burrialData.locations.forEach((loc, i) => {

				let typeReplace = [
					"Start",
					"Mob",
					"Treasure",
					"Finish",
					"Unknown"
				]
				if (!loc.clicked) {
					blue = false
					if (loc.lastPing && Date.now() - loc.lastPing < 500) {
						blue = true
					}

					let name = ""

					if (loc.fromApi) {
						name = (loc.nearest ? "§c" : "§a") + "(" + (loc.chain + 1) + "/4) " + typeReplace[loc.type] + " burrial"
					} else {
						name = (loc.nearest ? "§c" : "§a") + typeReplace[loc.type] + " burrial"
					}

					drawCoolWaypoint(loc.x, loc.y, loc.z, 0, blue ? 100 : 255, blue ? 255 : 0, { name: name })
				}
			})
		}

		if (this.otherInquisWaypoints.getValue()) {
			Object.keys(this.slayerLocationDataH).forEach(key => {
				drawCoolWaypoint(this.slayerLocationDataH[key][0][0] || 0, this.slayerLocationDataH[key][0][1] || 0, this.slayerLocationDataH[key][0][2] || 0, 255, 0, 0, { name: "§c" + (key || "ERROR") + "'s inquis" })
			})
		}
	}

	sortBurrialLocations() {
		let sorted = [...this.burrialData.locations]
		sorted.sort((a, b) => {
			let aDist = calculateDistanceQuick([Player.getX(), Player.getY(), Player.getZ()], [a.x + 0.5, a.y + 2.5, a.z + 0.5])
			let bDist = calculateDistanceQuick([Player.getX(), Player.getY(), Player.getZ()], [b.x + 0.5, b.y + 2.5, b.z + 0.5])

			return bDist - aDist
		})
		this.burrialData.locations = sorted
	}

	step() {
		if (!Player.getInventory()) return

		hasDianaShovle = false
		let slots = [0, 1, 2, 3, 4, 5, 6, 7, 8]
		slots.forEach(a => {
			item = Player.getInventory().getStackInSlot(a)
			if (!item) return
			if (ChatLib.removeFormatting(item.getName()) === "Ancestral Spade") {
				hasDianaShovle = true
			}
		})

		let showingWaypointsNew = (this.lastWorldChange + 5000 < Date.now() ? hasDianaShovle && this.FeatureManager.features["dataLoader"].class.area === "Hub" && (this.loadFromParticles.getValue() || this.showBurrialGuess.getValue()) : this.showingWaypoints || (hasDianaShovle && this.FeatureManager.features["dataLoader"].class.area === "Hub" && (this.loadFromParticles.getValue() || this.showBurrialGuess.getValue())))

		this.showingWaypoints = showingWaypointsNew

		let drawnBlocks = new Set()
		this.shinyBlocks = this.shinyBlocks.reverse().filter(([loc, time]) => {
			if (drawnBlocks.has(loc.join(","))) return false
			drawnBlocks.add(loc.join(","))
			return (time > Date.now() - 2000 && World.getBlockAt(loc[0], loc[1], loc[2]).getType().getID() !== 7)
		}).reverse()
		this.glowingMushrooms = this.glowingMushrooms.filter(([loc, time]) => {
			return time > Date.now() - 1000 && World.getBlockAt(...loc.map(a => Math.floor(a))).type.getID() !== 0
		})


		Object.keys(this.slayerLocationDataH).forEach(n => {
			if (this.slayerLocationDataH[n][1] + 60000 * 3 < Date.now()) {
				delete this.slayerLocationDataH[n]
			}
		})

		this.todoE.forEach(e => {
			e = new Entity(e)

			if (e.getName().toLowerCase().includes("inquis") && !e.getName().includes("'") && Math.abs(e.getY() - Player.getY()) < 10 && Math.abs(e.getX() - Player.getX()) < 10 && Math.abs(e.getZ() - Player.getZ()) < 10) {
				let loc = [e.getX(), e.getY() - 1, e.getZ()]
				let self = false
				this.burrialData.locations.forEach(a => {
					if (calculateDistanceQuick([a.x, a.y, a.z], loc) < 25) {
						self = true
					}
				})
				if (self) {
					let pmemb = []
					this.FeatureManager.features["dataLoader"].class.partyMembers.forEach(a => pmemb.push(a))
					socketConnection.sendInquisData({ loc: [Math.round(Player.getX()), Math.round(Player.getY()), Math.round(Player.getZ())], pmemb, limitPMemb: pmemb.length > 1 && this.limitPMemb.getValue() });
					this.inquisWaypointSpawned = true
				}
			}
		})
		this.todoE = []

		if (Player.getContainer().getName() === "Hub Warps") {
			if (Date.now() - this.openedWarpsMenu > 1000) {
				this.openedWarpsMenu = Date.now()
				for (let item of Player.getContainer().getItems()) {
					if (!item) continue

					let lore = getLore(item)
					let warpLine = ChatLib.removeFormatting(lore[1])
					if (warpLine.startsWith("/warp") && warpData[warpLine.replace("/warp ", "")]) {

						if (lore.some(a => a.includes("Click to warp!"))) {
							this.hasWarps.add(warpLine.replace("/warp ", ""))
						}
					}
				}
			}
		}
	}

	getClosestWarp() {
		if (!this.guessPoint2) return undefined
		let warp = undefined
		let minDist = calculateDistance([Player.getX(), Player.getY(), Player.getZ()], this.guessPoint2) - 50

		this.hasWarps.forEach(w => {
			if (!warpData[w]) return
			let d = calculateDistance(warpData[w], this.guessPoint2)
			if (d < minDist) {
				warp = "warp " + w
				minDist = d
			}
		})

		return warp
	}

	step_5s() {
		this.sortBurrialLocations()
	}

	worldLoad() {

		this.burrialData.points = []
		this.burrialData.locations = []
		this.burrialData.historicalLocations = []
		this.lastDing = 0
		this.lastDingPitch = 0
		this.firstPitch = 0
		this.lastParticlePoint = undefined
		this.lastParticlePoint2 = undefined
		this.lastSoundPoint = undefined
		this.firstParticlePoint = undefined
		this.particlePoint = undefined
		this.guessPoint = undefined
		this.distance = undefined
		this.dingIndex = 0
		this.dingSlope = []

		this.lastPath = undefined
		this.lastPathCords = undefined

		this.lastWorldChange = Date.now()
		this.Mobs = []
	}

	playSound(pos, name, volume, pitch, categoryName, event) {

		if (!this.showBurrialGuess.getValue()) return
		// if (this.dingIndex > 13) return
		// if (pos.getX() === Math.floor(Player.getX() * 8) / 8 && pos.getZ() === Math.floor(Player.getZ() * 8) / 8) return
		if (name !== "note.harp") return
		if (this.lastDing === 0) {
			this.firstPitch = pitch
		}
		this.lastDing = Date.now()
		if (pitch < this.lastDingPitch) {
			this.firstPitch = pitch
			this.dingIndex = 0
			this.dingSlope = []
			this.lastDingPitch = pitch
			this.lastParticlePoint = undefined
			this.lastParticlePoint2 = undefined
			this.lastSoundPoint = undefined
			this.firstParticlePoint = undefined
			this.distance = undefined
			this.locs = []
			// this.predictionsOld = this.predictions
		}
		if (this.lastDingPitch === 0) {
			this.lastDingPitch = pitch
			this.distance = undefined
			this.lastParticlePoint = undefined
			this.lastParticlePoint2 = undefined
			this.lastSoundPoint = undefined
			this.firstParticlePoint = undefined
			this.locs = []
			// this.predictionsOld = this.predictions
			return
		}
		this.dingIndex++
		if (this.dingIndex > 1) this.dingSlope.push(pitch - this.lastDingPitch)
		if (this.dingSlope.length > 20) this.dingSlope.shift()
		let slope = this.dingSlope.reduce((a, b) => a + b, 0) / this.dingSlope.length
		// console.log(this.dingSlope.join(","))
		this.lastSoundPoint = [pos.getX(), pos.getY(), pos.getZ()]
		this.lastDingPitch = pitch

		if (!this.lastParticlePoint2 || !this.particlePoint || !this.firstParticlePoint) return
		this.distance2 = Math.E / slope - Math.hypot(this.firstParticlePoint[0] - pos.getX(), this.firstParticlePoint[1] - pos.getY(), this.firstParticlePoint[2] - pos.getZ())
		// console.log(this.dingIndex + "	" + this.dingSlope / this.dingIndex + "	" + pitch + "	" + (pitch - this.lastDingPitch))

		if (this.distance2 > 1000) {
			this.distance2 = undefined
			this.guessPoint = undefined
			return
		}

		let lineDist = Math.hypot(this.lastParticlePoint2[0] - this.particlePoint[0], this.lastParticlePoint2[1] - this.particlePoint[1], this.lastParticlePoint2[2] - this.particlePoint[2])
		let distance = this.distance2
		let changes = [this.particlePoint[0] - this.lastParticlePoint2[0], this.particlePoint[1] - this.lastParticlePoint2[1], this.particlePoint[2] - this.lastParticlePoint2[2]]
		changes = changes.map(a => a / lineDist)
		this.guessPoint = [this.lastSoundPoint[0] + changes[0] * distance, this.lastSoundPoint[1] + changes[1] * distance, this.lastSoundPoint[2] + changes[2] * distance]
		// let minD = Infinity
		// for (let i = 0; i < this.predictions.length; i++) {
		// 	let p = this.predictions[i]
		// 	let d = (p[0] - this.guessPoint[0]) ** 2 + (p[2] - this.guessPoint[2]) ** 2
		// 	if (d < minD) {
		// 		minD = d
		// 		this.guessPoint2 = [Math.floor(p[0]), 255, Math.floor(p[2])]
		// 	}
		// }
	}

	/**
	 * Solves the equasion y=b/(x+a)+c
	 * @param {[x1: Number, x2: Number, x3: Number]} x
	 * @param {[y1: Number, y2: Number, y3: Number]} y
	 * @return {[a: Number, b: Number, c: Number]}
	 */
	solveEquasionThing(x, y) {
		let a = (-y[0] * x[1] * x[0] - y[1] * x[1] * x[2] + y[1] * x[1] * x[0] + x[1] * x[2] * y[2] + x[0] * x[2] * y[0] - x[0] * x[2] * y[2]) / (x[1] * y[0] - x[1] * y[2] + x[0] * y[2] - y[0] * x[2] + y[1] * x[2] - y[1] * x[0])
		let b = (y[0] - y[1]) * (x[0] + a) * (x[1] + a) / (x[1] - x[0])
		let c = y[0] - b / (x[0] + a)
		return [a, b, c]
	}

	spawnParticle(particle, type, event) {
		if (this.showingWaypoints && this.showBurrialGuess.getValue() && particle.toString().startsWith("EntityDropParticleFX,")) {

			let run = false
			if (this.lastSoundPoint && !run && Math.abs(particle.getX() - this.lastSoundPoint[0]) < 2 && Math.abs(particle.getY() - this.lastSoundPoint[1]) < 0.5 && Math.abs(particle.getZ() - this.lastSoundPoint[2]) < 2) {
				run = true
			}
			if (run) {

				if (this.locs.length < 100 && this.locs.length === 0 || particle.getX() + particle.getY() + particle.getZ() !== this.locs[this.locs.length - 1][0] + this.locs[this.locs.length - 1][1] + this.locs[this.locs.length - 1][2]) {

					let currLoc = [particle.getX(), particle.getY(), particle.getZ()]
					let distMultiplier = 1
					{
						if (this.locs.length > 2) {

							let predictedDist = 0.06507 * this.locs.length + 0.259

							let lastPos = this.locs[this.locs.length - 1]
							let actualDist = Math.hypot(...currLoc.map((l, i) => {
								return (l - lastPos[i])
							}))

							distMultiplier = actualDist / predictedDist
						}
						// if (this.locs.length > 2 && !this.distance) {
						// 	let lastPos = this.locs[this.locs.length - 1]
						// 	let dist = Math.hypot(...currLoc.map((l, i) => {
						// 		return (l - lastPos[i])
						// 	}))
						// 	let lastPos2 = this.locs[this.locs.length - 2]
						// 	let dist2 = Math.hypot(...currLoc.map((l, i) => {
						// 		return (lastPos[i] - lastPos2[i])
						// 	}))
						// 	// console.log("------")
						// 	// console.log(dist - dist2)
						// 	this.distance = 20 / (dist - dist2) - (dist - dist2) * 80
						// 	console.log(this.distance)
						// 	// this.distance -= Math.hypot(this.firstParticlePoint[0] - particle.getX(), this.firstParticlePoint[1] - particle.getY(), this.firstParticlePoint[2] - particle.getZ())

						// 	// console.log(Math.sqrt((Player.getX() - this.firstParticlePoint[0]) ** 2 + (Player.getZ() - this.firstParticlePoint[2]) ** 2))
						// }
					}
					this.locs.push(currLoc)
					if (this.locs.length > 5 && this.guessPoint) {
						let slopeThing = this.locs.map((a, i) => {
							if (i === 0) return
							let lastLoc = this.locs[i - 1]
							let currLoc = a
							return Math.atan((currLoc[0] - lastLoc[0]) / (currLoc[2] - lastLoc[2]))
						})

						let [a, b, c] = this.solveEquasionThing([slopeThing.length - 5, slopeThing.length - 3, slopeThing.length - 1], [slopeThing[slopeThing.length - 5], slopeThing[slopeThing.length - 3], slopeThing[slopeThing.length - 1]])
						// console.log(a, b, c)

						let pr1 = []
						let pr2 = []

						let start = slopeThing.length - 1
						let lastPos = [this.locs[start][0], this.locs[start][1], this.locs[start][2]]
						let lastPos2 = [this.locs[start][0], this.locs[start][1], this.locs[start][2]]

						let distCovered = 0
						// this.locs.forEach((l, i) => {
						// 	if (i === 0) return

						// 	distCovered += Math.hypot(this.locs[i][0] - this.locs[i - 1][0], this.locs[i][1] - this.locs[i - 1][1], this.locs[i][2] - this.locs[i - 1][2])
						// })

						let ySpeed = (this.locs[this.locs.length - 1][1] - this.locs[this.locs.length - 2][1]) / Math.hypot(this.locs[this.locs.length - 1][0] - this.locs[this.locs.length - 2][0], this.locs[this.locs.length - 1][2] - this.locs[this.locs.length - 2][2])

						let i = start + 1
						while (distCovered < this.distance2 && i < 10000) {
							let y = b / (i + a) + c

							let dist = distMultiplier * (0.06507 * i + 0.259) //This is where the inaccuracy's come from
							//dist = distance between particles for guessed line

							let xOff = dist * Math.sin(y)
							let zOff = dist * Math.cos(y)



							let dencity = 5
							for (let o = 0; o < dencity; o++) {
								lastPos[0] += xOff / dencity
								lastPos[2] += zOff / dencity

								lastPos[1] += ySpeed * dist / dencity
								lastPos2[1] += ySpeed * dist / dencity

								lastPos2[0] -= xOff / dencity
								lastPos2[2] -= zOff / dencity

								pr1.push([...lastPos])
								pr2.push([...lastPos2])


								// distCovered += Math.hypot(xOff, zOff) / dencity
								distCovered = Math.hypot(lastPos[0] - this.lastSoundPoint[0], lastPos[2] - this.lastSoundPoint[2])
								if (distCovered > this.distance2) break;
							}
							i++
						}
						this.predictions = [...pr1, ...pr2]
						// let minD = Infinity

						let p1 = pr1[pr1.length - 1]
						let p2 = pr2[pr2.length - 1]

						if (!this.guessPoint) return

						let d1 = (p1[0] - this.guessPoint[0]) ** 2 + (p1[2] - this.guessPoint[2]) ** 2
						let d2 = (p2[0] - this.guessPoint[0]) ** 2 + (p2[2] - this.guessPoint[2]) ** 2

						if (d1 < d2) {
							this.guessPoint2 = [Math.floor(p1[0]), 255, Math.floor(p1[2])]
						} else {
							this.guessPoint2 = [Math.floor(p2[0]), 255, Math.floor(p2[2])]
						}
						// for (let i = 0; i < this.predictions.length; i++) {
						// 	let p = this.predictions[i]
						// 	let d2 = (p[0] - this.guessPoint[0]) ** 2 + (p[2] - this.guessPoint[2]) ** 2
						// 	let d = Math.abs(this.distance ** 2 - (p[0] - this.firstParticlePoint[0]) ** 2 + (p[2] - this.firstParticlePoint[2]) ** 2)
						// 	if (d < minD && d2 < 50 ** 2) {
						// 		minD = d
						// 		this.guessPoint2 = [Math.floor(p[0]), 255, Math.floor(p[2])]
						// 	}
						// }
						// console.log(this.predictions[1].join(" "))
					}

				}
				if (this.lastParticlePoint === undefined) {
					this.firstParticlePoint = [particle.getX(), particle.getY(), particle.getZ()]
				}
				this.lastParticlePoint2 = this.lastParticlePoint
				this.lastParticlePoint = this.particlePoint
				this.particlePoint = [particle.getX(), particle.getY(), particle.getZ()]

				if (!this.lastParticlePoint2 || !this.particlePoint || !this.firstParticlePoint || !this.distance || !this.lastSoundPoint) return

				let lineDist = Math.hypot(this.lastParticlePoint2[0] - this.particlePoint[0], this.lastParticlePoint2[1] - this.particlePoint[1], this.lastParticlePoint2[2] - this.particlePoint[2])
				let distance = this.distance2
				let changes = [this.particlePoint[0] - this.lastParticlePoint2[0], this.particlePoint[1] - this.lastParticlePoint2[1], this.particlePoint[2] - this.lastParticlePoint2[2]]
				changes = changes.map(a => a / lineDist)
				this.guessPoint = [this.lastSoundPoint[0] + changes[0] * distance, this.lastSoundPoint[1] + changes[1] * distance, this.lastSoundPoint[2] + changes[2] * distance]
			}
		}
		if (this.shinyBlockOverlayEnabled.getValue() && this.FeatureManager.features["dataLoader"].class.area === "The End") {
			// if (basiclyEqual(particle.getX(), Player.getX(), 2) && basiclyEqual(particle.getY(), Player.getY(), 2) && basiclyEqual(particle.getZ(), Player.getZ(), 2)) {
			// 	console.log(particle.toString())
			// }
			if (particle.toString().startsWith("EntityPortalFX,")) {

				// if (particle.getUnderlyingEntity().func_70534_d() === particle.getUnderlyingEntity().func_70535_g()) {

				// let arr = [particle.getX(), particle.getY(), particle.getZ()]
				// if (arr.map(a => Math.abs(a % 1)).includes(0.25) || arr.map(a => Math.abs(a % 1)).includes(0.75)) {
				// 	console.log(arr.map(a => a.toFixed(3)).join(", "))
				// }

				if (Math.abs(particle.getY() % 1) === 0.25
					&& basiclyEqual((particle.getX() - 0.5) % 1, 0, 0.2)
					&& basiclyEqual((particle.getZ() - 0.5) % 1, 0, 0.2)) {
					//Block under
					this.shinyBlocks.push([[
						Math.floor(particle.getX()),
						Math.floor(particle.getY()) - 1,
						Math.floor(particle.getZ())
					], Date.now()])
				}
				if (Math.abs(particle.getY() % 1) === 0.75
					&& basiclyEqual((particle.getX() - 0.5) % 1, 0, 0.2)
					&& basiclyEqual((particle.getZ() - 0.5) % 1, 0, 0.2)) {
					//Block over
					this.shinyBlocks.push([[
						Math.floor(particle.getX()),
						Math.floor(particle.getY()) + 1,
						Math.floor(particle.getZ())
					], Date.now()])
				}
				if (Math.abs(particle.getX() % 1) === 0.25
					&& basiclyEqual((particle.getY() - 0.5) % 1, 0, 0.2)
					&& basiclyEqual((particle.getZ() - 0.5) % 1, 0, 0.2)) {

					this.shinyBlocks.push([[
						Math.floor(particle.getX()) + 1,
						Math.floor(particle.getY()),
						Math.floor(particle.getZ())
					], Date.now()])
				}
				if (Math.abs(particle.getX() % 1) === 0.75
					&& basiclyEqual((particle.getY() - 0.5) % 1, 0, 0.2)
					&& basiclyEqual((particle.getZ() - 0.5) % 1, 0, 0.2)) {

					this.shinyBlocks.push([[
						Math.floor(particle.getX()) - 1,
						Math.floor(particle.getY()),
						Math.floor(particle.getZ())
					], Date.now()])
				}
				if (Math.abs(particle.getZ() % 1) === 0.25
					&& basiclyEqual((particle.getY() - 0.5) % 1, 0, 0.2)
					&& basiclyEqual((particle.getX() - 0.5) % 1, 0, 0.2)) {

					this.shinyBlocks.push([[
						Math.floor(particle.getX()),
						Math.floor(particle.getY()),
						Math.floor(particle.getZ()) + 1
					], Date.now()])
				}
				if (Math.abs(particle.getZ() % 1) === 0.75
					&& basiclyEqual((particle.getY() - 0.5) % 1, 0, 0.2)
					&& basiclyEqual((particle.getX() - 0.5) % 1, 0, 0.2)) {

					this.shinyBlocks.push([[
						Math.floor(particle.getX()),
						Math.floor(particle.getY()),
						Math.floor(particle.getZ()) - 1
					], Date.now()])
				}
				// }
			}
		}
		if (this.showGlowingMushrooms.getValue() && this.FeatureManager.features["dataLoader"].class.areaFine === "Glowing Mushroom Cave") {
			if (particle.toString().startsWith("EntitySpellParticleFX,")) {
				// console.log([particle.getX(), particle.getY(), particle.getZ()].map(a => a % 1))
				if (Math.abs(particle.getX() % 1) === 0.5 && Math.abs(particle.getZ() % 1) === 0.5) {
					this.glowingMushrooms.push([[particle.getX(), particle.getY(), particle.getZ()], Date.now()])
				}
			}
		}
		if (this.showingWaypoints && this.loadFromParticles.getValue()) {
			let foundEnchant = false
			let foundCrit = false
			let foundStep = false
			let isMob = undefined

			if (particle.toString().startsWith('EntityEnchantmentTableParticleFX, ')) {
				foundEnchant = true
			}
			else if (particle.toString().startsWith('EntityCrit2FX, ')) {
				foundCrit = true

				isMob = particle.getUnderlyingEntity().func_70534_d() > 0.5 //mob)
			}
			else if (particle.toString().startsWith('EntityFootStepFX, ')) {
				foundStep = true
			}
			else if (particle.toString().startsWith('EntityCritFX, ')) {

				let locstr = Math.floor(particle.getX()) + "," + Math.floor(particle.getY() - 1) + "," + Math.floor(particle.getZ())

				let removed = false
				this.burrialData.locations.filter((loc, i) => {
					if (!loc.clicked && loc.x + "," + loc.y + "," + loc.z === locstr) {
						loc.clicked = true
						removed = true
					}
				})
				if (!removed) return;
				this.burrialData.locations = this.burrialData.locations.filter(a => {
					if (!a.clicked) return true
					if (calculateDistanceQuick([a.x, a.y, a.z], [Player.getX(), Player.getY(), Player.getZ()]) < 15 * 15) return true;

					this.burrialData.historicalLocations.unshift(a)

					return false
				})
				if (this.burrialData.historicalLocations.length > 10) this.burrialData.historicalLocations.pop()

				return;
			}

			if (!foundEnchant && !foundCrit && !foundStep) return;

			if (Math.abs(particle.getY() % 1) > 0.1) return
			if (Math.abs(particle.getX() % 1) < 0.1) return
			if (Math.abs(particle.getX() % 1) > 0.9) return
			if (Math.abs(particle.getZ() % 1) < 0.1) return
			if (Math.abs(particle.getZ() % 1) > 0.9) return

			let locstr = Math.floor(particle.getX()) + "," + Math.floor(particle.getY() - 1) + "," + Math.floor(particle.getZ())
			let locarr = [Math.floor(particle.getX()), Math.floor(particle.getY() - 1), Math.floor(particle.getZ())]

			let found = false

			this.burrialData.locations.forEach((loc) => {
				if (loc.x + "," + loc.y + "," + loc.z === locstr) {
					found = loc
					loc.lastPing = Date.now()
				}
				if ((loc.x + 1) + "," + loc.y + "," + loc.z === locstr) {
					found = loc
					loc.lastPing = Date.now()
				}
				if ((loc.x + 1) + "," + (loc.y + 1) + "," + loc.z === locstr) {
					found = loc
					loc.lastPing = Date.now()
				}
				if ((loc.x + 1) + "," + (loc.y - 1) + "," + loc.z === locstr) {
					found = loc
					loc.lastPing = Date.now()
				}
				if ((loc.x - 1) + "," + (loc.y + 1) + "," + loc.z === locstr) {
					found = loc
					loc.lastPing = Date.now()
				}
				if ((loc.x - 1) + "," + (loc.y - 1) + "," + loc.z === locstr) {
					found = loc
					loc.lastPing = Date.now()
				}
				if ((loc.x - 1) + "," + loc.y + "," + loc.z === locstr) {
					found = loc
					loc.lastPing = Date.now()
				}
				if (loc.x + "," + loc.y + "," + (loc.z + 1) === locstr) {
					found = loc
					loc.lastPing = Date.now()
				}
				if (loc.x + "," + loc.y + "," + (loc.z - 1) === locstr) {
					found = loc
					loc.lastPing = Date.now()
				}
			})
			if (this.burrialData.historicalLocations) {
				this.burrialData.historicalLocations.forEach((loc) => {
					if (loc.x + "," + loc.y + "," + loc.z === locstr) {
						found = loc
					}
				})
			}

			if (!this.potentialParticleLocs[locstr] || Date.now() - this.potentialParticleLocs[locstr].timestamp > 30000) this.potentialParticleLocs[locstr] = { enchant: 0, crit: 0, step: 0, isMob: 0, timestamp: Date.now() }

			if (foundEnchant) this.potentialParticleLocs[locstr].enchant++
			if (foundCrit) this.potentialParticleLocs[locstr].crit++
			if (foundStep) this.potentialParticleLocs[locstr].step++
			if (foundCrit && isMob) this.potentialParticleLocs[locstr].isMob++
			if (foundCrit && !isMob) this.potentialParticleLocs[locstr].isMob--

			this.potentialParticleLocs[locstr].timestamp = Date.now()

			if (this.potentialParticleLocs[locstr].enchant >= 1 && this.potentialParticleLocs[locstr].step >= 2) {
				if (found) {
					found.type = this.potentialParticleLocs[locstr].isMob >= 1 ? 1 : (this.potentialParticleLocs[locstr].crit > this.potentialParticleLocs[locstr].enchant / 20 ? 0 : 2)
					return
				}
				this.burrialData.locations.push({
					"x": locarr[0],
					"y": locarr[1],
					"z": locarr[2],
					"type": this.potentialParticleLocs[locstr].isMob >= 1 ? 1 : (this.potentialParticleLocs[locstr].crit > this.potentialParticleLocs[locstr].enchant / 20 ? 0 : 2),
					"tier": -1,
					"chain": -1,
					"fromApi": false
				})
				World.playSound("note.pling", 100, 2)
			}
		}
	}

	burrialClicked() {
		this.locs = []
		this.predictions = []
		// this.predictionsOld = []
		if (this.inquisWaypointSpawned) {
			socketConnection.sendInquisData({ loc: null });
			this.inquisWaypointSpawned = false
		}
		if (!this.showingWaypoints) return

		let nearestBurriali = undefined
		let nearestBurrialDist = Infinity

		this.burrialData.locations.forEach((loc, i) => {
			let dist = calculateDistanceQuick([loc.x, loc.y, loc.z], [Player.getX(), Player.getY(), Player.getZ()])
			if (dist < nearestBurrialDist) {
				nearestBurrialDist = dist
				nearestBurriali = i
			}
		})

		if (nearestBurriali === undefined) return;
		this.burrialData.locations[nearestBurriali].clicked = true

		this.burrialData.locations = this.burrialData.locations.filter(a => {
			if (!a.clicked) return true
			if (calculateDistanceQuick([a.x, a.y, a.z], [Player.getX(), Player.getY(), Player.getZ()]) < 15 * 15) return true;

			this.burrialData.historicalLocations.unshift(a)

			return false
		})
		if (this.burrialData.historicalLocations.length > 10) this.burrialData.historicalLocations.pop()
		if (this.lastPathCords) this.lastPathCords.shift()
	}

	abiSolverSoundPlay(pos, name, volume, pitch, categoryName, event) {
		if (!Player.getContainer()) return
		if (!Player.getContainer().getName().endsWith("Network Relay")) return

		if (name === "random.orb") return
		if (name === "dig.stone") return
		if (name === "game.player.hurt") return
		if (name === "fire.fire") return
		if (name === "random.explode") return
		if (name === "mob.wolf.whine") return

		if (name === "fireworks.twinkle") {
			this.abiSolverGuiOpen()
			return
		}
		if (name === "random.successful_hit") {
			this.abiSolverGuiOpen()
			return
		}
		// console.log(name)

		if (this.abiSolverSolition.length >= 4 && this.abiSolverSolition[3][1]) return

		this.abiSolverSolition[this.abiSolverSolition.length - 1][1] = pitch

		if (this.abiSolverSolition.length >= 4) {
			this.abiSolverSolition = [this.abiSolverSolition[0], this.abiSolverSolition[1], this.abiSolverSolition[2], this.abiSolverSolition[3]].sort((a, b) => a[1] - b[1])
			// console.log("sorting")
		}
	}
	abiSolverGuiClick(mx, my, button, gui, event) {
		if (!Player.getContainer()) return
		if (!Player.getContainer().getName().endsWith("Network Relay")) return

		if (this.abiSolverSolition.length >= 4) return
		let hoveredSlot = gui.getSlotUnderMouse();
		if (!hoveredSlot) return;

		let hoveredSlotId = hoveredSlot[f.slotNumber];

		let clicked = Player.getContainer().getStackInSlot(hoveredSlotId).getMetadata()

		if (clicked !== 4) return

		// console.log("asd", clicked, button)

		let x = hoveredSlotId % 9
		let y = Math.floor(hoveredSlotId / 9)

		this.abiSolverX = x
		if (this.abiSolverSolition.some(a => a[0] === y)) return

		this.abiSolverSolition.push([y])

		// console.log(x, y)
	}
	abiSolverGuiRender(mx, my, gui) {
		if (!Player.getContainer()) return
		if (!Player.getContainer().getName().endsWith("Network Relay")) return

		Renderer.translate(0, 0, 1000)
		Renderer.drawString("&0", 0, 0, true)
		if (this.abiSolverSolition.length >= 4 && this.abiSolverSolition[3][1]) {

			let first = true
			for (let i = 0; i < 4; i++) {
				if (Player.getContainer().getStackInSlot(this.abiSolverSolition[i][0] * 9 + this.abiSolverX)?.getMetadata() !== 4) continue

				let rx = Renderer.screen.getWidth() / 2 + ((this.abiSolverX - 4) * 18) - 3;
				let ry = (Renderer.screen.getHeight() + 10) / 2 + ((this.abiSolverSolition[i][0] - Player.getContainer().getSize() / 18) * 18) - 3

				Renderer.translate(0, 0, 1000)
				Renderer.drawString("&" + (first ? "a" : "0") + (i + 1), rx, ry, true)
				first = false
			}
		} else {
			if (!this.abiSolverX) {
				for (let i = 0; i < 4; i++) {
					let x = i * 2 + 1
					if (Player.getContainer().getStackInSlot(9 + x).getMetadata() === 4) {
						this.abiSolverX = x
					}
				}
			}

			if (!this.abiSolverX) return
			let first = true

			for (let i = 0; i < 4; i++) {
				if (this.abiSolverSolition.some(a => a[0] === i + 1)) continue

				let rx = Renderer.screen.getWidth() / 2 + ((this.abiSolverX - 4) * 18) - 3;
				let ry = (Renderer.screen.getHeight() + 10) / 2 + ((i + 1 - Player.getContainer().getSize() / 18) * 18) - 3

				Renderer.translate(0, 0, 1000)
				Renderer.drawString("&" + (first ? "a" : "0") + "?", rx, ry, true)
				first = false
			}
		}
	}
	abiSolverGuiOpen() {
		this.abiSolverX = 0
		this.abiSolverSolition = []
	}

	initVariables() {
		this.burrialData = undefined
		this.potentialParticleLocs = undefined
		this.showingWaypoints = undefined
		this.lastPath = undefined
		this.updatingPath = undefined
		this.lastPathCords = undefined
		this.hudElements = [];
		this.Mobs = []
	}

	onDisable() {
		this.hudElements.forEach(h => h.delete())
		this.initVariables();
	}
}

module.exports = {
	class: new Events()
}
