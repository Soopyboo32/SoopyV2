if(!global.networkUtilsThingSoopy){

    let jURL = Java.type("java.net.URL")
    let jStandardCharsets = Java.type("java.nio.charset.StandardCharsets")
    let jCollectors = Java.type("java.util.stream.Collectors")
    let jBufferedReader = Java.type("java.io.BufferedReader")
    let jInputStreamReader = Java.type("java.io.InputStreamReader")

    function getUrlContent(theUrl, {userAgent="Mozilla/5.0", includeConnection=false}={}){
        
        if(global.soopyv2loggerthing){
            global.soopyv2loggerthing.logMessage("Loading API: " + theUrl, 4)
        }
        
        let conn = new jURL(theUrl).openConnection()
        conn.setRequestProperty("User-Agent", userAgent)
    
        let stringData 
    
        if(conn.getResponseCode() < 400){
            stringData = new jBufferedReader(
                new jInputStreamReader(conn.getInputStream(), jStandardCharsets.UTF_8))
                    .lines()
                    .collect(jCollectors.joining("\n"));
        
            conn.getInputStream().close()
        }else{
            stringData = new jBufferedReader(
                new jInputStreamReader(conn.getErrorStream(), jStandardCharsets.UTF_8))
                    .lines()
                    .collect(jCollectors.joining("\n"));
        
            conn.getErrorStream().close()
        }
    
        if(includeConnection){
            return {stringData, connection: conn}
        }
    
        return stringData
    }
    
    function fetch(url, options={userAgent: "Mozilla/5.0"}){
        let loadedConnection = undefined
        let loadedString = undefined
        let loadedJSON = undefined
    
        let ret = {
            sync(){
                if(loadedString === undefined){
                    options.includeConnection = true

                    let data = getUrlContent(url, options)
                    loadedString = data.stringData
                    loadedConnection = data.connection
                }

                return
            },
            async(callback){
                if(!callback){
                    callback = ()=>{}
                }
    
                if(loadedString === undefined){
                    options.includeConnection = true
    
                    pendingRequests.push({
                        callback: (data)=>{
                            loadedString = data.stringData
                            loadedConnection = data.connection
                            callback()
                        },
                        url: url,
                        options: options
                    })
                }else{
                    callback()
                }
            },
            text: (callback)=>{
                if(!callback){
                    ret.sync()

                    return this.loadedString
                }

                ret.async(()=>{
                    callback(loadedString)
                })
            },
            json: (callback)=>{
                if(!callback){
                    if(loadedJSON === undefined){
                        try{
                            loadedJSON = JSON.parse(ret.text())
                        }catch(e){}
                    }
    
                    return loadedJSON
                }
                
                ret.text(data=>{
                    try{
                    callback(JSON.parse(data))
                    }catch(e){}
                })
            },
            responseCode: (callback)=>{
                if(!callback){
                    if(loadedConnection === undefined){
                        ret.text()
                    }
    
                    return loadedConnection.getResponseCode()
                }
    
                ret.text(data=>{
                    callback(loadedConnection.getResponseCode())
                })
            }
        }
        return ret
    }

    let pendingRequests = []
    let pendingResolves = []
    let running = true

    new Thread(()=>{
        while(running){
            while(pendingRequests.length > 0){
                try{
                    let req = pendingRequests.shift()

                    let data = getUrlContent(req.url, req.options)

                    pendingResolves.push([req.callback, data])
                }catch(e){
                    console.log(e, undefined, true)
                }
            }
            Thread.sleep(100)
        }
    }).start()

    register("gameUnload", ()=>{
        running = false
    })

    register("tick", ()=>{
        try{
            while(pendingResolves.length > 0){
                let [callback, data] = pendingResolves.shift()

                callback(data)
            }
        }catch(e){
            console.log(e, undefined, true)
        }
    })

    global.networkUtilsThingSoopy = {
        getUrlContent: getUrlContent,
        fetch: fetch
    }
}

module.exports = global.networkUtilsThingSoopy
