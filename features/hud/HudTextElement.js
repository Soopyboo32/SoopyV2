import { HudText } from "../../utils/renderJavaUtils"

class HudTextElement {
    constructor() {
        this.text = ""

        this.toggleSetting = undefined
        this.locationSetting = undefined

        this.editTempTimeV = 0
        this.editTempTextV = undefined

        this.editBaseWidth = undefined
        this.editBaseHeight = undefined

        this.tempDisableTime = 0

        this.renderTextCache = [""]
        this.textChanged = false

        this.renderElm = new HudText([""], 0, 0, true).startRender()
    }

    delete() {
        this.renderElm.stopRender()
        if (this.locationSetting) this.locationSetting.delete()
    }

    setBaseEditWidth(width) {
        this.editBaseWidth = width
        return this
    }

    setBaseEditHeight(height) {
        this.editBaseHeight = height
        return this
    }

    setText(text = "") {
        if (text === this.text) return this
        this.text = text

        this.renderTextCache = ChatLib.addColor(this.text).split("\n")

        this.renderElm.setText(this.renderTextCache)
        return this
    }
    setToggleSetting(setting) {
        this.toggleSetting = setting
        setting.onChange = () => {
            if (this.toggleSetting.getValue()) {
                this.renderElm.startRender()
            } else {
                this.renderElm.stopRender()
            }
        }
        if (this.toggleSetting.getValue()) {
            this.renderElm.startRender()
        } else {
            this.renderElm.stopRender()
        }
        return this
    }
    setLocationSetting(setting) {
        this.locationSetting = setting
        setting.setParent(this)

        setting.onChange = () => {
            this.renderElm.setX(this.locationSetting.x).setY(this.locationSetting.y).setScale(this.locationSetting.scale)
        }
        this.renderElm.setX(this.locationSetting.x).setY(this.locationSetting.y).setScale(this.locationSetting.scale)
        return this
    }

    isEnabled() {
        if (!this.toggleSetting) return true
        return this.locationSetting && this.toggleSetting.getValue()
    }

    render() {
        if (this.toggleSetting && !this.toggleSetting.getValue() || !this.locationSetting) return
        if (Date.now() - this.tempDisableTime < 100) return

        this.renderRaw()
    }

    getWidth(locationBox = false) {
        if (locationBox && this.editBaseWidth) return this.editBaseWidth
        return Math.max(...(this.getText().map(a => Renderer.getStringWidth(ChatLib.removeFormatting(a)))))
    }
    getHeight(locationBox = false) {
        if (locationBox && this.editBaseHeight) return this.editBaseHeight
        return 9 * this.getText().length
    }

    getText() {
        if (Date.now() - this.editTempTimeV < 100) {
            let text = this.text
            if (this.editTempTextV) {
                text = this.editTempTextV
            }

            if (ChatLib.removeFormatting(text) === "") {
                text = "&0Empty string"
            }

            return text.split("\n")
        }
        return this.renderTextCache
    }

    renderRaw() {
        let text = this.getText()

        for (let i = 0, line = text[0]; i < text.length; i++, line = text[i]) {
            Renderer.scale(this.locationSetting.scale, this.locationSetting.scale)
            switch (this.locationSetting.shadowType) {
                case 0:
                    Renderer.drawString(line, this.locationSetting.x / this.locationSetting.scale, this.locationSetting.y / this.locationSetting.scale + 9 * i)
                    break;
                case 1:
                    Renderer.drawStringWithShadow(line, this.locationSetting.x / this.locationSetting.scale, this.locationSetting.y / this.locationSetting.scale + 9 * i)
                    break;
            }
        }
    }
}

export default HudTextElement