let utils = {
    numberWithCommas: function (x) {
        if (x === undefined) { return "" }
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    },
    addNotation: function (type, value, joiner = "") {
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
                        returnVal = +returnVal.toFixed(o - 1) + joiner + notValue;
                    }
                    checkNum *= 10;
                }
            }
        } else {
            returnVal = this.numberWithCommas(value.toFixed(0));
        }

        return returnVal;
    },
    timeSince: function (date) {
        if (typeof date !== 'object') {
            date = new Date(date);
        }

        var seconds = Math.floor((new Date() - date) / 1000);
        var intervalType;

        var interval = Math.floor(seconds / 31536000);
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            intervalType = 'd';
        } else {
            interval = Math.floor(seconds / 3600);
            if (interval >= 1) {
                intervalType = "h";
            } else {
                interval = Math.floor(seconds / 60);
                if (interval >= 1) {
                    intervalType = "m";
                } else {
                    interval = seconds;
                    intervalType = "s";
                }
            }
        }

        return interval + '' + intervalType;
    },
    timeSince2: (date) => {
        let time = Date.now() - date

        if (time > 30 * 60000) {
            return utils.timeNumber2(time)
        }
        return utils.timeNumber(time)
    },
    timeNumber: (time, secondDecimals = 0) => {
        let mins = Math.floor(time / 1000 / 60)
        let secs = (time / 1000) % 60

        if (mins === 0) return `${secs.toFixed(secondDecimals)}s`
        return `${mins}m ${secs.toFixed(secondDecimals)}s`
    },
    timeNumber2: (time) => {
        let hours = Math.floor(time / 1000 / 60 / 60)
        let mins = Math.floor(time / 1000 / 60) % 60

        if (hours === 0) return mins + "m"
        return `${hours}h ${mins}m`
    },
    basiclyEqual: (num1, num2, dist = 0.01) => {
        return Math.abs(num1 - num2) < dist
    }
}
module.exports = utils
