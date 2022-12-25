/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import { uuidFromUsername } from "../../utils/utils"
import { SoopyGui } from "../../../guimanager/";

// Still in development

class PlayerNotes extends Feature {
	constructor() {
		super();
	}

	onEnable() {
		this.loadedNotes = []

		this.notesGui = new SoopyGui()

		this.registerCommand("soopynotes", this.openNotesGui)
		this.registerCommand("sn", this.openNotesGui)
	}

	openNotesGui() {
		this.notesGui.open()
	}

	onDisable() {
	}
}

module.exports = {
	class: new PlayerNotes(),
};

class Notes {
	constructor(name, canEdit, owner) {
		/**
		 * Map from uuid to
		 * An array of [note, timestamp, uuid who added]
		 * @type {Map<String, [String, Number, String][]}
		 */
		this.playerMap = new Map()

		this.notesName = name

		this.canEditNotes = canEdit

		this.ownerOfNotes = owner
	}

	/**
	 * @param {String} username
	 * @returns {Boolean} succcess
	 */
	async addPlayerFromUsername(username, note) {
		let uuid = await uuidFromUsername(username)
		if (!uuid) return false //invalid username

		let playerData = this.playerMap.get(uuid)
		if (!playerData) playerData = []

		playerData.push([note, Date.now(), Player.getUUID().toString()])

		this.playerMap.set(uuid, playerData)

		return true
	}

	/**
	 * @param {String} uuid 
	 * @returns {[String, Number, String][]} An array of [note, timestamp, uuid who added], or undefined
	 */
	getNotesFromUuid(uuid) {
		return this.playerMap.get(uuid)
	}

	/**
	 * @param {String} username 
	 * @returns {[String, Number, String][]} An array of [note, timestamp, uuid who added], or undefined
	 */
	async getNotesFromUsername(username) {
		let uuid = await uuidFromUsername(username)
		if (!uuid) return undefined //invalid username

		return this.playerMap.get(uuid)
	}
}