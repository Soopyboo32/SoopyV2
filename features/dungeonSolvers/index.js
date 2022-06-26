/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { f, m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import { numberWithCommas } from "../../utils/numberUtils";
import * as renderUtils from "../../utils/renderUtils";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";
import { fetch } from "../../utils/networkUtils";
import { delay } from "../../utils/delayUtils";
import { Waypoint } from "../../utils/renderJavaUtils";

const EntityBlaze = Java.type("net.minecraft.entity.monster.EntityBlaze");
let translate;
try {
	translate = net.minecraft.util.StringTranslate.func_74808_a();
} catch (e) {
	//player doesent have translate (using english default)
}

class DungeonSolvers extends Feature {
	constructor() {
		super();
	}

	isInDungeon() {
		if (!this.FeatureManager || !this.FeatureManager.features["dataLoader"]) return false
		return this.FeatureManager.features["dataLoader"].class.isInDungeon
	}

	onEnable() {
		this.initVariables();

		this.lividData = {};
		this.lividData.lividColor = {
			Vendetta: "&f",
			Crossed: "&d",
			Hockey: "&c",
			Doctor: "&7",
			Frog: "&2",
			Smile: "&a",
			Scream: "&9",
			Purple: "&5",
			Arcade: "&e",
		};
		this.onWorldLoad();

		this.lividFindEnabled = new ToggleSetting("Correct livid finder", "Finds the real livid to kill in the f5 boss fight", true, "livid_find_enabled", this);
		this.lividFindHud = new ToggleSetting("Show Livid Hp", "Shows the nametag of the correct livid", true, "livid_hud_enabled", this).requires(this.lividFindEnabled);
		this.lividHpElement = new HudTextElement().setToggleSetting(this.lividFindHud).setLocationSetting(new LocationSetting("Correct Livid Hp Location", "Allows you to edit the location of the correct livid hp text", "livid_hp_location", this, [10, 50, 1, 1]).requires(this.lividFindHud).editTempText("§r§e﴾ §c§lLivid§r §a7M§c❤ §e﴿§r"));

		this.hudElements.push(this.lividHpElement);

		this.lividFindBox = new ToggleSetting("Put a box around the correct livid", "This helps to locate it in the group", true, "livid_box_enabled", this).requires(this.lividFindEnabled);
		this.lividFindNametags = new ToggleSetting("Hide the nametags of incorrect livids", "This helps to locate it in the group", true, "livid_nametags_enabled", this).requires(this.lividFindEnabled);

		this.spiritBowDestroyTimer = new ToggleSetting("Timer for when the spirit bow will self destruct", "", true, "spirit_bow_destroy_timer", this);
		this.spiritBowDestroyElement = new HudTextElement().setToggleSetting(this.spiritBowDestroyTimer).setLocationSetting(new LocationSetting("Spirit bow destroy timer location", "Allows you to edit the location of the timer", "spirit_destroy_location", this, [10, 70, 3, 1]).requires(this.spiritBowDestroyTimer).editTempText("&dBow Destroyed in: &c15s"));

		this.spiritBearSpawnTimer = new ToggleSetting("Timer for when the spirit bear will spawn", "", true, "spirit_bear_spawn_timer", this);
		this.spiritBearSpawnElement = new HudTextElement().setToggleSetting(this.spiritBearSpawnTimer).setLocationSetting(new LocationSetting("Spirit bear spawn timer location", "Allows you to edit the location of the timer", "spirit_bear_spawn_location", this, [10, 70, 3, 1]).requires(this.spiritBearSpawnTimer).editTempText("&dBear spawned in: &c1.57s"));

		this.hudElements.push(this.spiritBearSpawnElement);
		this.hudElements.push(this.spiritBowDestroyElement);

		this.bloodCampAssist = new ToggleSetting("Assist blood camp", "Helps guess where and when blood mobs will spawn", true, "blood_camp_assist", this);

		this.runSpeedRates = new ToggleSetting("Show run speed and exp rates", "(Run speed includes downtime inbetween runs, only shows while doing dungeon runs)", true, "run_speed_rates", this);
		this.runSpeedRatesElement = new HudTextElement()
			.setText("&6Run speed&7> &fLoading...\n&6Exp/hour&7> &fLoading...\n&6Runs/hour&7> &fLoading...")
			.setToggleSetting(this.runSpeedRates)
			.setLocationSetting(new LocationSetting("Run speed and exp rates location", "Allows you to edit the location of the information", "run_speed_rates_location", this, [10, 100, 1, 1]).requires(this.runSpeedRates).editTempText("&6Run speed&7> &f4:30\n&6Exp/hour&7> &f1,234,567\n&6Runs/hour&7> &f17"));

		this.scoreCalculation = new ToggleSetting("Show score calculation", "", true, "run_score_calc", this);
		this.scoreElement = new HudTextElement().setToggleSetting(this.scoreCalculation).setLocationSetting(new LocationSetting("Score calculation location", "Allows you to edit the location of the score calc", "score_calc_location", this, [10, 130, 1, 1]).requires(this.scoreCalculation).editTempText("&dScore: 120\n&aS+ ??\n&aS  ??"));

		this.hudElements.push(this.runSpeedRatesElement);
		this.hudElements.push(this.scoreElement);

		this.blazeSolver = new ToggleSetting("Blaze Puzzle Solver", "Shows what order to kill the blazes in", true, "blaze_solver", this);

		this.lastDungFinishes = [];
		this.lastDungExps = [];
		this.registerChat("${start}+&r&3${exp} Catacombs Experience&r", (start, exp) => {
			if (ChatLib.removeFormatting(start).replace(/ /gi, "").length > 0) return;
			this.lastDungExps.push(parseFloat(exp.replace(/,/gi, "")));
			if (this.lastDungExps.length > 5) {
				this.lastDungExps.shift();
			}

			this.lastDungFinishes.push(Date.now());
			if (this.lastDungFinishes.length > 5) {
				this.lastDungFinishes.shift();
			}
		});
		this.forgorEnabled = new ToggleSetting("Change withermancer death message to forgor ", "", true, "withermancer_forgor", this);

		this.registerChat("&r&c ☠ &r${player} were killed by Withermancer&r&7 and became a ghost&r&7.&r", (player, e) => {
			if (this.forgorEnabled.getValue()) {
				cancel(e);
				ChatLib.chat(player + " forgor ☠");
			}
		});
		this.registerChat("&r&c ☠ &r${player} was killed by Withermancer&r&7 and became a ghost&r&7.&r", (player, e) => {
			if (this.forgorEnabled.getValue()) {
				cancel(e);
				ChatLib.chat(player + " forgor ☠");
			}
		});

		this.registerChat("&r&c ☠ ${info} and became a ghost&r&7.&r", (info, e) => {
			let player = ChatLib.removeFormatting(info.split(" ")[0])

			this.scanFirstDeathForSpiritPet(player)
		});

		this.spiritBowPickUps = [];
		this.registerChat("&r&aYou picked up the &r&5Spirit Bow&r&a! Use it to attack &r&cThorn&r&a!&r", () => {
			this.spiritBowPickUps.push(Date.now());
		});

		this.bearSpawning = 0;
		this.registerChat("&r&a&lThe &r&5&lSpirit Bow &r&a&lhas dropped!&r", () => {
			this.bearSpawning = -Date.now();
		});

		this.todoE = [];
		this.eMovingThing = {};
		this.nameToUuid = {
			"you": Player.getUUID().toString()
		}
		this.bloodX = -1;
		this.bloodY = -1;
		this.startSpawningTime = 0;
		this.spawnIdThing = 0;

		this.failedPuzzleCount = 0;
		this.totalPuzzleCount = 0;
		this.completedPuzzleCount = 0;

		this.checkingPing = false;
		this.lastPingCheck = 0;
		this.lastPings = [undefined, undefined, undefined];
		this.ping = 0;
		this.pingI = 0;
		this.ezpz = false

		this.arrows = [];
		this.blazes = [];
		this.blazeX = -1;
		this.blazeY = -1;

		this.dungeonSecretRquired = {
			1: 0.3,
			2: 0.4,
			3: 0.5,
			4: 0.6,
			5: 0.7,
			6: 0.85,
			7: 1,
		};
		this.floorSecondMod = {
			1: 120,
			2: 120,
			3: 120,
			4: 120,
			5: 240,
			6: 120,
			7: 360,
		};

		this.registerStep(true, 2, this.stepNotDung).registeredWhen(() => !this.isInDungeon());
		this.registerStep(true, 2, this.step).registeredWhen(() => this.isInDungeon());
		this.registerStep(false, 60, this.step)
		this.registerStep(true, 10, this.step2).registeredWhen(() => this.isInDungeon());
		this.registerStep(false, 60 * 5, this.step_5min)
		this.registerEvent("worldLoad", this.onWorldLoad);

		this.registerEvent("renderWorld", this.renderWorld).registeredWhen(() => this.isInDungeon());

		this.bloodOpenedBonus = false;
		this.goneInBonus = false;
		this.mimicDead = false
		this.inBoss = false
		this.registerChat("&r&cThe &r&c&lBLOOD DOOR&r&c has been opened!&r", () => {
			this.bloodOpenedBonus = true;
			this.goneInBonus = true;
		});
		this.registerChat("[BOSS] The Watcher: You have proven yourself. You may pass.", () => {
			delay(5000, () => {
				this.bloodOpenedBonus = false;
				this.goneInBonus = true;
			})
		});
		let enteredBossMessages = ["&r&4[BOSS] Maxor&r&c: &r&cWELL WELL WELL LOOK WHO’S HERE!&r", "&r&c[BOSS] Livid&r&f: Welcome, you arrive right on time. I am Livid, the Master of Shadows.&r", "&r&c[BOSS] Thorn&r&f: Welcome Adventurers! I am Thorn, the Spirit! And host of the Vegan Trials!&r", "&r&c[BOSS] The Professor&r&f: I was burdened with terrible news recently...&r", "&r&c[BOSS] Scarf&r&f: This is where the journey ends for you, Adventurers.&r", "&r&c[BOSS] Bonzo&r&f: Gratz for making it this far, but I’m basically unbeatable.&r", "&r&c[BOSS] Sadan&r&f: So you made it all the way &r&fhere...and&r&f you wish to defy me? Sadan?!&r"]
		enteredBossMessages.forEach(msg => {
			this.registerChat(msg, () => {
				this.goneInBonus = false;
				this.bloodOpenedBonus = false;
				this.inBoss = true
			});
		})
		this.registerEvent("entityDeath", (entity) => {
			if (entity.getClassName() === "EntityZombie") {
				if (entity.getEntity().func_70631_g_()) {
					if (entity.getEntity().func_82169_q(0) === null && entity.getEntity().func_82169_q(1) === null && entity.getEntity().func_82169_q(2) === null && entity.getEntity().func_82169_q(3) === null) {
						this.mimicDead = true
					}
				}
			}
		})
		let mimicDeadMessages = ["$SKYTILS-DUNGEON-SCORE-MIMIC$", "Mimic Killed!", "Mimic Dead!", "Mimic dead!"]
		this.registerChat("&r&9Party &8> ${msg}", (msg) => {
			mimicDeadMessages.forEach(dmsg => {
				if (msg.includes(dmsg)) this.mimicDead = true
			})
		})

		this.registerChat("&r&aDungeon starts in 1 second.&r", () => {
			this.goneInBonus = false;
			this.bloodOpenedBonus = false;

			this.firstDeath = false
			this.firstDeathHadSpirit = false
		})

		this.registerChat("&r&aDungeon starts in 1 second. Get ready!&r", () => {
			this.goneInBonus = false;
			this.bloodOpenedBonus = false;

			this.firstDeath = false
			this.firstDeathHadSpirit = false
		})

		this.firstDeath = false
		this.firstDeathHadSpirit = false

		this.registerChat("&b&bYou are currently connected to server &6${*}&r", (e) => {
			if (this.checkingPing) {
				this.lastPings[this.pingI % 3] = Date.now() - this.lastPingCheck;
				cancel(e);
				this.checkingPing = false;

				if (this.lastPings.includes(undefined)) {
					this.ping = this.lastPings[this.pingI % 3];
				} else {
					this.ping = [...this.lastPings].sort((a, b) => a - b)[1];
				}
				this.pingI++;
			}
		});

		this.registerForge(net.minecraftforge.event.entity.EntityJoinWorldEvent, this.entityJoinWorldEvent).registeredWhen(() => this.isInDungeon() && !this.inBoss);
		// this.registerEvent("renderEntity", this.renderEntity)
		this.renderEntityEvent = undefined;

		this.onWorldLoad();


		//TODO: finish this
		// let saidLocations = new Set()
		// let waypoints = []
		// let data = []
		// let area = 0
		// this.registerChat("", () => {
		// 	area++
		// })
		// this.registerStep(false, 3, () => {
		// 	World.getAllEntities().forEach(e => {
		// 		if (ChatLib.removeFormatting(e.getName()).toLowerCase().includes("inactive device")) {
		// 			addThing([Math.trunc(e.getX()), Math.trunc(e.getY()), Math.trunc(e.getZ())], "device")
		// 		}
		// 		if (ChatLib.removeFormatting(e.getName()).toLowerCase().includes("inactive terminal")) {
		// 			addThing([Math.trunc(e.getX()), Math.trunc(e.getY()), Math.trunc(e.getZ())], "terminal")
		// 		}
		// 		if (ChatLib.removeFormatting(e.getName()).toLowerCase().includes("not activated")) {
		// 			addThing([Math.trunc(e.getX()), Math.trunc(e.getY()), Math.trunc(e.getZ())], "lever")
		// 		}
		// 	})
		// 	waypoints.forEach(w => w.update())
		// })

		// function addThing(location, type) {
		// 	if (saidLocations.has(location.join(","))) return

		// 	saidLocations.add(location.join(","))

		// 	if (type === "lever") {
		// 		let finalLoc = undefined
		// 		for (let i = 5; i > -5; i--) {
		// 			if (World.getBlockAt(location[0], location[1] + i, location[2])?.getType()?.getID() === 69) {
		// 				finalLoc = [location[0], location[1] + i, location[2]]
		// 			}
		// 		}
		// 		ChatLib.chat("Loaded " + type)
		// 		data.push({ type: "lever", location: finalLoc, phase: area })
		// 		waypoints.push(new Waypoint(finalLoc[0], finalLoc[1], finalLoc[2], 1, 0, 0, { name: type + " | " + area }).startRender())
		// 		return
		// 	}
		// 	if (type === "terminal") {
		// 		let finalLoc = undefined
		// 		for (let x = 5; x > -5; x--) {
		// 			for (let y = 5; y > -5; y--) {
		// 				for (let z = 5; z > -5; z--) {
		// 					if (World.getBlockAt(location[0] + x, location[1] + y, location[2] + x)?.getType()?.getID() === 137) {
		// 						finalLoc = [location[0] + x, location[1] + y, location[2] + x]
		// 					}
		// 				}
		// 			}
		// 		}
		// 		ChatLib.chat("Loaded " + type)
		// 		data.push({ type: "terminal", location: finalLoc, phase: area })
		// 		waypoints.push(new Waypoint(finalLoc[0], finalLoc[1], finalLoc[2], 1, 0, 0, { name: type + " | " + area }).startRender())
		// 		return
		// 	}
		// 	ChatLib.chat("Loaded " + type)
		// 	waypoints.push(new Waypoint(finalLoc[0], finalLoc[1], finalLoc[2], 1, 0, 0, { name: type + " | " + area }).startRender())
		// 	data.push({ type: type, location: location, phase: area })
		// }

		// this.registerCommand("getdata", () => {
		// 	ChatLib.chat(JSON.stringify(data))
		// })

		//§r§6Soopyboo32§r§a activated a lever! (§r§c8§r§a/8)§r
		//§r§6Soopyboo32§r§a completed a device! (§r§c3§r§a/8)§r
		//§r§bBossmanLeo§r§a activated a terminal! (§r§c2§r§a/8)§r
	}

	step_5min() {
		this.ezpz = false
		if (!this.FeatureManager.features["dataLoader"].class.mayorData) return
		if (this.FeatureManager.features["dataLoader"].class.mayorData.mayor.name === "Paul") {
			if (this.FeatureManager.features["dataLoader"].class.currentMayorPerks.has("EZPZ")) {
				this.ezpz = true
			}
		}
	}

	calculateDungeonScore() {
		if (!this.FeatureManager.features["dataLoader"].class.dungeonFloor) {
			this.scoreElement.setText("");
			return;
		}

		if (!this.FeatureManager.features["dataLoader"].class.stats.Deaths) return

		// Information about the dungeon
		let deaths = parseInt(this.FeatureManager.features["dataLoader"].class.stats.Deaths.replace("(", "").replace(")", ""));

		let seconds = 0;
		if (this.FeatureManager.features["dataLoader"].class.stats.Time !== "Soon!") {
			let data = this.FeatureManager.features["dataLoader"].class.stats.Time.split(" ");
			seconds += parseInt(data.pop() || 0);
			seconds += parseInt(data.pop() || 0) * 60;
			seconds += parseInt(data.pop() || 0) * 60 * 60;
		}
		let timeLimit = this.FeatureManager.features["dataLoader"].class.dungeonFloor[0] === "M" ? 480 : this.floorSecondMod[this.FeatureManager.features["dataLoader"].class.dungeonFloor[1]];
		let inDungeonSeconds = seconds - timeLimit;

		let clearedPercent = this.FeatureManager.features["dataLoader"].class.dungeonPercentCleared;

		let dungeonFloor = this.FeatureManager.features["dataLoader"].class.dungeonFloor[1];

		let secretPercentRequired = this.FeatureManager.features["dataLoader"].class.dungeonFloor[0] === "M" ? 1 : this.dungeonSecretRquired[dungeonFloor];

		let clearedRooms = parseInt(this.FeatureManager.features["dataLoader"].class.stats["Completed Rooms"]);

		let totalRooms = clearedRooms / clearedPercent || 25;

		let currentSecretsFound = parseInt(this.FeatureManager.features["dataLoader"].class.stats["Secrets Found"]);
		let currentSecretPercent = parseFloat(this.FeatureManager.features["dataLoader"].class.stats["Secrets Found%"].replace("%", "")) / 100;

		let crypts = parseInt(this.FeatureManager.features["dataLoader"].class.stats["Crypts"]);

		let maxSecrets = currentSecretsFound / currentSecretPercent || 50;

		//Actual Score Calculation
		let skillScore = Math.floor(Math.max(20, (20 - (this.totalPuzzleCount - this.completedPuzzleCount) * 10 + (((80 * (clearedRooms + this.bloodOpenedBonus + this.goneInBonus)) / totalRooms) - deaths * 2 + this.firstDeathHadSpirit))));
		let exploreScore = (Math.floor((60 * (clearedRooms + this.bloodOpenedBonus + this.goneInBonus)) / totalRooms) + Math.floor(Math.min(40, (40 * currentSecretsFound) / secretPercentRequired / maxSecrets)));
		let speedScore;
		if (inDungeonSeconds < 480) {
			speedScore = 100;
		} else if (inDungeonSeconds < 600) {
			speedScore = Math.ceil(140 - inDungeonSeconds / 12);
		} else if (inDungeonSeconds < 840) {
			speedScore = Math.ceil(115 - inDungeonSeconds / 24);
		} else if (inDungeonSeconds < 1140) {
			speedScore = Math.ceil(108 - inDungeonSeconds / 30);
		} else if (inDungeonSeconds < 3940) {
			speedScore = Math.ceil(98.5 - inDungeonSeconds / 40);
		} else {
			speedScore = 0;
		}
		let bonus = Math.min(5, crypts) + this.mimicDead * 2 + this.ezpz * 10;

		//Calculating secrets for s/s+

		let hypotheticalSkillScore = Math.floor(Math.max(20, (20 - (this.failedPuzzleCount) * 10 + 80 - deaths * 2 + this.firstDeathHadSpirit)));
		let hypotheticalSpeedScore = speedScore

		//Calculating for S
		let hypotheticalBonusScoreS = Math.min(5, crypts) + this.mimicDead * 2 + this.ezpz * 10;

		let sNeededSecrets = Math.min(maxSecrets * secretPercentRequired, Math.ceil((270 - hypotheticalSkillScore - hypotheticalBonusScoreS - hypotheticalSpeedScore - 60) * maxSecrets * secretPercentRequired / 40));

		sNeededSecrets = Math.max(currentSecretsFound, sNeededSecrets)

		let hypotheticalScoreGottenS = hypotheticalSkillScore + hypotheticalSpeedScore + hypotheticalBonusScoreS + 60 + Math.floor(Math.min(40, (40 * sNeededSecrets) / secretPercentRequired / maxSecrets));
		let sCryptsNeeded = Math.max(crypts, Math.min(5, (270 - hypotheticalScoreGottenS)))
		hypotheticalScoreGottenS -= hypotheticalBonusScoreS
		hypotheticalBonusScoreS = sCryptsNeeded + this.mimicDead * 2 + this.ezpz * 10
		hypotheticalScoreGottenS += hypotheticalBonusScoreS

		let sPossible = hypotheticalScoreGottenS >= 270

		//Calculating for S+
		let hypotheticalBonusScoreSplus = 5 + this.mimicDead * 2 + this.ezpz * 10;

		let splusNeededSecrets = Math.ceil((300 - hypotheticalSkillScore - hypotheticalBonusScoreSplus - hypotheticalSpeedScore - 60) * maxSecrets * secretPercentRequired / 40);

		let splusPossible = splusNeededSecrets <= maxSecrets * secretPercentRequired

		splusNeededSecrets = Math.max(currentSecretsFound, splusNeededSecrets)

		let hypotheticalScoreGottenSPlus = hypotheticalSkillScore + hypotheticalSpeedScore + hypotheticalBonusScoreSplus + 60 + Math.floor(Math.min(40, (40 * splusNeededSecrets) / secretPercentRequired / maxSecrets));
		let splusCryptsNeeded = Math.max(crypts, 5 - (hypotheticalScoreGottenSPlus - 300))
		hypotheticalScoreGottenSPlus -= hypotheticalBonusScoreSplus
		hypotheticalBonusScoreSplus = splusCryptsNeeded + this.mimicDead * 2 + this.ezpz * 10
		hypotheticalScoreGottenSPlus += hypotheticalBonusScoreSplus

		//Setting hud element
		let sPlusText = currentSecretsFound === 0 ? "??" : (skillScore + exploreScore + speedScore + bonus) >= 300 ? "✔" : splusPossible ? `(${hypotheticalScoreGottenSPlus}): ${currentSecretsFound}/${splusNeededSecrets} +${crypts}c/${splusCryptsNeeded}` : "✖"
		let sText = currentSecretsFound === 0 ? "  ??" : (skillScore + exploreScore + speedScore + bonus) >= 270 ? "  ✔" : sPossible ? `  (${hypotheticalScoreGottenS}): ${currentSecretsFound}/${sNeededSecrets} +${crypts}c/${sCryptsNeeded}` : "✖"

		this.scoreElement.setText(`&dScore: ${skillScore + exploreScore + speedScore + bonus}\n&aS+ ${sPlusText}\n&aS ${sText}`);
	}

	scanFirstDeathForSpiritPet(username) {
		if (this.firstDeath) return
		this.firstDeath = true

		let uuid = this.nameToUuid[username.toLowerCase()].replace(/-/g, "")

		if (this.FeatureManager.features["globalSettings"] && this.FeatureManager.features["globalSettings"].class.apiKeySetting.getValue()) {
			fetch(`https://api.hypixel.net/skyblock/profiles?key=${this.FeatureManager.features["globalSettings"].class.apiKeySetting.getValue()}&uuid=${uuid}`).json(data => {
				if (!data.success) return

				let latestProfile = [0, undefined]

				data.profiles.forEach(p => {
					if (p.members[uuid].last_save > latestProfile[0]) {
						latestProfile = [p.members[uuid].last_save, p.members[uuid].pets.some(pet => pet.type === "SPIRIT" && pet.tier === "LEGENDARY")]
					}
				})

				if (latestProfile[1]) {
					this.firstDeathHadSpirit = true
					if (this.scoreCalculation.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + username + " has spirit pet!")
				} else {
					if (this.scoreCalculation.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + username + " does not have spirit pet!")
				}
			})
		} else {
			fetch(`http://soopymc.my.to/api/v2/player_skyblock/${uuid}`).json(data => {
				if (!data.success) return

				if (data.data.profiles[data2.data.stats.currentProfileId].members[uuid].pets.some(pet => pet.type === "SPIRIT" && pet.tier === "LEGENDARY")) {
					this.firstDeathHadSpirit = true
					if (this.scoreCalculation.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + username + " has spirit pet!")
				} else {
					if (this.scoreCalculation.getValue()) ChatLib.chat(this.FeatureManager.messagePrefix + username + " does not have spirit pet!")
				}
			})
		}
	}

	entityJoinWorldEvent(event) {
		if (this.bloodCampAssist.getValue()) this.todoE.push(event.entity);

		// if(event.entity instanceof EntityArrow){
		// 	this.arrows.push(new Entity(event.entity))
		// }
		if (event.entity instanceof EntityBlaze) {
			// console.log("Blaze joined world")
			this.addBlaze(new Entity(event.entity));
		}
	}

	renderWorld(ticks) {
		if (this.lividFindBox.getValue()) {
			if (this.lividData.correctLividEntity) {
				renderUtils.drawBoxAtEntity(this.lividData.correctLividEntity, 255, 0, 0, 0.75, -2, ticks);
			}
		}

		if (this.bloodCampAssist.getValue()) {
			for (let skull of this.skulls) {
				if (this.eMovingThing[skull.getUUID().toString()] && this.eMovingThing[skull.getUUID().toString()].timeTook) {
					let skullE = skull.getEntity();
					let startPoint = [skullE[f.posX.Entity], skullE[f.posY.Entity], skullE[f.posZ.Entity]];

					let xSpeed2 = (startPoint[0] - this.eMovingThing[skull.getUUID().toString()].startX) / this.eMovingThing[skull.getUUID().toString()].timeTook;
					let ySpeed2 = (startPoint[1] - this.eMovingThing[skull.getUUID().toString()].startY) / this.eMovingThing[skull.getUUID().toString()].timeTook;
					let zSpeed2 = (startPoint[2] - this.eMovingThing[skull.getUUID().toString()].startZ) / this.eMovingThing[skull.getUUID().toString()].timeTook;

					let time = (this.spawnIdThing >= 4 ? 2900 : 4850) - this.eMovingThing[skull.getUUID().toString()].timeTook;
					let endPoint1 = this.eMovingThing[skull.getUUID().toString()].endPoint;
					let endPoint2 = this.eMovingThing[skull.getUUID().toString()].endPointLast;
					let endPointUpdated = Math.min(Date.now() - this.eMovingThing[skull.getUUID().toString()].endPointUpdated, 100);
					if (!endPoint2) return;
					let endPoint = [endPoint2[0] + ((endPoint1[0] - endPoint2[0]) * endPointUpdated) / 100, endPoint2[1] + ((endPoint1[1] - endPoint2[1]) * endPointUpdated) / 100, endPoint2[2] + ((endPoint1[2] - endPoint2[2]) * endPointUpdated) / 100];
					let pingPoint = [startPoint[0] + xSpeed2 * this.ping, startPoint[1] + ySpeed2 * this.ping, startPoint[2] + zSpeed2 * this.ping];

					renderUtils.drawLineWithDepth(startPoint[0], startPoint[1] + 2, startPoint[2], endPoint[0], endPoint[1] + 2, endPoint[2], 255, 0, 0, 2);

					if (this.ping < time) {
						renderUtils.drawBoxAtBlockNotVisThruWalls(pingPoint[0] - 0.5, pingPoint[1] + 1.5, pingPoint[2] - 0.5, 0, 255, 0);
						renderUtils.drawBoxAtBlockNotVisThruWalls(endPoint[0] - 0.5, endPoint[1] + 1.5, endPoint[2] - 0.5, 255, 0, 0);
					} else {
						renderUtils.drawBoxAtBlockNotVisThruWalls(endPoint[0] - 0.5, endPoint[1] + 1.5, endPoint[2] - 0.5, 0, 0, 255);
					}

					// if(this.eMovingThing[skull.getUUID().toString()] && this.eMovingThing[skull.getUUID().toString()].timeTook){
					//     Tessellator.drawString((time/1000).toFixed(3)+"s", endPoint[0], endPoint[1]+2, endPoint[2])
					// }
				}
			}
		}

		if (this.blazeX !== -1 && this.blazes.length > 0 && this.blazeSolver.getValue()) {
			renderUtils.drawBoxAtEntity(this.blazes[0], 255, 0, 0, 1, 2, ticks, 2);

			let lastLoc = [this.blazes[0].getX(), this.blazes[0].getY() + 1.5, this.blazes[0].getZ()];
			// this.blazes.forEach((blaze, i) => {
			for (let i = 0, blaze = this.blazes[0]; i < this.blazes.length; i++, blaze = this.blazes[i]) {
				if (i < 3 && i !== 0) {
					renderUtils.drawLineWithDepth(lastLoc[0], lastLoc[1], lastLoc[2], blaze.getX(), blaze.getY() + 1.5, blaze.getZ(), i === 1 ? 0 : 255, i === 1 ? 255 : 0, 0, 3 / i);

					lastLoc[0] = blaze.getX();
					lastLoc[1] = blaze.getY() + 1.5;
					lastLoc[2] = blaze.getZ();
				}
			}
		}
	}

	renderEntity(entity, position, ticks, event) {
		if (this.lividFindNametags.getValue()) {
			if (this.lividData.correctLividEntity) {
				if (entity.getName().includes("Livid") && entity.getName().includes("❤") && entity.getUUID() !== this.lividData.correctLividEntity.getUUID()) {
					cancel(event);
				}
			}
		}
	}

	onWorldLoad() {
		this.goneInBonus = false;
		this.bloodOpenedBonus = false;
		this.mimicDead = false
		this.lividData.correctLividColor = undefined;
		this.lividData.correctLividColorHP = undefined;
		this.lividData.sayLividColors = [];
		this.lividData.sayLividColors2 = [];
		this.lividData.correctLividEntity = undefined;
		this.lividHpElement && this.lividHpElement.setText("");
		this.nameToUuid = {
			"you": Player.getUUID().toString()
		}

		this.startSpawningTime = 0;
		this.spawnIdThing = 0;
		this.eMovingThing = {};
		this.bloodX = -1;
		this.bloodY = -1;
		this.blazeX = -1;
		this.blazeY = -1;
		this.skulls = [];
		this.arrows = [];
		this.blazes = [];
		World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach((e) => {
			if (e.getEntity()[m.getEquipmentInSlot](4) && e.getEntity()[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().endsWith(getSkullName())) {
				this.addSkull(e);
			}
		});
		World.getAllEntitiesOfType(EntityBlaze).forEach((e) => {
			this.addBlaze(e);
		});
		// World.getAllEntitiesOfType(EntityArrow).forEach((e) => {
		// 	this.arrows.push(e)
		// });
	}

	step2() {
		if (this.bearSpawning && this.bearSpawning > 0 && this.isInDungeon()) {
			this.spiritBearSpawnElement.setText("&dBear spawned in: &c" + (Math.max(0, this.bearSpawning - Date.now()) / 1000).toFixed(2) + "s");
		} else {
			this.spiritBearSpawnElement.setText("");
		}
		if (this.scoreCalculation.getValue()) this.calculateDungeonScore();
		if (this.bloodCampAssist.getValue()) {
			this.skulls.forEach((skull) => {
				let skullE = skull.getEntity();
				// renderUtils.drawBoxAtEntity(skull, 255, 0, 0, 0.5, 0.5, ticks)

				let xSpeed = skullE[f.posX.Entity] - skullE[f.lastTickPosX];
				let ySpeed = skullE[f.posY.Entity] - skullE[f.lastTickPosY];
				let zSpeed = skullE[f.posZ.Entity] - skullE[f.lastTickPosZ];

				if (this.eMovingThing[skull.getUUID().toString()] && Date.now() - this.eMovingThing[skull.getUUID().toString()].startMovingTime > 5000) {
					this.eMovingThing[skull.getUUID().toString()].logged = true;
					this.spawnIdThing++;

					delete this.eMovingThing[skull.getUUID().toString()];
					this.skulls = this.skulls.filter((e) => {
						if (e.getUUID().toString() === skull.getUUID().toString()) {
							return false;
						}
						return true;
					});
					return;
				}

				if (xSpeed !== 0 || ySpeed !== 0) {
					if (!this.eMovingThing[skull.getUUID().toString()]) this.eMovingThing[skull.getUUID().toString()] = { startMovingTime: Date.now(), startX: skullE[f.posX.Entity], startY: skullE[f.posY.Entity], startZ: skullE[f.posZ.Entity] };

					if (this.eMovingThing[skull.getUUID().toString()].lastX !== skullE[f.posX.Entity] || this.eMovingThing[skull.getUUID().toString()].lastY !== skullE[f.posY.Entity]) {
						this.eMovingThing[skull.getUUID().toString()].timeTook = Date.now() - this.eMovingThing[skull.getUUID().toString()].startMovingTime;
					} else if (!this.eMovingThing[skull.getUUID().toString()].logged && (skullE[f.isDead] || !skullE[m.getEquipmentInSlot](4) || !skullE[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().endsWith(getSkullName()))) {
						this.eMovingThing[skull.getUUID().toString()].logged = true;
						this.spawnIdThing++;

						delete this.eMovingThing[skull.getUUID().toString()];
						this.skulls = this.skulls.filter((e) => {
							if (e.getUUID().toString() === skull.getUUID().toString()) {
								return false;
							}
							return true;
						});
						return;
					}

					this.eMovingThing[skull.getUUID().toString()].lastX = skullE[f.posX.Entity];
					this.eMovingThing[skull.getUUID().toString()].lastY = skullE[f.posY.Entity];

					if (!this.startSpawningTime) this.startSpawningTime = Date.now();
				}

				if (this.eMovingThing[skull.getUUID().toString()] && this.eMovingThing[skull.getUUID().toString()].timeTook) {
					let startPoint = [skullE[f.posX.Entity], skullE[f.posY.Entity], skullE[f.posZ.Entity]];

					let xSpeed2 = (startPoint[0] - this.eMovingThing[skull.getUUID().toString()].startX) / this.eMovingThing[skull.getUUID().toString()].timeTook;
					let ySpeed2 = (startPoint[1] - this.eMovingThing[skull.getUUID().toString()].startY) / this.eMovingThing[skull.getUUID().toString()].timeTook;
					let zSpeed2 = (startPoint[2] - this.eMovingThing[skull.getUUID().toString()].startZ) / this.eMovingThing[skull.getUUID().toString()].timeTook;

					let time = (this.spawnIdThing >= 4 ? 2900 : 4875) - this.eMovingThing[skull.getUUID().toString()].timeTook;
					let endPoint = [startPoint[0] + xSpeed2 * time, startPoint[1] + ySpeed2 * time, startPoint[2] + zSpeed2 * time];

					this.eMovingThing[skull.getUUID().toString()].endPointLast = this.eMovingThing[skull.getUUID().toString()].endPoint;
					this.eMovingThing[skull.getUUID().toString()].endPoint = endPoint;
					this.eMovingThing[skull.getUUID().toString()].endPointUpdated = Date.now();

					// if(this.eMovingThing[skull.getUUID().toString()] && this.eMovingThing[skull.getUUID().toString()].timeTook){
					//     Tessellator.drawString((time/1000).toFixed(3)+"s", endPoint[0], endPoint[1]+2, endPoint[2])
					// }
				}
			});
		}

		if (this.blazeX !== -1) {
			this.blazes = this.blazes.filter((e) => !e.getEntity()[f.isDead]);

			this.blazes.sort((a, b) => a.getEntity().func_110143_aJ() - b.getEntity().func_110143_aJ());
			if (
				World.getBlockAt(this.blazeX + 17 - 43, 18, this.blazeY + 16 - 43)
					.getType()
					.getID() === 9
			) {
				this.blazes = this.blazes.reverse();
			}
		}

		// this.arrows = this.arrows.filter(e=>{
		// 	let x = e.getX()
		// 	let y = e.getY()
		// 	let z = e.getZ()

		// 	let mX = e.getMotionX()
		// 	let mY = e.getMotionY()
		// 	let mZ = e.getMotionZ()

		// 	for(let i = 0;i<100;i++){
		// 		x+=mX
		// 		y+=mY
		// 		z+=mZ

		// 		mX*=0.99
		// 		mY*=0.99
		// 		mZ*=0.99

		// 		mY-=0.05

		// 		this.blazes = this.blazes.filter(e1=>{
		// 			let boundingBox = e1.getEntity().func_174813_aQ()

		// 			if(boundingBox.intersectsWith(new AxisAlignedBB(x-e.getEntity().field_70130_N/2,y,z-e.getEntity().field_70130_N/2,x+e.getEntity().field_70130_N/2,y+e.getEntity().field_70131_O,z+e.getEntity().field_70130_N/2))){
		// 				return false
		// 			}
		// 			return true
		// 		})

		// 		if(World.getBlockAt(x, y, z).getType().getID() !== 0){
		// 			break;
		// 		}
		// 	}

		// 	return !e.getEntity()[f.isDead]
		// })

		if (this.spiritBearSpawnTimer.getValue() && (this.FeatureManager.features["dataLoader"].class.dungeonFloor === "F4" || this.FeatureManager.features["dataLoader"].class.dungeonFloor === "M4")) {
			let id = World.getBlockAt(7, 77, 34).type.getID();

			if ((!this.bearSpawning || (this.bearSpawning < 0 && this.bearSpawning > -Date.now() + 500)) && id === 169) {
				this.bearSpawning = Date.now() + 3500;
			}
		}
	}

	addSkull(skull) {
		if (this.bloodX !== -1) {
			let xA = skull.getX() + 8 - ((skull.getX() + 8) % 32);
			let yA = skull.getZ() + 8 - ((skull.getZ() + 8) % 32);

			if (xA !== this.bloodX || yA !== this.bloodY) return;
		} else {
			if (skull.getEntity()[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().trim() === getPlayerHeadName().replace("%s", Player.getName())) {
				this.bloodX = skull.getX() + 8 - ((skull.getX() + 8) % 32);
				this.bloodY = skull.getZ() + 8 - ((skull.getZ() + 8) % 32);
				this.skulls = [];
				World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach((e) => {
					if (e.getEntity()[m.getEquipmentInSlot](4) && e.getEntity()[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().endsWith(getSkullName())) {
						this.addSkull(e);
					}
				});
			}
			return;
		}
		this.skulls.push(skull);
	}

	addBlaze(blaze) {
		if (!this.FeatureManager.features["dataLoader"].class.dungeonFloor) return;
		if (this.blazeX === -1) {
			this.blazes.push(blaze);
			let locs = {};

			this.blazes.forEach((b) => {
				if (!locs[b.getX() + 8 - ((b.getX() + 8) % 32) + "_" + (b.getZ() + 8 - ((b.getZ() + 8) % 32))]) locs[b.getX() + 8 - ((b.getX() + 8) % 32) + "_" + (b.getZ() + 8 - ((b.getZ() + 8) % 32))] = 0;
				locs[b.getX() + 8 - ((b.getX() + 8) % 32) + "_" + (b.getZ() + 8 - ((b.getZ() + 8) % 32))]++;
			});

			Object.keys(locs).forEach((k) => {
				if (locs[k] === 4) {
					[this.blazeX, this.blazeY] = k.split("_").map((a) => ~~a);
				}
			});

			if (this.blazeX !== -1) {
				this.blazes = [];
				World.getAllEntitiesOfType(EntityBlaze).forEach((e) => {
					if (e.getX() + 8 - ((e.getX() + 8) % 32) === this.blazeX && e.getZ() + 8 - ((e.getZ() + 8) % 32) === this.blazeY) {
						this.blazes.push(e);
					}
				});
			}
		} else {
			if (blaze.getX() + 8 - ((blaze.getX() + 8) % 32) === this.blazeX && blaze.getZ() + 8 - ((blaze.getZ() + 8) % 32) === this.blazeY) {
				this.blazes.push(blaze);
				this.blazes.sort((a, b) => a.getEntity().func_110143_aJ() - b.getEntity().func_110143_aJ());
				if (
					World.getBlockAt(this.blazeX + 17 - 43, 18, this.blazeY + 16 - 43)
						.getType()
						.getID() === 9
				) {
					this.blazes = this.blazes.reverse();
				}
			}
		}
	}

	stepNotDung() {
		this.inBoss = false
	}

	step() {
		if (this.bearSpawning && this.bearSpawning > 0) {
			this.spiritBearSpawnElement.setText("&dBear spawned in: &c" + (Math.max(0, this.bearSpawning - Date.now()) / 1000).toFixed(2) + "s");
		} else {
			this.spiritBearSpawnElement.setText("");
		}
		if (!Player.getX()) return
		World.getAllPlayers().forEach((p) => {
			this.nameToUuid[p.getName().toLowerCase()] = p.getUUID().toString()
		})
		this.failedPuzzleCount = 0;
		this.totalPuzzleCount = 0;
		this.completedPuzzleCount = 0;
		TabList.getNames().forEach((n) => {
			let name = ChatLib.removeFormatting(n).trim().split(" ");
			let end = name.pop();
			// console.log(end) Water Board: [✔]
			if (end !== "[✦]" && end !== "[✔]" && end !== "[✖]") {
				end = name.pop();
				// console.log(end) Water Board: [✔]
				if (end !== "[✦]" && end !== "[✔]" && end !== "[✖]") return;
			}
			this.totalPuzzleCount++;
			if (end === "[✖]") this.failedPuzzleCount++;
			if (end === "[✔]") this.completedPuzzleCount++;
		});

		if (this.lividFindEnabled.getValue() && (this.FeatureManager.features["dataLoader"].class.dungeonFloor === "F5" || this.FeatureManager.features["dataLoader"].class.dungeonFloor === "M5")) {
			let type = World.getBlockAt(3, 108, 30).getMetadata();

			let typeReplace = {
				0: "Vendetta",
				2: "Crossed",
				4: "Arcade",
				5: "Smile",
				6: "Crossed",
				7: "Doctor",
				8: "Doctor",
				10: "Purple",
				11: "Scream",
				13: "Frog",
				14: "Hockey",
			};

			World.getAllEntities().forEach((entity) => {
				let entityName = entity.getName();

				if (entityName.includes("Livid") && entityName.includes("❤")) {
					// ChatLib.chat("D: " + entityName.substr(1, 1) + " asd " + this.lividData.lividColor[typeReplace[type]].split("").pop())
					if (entityName.substr(1, 1) === this.lividData.lividColor[typeReplace[type]].split("").pop()) {
						this.lividHpElement.setText(entityName);
						this.lividData.correctLividEntity = entity;
					}
				}
			});
		}

		if (this.lividData.correctLividEntity) {
			if (!this.renderEntityEvent) {
				this.renderEntityEvent = this.registerEvent("renderEntity", this.renderEntity);
			}
		} else {
			if (this.renderEntityEvent) {
				this.renderEntityEvent.unregister()
				this.renderEntityEvent = undefined;
			}
		}

		this.spiritBowPickUps = this.spiritBowPickUps.filter((pickUp) => Date.now() - pickUp < 20000);
		if (this.spiritBowPickUps[0] && this.isInDungeon()) {
			this.spiritBowDestroyElement.setText("&dBow Destroyed in: &c" + Math.round((this.spiritBowPickUps[0] + 20000 - Date.now()) / 1000) + "s");
		} else {
			this.spiritBowDestroyElement.setText("");
		}
		// this.spiritBowPickUps
		if (this.bloodCampAssist.getValue()) {
			this.todoE.forEach((e) => {
				let en = new Entity(e);
				// console.log(en.getName())
				if (en.getName().trim() === getArmorStandName() && e[m.getEquipmentInSlot](4) && e[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().endsWith(getSkullName())) {
					this.addSkull(en);
				}
			});

			this.todoE = [];

			if (Date.now() - this.lastPingCheck > 60000 * 30 || (Date.now() - this.lastPingCheck > 60000 && this.lastPings.includes(undefined) && this.bloodX !== -1)) {
				this.lastPingCheck = Date.now();
				ChatLib.command("whereami");
				this.checkingPing = true;
			}
		}

		let averageExp = this.lastDungExps.reduce((a, b) => a + b, 0) / this.lastDungExps.length;
		let averageLength = (this.lastDungFinishes[this.lastDungFinishes.length - 1] - this.lastDungFinishes[0]) / (this.lastDungFinishes.length - 1);
		let runsperHour = (60000 * 60) / averageLength;
		let expPerHour = averageExp * runsperHour;

		if (Date.now() - this.lastDungFinishes[this.lastDungFinishes.length - 1] < 60000 * 5 || this.FeatureManager.features["dataLoader"].class.dungeonFloor) {
			if (this.lastDungFinishes.length > 1) {
				this.runSpeedRatesElement.setText("&6Run speed&7> &f" + Math.floor(averageLength / 60000) + ":" + ((Math.floor(averageLength / 1000) % 60 < 10 ? "0" : "") + (Math.floor(averageLength / 1000) % 60)) + "\n&6Exp/hour&7> &f" + numberWithCommas(Math.round(expPerHour)) + "\n&6Runs/hour&7> &f" + Math.floor(runsperHour));
			} else {
				this.runSpeedRatesElement.setText("&6Run speed&7> &fLoading...\n&6Exp/hour&7> &fLoading...\n&6Runs/hour&7> &fLoading...");
			}
		} else {
			this.runSpeedRatesElement.setText("");
		}
	}

	initVariables() {
		this.lividFindEnabled = undefined;
		this.lividData = undefined;
		this.hudElements = [];
	}

	onDisable() {
		this.hudElements.forEach(h => h.delete())

		this.initVariables();
	}
}

module.exports = {
	class: new DungeonSolvers(),
};

function getSkullName() {
	if (translate) {
		return translate.func_74805_b("item.skull.char.name");
	}

	return "Head";
}

function getPlayerHeadName() {
	if (translate) {
		return translate.func_74805_b("item.skull.player.name");
	}

	return "%s's Head";
}
function getArmorStandName() {
	if (translate) {
		return translate.func_74805_b("item.armorStand.name");
	}

	return "Armor Stand";
}
