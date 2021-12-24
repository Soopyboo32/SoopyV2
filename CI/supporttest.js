let errored = false

console.log("This is running nodejs code rn")
console.error("This is an error!")
errored = true

process.exit(errored?1:0)