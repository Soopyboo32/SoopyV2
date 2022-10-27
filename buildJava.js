const { exec } = require("child_process");
const { readdirSync, fstat, rmSync } = require('fs')

function comm(com) {
    return new Promise(r => {
        exec(com, () => { r() })
    })
}

async function compileFile(feature, file) {
    console.log("Compiling " + feature + "/" + file + ".java")
    await comm("javac -cp C:/Users/adam_/.gradle/caches/essential-loom/1.8.9/de.oceanlabs.mcp.mcp_stable.1_8_9.22-1.8.9-forge-1.8.9-11.15.1.2318-1.8.9/minecraft-mapped.jar;C:/Users/adam_/.gradle/caches/essential-loom/1.8.9/de.oceanlabs.mcp.mcp_stable.1_8_9.22-1.8.9-forge-1.8.9-11.15.1.2318-1.8.9/forge/forge-mapped.jar -source 8 -target 8 src/features/" + feature + "/" + file + ".java")
    await comm("java -jar thingoidk.jar src/features/" + feature + "/" + file + ".class ../SoopyV2/features/" + feature + "/")
    rmSync("src/features/" + feature + "/" + file + ".class")
}

const getDirectories = source =>
    readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
const getJava = source =>
    readdirSync(source, { withFileTypes: true })
        .filter(dirent => !dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(dirent => dirent.endsWith(".java"))

async function compileAll() {
    let features = getDirectories("src/features")
    for (let feature of features) {
        let javas = getJava("src/features/" + feature)
        for (let java of javas) {
            await compileFile(feature, java.replace(".java", ""))
        }
    }
}

compileAll()