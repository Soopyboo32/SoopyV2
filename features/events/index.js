/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import Feature from "../../featureClass/class";
import { drawBoxAtBlock, drawBoxAtBlockNotVisThruWalls, drawLine } from "../../utils/renderUtils";
import { calculateDistance, calculateDistanceQuick, fastestPathThrough } from "../../utils/utils";
import HudTextElement from "../hud/HudTextElement";
import LocationSetting from "../settings/settingThings/location";
import ToggleSetting from "../settings/settingThings/toggle";

class Events extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.burrialData = {
            points: [],
            locations: [],
            historicalLocations: []
        }
        this.lastRequestTime = 0
        this.nextUpdateApprox = -1
        this.lastRequest = 0
        this.potentialParticleLocs = {}
        this.showingWaypoints = false
        this.lastPath = []
        this.updatingPath = false
        this.hudElements = []
        this.lastPathCords = undefined

        this.burrialWaypointsEnabled = new ToggleSetting("Burrial waypoints", "Show waypoints for burrials during the diana event", true, "burrial_waypoints", this)
        this.burrialWaypointsPath = new ToggleSetting("Pathfind waypoints", "Calculate a path thru all the waypoints", true, "burrial_waypoints_path", this).requires(this.burrialWaypointsEnabled)
        this.burrialWaypointsNearest = new ToggleSetting("Show nearest using pathfinding", "Use pathfinding to highlight the next burrial instead of disance", true, "burrial_nearest_path", this).requires(this.burrialWaypointsEnabled)

        this.updateTimerEnabled = new ToggleSetting("Show API update timer", "Shows a countdown till the burrial waypoints will be next updated", true, "burrial_timer", this).requires(this.burrialWaypointsEnabled)
        this.updateTimer = new HudTextElement()
            .setToggleSetting(this.updateTimerEnabled)
            .setLocationSetting(new LocationSetting("Timer Location", "Allows you to edit the location of the timer", "burrial_timer_location", this, [10, 50, 1, 1])
                .requires(this.burrialWaypointsEnabled)
                .editTempText("&6Update&7> &f100s"))
        this.hudElements.push(this.updateTimer)
        
        
        this.registerEvent("worldLoad", this.worldLoad)
        this.registerEvent("spawnParticle", this.spawnParticle)
        this.registerEvent("renderWorld", this.renderWorld)
        this.registerEvent("renderOverlay", this.renderOverlay)
        this.registerStep(true, 2, this.step)
        this.registerStep(false, 5, this.step_5s)
        this.registerSoopy("apiLoad", this.apiLoad)

        this.registerChat("&r&eYou dug out a Griffin Burrow! &r&7(${*}/4)&r", this.burrialClicked)
        this.registerChat("&r&eYou finished the Griffin burrow chain! &r&7(4/4)&r", this.burrialClicked)
    }

    renderOverlay(){
        for(let element of this.hudElements){
            element.render()
        }
    }

    renderWorld(ticks){
        if(this.showingWaypoints && this.lastPathCords && this.burrialWaypointsPath.getValue()){
            let startPoint = [Player.getPlayer().field_70142_S+Player.getPlayer().field_70159_w*ticks,
                Player.getPlayer().field_70137_T+Player.getPlayer().field_70181_x*ticks,
                Player.getPlayer().field_70136_U+Player.getPlayer().field_70179_y*ticks]
    
            let lastPoint = startPoint || [0,0,0]
    
            this.lastPathCords.forEach((point)=>{
                drawLine(...lastPoint,...point,255,255,0)
    
                lastPoint = point
            })
        }	
        if(this.showingWaypoints){
            this.burrialData.locations.forEach((loc,i)=>{

                let typeReplace = [
                    "Start",
                    "Mob",
                    "Treasure",
                    "Finish",
                    "Unknown"
                ]
                if(!loc.clicked){
                    blue = false
                    if(loc.lastPing && Date.now()-loc.lastPing < 500){
                        blue = true
                    }
                    drawBoxAtBlock(loc.x, loc.y,loc.z,0,blue?100:255,blue?255:0)
                }
                if(loc.fromApi){
                    Tessellator.drawString(
                        "(" + (loc.chain+1) + "/4) " + typeReplace[loc.type] + " BURRIAL (" + Math.round(calculateDistance([Player.getX(),Player.getY(),Player.getZ()],[loc.x+0.5,loc.y+2.5,loc.z+0.5])) + "m)",
                        loc.x+0.5,
                        loc.y+1.5,
                        loc.z+0.5,
                        loc.clicked? 65280:(loc.nearest?16711680:6579300), true, loc.clicked? 0.04:(loc.nearest?1:0.5), !loc.clicked
                    );
                }else{
                    Tessellator.drawString(
                        typeReplace[loc.type] + " BURRIAL (" + Math.round(calculateDistance([Player.getX(),Player.getY(),Player.getZ()],[loc.x+0.5,loc.y+2.5,loc.z+0.5])) + "m)",
                        loc.x+0.5,
                        loc.y+1.5,
                        loc.z+0.5,
                        loc.clicked? 65280:(loc.nearest?16711680:6579300), true, loc.clicked? 0.04:(loc.nearest?1:0.5), !loc.clicked
                    );
                }
            })
        }
    }

    sortBurrialLocations(){
        let sorted = [...this.burrialData.locations]
        sorted.sort((a,b)=>{
            let aDist = calculateDistanceQuick([Player.getX(),Player.getY(),Player.getZ()],[a.x+0.5,a.y+2.5,a.z+0.5])
            let bDist = calculateDistanceQuick([Player.getX(),Player.getY(),Player.getZ()],[b.x+0.5,b.y+2.5,b.z+0.5])

            return bDist-aDist
        })
        this.burrialData.locations = sorted
    }

    step(){
        
        hasDianaShovle = false
        let slots = [0, 1, 2, 3, 4, 5, 6, 7, 8]
        
        slots.forEach(a=>{
            item = Player.getInventory().getStackInSlot(a)
            if(ChatLib.removeFormatting(item.getName()) === "Ancestral Spade"){
                hasDianaShovle = true
            }
        })

        let showingWaypointsNew = hasDianaShovle && this.FeatureManager.features["dataLoader"].class.area === "Hub" && this.burrialWaypointsEnabled.getValue()

        if(!this.showingWaypoints && showingWaypointsNew){
            this.loadApi()
        }else{
            if(Date.now()-this.nextUpdateApprox > 0 && this.nextUpdateApprox > 0 && Date.now()-this.lastRequest>5000){
                this.nextUpdateApprox = -2
                this.loadApi()
            }
        }

        this.showingWaypoints = showingWaypointsNew

        if(this.showingWaypoints){

            this.updateTimer.setText("&6Update&7> &f" + (this.nextUpdateApprox===-1?"Updating...":(this.nextUpdateApprox===-2?"Loading...":Math.ceil((this.nextUpdateApprox-Date.now())/1000) + "s")))
        }else{
            this.updateTimer.setText("")
        }

    }
    step_5s(){
        if(this.showingWaypoints){
            if(this.burrialWaypointsPath.getValue() || this.burrialWaypointsNearest.getValue()){
                new Thread(()=>{
                    this.updateBurrialPath()
                }).start()
            }
        }
        this.sortBurrialLocations()
    }

    worldLoad(){
        this.burrialData.points = []
        this.burrialData.locations = []
        this.burrialData.historicalLocations = []

        this.showingWaypoints = false
    }

    loadApi(){
        new Thread(()=>{ 
            this.FeatureManager.features["dataLoader"].class.loadApiData("skyblock", false)
        }).start()
    }

    apiLoad(data, dataType, isSoopyServer, isLatest){ 
        if(!this.showingWaypoints) return;
        if(isSoopyServer || dataType !== "skyblock" || !isLatest) return
		this.lastRequest = Date.now()

        let profileData = data.profiles[0].members[Player.getUUID().toString().replace(/-/g,"")]

        data.profiles.forEach((prof)=>{
            if((prof.members[Player.getUUID().toString().replace(/-/g,"")].last_save || 0) > (profileData.last_save || 0)){
                profileData = prof.members[Player.getUUID().toString().replace(/-/g,"")]
            }
        })
        this.nextUpdateApprox = profileData.last_save+173000
        this.nextUpdateApprox += 2000 //incase ur pc time is behind
        if(profileData.last_save === this.lastRequestTime){
            return
        }
        this.lastRequestTime = profileData.last_save
        
        let locsAccessed = []
        let newLocs = []
        profileData.griffin.burrows.forEach((burrow)=>{
            let pushed = false
            this.burrialData.locations.forEach((loc, i)=>{
                if((loc.fromApi || loc.clicked) && loc.x + "," + loc.y + "," + loc.z === burrow.x + "," + burrow.y + "," + burrow.z){
                    newLocs.push(loc)
                    pushed = true
                    locsAccessed.push(i)
                }
            })
            this.burrialData.historicalLocations.forEach((loc)=>{
                if(loc.x + "," + loc.y + "," + loc.z === burrow.x + "," + burrow.y + "," + burrow.z){
                    pushed = true
                }
            })
            if(!pushed){
                burrow.clicked = false
                burrow.fromApi = true
                newLocs.push(burrow)
            }
        })
        
        this.burrialData.locations.forEach((loc)=>{
            if(!loc.fromApi){
                let found = false
                newLocs.forEach((burrow)=>{
                    if(loc.x + "," + loc.y + "," + loc.z === burrow.x + "," + burrow.y + "," + burrow.z){
                        found = true
                    }
                })

                if(!found){
                    newLocs.push(loc)
                }
            }
        })

        this.burrialData.locations = newLocs
        this.sortBurrialLocations()
        this.updateBurrialPath()
    }

    
    spawnParticle(particle, type, event){
        if(this.showingWaypoints){
            let foundEnchant = false
            let foundCrit = false
            let foundStep = false
            let isMob = undefined

            if(particle.toString().startsWith('EntityEnchantmentTableParticleFX, ')){
                foundEnchant = true
            }
            else if(particle.toString().startsWith('EntityCrit2FX, ')){
                foundCrit = true
                
                isMob = particle.getUnderlyingEntity().func_70534_d() > 0.5 //mob)
            }
            else if(particle.toString().startsWith('EntityFootStepFX, ')){
                foundStep = true
            }
            else if(particle.toString().startsWith('EntityCritFX, ')){
                
                let locstr = Math.floor(particle.getX()) + "," + Math.floor(particle.getY()-1) + "," + Math.floor(particle.getZ())

                let removed = false
                this.burrialData.locations.filter((loc, i)=>{
                    if(!loc.clicked && loc.x + "," + loc.y + "," + loc.z === locstr){
                        loc.clicked = true
                        removed = true
                        
                        this.lastPathCords.shift()
                    }
                })
                if(!removed) return;
                this.burrialData.locations = this.burrialData.locations.filter(a=>{
                    if(!a.clicked) return true
                    if(calculateDistanceQuick([a.x,a.y,a.z],[Player.getX(),Player.getY(),Player.getZ()]) < 15*15) return true;
            
                    this.burrialData.historicalLocations.unshift(a)
            
                    return false
                })
                if(this.burrialData.historicalLocations.length > 10) this.burrialData.historicalLocations.pop()

                return;
            }

            if(!foundEnchant && !foundCrit && !foundStep) return;

            let locstr = Math.floor(particle.getX()) + "," + Math.floor(particle.getY()-1) + "," + Math.floor(particle.getZ())
            let locarr = [Math.floor(particle.getX()), Math.floor(particle.getY()-1), Math.floor(particle.getZ())]

            let found = false

            this.burrialData.locations.forEach((loc)=>{
                if(loc.x + "," + loc.y + "," + loc.z === locstr){
                    found = true
                    loc.lastPing = Date.now()
                }
                if((loc.x+1) + "," + loc.y + "," + loc.z === locstr){
                    found = true
                    loc.lastPing = Date.now()
                }
                if((loc.x-1) + "," + loc.y + "," + loc.z === locstr){
                    found = true
                    loc.lastPing = Date.now()
                }
                if(loc.x + "," + loc.y + "," + (loc.z+1) === locstr){
                    found = true
                    loc.lastPing = Date.now()
                }
                if(loc.x + "," + loc.y + "," + (loc.z-1) === locstr){
                    found = true
                    loc.lastPing = Date.now()
                }
            })
            if(this.burrialData.historicalLocations){
                this.burrialData.historicalLocations.forEach((loc)=>{
                    if(loc.x + "," + loc.y + "," + loc.z === locstr){
                        found = true
                    }
                })
            }

            if(found) return;


            if (!this.potentialParticleLocs[locstr])this.potentialParticleLocs[locstr] = {enchant: 0, crit: 0, step: 0, isMob: 0, timestamp: Date.now()}

            if(foundEnchant) this.potentialParticleLocs[locstr].enchant++
            if(foundCrit) this.potentialParticleLocs[locstr].crit++
            if(foundStep) this.potentialParticleLocs[locstr].step++
            if(foundCrit && isMob) this.potentialParticleLocs[locstr].isMob++
            if(foundCrit && !isMob) this.potentialParticleLocs[locstr].isMob--

            this.potentialParticleLocs[locstr].timestamp = Date.now()

            if(this.potentialParticleLocs[locstr].enchant > 2 && this.potentialParticleLocs[locstr].step > 5){
                this.burrialData.locations.push({
                    "x": locarr[0],
                    "y": locarr[1],
                    "z": locarr[2],
                    "type": this.potentialParticleLocs[locstr].isMob > 1? 1:(this.potentialParticleLocs[locstr].crit > this.potentialParticleLocs[locstr].enchant/20?0:2),
                    "tier": -1,
                    "chain": -1,
                    "fromApi": false
                })
                new Thread(()=>{
                    this.updateBurrialPath()
                }).start()
            }
        }
    }
    
    burrialClicked(){
        if(!this.showingWaypoints) return

        let nearestBurriali = undefined
        let nearestBurrialDist = Infinity

        this.burrialData.locations.forEach((loc, i)=>{
            let dist = calculateDistanceQuick([loc.x, loc.y, loc.z], [Player.getX(), Player.getY(), Player.getZ()])
            if(dist < nearestBurrialDist){
                nearestBurrialDist = dist
                nearestBurriali = i
            }
        })

        if(nearestBurriali === undefined) return;
        this.burrialData.locations[nearestBurriali].clicked = true

        this.burrialData.locations = this.burrialData.locations.filter(a=>{
            if(!a.clicked) return true
            if(calculateDistanceQuick([a.x,a.y,a.z],[Player.getX(),Player.getY(),Player.getZ()]) < 15*15) return true;
    
            this.burrialData.historicalLocations.unshift(a)
    
            return false
        })
        if(this.burrialData.historicalLocations.length > 10) this.burrialData.historicalLocations.pop()
        if(this.lastPathCords) this.lastPathCords.shift()
        new Thread(()=>{
            this.updateBurrialPath()
        }).start()
    }
    updateBurrialPath(){
        if(this.burrialWaypointsPath.getValue() || this.burrialWaypointsNearest.getValue()){
            let startPoint = [Player.getX(),Player.getY(),Player.getZ()]
    
            let points = this.burrialData.locations.filter((a)=>{return !a.clicked}).map((a)=>{return [a.x+0.5,a.y+1.3,a.z+0.5]})
    
            if(points.length !== 0){
    
                if(points.length >= 10){
                    this.lastPath = undefined
                    this.lastPathCords = undefined
                }else{
                    this.lastPath = fastestPathThrough(startPoint,points)

                    this.lastPathCords = []
                    this.lastPath.forEach(a=>{
                        this.lastPathCords.push(points[a])
                    })
                }
                
                if(this.lastPath.length === 0){
                    this.lastPath = undefined
                    this.lastPathCords = undefined
                }
    
            }else{
                this.lastPath = undefined
                this.lastPathCords = undefined
            }
        }

    
        if(this.showingWaypoints){
            if(this.burrialWaypointsNearest.getValue()){
                let trueI = 0
                this.burrialData.locations.forEach((loc,i)=>{
                    if(!loc.clicked && trueI === this.lastPath[0]){
                        this.burrialData.locations[i].nearest = true
                    }else{
                        this.burrialData.locations[i].nearest = false
                    }
        
                    if(!loc.clicked) trueI++
                })
            }else{
                let closestBurrialI = 0
                let closestBurrialDist = Infinity
        
                this.burrialData.locations.forEach((loc,i)=>{
                    let dist = calculateDistanceQuick([loc.x,loc.y,loc.z],[Player.getX(),Player.getY(),Player.getZ()])
                    if(dist < closestBurrialDist){
                        closestBurrialDist = dist
                        closestBurrialI = i
                    }
                    this.burrialData.locations[i].nearest = false
                })
        
                this.burrialData.locations[closestBurrialI].nearest = true
            }
        }
    }

    initVariables(){
        this.burrialData = undefined
        this.lastRequestTime = undefined
        this.nextUpdateApprox = undefined
        this.lastRequest = undefined
        this.potentialParticleLocs = undefined
        this.showingWaypoints = undefined
        this.lastPath = undefined
        this.updatingPath = undefined
        this.hudElements = undefined
        this.lastPathCords = undefined
    }

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new Events()
}