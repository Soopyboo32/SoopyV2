/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import { SoopyRenderEvent } from "../../../guimanager";
import ButtonWithArrowAndDescription from "../../../guimanager/GuiElement/ButtonWithArrowAndDescription";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import BoxWithLoading from "../../../guimanager/GuiElement/BoxWithLoading";
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";
import { numberWithCommas, timeSince } from "../../utils/numberUtils";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import TextBox from "../../../guimanager/GuiElement/TextBox";
import SoopyContentChangeEvent from "../../../guimanager/EventListener/SoopyContentChangeEvent";
import SoopyHoverChangeEvent from "../../../guimanager/EventListener/SoopyHoverChangeEvent";
import Dropdown from "../../../guimanager/GuiElement/Dropdown";
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement"
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";

class SenitherGui extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.GuiPage = new SettingPage()

        this.registerStep(true, 5, ()=>{
            this.GuiPage.step.call(this.GuiPage)
        })
    }

    initVariables(){
        this.GuiPage = undefined
    }

    onDisable(){
        this.GuiPage.delete()

        this.initVariables()
    }
}


class SettingPage extends GuiPage {
    constructor(){
        super(7)
        
        this.name = "Senither Leaderboard"

        this.pages = [this.newPage(), this.newPage()]

        this.pages[0].addEvent(new SoopyRenderEvent().setHandler(()=>{this.lastRender = Date.now()}))
        
        
        let senitherTitle = new SoopyTextElement().setText("§0Senither Leaderboard").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1)
        this.pages[0].addChild(senitherTitle)

        this.guildButton = new ButtonWithArrowAndDescription().setText("§0Guild Leaderboard").setLocation(0.1, 0.2, 0.35, 0.2)
        this.guildButton.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            this.clickedGuildButton()
        }))
        this.pages[0].addChild(this.guildButton)
        this.playerButton = new ButtonWithArrowAndDescription().setText("§0Player Leaderboard").setLocation(0.55, 0.2, 0.35, 0.2)
        this.playerButton.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            this.clickedPlayerButton()
        }))
        this.pages[0].addChild(this.playerButton)

        this.guildButton.setDesc("§0Guilds tracked: &7Loading...")
        this.playerButton.setDesc("§0Players tracked: &7Loading...")

        let leaveAndJoins = new SoopyTextElement().setText("§0Leave and joins").setMaxTextScale(2).setLocation(0.1, 0.45, 0.8, 0.1)
        this.pages[0].addChild(leaveAndJoins)
        this.leaveAndJoinsBox = new SoopyBoxElement().setLocation(0.1, 0.55, 0.8, 0.4)
        this.pages[0].addChild(this.leaveAndJoinsBox)

        this.leaveAndJoinsBox.addChild(new BoxWithLoading().setLocation(0.2, 0.2, 0.6, 0.6))


        this.playerPage = new SoopyGuiElement().setLocation(0,0,1,1)
        let playerTitle = new SoopyTextElement().setText("§0Player Leaderboard").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1)
        this.playerPage.addChild(playerTitle)

        this.playerSearchBox = new TextBox().setPlaceholder("Click to search").setLocation(0.2, 0.15, 0.6, 0.1)
        this.playerPage.addChild(this.playerSearchBox)

        this.playerPage.addChild(new SoopyTextElement().setText("§0Pos").setLocation(0.1,0.3,0.075*0.8,0.1))
        this.playerPage.addChild(new SoopyTextElement().setText("§0Name").setLocation(0.1+0.1*0.8,0.3,0.2*0.8,0.1))
        this.playerPage.addChild(new SoopyTextElement().setText("§0Guild").setLocation(0.1+0.325*0.8,0.3,0.2*0.8,0.1))
        let weight = new SoopyTextElement().setText("§0Weight").setLocation(0.1+0.55*0.8,0.3,0.2*0.8,0.1).setLore(["Click to set sorting to weight"])
        this.playerPage.addChild(weight)
        weight.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            this.playerSortThing = "weight"
            this.playerInformationUpdated = false
            this.playersBox.location.scroll.y.set(0, 100)
            this.playersBox._scrollAmount = 0
        }))

        let dropdown = new Dropdown().setOptions({
            "average_skill": "Average Skill",
            "average_skill_progress": "Average Skill Progress",
            "catacomb": "Catacomb",
            "catacomb_xp": "Catacomb Xp",
            "secrets_found": "Secrets Found",
            "healer": "Healer Level",
            "healer_xp": "Healer Xp",
            "mage": "Mage Level",
            "mage_xp": "Mage Xp",
            "berserk": "Berserk Level",
            "berserk_xp": "Berserk Xp",
            "archer": "Archer Level",
            "archer_xp": "Archer Xp",
            "tank": "Tank Level",
            "tank_xp": "Tank Xp",
            "total_slayer": "Total Slayer",
            "revenant_xp": "Revenant Xp",
            "tarantula_xp": "Tarantula Xp",
            "sven_xp": "Sven Xp",
            "enderman_xp": "Enderman Xp",
            "mining": "Mining Level",
            "mining_xp": "Mining Xp",
            "foraging": "Foraging Level",
            "foraging_xp": "Foraging Xp",
            "enchanting": "Enchanting Level",
            "enchanting_xp": "Enchanting Xp",
            "farming": "Farming Level",
            "farming_xp": "Farming Xp",
            "combat": "Combat Level",
            "combat_xp": "Combat Xp",
            "fishing": "Fishing Level",
            "fishing_xp": "Fishing Xp",
            "alchemy": "Alchemy Level",
            "alchemy_xp": "Alchemy Xp",
            "taming": "Taming Level",
            "taming_xp": "Taming Xp",
            "carpentry": "Carpentry Level",
            "carpentry_xp": "Carpentry Xp",
            "runecrafting": "Runecrafting Level",
            "runecrafting_xp": "Runecrafting Xp",
        }).setSelectedOption("average_skill_progress").setLocation(0.1+0.75*0.8,0.3,0.25*0.8,0.1).renderBox(false)
        this.playerPage.addChild(dropdown)
        dropdown.text.setMaxTextScale(1)

        this.playerSortThing = "weight"

        dropdown.addEvent(new SoopyContentChangeEvent().setHandler(newVal=>{
            this.playerSortThing = newVal
            this.selectedPlayerVal = newVal
            this.playerInformationUpdated = false
            this.playersBox.location.scroll.y.set(0, 100)
            this.playersBox._scrollAmount = 0
        }))

        // element.addChild(new SoopyTextElement().setText("§0#"+(i+1)).setLocation(0,0,0.075,1))
        // element.addChild(new SoopyTextElement().setText("§0"+p.username).setLocation(0.1,0,0.2,1))
        // element.addChild(new SoopyTextElement().setText("§0"+p.guild_name).setLocation(0.325,0,0.2,1))
        // element.addChild(new SoopyTextElement().setText("§0"+numberWithCommas(p.weight)).setLocation(0.55,0,0.2,1))
        // element.addChild(new SoopyTextElement().setText("§0"+numberWithCommas(p[this.selectedPlayerVal])).setLocation(0.75,0,0.2,1))

        this.playersBox = new SoopyGuiElement().setLocation(0.1,0.4,0.8,0.6).setScrollable(true)
        this.playerPage.addChild(this.playersBox)

        this.playerSearch = ""
        this.playerInformationUpdated = true
        this.playerSearchBox.text.addEvent(new SoopyContentChangeEvent().setHandler((newVal, oldVal, resetFun)=>{
            if(newVal.includes("&")){
                resetFun()
                return;
            }
            this.playerSearch = newVal

            this.playersBox.location.scroll.y.set(0, 100)
            this.playersBox._scrollAmount = 0
            
            this.playerInformationUpdated = false
        }))
        this.updatingPlayerInfo = false

        this.selectedPlayerVal = "average_skill_progress"

        this.guildData = undefined

        this.guildPage = new SoopyGuiElement().setLocation(0,0,1,1)
        let guildTitle = new SoopyTextElement().setText("§0Guild Leaderboard").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1)
        this.guildPage.addChild(guildTitle)

        this.guildSearchBox = new TextBox().setPlaceholder("Click to search").setLocation(0.2, 0.15, 0.6, 0.1)
        this.guildPage.addChild(this.guildSearchBox)
        this.guildSearch = ""

        this.guildPage.addChild(new SoopyTextElement().setText("§0Pos").setLocation(0.1,0.3,0.075*0.8,0.1))
        this.guildPage.addChild(new SoopyTextElement().setText("§0Name").setLocation(0.1+0.1*0.8,0.3,0.2*0.8,0.1))
        this.guildPage.addChild(new SoopyTextElement().setText("§0Weight").setLocation(0.1+0.325*0.8,0.3,0.15*0.8,0.1))
        this.guildPage.addChild(new SoopyTextElement().setText("§0Members").setLocation(0.1+0.475*0.8,0.3,(0.1+0.05/4)*0.8,0.1))
        this.guildPage.addChild(new SoopyTextElement().setText("§0Skill").setLocation(0.1+0.5875*0.8,0.3,(0.1+0.05/4)*0.8,0.1))
        this.guildPage.addChild(new SoopyTextElement().setText("§0Slayer").setLocation(0.1+0.7*0.8,0.3,(0.15+0.05/4)*0.8,0.1))
        this.guildPage.addChild(new SoopyTextElement().setText("§0Catacombs").setLocation(0.1+0.8625*0.8,0.3,(0.1+0.05/4)*0.8,0.1))

        this.guildsBox = new SoopyGuiElement().setLocation(0.1,0.4,0.8,0.6).setScrollable(true)
        this.guildPage.addChild(this.guildsBox)

        this.guildSortThing = "weight.total"


        this.finaliseLoading()
    }

    step(){
        if(!this.playerInformationUpdated && !this.updatingPlayerInfo){
            new Thread(()=>{
                this.loadPlayerInformation()
            }).start()
        }

        let pbHeight = this.playersBox.location.getHeightExact()
        let pbY = this.playersBox.location.getYExact()
        this.playersBox.children.forEach(b=>{
            b.visable = true
            // console.log(this.playersBox._scrollAmount)
            if(b.location.getYExact()+0.3*pbHeight < pbY){
            // console.log(2)
                b.visable = false
            }
            if(b.location.getYExact()-0.1*pbHeight > pbHeight+pbY){
            // console.log(3)
                b.visable = false
            }
        })

        let gbHeight = this.guildsBox.location.getHeightExact()
        let gbY = this.guildsBox.location.getYExact()
        this.guildsBox.children.forEach(b=>{
            b.visable = true
            // console.log(this.playersBox._scrollAmount)
            if(b.location.getYExact()+0.3*gbHeight < gbY){
            // console.log(2)
                b.visable = false
            }
            if(b.location.getYExact()-0.1*gbHeight > gbHeight+gbY){
            // console.log(3)
                b.visable = false
            }
        })
    }

    clickedGuildButton(){
        this.pages[1].clearChildren()
        this.pages[1].addChild(this.guildPage)

        this.guildSearchBox.setText("")
        this.guildSearch = ""

        // this.playersBox.location.scroll.y.set(0, 0)
        // this.playersBox._scrollAmount = 0

        this.goToPage(2)

        new Thread(()=>{
            this.loadGuildInformation()
        }).start()
    }

    loadGuildInformation(){
        let data = JSON.parse(FileLib.getUrlContent("https://hypixel-app-api.senither.com/leaderboard/"))

        this.guildData = data.data

        this.regenGuildElements()
    }

    regenGuildElements(){
        this.guildsBox.clearChildren()

        this.guildData.sort((a, b)=>{
            return getThing(b, this.guildSortThing.split("."))-getThing(a, this.guildSortThing.split("."))
        }).forEach((g, i)=>{

            let element = new SoopyBoxElement().setLocation(0,i*0.175, 1, 0.15)

            element.addEvent(new SoopyHoverChangeEvent().setHandler(()=>{
                if(element.hovered){
                    if(element.color[0]+element.color[1]+element.color[2]<0.5*(255+255+255)){
                        element.setColorOffset(10, 10, 10, 100)
                    }else{
                        element.setColorOffset(-10, -10, -10, 100)
                    }
                }else{
                    element.setColorOffset(0, 0, 0, 100)
                }
            }))

            element.addChild(new SoopyTextElement().setText("§0#"+(i+1)).setLocation(0,0,0.075,1))
            element.addChild(new SoopyTextElement().setText("§0"+g.name).setLocation(0.1,0,0.2,1))
            element.addChild(new SoopyTextElement().setText("§0"+numberWithCommas(Math.floor(g.weight.total))).setLocation(0.325,0,0.15,1).setLore(["§6" + numberWithCommas(g.weight.skill) + " §7skill weight", "§6" + numberWithCommas(g.weight.slayer) + " §7slayer weight", "§6" + numberWithCommas(g.weight.catacomb) + " §7dungeons weight", "§6"+g.weight.multiplier + " §7multiplier"]))
            element.addChild(new SoopyTextElement().setText("§0"+numberWithCommas(g.members)).setLocation(0.475,0,0.1,1))
            element.addChild(new SoopyTextElement().setText("§0"+numberWithCommas(g.average_skill_progress)).setLocation(0.5875,0,0.1,1))
            element.addChild(new SoopyTextElement().setText("§0"+numberWithCommas(Math.floor(g.average_slayer))).setLocation(0.7,0,0.15,1))
            element.addChild(new SoopyTextElement().setText("§0"+numberWithCommas(g.average_catacomb)).setLocation(0.8625,0,0.1,1))
            // element.addChild(new SoopyTextElement().setText("§0"+numberWithCommas(g.members)).setLocation(0.75,0,0.2,1))

            this.guildsBox.addChild(element)

            
        // this.guildPage.addChild(new SoopyTextElement().setText("§0Pos").setLocation(0.1,0.3,0.075*0.8,0.1))
        // this.guildPage.addChild(new SoopyTextElement().setText("§0Name").setLocation(0.1+0.1*0.8,0.3,0.2*0.8,0.1))
        // this.guildPage.addChild(new SoopyTextElement().setText("§0Weight").setLocation(0.1+0.325*0.8,0.3,0.15*0.8,0.1))
        // this.guildPage.addChild(new SoopyTextElement().setText("§0Members").setLocation(0.1+0.475*0.8,0.3,(0.1+0.05/4)*0.8,0.1))
        // this.guildPage.addChild(new SoopyTextElement().setText("§0Skill").setLocation(0.1+0.5875*0.8,0.3,(0.1+0.05/4)*0.8,0.1))
        // this.guildPage.addChild(new SoopyTextElement().setText("§0Slayer").setLocation(0.1+0.7*0.8,0.3,(0.15+0.05/4)*0.8,0.1))
        // this.guildPage.addChild(new SoopyTextElement().setText("§0Catacombs").setLocation(0.1+0.8625*0.8,0.3,(0.1+0.05/4)*0.8,0.1))
        })
    }

    clickedPlayerButton(){
        this.pages[1].clearChildren()
        this.pages[1].addChild(this.playerPage)

        this.playerSearchBox.setText("")
        this.playerSearch = ""

        this.playersBox.location.scroll.y.set(0, 0)
        this.playersBox._scrollAmount = 0

        this.goToPage(2)

        this.playerInformationUpdated = false
    }

    loadPlayerInformation(){
        if(this.updatingPlayerInfo) return
        this.updatingPlayerInfo = true
        this.playerInformationUpdated = true
        let players = JSON.parse(FileLib.getUrlContent("https://hypixel-app-api.senither.com/leaderboard/players?perPage=100&page=1&sort=" + this.playerSortThing + (this.playerSearch?"&username="+this.playerSearch:"")))

        this.playersBox.clearChildren()
        players.data.forEach((p, i)=>{
            let element = new SoopyBoxElement().setLocation(0,i*0.175, 1, 0.15)

            element.addEvent(new SoopyHoverChangeEvent().setHandler(()=>{
                if(element.hovered){
                    if(element.color[0]+element.color[1]+element.color[2]<0.5*(255+255+255)){
                        element.setColorOffset(10, 10, 10, 100)
                    }else{
                        element.setColorOffset(-10, -10, -10, 100)
                    }
                }else{
                    element.setColorOffset(0, 0, 0, 100)
                }
            }))

            element.addChild(new SoopyTextElement().setText("§0#"+(i+1)).setLocation(0,0,0.075,1))
            element.addChild(new SoopyTextElement().setText("§0"+p.username).setLocation(0.1,0,0.2,1))
            element.addChild(new SoopyTextElement().setText("§0"+p.guild_name).setLocation(0.325,0,0.2,1))
            element.addChild(new SoopyTextElement().setText("§0"+numberWithCommas(p.weight)).setLocation(0.55,0,0.2,1))
            element.addChild(new SoopyTextElement().setText("§0"+numberWithCommas(p[this.selectedPlayerVal])).setLocation(0.75,0,0.2,1))

            this.playersBox.addChild(element)
        })
        this.updatingPlayerInfo = false
    }

    loadFirstPageInformation(){
        let stats = JSON.parse(FileLib.getUrlContent("https://hypixel-app-api.senither.com/leaderboard/stats"))

        this.guildButton.setDesc("§0Guilds tracked: " + numberWithCommas(stats.data.guilds))
        this.playerButton.setDesc("§0Players tracked: " + numberWithCommas(stats.data.players))

        let leaveAndJoins = JSON.parse(FileLib.getUrlContent("https://hypixel-app-api.senither.com/leaderboard/history?perPage=10&page=1"))

        this.leaveAndJoinsBox.clearChildren()
        let y = 0
        leaveAndJoins.data.forEach(elm=>{
            this.leaveAndJoinsBox.addChild(new SoopyTextElement().setText(`§1${elm.username} §7${elm.type===0?"joined":"left"} §1${elm.guild_name}`).setLocation(0.05, y, 0.8, 0.1))
            this.leaveAndJoinsBox.addChild(new SoopyTextElement().setText(`§7${timeSince(elm.created_at)} ago`).setLocation(0.8125, y, 0.175, 0.1))
            y += 0.1
        })
    }


    onOpen(){
        new Thread(()=>{
            this.loadFirstPageInformation()
        }).start()

        let sidebar = new SoopyGuiElement().setLocation(0.1,0.1,0.8,0.8).setScrollable(true)
        this.openSidebarPage(sidebar)
        let markdown = new SoopyMarkdownElement().setText("# NOTE: \nAll credit for the idea, design of this gui, and loading of data goes to Senither who made the original leaderboard (https://hypixel-leaderboard.senither.com/)\n\nThis is just a recode of that to allow for checking the leaderboard from in-game")
        sidebar.addChild(markdown)

        sidebar.addChild(new ButtonWithArrow().setText("§0Open Leaderboard Website").setLocation(0.1,markdown.getHeight()+0.05, 0.8, 0.2).addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            java.awt.Desktop.getDesktop().browse(new java.net.URI("https://hypixel-leaderboard.senither.com/"));
        })))

        sidebar.setScrollable(true)

    }
}

module.exports = {
    class: new SenitherGui()
}

function getThing(obj, stack){
    while(stack.length > 0){
        obj= obj[stack.shift()]
    }

    return obj
}