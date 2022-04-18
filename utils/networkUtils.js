if (!global.networkUtilsThingSoopy) {

    let jURL = Java.type("java.net.URL")
    let jStandardCharsets = Java.type("java.nio.charset.StandardCharsets")
    let jCollectors = Java.type("java.util.stream.Collectors")
    let jBufferedReader = Java.type("java.io.BufferedReader")
    let jInputStreamReader = Java.type("java.io.InputStreamReader")

    function getUrlContent(theUrl, { userAgent = "Mozilla/5.0", includeConnection = false } = {}) {

        if (global.soopyv2loggerthing) {
            global.soopyv2loggerthing.logMessage("Loading API: " + theUrl, 4)
        }

        // if(theUrl.includes("soopymc.my.to")){
        //     throw new Error("Testing to ensure the module works when my server is down")
        // }

        let conn = new jURL(theUrl).openConnection()
        conn.setRequestProperty("User-Agent", userAgent)

        let stringData

        if (conn.getResponseCode() < 400) {
            stringData = new jBufferedReader(
                new jInputStreamReader(conn.getInputStream(), jStandardCharsets.UTF_8))
                .lines()
                .collect(jCollectors.joining("\n"));

            conn.getInputStream().close()
        } else {
            stringData = new jBufferedReader(
                new jInputStreamReader(conn.getErrorStream(), jStandardCharsets.UTF_8))
                .lines()
                .collect(jCollectors.joining("\n"));

            conn.getErrorStream().close()
        }

        if (includeConnection) {
            return { stringData, connection: conn }
        }

        return stringData
    }

    function fetch(url, options = { userAgent: "Mozilla/5.0" }) {
        let loadedConnection = undefined
        let loadedString = undefined
        let loadedJSON = undefined
        let errorData = undefined

        let ret = {
            sync() {
                if (loadedString === undefined) {
                    options.includeConnection = true

                    try {
                        let data = getUrlContent(url, options)
                        loadedString = data.stringData
                        loadedConnection = data.connection
                    } catch (e) {
                        errorData = e
                        loadedString = null
                    }
                }

                return ret
            },
            async(callback, _ifError = false) {
                if (!callback) {
                    callback = () => { }
                }

                if (loadedString === undefined) {
                    options.includeConnection = true

                    pendingRequests.push({
                        callback: (data) => {
                            loadedString = data.stringData
                            loadedConnection = data.connection
                            callback()
                        },
                        errcallback: (e) => {
                            loadedString = null
                            errorData = e
                            if (_ifError) {
                                callback()
                            }
                        },
                        url: url,
                        options: options
                    })
                } else {
                    callback()
                }

                return ret
            },
            text: (callback) => {
                if (!callback) {
                    ret.sync()

                    return loadedString
                }

                ret.async(() => {
                    callback(loadedString)
                })

                return ret
            },
            json: (callback) => {
                if (!callback) {
                    if (loadedJSON === undefined) {
                        try {
                            loadedJSON = JSON.parse(ret.text())
                        } catch (e) { }
                    }

                    return loadedJSON
                }

                ret.text(data => {
                    try {
                        callback(JSON.parse(data))
                    } catch (e) { }
                })

                return ret
            },
            responseCode: (callback) => {
                if (!callback) {
                    ret.sync()

                    return loadedConnection?.getResponseCode() || -1
                }

                ret.async(data => {
                    callback(loadedConnection?.getResponseCode() || -1)
                })

                return ret
            },
            error: (callback) => {
                if (!callback) {
                    ret.sync()

                    return errorData
                }

                ret.async(data => {
                    if (errorData) {
                        callback(errorData)
                    }
                }, true)

                return ret
            }
        }
        return ret
    }

    let pendingRequests = []
    let pendingResolves = []

    register("tick", () => {
        if (pendingRequests.length > 0) {
            new Thread(() => {
                while (pendingRequests.length > 0) {
                    let req = pendingRequests.shift()

                    try {
                        let data = getUrlContent(req.url, req.options)

                        pendingResolves.push([req.callback, data])
                    } catch (e) {
                        pendingResolves.push([req.errcallback, e])
                    }
                }
            }).start()
        }

        try {
            while (pendingResolves.length > 0) {
                let [callback, data] = pendingResolves.shift()

                callback(data)
            }
        } catch (e) {
            console.log(JSON.stringify(e, undefined, 2))
        }
    })

    global.networkUtilsThingSoopy = {
        getUrlContent: getUrlContent,
        fetch: fetch
    }
}

module.exports = global.networkUtilsThingSoopy
