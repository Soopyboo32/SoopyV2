class HudTextElement{
    constructor(){
        this.text = ""

        this.toggleSetting = undefined
        this.locationSetting = undefined

        this.blackText = "&0" + ChatLib.removeFormatting(this.text)

        this.editTempTimeV = 0
        this.editTempTextV = undefined

        this.tempDisableTime = 0
    }

    setText(text){
        this.text = text
        
        if(this.locationSetting.shadowType === 2){
            this.blackText = "&0" + ChatLib.removeFormatting(text)
        }
        return this
    }
    setToggleSetting(setting){
        this.toggleSetting = setting
        return this
    }
    setLocationSetting(setting){
        this.locationSetting = setting
        setting.setParent(this)
        return this
    }

    render(){
        if(this.toggleSetting && !this.toggleSetting.getValue() || !this.locationSetting) return
        if(Date.now()-this.tempDisableTime < 100) return

        this.renderRaw()
    }

    getText(){
        let text = this.text
        let blackText = this.blackText
        if(Date.now()-this.editTempTimeV < 100){
            if(this.editTempTextV){
                text = this.editTempTextV
                blackText = "&0" + ChatLib.removeFormatting(text)
            }
            
            if(ChatLib.removeFormatting(text) === ""){
                text = "&0Empty string"
                blackText = "&0Empty string"
            }
        }
        return [text.split("\n"), blackText.split("\n")]
    }

    renderRaw(){
        let [text, blackText] = this.getText()
        
        text.forEach((line, i)=>{
            Renderer.scale(this.locationSetting.scale, this.locationSetting.scale)
            switch(this.locationSetting.shadowType){
                case 0:
                    Renderer.drawString(line, this.locationSetting.x/this.locationSetting.scale, this.locationSetting.y/this.locationSetting.scale +9*i)
                break;
                case 1:
                    Renderer.drawStringWithShadow(line, this.locationSetting.x/this.locationSetting.scale, this.locationSetting.y/this.locationSetting.scale +9*i)
                break;
                case 2:
                    Renderer.drawString(blackText[i], (this.locationSetting.x+1)/this.locationSetting.scale, this.locationSetting.y/this.locationSetting.scale +9*i)
                    Renderer.drawString(blackText[i], (this.locationSetting.x-1)/this.locationSetting.scale, this.locationSetting.y/this.locationSetting.scale +9*i)
                    Renderer.drawString(blackText[i], this.locationSetting.x/this.locationSetting.scale, (this.locationSetting.y+1)/this.locationSetting.scale +9*i)
                    Renderer.drawString(blackText[i], this.locationSetting.x/this.locationSetting.scale, (this.locationSetting.y-1)/this.locationSetting.scale +9*i)
    
                    Renderer.drawString(line, this.locationSetting.x/this.locationSetting.scale, this.locationSetting.y/this.locationSetting.scale +9*i)
                break;
            }
        })
        Renderer.scale(1, 1)
    }
}

export default HudTextElement