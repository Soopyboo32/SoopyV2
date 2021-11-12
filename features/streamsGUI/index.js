/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";
import SoopyBoxElement from "../../../guimanager/GuiElement/SoopyBoxElement";
import SoopyMarkdownElement from "../../../guimanager/GuiElement/SoopyMarkdownElement";
import SoopyImageElement from "../../../guimanager/GuiElement/SoopyImageElement";
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";

class StreamsGui extends Feature {
    constructor() {
        super()
    }

    onEnable(){
        this.initVariables()

        this.GuiPage = new StreamPage()
    }

    initVariables(){
        this.GuiPage = undefined
    }

    onDisable(){
        this.initVariables()
    }
}


class StreamPage extends GuiPage {
    constructor(){
        super(7)
        
        this.name = "Skyblock Streams"

        this.pages = [this.newPage()]


        this.pages[0].addChild(new SoopyTextElement().setText("§0Skyblock Streams").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1))

        this.streamsBox = new SoopyGuiElement().setLocation(0.1, 0.15, 0.8, 0.85)

        this.streamsBox.setScrollable(true)

        this.pages[0].addChild(this.streamsBox)

        this.finaliseLoading()
    }

    updateStreams(){
        let streams = JSON.parse(FileLib.getUrlContent("http://soopymc.my.to/api/skyblockstreams"))

        this.streamsBox.clearChildren()

        let y = 0

        Object.keys(streams.twitch).forEach((channel, i)=>{
            let stream = streams.twitch[channel]

            if(i%2===0){
                this.streamsBox.addChild(new StreamElement().setStream(stream, true).setLocation(0, y, 0.45, 0.55).setStreamPage(this))
            }
            if(i%2===1){
                this.streamsBox.addChild(new StreamElement().setStream(stream, true).setLocation(0.55, y, 0.45, 0.55).setStreamPage(this))
                y+= 0.6
            }
        })
    }

    openStreamSidebar(data){
        let sidebar = new SoopyGuiElement().setLocation(0,0,1,1)

        this.openSidebarPage(sidebar)


    }

    onOpen(){
        new Thread(()=>{
            this.updateStreams()
        }).start()
    }
}

class StreamElement extends SoopyBoxElement {
    constructor(){
        super()

        this.streamData = undefined

        this.channelElement = new SoopyTextElement().setLocation(0.1,0.025,0.8,0.1).setMaxTextScale(10)

        this.channelImg = new SoopyImageElement().setLocation(0.1,0.125,0.8,0.2).loadHeightFromImage()

        this.titleElement = new SoopyMarkdownElement().setLocation(0.1,0.45,0.8,0.1)

        this.channelImg.onImageHeightChange(()=>{
            this.titleElement.location.location.y.set(0.15+this.channelImg.location.size.y.get())
        },this)

        this.streamPage = undefined

        this.addEvent(new SoopyMouseClickEvent().setHandler(()=>{
            this.streamPage.openStreamSidebar(this.streamData)
        }))

        this.addChild(this.channelElement)
        this.addChild(this.titleElement)
        this.addChild(this.channelImg)
    }

    setStream(stream, twitch){
        this.streamData = stream

        this.titleElement.setText(stream.title)

        this.channelElement.setText((twitch ? "§0"+stream.user_name : "§0"+stream.channelTitle) + (twitch?"&7 - " + stream.viewer_count + " viewers":""))
        
        this.channelImg.setImage(twitch ? `https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.user_login}-640x360.jpg` : stream.thumbnails.high.url)

        return this
    }

    setStreamPage(page){
        this.streamPage = page
        
        return this
    }
}

module.exports = {
    class: new StreamsGui()
}