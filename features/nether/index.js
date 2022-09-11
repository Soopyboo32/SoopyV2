/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { f, m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import socketConnection from "../../socketConnection";
import { drawBoxAtBlock, drawBoxAtBlockNotVisThruWalls, drawBoxAtEntity, drawCoolWaypoint, drawLine, drawLineWithDepth, renderBeaconBeam } from "../../utils/renderUtils";
import ToggleSetting from "../settings/settingThings/toggle";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
const MCBlock = Java.type("net.minecraft.block.Block");
const ArmorStand = Java.type("net.minecraft.entity.item.EntityArmorStand")
const MCItem = Java.type("net.minecraft.item.Item");
const EntitySkeleton = Java.type("net.minecraft.entity.monster.EntitySkeleton")

let locationData = {
	barbarian: {
		"Ⓐ": [16, 148, -929],
		"Ⓑ": [-37, 122, -1020],
		"Ⓒ": [-30, 137, -888],
		"Ⓓ": [-6, 156, -881],
	},
	mage: {
		"Ⓐ": [-664, 124, -981],
		"Ⓑ": [-635, 160, -1056],
		"Ⓒ": [-726, 123, -997],
		"Ⓓ": [-685, 124, -1049],
	}
}

let disciplineColors = {
	"Wood": [196, 100, 0],
	"Iron": [194, 194, 194],
	"Gold": [235, 182, 0],
	"Diamond": [0, 198, 229]
}

class Nether extends Feature {
	constructor() {
		super();
	}

	isInDojo() {
		if (!this.FeatureManager || !this.FeatureManager.features["dataLoader"]) return false
		return this.FeatureManager.features["dataLoader"].class.areaFine === "Dojo" || this.FeatureManager.features["dataLoader"].class.areaFine === "Dojo Arena"
	}

	isInNether() {
		if (!this.FeatureManager || !this.FeatureManager.features["dataLoader"]) return false
		return this.FeatureManager.features["dataLoader"].class.area === "Crimson Isle"
	}

	onEnable() {
		this.initVariables();

		this.masteryTimer = new ToggleSetting("Mastery Timer", "Countdown untill a block will turn red", true, "nether_mastery_timer", this)
		this.speedNextBlock = new ToggleSetting("Show next block to stand on for dojo swiftness", "", true, "dojo_swiftness", this)
		this.tenacityLine = new ToggleSetting("Show line for fireball in dojo tenacity", "This may help you to dodge the fireballs", false, "dojo_tanacity", this)
		this.disciplineOverlay = new ToggleSetting("Show overlay for zombies in dojo discipline", "", true, "dojo_discipline", this).contributor("Empa")
		this.controlHelper = new ToggleSetting("Shows where you actually have to look for", "control dojo task (accounts for ping)", true, "control_helper", this)
		this.hostageWaypoints = new ToggleSetting("Show hostage waypoints", "Waypoint for location of hostage in rescue missions", true, "hostage_waypoint", this)
		this.slugfishTimer = new ToggleSetting("Show timer over rod", "This may help with fishing slugfish", false, "slugfish_timer", this)

		this.minibossNametag = new ToggleSetting("Nether Miniboss Nametag Hud", "renders the HP of minibosses on screen (exclude Magma Boss)", false, "nether_mini_nametag_hud", this);
		this.minibossNametagElement = new HudTextElement()
			.setText("")
			.setToggleSetting(this.minibossNametag)
			.setLocationSetting(new LocationSetting("Nether Miniboss Nametag Hud location", "allows you to change the location of the hud", "nether_mini_nametag_hud_location", this, [10, 100, 1, 1]).requires(this.minibossNametag).editTempText("&5&lMage Outlaw &r&a70M&c❤"));
		this.hudElements.push(this.minibossNametagElement);

		this.registerStep(true, 5, this.minibossHPHud)

		this.todoE = []
		this.todoE2 = []
		this.blocks = []

		this.todoF = []
		this.todoF2 = []
		this.todoM = []
		this.todoM2 = []
		this.disciplineZombies = {
			"Wood": [],
			"Iron": [],
			"Gold": [],
			"Diamond": []
		}
		this.inDiscipline = false

		this.dojoFireBalls = []
		this.inSwiftness = false
		this.rescueMissionDifficulty = undefined
		this.rescueMissionType = undefined
		this.lastBlock = undefined
		this.hookThrown = 0
		this.controlSkeleton = undefined
		this.controlLocLast = undefined
		this.controlLoc = undefined
		this.registerChat("                      Test of Control OBJECTIVES", () => {
			this.controlSkeleton = undefined
			this.controlLocLast = undefined
			this.controlLoc = undefined
		})

		let packetRecieved = this.registerCustom("packetReceived", this.packetReceived).registeredWhen(() => this.isInDojo())

		try {
			packetRecieved.trigger.setPacketClasses([net.minecraft.network.play.server.S23PacketBlockChange, net.minecraft.network.play.server.S22PacketMultiBlockChange])
		} catch (e) { }//older ct version

		this.registerStep(true, 1, this.step1S).registeredWhen(() => this.isInNether())
		this.registerEvent("renderWorld", this.renderWorld).registeredWhen(() => this.isInNether())

		this.registerForge(net.minecraftforge.event.entity.EntityJoinWorldEvent, this.entityJoinWorldEvent).registeredWhen(() => this.isInDojo() || (this.isInNether() && this.minibossNametag.getValue()));
		this.registerEvent("tick", this.tick).registeredWhen(() => this.isInNether())
		this.registerChat("&r&r&r                    &r&aTest of Swiftness &r&e&lOBJECTIVES&r", () => {
			if (this.speedNextBlock.getValue()) {
				this.inSwiftness = true
				this.lastBlock = [Math.floor(Player.getX()), Math.floor(Player.getY()) - 1, Math.floor(Player.getZ())]
			}
		})

		this.registerChat("&r&r&r                     &r&cTest of Discipline &r&e&lOBJECTIVES&r", () => {
			if (this.disciplineOverlay.getValue()) {
				this.inDiscipline = true
				this.todoF = []
				this.todoF2 = []
			}
		})

		this.registerChat("&r&r&r           ${*}&r&6Your Rank: &r${*}&r", () => {
			this.inSwiftness = false
			this.lastBlock = undefined
			this.inDiscipline = false

			this.controlLocLast = undefined
			this.controlLoc = undefined
			this.controlSkeleton = undefined
		})
		this.registerEvent("worldLoad", () => {
			this.inSwiftness = false
			this.lastBlock = undefined
			this.inDiscipline = false

			this.controlLocLast = undefined
			this.controlLoc = undefined
			this.controlSkeleton = undefined
		})

		this.registerChat("You completed your rescue quest! Visit the Town Board to claim the rewards,", () => {
			this.rescueMissionDifficulty = this.rescueMissionType = undefined
		})
		this.registerEvent("worldLoad", () => {
			this.rescueMissionDifficulty = this.rescueMissionType = undefined
		})
	}

	tick() {

		let fishHook = Player.getPlayer()[f.fishEntity]

		if (fishHook) {
			if (!this.hookThrown) this.hookThrown = Date.now()
		} else {
			this.hookThrown = 0
		}

		if (Player.getContainer().getName() === "Rescue" && Player.getContainer().getStackInSlot(22)) {
			let difficulty = ChatLib.removeFormatting(Player.getContainer().getStackInSlot(22).getName()).trim()[0]

			this.rescueMissionDifficulty = difficulty
			TabList.getNames().forEach(n => {
				if (n.toLowerCase().includes("barbarian rep")) this.rescueMissionType = "barbarian"// : "mage"
				if (n.toLowerCase().includes("mage rep")) this.rescueMissionType = "mage"// : "mage"
			})
		}


		this.todoF2.forEach(e => {
			let name = ChatLib.removeFormatting(e.getName())
			if (!name) return
			if (!disciplineColors[name]) return

			this.disciplineZombies[name].push(e)
		})

		this.todoF2 = this.todoF
		this.todoF = []

		this.todoE2.forEach(e => {
			let item = e[m.getHeldItem]()
			if (!item) return
			if (MCItem[m.getIdFromItem](item[m.getItem.ItemStack]()) !== 173) return

			this.dojoFireBalls.push(e)
		})

		this.todoE2 = this.todoE
		this.todoE = []


		if (this.controlHelper.getValue() && this.controlSkeleton) {
			let ping = this.FeatureManager.features["dataLoader"].class.getPing() / 1000

			let e = this.controlSkeleton
			let x = e.getX() + (e.getX() - e.getLastX()) * (20 * ping)
			let y = e.getY() + (e.getY() - e.getLastY()) * (20 * ping)
			let z = e.getZ() + (e.getZ() - e.getLastZ()) * (20 * ping)
			if (x === e.getX() && y === e.getY() && z === e.getZ()) return

			while (World.getBlockAt(x, y, z).getType().getID() !== 0) { y += 0.2 }

			if (this.controlLoc) this.controlLocLast = [...this.controlLoc]
			this.controlLoc = [x - 0.5, y, z - 0.5]
		} else {
			this.controlLocLast = undefined
			this.controlLoc = undefined
		}

		this.todoM2.forEach(e => {
			let name = e[m.getCustomNameTag]()
			if (name) {
				if (name.includes("Ashfang") || name.includes("Barbarian Duke X") || name.includes("Bladesoul") || name.includes("Mage Outlaw")) {
					this.miniboss = new Entity(e)
				}
			}
		})

		this.todoM2 = this.todoM
		this.todoM = []
	}

	entityJoinWorldEvent(event) {
		if (this.tenacityLine.getValue() && event.entity instanceof ArmorStand) this.todoE.push(event.entity)
		if (this.disciplineOverlay.getValue() && this.inDiscipline && event.entity instanceof ArmorStand) this.todoF.push(new Entity(event.entity))

		if (event.entity instanceof EntitySkeleton && !this.controlSkeleton) this.controlSkeleton = new Entity(event.entity)
		if (this.minibossNametag.getValue() && event.entity instanceof ArmorStand) {
			this.todoM.push(event.entity)
		}
	}

	packetReceived(packet, event) {
		if (!this.masteryTimer.getValue()) return
		let packetType = new String(packet.class.getSimpleName()).valueOf()
		if (packetType === "S23PacketBlockChange") {
			let position = new BlockPos(packet[m.getBlockPosition.S23PacketBlockChange]())
			let blockState = this.getBlockIdFromState(packet[m.getBlockState.S23PacketBlockChange]())
			let oldBlockState = this.getBlockIdFromState(World.getBlockStateAt(position))
			if (oldBlockState === 20515 && blockState === 16419) {
				if (Math.abs(Player.getX() - position.getX()) <= 20 && Math.abs(Player.getY() - position.getY()) <= 20 && Math.abs(Player.getZ() - position.getZ()) <= 20) {
					this.blocks.push({ loc: position, time: Date.now() + 3000 })
				}
			}
			if (blockState === 57379) {
				this.blocks = this.blocks.filter(b => {
					if (b.loc.x === position.x && b.loc.y === position.y && b.loc.z === position.z) {
						return false
					}
					return true
				})
				//air=0
				//green=20515
				//yellow=16419
				//red=57379
			}
			if (oldBlockState === 0 && blockState === 20515 && this.inSwiftness) {
				this.lastBlock = [position.getX(), position.getY(), position.getZ()]
			}
		}
		if (packetType === "S22PacketMultiBlockChange") {
			packet[m.getChangedBlocks]().forEach(b => {
				let position = new BlockPos(b[m.getPos.S22PacketMultiBlockChange$BlockUpdateData]())
				let blockState = this.getBlockIdFromState(b[m.getBlockState.S22PacketMultiBlockChange$BlockUpdateData]())
				let oldBlockState = this.getBlockIdFromState(World.getBlockStateAt(position))
				if (oldBlockState === 0 && blockState === 20515 && this.inSwiftness) {
					this.lastBlock = [position.getX(), position.getY(), position.getZ()]
				}
				if (oldBlockState === 20515 && blockState === 16419) {
					if (Math.abs(Player.getX() - position.getX()) <= 20 && Math.abs(Player.getY() - position.getY()) <= 20 && Math.abs(Player.getZ() - position.getZ()) <= 20) {
						this.blocks.push({ loc: position, time: Date.now() + 3000 })
					}
				}
				if (blockState === 57379) {
					this.blocks = this.blocks.filter(b => {
						if (b.loc.x === position.x && b.loc.y === position.y && b.loc.z === position.z) {
							return false
						}
						return true
					})
					//air=0
					//green=20515
					//yellow=16419
					//red=57379
				}
			})
		}
	}

	renderWorld(ticks) {
		if (this.masteryTimer.getValue() && this.blocks) {
			this.blocks.forEach((data, i) => {
				Tessellator.drawString((i === 0 ? "§1" : "§0") + Math.max(0, (data.time - Date.now()) / 1000).toFixed(1) + "s", data.loc.getX() + 0.5, data.loc.getY() + 0.5, data.loc.getZ() + 0.5, 0, false, 0.05, false)
			})
			if (this.blocks.length >= 2) drawLine(this.blocks[0].loc.getX() + 0.5, this.blocks[0].loc.getY(), this.blocks[0].loc.getZ() + 0.5, this.blocks[1].loc.getX() + 0.5, this.blocks[1].loc.getY(), this.blocks[1].loc.getZ() + 0.5, 255, 0, 0)
		}

		if (this.lastBlock && this.inSwiftness) drawBoxAtBlock(this.lastBlock[0], this.lastBlock[1], this.lastBlock[2], 0, 255, 0, 1, 1)

		if (this.tenacityLine.getValue()) this.dojoFireBalls.forEach(e => {
			let offset = [e[f.width.Entity] / 2, e[f.height.Entity] / 2, e[f.width.Entity] / 2]
			let entitylocation = [e[f.posX.Entity], e[f.posY.Entity], e[f.posZ.Entity]]
			let lastLocation = [e[f.prevPosX], e[f.prevPosY], e[f.prevPosZ]]
			let change = [entitylocation[0] - lastLocation[0], entitylocation[1] - lastLocation[1], entitylocation[2] - lastLocation[2]]
			drawLineWithDepth(entitylocation[0] + change[0] * 100 + offset[0], entitylocation[1] + change[1] * 100 + offset[1], entitylocation[2] + change[2] * 100 + offset[2], entitylocation[0] + offset[0], entitylocation[1] + offset[1], entitylocation[2] + offset[2], 255, 0, 0, 2)
		})

		if (this.disciplineOverlay.getValue() && Player.getHeldItem() && this.disciplineZombies[ChatLib.removeFormatting(Player.getHeldItem().getName().split(" ")[0].replace("en", ""))]) this.disciplineZombies[ChatLib.removeFormatting(Player.getHeldItem().getName().split(" ")[0].replace("en", ""))].forEach(e => {
			let color = disciplineColors[ChatLib.removeFormatting(e.getName())]

			drawBoxAtEntity(e, color[0] / 255, color[1] / 255, color[2] / 255, 0.7, -2, ticks, 4, false);
		})

		if (this.rescueMissionDifficulty && this.rescueMissionType && this.hostageWaypoints.getValue()) {
			let location = locationData[this.rescueMissionType][this.rescueMissionDifficulty]
			drawCoolWaypoint(location[0], location[1], location[2], 255, 0, 0, { name: "Hostage" })
		}

		if (this.slugfishTimer.getValue()) {
			let hook = Player.getPlayer()[f.fishEntity]
			if (hook && this.hookThrown) {
				let x = hook[f.posX.Entity]
				let y = hook[f.posY.Entity]
				let z = hook[f.posZ.Entity]

				Tessellator.drawString(((Date.now() - this.hookThrown) / 1000).toFixed(1) + "s", x, y + 0.5, z, Renderer.color(0, 255, 50), false, 0.025, false)
			}
		}

		if (this.controlLoc && this.controlLocLast) {
			drawBoxAtBlockNotVisThruWalls(this.controlLoc[0] * ticks + this.controlLocLast[0] * (1 - ticks), this.controlLoc[1] * ticks + this.controlLocLast[1] * (1 - ticks), this.controlLoc[2] * ticks + this.controlLocLast[2] * (1 - ticks), 255, 0, 0, 1, 2)
		}
	}

	step1S() {
		if (this.blocks) this.blocks = this.blocks.filter(state => Date.now() < state.time)
		if (this.disciplineZombies) Object.keys(this.disciplineZombies).forEach(k => {
			this.disciplineZombies[k] = this.disciplineZombies[k].filter(e => !e.getEntity()[f.isDead])
		})
		if (this.dojoFireBalls) this.dojoFireBalls = this.dojoFireBalls.filter(e => !e[f.isDead])
	}

	getBlockIdFromState(state) {
		return MCBlock[m.getStateId](state)
	}

	minibossHPHud() {
		if (this.miniboss && this.miniboss.getEntity()[f.isDead]) this.miniboss = undefined
		if (!this.minibossNametag.getValue() || !this.miniboss) {
			this.minibossNametagElement.setText("")
			return
		}
		let name = this.miniboss.getName()
		let nameRemoveFormat = name.removeFormatting()
		let mobName = ""
		if (nameRemoveFormat.includes("Ashfang")) mobName = "&dAshfang"
		if (nameRemoveFormat.includes("Bladesoul")) mobName = "&dBladesoul"
		if (nameRemoveFormat.includes("Barbarian Duke X")) mobName = "&dBarbarian Duke X"
		if (nameRemoveFormat.includes("Mage Outlaw")) mobName = "&dMage Outlaw"
		if (!mobName) {
			this.minibossNametagElement.setText("")
			return
		}
		let indexOfHP = {
			"&dAshfang": 3,
			"&dBladesoul": 3,
			"&dBarbarian Duke X": 5,
			"&dMage Outlaw": 4
		}
		let HP = `&l${mobName} &r${name.split(" ")[indexOfHP[mobName]].split("/")[0]}&c❤`
		this.minibossNametagElement.setText(HP)
	}

	initVariables() {
		this.hudElements = [];
		this.miniboss = undefined
	}

	onDisable() {
		this.hudElements.forEach(h => h.delete())
		this.initVariables();
	}
}

let nether = new Nether()
module.exports = {
	class: nether,
};

function getField(e, field) {

	let field2 = e.class.getDeclaredField(field);

	field2.setAccessible(true)

	return field2.get(e)
}
