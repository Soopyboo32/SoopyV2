class Cosmetic{
    constructor(player, parent, id){

        if(player.getUUID().toString() === Player.getUUID().toString()) player = Player
        /**
         * @type {PlayerMP | Player}
         */
        this.player = player

        this.parent = parent

        this.id = id
        
        this.settings = this.parent.getPlayerCosmeticSettings(this.player, id)

        this.onTick()
    }

    onRenderEntity(ticks, isInGui){
        //override
    }

    onTick(){
        //override
    }
}

export default Cosmetic;