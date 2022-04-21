/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import ToggleSetting from "../settings/settingThings/toggle";
const MCBlock = Java.type("net.minecraft.block.Block");

class Nether extends Feature {
	constructor() {
		super();
	}

	onEnable() {
		this.initVariables();

		this.masteryTimer = new ToggleSetting("Mastery Timer", "Countdown untill a block will turn red", true, "nether_mastery_timer", this)

		this.registerCustom("packetReceived", this.packetReceived)

		this.registerStep(true, 1, this.step1S)
		this.registerEvent("renderWorld", this.renderWorld)

		this.blocks = []
	}

	packetReceived(packet, event) {
		let packetType = new String(packet.class.getSimpleName()).valueOf()
		if (packetType !== "S23PacketBlockChange") return;
		let position = new BlockPos(packet[m.getBlockPosition.S23PacketBlockChange]())
		let blockState = this.getBlockIdFromState(packet[m.getBlockState.S23PacketBlockChange]())
		let oldBlockState = this.getBlockIdFromState(World.getBlockStateAt(position))
		if (oldBlockState === 20515 && blockState === 16419) {
			this.blocks.push({ loc: position, time: Date.now() + 3000 })
		}
		if (blockState === 57379) {
			this.blocks.filter(b => {
				if (b.loc.x === position.x && b.loc.y === position.y && b.loc.z === position.z) {
					return false
				}
				return true
			})
		}
		//air=0
		//green=20515
		//yellow=16419
		//red=57379
	}

	renderWorld(event) {
		this.blocks.forEach(data => {
			Tessellator.drawString(Math.max(0, (data.time - Date.now()) / 1000).toFixed(1) + "s", data.loc.getX() + 0.5, data.loc.getY() + 0.5, data.loc.getZ() + 0.5, 0, false, 0.05, false)
		})
	}

	step1S() {
		this.blocks = this.blocks.filter(state => Date.now() < state.time)
	}

	getBlockIdFromState(state) {
		return MCBlock[m.getStateId](state)
	}

	initVariables() {
	}

	onDisable() {
		this.initVariables();
	}
}

let nether = new Nether()
module.exports = {
	class: nether,
};