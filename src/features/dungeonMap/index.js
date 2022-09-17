/// <reference types="../../../../CTAutocomplete" />
/// <reference lib="es2015" />

const Color = Java.type("java.awt.Color")

import Feature from "../../featureClass/class";
import { f, m } from "../../../mappings/mappings";
import renderLibs from "../../../guimanager/renderLibs";
import ToggleSetting from "../settings/settingThings/toggle";
import { drawBoxAtBlock } from "../../utils/renderUtils";
import { SoopyGui, SoopyRenderEvent } from "../../../guimanager";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import ImageLocationSetting from "../settings/settingThings/imageLocation";
import socketConnection from "../../socketConnection";
import SoopyKeyPressEvent from "../../../guimanager/EventListener/SoopyKeyPressEvent";
import SettingBase from "../settings/settingThings/settingBase";
import { Box } from "../../utils/renderJavaUtils";
const BufferedImage = Java.type("java.awt.image.BufferedImage")
const AlphaComposite = Java.type("java.awt.AlphaComposite")

class DungeonMap extends Feature {
    constructor() {
        super()
    }

    isInDungeon() {
        if (!this.FeatureManager || !this.FeatureManager.features["dataLoader"]) return false
        return this.FeatureManager.features["dataLoader"].class.isInDungeon
    }

    onEnable() {
        this.initVariables()

        this.mapInfo = new SettingBase("NOTE: The more players in the party with this", "category enabled the more accurate the map will be.", undefined, "map_info", this)
        this.renderMap = new ToggleSetting("Render Map", "Toggles Rendering the map on the hud", false, "dmap_render", this)
        this.mapIcons = new ToggleSetting("Icons for puzzles on map", "Toggles Rendering the puzzle icons on map", true, "dmap_icons", this).requires(this.renderMap)
        this.mapLocation = new ImageLocationSetting("Map Location", "Sets the location of the map on the hud", "dmap_location", this, [10, 10, 1], new Image(javax.imageio.ImageIO.read(new java.io.File("./config/ChatTriggers/modules/SoopyV2/features/dungeonMap/map.png"))), 100, 100).requires(this.renderMap)
        this.mapBackground = new ToggleSetting("Map Background And Border", "Puts a grey background behind the map + Black border", true, "dmap_background", this)
        this.showMapInBoss = new ToggleSetting("Keep showing the map in the dungeon boss room", "This will center the map when in boss to still be usefull", true, "dmap_enable_boss", this)
        this.borderedHeads = new ToggleSetting("Add a black border around heads on map", "", false, "dmap_border_head", this)
        this.roomsecrets = new ToggleSetting("Shows secretscompleted/total secrets in room", "(works best when all of party is using soopy map)", false, "roomsecrets", this)
        this.brBox = new ToggleSetting("Box around doors in br", "In map category because it uses map to find location (no esp)", true, "dmap_door", this)
        this.spiritLeapOverlay = new ToggleSetting("Spirit leap overlay", "Cool overlay for the spirit leap menu", true, "spirit_leap_overlay", this)
        // this.spiritLeapOverlay = new ToggleSetting("Spirit leap overlay", "Cool overlay for the spirit leap menu", true, "spirit_leap_overlay", this).requires(this.spiritLeapOverlay)

        this.MAP_QUALITY_SCALE = 1
        this.IMAGE_SIZE = 128 * this.MAP_QUALITY_SCALE

        this.defaultPlayerImage = renderLibs.getImage("https://crafatar.com/avatars/dc8c39647b294e03ae9ed13ebd65dd29?size=8", true)
        this.mapDataPlayers = {}
        this.offset = []
        this.people = []
        this.mapScale = 1
        this.puzzles = {}
        this.puzzlesTab = []
        this.roomWidth = 1
        this.nameToUUID = {}
        this.deadPlayers = new Set()
        this.newPuzzlesTab = []
        this.mortLocationOnMap = undefined
        this.brBoxLoc = undefined
        this.keys = 0

        this.roomDataStuff = new Map()
        this.roomDataStuffRender = new Map()
        // this.invMapImage = new BufferedImage(128, 128, BufferedImage.TYPE_INT_ARGB)
        // this.renderImage = new BufferedImage(this.IMAGE_SIZE, this.IMAGE_SIZE, BufferedImage.TYPE_INT_ARGB)
        this.mapData = undefined
        this.idToPlayer = {}

        this.barrier_block_item = new Item("minecraft:barrier")
        this.puzzleItems = {
            "Water Board": new Item("minecraft:water_bucket"),
            "Higher Or Lower": new Item("minecraft:blaze_powder"),
            "Quiz": new Item("minecraft:book"),
            "Three Weirdos": new Item("minecraft:chest"),
            "Tic Tac Toe": new Item("minecraft:shears"),
            "Teleport Maze": new Item("minecraft:end_portal_frame"),
            "Ice Fill": new Item("minecraft:ice"),
            "Creeper Beams": new Item("minecraft:sea_lantern"),
            "Bomb Defuse": new Item("minecraft:tnt"),
            "Boulder": new Item("minecraft:planks"),
            "Ice Path": new Item("minecraft:mob_spawner")
        }

        this.dungeonBossImages = {
            // "F1": [
            //     {
            //         image: new Image(javax.imageio.ImageIO.read(new java.io.File("./config/ChatTriggers/modules/SoopyV2/features/dungeonMap/dungeonBossImages/f1.png"))),
            //         bounds: [[-65, 70, -3], [-19, 90, 45]],
            //         widthInWorld: 46,
            //         heightInWorld: 48,
            //         topLeftLocation: [-64, -2]
            //     }
            // ]
        }

        this.currDungeonBossImage = undefined
        this.dungeonBrBoxElm = new Box([0, 0, 0], [3, 4, 3], 1, 0, 0, 1, 3, false)

        this.bloodOpened = false
        this.registerChat("&r&cThe &r&c&lBLOOD DOOR&r&c has been opened!&r", () => {
            this.bloodOpened = true
            this.keys--
            this.dungeonBrBoxElm.setRGBA(1, 0, 0, 1)
            this.dungeonBrBoxElm.stopRender()
        })

        this.registerChat("${*} &r&ehas obtained &r&a&r&${*} Key&r&e!&r", () => {
            this.keys++
            this.dungeonBrBoxElm.setRGBA(0, 1, 0, 1)
        })
        this.registerChat("&r&eA &r&a&r&${*} Key&r&e was picked up!&r", () => {
            this.keys++
            this.dungeonBrBoxElm.setRGBA(0, 1, 0, 1)
        })

        this.lastDoorOpener = undefined
        this.registerChat("&r&a${player}&r&a opened a &r&8&lWITHER &r&adoor!&r", (player) => {
            this.lastDoorOpener = ChatLib.removeFormatting(player)
            this.keys--
            this.dungeonBrBoxElm.setRGBA(1, 0, 0, 1)
        })

        this.spiritLeapOverlayGui = new SpiritLeapOverlay(this)

        // this.registerEvent("tick", this.tick)
        this.registerStep(true, 3, this.step)
        this.registerStep(true, 10, () => {
            this.spiritLeapOverlayGui.tick()
        }).registeredWhen(() => this.isInDungeon())
        this.registerStep(false, 5, this.step5s).registeredWhen(() => this.isInDungeon())
        this.registerEvent("renderOverlay", this.renderOverlay).registeredWhen(() => this.isInDungeon())
        this.registerEvent("worldLoad", this.worldLoad)
        this.renderingPlayerList = false
        this.registerEvent("renderPlayerList", () => {
            this.renderingPlayerList = true
        })
        this.registerEvent("renderDebug", () => {
            this.renderingPlayerList = true
        })

        this.registerEvent("guiOpened", (event) => {
            if (this.spiritLeapOverlay.getValue()) this.spiritLeapOverlayGui.guiOpened.call(this.spiritLeapOverlayGui, event)
        })

        this.boringMap = false
        this.registerChat("&r&r&r           ${*}&r&cThe Catacombs &r&8- &r&eFloor ${*}&r", () => {
            this.boringMap = true
        })
        this.registerChat("&r&r&r       ${*}&r&cMaster Mode Catacombs &r&8- &r&eFloor ${*}&r", () => {
            this.boringMap = true
        })
        this.registerChat("&r&aDungeon starts in 1 second.&r", () => {
            this.boringMap = false
        })
        this.registerChat("&r&aDungeon starts in 1 second. Get ready!&r", () => {
            this.boringMap = false
        })

        this.running = true
        this.registerEvent("gameUnload", () => {
            this.running = false
        })
        this.registerChat("&r&c ☠ ${info} and became a ghost&r&7.&r", (info, e) => {
            let player = ChatLib.removeFormatting(info.split(" ")[0])

            this.deadPlayers.add(this.nameToUUID[player.toLowerCase()])
        });
        this.registerChat("&r&a ❣ &r${info} was revived${*}!&r", (info, e) => {
            let player = ChatLib.removeFormatting(info.split(" ")[0])

            this.deadPlayers.delete(this.nameToUUID[player.toLowerCase()])
        });

        this.registerStep(true, 3, () => {
            if (!this.isInDungeon()) return

            this.updateMapImage()
        }).registeredWhen(() => this.isInDungeon())

        this.registerChat("&r&r&r                     &r&cThe Catacombs &r&8- &r&eFloor ${*} Stats&r", () => {
            this.puzzles = {}
        })

        let lastXY = ""
        let registerActionBar = this.registerCustom("actionbar", (curr, max) => {
            let loc = this.getRoomXYWorld()

            if (lastXY !== loc.join(",")) {
                lastXY = loc.join(",")
                return
            }
            // if (curr === max) curr = "&a" + curr
            if (!this.roomDataStuff.get(loc.join(",")) || this.roomDataStuff.get(loc.join(","))[0] !== curr + "  " + max) {
                this.roomDataStuff.set(loc.join(","), [curr + "  " + max, this.getCurrentRoomId()])

                socketConnection.sendDungeonData2(this.people, [loc.join(","), curr + "  " + max, this.getCurrentRoomId()])
            }
        })
        registerActionBar.trigger.setCriteria('&7${curr}/${max} Secrets').setParameter('contains');
    }

    getCurrentRoomId() {
        let id = Scoreboard.getLineByIndex(Scoreboard.getLines().length - 1).getName().trim().split(" ").pop()

        return id
    }

    updateDungeonMapData2(data) {
        // console.log("Recieved: " + JSON.stringify(data, undefined, 2))
        this.roomDataStuff.set(data[0], [data[1], data[2]])
    }
    worldLoad() {
        this.dungeonBrBoxElm.stopRender()
        this.mortLocation = undefined
        this.mapDataPlayers = {}
        this.offset = []
        this.mapScale = 1
        this.puzzles = {}
        this.puzzlesTab = []
        this.brBoxLoc = undefined
        this.mortLocationOnMap = undefined
        this.bloodOpened = false
        this.keys = 0
        this.idToPlayer = {}
        this.roomDataStuff.clear()
    }

    renderOverlay() {
        if (!this.renderingPlayerList && this.isInDungeon() && this.renderMap.getValue() && !this.spiritLeapOverlayGui.soopyGui.ctGui.isOpen()) {
            this.drawMap(this.mapLocation.getValue()[0], this.mapLocation.getValue()[1], 100 * this.mapLocation.getValue()[2], 0.5 * this.mapLocation.getValue()[2])
        }
        this.renderingPlayerList = false
    }

    drawMap(x, y, size, scale) {
        if (this.mapData) {
            if (this.FeatureManager.features["dataLoader"].class.stats.Time === "Soon!" && Player.getInventory().getStackInSlot(8).getID() !== 358) return
            if (this.boringMap) {
                if (this.mapBackground.getValue()) Renderer.drawRect(Renderer.color(0, 0, 0, 100), x, y, size, size)

                if (this.mapBackground.getValue()) Renderer.drawRect(Renderer.color(0, 0, 0), x, y, size, 2)
                if (this.mapBackground.getValue()) Renderer.drawRect(Renderer.color(0, 0, 0), x, y, 2, size)
                if (this.mapBackground.getValue()) Renderer.drawRect(Renderer.color(0, 0, 0), x + size - 2, y, 2, size)
                if (this.mapBackground.getValue()) Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size - 2, size, 2)
                if (this.currDungeonBossImage) {
                    this.currDungeonBossImage.image.draw(x, y, size, size)
                } else {
                    GlStateManager.func_179094_E(); //GlStateManager.push()
                    Renderer.translate(x, y, 1)
                    GlStateManager.func_179152_a(size / 128, size / 128, 1); //GlStateManager.scale()
                    GlStateManager.func_179131_c(1.0, 1.0, 1.0, 1.0); // GlStateManager.color()
                    Client.getMinecraft().field_71460_t.func_147701_i().func_148250_a(this.mapData, true);
                    GlStateManager.func_179121_F(); //GlStateManager.pop()
                }

                return
            }

            World.getAllPlayers().forEach(player => {
                if (player.getPing() === -1) return
                if (!this.people.includes(player.getName())) return
                this.mapDataPlayers[player.getUUID().toString()] = {
                    x: player.getX(),
                    y: player.getZ(),
                    rot: player.getYaw() + 180,
                    username: player.getName(),
                    uuid: player.getUUID().toString()
                }
            })
            this.mapDataPlayers[Player.getUUID().toString()] = {
                x: Player.getX(),
                y: Player.getZ(),
                rot: Player.getYaw() + 180,
                username: Player.getName(),
                uuid: Player.getUUID().toString()
            }

            let uuid = Player.getUUID().toString()
            let renderX
            let renderY
            let xOff = 0
            let yOff = 0
            let disableMap = false
            if (this.mapDataPlayers[uuid]) {

                if (this.currDungeonBossImage) {
                    renderX = (this.mapDataPlayers[uuid].x - this.currDungeonBossImage.topLeftLocation[0]) / this.currDungeonBossImage.widthInWorld * size
                    renderY = (this.mapDataPlayers[uuid].y - this.currDungeonBossImage.topLeftLocation[1]) / this.currDungeonBossImage.heightInWorld * size
                } else {
                    renderX = this.mapDataPlayers[uuid].x / this.mapScale / 128 * size + this.offset[0] / 128 * size//*16/this.roomWidth
                    renderY = this.mapDataPlayers[uuid].y / this.mapScale / 128 * size + this.offset[1] / 128 * size//*16/this.roomWidth
                }

                if (renderX < 0 || renderX > size
                    || renderY < 0 || renderY > size) {
                    xOff = size / 2 - renderX
                    yOff = size / 2 - renderY

                    if (!this.showMapInBoss.getValue()) {
                        disableMap = true
                    }
                }
            }
            if (disableMap) return

            if (this.mapBackground.getValue()) Renderer.drawRect(Renderer.color(0, 0, 0, 100), x, y, size, size)
            renderLibs.scizzor(x + 2, y + 2, size - 4, size - 4)

            if (this.currDungeonBossImage) {
                this.currDungeonBossImage.image.draw(x + xOff, y + yOff, size, size)
            } else {
                GlStateManager.func_179094_E(); //GlStateManager.push()
                Renderer.translate(x + xOff, y + yOff, 1)
                GlStateManager.func_179152_a(size / 128, size / 128, 1); //GlStateManager.scale()
                GlStateManager.func_179131_c(1.0, 1.0, 1.0, 1.0); // GlStateManager.color()
                Client.getMinecraft().field_71460_t.func_147701_i().func_148250_a(this.mapData, true);
                GlStateManager.func_179121_F(); //GlStateManager.pop()
            }
            try {
                this.drawOtherMisc(x + xOff, y + yOff, size, scale)

                this.drawPlayersLocations(x + xOff, y + yOff, size, scale)

                this.drawOtherMisc2(x + xOff, y + yOff, size, scale)
            } catch (e) {
                console.error(e)
                console.error(e.stack)
            }
            renderLibs.stopScizzor()

            if (this.mapBackground.getValue()) Renderer.drawRect(Renderer.color(0, 0, 0), x, y, size, 2)
            if (this.mapBackground.getValue()) Renderer.drawRect(Renderer.color(0, 0, 0), x, y, 2, size)
            if (this.mapBackground.getValue()) Renderer.drawRect(Renderer.color(0, 0, 0), x + size - 2, y, 2, size)
            if (this.mapBackground.getValue()) Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size - 2, size, 2)

        }
    }

    drawOtherMisc(x2, y2, size, scale) {
        if (this.currDungeonBossImage) return
        if (this.mapIcons.getValue()) {
            Object.keys(this.puzzles).forEach(loc => {
                if (!this.puzzles[loc]) return
                if (this.puzzles[loc][1]) return
                let y = (loc % 128) / 128 * 100
                let x = (Math.floor(loc / 128)) / 128 * 100

                let item = this.puzzleItems[this.puzzles[loc][0]] || this.barrier_block_item

                // lines.forEach((l, i)=>{
                //     renderLibs.drawStringCentered("&0&l" + l, x*scale*2+x2-l.length/2*scale*2, y*scale*2+y2-this.roomWidth/3*scale*2+this.roomWidth/3*scale*2+i*6*scale*2-((lines.length-1)*3+4)*scale*2, scale*2)
                // })

                item.draw(x * scale * 2 + x2 - this.roomWidth / 4 * scale * 2, y * scale * 2 + y2 - this.roomWidth / 4 * scale * 2, 1.5 * scale)
            })
        }
    }

    drawOtherMisc2(x2, y2, size, scale) {
        if (this.currDungeonBossImage) return
        if (this.roomsecrets.getValue()) {
            for (let ent of this.roomDataStuffRender.entries()) {
                let [loc, [secrets, roomid, color]] = ent
                let [x, y] = loc.split(",")

                let renderText = color + secrets

                let val2 = ChatLib.removeFormatting(renderText)

                let renderX = (parseInt(x) + 16) / this.mapScale / 128 * size + this.offset[0] / 128 * size
                let renderY = (parseInt(y) + 16) / this.mapScale / 128 * size + this.offset[1] / 128 * size

                Renderer.translate(0, 0, 1000)
                renderLibs.drawStringCentered("§0" + val2, x2 + renderX + scale * 1.25, y2 + renderY - 2 * scale * 1.25, scale * 1.25)
                Renderer.translate(0, 0, 1000)
                renderLibs.drawStringCentered("§0" + val2, x2 + renderX - scale * 1.25, y2 + renderY - 2 * scale * 1.25, scale * 1.25)
                Renderer.translate(0, 0, 1000)
                renderLibs.drawStringCentered("§0" + val2, x2 + renderX, y2 + renderY + scale * 1.25 - 2 * scale * 1.25, scale * 1.25)
                Renderer.translate(0, 0, 1000)
                renderLibs.drawStringCentered("§0" + val2, x2 + renderX, y2 + renderY - scale * 1.25 - 2 * scale * 1.25, scale * 1.25)
                Renderer.translate(0, 0, 1000)
                renderLibs.drawStringCentered("§f" + renderText, x2 + renderX, y2 + renderY - 2 * scale * 1.25, scale * 1.25)
            }
        }
    }

    drawPlayersLocations(x, y, size, scale) {

        let uuidToPlayer = {}
        World.getAllPlayers().forEach(player => {
            if (player.getPing() === -1) return
            if (!this.people.includes(player.getName())) return
            uuidToPlayer[player.getUUID().toString()] = player
        })

        Object.keys(this.mapDataPlayers).forEach((uuid) => {
            if (this.deadPlayers.has(uuid)) return
            if (uuid === Player.getUUID().toString()) return
            let renderX
            let renderY

            if (this.currDungeonBossImage) {
                renderX = (this.mapDataPlayers[uuid].x - this.currDungeonBossImage.topLeftLocation[0]) / this.currDungeonBossImage.widthInWorld * size
                renderY = (this.mapDataPlayers[uuid].y - this.currDungeonBossImage.topLeftLocation[1]) / this.currDungeonBossImage.heightInWorld * size
            } else {
                renderX = this.mapDataPlayers[uuid].x / this.mapScale / 128 * size + this.offset[0] / 128 * size//*16/this.roomWidth
                renderY = this.mapDataPlayers[uuid].y / this.mapScale / 128 * size + this.offset[1] / 128 * size//*16/this.roomWidth
            }

            if (this.borderedHeads.getValue()) {
                Renderer.translate(renderX + x, renderY + y, 1000)
                Renderer.scale(scale * 1.5, scale * 1.5)
                Renderer.rotate(this.mapDataPlayers[uuid].rot)
                Renderer.drawRect(Renderer.color(0, 0, 0), -6, -6, 12, 12)
            }
            Renderer.translate(renderX + x, renderY + y, 1000)
            Renderer.scale(scale * 1.5, scale * 1.5)
            Renderer.rotate(this.mapDataPlayers[uuid].rot)
            this.getImageForPlayer(uuid).draw(-5, -5, 10, 10)
        })

        let uuid = Player.getUUID().toString()
        if (!this.mapDataPlayers[uuid]) return
        let renderX
        let renderY

        if (this.currDungeonBossImage) {
            renderX = (this.mapDataPlayers[uuid].x - this.currDungeonBossImage.topLeftLocation[0]) / this.currDungeonBossImage.widthInWorld * size
            renderY = (this.mapDataPlayers[uuid].y - this.currDungeonBossImage.topLeftLocation[1]) / this.currDungeonBossImage.heightInWorld * size
        } else {
            renderX = this.mapDataPlayers[uuid].x / this.mapScale / 128 * size + this.offset[0] / 128 * size//*16/this.roomWidth
            renderY = this.mapDataPlayers[uuid].y / this.mapScale / 128 * size + this.offset[1] / 128 * size//*16/this.roomWidth
        }


        if (this.borderedHeads.getValue()) {
            Renderer.translate(renderX + x, renderY + y, 1000)
            Renderer.scale(scale * 1.5, scale * 1.5)
            Renderer.rotate(this.mapDataPlayers[uuid].rot)
            Renderer.drawRect(Renderer.color(0, 0, 0), -6, -6, 12, 12)
        }
        Renderer.translate(renderX + x, renderY + y, 1000)
        Renderer.scale(scale * 1.5, scale * 1.5)
        Renderer.rotate(this.mapDataPlayers[uuid].rot)
        this.getImageForPlayer(uuid).draw(-5, -5, 10, 10)
    }

    getRoomXYWorld() {
        let roomData = this.getRoomWorldData()
        if (roomData.rotation === 4) {
            return [roomData.x, roomData.y + 32]
        }

        return [roomData.x, roomData.y]
    }

    getRotation(x, y, width, height, roofY) {
        let one = this.getTopBlockAt(x + width / 2 + 1, y + height / 2, roofY)
        let two = this.getTopBlockAt(x + width / 2 - 1, y + height / 2, roofY)
        let three = this.getTopBlockAt(x + width / 2, y + height / 2 + 1, roofY)
        let four = this.getTopBlockAt(x + width / 2, y + height / 2 - 1, roofY)

        if (one === 0 && three === 0) return 1
        if (two === 0 && three === 0) return 2
        if (one === 0 && four === 0) return 3
        if (two === 0 && four === 0) return 4 //4 IS SO TOXIK HGOLY HEL I HATE L SHAPE ROOMS WHY DO THIS TO ME

        return -1
    }

    getRoomWorldData() {
        let x = Math.floor((Player.getX() + 8) / 32) * 32 - 8
        let y = Math.floor((Player.getZ() + 8) / 32) * 32 - 8
        let width = 30
        let height = 30

        let roofY = this.getRoofAt(x, y)

        while (World.getBlockStateAt(new BlockPos(x - 1, roofY, y)).getBlockId() !== 0) {
            x -= 32
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x, roofY, y - 1)).getBlockId() !== 0) {
            y -= 32
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x - 1, roofY, y)).getBlockId() !== 0) { //second iteration incase of L shape
            x -= 32
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width + 1, roofY, y)).getBlockId() !== 0) {
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x, roofY, y + height + 1)).getBlockId() !== 0) {
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width, roofY, y + height + 1)).getBlockId() !== 0) { //second iteration incase of L shape
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width + 1, roofY, y + height)).getBlockId() !== 0) { //second iteration incase of L shape
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width, roofY, y - 1)).getBlockId() !== 0) {//second iteration incase of L shape
            y -= 32
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x - 1, roofY, y + height)).getBlockId() !== 0) { //third iteration incase of L shape
            x -= 32
            width += 32
        }


        return {
            x,
            y,
            width,
            height,
            cx: x + width / 2,
            cy: y + height / 2,
            rotation: this.getRotation(x, y, width, height, roofY)
        }
    }

    getRoofAt(x, z) {
        let y = 255
        while (y > 0 && World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId() === 0) y--

        return y
    }

    getTopBlockAt(x, z, y) {
        if (!y) y = this.getHeightAt(x, z)

        return World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId()
    }

    step() {
        if (!World.getWorld()) return
        if (!this.isInDungeon()) return
        if (Player.getContainer().getName().startsWith("Catacombs - Floor ")) {
            this.nameToUUID = {}
            World.getAllPlayers().forEach(p => {
                this.nameToUUID[p.getName().toLowerCase()] = p.getUUID().toString()
            })
            let playerI = 0
            for (let i = 0; i < 5; i++) {
                let name = ChatLib.removeFormatting(Player.getContainer().getStackInSlot(3 + i)?.getName()?.split(" ")?.pop() || "")
                if (this.nameToUUID[name.toLowerCase()] && this.nameToUUID[name.toLowerCase()] !== Player.getUUID().toString()) {
                    this.idToPlayer[playerI] = this.nameToUUID[name.toLowerCase()]
                    if (name) playerI++
                }
            }
            this.idToPlayer[playerI] = Player.getUUID().toString()
            playerI++
            if (playerI !== World.getAllPlayers().filter(p => p.getPing() === 1).length) this.idToPlayer = {}
        }
        // console.log("asjbfoasbgp")
        this.people = []
        this.puzzlesTab = []
        TabList.getNames().forEach(nameo => {


            //         Party (2) | Soopyboo32 (Mage XXXVI) |  Ultimate: Ready |  Revive Stones: 1 |  | zZzJAKE ♲ (DEAD) |  Ultimate: 00m 45s |  Revive Stones: 0 |  |  |  |  |  |  |  |  |  |  |  |  |        Player Stats | Downed: zZzJAKE |  Time: 00m 47s |  Revive: 01m 40s |  | Deaths: (2) |  Damage Dealt: 4.7M❤ |  Healing Done: 718❤ |  Milestone: ☠❸ |  | Discoveries: (0) |  Secrets Found: 0 |  Crypts: 0 |  |  |  |  |  |  |  |        Dungeon Stats | Dungeon: Catacombs |  Opened Rooms: 13 |  Completed Rooms: 12 |  Secrets Found: 0% |  Time: 01m 51s |  | Puzzles: (3) |  ???: [✦] |  ???: [✦] |  ???: [✦] |  |  |  |  |  |  |  |  |  |        Account Info | Profile: Pomegranate |  Pet Sitter: N/A |  Bank: 57M/11M |  Interest: 04h 19m 10s |  | Skills: Combat 60: MAX |  Speed: ✦457 |  Strength: ❁859 |  Crit Chance: ☣62 |  Crit Damage: ☠1479 |  Attack Speed: ⚔92 |  | Event: Election Over! |  Starts In: 2h 39m 10s |  | Election: 0d 2h 39m 10s |  Aatrox: |||||||||| (79%) |  Marina: |||||||||| (7%) |  Cole: |||||||||| (6%) | Soopyboo32
            let line = ChatLib.removeFormatting(nameo).trim().replace("♲ ", "") //TODO: Remove bingo symbol
            if (line.endsWith(")") && line.includes(" (") && line.split(" (").length === 2 && line.split(" (")[0].split(" ").length === 1 && line.split(" (")[1].length > 5) {
                this.people.push(line.split(" ")[0])
            }

            name = ChatLib.removeFormatting(nameo).trim().split(" ")
            let end = name.pop()
            // console.log(end) Water Board: [✔] 
            if (end !== "[✦]" && end !== "[✔]") return
            name = name.join(" ").trim().replace(":", "")
            if (name.length > 1 && !name.includes("?")) {
                this.puzzlesTab.push([name, end === "[✔]"])
            }
            // console.log(name)
        })
        let puzzlesTab2 = this.puzzlesTab.map(a => a)
        // console.log(this.puzzlesTab.length)
        // Object.keys(this.puzzles).forEach(key=>{
        //     let y = (key%128)
        //     let x = (Math.floor(key/128))

        //     if(x>100&&y>100){
        //         this.puzzles[key] = puzzlesTab2.shift()
        //     }
        // })
        Object.keys(this.puzzles).forEach(key => {
            // let y = (key%128)
            // let x = (Math.floor(key/128))

            // if(x>100&&y>100){
            //     return
            // }
            this.puzzles[key] = puzzlesTab2.shift()
            // console.log(key, this.puzzles[key], this.puzzlesTab.length)
        })
    }

    updateMapImage() {
        if (!this.mortLocation) {
            try {
                World.getAllEntities().forEach(entity => {
                    if (ChatLib.removeFormatting(entity.getName()) === ("Mort")) {
                        this.mortLocation = [
                            entity.getX(),
                            entity.getZ()
                        ]
                    }
                })
            } catch (e) { }
        }

        // let graphics = this.renderImage.getGraphics()

        // graphics.setComposite(AlphaComposite.Clear);
        // graphics.fillRect(0, 0, this.IMAGE_SIZE, this.IMAGE_SIZE)
        // graphics.setComposite(AlphaComposite.SrcOver);

        let mapData
        try {
            let item = Player.getInventory().getStackInSlot(8)
            mapData = item.getItem()[m.getMapData](item.getItemStack(), World.getWorld()); // ItemStack.getItem().getMapData()
        } catch (error) {
        }
        if (mapData && !this.boringMap) {
            this.mapData = mapData


            // console.log("has map data poggies")
            let bytes = mapData[f.colors.MapData]

            // let newArr = java.lang.reflect.Array.newInstance(java.lang.Integer.TYPE, bytes.length)
            // for (let i = 0; i < bytes.length; i++) {
            //     // console.log(bytes[i]/4)

            //     if (bytes[i] !== 0) {
            //         let j = bytes[i] & 255
            //         newArr[i] = net.minecraft.block.material.MapColor[f.mapColorArray][j >> 2][m.getMapColor.MapColor](j & 3)
            //         // graphics.setColor(color)
            //         // graphics.fillRect(x * this.MAP_QUALITY_SCALE, y * this.MAP_QUALITY_SCALE, this.MAP_QUALITY_SCALE, this.MAP_QUALITY_SCALE)
            //     }
            //     // x++
            //     // if (x >= 128) {
            //     //     x = 0
            //     //     y++

            //     //     if (y > 128) break
            //     // }

            //     // mapImage.getRGB()
            // }
            // this.renderImage.setRGB(0, 0, 128, 128, newArr, 0, 128)

            // newImage.setRGB(0,0,128,128, ints, 0, 1)

            // graphics. ()
            //room size is 18
            //4 inbetween

            //finding room offsets
            let brBoxTemp = undefined
            let roomOffsets
            let roomWidth1 = 0
            let roomWidth2 = 0
            let rx = 0
            let ry = 0
            for (let x = 0; x < 128; x += 5) {
                for (let y = 0; y < 128; y += 5) {
                    if (bytes[x + y * 128] === 30
                        && bytes[x + 1 + y * 128] === 30
                        && bytes[x + 2 + y * 128] === 30
                        && bytes[x + 3 + y * 128] === 30
                        && bytes[x + 5 + y * 128] === 30
                        && bytes[x + 10 + y * 128] === 30) {
                        rx = x
                        ry = y
                        while (bytes[(rx - 1) + ry * 128] === 30) {
                            rx--
                        }
                        while (bytes[(rx) + (ry - 1) * 128] === 30) {
                            ry--
                        }
                        break;
                    }
                }
                if (rx) break;
            }
            let x = rx
            while (bytes[x + ry * 128] === 30) {
                x++
                roomWidth2++
            }
            let y = ry
            while (bytes[rx + y * 128] === 30) {
                y++
                roomWidth1++
            }

            let roomWidth = Math.floor(Math.max(roomWidth1, roomWidth2) * 5 / 4)

            this.mapScale = 32 / roomWidth
            let mortLocationOnMap
            roomOffsets = [rx % roomWidth - 3, ry % roomWidth - 3]

            let dir = roomWidth / 2 - 5 / this.mapScale

            //top
            for (let i = 0; i < roomWidth; i++) {
                if (bytes[(i + rx - 3) + (ry - 3) * 128] !== 0) {
                    mortLocationOnMap = [rx - 2 + roomWidth / 2, ry - 2 + roomWidth / 2 - dir]
                    break
                }
            }
            // if(mortLocationOnMap) break
            //bottom
            for (let i = 0; i < roomWidth; i++) {
                if (bytes[(i + rx - 3) + (ry + roomWidth - 3) * 128] !== 0) {
                    mortLocationOnMap = [rx - 2 + roomWidth / 2, ry - 2 + roomWidth / 2 + dir]
                    break
                }
            }
            //left
            for (let i = 0; i < roomWidth; i++) {
                if (bytes[(rx - 3) + (i + ry - 3) * 128] !== 0) {
                    mortLocationOnMap = [rx - 2 + roomWidth / 2 - dir, ry - 2 + roomWidth / 2]
                    break
                }
            }
            //right
            for (let i = 0; i < roomWidth; i++) {
                if (bytes[(rx + roomWidth - 3) + (i + ry - 3) * 128] !== 0) {
                    mortLocationOnMap = [rx - 2 + roomWidth / 2 + dir, ry - 2 + roomWidth / 2]
                }
            }

            if (mortLocationOnMap && this.mortLocation) {

                for (let x = roomOffsets[0]; x < 128; x += roomWidth) {
                    for (let y = roomOffsets[1]; y < 128; y += roomWidth) {
                        let testLocs = [[x, y + roomWidth / 2, false], [x + roomWidth / 2, y, true]]
                        testLocs.forEach(([ux, uy, isX]) => {

                            // console.log(bytes[~~ux+~~uy*128])
                            if (bytes[~~ux + ~~uy * 128] === 119 || bytes[~~ux + ~~uy * 128] === 18) {

                                brBoxTemp = [
                                    (ux - mortLocationOnMap[0]) / roomWidth * 32 + this.mortLocation[0],
                                    (uy - mortLocationOnMap[1]) / roomWidth * 32 + this.mortLocation[1]
                                ]

                                if (isX) {
                                    brBoxTemp[0] = Math.floor(brBoxTemp[0] / 32 + 0.5) * 32 + 16
                                    brBoxTemp[1] = Math.floor(brBoxTemp[1] / 32 + 0.5) * 32
                                } else {
                                    brBoxTemp[0] = Math.floor(brBoxTemp[0] / 32 + 0.5) * 32
                                    brBoxTemp[1] = Math.floor(brBoxTemp[1] / 32 + 0.5) * 32 + 16
                                }

                                brBoxTemp = [
                                    (~~brBoxTemp[0]) - 8.5,
                                    (~~brBoxTemp[1]) - 8.5
                                ]
                            }
                        })

                        let [tx, ty] = [~~(x + roomWidth / 2), ~~(y + roomWidth / 2)]

                        if (bytes[tx + ty * 128] === 66) {

                            if (!this.puzzles[(tx) * 128 + ty] && Object.keys(this.puzzles).length < 10) {
                                this.puzzles[(tx) * 128 + ty] = ["Loading", false]
                            }
                        }
                    }
                }
            }

            this.brBoxLoc = brBoxTemp


            if (this.brBox.getValue() && !this.bloodOpened) this.dungeonBrBoxElm.startRender()

            if (this.brBoxLoc) this.dungeonBrBoxElm.setLocationSize([this.brBoxLoc[0] - 1.5, 69, this.brBoxLoc[1] - 1.5], [3, 4, 3])

            if (roomOffsets) {
                // for(let x = 0;x<128;x++){
                //     for(let y = 0;y<128;y++){
                //         if((x-roomOffsets[0])%roomWidth===0 || (y-roomOffsets[1])%roomWidth===0){
                //             this.renderImage.setRGB(x*this.MAP_QUALITY_SCALE, y*this.MAP_QUALITY_SCALE, Renderer.color(0,0,0))
                //         }
                //     }
                // }

                // for(let x = roomOffsets[0];x<128;x+=roomWidth){
                //     for(let y = roomOffsets[1];y<128;y+=roomWidth){
                //         let testLocs = [[x, y+roomWidth/2],[x+roomWidth/2, y]]
                //         testLocs.forEach(([ux, uy])=>{
                //             ux = ~~ux
                //             uy = ~~uy

                //             try{
                //             this.renderImage.setRGB(ux*this.MAP_QUALITY_SCALE, uy*this.MAP_QUALITY_SCALE, Renderer.color(255,0,0))
                //             }catch(e){}
                //         })
                //     }

                // }

                if (mortLocationOnMap && this.mortLocation) {
                    this.offset = [mortLocationOnMap[0] - this.mortLocation[0] / this.mapScale, mortLocationOnMap[1] - this.mortLocation[1] / this.mapScale]
                    // this.renderImage.setRGB(mortLocationOnMap[0], mortLocationOnMap[1], Renderer.color(255, 0, 0))
                    // ChatLib.chat(roomWidth + " " + this.offset.join(", "))
                }
            }

            // console.log(bytes[Math.floor(Player.getX()/this.mapScale+this.offset[0])+Math.floor(Player.getZ()/this.mapScale + this.offset[1])*128])
            this.roomWidth = roomWidth

            this.mortLocationOnMap = mortLocationOnMap

            if (this.mortLocation && mortLocationOnMap && roomWidth) {
                let deco = mapData[f.mapDecorations]
                this.extraDeco = []
                try {
                    let i = 0
                    deco.forEach((icon, vec4b) => {
                        let x = vec4b.func_176112_b()
                        let y = vec4b.func_176113_c()
                        let rot = vec4b.func_176111_d()
                        x = x / 2 + 64
                        y = y / 2 + 64
                        rot = rot * 360 / 16 + 180


                        x = (x - mortLocationOnMap[0]) / roomWidth * 32 + this.mortLocation[0]
                        y = (y - mortLocationOnMap[1]) / roomWidth * 32 + this.mortLocation[1]


                        //wtf is this

                        //vec4b.func_176110_a()


                        let closestP = undefined
                        let closestDistance = Infinity
                        Object.keys(this.mapDataPlayers).forEach((uuid) => {
                            if ((x - this.mapDataPlayers[uuid].x) ** 2 + (y - this.mapDataPlayers[uuid].y) ** 2 < closestDistance) {
                                closestDistance = (x - this.mapDataPlayers[uuid].x) ** 2 + (y - this.mapDataPlayers[uuid].y) ** 2
                                closestP = uuid
                            }
                        })
                        while (this.idToPlayer[i] && this.deadPlayers.has(this.idToPlayer[i])) i++
                        if (this.idToPlayer[i]) closestP = this.idToPlayer[i]
                        if (closestP && closestP !== Player.getUUID().toString()) {
                            // console.log(closestP, x, y)
                            this.mapDataPlayers[closestP].x = x
                            this.mapDataPlayers[closestP].y = y
                            this.mapDataPlayers[closestP].rot = rot
                        }
                        i++
                    });
                } catch (e) { }
            }


            if (this.offset && this.offset.length === 2) {
                this.roomDataStuffRender.clear()
                for (let ent of this.roomDataStuff.entries()) {
                    let [loc] = ent
                    let [x, y] = loc.split(",")

                    let renderX = Math.round((parseInt(x) + 16) / this.mapScale + this.offset[0]) // / 128 * size
                    let renderY = Math.round((parseInt(y) + 16) / this.mapScale + this.offset[1])// / 128 * size
                    // console.log(renderX, renderY)
                    let isGreen = false
                    let color = "&8"
                    for (let i = 0; i < 10; i++) {
                        if (bytes[renderX + i + (renderY + i) * 128] === 30
                            || bytes[renderX + i + 1 + (renderY + i) * 128] === 30) {
                            isGreen = true
                            color = "&a"
                        }
                        if (bytes[renderX + i + (renderY + i) * 128] === 34
                            || bytes[renderX + i + 1 + (renderY + i) * 128] === 34) {
                            color = "&f"
                        }
                    }
                    if (isGreen) {
                        let total = ent[1][0].split("  ")[1]
                        let data = this.roomDataStuff.get(loc)
                        data[0] = total + "  " + total
                        this.roomDataStuff.set(loc, data)
                    }

                    let setData = [...this.roomDataStuff.get(loc)]
                    setData.push(color)
                    this.roomDataStuffRender.set(loc, setData)
                }
            }
            // if (!this.renderImage) return

            // let newMapImageThing = new Image(this.renderImage)
            this.currDungeonBossImage = undefined
        } else {
            //no map data, check to see if should render boss image

            if (this.dungeonBossImages[this.FeatureManager.features["dataLoader"].class.dungeonFloor]) this.dungeonBossImages[this.FeatureManager.features["dataLoader"].class.dungeonFloor].forEach(data => {
                if (data.bounds[0][0] <= Player.getX() && data.bounds[0][1] <= Player.getY() && data.bounds[0][2] <= Player.getZ() && data.bounds[1][0] >= Player.getX() && data.bounds[1][1] >= Player.getY() && data.bounds[1][2] >= Player.getZ()) {
                    this.currDungeonBossImage = data
                }
            })
        }


        // this.mapImage.setImage(this.renderImage)
    }

    step5s() {
        if (!this.FeatureManager.features["dataLoader"].class.isInDungeon) return
        if (this.people.length < 1) return

        let data = []

        World.getAllPlayers().forEach(player => {
            if (player.getPing() === -1) return
            if (!this.people.includes(player.getName())) return
            data.push({
                x: player.getX(),
                y: player.getZ(),
                rot: player.getYaw() + 180,
                username: player.getName(),
                uuid: player.getUUID().toString()
            })
            this.nameToUUID[player.getName().toLowerCase()] = player.getUUID().toString()
        })
        // console.log("Sending: " + JSON.stringify(this.people, undefined, 2)+JSON.stringify(data, undefined, 2))
        socketConnection.sendDungeonData(this.people, data)
    }
    updateDungeonMapData(data) {
        // console.log("Recieved: " + JSON.stringify(data, undefined, 2))
        data.forEach(p => {
            this.mapDataPlayers[p.uuid] = p
        })
    }

    getImageForPlayer(uuid) {
        let img = renderLibs.getImage("https://crafatar.com/avatars/" + uuid.replace(/-/g, "") + "?size=8&overlay")
        if (!img) return this.defaultPlayerImage

        return img
    }

    initVariables() {
        this.mapImage = undefined
        this.defaultPlayerImage = undefined
        this.mortLocation = undefined
        this.offset = undefined
        this.puzzles = undefined
        this.puzzlesTab = undefined
        this.mapScale = undefined
        this.newPuzzlesTab = undefined
        this.renderImage = undefined
    }

    onDisable() {
        this.dungeonBrBoxElm.stopRender()
        this.initVariables()
        this.running = false
        this.roomDataStuff.clear()
    }
}

module.exports = {
    class: new DungeonMap()
}

const ContainerChest = Java.type("net.minecraft.inventory.ContainerChest")
class SpiritLeapOverlay {
    constructor(parent) {
        this.parent = parent

        this.soopyGui = new SoopyGui()

        let renderThing = new soopyGuiMapRendererThing(this).setLocation(0, 0, 1, 1)
        this.soopyGui.element.addChild(renderThing)

        this.soopyGui.element.addEvent(new SoopyKeyPressEvent().setHandler((key, keyId) => {
            if (keyId === 18) {
                this.soopyGui.close()
            }
        }))

        this.buttonsContainer = new SoopyGuiElement().setLocation(0.2, 0.2, 0.6, 0.3)
        this.soopyGui.element.addChild(this.buttonsContainer)

        this.items = {}

        this.players = {}
    }

    guiOpened(event) {
        if (event.gui && event.gui.field_147002_h instanceof ContainerChest) {
            name = event.gui.field_147002_h.func_85151_d().func_145748_c_().func_150260_c()
            if (name === "Spirit Leap") {
                this.soopyGui.open()
            }
        }
    }

    tick() {
        let itemsNew = {}

        if (Player.getContainer()?.getName() === "Spirit Leap") {

            this.players = {}
            Scoreboard.getLines().forEach(line => {
                let name = ChatLib.removeFormatting(line.getName()).replace(/[^A-z0-9 \:\(\)\.\[\]]/g, "")
                if (name.startsWith("[M] ")) this.players[name.split(" ")[1]] = "M"
                if (name.startsWith("[A] ")) this.players[name.split(" ")[1]] = "A"
                if (name.startsWith("[B] ")) this.players[name.split(" ")[1]] = "B"
                if (name.startsWith("[H] ")) this.players[name.split(" ")[1]] = "H"
                if (name.startsWith("[T] ")) this.players[name.split(" ")[1]] = "T"
            })

            for (let i = 1; i < 9 * 3; i++) {
                let item = Player.getContainer().getStackInSlot(i)
                if (item && item.getID() !== 160) {
                    itemsNew[item.getName()] = i
                }
            }

            if (JSON.stringify(this.items) !== JSON.stringify(itemsNew)) {
                this.items = itemsNew
                this.buttonsContainer.clearChildren()

                getClass = (name) => {
                    let pClass = (this.players[name] || "?")
                    if (pClass === "?") {
                        Object.keys(this.players).forEach(n => {
                            if (name.startsWith(n)) {
                                pClass = this.players[n]
                            }
                        })
                    }
                    return pClass
                }

                Object.keys(this.items).sort((a, b) => {
                    return getClass(ChatLib.removeFormatting(a)).codePointAt(0) - getClass(ChatLib.removeFormatting(b)).codePointAt(0)
                }).forEach((name, i) => {

                    let name2 = ChatLib.removeFormatting(name)
                    let pClass = getClass(name2)

                    let button = new ButtonWithArrow().setText((name2 === this.parent.lastDoorOpener ? "&4" : "&2") + "[" + pClass + "] " + name2).addEvent(new SoopyMouseClickEvent().setHandler(() => {
                        Player.getContainer().click(itemsNew[name])
                        ChatLib.chat("Leaping to " + name)
                    })).setLocation((i % 2) * 0.5, Math.floor(i / 2) * 0.5, 0.5, 0.5)
                    button.text.setLocation(0.5, 0, 0.4, 1)
                    button.addEvent(new SoopyRenderEvent().setHandler(() => {
                        if (!this.parent.nameToUUID[name2.toLowerCase()]) return
                        let img = this.parent.getImageForPlayer(this.parent.nameToUUID[name2.toLowerCase()])

                        if (!img) return

                        let x = button.location.getXExact()
                        let y = button.location.getYExact()
                        let h = button.location.getHeightExact()

                        img.draw(x + h / 5, y + h / 10, 8 * h / 10, 8 * h / 10)

                    }))
                    this.buttonsContainer.addChild(button)
                })
            }
        }
    }
}

class soopyGuiMapRendererThing extends SoopyGuiElement {
    constructor(parent) {
        super()

        this.parentE = parent

        this.addEvent(new SoopyRenderEvent().setHandler((mouseX, mouseY) => {
            let size2 = Math.min(Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 2)

            let [x, y, size, scale] = [Renderer.screen.getWidth() / 2 - size2 / 2, 2 * Renderer.screen.getHeight() / 3 - size2 / 3, size2, size2 / this.parentE.parent.IMAGE_SIZE]

            this.parentE.parent.drawMap(x, y, size, scale)

            let closestPlayer
            if (mouseY > y) {
                closestPlayer = this.getClosestPlayerTo(x, y, size, scale, mouseX, mouseY)

                if (closestPlayer) {
                    let renderX = closestPlayer.x / this.parentE.parent.mapScale / 128 * size//*16/this.roomWidth
                    let renderY = closestPlayer.y / this.parentE.parent.mapScale / 128 * size//*16/this.roomWidth

                    Renderer.translate(renderX + x + this.parentE.parent.offset[0] / 128 * size, renderY + y + this.parentE.parent.offset[1] / 128 * size, 1000)
                    Renderer.scale(scale * 3, scale * 3)
                    Renderer.rotate(closestPlayer.rot)
                    this.parentE.parent.getImageForPlayer(closestPlayer.uuid).draw(-5, -5, 10, 10)
                }
            }
            Object.keys(this.parentE.parent.mapDataPlayers).forEach(uuid => {
                let player = this.parentE.parent.mapDataPlayers[uuid]

                let renderX = player.x / this.parentE.parent.mapScale / 128 * size//*16/this.roomWidth
                let renderY = player.y / this.parentE.parent.mapScale / 128 * size//*16/this.roomWidth

                Renderer.translate(renderX + x + this.parentE.parent.offset[0] / 128 * size, renderY + y + this.parentE.parent.offset[1] / 128 * size, 1000)
                renderLibs.drawStringCenteredShadow((player.uuid === closestPlayer?.uuid ? "&c" : "&a") + "[" + (this.parentE.players[player.username] || "?") + "] " + player.username, 0, -7 * scale * 3, 2)
                /*
                {
                    x: player.getX(),
                    y: player.getZ(),
                    rot: player.getYaw()+180,
                    username: player.getName(),
                    uuid: player.getUUID().toString()
                }
                */
            })

            if (closestPlayer) {
                let renderX = closestPlayer.x / this.parentE.parent.mapScale / 128 * size//*16/this.roomWidth
                let renderY = closestPlayer.y / this.parentE.parent.mapScale / 128 * size//*16/this.roomWidth

                Renderer.translate(renderX + x + this.parentE.parent.offset[0] / 128 * size, renderY + y + this.parentE.parent.offset[1] / 128 * size)
                renderLibs.drawStringCenteredShadow("&c" + "[" + (this.parentE.players[closestPlayer.username] || "?") + "] " + closestPlayer.username, 0, -7 * scale * 3, 2)
            }
        }))
        this.addEvent(new SoopyMouseClickEvent().setHandler((mouseX, mouseY) => {
            let size2 = Math.min(Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 2)

            let [x, y, size, scale] = [Renderer.screen.getWidth() / 2 - size2 / 2, 2 * Renderer.screen.getHeight() / 3 - size2 / 3, size2, size2 / this.parentE.parent.IMAGE_SIZE]

            if (mouseY < y) return

            let closestPlayer = this.getClosestPlayerTo(x, y, size, scale, mouseX, mouseY)

            if (closestPlayer) {
                if (Player.getContainer()?.getName() === "Spirit Leap") {
                    for (let i = 1; i < 9 * 3; i++) {
                        let item = Player.getContainer().getStackInSlot(i)
                        if (item && item.getID() !== 160) {
                            if (ChatLib.removeFormatting(item.getName()) === closestPlayer.username) {
                                Player.getContainer().click(i)
                                ChatLib.chat("Leaping to " + closestPlayer.username)
                            }
                        }
                    }
                }
            }
        }))
    }

    getClosestPlayerTo(x, y, size, scale, scanX, scanY) {

        let closest = null
        let closestD = Infinity
        Object.keys(this.parentE.parent.mapDataPlayers).forEach((uuid) => {

            if (uuid === Player.getUUID()) return

            let renderX = this.parentE.parent.mapDataPlayers[uuid].x / this.parentE.parent.mapScale / 128 * size//*16/this.roomWidth
            let renderY = this.parentE.parent.mapDataPlayers[uuid].y / this.parentE.parent.mapScale / 128 * size//*16/this.roomWidth

            let distance = (renderX + x + this.parentE.parent.offset[0] / 128 * size - scanX) ** 2 + (renderY + y + this.parentE.parent.offset[1] / 128 * size - scanY) ** 2

            if (distance < closestD) {
                closestD = distance
                closest = this.parentE.parent.mapDataPlayers[uuid]
            }
        })

        return closest
    }
}