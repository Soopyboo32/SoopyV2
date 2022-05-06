class HudTextElement {
    constructor() {
        this.text = ""

        this.toggleSetting = undefined
        this.locationSetting = undefined

        this.blackText = "&0" + ChatLib.removeFormatting(this.text)

        this.editTempTimeV = 0
        this.editTempTextV = undefined

        this.editBaseWidth = undefined
        this.editBaseHeight = undefined

        this.tempDisableTime = 0

        this.renderTextCache = [""]
        this.renderBlackTextCache = [""]
        this.textChanged = false
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

        if (this.locationSetting && this.locationSetting.shadowType === 2) {
            this.blackText = "&0" + ChatLib.removeFormatting(text)
        }

        this.renderTextCache = this.text.split("\n")
        this.renderBlackTextCache = this.blackText.split("\n")
        return this
    }
    setToggleSetting(setting) {
        this.toggleSetting = setting
        return this
    }
    setLocationSetting(setting) {
        this.locationSetting = setting
        setting.setParent(this)

        if (this.locationSetting.shadowType === 2) {
            this.blackText = "&0" + ChatLib.removeFormatting(text)
        }
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

    getBlackText() {
        if (Date.now() - this.editTempTimeV < 100) {
            let text = this.text
            let blackText = this.blackText
            if (this.editTempTextV) {
                text = this.editTempTextV
                blackText = "&0" + ChatLib.removeFormatting(text)
            }

            if (ChatLib.removeFormatting(text) === "") {
                blackText = "&0Empty string"
            }

            return blackText.split("\n")
        }
        return this.renderBlackTextCache
    }

    renderRaw() {
        let text = this.getText()

        text.forEach((line, i) => {
            Renderer.scale(this.locationSetting.scale, this.locationSetting.scale)
            switch (this.locationSetting.shadowType) {
                case 0:
                    Renderer.drawString(line, this.locationSetting.x / this.locationSetting.scale, this.locationSetting.y / this.locationSetting.scale + 9 * i)
                    break;
                case 1:
                    Renderer.drawStringWithShadow(line, this.locationSetting.x / this.locationSetting.scale, this.locationSetting.y / this.locationSetting.scale + 9 * i)
                    break;
                case 2:
                    let blackText = this.getBlackText()
                    Renderer.drawString(blackText[i], (this.locationSetting.x + 1) / this.locationSetting.scale, this.locationSetting.y / this.locationSetting.scale + 9 * i)
                    Renderer.drawString(blackText[i], (this.locationSetting.x - 1) / this.locationSetting.scale, this.locationSetting.y / this.locationSetting.scale + 9 * i)
                    Renderer.drawString(blackText[i], this.locationSetting.x / this.locationSetting.scale, (this.locationSetting.y + 1) / this.locationSetting.scale + 9 * i)
                    Renderer.drawString(blackText[i], this.locationSetting.x / this.locationSetting.scale, (this.locationSetting.y - 1) / this.locationSetting.scale + 9 * i)

                    Renderer.drawString(line, this.locationSetting.x / this.locationSetting.scale, this.locationSetting.y / this.locationSetting.scale + 9 * i)
                    break;
            }
        })
    }
}

export default HudTextElement