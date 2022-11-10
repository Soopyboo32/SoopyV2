import Cosmetic from "../../cosmetic.js";

class Pet extends Cosmetic {
    constructor(player, parent, petType) {
        super(player, parent, "pet_" + petType);

        this.x = 0
        this.y = 0
        this.z = 0
        this.yaw = 0

        this.state = 0

        this.lastX = 0
        this.lastY = 0
        this.lastZ = 0
        this.lastYaw = 0

        this.lastState = 0

        this.lastUpdate = Date.now()
    }

    getAnimationProg() {
        return Math.min(1, (Date.now() - this.lastUpdate) / 250)
    }

    getX() {
        return this.x * this.getAnimationProg() + this.lastX * (1 - this.getAnimationProg())
    }

    getY() {
        return this.y * this.getAnimationProg() + this.lastY * (1 - this.getAnimationProg())
    }

    getZ() {
        return this.z * this.getAnimationProg() + this.lastZ * (1 - this.getAnimationProg())
    }

    getYaw() {
        return this.yaw * this.getAnimationProg() + this.lastYaw * (1 - this.getAnimationProg())
    }

    preUpdate() {
        this.lastX = this.getX() || 0
        this.lastY = this.getY() || 0
        this.lastZ = this.getZ() || 0
        this.lastYaw = this.getYaw() || 0
        this.lastState = this.state
    }

    postUpdate() {
        this.lastUpdate = Date.now()
    }

    removeEssentialCosmetics() { }
}
export default Pet;