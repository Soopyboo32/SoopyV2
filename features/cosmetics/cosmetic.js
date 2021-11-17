class Cosmetic{
    constructor(player, parent, id){
        /**
         * @type {PlayerMP | Player}
         */
        this.player = player

        this.parent = parent

        this.id = id
        
        this.settings = this.parent.getPlayerCosmeticSettings(this.player, id)
    }

    onRender(){
        //override
    }

    onTick(){
        //override
    }
}

export default Cosmetic;