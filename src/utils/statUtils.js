let utils = {
    getHotmLevel,
    getDungeoneeringLevel,
    getPetLevel,
    getLevelByXp,
    getBestiaryTier
}

module.exports = utils

let bossmobs = new Set()
bossmobs.add("dragon")
bossmobs.add("arachne")
bossmobs.add("headless_horseman")
bossmobs.add("magma_cube_boss")
bossmobs.add("arachne")
bossmobs.add("barbarian_duke_x")
bossmobs.add("bladesoul")
bossmobs.add("mage_outlaw")
bossmobs.add("ashfang")
bossmobs.add("corrupted_protector")

let islandmobs = new Set()
islandmobs.add("cave_spider")
islandmobs.add("enderman_private")
islandmobs.add("skeleton")
islandmobs.add("slime")
islandmobs.add("spider")
islandmobs.add("witch")
islandmobs.add("zombie")

let bestiaryData = {
    mob: [10, 15, 75, 150, 250, 500, 1500, 2500, 5000, 15000, 25000, 50000, ...(new Array(42 - 13).fill(100000))],
    boss: [2, 3, 5, 10, 10, 10, 10, 25, 25, 50, 50, 100, ...(new Array(42 - 13).fill(100))],
    private: [10, 15, 75, 150, 250]
}

function getBestiaryTier(family, kills) {
    let type = "mob"

    if (islandmobs.has(family)) type = "private"
    if (bossmobs.has(family)) type = "boss"

    let killsLeft = kills
    let data = bestiaryData[type]

    let dataI = 0
    while (dataI < data.length && killsLeft >= data[dataI]) {
        killsLeft -= data[dataI]

        dataI++
    }

    return {
        level: dataI,
        killsLeft,
        killsForNext: data[dataI] || null
    }
}
let someData = {
    leveling_xp: {
        1: 50,
        2: 125,
        3: 200,
        4: 300,
        5: 500,
        6: 750,
        7: 1000,
        8: 1500,
        9: 2000,
        10: 3500,
        11: 5000,
        12: 7500,
        13: 10000,
        14: 15000,
        15: 20000,
        16: 30000,
        17: 50000,
        18: 75000,
        19: 100000,
        20: 200000,
        21: 300000,
        22: 400000,
        23: 500000,
        24: 600000,
        25: 700000,
        26: 800000,
        27: 900000,
        28: 1000000,
        29: 1100000,
        30: 1200000,
        31: 1300000,
        32: 1400000,
        33: 1500000,
        34: 1600000,
        35: 1700000,
        36: 1800000,
        37: 1900000,
        38: 2000000,
        39: 2100000,
        40: 2200000,
        41: 2300000,
        42: 2400000,
        43: 2500000,
        44: 2600000,
        45: 2750000,
        46: 2900000,
        47: 3100000,
        48: 3400000,
        49: 3700000,
        50: 4000000,
        51: 4300000,
        52: 4600000,
        53: 4900000,
        54: 5200000,
        55: 5500000,
        56: 5800000,
        57: 6100000,
        58: 6400000,
        59: 6700000,
        60: 7000000
    },

    // XP required for each level of Runecrafting
    runecrafting_xp: {
        1: 50,
        2: 100,
        3: 125,
        4: 160,
        5: 200,
        6: 250,
        7: 315,
        8: 400,
        9: 500,
        10: 625,
        11: 785,
        12: 1000,
        13: 1250,
        14: 1600,
        15: 2000,
        16: 2465,
        17: 3125,
        18: 4000,
        19: 5000,
        20: 6200,
        21: 7800,
        22: 9800,
        23: 12200,
        24: 15300,
        25: 19050,
    },

    dungeoneering_xp: {
        1: 50,
        2: 75,
        3: 110,
        4: 160,
        5: 230,
        6: 330,
        7: 470,
        8: 670,
        9: 950,
        10: 1340,
        11: 1890,
        12: 2665,
        13: 3760,
        14: 5260,
        15: 7380,
        16: 10300,
        17: 14400,
        18: 20000,
        19: 27600,
        20: 38000,
        21: 52500,
        22: 71500,
        23: 97000,
        24: 132000,
        25: 180000,
        26: 243000,
        27: 328000,
        28: 445000,
        29: 600000,
        30: 800000,
        31: 1065000,
        32: 1410000,
        33: 1900000,
        34: 2500000,
        35: 3300000,
        36: 4300000,
        37: 5600000,
        38: 7200000,
        39: 9200000,
        40: 12000000,
        41: 15000000,
        42: 19000000,
        43: 24000000,
        44: 30000000,
        45: 38000000,
        46: 48000000,
        47: 60000000,
        48: 75000000,
        49: 93000000,
        50: 116250000,
    },

    guild_xp: [
        100000,
        150000,
        250000,
        500000,
        750000,
        1000000,
        1250000,
        1500000,
        2000000,
        2500000,
        2500000,
        2500000,
        2500000,
        2500000,
        3000000,
    ],

    // total XP required for level of Slayer
    slayer_xp: {
        zombie: {
            1: 5,
            2: 15,
            3: 200,
            4: 1000,
            5: 5000,
            6: 20000,
            7: 100000,
            8: 400000,
            9: 1000000,
        },
        spider: {
            1: 5,
            2: 15,
            3: 200,
            4: 1000,
            5: 5000,
            6: 20000,
            7: 100000,
            8: 400000,
            9: 1000000,
        },
        wolf: {
            1: 5,
            2: 15,
            3: 200,
            4: 1500,
            5: 5000,
            6: 20000,
            7: 100000,
            8: 400000,
            9: 1000000,
        },
        enderman: {
            1: 5,
            2: 15,
            3: 200,
            4: 1500,
            5: 5000,
            6: 20000,
            7: 100000,
            8: 400000,
            9: 1000000,
        }
    },

    slayer_boss_xp: {
        1: 5,
        2: 25,
        3: 100,
        4: 500,
    },
};


function getLevelByXp(xp, type, levelCap) {
    let xp_table =
        type == 1 ?
            someData.runecrafting_xp :
            type == 2 ?
                someData.dungeoneering_xp :
                someData.leveling_xp;

    if (isNaN(xp)) {
        return {
            xp: 0,
            level: 0,
            xpCurrent: 0,
            xpForNext: xp_table[1],
            progress: 0,
        };
    }

    let xpTotal = 0;
    let level = 0;

    let xpForNext = Infinity;

    let maxLevel = Math.min(levelCap, Object.keys(xp_table)
        .sort((a, b) => Number(a) - Number(b))
        .map((a) => Number(a))
        .pop())

    for (let x = 1; x <= maxLevel; x++) {
        xpTotal += xp_table[x];

        if (xpTotal > xp) {
            xpTotal -= xp_table[x];
            break;
        } else {
            level = x;
        }
    }

    let xpCurrent = Math.floor(xp - xpTotal);

    if (level < maxLevel) xpForNext = Math.ceil(xp_table[level + 1]);

    let progress = Math.max(0, Math.min(xpCurrent / xpForNext, 1));


    if (type === 2 && level === 50) {
        while (level < levelCap && xpCurrent > 200000000) {
            level++
            xpCurrent -= 200000000
        }
        if (level < levelCap) {
            progress = xpCurrent / 200000000
            xpForNext = 200000000
        } else {
            progress = 0
            xpForNext = NaN
        }
    }
    if (type === 0 && level === 60 && levelCap === Infinity) {
        maxLevel = Infinity
        let slope = 600000
        let xpForCurr = 7000000 + slope
        while (xpCurrent > xpForCurr) {
            level++
            xpCurrent -= xpForCurr
            xpForCurr += slope
            if (level % 10 === 0) slope *= 2
        }

        progress = xpCurrent / xpForCurr
        xpForNext = xpForCurr
    }
    return {
        xp,
        level,
        maxLevel,
        xpCurrent,
        xpForNext,
        progress,
    };
}

function getSlayerLevel(xp) {
    let levelR = 0;

    Object.keys(someData.slayer_xp.zombie).forEach(level => {
        if (someData.slayer_xp.zombie[level] < xp && parseInt(level) > levelR) {
            levelR = parseInt(level)
        }
    })

    return levelR;
}
function getSlayerLevelClaimed(slayer) {
    let {
        claimed_levels
    } = slayer;

    let level = 0;

    for (let level_name in claimed_levels) {
        let _level = parseInt(level_name.split("_").pop());

        if (_level > level) level = _level;
    }

    return level;
}

function getDungeoneeringLevel(xp, isCata) {
    let a = getLevelByXp(xp, 2, isCata ? Infinity : 50);

    return a.level + a.progress;
}


function firstLetterCapital(string) {
    return string.substr(0, 1).toUpperCase() + string.substr(1)
}

function firstLetterWordCapital(string) {
    return string.split(" ").map(firstLetterCapital).join(" ")
}

function getPetLevel(pet) {
    let maxLevel = (pet.type === "GOLDEN_DRAGON") ? 200 : 100
    const rarityOffset = constants.pet_rarity_offset[pet.tier.toLowerCase()];
    const levels = constants.pet_levels.slice(rarityOffset, rarityOffset + maxLevel - 1);

    const xpMaxLevel = levels.reduce((a, b) => a + b, 0);
    let xpTotal = 0;
    let level = 1;

    let xpForNext = Infinity;

    for (let i = 0; i < maxLevel; i++) {
        xpTotal += levels[i];

        if (xpTotal > pet.exp) {
            xpTotal -= levels[i];
            break;
        } else {
            level++;
        }
    }

    let xpCurrent = Math.floor(pet.exp - xpTotal);
    let progress;

    if (level < maxLevel) {
        xpForNext = Math.ceil(levels[level - 1]);
        progress = Math.max(0, Math.min(xpCurrent / xpForNext, 1));
    } else {
        level = maxLevel;
        xpCurrent = pet.exp - levels[maxLevel - 1];
        xpForNext = 0;
        progress = 1;
    }

    return {
        level,
        xpCurrent,
        xpForNext,
        progress,
        xpMaxLevel,
    };
}

let constants = {
    pet_rarity_offset: {
        common: 0,
        uncommon: 6,
        rare: 11,
        epic: 16,
        legendary: 20,
        mythic: 20,
    },

    pet_levels: [
        100, 110, 120, 130, 145, 160, 175, 190, 210, 230, 250, 275, 300, 330, 360, 400, 440, 490, 540, 600, 660, 730, 800,
        880, 960, 1050, 1150, 1260, 1380, 1510, 1650, 1800, 1960, 2130, 2310, 2500, 2700, 2920, 3160, 3420, 3700, 4000, 4350,
        4750, 5200, 5700, 6300, 7000, 7800, 8700, 9700, 10800, 12000, 13300, 14700, 16200, 17800, 19500, 21300, 23200, 25200,
        27400, 29800, 32400, 35200, 38200, 41400, 44800, 48400, 52200, 56200, 60400, 64800, 69400, 74200, 79200, 84700, 90700,
        97200, 104200, 111700, 119700, 128200, 137200, 146700, 156700, 167700, 179700, 192700, 206700, 221700, 237700, 254700,
        272700, 291700, 311700, 333700, 357700, 383700, 411700, 441700, 476700, 516700, 561700, 611700, 666700, 726700,
        791700, 861700, 936700, 1016700, 1101700, 1191700, 1286700, 1386700, 1496700, 1616700, 1746700, 1886700,
        // Values below for above level 100 (legendary) are just guessed
        0, 1, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
        1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
        1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
        1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
        1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
        1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
        1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
        1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
    ],

    pet_levels_accum: [
        100,
        110,
        120,
        130,
        145,
        160,
        175,
        190,
        210,
        230,
        250,
        275,
        300,
        330,
        360,
        400,
        440,
        490,
        540,
        600,
        660,
        730,
        800,
        880,
        960,
        1050,
        1150,
        1260,
        1380,
        1510,
        1650,
        1800,
        1960,
        2130,
        2310,
        2500,
        2700,
        2920,
        3160,
        3420,
        3700,
        4000,
        4350,
        4750,
        5200,
        5700,
        6300,
        7000,
        7800,
        8700,
        9700,
        10800,
        12000,
        13300,
        14700,
        16200,
        17800,
        19500,
        21300,
        23200,
        25200,
        27400,
        29800,
        32400,
        35200,
        38200,
        41400,
        44800,
        48400,
        52200,
        56200,
        60400,
        64800,
        69400,
        74200,
        79200,
        84700,
        90700,
        97200,
        104200,
        111700,
        119700,
        128200,
        137200,
        146700,
        156700,
        167700,
        179700,
        192700,
        206700,
        221700,
        237700,
        254700,
        272700,
        291700,
        311700,
        333700,
        357700,
        383700,
        411700,
        441700,
        476700,
        516700,
        561700,
        611700,
        666700,
        726700,
        791700,
        861700,
        936700,
        1016700,
        1101700,
        1191700,
        1286700,
        1386700,
        1496700,
        1616700,
        1746700,
        1886700
    ],

    pet_data: {
        "BAT": {
            head: "/head/382fc3f71b41769376a9e92fe3adbaac3772b999b219c9d6b4680ba9983e527",
            type: "mining",
            emoji: "🦇"
        },
        "BLAZE": {
            head: "/head/b78ef2e4cf2c41a2d14bfde9caff10219f5b1bf5b35a49eb51c6467882cb5f0",
            type: "combat",
            emoji: "🔥"
        },
        "CHICKEN": {
            head: "/head/7f37d524c3eed171ce149887ea1dee4ed399904727d521865688ece3bac75e",
            type: "farming",
            emoji: "🐔"
        },
        "HORSE": {
            head: "/head/36fcd3ec3bc84bafb4123ea479471f9d2f42d8fb9c5f11cf5f4e0d93226",
            type: "combat",
            emoji: "🐴"
        },
        "JERRY": {
            head: "/head/822d8e751c8f2fd4c8942c44bdb2f5ca4d8ae8e575ed3eb34c18a86e93b",
            type: "combat",
            emoji: "🧑"
        },
        "OCELOT": {
            head: "/head/5657cd5c2989ff97570fec4ddcdc6926a68a3393250c1be1f0b114a1db1",
            type: "foraging",
            emoji: "🐈"
        },
        "PIGMAN": {
            head: "/head/63d9cb6513f2072e5d4e426d70a5557bc398554c880d4e7b7ec8ef4945eb02f2",
            type: "combat",
            emoji: "🐷"
        },
        "RABBIT": {
            head: "/head/117bffc1972acd7f3b4a8f43b5b6c7534695b8fd62677e0306b2831574b",
            type: "farming",
            emoji: "🐇"
        },
        "SHEEP": {
            head: "/head/64e22a46047d272e89a1cfa13e9734b7e12827e235c2012c1a95962874da0",
            type: "alchemy",
            emoji: "🐑"
        },
        "SILVERFISH": {
            head: "/head/da91dab8391af5fda54acd2c0b18fbd819b865e1a8f1d623813fa761e924540",
            type: "mining",
            emoji: "🐛"
        },
        "WITHER_SKELETON": {
            head: "/head/f5ec964645a8efac76be2f160d7c9956362f32b6517390c59c3085034f050cff",
            type: "mining",
            emoji: "💀"
        },
        "SKELETON_HORSE": {
            head: "/head/47effce35132c86ff72bcae77dfbb1d22587e94df3cbc2570ed17cf8973a",
            type: "combat",
            emoji: "🐴"
        },
        "WOLF": {
            head: "/head/dc3dd984bb659849bd52994046964c22725f717e986b12d548fd169367d494",
            type: "combat",
            emoji: "🐺"
        },
        "ENDERMAN": {
            head: "/head/6eab75eaa5c9f2c43a0d23cfdce35f4df632e9815001850377385f7b2f039ce1",
            type: "combat",
            emoji: "🔮"
        },
        "PHOENIX": {
            head: "/head/23aaf7b1a778949696cb99d4f04ad1aa518ceee256c72e5ed65bfa5c2d88d9e",
            type: "combat",
            emoji: "🐦"
        },
        "MAGMA_CUBE": {
            head: "/head/38957d5023c937c4c41aa2412d43410bda23cf79a9f6ab36b76fef2d7c429",
            type: "combat",
            emoji: "🌋"
        },
        "FLYING_FISH": {
            head: "/head/40cd71fbbbbb66c7baf7881f415c64fa84f6504958a57ccdb8589252647ea",
            type: "fishing",
            emoji: "🐟"
        },
        "BLUE_WHALE": {
            head: "/head/dab779bbccc849f88273d844e8ca2f3a67a1699cb216c0a11b44326ce2cc20",
            type: "fishing",
            emoji: "🐋"
        },
        "TIGER": {
            head: "/head/fc42638744922b5fcf62cd9bf27eeab91b2e72d6c70e86cc5aa3883993e9d84",
            type: "combat",
            emoji: "🐯"
        },
        "LION": {
            head: "/head/38ff473bd52b4db2c06f1ac87fe1367bce7574fac330ffac7956229f82efba1",
            type: "foraging",
            emoji: "🦁"
        },
        "PARROT": {
            head: "/head/5df4b3401a4d06ad66ac8b5c4d189618ae617f9c143071c8ac39a563cf4e4208",
            type: "alchemy",
            emoji: "🦜"
        },
        "SNOWMAN": {
            head: "/head/11136616d8c4a87a54ce78a97b551610c2b2c8f6d410bc38b858f974b113b208",
            type: "combat",
            emoji: "⛄"
        },
        "TURTLE": {
            head: "/head/212b58c841b394863dbcc54de1c2ad2648af8f03e648988c1f9cef0bc20ee23c",
            type: "combat",
            emoji: "🐢"
        },
        "BEE": {
            head: "/head/7e941987e825a24ea7baafab9819344b6c247c75c54a691987cd296bc163c263",
            type: "farming",
            emoji: "🐝"
        },
        "ENDER_DRAGON": {
            head: "/head/aec3ff563290b13ff3bcc36898af7eaa988b6cc18dc254147f58374afe9b21b9",
            type: "combat",
            emoji: "🐲"
        },
        "GUARDIAN": {
            head: "/head/221025434045bda7025b3e514b316a4b770c6faa4ba9adb4be3809526db77f9d",
            type: "combat",
            emoji: "🐡"
        },
        "SQUID": {
            head: "/head/01433be242366af126da434b8735df1eb5b3cb2cede39145974e9c483607bac",
            type: "fishing",
            emoji: "🦑"
        },
        "GIRAFFE": {
            head: "/head/176b4e390f2ecdb8a78dc611789ca0af1e7e09229319c3a7aa8209b63b9",
            type: "foraging",
            emoji: "🦒"
        },
        "ELEPHANT": {
            head: "/head/7071a76f669db5ed6d32b48bb2dba55d5317d7f45225cb3267ec435cfa514",
            type: "farming",
            emoji: "🐘"
        },
        "MONKEY": {
            head: "/head/13cf8db84807c471d7c6922302261ac1b5a179f96d1191156ecf3e1b1d3ca",
            type: "foraging",
            emoji: "🐒"
        },
        "SPIDER": {
            head: "/head/cd541541daaff50896cd258bdbdd4cf80c3ba816735726078bfe393927e57f1",
            type: "combat",
            emoji: "🕷️"
        },
        "ENDERMITE": {
            head: "/head/5a1a0831aa03afb4212adcbb24e5dfaa7f476a1173fce259ef75a85855",
            type: "mining",
            emoji: "🐛"
        },
        "GHOUL": {
            head: "/head/87934565bf522f6f4726cdfe127137be11d37c310db34d8c70253392b5ff5b",
            type: "combat",
            emoji: "🧟"
        },
        "JELLYFISH": {
            head: "/head/913f086ccb56323f238ba3489ff2a1a34c0fdceeafc483acff0e5488cfd6c2f1",
            type: "alchemy",
            emoji: "🎐"
        },
        "PIG": {
            head: "/head/621668ef7cb79dd9c22ce3d1f3f4cb6e2559893b6df4a469514e667c16aa4",
            type: "farming",
            emoji: "🐷"
        },
        "ROCK": {
            head: "/head/cb2b5d48e57577563aca31735519cb622219bc058b1f34648b67b8e71bc0fa",
            type: "mining",
            emoji: "🗿"
        },
        "SKELETON": {
            head: "/head/fca445749251bdd898fb83f667844e38a1dff79a1529f79a42447a0599310ea4",
            type: "combat",
            emoji: "💀"
        },
        "ZOMBIE": {
            head: "/head/56fc854bb84cf4b7697297973e02b79bc10698460b51a639c60e5e417734e11",
            type: "combat",
            emoji: "🧟"
        },
        "DOLPHIN": {
            head: "/head/cefe7d803a45aa2af1993df2544a28df849a762663719bfefc58bf389ab7f5",
            type: "fishing",
            emoji: "🐬"
        },
        "BABY_YETI": {
            head: "/head/ab126814fc3fa846dad934c349628a7a1de5b415021a03ef4211d62514d5",
            type: "fishing",
            emoji: "❄️"
        },
        "GOLEM": {
            head: "/head/89091d79ea0f59ef7ef94d7bba6e5f17f2f7d4572c44f90f76c4819a714",
            type: "combat",
            emoji: "🗿"
        },
        "HOUND": {
            head: "/head/b7c8bef6beb77e29af8627ecdc38d86aa2fea7ccd163dc73c00f9f258f9a1457",
            type: "combat",
            emoji: "👹"
        },
        "TARANTULA": {
            head: "/head/8300986ed0a04ea79904f6ae53f49ed3a0ff5b1df62bba622ecbd3777f156df8",
            type: "combat",
            emoji: "🕸️"
        },
        "BLACK_CAT": {
            head: "/head/e4b45cbaa19fe3d68c856cd3846c03b5f59de81a480eec921ab4fa3cd81317",
            type: "combat",
            emoji: "🐱"
        },
        "MEGALODON": {
            head: null,
            type: "combat",
            emoji: "🐬"
        }
    },

    pet_value: {
        "common": 1,
        "uncommon": 2,
        "rare": 3,
        "epic": 4,
        "legendary": 5
    },

    pet_rewards: {
        0: {
            magic_find: 0
        },
        10: {
            magic_find: 1
        },
        25: {
            magic_find: 2
        },
        50: {
            magic_find: 3
        },
        75: {
            magic_find: 4
        },
        100: {
            magic_find: 5
        },
        130: {
            magic_find: 6
        },
        175: {
            magic_find: 7
        }
    },

    pet_items: {
        PET_ITEM_ALL_SKILLS_BOOST_COMMON: {
            description: "§7Gives +§a10% §7pet exp for all skills",
            xpBoost: 0.1,
            xpBoostType: "all"
        },
        PET_ITEM_BIG_TEETH_COMMON: {
            description: "§7Increases §9Crit Chance §7by §a5%",
            stats: {
                crit_chance: 5
            },
            xpBoost: 0,
            xpBoostType: "all"
        },
        PET_ITEM_IRON_CLAWS_COMMON: {
            description: "§7Increases the pet's §9Crit Damage §7by §a40% §7and §9Crit Chance §7by §a40%",
            xpBoost: 0,
            xpBoostType: "all"
        },
        PET_ITEM_SHARPENED_CLAWS_UNCOMMON: {
            description: "§7Increases §9Crit Damage §7by §a15%",
            stats: {
                crit_damage: 15
            },
            xpBoost: 0,
            xpBoostType: "all"
        },
        PET_ITEM_HARDENED_SCALES_UNCOMMON: {
            description: "§7Increases §aDefense §7by §a25",
            stats: {
                defense: 25
            },
            xpBoost: 0,
            xpBoostType: "all"
        },
        PET_ITEM_BUBBLEGUM: {
            description: "§7Your pet fuses its power with placed §aOrbs §7to give them §a2x §7duration",
            xpBoost: 0,
            xpBoostType: "all"
        },
        PET_ITEM_LUCKY_CLOVER: {
            description: "§7Increases §bMagic Find §7by §a7",
            stats: {
                magic_find: 7
            },
            xpBoost: 0,
            xpBoostType: "all"
        },
        PET_ITEM_TEXTBOOK: {
            description: "§7Increases the pet's §bIntelligence §7by §a100%",
            xpBoost: 0,
            xpBoostType: "all"
        },
        PET_ITEM_SADDLE: {
            description: "§7Increase horse speed by §a50% §7 and jump boost by §a100%",
            xpBoost: 0,
            xpBoostType: "all"
        },
        PET_ITEM_EXP_SHARE: {
            description: "§7While unequipped this pet gains §a25% §7of the equipped pet's xp, this is §7split between all pets holding the item.",
            xpBoost: 0,
            xpBoostType: "all"
        },
        PET_ITEM_TIER_BOOST: {
            description: "§7Boosts the §ararity §7of your pet by 1 tier!",
            xpBoost: 0,
            xpBoostType: "all"
        },
        PET_ITEM_COMBAT_SKILL_BOOST_COMMON: {
            description: "§7Gives +§a20% §7pet exp for Combat",
            xpBoost: 0.2,
            xpBoostType: "combat"
        },
        PET_ITEM_COMBAT_SKILL_BOOST_UNCOMMON: {
            description: "§7Gives +§a30% §7pet exp for Combat",
            xpBoost: 0.3,
            xpBoostType: "combat"
        },
        PET_ITEM_COMBAT_SKILL_BOOST_RARE: {
            description: "§7Gives +§a40% §7pet exp for Combat",
            xpBoost: 0.4,
            xpBoostType: "combat"
        },
        PET_ITEM_COMBAT_SKILL_BOOST_EPIC: {
            description: "§7Gives +§a50% §7pet exp for Combat",
            xpBoost: 0.5,
            xpBoostType: "combat"
        },
        PET_ITEM_FISHING_SKILL_BOOST_COMMON: {
            description: "§7Gives +§a20% §7pet exp for Fishing",
            xpBoost: 0.2,
            xpBoostType: "fishing"
        },
        PET_ITEM_FISHING_SKILL_BOOST_UNCOMMON: {
            description: "§7Gives +§a30% §7pet exp for Fishing",
            xpBoost: 0.3,
            xpBoostType: "fishing"
        },
        PET_ITEM_FISHING_SKILL_BOOST_RARE: {
            description: "§7Gives +§a40% §7pet exp for Fishing",
            xpBoost: 0.4,
            xpBoostType: "fishing"
        },
        PET_ITEM_FISHING_SKILL_BOOST_EPIC: {
            description: "§7Gives +§a50% §7pet exp for Fishing",
            xpBoost: 0.5,
            xpBoostType: "fishing"
        },
        PET_ITEM_FORAGING_SKILL_BOOST_COMMON: {
            description: "§7Gives +§a20% §7pet exp for Foraging",
            xpBoost: 0.2,
            xpBoostType: "foraging"
        },
        PET_ITEM_FORAGING_SKILL_BOOST_UNCOMMON: {
            description: "§7Gives +§a30% §7pet exp for Foraging",
            xpBoost: 0.3,
            xpBoostType: "foraging"
        },
        PET_ITEM_FORAGING_SKILL_BOOST_RARE: {
            description: "§7Gives +§a40% §7pet exp for Foraging",
            xpBoost: 0.4,
            xpBoostType: "foraging"
        },
        PET_ITEM_FORAGING_SKILL_BOOST_EPIC: {
            description: "§7Gives +§a50% §7pet exp for Foraging",
            xpBoost: 0.5,
            xpBoostType: "foraging"
        },
        PET_ITEM_MINING_SKILL_BOOST_COMMON: {
            description: "§7Gives +§a20% §7pet exp for Mining",
            xpBoost: 0.2,
            xpBoostType: "mining"
        },
        PET_ITEM_MINING_SKILL_BOOST_UNCOMMON: {
            description: "§7Gives +§a30% §7pet exp for Mining",
            xpBoost: 0.3,
            xpBoostType: "mining"
        },
        PET_ITEM_MINING_SKILL_BOOST_RARE: {
            description: "§7Gives +§a40% §7pet exp for Mining",
            xpBoost: 0.4,
            xpBoostType: "mining"
        },
        PET_ITEM_MINING_SKILL_BOOST_EPIC: {
            description: "§7Gives +§a50% §7pet exp for Mining",
            xpBoost: 0.5,
            xpBoostType: "mining"
        },
        PET_ITEM_FARMING_SKILL_BOOST_COMMON: {
            description: "§7Gives +§a20% §7pet exp for Farming",
            xpBoost: 0.2,
            xpBoostType: "farming"
        },
        PET_ITEM_FARMING_SKILL_BOOST_UNCOMMON: {
            description: "§7Gives +§a30% §7pet exp for Farming",
            xpBoost: 0.3,
            xpBoostType: "farming"
        },
        PET_ITEM_FARMING_SKILL_BOOST_RARE: {
            description: "§7Gives +§a40% §7pet exp for Farming",
            xpBoost: 0.4,
            xpBoostType: "farming"
        },
        PET_ITEM_FARMING_SKILL_BOOST_EPIC: {
            description: "§7Gives +§a50% §7pet exp for Farming",
            xpBoost: 0.5,
            xpBoostType: "farming"
        }
    }
}

let weightData = {
    /*
      All weight calculations are provided by Senither(https://github.com/Senither/)
    */
    skillWeight: {
        // Maxes out mining at 1,750 points at 60.
        mining: {
            exponent: 1.18207448,
            divider: 259634,
            maxLevel: 60,
        },
        // Maxes out foraging at 850 points at level 50.
        foraging: {
            exponent: 1.232826,
            divider: 259634,
            maxLevel: 50,
        },
        // Maxes out enchanting at 450 points at level 60.
        enchanting: {
            exponent: 0.96976583,
            divider: 882758,
            maxLevel: 60,
        },
        // Maxes out farming at 2,200 points at level 60.
        farming: {
            exponent: 1.217848139,
            divider: 220689,
            maxLevel: 60,
        },
        // Maxes out combat at 1,500 points at level 60.
        combat: {
            exponent: 1.15797687265,
            divider: 275862,
            maxLevel: 60,
        },
        // Maxes out fishing at 2,500 points at level 50.
        fishing: {
            exponent: 1.406418,
            divider: 88274,
            maxLevel: 50,
        },
        // Maxes out alchemy at 200 points at level 50.
        alchemy: {
            exponent: 1.0,
            divider: 1103448,
            maxLevel: 50,
        },
        // Maxes out taming at 500 points at level 50.
        taming: {
            exponent: 1.14744,
            divider: 441379,
            maxLevel: 50,
        },
        // Sets up carpentry and runecrafting without any weight components.
        carpentry: {
            maxLevel: 50,
        },
        runecrafting: {
            maxLevel: 25,
        },
    },
    dungeonsWeight: {
        catacombs: 0.0002149604615,
        healer: 0.0000045254834,
        mage: 0.0000045254834,
        berserk: 0.0000045254834,
        archer: 0.0000045254834,
        tank: 0.0000045254834,
    },
    slayerWeight: {
        zombie: {
            divider: 2208,
            modifier: 0.15,
        },
        spider: {
            divider: 2118,
            modifier: 0.08,
        },
        wolf: {
            divider: 1962,
            modifier: 0.015,
        },
        enderman: {
            divider: 1430,
            modifier: 0.017,
        },
    },
}


const level50SkillExp = 55172425;
const level60SkillExp = 111672425;
function calcSkillWeight(skillGroup, level, experience) {
    if (skillGroup.exponent == undefined || skillGroup.divider == undefined) {
        return {
            weight: 0,
            weight_overflow: 0,
        };
    }

    let maxSkillLevelXP = skillGroup.maxLevel == 60 ? level60SkillExp : level50SkillExp;

    let base = Math.pow(level * 10, 0.5 + skillGroup.exponent + level / 100) / 1250;
    if (experience > maxSkillLevelXP) {
        base = Math.round(base);
    }

    if (experience <= maxSkillLevelXP) {
        return {
            weight: base,
            weight_overflow: 0,
        };
    }

    return {
        weight: base,
        weight_overflow: Math.pow((experience - maxSkillLevelXP) / skillGroup.divider, 0.968),
    };
}

function calcSlayerWeight(type, experience) {
    const slayerWeight = weightData.slayerWeight[type];

    if (!experience || experience <= 1000000) {
        return {
            weight: !experience ? 0 : experience / slayerWeight.divider, // for some reason experience can be undefined
            weight_overflow: 0,
        };
    }

    let base = 1000000 / slayerWeight.divider;
    let remaining = experience - 1000000;

    let modifier = slayerWeight.modifier;
    let overflow = 0;

    while (remaining > 0) {
        let left = Math.min(remaining, 1000000);

        overflow += Math.pow(left / (slayerWeight.divider * (1.5 + modifier)), 0.942);
        modifier += slayerWeight.modifier;
        remaining -= left;
    }

    return {
        weight: base,
        weight_overflow: overflow,
    };
}


function calcDungeonsWeight(type, level, experience) {
    if (type.startsWith("master_")) {
        return {
            weight: 0,
            weight_overflow: 0,
        };
    }

    let percentageModifier = weightData.dungeonsWeight[type];
    let level50Experience = 569809640;

    let base = Math.pow(level, 4.5) * percentageModifier;

    if (experience <= level50Experience) {
        return {
            weight: base,
            weight_overflow: 0,
        };
    }

    let remaining = experience - level50Experience;
    let splitter = (4 * level50Experience) / base;

    return {
        weight: Math.floor(base),
        weight_overflow: Math.pow(remaining / splitter, 0.968),
    };
}

let hotmExps = [
    0,
    3000,
    9000,
    25000,
    60000,
    100000,
    150000
]
function getHotmLevel(exp) {
    let level = 0
    let expLeft = exp
    let res = undefined
    hotmExps.forEach((needed) => {
        if (expLeft > needed) {
            expLeft -= needed
            level++
        } else if (!res) {
            res = {
                level: level,
                expLeft: expLeft,
                expToNext: needed - expLeft,
                progress: expLeft / needed,
                totalExp: exp
            }
        }
    })
    if (!res) {
        res = {
            level: level,
            expLeft: undefined,
            expToNext: undefined,
            progress: 0,
            totalExp: exp
        }
    }

    return res
}