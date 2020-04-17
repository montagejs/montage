/*
    Time Zones definitions at:

    https://hg.mozilla.org/comm-central/raw-file/tip/calendar/timezones/zones.json

*/
var Montage = require("../core").Montage,
    ICAL = require("ical.js"),
    ICAL_Timezone = ICAL.Timezone,
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
    zonesData = require("./time-zone-data/zones.json"),
    TimeZone = exports.TimeZone = ICAL_Timezone,
    TimeZonePrototype = TimeZone.prototype;

(function registerTimezones() {
    Object.keys(timezones).forEach(function(key) {
        var icsData = timezones[key],
            dataToParse = "BEGIN:VCALENDAR\nPRODID:-//tzurl.org//NONSGML Olson 2012h//EN\nVERSION:2.0\n",
            parsed,
            // parsed = ICAL.parse(`BEGIN:VCALENDAR\nPRODID:-//tzurl.org//NONSGML Olson 2012h//EN\nVERSION:2.0\n${icsData}\nEND:VCALENDAR`),
            comp,
            vtimezone;

            dataToParse += icsData;
            dataToParse += "\nEND:VCALENDAR";
            parsed = ICAL.parse(dataToParse);
            comp = new ICAL.Component(parsed);
            vtimezone = comp.getFirstSubcomponent('vtimezone');


      ICAL.TimezoneService.register(key, new ICAL.Timezone(vtimezone));
    });
})(zonesData);


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
}

/**
 * Returns a TimeZone a given identifier.
 *
 *
 * @function
 * @param {CalendarIdentifier} calendarIdentifier The module id of the HTML page to load.
 * @returns {Calendar} a new Calendar instance.
 */

TimeZone.systemTimeZone = function() {
    var systemLocaleIdentifier = currentEnvironment.systemLocaleIdentifier,
        resolvedOptions = Intl.DateTimeFormat(navigatorLocaleIdentifier).resolvedOptions(),
        timeZone = resolvedOptions.timeZone; /* "America/Los_Angeles" */
    return ICAL_TimezoneService.get(timeZone);
};

/**
 * Convert a calendarDate from one timeZone zone to another.
 *
 * @param {CalendarDate} calendarDate       The calendarDate to convert
 * @param {TimeZone} fromTimeZone           The source zone to convert from
 * @param {TimeZone} toTimeZone             The target zone to convert to
 * @return {CalendarDate}                   The converted calendarDate object
 */

TimeZone.convertCalendarDateFromTimeZoneToTimeZone = CAL.Timezone.convert_time;

