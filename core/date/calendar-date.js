/*

*/
var Montage = require("../core").Montage,
    ICAL = require('ical.js'),
    ICAL_Time = ICAL.Time,
    ICAL_Time_Prototype = ICAL.Time.prototype,
    CalendarDate = exports.CalendarDate = ICAL_Time,
    CalendarDatePrototype = ICAL_Time_Prototype;


/*

    TODO:
    - create a real subclass of Date, by adding the timeZone
    - use ICAL_TIME instead of inheriting from it
    - therefore constructor should be:
    new Date(timeZone)
    new Date(value,timeZone)
    new Date(dateString) //Add support for string formast with TimeZone
    new Date(year, monthIndex [, day [, hours [, minutes [, seconds [, milliseconds]]]]],timeZone)

    and as expected, not passing a TimeZone would default to TimeZone.systemTimeZone
*/


CalendarDate.getInfoForObject = function(object) {
    return Montage.getInfoForObject(object);
};


    /**
     * Adds the duration to the current time. The instance is modified in
     * place.
     *
     * @param {ICAL.Duration} aDuration         The duration to add
     */
CalendarDatePrototype.adjustComponentValues = function(year, monthIndex, day, hours, minutes, seconds, milliseconds) {

    if(milliseconds !== undefined) {
        console.warn("CalendarDate doesn't properly supports millisecons yet");
    }

    // because of the duration optimizations it is much
    // more efficient to grab all the values up front
    // then set them directly (which will avoid a normalization call).
    // So we don't actually normalize until we need it.
    var second = this.second,
        minute = this.minute,
        hour = this.hour,
        myDay = this.day,
        month = this.month,
        myYear = this.year;

    second += seconds;
    minute += minutes;
    hour += hours;
    myDay += days;
    // day += 7 * weeks;
    month += monthIndex;
    myYear += year;

    this.second = second;
    this.minute = minute;
    this.hour = hour;
    this.day = myDay;
    this.month = month;
    this.year = myYear;

    this._cachedUnixTime = null;
};

CalendarDatePrototype.calendarDateByAdjustingComponentValues = function(year, monthIndex, day, hours, minutes, seconds, milliseconds) {
    if(milliseconds !== undefined) {
        console.warn("CalendarDate doesn't properly supports millisecons yet");
    }

    var calendarDate = this.clone();
    calendarDate.adjustComponentValues(year, monthIndex, day, hours, minutes, seconds, milliseconds);
    return calendarDate;
};

CalendarDatePrototype.valueOf = function CalendarDate_valueOf() {
    return this.toUnixTime() * 1000;
};

CalendarDatePrototype.setComponentValues = function(year, monthIndex, day, hours, minutes, seconds, milliseconds, timeZone) {
    if(typeof arguments[0] !== "number" && arguments.length === 1) {
        this.fromData(arguments[0]);
    } else {
        if(milliseconds) this.millisecond = milliseconds;
        if(minutes) this.minute = minutes;
        if(hours) this.hour = hour;
        if(day) this.day = day;
        if(monthIndex) this.month = monthIndex+1;
        if(year) this.year = year;
        if(timeZone) this.timeZone = timeZone;
    }
};

CalendarDatePrototype.takeComponentValuesFromCalendarDate = function(aCalendarDate) {
    this.setComponentValues(aCalendarDate.year, aCalendarDate.month-1, aCalendarDate.day, aCalendarDate.hour, aCalendarDate.minute, aCalendarDate.second, aCalendarDate.milliseconds,aCalendarDate.timeZone);
}


Object.defineProperty(CalendarDatePrototype,"timeZone",{
    get: function() {
        return this.zone;
    },
    set: function(value) {
        this.zone = value;
    }
});

/*
    Bookmark
    https://github.com/jakubroztocil/rrule
*/

//Make CalendarDate behave like JS Date:
//TODO
// CalendarDate.UTC()
// CalendarDate.now()
// CalendarDate.parse()
CalendarDatePrototype.getDate = function() {
    return this.day;
};

CalendarDatePrototype.getDay = function() {
    return this.dayOfWeek() - 1;
};
CalendarDatePrototype.getFullYear = function() {
    return this.year;
};
CalendarDatePrototype.getHours = function() {
    return this.hour;
};
CalendarDatePrototype.getMilliseconds = function() {
    return this.millisecond || 0;
};
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

/*

CalendarDatePrototype.getTimezoneOffset =
CalendarDatePrototype.getUTCDate =
CalendarDatePrototype.getUTCDay =
CalendarDatePrototype.getUTCFullYear =
CalendarDatePrototype.getUTCHours =
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
*/
