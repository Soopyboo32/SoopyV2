new Thread(()=>{
    console.log("Loading joined data... (reading from file)")
    let joinedFile = FileLib.read("SoopyV2", "mappings/data/joined.tsrg")
    console.log("Loading joined data... (parsing file 1/2)")
    joinedFile = joinedFile.split("\n")
    console.log("Loading joined data... (parsing file 2/2)")
    let joinedData = {}
    let joinedData2 = {}
    let currThing = []
    joinedFile.forEach(line=>{
        if(line.startsWith("	")){
            line = line.split(" ")
            let thingo = line.pop()
            let thingo2 = line.pop()
            joinedData[thingo] = currThing[1].split("/").pop()
            if(thingo2.includes(")")){
                joinedData2[thingo] = thingo2.replace("(", "").replace(";", "").replace(")", "_")
            }
        }else{
            currThing = line.split(" ")
        }
    })
    console.log("Loaded joined data!")
    console.log("Loading methods mapping data... (reading from file)")
    let methodsFile = FileLib.read("SoopyV2", "mappings/data/methods.csv")
    console.log("Loading methods mapping data... (parsing file 1/2)")
    let methodsArr = methodsFile.split("\n")
    methodsArr.shift()
    console.log("Loading methods mapping data... (parsing file 2/2)")
    let methodsData = {}
    methodsArr.forEach(method => {
        let [searge,name,side,desc] = method.split(",")

        if(!methodsData[name]) methodsData[name] = {}
        methodsData[name][joinedData[searge]] = {
            searge: searge,
            name: name,
            side: side,
            desc: desc
        }
    })
    console.log("Loaded methods mapping data!")
    // console.log("Loading params mapping data... (reading from file)")
    // let paramsFile = FileLib.read("SoopyV2", "mappings/data/params.csv")
    // console.log("Loading params mapping data... (parsing file 1/2)")
    // let paramsArr = paramsFile.split("\n")
    // paramsArr.shift()
    // console.log("Loading params mapping data... (parsing file 2/2)")
    // let paramsData = {}
    // paramsArr.forEach(method => {
    //     let [searge,name,side] = method.split(",")

    //     if(!paramsData[name]) paramsData[name] = {}
    //     paramsData[name][joinedData[searge]] = {
    //         searge: searge,
    //         name: name,
    //         side: side
    //     }
    // })
    // console.log("Loaded params mapping data!")
    console.log("Loading fields mapping data... (reading from file)")
    let fieldsFile = FileLib.read("SoopyV2", "mappings/data/fields.csv")
    console.log("Loading fields mapping data... (parsing file 1/2)")
    let fieldsArr = fieldsFile.split("\n")
    fieldsArr.shift()
    console.log("Loading fields mapping data... (parsing file 2/2)")
    let fieldsData = {}
    fieldsArr.forEach(method => {
        let [searge,name,side,desc] = method.split(",")

        if(!fieldsData[name]) fieldsData[name] = {}
        fieldsData[name][joinedData[searge]] = {
            searge: searge,
            name: name,
            side: side,
            desc: desc
        }
    })
    console.log("Loaded fields mapping data!")
    console.log("Creating mappings.js ...")
    let mappingsJs = ""
    mappingsJs += "let m = {}\nlet f = {}\nif(false){\n"
    let methodNameKeys = Object.keys(methodsData)
    methodNameKeys.forEach((methodName, i)=>{
        let keys = Object.keys(methodsData[methodName])
        if(keys.length === 1){
            mappingsJs += `/** \n * ${(methodsData[methodName][keys[0]].desc||"").replace(/\\n/g, "\n * ")}\n * \n * Parent Class: ${keys[0].split("_").pop()}\n */\n`
            mappingsJs += `m.${methodName} = "${methodsData[methodName][keys[0]].searge}"\n`
        }else{
            mappingsJs += `m.${methodName} = {}\n`
            let keysData = {}
            keys.forEach(key=>{
                if(!keysData[key.split("_").pop()]) keysData[key.split("_").pop()] = []

                keysData[key.split("_").pop()].push(methodsData[methodName][key])
            })
            keys.forEach(key=>{
                // console.log(keysData[key.split("_").pop()].length)
                if(keysData[key.split("_").pop()].length === 0) return
                if(keysData[key.split("_").pop()].length === 1){
                    mappingsJs += `/** \n * ${(methodsData[methodName][key].desc||"").replace(/\\n/g, "\n * ")}\n * \n * Parent Class: ${key.split("_").pop()}\n */\n`
                    mappingsJs += `m.${methodName}.${key.split("_").pop()} = "${methodsData[methodName][key].searge}"\n`
                }else{
                    mappingsJs += `m.${methodName}.${key.split("_").pop()} = {}\n`
                    keysData[key.split("_").pop()].forEach((method)=>{
                        // console.log(joinedData2[method.searge])
                        mappingsJs += `/** \n * ${(method.desc||"").replace(/\\n/g, "\n * ")}\n * \n * Parent Class: ${key.split("_").pop()}\n */\n`
                        mappingsJs += `m.${methodName}.${key.split("_").pop()}.${joinedData2[method.searge]} = "${method.searge}",`
                    })

                    keysData[key.split("_").pop()] = []
                }
            })
            mappingsJs += "\n"
        }
    })
    let fieldNameKeys = Object.keys(fieldsData)
    fieldNameKeys.forEach((fieldName, i)=>{
        let keys = Object.keys(fieldsData[fieldName])
        if(keys.length === 1){
            mappingsJs += `/** \n * ${(fieldsData[fieldName][keys[0]].desc||"").replace(/\\n/g, "\n * ")}\n * \n * Parent Class: ${keys[0].split("_").pop()}\n */\n`
            mappingsJs += `f.${fieldName} = "${fieldsData[fieldName][keys[0]].searge}"\n`
        }else{
            mappingsJs += `f.${fieldName} = {}\n`
            let keysData = {}
            keys.forEach(key=>{
                if(!keysData[key.split("_").pop()]) keysData[key.split("_").pop()] = []

                keysData[key.split("_").pop()].push(fieldsData[fieldName][key])
            })
            keys.forEach(key=>{
                // console.log(keysData[key.split("_").pop()].length)
                if(keysData[key.split("_").pop()].length === 0) return
                if(keysData[key.split("_").pop()].length === 1){
                    mappingsJs += `/** \n * ${(fieldsData[fieldName][key].desc||"").replace(/\\n/g, "\n * ")}\n * \n * Parent Class: ${key.split("_").pop()}\n */\n`
                    mappingsJs += `f.${fieldName}.${key.split("_").pop()} = "${fieldsData[fieldName][key].searge}"\n`
                }else{
                    mappingsJs += `f.${fieldName}.${key.split("_").pop()} = {}\n`
                    keysData[key.split("_").pop()].forEach((field)=>{
                        // console.log(joinedData2[field.searge])
                        mappingsJs += `/** \n * ${(field.desc||"").replace(/\\n/g, "\n * ")}\n * \n * Parent Class: ${key.split("_").pop()}\n */\n`
                        mappingsJs += `f.${fieldName}.${key.split("_").pop()}.${joinedData2[field.searge]} = "${field.searge}",`
                    })

                    keysData[key.split("_").pop()] = []
                }
            })
            mappingsJs += "\n"
        }
    })
    // mappingsJs += "\nlet p = {}\n\n"
    // let paramNameKeys = Object.keys(paramsData)
    // paramNameKeys.forEach((paramName, i)=>{
    //     let keys = Object.keys(paramsData[paramName])
    //     if(keys.length === 1){
    //         mappingsJs += `/** \n * Parent Class: ${keys[0].split("_").pop()}\n */\n`
    //         mappingsJs += `p.${paramName} = "${paramsData[paramName][keys[0]].searge}"\n`
    //     }else{
    //         mappingsJs += `p.${paramName} = {}\n`
    //         let keysData = {}
    //         keys.forEach(key=>{
    //             if(!keysData[key.split("_").pop()]) keysData[key.split("_").pop()] = []

    //             keysData[key.split("_").pop()].push(paramsData[paramName][key])
    //         })
    //         keys.forEach(key=>{
    //             // console.log(keysData[key.split("_").pop()].length)
    //             if(keysData[key.split("_").pop()].length === 0) return
    //             if(keysData[key.split("_").pop()].length === 1){
    //                 mappingsJs += `/** \n * Parent Class: ${key.split("_").pop()}\n */\n`
    //                 mappingsJs += `p.${paramName}.${key.split("_").pop()} = "${paramsData[paramName][keys[0]].searge}"\n`
    //             }else{
    //                 mappingsJs += `p.${paramName}.${key.split("_").pop()} = {}\n`
    //                 keysData[key.split("_").pop()].forEach((param)=>{
    //                     // console.log(joinedData2[param.searge])
    //                     mappingsJs += `/** \n * Parent Class: ${key.split("_").pop()}\n */\n`
    //                     mappingsJs += `p.${paramName}.${key.split("_").pop()}.${joinedData2[param.searge]} = "${param.searge}",`
    //                 })

    //                 keysData[key.split("_").pop()] = []
    //             }
    //         })
    //         mappingsJs += "\n"
    //     }
    // })
    mappingsJs += "\nmodule.exports = {m:m,f:f}\n}else{\n"

    mappingsJs += 
`if(!global.soopyv2mappings){
    
    let joinedFile = FileLib.read("SoopyV2", "mappings/data/joined.tsrg")
    joinedFile = joinedFile.split("\\n")
    let joinedData = {}
    let joinedData2 = {}
    let currThing = []
    joinedFile.forEach(line=>{
        if(line.startsWith("	")){
            line = line.split(" ")
            let thingo = line.pop()
            let thingo2 = line.pop()
            joinedData[thingo] = currThing[1].split("/").pop()
            if(thingo2.includes(")")){
                joinedData2[thingo] = thingo2.replace("(", "").replace(";", "").replace(")", "_")
            }
        }else{
            currThing = line.split(" ")
        }
    })
    let methodsFile = FileLib.read("SoopyV2", "mappings/data/methods.csv")
    let methodsArr = methodsFile.split("\\n")
    methodsArr.shift()
    let methodsData = {}
    methodsArr.forEach(method => {
        let [searge,name,side,desc] = method.split(",")

        if(!methodsData[name]) methodsData[name] = {}
        methodsData[name][joinedData[searge]] = {
            searge: searge,
            name: name,
            side: side,
            desc: desc
        }
    })
    let fieldsFile = FileLib.read("SoopyV2", "mappings/data/fields.csv")
    let fieldsArr = fieldsFile.split("\\n")
    fieldsArr.shift()
    let fieldsData = {}
    fieldsArr.forEach(method => {
        let [searge,name,side,desc] = method.split(",")

        if(!fieldsData[name]) fieldsData[name] = {}
        fieldsData[name][joinedData[searge]] = {
            searge: searge,
            name: name,
            side: side,
            desc: desc
        }
    })
    let methodNameKeys = Object.keys(methodsData)
    methodNameKeys.forEach((methodName, i)=>{
        let keys = Object.keys(methodsData[methodName])
        if(keys.length === 1){
            m[methodName] = methodsData[methodName][keys[0]].searge
        }else{
            m[methodName] = {}
            let keysData = {}
            keys.forEach(key=>{
                if(!keysData[key.split("_").pop()]) keysData[key.split("_").pop()] = []

                keysData[key.split("_").pop()].push(methodsData[methodName][key])
            })
            keys.forEach(key=>{
                if(keysData[key.split("_").pop()].length === 0) return
                if(keysData[key.split("_").pop()].length === 1){
                    m[methodName][key.split("_").pop()] = methodsData[methodName][key].searge
                }else{
                    m[methodName][key.split("_").pop()] = {}
                    keysData[key.split("_").pop()].forEach((method)=>{
                        m[methodName][key.split("_").pop()][joinedData2[method.searge]] = method.searge
                    })

                    keysData[key.split("_").pop()] = []
                }
            })
        }
    })
    let fieldNameKeys = Object.keys(fieldsData)
    fieldNameKeys.forEach((fieldName, i)=>{
        let keys = Object.keys(fieldsData[fieldName])
        if(keys.length === 1){
            f[fieldName] = fieldsData[fieldName][keys[0]].searge
        }else{
            f[fieldName] = {}
            let keysData = {}
            keys.forEach(key=>{
                if(!keysData[key.split("_").pop()]) keysData[key.split("_").pop()] = []

                keysData[key.split("_").pop()].push(fieldsData[fieldName][key])
            })
            keys.forEach(key=>{
                if(keysData[key.split("_").pop()].length === 0) return
                if(keysData[key.split("_").pop()].length === 1){
                    f[fieldName][key.split("_").pop()] = fieldsData[fieldName][key].searge
                }else{
                    f[fieldName][key.split("_").pop()] = {}
                    keysData[key.split("_").pop()].forEach((field)=>{
                        f[fieldName][key.split("_").pop()][joinedData2[field.searge]] = field.searge
                    })

                    keysData[key.split("_").pop()] = []
                }
            })
        }
    })
    global.soopyv2mappings = [m, f]
}
[m, f] = global.soopyv2mappings
}
module.exports = {m:m,f:f}`

    FileLib.write("SoopyV2", "mappings/mappings.js", mappingsJs)
}).start()