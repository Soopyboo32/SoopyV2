/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";
import BoxWithLoading from "../../../guimanager/GuiElement/BoxWithLoading";
import BoxWithTextAndDescription from "../../../guimanager/GuiElement/BoxWithTextAndDescription";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import TextBox from "../../../guimanager/GuiElement/TextBox";
import SoopyKeyPressEvent from "../../../guimanager/EventListener/SoopyKeyPressEvent";
import { numberWithCommas } from "../../utils/numberUtils";
import { firstLetterWordCapital } from "../../utils/stringUtils";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement";

class NetworthGui extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.GuiPage = new NetworthPage()

    }

    initVariables(){
        this.GuiPage = undefined
    }

    onDisable(){
        this.initVariables()
    }
}


class NetworthPage extends GuiPage {
    constructor(){
        super(7)
        
        this.name = "Networth"

        this.pages = [this.newPage()]

        this.pages[0].addChild(new SoopyTextElement().setText("§0Networth").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1))
        this.pages[0].addChild(new SoopyTextElement().setText("§0(This is in beta and may be inaccurate)").setMaxTextScale(3).setLocation(0.1, 0.15, 0.8, 0.075))

        this.nameInput = new TextBox().setPlaceholder("Click to search").setLocation(0.1, 0.225, 0.8, 0.1)
        this.pages[0].addChild(this.nameInput)

        this.nameInput.addEvent(new SoopyKeyPressEvent().setHandler((key, keyId)=>{
            if(keyId === 28){
                new Thread(()=>{
                    this.playerLoad = this.nameInput.text.text
                    this.nameInput.setText("")
                    this.updateData(this.playerLoad)
                }).start()
            }
        }))

        this.statArea = new SoopyGuiElement().setLocation(0.05, 0.325, 0.9, 0.675).setScrollable(true)
        this.pages[0].addChild(this.statArea)

        this.loadingElm = new BoxWithLoading().setLocation(0.35, 0.4, 0.3, 0.2)
        this.errorElm = new BoxWithTextAndDescription().setLocation(0.2, 0.3, 0.6, 0.4).setText("Error!").setDesc("An error occured while loading the data!")
        this.statArea.addChild(this.loadingElm)

        this.playerLoad = undefined

        this.finaliseLoading()
    }

    updateData(player){

        this.statArea.clearChildren()
        this.statArea.addChild(this.loadingElm)

        let playerData = JSON.parse(FileLib.getUrlContent("http://soopymc.my.to/api/v2/player/" + player))

        if(player !== this.playerLoad) return

        if(!playerData.success){
            this.statArea.clearChildren()
            this.statArea.addChild(this.errorElm)
            this.errorElm.setText("§0" + playerData.error.name)
            this.errorElm.setDesc("§0" + playerData.error.description)
            return
        }

        let skyblockData = JSON.parse(FileLib.getUrlContent("http://soopymc.my.to/api/v2/player_skyblock/" + playerData.data.uuid + "?items"))

        if(player !== this.playerLoad) return

        this.statArea.clearChildren()

        if(!skyblockData.success){
            this.statArea.addChild(this.errorElm)
            this.errorElm.setText("§0" + skyblockData.error.name)
            this.errorElm.setDesc("§0" + skyblockData.error.description)
            return
        }

        let nwData = skyblockData.data.profiles[skyblockData.data.stats.bestProfileId].members[playerData.data.uuid].soopyNetworth
        this.statArea.addChild(new SoopyTextElement().setText(playerData.data.stats.nameWithPrefix).setMaxTextScale(2).setLocation(0.1, 0.05, 0.8, 0.1))
        this.statArea.addChild(new SoopyTextElement().setText("§0Networth (Highest weight profile): §2$" + numberWithCommas(Math.round(nwData.networth)).replace(/,/g, "§7,§2")).setMaxTextScale(1.5).setLocation(0.1, 0.15, 0.8, 0.1))
        this.statArea.addChild(new SoopyTextElement().setText("§0Purse: §2$" + numberWithCommas(Math.round(nwData.purse)).replace(/,/g, "§7,§2") + "§0 | Bank: §2$" + numberWithCommas(Math.round(nwData.bank)).replace(/,/g, "§7,§2") + "§0 | Sack: §2$" + numberWithCommas(Math.round(nwData.sack)).replace(/,/g, "§7,§2")).setMaxTextScale(1.5).setLocation(0.1, 0.25, 0.8, 0.1))
    
        Object.keys(nwData.categories).sort((a, b)=>nwData.categories[b].total-nwData.categories[a].total).forEach((name, i)=>{
            let renderName = firstLetterWordCapital(name.replace(/_/g, " "))

            let data = nwData.categories[name]

            let box = new SoopyBoxElement().setLocation(i%2===0?0:0.525, 0.45 + Math.floor(i/2)*0.35, 0.475, 0.25)

            box.addChild(new SoopyMarkdownElement().setLocation(0,0,1,1).setText(data.items.filter(i=>i.name).splice(0,5).map(a=>{
                let name = (a.name.startsWith("§f") || a.name.startsWith("[Lvl "))?a.name.replace("§f","§7"):a.name
                return "§0" + name + ": §2$" + numberWithCommas(Math.round(a.p)).replace(/,/g, "§7,§2")
            }).join("\n")))
        
            let boxName = new SoopyTextElement().setLocation(i%2===0?0:0.525, 0.4+Math.floor(i/2)*0.35, 0.475, 0.05).setText("§0" + renderName + "§0: §2$" + numberWithCommas(Math.round(data.total)).replace(/,/g, "§7,§2"))

            this.statArea.addChild(box)
            this.statArea.addChild(boxName)
        })
    }

    onOpen(){
        new Thread(()=>{
            this.playerLoad = Player.getName()
            this.updateData(Player.getName())
        }).start()
    }
}

module.exports = {
    class: new NetworthGui()
}