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

		//TODO: load notes from file
		//TODO: load / sync notes from server
	}

	openNotesGui() {
		this.notesGui.open()
	}

	onDisable() {
		//TODO: save notes to file
	}
}

module.exports = {
	class: new PlayerNotes(),
};

class Notes {
	constructor(name, canEdit, owner) {
		/**
		 * Map from uuid to
		 * Object of: username, when the username was last updated thru api, and an array of notes in the format
		 * [Note, timestamp, uuid who added]
		 * @type {Map<String, {username: String, usernameUpdated, Number, notes: [String, Number, String][]}}
		 */
		this.playerMap = new Map()

		/**
		 * USERNAME IS LOWERCASE
		 * @type {Map<String, String>}
		 */
		this.usernametoUUID = new Map()

		this.notesName = name

		this.canEditNotes = canEdit

		this.ownerOfNotes = owner

		this.noteEditId = 0
	}

	/**
	 * Turns this notes class to a json object able to be saved
	 */
	toJSON() {
		let data = {}

		data.notesName = this.notesName
		data.canEditNotes = this.canEditNotes
		data.owner = this.ownerOfNotes
		data.noteEditId = this.noteEditId

		data.playerNotes = []
		this.playerMap.forEach((data, uuid) => {
			data.playerNotes.push([uuid, data])
		})

		return data
	}

	/** 
	 * @returns {Notes} 
	 */
	static fromJSON(data) {
		let notes = new Notes(data.notesName, data.canEditNotes, data.owner)

		notes.noteEditId = data.noteEditId

		for (let dataL of data.playerNotes) {
			let [uuid, data] = dataL

			notes.playerMap.set(uuid, data)

			notes.usernametoUUID.set(data.username.toLowerCase(), uuid)
		}

		return notes
	}

	/**
	 * @param {String} username
	 * @returns {Boolean} succcess
	 */
	async addPlayerFromUsername(username, note) {
		let uuid = await uuidFromUsername(username)
		if (!uuid) return false //invalid username

		let playerData = this.playerMap.get(uuid)
		if (!playerData) playerData = { username: username, usernameUpdated: Date.now(), notes: [] }

		playerData.notes.push([note, Date.now(), Player.getUUID().toString()])

		this.playerMap.set(uuid, playerData)

		return true
	}

	/**
	 * @param {String} uuid 
	 * @returns {username: String, usernameUpdated, Number, notes: [String, Number, String][]} .notes is array of [note, timestamp, uuid who added]
	 */
	getNotesFromUuid(uuid) {
		return this.playerMap.get(uuid)
	}

	/**
	 * @param {String} username 
	 * @returns {username: String, usernameUpdated, Number, notes: [String, Number, String][]} .notes is array of [note, timestamp, uuid who added]
	 */
	async getNotesFromUsernameApi(username) {
		let uuid = await uuidFromUsername(username)
		if (!uuid) return undefined //invalid username

		return this.playerMap.get(uuid)
	}

	/**
	 * @param {String} username 
	 * @returns {username: String, usernameUpdated, Number, notes: [String, Number, String][]} .notes is array of [note, timestamp, uuid who added]
	 */
	getNotesFromUsername(username) {
		let uuid = this.usernametoUUID.get(username.toLowerCase())
		if (!uuid) return undefined //invalid username

		return this.playerMap.get(uuid)
	}
}