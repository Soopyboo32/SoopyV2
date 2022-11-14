import { AI_STATE } from "../states.js"

/**
 * Pet is currently standing (NOT SITTING SO IT CAN MOVE)
 * @param {import("../dragon.js").default} pet 
 */
export default function (pet) {
    let distMult = 2 * Math.sqrt(pet.settings.scale)
    distMult = Math.max(0.5, distMult)

    let distToOwner = pet.getDistanceTo(pet.player.getX(), pet.player.getY(), pet.player.getZ())

    if (distToOwner > 10 * distMult || Math.random() > 0.99) {
        let x = Player.getX() + Math.random() * 10 * distMult - 5 * distMult
        let z = Player.getZ() + Math.random() * 10 * distMult - 5 * distMult
        let y = Math.round(Player.getY())
        let i = 0
        while (!World.getBlockAt(x, y, z).getType().getID() && i++ < 10) y--
        while (World.getBlockAt(x, y, z).getType().getID() && i++ < 10) y++

        if (i >= 10) y = Math.round(Player.getY())

        pet.aiState = AI_STATE.TRAVELING_TO_POSITION
        pet.travelToPosition = [x, y, z]
    }
}