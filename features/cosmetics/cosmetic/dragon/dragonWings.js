import { f, m, m } from "../../../../../mappings/mappings.js";
import Cosmetic from "../../cosmetic.js";

const ModelDragon = Java.type("net.minecraft.client.model.ModelDragon")

if(!GlStateManager){
    var GL11 = Java.type("org.lwjgl.opengl.GL11"); //using var so it goes to global scope
    var GlStateManager = Java.type("net.minecraft.client.renderer.GlStateManager");
}
const Essential = Java.type("gg.essential.Essential")
const EssentialCosmeticSlot = Java.type("gg.essential.cosmetics.CosmeticSlot")

const FACING = Java.type("net.minecraft.block.BlockDirectional").field_176387_N
let dragon = new ModelDragon(0) //too lazy to make my own model so i just yoink it from modelDragon lmfao
let textures = {//TODO: dynamicly load textures from server
    classic: new Image(javax.imageio.ImageIO.read(new java.io.File("./config/ChatTriggers/modules/SoopyV2/features/cosmetics/textures/dragon/classic.png"))),
    purple: new Image(javax.imageio.ImageIO.read(new java.io.File("./config/ChatTriggers/modules/SoopyV2/features/cosmetics/textures/dragon/purple.png")))
}
let wing = getField(dragon, f.wing)
let wingTip = getField(dragon, f.wingTip)

class DragonWings extends Cosmetic {
    constructor(player, parent) {
        super(player, parent, "dragon_wings");

        this.animOffset = Math.random()*20*Math.PI
        this.lastRender = Date.now()

        this.lastFlapSound = this.animOffset
        this.i = 0

        this.flying = false
    }

    onRenderEntity(ticks, isInGui){
        
        if(this.player.getPlayer()[m.isInvisibleToPlayer](Player.getPlayer())){
            return
        }

        let thirdPersonView = Client.getMinecraft()[f.gameSettings.Minecraft][f.thirdPersonView]
        if(!this.parent.firstPersonVisable.getValue() && thirdPersonView === 0) return

        let isSelfPlayer = this.player.getUUID().toString() === Player.getUUID().toString()
        let isInInv = isSelfPlayer && ticks === 1

        // return;
        // wing.func_78785_a(1)

        let timeSince = (Date.now()-this.lastRender)/1000
        this.lastRender = Date.now()

        let rotation = isInInv?0:this.player.getPlayer()[f.prevRenderYawOffset]+(this.player.getPlayer()[f.renderYawOffset]-this.player.getPlayer()[f.prevRenderYawOffset])*ticks
        // rotation += entity.field_70761_aq+(entity.field_70761_aq-entity.field_70760_ar)*ticks
        // console.log(rotation, entity.getEntity().field_70761_aq+(entity.getEntity().field_70761_aq-entity.getEntity().field_70760_ar)*ticks)
        let horisontalSpeed = Math.sqrt((this.player.getPlayer()[f.posX.Entity]-this.player.getPlayer()[f.lastTickPosX])**2+(this.player.getPlayer()[f.posZ.Entity]-this.player.getPlayer()[f.lastTickPosZ])**2)

        let verticleSpeed = this.player.getPlayer()[f.posY.Entity]-this.player.getPlayer()[f.lastTickPosY]
        
        this.animOffset += Math.min(1, horisontalSpeed)*10*timeSince+1*timeSince

        let flapAmountMultiplyerNoEnd = 1
        let flapAmountMultiplyer = 1

        let wingEndOffsetThing = 0
        
        flapAmountMultiplyerNoEnd += Math.min(5, (horisontalSpeed*5))
        let flapMainOffsetThing = 0

        let wingBackAmount = 0

        if(this.player.getPlayer()[f.hurtResistantTime] > 15){ //damage tick
            this.animOffset += 15*timeSince
        }


        // if((this.player === Player &&this.player.getPlayer().field_71075_bZ.field_75100_b) || (this.player !== Player && Math.abs(verticleSpeed)<0.2 && !this.player.getPlayer().field_70122_E)){//playerCapabilities.isFlying
        if(this.flying){ //flying
            this.animOffset += 5*timeSince //flap in mid air

            flapAmountMultiplyer *= 1.75 //flap harder

            if(isSelfPlayer && thirdPersonView === 0){
                if(!this.parent.lessFirstPersonVisable.getValue()){
                    flapAmountMultiplyerNoEnd += 0.4
                    flapMainOffsetThing = 0.3
                }
            }else{
                flapAmountMultiplyer *= 1.25
                flapAmountMultiplyer *= 0.9
                flapMainOffsetThing = 0.1
                wingEndOffsetThing+= -0.1
            }

            wingEndOffsetThing += -0.75

            if(verticleSpeed > 0){
                this.animOffset += verticleSpeed*25*timeSince //flap when flying upwards
            }
        }else{
            if(this.lastFlapSound < this.animOffset-this.animOffset%(Math.PI*2)){
                this.lastFlapSound = this.animOffset-this.animOffset%(Math.PI*2)
            }
        }
        if(verticleSpeed < -0.5){
            wingBackAmount = Math.min(1, (verticleSpeed+0.5)*-1.5) //lift wings back further ur falling

            this.animOffset += (verticleSpeed+0.5)*-3*timeSince
        }

        GlStateManager[m.pushMatrix](); // pushMatrix
        Tessellator.colorize(this.settings.color.r, this.settings.color.g, this.settings.color.b);

        if(!isSelfPlayer){
            Tessellator.translate(
                (this.player.getPlayer()[f.lastTickPosX] + (this.player.getPlayer()[f.posX.Entity]-this.player.getPlayer()[f.lastTickPosX]) * ticks) - (Player.getPlayer()[f.lastTickPosX] + (Player.getPlayer()[f.posX.Entity]-Player.getPlayer()[f.lastTickPosX]) * ticks),
                (this.player.getPlayer()[f.lastTickPosY] + (this.player.getPlayer()[f.posY.Entity]-this.player.getPlayer()[f.lastTickPosY]) * ticks) - (Player.getPlayer()[f.lastTickPosY] + (Player.getPlayer()[f.posY.Entity]-Player.getPlayer()[f.lastTickPosY]) * ticks),
                (this.player.getPlayer()[f.lastTickPosZ] + (this.player.getPlayer()[f.posZ.Entity]-this.player.getPlayer()[f.lastTickPosZ]) * ticks) - (Player.getPlayer()[f.lastTickPosZ] + (Player.getPlayer()[f.posZ.Entity]-Player.getPlayer()[f.lastTickPosZ]) * ticks))
        }

        if(textures[this.settings.texture || "classic"]){
            Tessellator.bindTexture(textures[this.settings.texture || "classic"]) //bind texture
        }else{
            Tessellator.bindTexture(textures.classic) //bind default texture (classic)
        }

        if(this.player.getPlayer()[f.ridingEntity.Entity]){
            rotation = this.player.getPlayer()[f.rotationYawHead]+(this.player.getPlayer()[f.rotationYawHead]-this.player.getPlayer()[f.prevRotationYawHead])*ticks
        }
        if(!this.player.getPlayer()[m.isPlayerSleeping]()){  //dont rotate when in bed
            Tessellator.rotate((180-rotation),0,1,0)

            Tessellator.translate(0,1.2,0.1)
    
            if(this.player.getPlayer()[m.isSneaking.Entity]()){ //isSneaking
                Tessellator.translate(0, -0.125,0)
                Tessellator.rotate(-20, 1,0,0)
                
                Tessellator.translate(0, 0,0.1)
                if(isSelfPlayer && thirdPersonView === 0){}else{
                    Tessellator.translate(0, -0.125,0)
                }
            }
    
            if(isSelfPlayer && !isInInv && thirdPersonView === 0){
                //Make wings less scuffed when in first person looking down/up
                Tessellator.translate(0, 0.25, 0.003*(this.player.getPitch()))
            }
        }


        //Higher = more elytra like
        wing[f.rotateAngleY] = 0.25; //rotateAngleY

        let shouldStandingStillWingThing = false

        let changeStandingStillWingThing = 0

        if(horisontalSpeed < 0.01){
            if(!(this.flying)){ //not flying
                let amt = (this.animOffset+Math.PI/2)%(20*Math.PI)
                if(amt < 1*Math.PI){
                    this.animOffset += 2*timeSince*Math.min(1,(amt/(1*Math.PI))*2)

                    flapAmountMultiplyer += (amt/(1*Math.PI))/2
                }else if(amt < 2*Math.PI){
                    this.animOffset += 2*timeSince*Math.min(1,(1-(amt/(1*Math.PI)-1))*2)

                    flapAmountMultiplyer += (1-(amt/(1*Math.PI)-1))/2
                }
            }
            if(this.player.getPlayer()[m.isSneaking.Entity]()){ //isSneaking
                if(this.player.getPlayer()[f.rotationPitch] > 20){
                    shouldStandingStillWingThing = true
                    changeStandingStillWingThing =  Math.max(0,this.player.getPlayer()[f.rotationPitch]/600)
                }
            }
        }

        if(shouldStandingStillWingThing){
            wing[f.rotateAngleY] = 0.25+(changeStandingStillWingThing)*3
        }

        if(this.player.getPlayer()[m.isPlayerSleeping]()){ //player in bed

            try{ //try catch incase no bed at that location
                let facing = World.getWorld().func_180495_p(this.player.getPlayer()[f.playerLocation])[m.getValue.BlockState$StateImplementation](FACING)[m.getHorizontalIndex]() //0-3 is S-W-N-E

                let rotation = 0
                switch(facing){
                    case 0:
                        rotation = 180
                        Tessellator.translate(0, 0,-0.5)
                        break
                    case 1:
                        rotation = 90
                        Tessellator.translate(0.5, 0,0)
                        break
                    case 2:
                        rotation = 0
                        Tessellator.translate(0, 0,0.5)
                        break
                    case 3:
                        rotation = 270
                        Tessellator.translate(-0.5, 0,0)
                        break
                }
                // console.log(rotation)
                // console.log(World.getBlockAt(this.player.getX(), this.player.getY(), this.player.getZ()).getState().func_177229_b(FACING))
                Tessellator.translate(0, 0.75-this.settings.scale*100,0)
                Tessellator.rotate(rotation, 0, 1, 0)

                wing[f.rotateAngleX] = 0; //rotateAngleX

                wing[f.rotateAngleZ] = (-0.5+Math.sin(this.animOffset/5)*0.1)*this.settings.scale*100; //rotateAngleZ

                
                wingTip[f.rotateAngleZ] = -2.20+Math.sin(this.animOffset/5)*0.1
            }catch(e){}
        }else if(wingBackAmount === 0){
            //tilt
            let wing_tilt_offset = -Math.min(0.8, horisontalSpeed*3) //When go faster tilt wing back so its in direction of wind

            
            if(shouldStandingStillWingThing){
                wing_tilt_offset += (changeStandingStillWingThing)*4
            }

            wing[f.rotateAngleX] = 0.75 - Math.cos(this.animOffset) * 0.2+wing_tilt_offset; //rotateAngleX


            let wing_goback_amount = 0.15/(Math.min(1, horisontalSpeed)*3+0.25)
            let temp_wing_thing = 1

            if(shouldStandingStillWingThing){
                wing_goback_amount /= 1+(changeStandingStillWingThing)/50
                flapAmountMultiplyer /= 1+(changeStandingStillWingThing)/50

                temp_wing_thing += changeStandingStillWingThing*50
            }

            let temp_horis_wingthing = 0
            if(shouldStandingStillWingThing){
                temp_horis_wingthing = -(changeStandingStillWingThing)*0.75
            }

            wing[f.rotateAngleZ] = (Math.sin(this.animOffset)/temp_wing_thing + 0.125) * wing_goback_amount*(1+(flapAmountMultiplyer-1)*1)*flapAmountMultiplyerNoEnd -0.4-wing_tilt_offset/3+temp_horis_wingthing+flapMainOffsetThing; //rotateAngleZ

            
            wingTip[f.rotateAngleZ] = -((Math.sin((this.animOffset+1.5+(1-temp_wing_thing)/8.5))/(1+(temp_wing_thing-1)/3) + 0.5)) * 0.75*(1+(flapAmountMultiplyer-1)*1)/(1+temp_horis_wingthing) -  (1-flapAmountMultiplyer)*2-(1-temp_wing_thing)/10+wingEndOffsetThing; //rotateAngleZ
        }else{
            //tilt
            let wing_tilt_offset = -Math.min(0.8, horisontalSpeed*3) //When go faster tilt wing back so its in direction of wind
            wing[f.rotateAngleX] = 0.75 - Math.cos(this.animOffset) * 0.2+wing_tilt_offset-wingBackAmount/2; //rotateAngleX


            wing[f.rotateAngleZ] = -wingBackAmount; //rotateAngleZ

            
            wingTip[f.rotateAngleZ] = -((Math.sin((this.animOffset))*0.5 + 0.3))
        }
        
        GlStateManager[m.disableCull]() //disable culling

        let wing_center_dist = ((0-Math.log(1000*this.settings.scale+0.01)-2)-100000*this.settings.scale*this.settings.scale)/1000

        // GL11.glDepthMask(GL11.GL_FALSE);
        Tessellator.translate(-wing_center_dist, 0, 0)
        Tessellator.scale(this.settings.scale, this.settings.scale, this.settings.scale)
        wing[m.renderWithRotation](1) //render left wing

        Tessellator.translate(2*wing_center_dist/this.settings.scale, 0, 0)
        Tessellator.scale(-1, 1, 1)
        wing[m.renderWithRotation](1) //render right wing
        

        if(this.player.getPlayer()[f.hurtTime] > 0){ //damage tick
            GlStateManager[m.pushMatrix](); // pushMatrix
            GlStateManager[m.depthFunc](514);
            GlStateManager[m.disableTexture2D]();
            GlStateManager[m.enableBlend]();
            GlStateManager[m.blendFunc](770, 771);
            GlStateManager.func_179131_c(1, 0, 0, 0.25); //m.color.glstatemanager.ffff
            
            Tessellator.scale(-1, 1, 1)
            Tessellator.translate(-2*wing_center_dist/this.settings.scale, 0, 0)
            wing[m.renderWithRotation](1) //render left wing

            Tessellator.translate(2*wing_center_dist/this.settings.scale, 0, 0)
            Tessellator.scale(-1, 1, 1)
            wing[m.renderWithRotation](1) //render right wing

            GlStateManager[m.enableTexture2D]();
            GlStateManager[m.disableBlend]();
            GlStateManager[m.depthFunc](515);
            GlStateManager[m.popMatrix](); // popMatrix
        }
        Tessellator.colorize(1, 1, 1)
        GlStateManager[m.enableCull]() //enable culling
        GlStateManager[m.popMatrix](); // popMatrix
    }

    testPlaySound(){
        if(this.player.getPlayer()[m.isInvisibleToPlayer](Player.getPlayer())){
            return
        }

        let horisontalSpeed = Math.sqrt((this.player.getPlayer()[f.posX.Entity]-this.player.getPlayer()[f.lastTickPosX])**2+(this.player.getPlayer()[f.posZ.Entity]-this.player.getPlayer()[f.lastTickPosZ])**2)
        let verticleSpeed = this.player.getPlayer()[f.posY.Entity]-this.player.getPlayer()[f.lastTickPosY]


        // if((this.player === Player &&this.player.getPlayer().field_71075_bZ.field_75100_b) || (this.player !== Player && Math.abs(verticleSpeed)<0.2 && !this.player.getPlayer().field_70122_E)){//playerCapabilities.isFlying
        if(this.flying){ //flying
            
            if(this.animOffset-this.lastFlapSound > 2*Math.PI){

                let dist = Math.sqrt((Player.getX()-this.player.getX())**2+(Player.getY()-this.player.getY())**2+(Player.getZ()-this.player.getZ())**2)+1

                World.playSound("mob.enderdragon.wings", (this.settings.scale*15)*Math.min(1, 50/(dist*dist)), 1)
                this.lastFlapSound = this.animOffset-this.animOffset%(Math.PI*2)
            }
        }

        if(horisontalSpeed < 0.01){
            if(!(this.flying)){ //not flying
                let amt = (this.animOffset+Math.PI/2)%(20*Math.PI)
                if(amt < 1*Math.PI){
                    if(amt > 0.65*Math.PI && (2*Math.PI+this.animOffset)-this.lastFlapSound > 2*Math.PI){
        
                        let dist = Math.sqrt((Player.getX()-this.player.getX())**2+(Player.getY()-this.player.getY())**2+(Player.getZ()-this.player.getZ())**2)+1
        
                        World.playSound("mob.enderdragon.wings", (Math.max(0.005,this.settings.scale-0.005)*25)*Math.min(1, 50/Math.min(1,dist*dist))/50, 1-(Math.max(0.005,this.settings.scale-0.005)*25))
                        this.lastFlapSound = 2*Math.PI+(this.animOffset)-this.animOffset%(Math.PI*2)
                    }
                }
            }
        }
    }

    onTick(){

        this.updateIfNotRendering()

        this.testPlaySound()

        if(!this.player.getPlayer().getEssentialCosmetics()) return

        let wingCosmetic = this.player.getPlayer().getEssentialCosmetics().get(EssentialCosmeticSlot.WINGS)
        if(wingCosmetic !== null){
            this.player.getPlayer().getEssentialCosmeticModels().get(Essential.instance.getConnectionManager().getCosmeticsManager().getCosmetic(wingCosmetic)).getModel().getModel().boneList.forEach(b=>{
                b.isHidden = true
                this.parent.hiddenEssentialCosmetics.push(b)
            })
        }else{
            let fullBodyCosmetic = this.player.getPlayer().getEssentialCosmetics().get(EssentialCosmeticSlot.FULL_BODY)
            if(fullBodyCosmetic === "DRAGON_ONESIE_2"){
                this.player.getPlayer().getEssentialCosmeticModels().get(Essential.instance.getConnectionManager().getCosmeticsManager().getCosmetic(fullBodyCosmetic)).getModel().getModel().boneList.forEach(b=>{
                    if(b.boxName === "wing_left_1" || b.boxName === "wing_right_1"){
                        b.isHidden = true
                        
                        this.parent.hiddenEssentialCosmetics.push(b)
                    }
                })
            }
        }
    }

    updateIfNotRendering(){
        let verticleSpeed = this.player.getPlayer()[f.posY.Entity]-this.player.getPlayer()[f.lastTickPosY]

        this.flying = (verticleSpeed>-0.2) && !this.player.getPlayer()[f.onGround.Entity]

        let timeSince = (Date.now()-this.lastRender)/1000

        if(timeSince < 0.020){
            return
        }

        this.lastRender = Date.now()

        let horisontalSpeed = Math.sqrt((this.player.getPlayer()[f.posX.Entity]-this.player.getPlayer()[f.lastTickPosX])**2+(this.player.getPlayer()[f.posZ.Entity]-this.player.getPlayer()[f.lastTickPosZ])**2)

        
        this.animOffset += Math.min(1, horisontalSpeed)*10*timeSince+1*timeSince

        if(this.player.getPlayer()[f.hurtResistantTime] > 0){ //damage tick
            this.animOffset += 5*timeSince
        }


        // if((this.player === Player &&this.player.getPlayer().field_71075_bZ.field_75100_b) || (this.player !== Player && Math.abs(verticleSpeed)<0.2 && !this.player.getPlayer().field_70122_E)){//playerCapabilities.isFlying
        if(this.flying){ //flying
            this.animOffset += 5*timeSince //flap in mid air

            if(verticleSpeed > 0){
                this.animOffset += verticleSpeed*25*timeSince //flap when flying upwards
            }
        }
        if(verticleSpeed < -0.5){
            this.animOffset += (verticleSpeed+0.5)*-3*timeSince
        }

        if(horisontalSpeed < 0.01){
            if(!(this.flying)){ //not flying
                let amt = (this.animOffset+Math.PI/2)%(20*Math.PI)
                if(amt < 1*Math.PI){
                    this.animOffset += 2*timeSince*Math.min(1,(amt/(1*Math.PI))*2)
                }else if(amt < 2*Math.PI){
                    this.animOffset += 2*timeSince*Math.min(1,(1-(amt/(1*Math.PI)-1))*2)
                }
            }
        }
    }
}

export default DragonWings;


function getField(e, field){
    
    let field2 = e.class.getDeclaredField(field);
            
    field2.setAccessible(true)

    return field2.get(e)
}