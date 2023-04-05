/*
    Time Zones definitions at:

    https://hg.mozilla.org/comm-central/raw-file/tip/calendar/timezones/zones.json

*/
// require("ical.js/lib/ical/helpers");
// require("ical.js/lib/ical/component");
// require("ical.js/lib/ical/design");
// require("ical.js/lib/ical/property");
// require("ical.js/lib/ical/parse");
// require("ical.js/lib/ical/timezone");
// require("ical.js/lib/ical/timezone_service");
// require("ical.js/lib/ical/time");
// require("ical.js/lib/ical/recur");
var Montage = require("../core").Montage,

    ICAL = require("ical.js"),
    ICAL_Timezone = ICAL.Timezone,
    ICAL_Timezone_Prototype = ICAL.Timezone.prototype,
    ICAL_Timezone_Prototype = ICAL.Timezone.prototype,
    ICAL_TimezoneService = ICAL.TimezoneService,
    currentEnvironment = require("../environment").currentEnvironment,

    //We really need to find a way to load only the data for the timezone we care about.
    //So this file should either be split in individual files or we need to find/build an API that does so
    //  1. https://developers.google.com/maps/documentation/timezone/intro //not ics
    //  2. https://ipgeolocation.io/documentation/timezone-api.html
    //  3. https://www.amdoren.com/time-zone-api/
    //  4. http://worldtimeapi.org
    //  5. https://timezoneapi.io/developers/timezone
    timeZonesData = require("./time-zone-data/zones-compiled.json"),
    // systemTimeZonesData = require("./time-zone-data/"+Intl.DateTimeFormat(navigator.languages[0]).resolvedOptions().timeZone+".json"),

    TimeZone = exports.TimeZone = ICAL_Timezone,
    TimeZonePrototype = TimeZone.prototype;

(function registerTimezones(timeZonesData) {
    Object.keys(timeZonesData).forEach(function(key) {
        var icsData = timeZonesData[key],
            // dataToParse = "BEGIN:VCALENDAR\nPRODID:-//tzurl.org//NONSGML Olson 2012h//EN\nVERSION:2.0\n",
            parsed,
            // parsed = ICAL.parse(`BEGIN:VCALENDAR\nPRODID:-//tzurl.org//NONSGML Olson 2012h//EN\nVERSION:2.0\n${icsData}\nEND:VCALENDAR`),
            comp,
            vtimezone;

            // dataToParse += icsData;
            // dataToParse += "\nEND:VCALENDAR";
            parsed = ICAL.parse(icsData);
            comp = new ICAL.Component(parsed);
            vtimezone = comp.getFirstSubcomponent('vtimezone');


      ICAL.TimezoneService.register(key, new ICAL.Timezone(vtimezone));
    });
})(timeZonesData);


/**
 * Returns a TimeZone a given identifier.
 *
 *
 * @function
 * @param {CalendarIdentifier} calendarIdentifier The module id of the HTML page to load.
 * @returns {Calendar} a new Calendar instance.
 */

TimeZone.withIdentifier = function(timeZoneIdentifier) {
    return ICAL_TimezoneService.get(timeZoneIdentifier);
};

Object.defineProperties(ICAL_Timezone_Prototype, {
    "identifier": {
        get: function() {
            return this.tzid;
        }
    }
});





/**
 * Returns a TimeZone a given identifier.
 *
 *
 * @function
 * @param {CalendarIdentifier} calendarIdentifier The module id of the HTML page to load.
 * @returns {Calendar} a new Calendar instance.
 */
Object.defineProperties(TimeZone, {
    "_systemTimeZone": {
        value: undefined,
        enumerable: false,
        writable: true,
        configurable: true
    },
    "_createSystemTimeZone": {
        get: function() {
            var systemLocaleIdentifier = currentEnvironment.systemLocaleIdentifier,
                resolvedOptions = Intl.DateTimeFormat(systemLocaleIdentifier).resolvedOptions(),
                timeZone = resolvedOptions.timeZone; /* "America/Los_Angeles" */
            return (this._systemTimeZone = TimeZone.withIdentifier(timeZone));
        }
    },
    "systemTimeZone": {
        get: function() {
            return this._systemTimeZone || this._createSystemTimeZone;
        }
    }

});

TimeZone.UTCTimeZone = TimeZone.utcTimezone;

/**
 * Convert a calendarDate from one timeZone zone to another.
 *
 * @param {CalendarDate} calendarDate       The calendarDate to convert
 * @param {TimeZone} fromTimeZone           The source zone to convert from
 * @param {TimeZone} toTimeZone             The target zone to convert to
 * @return {CalendarDate}                   The converted calendarDate object
 */

TimeZone.convertCalendarDateFromTimeZoneToTimeZone = ICAL.Timezone.convert_time;
