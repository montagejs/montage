/*
    Time Zones definitions at:

    https://hg.mozilla.org/comm-central/raw-file/tip/calendar/timezones/zones.json

*/
var TimeZone = require("./time-zone-core").TimeZone
    CalendarDate = require("./calendar-date").CalendarDate,
    TimeZonePrototype = TimeZone.prototype;


exports.TimeZone = TimeZone;
/**
 * Returns an equivalent CalendarDate to aDate (in UTC / local timeZone)in Calendar's timeZone.
 *
 * @function
 * @param {Date} aDate The date for which to perform the calculation.
 * @returns {CalendarDate} true if the given date matches the given components, otherwise false.
 */

Object.defineProperty(Date.prototype, "calendarDateInTimeZone", {
    value: function (timeZone) {
        var aCalendarDate  = CalendarDate.fromJSDate(this, true /*useUTC*/);
        TimeZone.convertCalendarDateFromTimeZoneToTimeZone(aCalendarDate,TimeZone.utcTimezone,timeZone);
        aCalendarDate.zone = timeZone;
        return aCalendarDate;
    },
    enumerable: false,
    writable: true,
    configurable: true
});
