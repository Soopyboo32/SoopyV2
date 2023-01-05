import renderLibs from "../../../../../guimanager/renderLibs.js";
import { f, m } from "../../../../../mappings/mappings.js";
import ToggleSetting from "../../../settings/settingThings/toggle.js";
import Cosmetic from "../../cosmetic.js";

const ModelDragon = Java.type("net.minecraft.client.model.ModelDragon")

if (!GlStateManager) {
    // var GL11 = Java.type("org.lwjgl.opengl.GL11"); //using var so it goes to global scope
    var GlStateManager = Java.type("net.minecraft.client.renderer.GlStateManager");
}
const Essential = Java.type("gg.essential.Essential")
const EssentialCosmeticSlot = Java.type("gg.essential.mod.cosmetics.CosmeticSlot")
const EssentialBone = Java.type("gg.essential.model.Bone")

let dragon = new ModelDragon(0) //too lazy to make my own model so i just yoink it from modelDragon lmfao
let textures = new Map()
let loadingTextures = new Set()
function loadTexture(id) {
    new Thread(() => {
        loadingTextures.add(id)
        textures.set(id, renderLibs.getImage("https://soopy.dev/api/soopyv2/textures/cosmetic/tail/" + id + "/img.png", true))
    }).start()
}
loadTexture("classic")
let wing = getField(dragon, f.wing)
let wingTip = getField(dragon, f.wingTip)

class Tail extends Cosmetic {
    constructor(player, parent) {
        super(player, parent, "tail");

        this.animOffset = Math.random() * 20 * Math.PI
        this.lastRender = Date.now()

        this.state = 0

        this.ticks = 0

        if (!textures.has(this.settings.texture) && !loadingTextures.has(this.settings.texture)) {
            loadTexture(this.settings.texture)
        }
    }

    onCosmeticMessage(data) {
        this.state = data[0]
    }

    onRenderEntity(ticks, isInGui) {
        if (this.player.getPlayer()[m.isInvisibleToPlayer](Player.getPlayer()) || this.player.getPlayer()[m.isInvisible]()) {
            return
        }
        if (!textures.has("classic")) return

        let isSelfPlayer = this.isSelfPlayer
        let isInInv = isSelfPlayer && ticks === 1
        let thirdPersonView = Client.getMinecraft()[f.gameSettings.Minecraft][f.thirdPersonView]

        if (!this.parent.firstPersonVisable.getValue() && thirdPersonView === 0 && isSelfPlayer && !isInInv) return

        // return;
        // wing.func_78785_a(1)

        let timeSince = (Date.now() - this.lastRender) / 1000
        this.lastRender = Date.now()

        let rotation = isInInv ? 0 : this.player.getPlayer()[f.prevRenderYawOffset] + (this.player.getPlayer()[f.renderYawOffset] - this.player.getPlayer()[f.prevRenderYawOffset]) * ticks

        this.animOffset += 1 * timeSince


        GlStateManager[m.pushMatrix](); // pushMatrix
        GlStateManager[m.enableBlend]()
        Tessellator.colorize(this.settings.color.r, this.settings.color.g, this.settings.color.b);

        if (!isSelfPlayer) {
            Tessellator.translate(
                (this.player.getPlayer()[f.lastTickPosX] + (this.player.getPlayer()[f.posX.Entity] - this.player.getPlayer()[f.lastTickPosX]) * ticks) - (Player.getPlayer()[f.lastTickPosX] + (Player.getPlayer()[f.posX.Entity] - Player.getPlayer()[f.lastTickPosX]) * ticks),
                (this.player.getPlayer()[f.lastTickPosY] + (this.player.getPlayer()[f.posY.Entity] - this.player.getPlayer()[f.lastTickPosY]) * ticks) - (Player.getPlayer()[f.lastTickPosY] + (Player.getPlayer()[f.posY.Entity] - Player.getPlayer()[f.lastTickPosY]) * ticks),
                (this.player.getPlayer()[f.lastTickPosZ] + (this.player.getPlayer()[f.posZ.Entity] - this.player.getPlayer()[f.lastTickPosZ]) * ticks) - (Player.getPlayer()[f.lastTickPosZ] + (Player.getPlayer()[f.posZ.Entity] - Player.getPlayer()[f.lastTickPosZ]) * ticks))
        }

        if (textures.get(this.settings.texture || "classic")) {
            Tessellator.bindTexture(textures.get(this.settings.texture || "classic")) //bind texture
        } else {
            Tessellator.bindTexture(textures.get("classic")) //bind default texture (classic)
        }

        if (this.player.getPlayer()[f.ridingEntity.Entity]) {
            rotation = this.player.getPlayer()[f.rotationYawHead] + (this.player.getPlayer()[f.rotationYawHead] - this.player.getPlayer()[f.prevRotationYawHead]) * ticks
        }


        GlStateManager[m.disableCull]() //disable culling
        Tessellator.scale(this.settings.scale, this.settings.scale, this.settings.scale)

        wing[m.renderWithRotation](1) //render left wing
        wing[f.rotateAngleX] = a
        wing[f.rotateAngleZ] = b
        wingTip[f.rotateAngleZ] = c


        Tessellator.colorize(1, 1, 1)
        GlStateManager[m.enableCull]() //enable culling

        GlStateManager[m.disableBlend]()
        GlStateManager[m.popMatrix](); // popMatrix
    }

    onCommand() {
    }

    onTick() {
        this.ticks++
        if (this.ticks % 20 === 0) {
            this.sendCosmeticsData([this.state])
        }
    }

    removeEssentialCosmetics() {
        if (!this.player.getPlayer() || !this.player.getPlayer().getCosmeticsState || !this.player.getPlayer().getCosmeticsState() || !this.player.getPlayer().getCosmeticsState().getCosmetics || !this.player.getPlayer().getCosmeticsState().getCosmetics()) return
        //player.()

        let fullBodyCosmetic = this.player.getPlayer().getCosmeticsState().getCosmetics().get(EssentialCosmeticSlot.FULL_BODY)
        if (fullBodyCosmetic) {
            let cosmetic = this.player.getPlayer().getCosmeticsState().getModels().get(Essential.instance.getConnectionManager().getCosmeticsManager().getCosmetic(fullBodyCosmetic))
            if (cosmetic) {
                let model = cosmetic.getModel().getModel()

                let bones = model.getBones(model.getRootBone())

                bones.forEach(b => {
                    if (b.boxName.startsWith("tail_")) {
                        setField(b, "showModel", false)

                        this.parent.hiddenEssentialCosmetics.push(b)
                    }
                })
            }
        }
    }
}

export default Tail;


function getField(e, field) {

    let field2 = e.class.getDeclaredField(field);

    field2.setAccessible(true)

    return field2.get(e)
}

function setField(e, field, value) {

    let field2 = e.class.getDeclaredField(field);

    field2.setAccessible(true)

    return field2.set(e, value)
}
let a = 0
let b = 0
let c = 0
register("command", (v) => {
    a = parseFloat(v)
}).setName("seta", true)
register("command", (v) => {
    b = parseFloat(v)
}).setName("setb", true)
register("command", (v) => {
    c = parseFloat(v)
}).setName("setc", true)