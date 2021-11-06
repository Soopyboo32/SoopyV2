class Cosmetic{
    constructor(player, parent){
        /**
         * @type {PlayerMP | Player}
         */
        this.player = player

        this.parent = parent
    }

    onRender(){
        //override
    }

    onTick(){
        //override
    }
}

export default Cosmetic;