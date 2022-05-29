/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

class Logger {
    constructor() {
        this.isDev = isDev()
        this.loglevel = this.isDev ? 4 : 2 //0=none, 1=error, 2=warn, 3=info, 4=debug
        this.logToMcChat = false
        this.logPrefixes = [
            "[SOOPYADDONS]       ",
            "[SOOPYADDONS:ERROR] ",
            "[SOOPYADDONS:WARN]  ",
            "[SOOPYADDONS:INFO]  ",
            "[SOOPYADDONS:DEBUG] "
        ]
        this.logMessage("Logger initialised", 3)
    }

    logMessage(message, level) {
        if (level <= this.loglevel) {
            console.log(this.logPrefixes[level] + message)
            if (this.logToMcChat) {
                ChatLib.chat(this.logPrefixes[level] + message)
            }
        }
    }
}
let devs = ["dc8c39647b294e03ae9ed13ebd65dd29"]

function isDev() {
    return devs.includes(Player.getUUID().toString().replace(/-/g, ""))
}


if (!global.soopyv2loggerthing) {
    global.soopyv2loggerthing = new Logger()

    register("command", () => {
        devs.push(Player.getUUID().toString().replace(/-/g, ""))
        global.soopyv2loggerthing.isDev = isDev()
        global.soopyv2featuremanagerthing.isDev = isDev()
    }).setName("pleasegivemeaccesstosoopyv2devconsolelogs", true) //yep

    register("gameUnload", () => {
        global.soopyv2loggerthing = undefined
    })
}
export default global.soopyv2loggerthing