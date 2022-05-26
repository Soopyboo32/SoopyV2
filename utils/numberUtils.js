module.exports = {
    numberWithCommas: function (x) {
        if (x === undefined) { return "" }
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    },
    addNotation: function (type, value) {
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
    timeSince2: function (date) {
        let time = Date.now() - date

        if (time > 30 * 60000) {
            return this.timeNumber2(time)
        }
        return this.timeNumber(time)
    },
    timeNumber: function (time) {
        let mins = Math.floor(time / 1000 / 60)
        let secs = Math.floor(time / 1000) % 60

        if (mins === 0) return secs + "s"
        return `${mins}m ${secs}s`
    },
    timeNumber2: function (time) {
        let hours = Math.floor(time / 1000 / 60 / 60)
        let mins = Math.floor(time / 1000 / 60) % 60

        if (hours === 0) return mins + "m"
        return `${hours}h ${mins}m`
    }
}