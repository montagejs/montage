var Montage = require("../core").Montage,
    Enum = require("../enum").Enum,
    //Locale = require("../locale"),
    TimeZone = require("./time-zone"),
    CalendarDate = require("./calendar-date"),
    Range = require("../range").Range,
    systemTimeZone = TimeZone.systemTimeZone; //All JS Dates are in this timeZone
/**
    Calendar

    Inspired by https://developer.apple.com/documentation/foundation/nscalendar?language=objc

    An object that defines the relationships between calendar units (such as eras, years, and weekdays) and absolute points in time (Date), providing features for calculation and comparison of dates.

    Overview

    Calendar objects encapsulate information about systems of reckoning time in which the beginning, length, and divisions of a year are defined. They provide information about the calendar and support for calendrical computations such as determining the range of a given calendrical unit and adding units to a given absolute time.

    @class module:montage/core/date/calendar.Calendar
    @extends module:montage/core/core.Montage
 */

//Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Locale/calendar
var CalendarIdentifierValues = [
    "buddhist",	/* Thai Buddhist calendar */
    "chinese",	/* Traditional Chinese calendar */
    "coptic",	/* Coptic calendar */
    "dangi",	/* Traditional Korean calendar */
    "ethioaa",	/* Ethiopic calendar, Amete Alem (epoch approx. 5493 B.C.E) */
    "ethiopic",	/* Ethiopic calendar, Amete Mihret (epoch approx, 8 C.E.) */
    "gregory",	/* Gregorian calendar */
    "hebrew",	/* Traditional Hebrew calendar */
    "indian",	/* Indian calendar */
    "islamic",	/* Islamic calendar */
    "islamic-umalqura",	/* Islamic calendar, Umm al-Qura */
    "islamic-tbla",	/* Islamic calendar, tabular (intercalary years [2,5,7,10,13,16,18,21,24,26,29] - astronomical epoch) */
    "islamic-civil",	/* /* Islamic calendar, tabular (intercalary years [2,5,7,10,13,16,18,21,24,26,29] - civil epoch) */
    "islamic-rgsa",	/* /* Islamic calendar, Saudi Arabia sighting */
    "iso8601",	/* ISO calendar (Gregorian calendar using the ISO 8601 calendar week rules) */
    "japanese",	/* Japanese Imperial calendar */
    "persian",	/* Persian calendar */
    "roc"	/* Republic of China calendar */
];
exports.CalendarIdentifier = CalendarIdentifier = new Enum().initWithMembersAndValues(CalendarIdentifierValues,CalendarIdentifierValues);


var CalendarUnitNames = ["era","year","yearForWeekOfYear","quarter","month","weekOfYear","weekOfMonth","weekDay","weekDayOrdinal","day","hour","minute","second","millisecond"];

//Calendar units may be used as a bit mask to specify a combination of units.
CalendarUnitBitfieldValues = [];
for(var i=0, countI=CalendarUnitNames.length;(i<countI);i++) {
    CalendarUnitBitfieldValues[i] = 1  << i;
}
exports.CalendarUnit = CalendarIdentifier = new Enum().initWithMembersAndValues(CalendarUnitNames,CalendarUnitBitfieldValues);

var Calendar = exports.Calendar = Montage.specialize({

    /**
     * initializes a new calendar specified by a given identifier.
     *
     * @function
     * @param {CalendarIdentifier} calendarIdentifier a CalendarIdentifier.
     * @returns {Calendar} a new Calendar instance.
     */
    initWithCalendarIdentifier: {
        value: function(calendarIdentifier) {
            this.identifier = calendarIdentifier;
            //Default
            this.timeZone = TimeZone.systemTimeZone;
            return this;
        }
    },


    /**
     *  Section
     *
     *  Getting Calendar Information
    */

    /**
     * The calendar's identifier
     *
     * @property {String}
     */

    identifier: {
        value: undefined
    },


    /**
     * A promise to the calendar's time zone
     *
     * @property {Promise<TimeZone>}
     */
    timeZone: {
        value: undefined
    },

    /**
     *  Section
     *
     *  Getting the User's Calendar
    */

    /**
     * The user’s current calendar.
     *
     * @property {Calendar}
     */
    currentCalendar: {
        value: undefined
    },

    /**
     *  Section
     *
     *  CalendarDate <-> Date
    */

    /**
     * Returns an equivalent CalendarDate to aDate (in UTC / local timeZone)in Calendar's timeZone.
     *
     * @function
     * @param {Date} aDate The date for which to perform the calculation.
     * @returns {CalendarDate} true if the given date matches the given components, otherwise false.
     */
    calendarDateFromDate: {
        value: function(aDate) {

            var aCalendarDate  = CalendarDate.fromJSDate(aDate, true /*useUTC*/);
            TimeZone.convertCalendarDateFromTimeZoneToTimeZone(aCalendarDate,Timezone.utcTimezone,this.timeZone);
            return aCalendarDate;
        }
    },

    /**
     * Returns an UTC equivalent to calendarDate in Calendar's timeZone.
     *
     * @function
     * @param {CalendarDate} calendarDate The date for which to perform the calculation.
     * @returns {Date} true if the given date matches the given components, otherwise false.
     */
    dateFromCalendarDate: {
        value: function(calendarDate) {
            return calendarDate.toJSDate();
        }
    },

    /**
     * Returns an equivalent CalendarDate Range to aDate Range (in UTC / local timeZone)in Calendar's timeZone.
     *
     * @function
     * @param {Range} aDateRange The date for which to perform the calculation.
     * @returns {Range} a Range whose begin/end are CalendarDate in the calendar's timeZone.
     */
    calendarDateRangeFromDateRange: {
        value: function(aDateRange) {
            return new Range(this.calendarDateFromDate(aDateRange.begin), this.calendarDateFromDate(aDateRange.end, aDateRange.bounds));
        }
    },

    /**
     * Returns an equivalent date range in Calendar's timeZone.
     *
     * @function
     * @param {CalendarDate} calendarDate The date for which to perform the calculation.
     * @returns {Date} true if the given date matches the given components, otherwise false.
     */
    dateRangeFromCalendarDateRange: {
        value: function(calendarDateRange) {
            return new Range(this.dateFromCalendarDate(calendarDateRange.begin), this.dateFromCalendarDate(calendarDateRange.end, calendarDateRange.bounds));
        }
    },


    /**
     * Returns whether a given date matches all of the given date components.
     *
     * This method is useful for determining whether dates calculated by methods
     * like nextDateAfterDate:matchingUnit:value:options: or
     * enumerateDatesStartingAfterDate:matchingComponents:options:usingBlock: are exact,
     * or required an adjustment due to a nonexistent time.
     *
     * @function
     * @param {Date} date The date for which to perform the calculation.
     * @param {CalendarDate} CalendarDate The date components to match..
     * @returns {boolean} true if the given date matches the given components, otherwise false.
     */
    doesDateMatchComponents: {
        value: function(date, CalendarDate) {

        }
    },

    /**
     * Returns the specified date component from a given date.
     *
     * @function
     * @param {Date} date The date for which to perform the calculation.
     * @param {CalendarDate} CalendarDate The date components to match..
     * @returns {boolean} true if the given date matches the given components, otherwise false.
     */


},{
    /**
     * Creates a new calendar specified by a given identifier.
     *
     *
     * @function
     * @param {CalendarIdentifier} calendarIdentifier The module id of the HTML page to load.
     * @returns {Calendar} a new Calendar instance.
     */

    withIdentifier: {
        value: function(calendarIdentifier) {

        }
    }
});

//To avoid a cycle.
// Locale.Calendar = Calendar;
