let sid = 0

export let AI_STATE = {
    STANDING: sid++,
    SITTING: sid++,
    TRAVELING_TO_OWNER: sid++,
    FLYING: sid++,
    FLIPPING: sid++,
    TRAVELING_TO_POSITION: sid++
}
sid = 0
export let ANIMATION_STATE = {
    STANDING: sid++,
    FLYING: sid++,
    WALKING: sid++,
    FLIPPING: sid++
}