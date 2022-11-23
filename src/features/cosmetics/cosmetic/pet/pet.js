import Cosmetic from "../../cosmetic.js";

class Pet extends Cosmetic {
    constructor(player, parent, petType) {
        super(player, parent, "pet_" + petType);

        this.x = 0
        this.y = 0
        this.z = 0
        this.yaw = 0
        this.headYaw = 0

        this.state = 0

        this.lastX = 0
        this.lastY = 0
        this.lastZ = 0
        this.lastYaw = 0
        this.lastHeadYaw = 0

        this.lastState = 0

        this.lastUpdate = Date.now()
    }

    onCosmeticMessage(data) {
        if (this.isSelfPlayer) return
        if (data[0] !== 0) return //when data = 0 its data for an automated location/animation ect sync
        //if its not 0 it is data unique to the pet in specific and should not be handled here

        this.preUpdate();
        let _; //want to declare this with let even tho its getting thrown out D:
        [_, this.x, this.y, this.z, this.yaw, this.headYaw, this.state] = data
        this.postUpdate()
    }

    /**
     * Gets the progress thru the animation
     * 0 -> currently at last locations (lastYaw, lastX, lastY ect)
     * 1 -> currently at current locations (yaw, x, y, ect)
     * @returns {Number} between 0-1
     */
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
        let [direction, distance] = calculateYawDirection(this.lastYaw, this.yaw)

        return (this.lastYaw + distance * direction * this.getAnimationProg() + 360) % 360
    }

    getHeadYaw() {
        let [direction, distance] = calculateYawDirection(this.lastHeadYaw, this.headYaw)

        return (this.lastHeadYaw + distance * direction * this.getAnimationProg() + 360) % 360
    }

    /**
     * Gets the yaw from the pet to a xz location
     * @param {Number} x 
     * @param {Number} z 
     * @returns {Number}
     */
    getYawToLocation(x, z) {
        let yaw = Math.atan((x - this.x) / (z - this.z)) / (Math.PI * 2) * 360
        if (z > this.z) yaw += 180

        if (isNaN(yaw)) return this.yaw

        return (yaw + 360) % 360
    }

    /**
     * Gets the distance from the pet to a location
     * if z is ommitted it will assume the given y value is z and calculate horisontal distance
     * if both y and z are ommitted it will assume the given x value is y and calculate verticle distance
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} z 
     * @returns {Number}
     */
    getDistanceTo(x, y = null, z = null) {
        if (y === null) return Math.abs(this.y - x)

        if (z === null) return Math.hypot(this.x - x, this.z - y)

        return Math.hypot(this.x - x, this.y - y, this.z - z)
    }

    /**
     * Moves the pet `distance` towards the xz point
     * If distance = null it will be assumed z=distance and x = y (verticle travel)
     * 
     * This will also change the pet's YAW to look in the direction of motion IF its horisontal movement
     * @param {Number} x 
     * @param {Number} z 
     * @param {Number} distance 
     */
    moveTowards(x, z, distance = null) {
        if (distance === null) {
            //verticle

            if (Math.abs(this.y - x) < z) {
                this.y = x
                return
            }

            if (this.y < x) this.y += z
            else this.y -= z

            return
        }

        //horisontal
        let yaw = this.getYawToLocation(x, z)
        let distanceFinal = (this.x - x) ** 2 + (this.z - z) ** 2

        if (distanceFinal < distance ** 2) {
            this.x = x
            this.z = z
            return
        }

        this.yaw = yaw

        let xDist = Math.abs(distance * Math.sin(yaw / 180 * Math.PI))
        let zDist = Math.abs(distance * Math.cos(yaw / 180 * Math.PI))

        if (this.x > x) xDist *= -1
        if (this.z > z) zDist *= -1

        this.x += xDist
        this.z += zDist
    }

    /**
     * Gets the yaw between the pet's yaw and a given yaw
     * Will properly wrap around and shouldent have issues where yaw between 359 and 0 is 359 (should be 1 cus its an angle)
     * @param {Number} yaw 
     * @returns {Number}
     */
    getYawToYaw(yaw) {
        return calculateYawDirection(this.yaw, yaw)[1]
    }

    /**
     * Will rotate the pet a distance towards a certen yaw
     * @param {Number} yaw 
     * @param {Number} speed 
     */
    rotateTowards(yaw, speed) {
        let [direction, distance] = calculateYawDirection(this.yaw, yaw)

        if (distance < speed) {
            this.yaw = yaw
            return
        }

        let newYaw = this.yaw + speed * direction

        this.yaw = (newYaw + 360) % 360
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

        if (this.isSelfPlayer) //Only send data to other users if the current player owns the cosmetic
            this.sendCosmeticsData([0, this.x, this.y, this.z, this.yaw, this.headYaw, this.state])
    }
}
export default Pet;

function calculateYawDirection(c, n) {
    let direction = 1
    let distance = Math.abs(n - c)
    if (c > n) {
        direction = -1
        if (distance > Math.abs(n - c + 360)) {
            direction = 1
            distance = Math.abs(n - c + 360)
        }
    }
    if (c < n) {
        direction = 1
        if (distance > Math.abs(n - c - 360)) {
            direction = -1
            distance = Math.abs(n - c - 360)
        }
    }
    return [direction, distance]
}