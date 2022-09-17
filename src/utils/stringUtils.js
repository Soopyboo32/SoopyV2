module.exports = {
    
    firstLetterCapital: firstLetterCapital,

    firstLetterWordCapital: firstLetterWordCapital

}

function firstLetterCapital(string) {
    return string.substr(0, 1).toUpperCase() + string.substr(1)
}

function firstLetterWordCapital(string) {
    return string.split(" ").map(firstLetterCapital).join(" ")
}