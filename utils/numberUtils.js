module.exports = {
    numberWithCommas: function(x){
        if (x === undefined) { return "" }
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    },
    addNotation: function(type, value) {
        let returnVal = value;
        let notList = [];
        if (type === "shortScale") {
            //notation type
            //do notation stuff here
            notList = [
                " Thousand",
                " Million",
                " Billion",
                " Trillion",
                " Quadrillion",
                " Quintillion"
            ];
        }

        if (type === "oneLetters") {
            notList = [" K", " M", " B", " T"];
        }

        let checkNum = 1000;

        if (type !== "none" && type !== "commas") {
            let notValue = notList[notList.length - 1];
            for (let u = notList.length; u >= 1; u--) {
                notValue = notList.shift();
                for (let o = 3; o >= 1; o--) {
                    if (value >= checkNum) {
                        returnVal = value / (checkNum / 100);
                        returnVal = Math.floor(returnVal);
                        returnVal = (returnVal / Math.pow(10, o)) * 10;
                        returnVal = +returnVal.toFixed(o - 1) + notValue;
                    }
                    checkNum *= 10;
                }
            }
        } else {
            returnVal = this.numberWithCommas(value.toFixed(0));
        }

        return returnVal;
    }
}