let allowedUUIDS = [
    "f2bcfe6aa54c4eb9b37156b4f1d20beb",
    "dc8c39647b294e03ae9ed13ebd65dd29"
]

export default ()=>{
    return !allowedUUIDS.includes(Player.getUUID().toString().replace(/-/g, ""))
}