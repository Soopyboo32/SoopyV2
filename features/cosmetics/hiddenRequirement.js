let cosmeticsClass = require("./index").class

export default ()=>{
    return !!cosmeticsClass?.cosmeticsData?.[Player.getUUID().toString()]
}