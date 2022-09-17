let allowedUUIDS = [
    "dc8c39647b294e03ae9ed13ebd65dd29"
]

module.exports = {hidden: function(featureManager){
    return !allowedUUIDS.includes(Player.getUUID().toString().replace(/-/g, ""))
}}