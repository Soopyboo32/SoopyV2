/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

class Logger{
    constructor(){
        this.loglevel = 4 //0=none, 1=error, 2=warn, 3=info, 4=debug
        this.logToMcChat = false
        this.logPrefixes = [
            "[SOOPYADDONS] ",
            "[SOOPYADDONS:ERROR] ",
            "[SOOPYADDONS:WARN] ",
            "[SOOPYADDONS:INFO] ",
            "[SOOPYADDONS:DEBUG] "
        ]
        this.logMessage("Logger initialised", 3)
    }

    logMessage(message, level){
        if(level <= this.loglevel){
            console.log(this.logPrefixes[level] + message)
            if(this.logToMcChat){
                ChatLib.chat(this.logPrefixes[level] + message)
            }
        }
    }
}

export default new Logger()