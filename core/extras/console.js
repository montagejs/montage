/*global module: false */
if (typeof window !== "undefined") {
    document._montageTiming = document._montageTiming || {};
    document._montageTiming.loadStartTime = Date.now();
    console._groupTime = Object.create(null);
    console.groupTime = function(name) {
        var groupTimeEntry = this._groupTime[name];
        if(!groupTimeEntry) {
            groupTimeEntry = {
                count: 0,
                start: 0,
                sum:0
            };
            this._groupTime[name] = groupTimeEntry;
        }
        groupTimeEntry.start = performance.now();
    };
    console.groupTimeEnd = function(name) {
        var end = performance.now();
        var groupTimeEntry = this._groupTime[name];
        var time = end - groupTimeEntry.start;

        groupTimeEntry.count = groupTimeEntry.count+1;
        groupTimeEntry.sum = groupTimeEntry.sum+time;
    };
    console.groupTimeAverage = function(name) {
        var groupTimeEntry = this._groupTime[name];
        return groupTimeEntry.sum/groupTimeEntry.count;
    };
    console.groupTimeTotal = function(name) {
        var groupTimeEntry = this._groupTime[name];
        return groupTimeEntry.sum;
    };
    console.groupTimeCount = function(name) {
        var groupTimeEntry = this._groupTime[name];
        return groupTimeEntry.count;
    };
}

module.exports.console = global.console;