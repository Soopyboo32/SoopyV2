const { default: Cosmetic } = require("../cosmetic.js")


class CustomPetName extends Cosmetic {
    constructor(player, parent) {
        super(player, parent, "custom_pet_names")

        this.nameMap = new Map()
        this.settings.customNames.forEach(n => this.nameMap.set(n[0], n[1]))

        this.tickI = 0
    }

    onTick() {
        this.tickI++
        if (this.tickI % 20 !== 1) return

        World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach(e => {
            if (ChatLib.removeFormatting(e.getName()).includes(this.player.getName() + "'s ")) {
                let petName = ChatLib.removeFormatting(e.getName().split("'s ").pop())

                if (this.nameMap.has(petName)) {
                    e.getEntity().func_96094_a(e.getName().replace(petName, this.nameMap.get(petName)))
                }
            }
        })
    }
}

export default CustomPetName