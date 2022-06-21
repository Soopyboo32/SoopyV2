/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import { f, m } from "../../../mappings/mappings";
import { numberWithCommas, timeNumber } from "../../utils/numberUtils";
import { drawBoxAtBlock, drawBoxAtEntity, drawCoolWaypoint, drawFilledBox, drawLine } from "../../utils/renderUtils";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";
import socketConnection from "../../socketConnection";
import TextSetting from "../settings/settingThings/textSetting";
import { firstLetterCapital } from "../../utils/stringUtils";
import { delay } from "../../utils/delayUtils";

class Slayers extends Feature {
	constructor() {
		super();
	}

	onEnable() {
		this.initVariables();

		this.expOnKill = new ToggleSetting("Show slayer exp on boss kill", "Says your slayer exp in chat when you kill a boss, also says time taken to spawn+kill", true, "slayer_xp", this);
		this.slainAlert = new ToggleSetting("Show boss slain alert", "This helps you to not kill mobs for ages with an inactive quest", true, "boss_slain_alert", this);
		this.spawnAlert = new ToggleSetting("Show boss spawned alert", "This helps you to not miss your boss when you spawn it", true, "boss_spawn_alert", this);

		this.boxAroundEmanBoss = new ToggleSetting("Box around enderman slayer boss", "This helps to know which boss is yours", true, "eman_box", this);
		this.boxToEmanBeacon = new ToggleSetting("Box and line to the enderman beacon", "This will help to find the beacon when the boss throws it", true, "eman_beacon", this);
		this.emanBeaconDinkDonk = new ToggleSetting("DinkDonk when beacon is spawned", "This will help to notice when the beacon is spawned", true, "eman_beacon_dinkdink", this);
		this.emanEyeThings = new ToggleSetting("Put box around the enderman eye things", "This will help to find them", true, "eman_eye_thing", this);
		this.emanHpGuiElement = new ToggleSetting("Render the enderman hp on your screen", "This will help you to know what stage u are in etc.", true, "eman_hp", this).contributor("EmeraldMerchant");

		this.emanHpElement = new HudTextElement().setToggleSetting(this.emanHpGuiElement).setLocationSetting(new LocationSetting("Eman Hp Location", "Allows you to edit the location of the enderman hp", "eman_location", this, [10, 50, 1, 1]).requires(this.emanHpGuiElement).editTempText("&6Enderman&7> &f&l30 Hits"));
		this.hudElements.push(this.emanHpElement);
		this.hideSummonsForLoot = new ToggleSetting("Hides summons for 3s to see t4 voidgloom drops", "This will make loots more visible.", false, "show_loot", this).contributor("EmeraldMerchant");
		this.allEmanBosses = new ToggleSetting("Hides summons for all eman bosses", "Hides summon for not just your boss, might fix ^ sometimes not working", false, "show_loot_all_bosses", this).requires(this.hideSummonsForLoot).contributor("EmeraldMerchant");

		this.slayerXpGuiElement = new ToggleSetting("Render the xp of your current slayer on your screen", "This will help you to know how much xp u have now w/o looking in chat", true, "slayer_xp_hud", this).contributor("EmeraldMerchant");
		this.slayerXpElement = new HudTextElement()
			.setText("&6Slayer&7> &fLoading...")
			.setToggleSetting(this.slayerXpGuiElement)
			.setLocationSetting(new LocationSetting("Slayer Xp Location", "Allows you to edit the location of you current slayer xp", "slayer_xp_location", this, [10, 50, 1, 1]).requires(this.slayerXpGuiElement).editTempText("&6Enderman&7> &d&l2,147,483,647 XP").contributor("EmeraldMerchant"));
		this.hudElements.push(this.slayerXpElement);

		this.betterHideDeadEntity = new ToggleSetting("Also hides mob nametag when it's dead.", "An improvement for Skytils's hide dead entity", false, "hide_dead_mob_nametag", this);

		this.rcmDaeAxeSupport = new ToggleSetting("Eman Hyp hits before Dae axe swapping", "This will tell u how many clicks with hyp is needed before swapping to dae axe", true, "eman_rcm_support", this).requires(this.emanHpGuiElement).contributor("EmeraldMerchant");
		this.rcmDamagePerHit = new TextSetting("Hyperion damage", "Your hyp's single hit damage w/o thunderlord/thunderbolt", "", "hyp_dmg", this, "Your hyp dmg (Unit: M)", false).requires(this.rcmDaeAxeSupport).contributor("EmeraldMerchant");
		this.whenToShowHitsLeft = new TextSetting("Show hits left timing", "At how much hp should the hits left thing be visible", "", "eman_hp_left", this, "How much hp (Unit: M, enter a valid value 0-300)", false).requires(this.rcmDaeAxeSupport).contributor("EmeraldMerchant");
		this.thunderLevel = new TextSetting("Thunderlord Level", "What thunderlord level you have on your hyperion", "", "thunderlord_level", this, "Thunderlord level (only supports 5/6/7)", false).requires(this.rcmDaeAxeSupport).contributor("EmeraldMerchant");

		this.emanLazerTimer = new ToggleSetting("Adds a timer for the boss lazer phase", "The timer will be inside the boss's body during the phase", true, "eman_lazer_timer", this);

		this.slayerSpeedRates = new ToggleSetting("Show slayer speed and exp rates", "(Slayer speed includes downtime inbetween slayers, only shows while doing slayers)", true, "slayer_speed_rates", this);
		this.slayerSpeedRatesElement = new HudTextElement()
			.setText("&6Slayer speed&7> &fLoading...\n&6Exp/hour&7> &fLoading...\n&6Kills/hour&7> &fLoading...")
			.setToggleSetting(this.slayerSpeedRates)
			.setLocationSetting(new LocationSetting("Slayer speed and exp rates location", "Allows you to edit the location of the information", "slayer_speed_rates_location", this, [10, 100, 1, 1]).requires(this.slayerSpeedRates).editTempText("&6Slayer speed&7> &f4:30\n&6Exp/hour&7> &f1,234,567\n&6Kills/hour&7> &f17"));

		this.hudElements.push(this.slayerSpeedRatesElement);

		this.blazeTowerDink = new ToggleSetting("DinkDonk & Box for blaze tower", "(the tower might not nessesarily belong to your boss though)", true, "blaze_tower_dinkdink", this);
		this.slayerProgressAlert = new ToggleSetting("Shows slayer progress in middle of screen when close", "(blame dulkir)", false, "slayer_progress_alert", this);
		this.dulkirThingElement = new HudTextElement()
			.setText("")
			.setToggleSetting(this.slayerProgressAlert)
			.setLocationSetting(new LocationSetting("Slayer progress location", "Allows you to edit the location of the dulkir thing", "dulkir_thing_location", this, [10, 150, 1, 1]).requires(this.slayerProgressAlert).editTempText("&e98&7/&c100&7 Kills"));

		this.hudElements.push(this.dulkirThingElement);

		this.otherSlayerWaypoints = new ToggleSetting("Show other users slayer boss locations", "May be usefull for loot share", true, "slayer_location_other", this)

		this.lastSlayerFinishes = [];
		this.lastSlayerExps = [];
		this.slayerExp = {};
		this.slayerExpLoaded = false;

		this.lastSlayerType = "";
		this.lastSlayerExp = 0;
		this.lastBossSlain = 0;
		this.registerChat("&r  &r&a&lSLAYER QUEST COMPLETE!&r", (e) => {
			this.lastSlayerExps.push(this.lastSlayerExp);
			if (this.lastSlayerExps.length > 5) {
				this.lastSlayerExps.shift();
			}

			this.lastSlayerFinishes.push(Date.now());
			if (this.lastSlayerFinishes.length > 5) {
				this.lastSlayerFinishes.shift();
			}

			let multiplier = 1
			if (this.FeatureManager.features["dataLoader"].class.mayorData.mayor?.name === "Aatrox") {
				if (this.FeatureManager.features["dataLoader"].class.currentMayorPerks.has("Slayer XP Buff")) {
					multiplier += 0.25
				}
			}

			this.slayerExp[this.lastSlayerType] = Math.round(this.lastSlayerExp * multiplier) + (this.slayerExp[this.lastSlayerType] || 0);

			if (this.expOnKill.getValue()) {
				cancel(e);
				ChatLib.chat("&r  &r&a&lSLAYER QUEST COMPLETE!&a&r");
				ChatLib.chat("&r   &r&aYou have &d" + numberWithCommas(this.slayerExp[this.lastSlayerType]) + " " + this.lastSlayerType + " XP&r&7!&r");
				ChatLib.chat("&r   &r&aYou have &d" + numberWithCommas(Object.values(this.slayerExp).reduce((a, t) => t + a, 0)) + " total XP&r&7!&r");
				if (Date.now() - this.lastBossSlain < 60000 * 5) ChatLib.chat("&r   &r&aBoss took &d" + timeNumber(Date.now() - this.lastBossSlain) + " &ato spawn and kill&r&7!" + /* (" + timeNumber(Date.now()-this.lastBossSpawned) + " to kill) */ "&r"); //TODO: Seperate setting for this
			}
			this.lastBossSlain = Date.now();
		});

		this.registerChat("&r  &r&c&lSLAYER QUEST FAILED!&r", () => {
			socketConnection.sendSlayerSpawnData({ loc: null });
		})

		this.bossSlainMessage = false;
		this.bossSpawnedMessage = false;
		this.lastBossNotSpawnedTime = 0;
		this.lastBossSpawned = 0;

		this.registerEvent("renderOverlay", this.renderOverlay).registeredWhen(() => this.spawnAlert.getValue() || this.slainAlert.getValue());

		this.registerSoopy("apiLoad", this.apiLoad);
		if (this.FeatureManager.features["dataLoader"] && this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock) {
			this.apiLoad(this.FeatureManager.features["dataLoader"].class.lastApiData.skyblock, "skyblock", true, true);
		}

		this.todoE = [];
		this.beaconPoints = {};
		this.beaconE = [];
		this.deadE = [];
		this.beaconLocations = {};
		this.eyeE = [];
		this.todoE2 = [];
		this.emanBoss = undefined;
		this.actualEmanBoss = undefined
		this.hideSummons = false;
		this.nextIsBoss = 0;
		this.counter = 0;
		this.emanStartedSittingTime = -1
		this.pillerE = undefined
		this.lastPillerDink = 0
		this.slayerLocationDataH = {}
		this.hasQuest = false

		this.entityAttackEventLoaded = false;
		this.entityAttackEventE = undefined;
		this.renderEntityEvent = this.registerEvent("renderEntity", this.renderEntity);
		this.renderEntityEvent.unregister();

		this.registerForge(net.minecraftforge.event.entity.EntityJoinWorldEvent, this.entityJoinWorldEvent).registeredWhen(() => this.hasQuest);
		this.registerEvent("tick", this.tick);
		this.registerEvent("renderWorld", this.renderWorld);
		this.registerEvent("worldLoad", this.worldLoad);
		this.registerStep(true, 2, this.step);
	}

	slayerLocationData(loc, user) {
		if (!loc) {
			delete this.slayerLocationDataH[user]
			return
		}
		this.slayerLocationDataH[user] = [loc, Date.now()]
	}

	worldLoad() {
		this.todoE = [];
		this.beaconPoints = {};
		this.beaconE = [];
		this.deadE = [];
		this.todoE2 = [];
		this.beaconLocations = {};
		this.eyeE = [];
		this.emanBoss = undefined;
		this.actualEmanBoss = undefined;
		this.hideSummons = false

		this.slayerLocationDataH = {}
	}

	renderEntity(entity, pos, partialTicks, event) {
		if (entity.getClassName() === "EntityZombie") {
			cancel(event)
		}
	}

	entityAttackEvent(event) {
		if (event.source.func_76346_g() === Player.getPlayer()) {
			if (event.entity instanceof net.minecraft.entity.monster.EntityEnderman) {
				World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach((e) => {
					if (e.getName().includes("Voidgloom Seraph")) {
						//if distance from e to event.entity < 5
						if ((e.getX() - event.entity[f.posX.Entity]) ** 2 + (e.getY() - event.entity[f.posY.Entity]) ** 2 + (e.getZ() - event.entity[f.posZ.Entity]) ** 2 < 25) {
							this.emanBoss = e;
							this.actualEmanBoss = event.entity;
						}
					}
				});
			}
		}
	}
	renderWorld(ticks) {
		if (this.emanBoss && this.boxAroundEmanBoss.getValue()) drawBoxAtEntity(this.emanBoss, 0, 255, 0, 1, -3, ticks, 4, false);

		if (this.emanBoss && this.emanStartedSittingTime > 0 && this.emanLazerTimer.getValue()) {
			Tessellator.drawString(ChatLib.addColor("&a&lLazer: &c&l" + Math.max(0, 8.2 - (Date.now() - this.emanStartedSittingTime) / 1000).toFixed(1)), this.emanBoss.getX(), this.emanBoss.getY() - 1.2, this.emanBoss.getZ(), 0, true, 0.04, false);
		}

		if (this.pillerE && this.bossSpawnedMessage) {
			drawBoxAtBlock(~~this.pillerE.getX() - 1, ~~this.pillerE.getY() + 2, ~~this.pillerE.getZ() - 1, 255, 0, 0, 1, -4);
		}

		if (this.boxToEmanBeacon.getValue()) {
			Object.values(this.beaconPoints).forEach((line) => {
				let lastPoint = undefined;
				line.forEach((p) => {
					if (lastPoint) {
						drawLine(lastPoint[0], lastPoint[1], lastPoint[2], p[0], p[1], p[2], 0, 0, 255, 3);
					}
					lastPoint = p;
				});
			});
			Object.values(this.beaconLocations).forEach((loc) => {
				drawFilledBox(loc[0] + 0.5, loc[1], loc[2] + 0.5, 1.01, 1.01, 0, 0, 1, 1, true);
			});
		}

		this.eyeE.forEach((e) => {
			let x = e.getX() + (e.getX() - e.getLastX()) * ticks;
			let y = e.getY() + (e.getY() - e.getLastY()) * ticks;
			let z = e.getZ() + (e.getZ() - e.getLastZ()) * ticks;

			drawBoxAtBlock(x - 0.5, y + 0.7, z - 0.5, 255, 0, 0);
		});
		if (this.otherSlayerWaypoints.getValue()) {
			Object.keys(this.slayerLocationDataH).forEach(key => {
				drawCoolWaypoint(this.slayerLocationDataH[key][0][0], this.slayerLocationDataH[key][0][1], this.slayerLocationDataH[key][0][2], 255, 0, 0, { name: key + "'s boss" })
			})
		}
	}

	entityJoinWorldEvent(event) {
		this.todoE2.push(event.entity);
	}

	tick() {
		if (this.hideSummonsForLoot.getValue() && this.hideSummons) {
			this.renderEntityEvent.register();
		} else if (this.hideSummonsForLoot.getValue()) {
			this.renderEntityEvent.unregister();
		}
		if (this.betterHideDeadEntity.getValue()) {
			World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach(name => {
				if (name.getName().removeFormatting().split(" ")[name.getName().removeFormatting().split(" ").length - 1] === "0❤" ||
					(
						name.getName().removeFormatting().split(" ")[name.getName().removeFormatting().split(" ").length - 1].split("/")[0] === "0"
						&& name.getName().removeFormatting().includes("❤"))
				) {
					name.getEntity()[m.setAlwaysRenderNameTag](false)
				}
			});
		}

		if (this.FeatureManager.features["dataLoader"].class.isInSkyblock) {
			if (!this.entityAttackEventLoaded) {
				this.entityAttackEventLoaded = true;
				this.entityAttackEventE = this.registerForge(net.minecraftforge.event.entity.living.LivingAttackEvent, this.entityAttackEvent);
			}
		} else {
			if (this.entityAttackEventLoaded) {
				this.entityAttackEventLoaded = false;
				this.entityAttackEventE.unregister()
			}
		}

		this.todoE.forEach((e) => {
			try {
				if (e instanceof net.minecraft.entity.item.EntityArmorStand && e[m.getEquipmentInSlot](4)) {
					if (e[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]() === "Beacon") {
						let closestEIsGaming = false;
						let closestDist = Infinity;
						World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach((e2) => {
							if (e2.getName().includes("Voidgloom Seraph")) {
								if ((e2.getX() - e[f.posX.Entity]) ** 2 + (e2.getY() - e[f.posY.Entity]) ** 2 + (e2.getZ() - e[f.posZ.Entity]) ** 2 < closestDist) {
									closestDist = (e2.getX() - e[f.posX.Entity]) ** 2 + (e2.getY() - e[f.posY.Entity]) ** 2 + (e2.getZ() - e[f.posZ.Entity]) ** 2;
									closestEIsGaming = this.emanBoss ? e2.getUUID().toString() === this.emanBoss.getUUID().toString() : false;
								}
							}
						});
						if (closestEIsGaming && closestDist < 100) {
							this.beaconE.push(e);
						}
					}
					if (e[m.getEquipmentInSlot](4)[m.getDisplayName.ItemStack]().startsWith("§a")) {
						let closestEIsGaming = false;
						let closestDist = Infinity;
						World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach((e2) => {
							if (e2.getName().includes("Voidgloom Seraph")) {
								if ((e2.getX() - e[f.posX.Entity]) ** 2 + (e2.getY() - e[f.posY.Entity]) ** 2 + (e2.getZ() - e[f.posZ.Entity]) ** 2 < closestDist) {
									closestDist = (e2.getX() - e[f.posX.Entity]) ** 2 + (e2.getY() - e[f.posY.Entity]) ** 2 + (e2.getZ() - e[f.posZ.Entity]) ** 2;
									closestEIsGaming = this.emanBoss ? e2.getUUID().toString() === this.emanBoss.getUUID().toString() : false;
								}
							}
						});

						if (closestEIsGaming && closestDist < 100 && new Item(e[m.getEquipmentInSlot](4)).getNBT().getCompoundTag("tag").getCompoundTag("SkullOwner").getCompoundTag("Properties").getRawNBT()[m.getTagList]("textures", 10)[m.getCompoundTagAt](0)[m.getString.NBTTagCompound]("Value") === "eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZWIwNzU5NGUyZGYyNzM5MjFhNzdjMTAxZDBiZmRmYTExMTVhYmVkNWI5YjIwMjllYjQ5NmNlYmE5YmRiYjRiMyJ9fX0=") {
							this.eyeE.push(new Entity(e));
						}
						// console.log(":" + new Item(e[m.getEquipmentInSlot](4)).getNBT().getCompoundTag("tag").getCompoundTag("SkullOwner").getCompoundTag("Properties").getRawNBT().func_150295_c("textures", 10).func_150305_b(0).func_74779_i("Value"))
					}
				}

				if (e[m.getCustomNameTag]() && e[m.getCustomNameTag]().includes("Voidgloom Seraph")) {
					if (Date.now() - this.nextIsBoss < 3000) {
						this.emanBoss = new Entity(e);
						this.nextIsBoss = false;
					}
					// just makes it to work on all eman slayers
					if (this.allEmanBosses.getValue()) {
						if ((e[f.posX.Entity] - Player.getX()) ** 2 + (e[f.posY.Entity] - Player.getY()) ** 2 + (e[f.posZ.Entity] - Player.getZ()) ** 2 > 20) return
						let emanHealth = ChatLib.removeFormatting(e[m.getCustomNameTag]().split("Voidgloom Seraph")[1])
						//only runs when t4's hp is <= 3m
						if (emanHealth.includes("k") || (emanHealth.includes("M") && emanHealth.replace(/[^\d.]/g, "") <= 3)) {
							this.hideSummons = true
						}
					}
				}

				if (e instanceof net.minecraft.entity.item.EntityArmorStand && e[m.getCustomNameTag]() && this.blazeTowerDink.getValue()) {
					let name = ChatLib.removeFormatting(e[m.getCustomNameTag]())
					let isPiller = true
					if (isPiller && name.trim().split(" ").length !== 3) isPiller = false
					if (isPiller && name.trim().split(" ")[0].split("").pop() !== "s") isPiller = false
					if (isPiller && name.trim().split(" ")[2] !== "hits") isPiller = false
					if (isPiller) {
						this.pillerE = new Entity(e)
					}
				}
			} catch (_) {
				console.log(JSON.stringify(_, undefined, 2));
			}
		});
		this.todoE = this.todoE2;
		this.todoE2 = [];

		if (this.slayerXpGuiElement.getValue() && this.lastSlayerType) {
			this.slayerXpElement.setText(`&6${firstLetterCapital(this.lastSlayerType)}&7> &d&l${numberWithCommas(this.slayerExp[this.lastSlayerType])} XP`);
		} else {
			this.slayerXpElement.setText(``);
		}

		if (this.emanBoss && this.emanBoss.getEntity()[f.isDead]) {
			if (this.hideSummonsForLoot.getValue()) {
				this.hideSummons = true
				delay(2000, () => { this.hideSummons = false })
			}
			this.emanBoss = undefined
			this.actualEmanBoss = undefined
		}
		this.eyeE = this.eyeE.filter((e) => !e.getEntity()[f.isDead]);
		this.beaconE = this.beaconE.filter((e) => {
			if (e[f.isDead]) {
				this.deadE.push([Date.now(), e[m.getUniqueID.Entity]().toString()]);

				let pos = [e[f.posX.Entity] + 0.5, e[f.posY.Entity] + 0.7, e[f.posZ.Entity] + 0.5];
				//check for a beacon block within 5 blocks of pos
				if (World.getBlockAt(0, 0, 0).getID) {
					for (let x = pos[0] - 5; x <= pos[0] + 5; x++) {
						for (let y = pos[1] - 5; y <= pos[1] + 5; y++) {
							for (let z = pos[2] - 5; z <= pos[2] + 5; z++) {
								if (World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z)).getID() === 138) {
									this.beaconLocations[e[m.getUniqueID.Entity]().toString()] = [Math.floor(x), Math.floor(y), Math.floor(z)];
								}
							}
						}
					}
				} else {
					//CT 2.0 support
					for (let x = pos[0] - 5; x <= pos[0] + 5; x++) {
						for (let y = pos[1] - 5; y <= pos[1] + 5; y++) {
							for (let z = pos[2] - 5; z <= pos[2] + 5; z++) {
								if (World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z)).getType().getID() === 138) {
									this.beaconLocations[e[m.getUniqueID.Entity]().toString()] = [Math.floor(x), Math.floor(y), Math.floor(z)];
								}
							}
						}
					}
				}

				// if(!this.beaconLocations[e[m.getUniqueID.Entity]().toString()]){
				//     console.log("Diddnt find beacon wtf?????")
				// }

				return false;
			}
			return true;
		});

		this.beaconE.forEach((e) => {
			if (!this.beaconPoints[e[m.getUniqueID.Entity]().toString()]) this.beaconPoints[e[m.getUniqueID.Entity]().toString()] = [];

			this.beaconPoints[e[m.getUniqueID.Entity]().toString()].push([e[f.posX.Entity] + 0.5, e[f.posY.Entity] + 0.7, e[f.posZ.Entity] + 0.5]); //x, y, z
		});

		this.deadE = this.deadE.filter((e) => {
			if (Date.now() - e[0] > 5000) {
				delete this.beaconPoints[e[1]];
				delete this.beaconLocations[e[1]];
				return false;
			}

			let location = this.beaconLocations[e[1]];
			if (!location) {
				delete this.beaconPoints[e[1]];
				delete this.beaconLocations[e[1]];
				return false;
			}

			if (World.getBlockAt(0, 0, 0).getID) {
				if (World.getBlockAt(location[0], location[1], location[2]).getID() === 138) {
					if (this.emanBeaconDinkDonk.getValue()) {
						Client.showTitle("&cGO TO BEACON!", "&c" + (Math.max(0, 5000 - (Date.now() - e[0])) / 1000).toFixed(1) + "s", 0, 20, 10);
						World.playSound("note.pling", 1, 1);
					}
				} else {
					delete this.beaconPoints[e[1]];
					delete this.beaconLocations[e[1]];
					return false;
				}
			} else {
				//CT 2.0 support
				if (World.getBlockAt(location[0], location[1], location[2]).getType().getID() === 138) {
					if (this.emanBeaconDinkDonk.getValue()) {
						Client.showTitle("&cGO TO BEACON!", "&c" + (Math.max(0, 5000 - (Date.now() - e[0])) / 1000).toFixed(1) + "s", 0, 20, 10);
						World.playSound("note.pling", 1, 1);
					}
				} else {
					delete this.beaconPoints[e[1]];
					delete this.beaconLocations[e[1]];
					return false;
				}
			}
			return true;
		});

		if (this.emanBoss) {
			let emanText = "&6Enderman&7> " + (this.emanBoss.getName().split("Voidgloom Seraph")[1] || "").trim()
			let emanHealth = ChatLib.removeFormatting(this.emanBoss.getName().split("Voidgloom Seraph")[1])
			//only runs when t4's hp is <= 3m
			if (emanHealth.includes("k") || (emanHealth.includes("M") && emanHealth.replace(/[^\d.]/g, "") <= 3)) {
				this.hideSummons = true
			}
			if (this.rcmDaeAxeSupport.getValue()) {
				if (emanHealth.includes("k")) {
					emanText += " &c0 Hits"
				} else if (emanHealth.includes("M") && parseInt(emanHealth) <= parseFloat(this.whenToShowHitsLeft.getValue())) {
					let thunderLevel = MathLib.clamp(parseInt(this.thunderLevel.getValue()), 5, 7)

					let thunderMultiplier = 1 + ((thunderLevel - 1) / 10);

					let hits = parseInt(emanHealth) / (parseFloat(this.rcmDamagePerHit.getValue()) * thunderMultiplier);

					emanText += ` &c${Math.max(0, Math.floor(hits - 0.75))} Hits`
				}
			}

			this.emanHpElement.setText(emanText);
		} else {
			this.emanHpElement.setText("");
		}

		if (this.pillerE) {
			if (this.pillerE.getEntity()[f.isDead]) this.pillerE = undefined
		}
		if (this.pillerE && ChatLib.removeFormatting(this.pillerE.getName())[1] === "s" && this.bossSpawnedMessage) {
			let time = parseInt(ChatLib.removeFormatting(this.pillerE.getName())[0]);
			if (Date.now() - this.lastPillerDink > time * 40) {
				World.playSound("note.pling", 1, 1);
				this.lastPillerDink = Date.now()
			}
			Client.showTitle(this.pillerE.getName(), "", 0, 20, 10);
		}

		if (this.emanLazerTimer.getValue() && this.actualEmanBoss && this.actualEmanBoss[m.isRiding]()) {
			if (this.emanStartedSittingTime === -1) {
				this.emanStartedSittingTime = Date.now()
			}
		} else {
			this.emanStartedSittingTime = -1
		}
	}

	apiLoad(data, dataType, isSoopyServer, isLatest) {
		if (!isSoopyServer || !isLatest) return;
		if (dataType !== "skyblock") return;

		this.slayerExp.zombie = data.data.profiles[data.data.stats.currentProfileId].members[Player.getUUID().replace(/-/g, "")].slayer.zombie?.xp;
		this.slayerExp.spider = data.data.profiles[data.data.stats.currentProfileId].members[Player.getUUID().replace(/-/g, "")].slayer.spider?.xp;
		this.slayerExp.wolf = data.data.profiles[data.data.stats.currentProfileId].members[Player.getUUID().replace(/-/g, "")].slayer.wolf?.xp;
		this.slayerExp.enderman = data.data.profiles[data.data.stats.currentProfileId].members[Player.getUUID().replace(/-/g, "")].slayer.enderman?.xp;
		this.slayerExp.blaze = data.data.profiles[data.data.stats.currentProfileId].members[Player.getUUID().replace(/-/g, "")].slayer.blaze?.xp;
	}

	renderOverlay() {
		if (this.slainAlert.getValue() && this.bossSlainMessage) {
			let scale = Renderer.getStringWidth(ChatLib.removeFormatting("BOSS SLAIN")) / (Renderer.screen.getWidth() * 0.75);

			Renderer.scale(1 / scale, 1 / scale);
			Renderer.drawString("&4BOSS SLAIN", Renderer.screen.getWidth() * 0.125 * scale, (Renderer.screen.getHeight() / 2 - 9 / scale) * scale);
			Renderer.scale(1, 1);
		}
		if (this.spawnAlert.getValue() && this.bossSpawnedMessage && Date.now() - this.lastBossNotSpawnedTime < 3000) {
			let scale = Renderer.getStringWidth(ChatLib.removeFormatting("BOSS SPAWNED")) / (Renderer.screen.getWidth() * 0.75);

			Renderer.scale(1 / scale, 1 / scale);
			Renderer.drawString("&4BOSS SPAWNED", Renderer.screen.getWidth() * 0.125 * scale, (Renderer.screen.getHeight() / 2 - 9 / scale) * scale);
			Renderer.scale(1, 1);
		}
	}

	step() {
		let averageExp = this.lastSlayerExps.reduce((a, b) => a + b, 0) / this.lastSlayerExps.length;
		let averageLength = (this.lastSlayerFinishes[this.lastSlayerFinishes.length - 1] - this.lastSlayerFinishes[0]) / (this.lastSlayerFinishes.length - 1);
		let runsperHour = (60000 * 60) / averageLength;
		let expPerHour = averageExp * runsperHour;

		if (Date.now() - this.lastSlayerFinishes[this.lastSlayerFinishes.length - 1] < 60000 * 5 || (this.FeatureManager.features["dataLoader"].class.slayerXpToSpawn && this.FeatureManager.features["dataLoader"].class.slayerXpToSpawn[0] !== 0)) {
			if (this.lastSlayerFinishes.length > 1) {
				this.slayerSpeedRatesElement.setText("&6Slayer speed&7> &f" + Math.floor(averageLength / 60000) + ":" + ((Math.floor(averageLength / 1000) % 60 < 10 ? "0" : "") + (Math.floor(averageLength / 1000) % 60)) + "\n&6Exp/hour&7> &f" + numberWithCommas(Math.round(expPerHour)) + "\n&6Kills/hour&7> &f" + Math.floor(runsperHour));
			} else {
				this.slayerSpeedRatesElement.setText("&6Slayer speed&7> &fLoading...\n&6Exp/hour&7> &fLoading...\n&6Kills/hour&7> &fLoading...");
			}
		} else {
			this.slayerSpeedRatesElement.setText("");
		}

		Object.keys(this.slayerLocationDataH).forEach(n => {
			if (this.slayerLocationDataH[n][1] + 60000 * 3 < Date.now()) {
				delete this.slayerLocationDataH[n]
			}
		})


		let lastBossSlainMessage = this.bossSlainMessage
		this.bossSlainMessage = false;
		this.hasQuest = false
		let dis1 = false;
		this.dulkirThingElement.setText("")
		Scoreboard.getLines().forEach((line, i) => {
			if (ChatLib.removeFormatting(line.getName()).includes("Slayer Quest")) {
				this.hasQuest = true
				let slayerInfo = ChatLib.removeFormatting(Scoreboard.getLines()[i - 1].getName().replace(/§/g, "&"));
				let levelString = slayerInfo.split(" ").pop().trim();
				let slayerLevelToExp = {
					I: 5,
					II: 25,
					III: 100,
					IV: 500,
					V: 1500,
				};
				this.lastSlayerExp = slayerLevelToExp[levelString];
				let slayerStrToType = {
					revenant: "zombie",
					tarantula: "spider",
					sven: "wolf",
					voidgloom: "enderman",
					inferno: "blaze"
				}
				this.lastSlayerType = slayerStrToType[slayerInfo.split(" ")[0].toLowerCase()];
				//slayerExp[lastSlayerType] += lastSlayerExp
			}
			if (line.getName().includes("Boss slain!")) {
				if (!lastBossSlainMessage) {
					socketConnection.sendSlayerSpawnData({ loc: null });
				}
				this.bossSlainMessage = true;
			}

			if (line.getName().includes("Slay the boss!")) {
				if (!this.bossSpawnedMessage) {
					socketConnection.sendSlayerSpawnData({ loc: [Math.round(Player.getX()), Math.round(Player.getY()), Math.round(Player.getZ())] });
				}
				if (!this.bossSpawnedMessage && !this.emanBoss) {
					this.nextIsBoss = Date.now();
				}

				dis1 = true;
				this.bossSpawnedMessage = true;
			}
			let lineSplitThing = ChatLib.removeFormatting(line.getName()).replace(/[^a-z/0-9 ]/gi, "").trim().split(" ")
			// ChatLib.chat(ChatLib.removeFormatting(line.getName()).replace(/[^a-z/0-9 ]+/gi, "").trim())

			if (this.slayerProgressAlert.getValue() && lineSplitThing[0]
				&& lineSplitThing[0].split("/").length === 2
				&& lineSplitThing[1] === "Kills") {
				let kills = lineSplitThing[0].split("/").map(a => parseInt(a))
				if (kills[0] / kills[1] >= 0.9) {
					this.dulkirThingElement.setText(line.getName())
				}
			}
		});
		if (!dis1) {
			this.lastBossNotSpawnedTime = Date.now();
			this.bossSpawnedMessage = false;
		}
	}

	initVariables() {
		this.expOnKill = undefined;
		this.slainAlert = undefined;
		this.spawnAlert = undefined;
		this.slayerExp = undefined;
		this.slayerExpLoaded = undefined;
		this.lastSlayerType = undefined;
		this.lastSlayerExp = undefined;
		this.bossSpawnedMessage = undefined;
		this.lastBossNotSpawnedTime = undefined;
		this.bossSlainMessage = undefined;
		this.todoE = undefined;
		this.beaconPoints = undefined;
		this.beaconE = undefined;
		this.deadE = undefined;
		this.beaconLocations = undefined;
		this.emanBoss = undefined;
		this.actualEmanBoss = undefined
		this.emanStartedSittingTime = undefined
		this.eyeE = undefined;
		this.nextIsBoss = undefined;
		this.hudElements = [];
		this.entityAttackEventLoaded = undefined;
		this.todoE2 = undefined;
		this.entityAttackEventE = undefined;
		this.hideSummons = false;
	}

	onDisable() {
		this.hudElements.forEach(h => h.delete())
		this.initVariables();
	}
}

module.exports = {
	class: new Slayers(),
};
