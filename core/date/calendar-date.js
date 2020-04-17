/*

*/
var Montage = require("./core").Montage,
    ICAL = require('ical.js'),
    ICAL_Time = ICAL.Time,
    ICAL_Time_Prototype = ICAL.Time.prototype,
    CalendarDate = exports.CalendarDate = ICAL_Time,
    CalendarDatePrototype = CalendarCalendarDatePrototype;


CalendarDate.getInfoForObject = function(object) {
    return Montage.getInfoForObject(object);
};


//Make CalendarDate behave like JS Date:
CalendarDate.UTC()
CalendarDate.now()
CalendarDate.parse()
CalendarDatePrototype.getDate = function() {
    return this.day;
};

CalendarDatePrototype.getDay() = function() {
    return ;
};
CalendarDatePrototype.getFullYear()
CalendarDatePrototype.getHours = function() {
    return this.hour;
};
CalendarDatePrototype.getMilliseconds()
CalendarDatePrototype.getMinutes = function() {
    return this.minute;
};
CalendarDatePrototype.getMonth = function() {
    return this.month - 1;
};
CalendarDatePrototype.getSeconds = function() {
    return this.second;
};
CalendarDatePrototype.getTime = function() {
    return this.toUnixTime() * 1000;
};

CalendarDatePrototype.getTimezoneOffset()
CalendarDatePrototype.getUTCDate()
CalendarDatePrototype.getUTCDay()
CalendarDatePrototype.getUTCFullYear()
CalendarDatePrototype.getUTCHours()
CalendarDatePrototype.getUTCMilliseconds()
CalendarDatePrototype.getUTCMinutes()
CalendarDatePrototype.getUTCMonth()
CalendarDatePrototype.getUTCSeconds()
CalendarDatePrototype.getYear()
CalendarDatePrototype.setDate()
CalendarDatePrototype.setFullYear()
CalendarDatePrototype.setHours()
CalendarDatePrototype.setMilliseconds()
CalendarDatePrototype.setMinutes()
CalendarDatePrototype.setMonth()
CalendarDatePrototype.setSeconds()
CalendarDatePrototype.setTime()
CalendarDatePrototype.setUTCDate()
CalendarDatePrototype.setUTCFullYear()
CalendarDatePrototype.setUTCHours()
CalendarDatePrototype.setUTCMilliseconds()
CalendarDatePrototype.setUTCMinutes()
CalendarDatePrototype.setUTCMonth()
CalendarDatePrototype.setUTCSeconds()
CalendarDatePrototype.setYear()
CalendarDatePrototype.toDateString()
CalendarDatePrototype.toGMTString()
CalendarDatePrototype.toISOString()
CalendarDatePrototype.toJSON()
CalendarDatePrototype.toLocaleDateString()
CalendarDatePrototype.toLocaleFormat()
CalendarDatePrototype.toLocaleString()
CalendarDatePrototype.toLocaleTimeString()
CalendarDatePrototype.toSource()
CalendarDatePrototype.toString()
CalendarDatePrototype.toTimeString()
CalendarDatePrototype.toUTCString()
CalendarDatePrototype.valueOf()
