module.exports = {
    
    firstLetterCapital: function (string) {
        return string.substr(0, 1).toUpperCase() + string.substr(1)
    },

    firstLetterWordCapital: function (string) {
        return string.split(" ").map(firstLetterCapital).join(" ")
    }

}