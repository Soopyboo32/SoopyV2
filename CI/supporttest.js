(async ()=>{

    // SUPER BASIC CI THING
    // This will test for basic support issues with chattriggers 1 and 2

    let { walkP } = require("./utils/walk")
    let fs = require("fs")
    let errors = []

    let dirName = (__dirname || process.env.HOME).split("\\")
    dirName.pop()
    dirName = dirName.join("\\")

    console.log("Reading directory... " + dirName)

    let dirs = await walkP(dirName)

    console.log("Analizing files...")


    for(let dir of dirs){
        if(!dir.includes("\\CI\\")){
            if(dir.endsWith(".js")){
                let file = await fs.promises.readFile(dir, "utf8")

                //TEST FOR GL11 THINGS
                if(file.includes("GL11.") || file.includes("GL11[")
                || file.includes("GlStateManager.") || file.includes("GlStateManager[")){
                    //Ensure that they are defined
                    let defined = ((file.includes("GL11.") || file.includes("GL11[")) && file.includes("org.lwjgl.opengl.GL11")) && ((file.includes("GlStateManager.") || file.includes("GlStateManager[")) && file.includes("net.minecraft.client.renderer.GlStateManager"))

                    //Ensure it checks if they are 
                    let definedTestsExists = file.includes("if(!GlStateManager){") || file.includes("if(!GL11){")

                    if(!defined){
                        errors.push([
                            "GL11 or GlStateManager NOT DEFINED IN FILE, this will cause the code to error on chattriggers 1.3 as it is not defined globally",
                            dir,
                            "This is an easy fix, just add this to the top of the file somewhere:",
                            "if(!GlStateManager){",
                            "    var GL11 = Java.type(\"org.lwjgl.opengl.GL11\"); //using var so it goes to global scope",
                            "    var GlStateManager = Java.type(\"net.minecraft.client.renderer.GlStateManager\");",
                            "}"
                        ])
                    }else{
                        if(!definedTestsExists){
                            errors.push([
                                "GL11 or GlStateManager NOT TESTED IN FILE, this will cause the code to error on chattriggers 2 as it is already a global const",
                                dir,
                                "This is an easy fix, just replace the existing GL defenitions with this",
                                "if(!GlStateManager){",
                                "    var GL11 = Java.type(\"org.lwjgl.opengl.GL11\"); //using var so it goes to global scope",
                                "    var GlStateManager = Java.type(\"net.minecraft.client.renderer.GlStateManager\");",
                                "}"
                            ])
                        }
                    }
                }

                //test for World.getBlockAt(x, y, z).getID() and World.getBlockAt(x, y, z).getType().getID()
                if(file.includes("World.getBlockAt") && (file.includes("getID()"))){
                    let includesTest = file.replace(/ /g, "").includes("if(World.getBlockAt(0,0,0).getID){")
                    
                    let actuallyHasUsage = false
                    let supportsV1 = false
                    let supportsV2 = false

                    let instances = file.split("World.getBlockAt")
                    instances.shift()
                    instances.forEach(instance =>{
                        let newArr = instance.split("(").map(x =>{
                            x = x.split(")")
                            let start = x.shift() 
                            x = x.map(z=>")" + z)
                            return [start, ...x]
                        })
                        newArr.shift()
                        // newArr = newArr.map(z=>"("+z)
                        // newArr = newArr.flat()

                        let newArr2 = []

                        newArr.forEach(x =>{
                            newArr2.push("(" + (x.shift() || ""))
                            // console.log(x)
                            x.forEach(z=>newArr2.push(z))
                        })

                        // console.log(newArr2)

                        let bracketCount = 0
                        let timesReached0 = 0
                        newArr2.forEach((section, i)=>{
                            if(section.startsWith("(")){
                                bracketCount++
                            }
                            if(section.startsWith(")")){
                                bracketCount--

                                if(bracketCount < 0){
                                    timesReached0 = 1000
                                }
                            }

                            if(bracketCount == 0){
                                // console.log(section, newArr2[i+1])
                                if(section === ").getID" && newArr2[i+1].startsWith("(")){
                                    if(timesReached0 == 0){
                                        supportsV1 = true
                                        actuallyHasUsage = true
                                    }else if(timesReached0 == 1){
                                        supportsV2 = true
                                        actuallyHasUsage = true
                                    }
                                }

                                timesReached0++
                            }
                        })
                    })
                    
                    if(actuallyHasUsage){
                        if(!includesTest){
                            errors.push([
                                "Block.getID NOT TESTED FOR EXISTANCE IN FILE, this will cause the code to not work on both ct 1 and 2 as syntax in v1 is Block.getID() and in v2 its Block.getType().getID()",
                                dir,
                                "This is an easy fix, just run the block id check twice, one for v1 and one for v2",
                                "surround it with \"if(World.getBlockAt(0,0,0).getID){\", this will be true if you should use v1 syntax and false if u should use v2",
                                "EG the code",
                                "if(World.getBlockAt(50,100,50).getID() === 100){",
                                "   is100 = true",
                                "}",
                                "Should be changed into",
                                "if(World.getBlockAt(0,0,0).getID){",
                                "   if(World.getBlockAt(50,100,50).getID() === 100){",
                                "      is100 = true",
                                "   }",
                                "}else{",
                                "   if(World.getBlockAt(50,100,50).getType().getID() === 100){",
                                "      is100 = true",
                                "   }",
                                "}"
                            ])
                        }else{
                            if(!supportsV1){
                                errors.push([
                                    "Block.getID() NOT SUPPORTED IN FILE, this will cause the code to not work on ct 1 as syntax is Block.getID()",
                                    dir,
                                    "This is an easy fix, just run the block id check twice, one for v1 and one for v2",
                                    "surround it with \"if(World.getBlockAt(0,0,0).getID){\", this will be true if you should use v1 syntax and false if u should use v2",
                                    "EG the code",
                                    "if(World.getBlockAt(50,100,50).getType().getID() === 100){",
                                    "   is100 = true",
                                    "}",
                                    "Should be changed into",
                                    "if(World.getBlockAt(0,0,0).getID){",
                                    "   if(World.getBlockAt(50,100,50).getID() === 100){",
                                    "      is100 = true",
                                    "   }",
                                    "}else{",
                                    "   if(World.getBlockAt(50,100,50).getType().getID() === 100){",
                                    "      is100 = true",
                                    "   }",
                                    "}"
                                ])
                            }else if(!supportsV2){
                                errors.push([
                                    "Block.getType().getID() NOT SUPPORTED IN FILE, this will cause the code to not work on ct 2 as syntax is Block.getType().getID()",
                                    dir,
                                    "This is an easy fix, just run the block id check twice, one for v1 and one for v2",
                                    "surround it with \"if(World.getBlockAt(0,0,0).getID){\", this will be true if you should use v1 syntax and false if u should use v2",
                                    "EG the code",
                                    "if(World.getBlockAt(50,100,50).getID() === 100){",
                                    "   is100 = true",
                                    "}",
                                    "Should be changed into",
                                    "if(World.getBlockAt(0,0,0).getID){",
                                    "   if(World.getBlockAt(50,100,50).getID() === 100){",
                                    "      is100 = true",
                                    "   }",
                                    "}else{",
                                    "   if(World.getBlockAt(50,100,50).getType().getID() === 100){",
                                    "      is100 = true",
                                    "   }",
                                    "}"
                                ])
                            }
                        }
                    }
                }
            }
        }
    }


    if(errors.length === 0){
        console.log("All tests passed!")
        process.exit(0)
    }else{
        console.log("Tests failed!")
        console.log("ERRORS: \n")

        errors.forEach(e=>{
            if(typeof(e) === "string"){
                console.error(e)
            }else{
                e.forEach(a=>console.error(a))
            }
            console.log("")
        })
    
        process.exit(1)
    }
})()