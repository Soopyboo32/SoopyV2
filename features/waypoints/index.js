/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { m } from "../../../mappings/mappings";
import Feature from "../../featureClass/class";
import { drawCoolWaypoint } from "../../utils/renderUtils";
import SettingBase from "../settings/settingThings/settingBase";

const RenderWorldLastEvent = Java.type("net.minecraftforge.client.event.RenderWorldLastEvent")

class Waypoints extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        new SettingBase("/addwaypoint [name] [x] [y] [z] [r?] [g?] [b?]", "Allows you to create a waypoint", undefined, "create_waypoint", this)
        new SettingBase("/delwaypoint [name]", "Allows you to delete a waypoint", undefined, "delete_waypoint", this)
        new SettingBase("/clearwaypoints", "Allows you to clear all the waypoints", undefined, "clear_waypoints", this)
        new SettingBase("/savewaypoints", "Copys the waypoints to your clipboard", undefined, "save_waypoints", this)
        new SettingBase("/loadwaypoints", "Loads waypoints from your clipboard", undefined, "load_waypoints", this)

        this.waypoints = []
        this.userWaypoints = {}

        this.registerForge(RenderWorldLastEvent, this.renderWorldLast)

        this.registerCommand("addwaypoint", (name, x=Math.floor(Player.getX()).toString(), y=Math.floor(Player.getY()).toString(), z=Math.floor(Player.getZ()).toString(), r="0", g="255", b="0")=>{
            let lx = 0
            let ly = 0
            let lz = 0

            if(Player.lookingAt().getX){
                lx = Player.lookingAt().getX()
                ly = Player.lookingAt().getY()
                lz = Player.lookingAt().getZ()

                if(Player.lookingAt().getWidth){
                    lx += -0.5
                    lz += -0.5
                }
            }
            
            this.userWaypoints[name] = {
                x: parseFloat(x.replace("l", lx)),
                y: parseFloat(y.replace("l", ly)),
                z: parseFloat(z.replace("l", lz)),
                r: parseInt(r),
                g: parseInt(g),
                b: parseInt(b),
                options: {name: ChatLib.addColor(name.replace(/_/g," "))}
            }
            ChatLib.chat(this.FeatureManager.messagePrefix + "Added waypoint "+ name + "!")
        })

        this.registerCommand("delwaypoint", (name)=>{
            delete this.userWaypoints[name]
            ChatLib.chat(this.FeatureManager.messagePrefix + "Deleted waypoint "+ name + "!")
        })
        this.registerCommand("clearwaypoints", ()=>{
            this.userWaypoints = {}
            ChatLib.chat(this.FeatureManager.messagePrefix + "Cleared waypoints!")
        })
        this.registerCommand("savewaypoints", ()=>{
            Java.type("net.minecraft.client.gui.GuiScreen")[m.setClipboardString](JSON.stringify(this.userWaypoints))
            ChatLib.chat(this.FeatureManager.messagePrefix + "Saved waypoints to clipboard!")
        })
        this.registerCommand("loadwaypoints", ()=>{
            try{
                this.userWaypoints = JSON.parse(Java.type("net.minecraft.client.gui.GuiScreen")[m.getClipboardString]())
                ChatLib.chat(this.FeatureManager.messagePrefix + "Loaded waypoints from clipboard!")
            }catch(e){
                ChatLib.chat(this.FeatureManager.messagePrefix + "Error loading from clipboard!")
            }
        })
    }

    addWaypoint(x, y, z, r, g, b, options){
        this.waypoints.push({
            x: x,
            y: y,
            z: z,
            r: r,
            g: g,
            b: b,
            options: options
        })
    }

    renderWorldLast(){
        for(let waypoint of this.waypoints){
            drawCoolWaypoint(waypoint.x, waypoint.y, waypoint.z, waypoint.r, waypoint.g, waypoint.b, waypoint.options)
        }
        let waypoints2 = Object.values(this.userWaypoints)
        for(let waypoint of waypoints2){
            drawCoolWaypoint(waypoint.x, waypoint.y, waypoint.z, waypoint.r, waypoint.g, waypoint.b, {...waypoint.options})
        }
    }

    initVariables(){
        this.waypoints = undefined
    }

    onDisable(){
        this.initVariables()
    }
}

module.exports = {
    class: new Waypoints()
}