/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import { drawBoxAtBlock, drawLine } from "../../utils/renderUtils";
import ToggleSetting from "../settings/settingThings/toggle";
const MCBlock = Java.type("net.minecraft.block.Block");

class Nether extends Feature {
	constructor() {
		super();
	}

	onEnable() {
		this.initVariables();

		this.masteryTimer = new ToggleSetting("Mastery Timer", "Countdown untill a block will turn red", true, "nether_mastery_timer", this)
		this.speedNextBlock = new ToggleSetting("Show next block to stand on for dojo swiftness", "", true, "dojo_swiftness", this)

		this.registerCustom("packetReceived", this.packetReceived)

		this.registerStep(true, 1, this.step1S)
		this.registerEvent("renderWorld", this.renderWorld)

		this.blocks = []
		this.inSwiftness = false
		this.lastBlock = undefined
		this.registerChat("&r&r&r                    &r&aTest of Swiftness &r&e&lOBJECTIVES&r", () => {
			if (this.speedNextBlock.getValue()) {
				this.inSwiftness = true
				this.lastBlock = [Math.floor(Player.getX()), Math.floor(Player.getY()) - 1, Math.floor(Player.getZ())]
			}
		})
		this.registerChat("&r&r&r           ${*}&r&6Your Rank: &r${*}&r", () => {
			this.inSwiftness = false
			this.lastBlock = undefined
		})
	}

	packetReceived(packet, event) {
		if (!this.masteryTimer.getValue()) return
		let packetType = new String(packet.class.getSimpleName()).valueOf()
		if (packetType === "S23PacketBlockChange") {
			let position = new BlockPos(packet[m.getBlockPosition.S23PacketBlockChange]())
			let blockState = this.getBlockIdFromState(packet[m.getBlockState.S23PacketBlockChange]())
			let oldBlockState = this.getBlockIdFromState(World.getBlockStateAt(position))
			if (oldBlockState === 20515 && blockState === 16419) {
				this.blocks.push({ loc: position, time: Date.now() + 3000 })
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
			})
		}
	}

	renderWorld(event) {
		if (this.masteryTimer.getValue()) {
			this.blocks.forEach(data => {
				Tessellator.drawString(Math.max(0, (data.time - Date.now()) / 1000).toFixed(1) + "s", data.loc.getX() + 0.5, data.loc.getY() + 0.5, data.loc.getZ() + 0.5, 0, false, 0.05, false)
			})
			if (this.blocks.length >= 2) drawLine(this.blocks[0].loc.getX(), this.blocks[0].loc.getY(), this.blocks[0].loc.getZ(), this.blocks[1].loc.getX(), this.blocks[1].loc.getY(), this.blocks[1].loc.getZ(), 255, 0, 0)
		}

		if (this.lastBlock && this.inSwiftness) drawBoxAtBlock(this.lastBlock[0], this.lastBlock[1], this.lastBlock[2], 0, 255, 0, 1, 1)
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