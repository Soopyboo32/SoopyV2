import { f, m } from "../../../../../../../mappings/mappings.js";
import Pet from "../pet.js";
import renderLibs from "../../../../../../../guimanager/renderLibs.js";
import { drawBoxAtBlock } from "../../../../../utils/renderUtils.js";
import { basiclyEqual } from "../../../../../utils/numberUtils.js";
import TRAVELING_TO_POSITION from "./AiStateHandlers/TRAVELING_TO_POSITION.js";
import { AI_STATE, ANIMATION_STATE } from "./states.js";
import STANDING from "./AiStateHandlers/STANDING.js";

const ModelDragon = Java.type("net.minecraft.client.model.ModelDragon")

let dragon = new ModelDragon(0) //too lazy to make my own model so i just yoink it from modelDragon lmfao
let textures = new Map()
let loadingTextures = new Set()
function loadTexture(id) {
    new Thread(() => {
        loadingTextures.add(id)
        textures.set(id, renderLibs.getImage("https://soopy.dev/api/soopyv2/textures/cosmetic/pet/dragon/" + id + "/img.png", true))
    }).start()
}
loadTexture("classic")

let head = getField(dragon, f.head.ModelDragon);
let spine = getField(dragon, f.spine);
let jaw = getField(dragon, f.jaw);
let body = getField(dragon, f.body.ModelDragon);
let rearLeg = getField(dragon, f.rearLeg);
let frontLeg = getField(dragon, f.frontLeg);
let rearLegTip = getField(dragon, f.rearLegTip)
let frontLegTip = getField(dragon, f.frontLegTip)
let rearFoot = getField(dragon, f.rearFoot);
let frontFoot = getField(dragon, f.frontFoot);
let wing = getField(dragon, f.wing);
let wingTip = getField(dragon, f.wingTip);

class DragonPet extends Pet {
    constructor(player, parent) {
        super(player, parent, "dragon")

        this.x = this.lastX = player.getX()
        this.y = this.lastY = player.getY()
        this.z = this.lastZ = player.getZ()

        this.lastPositions = []

        this.yaw = this.lastYaw = player.getYaw()

        this.aiState = AI_STATE.STANDING

        this.travelToPosition = undefined

        this.nextIsFlip = false

        this.ticks = 0

        if (!textures.has(this.settings.texture) && !loadingTextures.has(this.settings.texture)) {
            loadTexture(this.settings.texture)
        }
    }

    onRenderEntity(ticks, isInGui) {
        if (isInGui) return

        this.render(ticks, this.settings.scale)
    }

    onCommand(option, ...args) {
        if (!option) {
            ChatLib.chat("valid options: 'flip' 'come'")
            return
        }
        if (option === 'come') {
            this.travelToPosition = [Player.getX(), Player.getY(), Player.getZ()]
            this.aiState = AI_STATE.TRAVELING_TO_POSITION

            ChatLib.chat("derg pet coming to current location!")
            return
        }
        if (option === "goto") {
            let [x, y, z] = args

            this.travelToPosition = [parseFloat(x), parseFloat(y), parseFloat(z)]
            this.aiState = AI_STATE.TRAVELING_TO_POSITION


            ChatLib.chat("derg pet going to " + this.travelToPosition.join(", ") + "!")
        }
        if (option === 'flip') {
            this.nextIsFlip = true
            ChatLib.chat("flip!")
            return
        }
        ChatLib.chat("unknown option!")
        // this.state = 0
        // this.sendCosmeticsData([0])
        // ChatLib.chat("Set wing pose to default")
    }

    render(ticks, scale) {
        if (!textures.has("classic")) return
        if (textures.get(this.settings.texture || "classic")) {

            Tessellator.bindTexture(textures.get(this.settings.texture || "classic")) //bind texture
        } else {
            Tessellator.bindTexture(textures.get("classic")) //bind default texture (classic)
        }

        let modelScale = 0.03

        // drawBoxAtBlock(this.getX(), this.getY(), this.getZ(), 255, 0, 0)

        GlStateManager[m.pushMatrix]();

        Tessellator.translate(
            this.getX() - (Player.getPlayer()[f.lastTickPosX] + (Player.getPlayer()[f.posX.Entity] - Player.getPlayer()[f.lastTickPosX]) * ticks),
            this.getY() - (Player.getPlayer()[f.lastTickPosY] + (Player.getPlayer()[f.posY.Entity] - Player.getPlayer()[f.lastTickPosY]) * ticks),
            this.getZ() - (Player.getPlayer()[f.lastTickPosZ] + (Player.getPlayer()[f.posZ.Entity] - Player.getPlayer()[f.lastTickPosZ]) * ticks))

        GlStateManager[m.scale](scale, -scale, scale);
        Tessellator.rotate(this.getYaw(), 0, 1, 0)
        if (this.state === ANIMATION_STATE.FLIPPING) {
            Tessellator.translate(0, -4 * Math.sin(this.getAnimationProg() * Math.PI), 0)
            Tessellator.rotate(this.getAnimationProg() * 360, 1, 0, 0)
        }
        GlStateManager[m.disableCull]();

        GlStateManager[m.enableBlend]()

        GlStateManager[m.enableRescaleNormal]();
        GlStateManager[m.pushMatrix]();
        // EntityDragon entityDragon = (EntityDragon)entityIn;
        let animationSpeedMultiplier = 1
        if (this.state === ANIMATION_STATE.STANDING) animationSpeedMultiplier *= 0.1
        let animation_progress = -(animationSpeedMultiplier * Date.now() / 1000) % 1

        let wingAnimSpeed = 1
        if (this.state === ANIMATION_STATE.STANDING) wingAnimSpeed = 0.1
        let wingAnimDistance = wingAnimSpeed
        let wing_animation_progress = -wingAnimSpeed * (Date.now() / 1000) % 1

        jaw[f.rotateAngleX] = wingAnimSpeed * (Math.sin((animation_progress * Math.PI * 2.0)) + 1.0) * 0.2;

        let l = (Math.sin((animation_progress * Math.PI * 2.0 - 1.0)) + 1.0);
        l = (l * l * 1.0 + l * 2.0) * 0.05;
        if (this.state === ANIMATION_STATE.STANDING) l *= 0.1

        GlStateManager[m.translate](0.0, l - 2.0, -3.0);
        GlStateManager[m.rotate.GlStateManager](l * 2.0, 1.0, 0.0, 0.0);

        let spine_xrot = 0.0;
        let spine_rotation_scale = 1.5;

        let ds = this.getMovementOffsets(6, ticks);

        let p = this.updateRotations(this.getMovementOffsets(5, ticks)[0] - this.getMovementOffsets(10, this.partialTicks)[0])
        let unknown_animation_progress = this.updateRotations(this.getMovementOffsets(5, ticks)[0] + (p / 2.0));

        let spine_animation_cycle = animation_progress * Math.PI * 2.0;
        let m2 = 20.0;
        let s = -12.0;

        for (let t = 0; t < 5; t++) {
            let es = this.getMovementOffsets(5 - t, ticks);
            let body_spine_animation_progress = Math.cos((t * 0.45 + spine_animation_cycle)) * 0.15;

            spine[f.rotateAngleY] = this.updateRotations(es[0] - ds[0]) * Math.PI / 180.0 * spine_rotation_scale;
            spine[f.rotateAngleX] = body_spine_animation_progress + (es[1] - ds[1]) * Math.PI / 180.0 * spine_rotation_scale * 5.0;
            spine[f.rotateAngleZ] = -this.updateRotations(es[0] - unknown_animation_progress) * Math.PI / 180.0 * spine_rotation_scale;
            spine[f.rotationPointY] = m2;
            spine[f.rotationPointZ] = s;
            spine[f.rotationPointX] = spine_xrot;
            m2 = (m2 + Math.sin(spine[f.rotateAngleX]) * 10.0);
            s = (s - Math.cos(spine[f.rotateAngleY]) * Math.cos(spine[f.rotateAngleX]) * 10.0);
            spine_xrot = (spine_xrot - Math.sin(spine[f.rotateAngleY]) * Math.cos(spine[f.rotateAngleX]) * 10.0);
            spine[m.render.ModelRenderer](modelScale);
        }

        head[f.rotationPointY] = m2;
        head[f.rotationPointZ] = s;
        head[f.rotationPointX] = spine_xrot;
        let fs = this.getMovementOffsets(0, ticks);
        head[f.rotateAngleY] = this.updateRotations(fs[0] - ds[0]) * Math.PI / 180.0 * 1.0;
        head[f.rotateAngleZ] = -this.updateRotations(fs[0] - unknown_animation_progress) * Math.PI / 180.0 * 1.0;
        head[m.render.ModelRenderer](modelScale);
        GlStateManager[m.pushMatrix]();
        // GlStateManager[m.translate](0.0, 1.0, 0.0);
        // GlStateManager[m.rotate.GlStateManager](-p * o * 1.0, 0.0, 0.0, 1.0);
        // GlStateManager[m.translate](0.0, -1.0, 0.0);
        body[f.rotateAngleZ] = 0.0;
        body[m.render.ModelRenderer](modelScale);

        for (let v = 0; v < 2; ++v) {
            let tempThing = 0
            if (this.state === ANIMATION_STATE.STANDING) tempThing = 1

            let flap_animation_cycle = wing_animation_progress * Math.PI * 2.0;
            wing[f.rotateAngleX] = 0.125 - Math.cos(flap_animation_cycle) * 0.2;
            wing[f.rotateAngleY] = 0.25;
            wing[f.rotateAngleZ] = (Math.sin(flap_animation_cycle) + 0.125) * 0.8 * wingAnimDistance + 0.3 * tempThing;

            wingTip[f.rotateAngleZ] = -((Math.sin((flap_animation_cycle + 2.25)) + 0.5) * wingAnimDistance) * 0.75 + 0.3 - 0.5 * tempThing;

            rearLeg[f.rotateAngleX] = 1.0 + l * 0.1;
            rearLegTip[f.rotateAngleX] = 0.5 + l * 0.1;

            rearFoot[f.rotateAngleX] = 0.75 + l * 0.1;
            frontLeg[f.rotateAngleX] = 1.3 + l * 0.1;
            frontLegTip[f.rotateAngleX] = -0.5 - l * 0.1;
            frontFoot[f.rotateAngleX] = 0.75 + l * 0.1;
            wing[m.render.ModelRenderer](modelScale);
            frontLeg[m.render.ModelRenderer](modelScale);
            rearLeg[m.render.ModelRenderer](modelScale);
            GlStateManager[m.scale](-1.0, 1.0, 1.0);
        }

        GlStateManager[m.popMatrix]();
        // GlStateManager[m.cullFace](1029);
        // GlStateManager[m.disableCull]();
        let spine_animation_progress = -(Math.sin(animation_progress * Math.PI * 2.0)) * 0.0;
        spine_animation_cycle = animation_progress * Math.PI * 2.0;
        m2 = 10.0;
        s = 60.0;
        spine_xrot = 0.0;
        ds = this.getMovementOffsets(11, ticks);

        //fs and ds -> current/last position

        for (let x = 0; x < 12; ++x) {
            fs = this.getMovementOffsets(12 + x, ticks);
            spine_animation_progress = (spine_animation_progress + Math.sin((x * 0.45 + spine_animation_cycle)) * 0.05000000074505806);
            spine[f.rotateAngleY] = (this.updateRotations(fs[0] - ds[0]) * spine_rotation_scale + 180.0) * Math.PI / 180.0;
            spine[f.rotateAngleX] = spine_animation_progress + (fs[1] - ds[1]) * Math.PI / 180.0 * spine_rotation_scale * 5.0;
            spine[f.rotateAngleZ] = this.updateRotations(fs[0] - unknown_animation_progress) * Math.PI / 180.0 * spine_rotation_scale;
            spine[f.rotationPointY] = m2;
            spine[f.rotationPointZ] = s;
            spine[f.rotationPointX] = spine_xrot;
            m2 = (m2 + Math.sin(spine[f.rotateAngleX]) * 10.0);
            s = (s - Math.cos(spine[f.rotateAngleY]) * Math.cos(spine[f.rotateAngleX]) * 10.0);
            spine_xrot = (spine_xrot - Math.sin(spine[f.rotateAngleY]) * Math.cos(spine[f.rotateAngleX]) * 10.0);
            spine[m.render.ModelRenderer](modelScale);
        }

        GlStateManager[m.popMatrix]();
        GlStateManager[m.disableBlend]()
        GlStateManager[m.popMatrix]();
    }

    updateRotations(d) {
        d = d % 360

        while (d >= 180.0) {
            d -= 360.0;
        }

        while (d < -180.0) {
            d += 360.0;
        }

        return d
    }

    getMovementOffsets(dist, ticks) {
        return this.lastPositions[dist] ? [this.getX() - this.lastPositions[dist][0], this.getY() - this.lastPositions[dist][1]] : [0, 0] //TODO: smooth using ticks
    }

    onTick() {
        this.lastPositions.push([this.getX(), this.getZ()])
        if (this.lastPositions.length > 64) this.lastPositions.shift()

        if (!this.isSelfPlayer) return

        this.ticks++
        if (this.ticks % 5 !== 0) return
        this.preUpdate()

        // if (this.aiState === AI_STATE.FLIPPING) {
        //     this.aiState = AI_STATE.STANDING
        // }

        /*
        //Distance multiplier for stuff like radius to stay to owner
        //This exists to that if a pet is super massive it wont be always inside of the owner
        let distMult = 2 * Math.sqrt(this.settings.scale)
        distMult = Math.max(0.5, distMult)
        */

        switch (this.aiState) {
            case AI_STATE.TRAVELING_TO_POSITION:
                TRAVELING_TO_POSITION(this)
                break;
            case AI_STATE.STANDING:
                STANDING(this)
                break;
        }

        /* //TODO: recode all this but using better state manager D:

        let horisontalDistanceToOwner = this.getDistanceTo(this.player.getX(), this.player.getZ())
        let verticleDistanceToOwner = Math.abs(this.player.getY() - this.y)

        if (verticleDistanceToOwner > 5 * distMult) {
            this.aiState = AI_STATE.TRAVELING_TO_OWNER

            let speed = Math.min(2, (verticleDistanceToOwner - 4) / 5)
            if (this.player.getY() > this.y) {
                this.y += speed
            } else {
                this.y -= speed
            }
        } else if (horisontalDistanceToOwner < 20 * distMult) {
            let distToGround = -1
            for (let i = 0; i < 6 * distMult; i += 0.1) {
                if (!World.getBlockAt(this.x, this.y - i, this.z).getType().isTranslucent()) {
                    distToGround = i
                    break;
                }
            }

            if (distToGround <= 5 * distMult && distToGround > 0.1 && this.player.getY() - this.y + distToGround < 5 * distMult) {
                this.y = Math.round(this.y - 1) - this.settings.scale / 4
            }
        }
        if (!World.getBlockAt(this.x, this.y, this.z).getType().isTranslucent()) this.y = Math.round(this.y + 1)

        if (horisontalDistanceToOwner > 10 * distMult) {
            this.aiState = AI_STATE.TRAVELING_TO_OWNER
        }
        if (horisontalDistanceToOwner > 1000) {
            this.x = this.player.getX()
            this.z = this.player.getZ()
        }
        if (this.aiState === AI_STATE.TRAVELING_TO_OWNER) {
            if (horisontalDistanceToOwner > 5 * distMult) {
                let xSpeed = (this.player.getX() - this.x) / 5
                let zSpeed = (this.player.getZ() - this.z) / 5

                this.x += xSpeed
                this.z += zSpeed

                this.yaw = yawToOwner
            } else {
                this.aiState = AI_STATE.FLYING
            }
        }
        if (this.aiState === AI_STATE.FLYING && !World.getBlockAt(this.x, this.y - 1, this.z).getType().isTranslucent()) {
            this.aiState = AI_STATE.STANDING
        }

        if (this.nextIsFlip) {
            this.aiState = AI_STATE.FLIPPING
            this.nextIsFlip = false
        }
        */

        this.postUpdate()

        // this.sendCosmeticsData([this.x, this.y, this.z, this.yaw, this.aiState, this.state])
    }
}
/**
 * @exports 
 * @type {DragonPet}
 */
export default DragonPet;

function getField(e, field) {

    let field2 = e.class.getDeclaredField(field);

    field2.setAccessible(true)

    return field2.get(e)
}