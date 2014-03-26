/**
 * @version: 1.0 Alpha-1
 * @author: Coolite Inc. http://www.coolite.com/
 * @date: 2008-04-13
 * @copyright: Copyright (c) 2006-2008, Coolite Inc. (http://www.coolite.com/).
 * All rights reserved.
 * @license: Licensed under The MIT License. See license.txt and
 * http://www.datejs.com/license/.
 * @website: http://www.datejs.com/
 */

/**
 * @module montage/core/converter/date-converter
 * @requires montage/core/core
 * @requires montage/core/converter/converter
 */
var Montage = require("../core").Montage,
    Converter = require("./converter").Converter,
    Validator = require("./converter").Validator;

(function () {
    var $D = Date,
        $P = $D.prototype,
        $C = $D.CultureInfo,
        p = function (s, l) {
            if (!l) {
                l = 2;
            }
            return ("000" + s).slice(l * -1);
        };

    /**
     * Resets the time of this Date object to 12:00 AM (00:00), which is the start of the day.
     * @method
     * @param {boolean} .clone() this date instance before clearing Time
     * @return {Date} itself
     */
    $P.clearTime = function () {
        this.setHours(0);
        this.setMinutes(0);
        this.setSeconds(0);
        this.setMilliseconds(0);
        return this;
    };

    /**
     * Resets the time of this Date object to the current time ('now').
     * @method
     * @return {Date} itself
     */
    $P.setTimeToNow = function () {
        var n = new Date();
        this.setHours(n.getHours());
        this.setMinutes(n.getMinutes());
        this.setSeconds(n.getSeconds());
        this.setMilliseconds(n.getMilliseconds());
        return this;
    };

    /**
     * Gets a date that is set to the current date. The time is set to the start of the day (00:00 or 12:00 AM).
     * @function
     * @return {Date} The current date.
     */
    $D.today = function () {
        return new Date().clearTime();
    };

    /**
     * Compares the first date to the second date and returns an number indication of their relative values.
     * @function
     * @param {Date} First Date object to compare [Required].
     * @param {Date} Second Date object to compare to [Required].
     * @return {number} -1 = date1 is lessthan date2. 0 = values are equal. 1 = date1 is greaterthan date2.
     */
    $D.compare = function (date1, date2) {
        if (isNaN(date1) || isNaN(date2)) {
            throw new Error(date1 + " - " + date2);
        } else if (date1 instanceof Date && date2 instanceof Date) {
            return (date1 < date2) ? -1 : (date1 > date2) ? 1 : 0;
        } else {
            throw new TypeError(date1 + " - " + date2);
        }
    };

    /**
     * Compares the first Date object to the second Date object and returns true if they are equal.
     * @function
     * @param {Date} First Date object to compare [Required]
     * @param {Date} Second Date object to compare to [Required]
     * @return {boolean} true if dates are equal. false if they are not equal.
     */
    $D.equals = function (date1, date2) {
        return (date1.compareTo(date2) === 0);
    };

    /**
     * Gets the day number (0-6) if given a CultureInfo specific string which is a valid dayName, abbreviatedDayName or shortestDayName (two char).
     * @function
     * @param {string}   The name of the day (eg. "Monday, "Mon", "tuesday", "tue", "We", "we").
     * @return {number}  The day number
     */
    $D.getDayNumberFromName = function (name) {
        var n = $C.dayNames, m = $C.abbreviatedDayNames, o = $C.shortestDayNames, s = name.toLowerCase();
        for (var i = 0; i < n.length; i++) {
            if (n[i].toLowerCase() == s || m[i].toLowerCase() == s || o[i].toLowerCase() == s) {
                return i;
            }
        }
        return -1;
    };

    /**
     * Gets the month number (0-11) if given a Culture Info specific string which is a valid monthName or abbreviatedMonthName.
     * @method
     * @param {string}   The name of the month (eg. "February, "Feb", "october", "oct").
     * @return {number}  The day number
     */
    $D.getMonthNumberFromName = function (name) {
        var n = $C.monthNames, m = $C.abbreviatedMonthNames, s = name.toLowerCase();
        for (var i = 0; i < n.length; i++) {
            if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) {
                return i;
            }
        }
        return -1;
    };

    /**
     * Determines if the current date instance is within a LeapYear.
     * @function
     * @param {number}   The year.
     * @return {boolean} true if date is within a LeapYear, otherwise false.
     */
    $D.isLeapYear = function (year) {
        return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
    };

    /**
     * Gets the number of days in the month, given a year and month value. Automatically corrects for LeapYear.
     * @function
     * @param {number}   The year.
     * @param {number}   The month (0-11).
     * @return {number}  The number of days in the month.
     */
    $D.getDaysInMonth = function (year, month) {
        return [31, ($D.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    };

    /**
     * @function
     * @param {number} offset
     * @returns null
     */
    $D.getTimezoneAbbreviation = function (offset) {
        var z = $C.timezones, p;
        for (var i = 0; i < z.length; i++) {
            if (z[i].offset === offset) {
                return z[i].name;
            }
        }
        return null;
    };
    /**
     * @function
     * @param {string} name
     * @returns null
     */
    $D.getTimezoneOffset = function (name) {
        var z = $C.timezones, p;
        for (var i = 0; i < z.length; i++) {
            if (z[i].name === name.toUpperCase()) {
                return z[i].offset;
            }
        }
        return null;
    };

    /**
     * Returns a new Date object that is an exact date and time copy of the original instance.
     * @method
     * @return {Date} A new Date instance
     */
    $P.clone = function () {
        return new Date(this.getTime());
    };

    /**
     * Compares this instance to a Date object and returns an number indication of their relative values.
     * @method
     * @param {Date} Date Object to compare [Required].
     * @return {number} -1 = This is less-than date. 0 = values are equal. 1 = this is greater-than date.
     */
    $P.compareTo = function (date) {
        return Date.compare(this, date);
    };

    /**
     * Compares this instance to another Date object and returns true if they are equal.
     * @method
     * @param {Date} Date Object to compare. If no date to compare, new Date() [now] is used.
     * @return {boolean} true If dates are equal. False if they are not equal.
     */
    $P.equals = function (date) {
        return Date.equals(this, date || new Date());
    };

    /**
     * Determines if this instance is between a range of two dates or equal to either the start or end dates.
     * @method
     * @param {Date} start Of range [Required]
     * @param {Date} end Of range [Required]
     * @return {boolean} true This is between or equal to the start and end dates, else false.
     */
    $P.between = function (start, end) {
        return this.getTime() >= start.getTime() && this.getTime() <= end.getTime();
    };

    /**
     * Determines if this date occurs after the date to compare to.
     * @method
     * @param {Date}     Date object to compare. If no date to compare, new Date() ("now") is used.
     * @return {boolean} true if this date instance is greater than the date to compare to (or "now"), otherwise false.
     */
    $P.isAfter = function (date) {
        return this.compareTo(date || new Date()) === 1;
    };

    /**
     * Determines if this date occurs before the date to compare to.
     * @method
     * @param {Date}     date object to compare. If no date to compare, new Date() ("now") is used.
     * @return {boolean} true if this date instance is less than the date to compare to (or "now").
     */
    $P.isBefore = function (date) {
        return (this.compareTo(date || new Date()) === -1);
    };

    /**
     * Determines if the current Date instance occurs today.
     * @method
     * @return {boolean} true if this date instance is 'today', otherwise false.
     */

    /**
     * Determines if the current Date instance occurs on the same Date as the supplied 'date'.
     * If no 'date' to compare to is provided, the current Date instance is compared to 'today'.
     * @method
     * @param {Date} date object to compare. If no date to compare, the current Date ("now") is used.
     * @return {boolean} true if this Date instance occurs on the same Day as the supplied 'date'.
     */
    $P.isToday = $P.isSameDay = function (date) {
        return this.clone().clearTime().equals((date || new Date()).clone().clearTime());
    };

    /**
     * Adds the specified number of milliseconds to this instance.
     * @method
     * @param {number} value   The number of milliseconds to add. The number can be positive or negative [Required]
     * @return {Date}    this
     */
    $P.addMilliseconds = function (value) {
        this.setMilliseconds(this.getMilliseconds() + value * 1);
        return this;
    };

    /**
     * Adds the specified number of seconds to this instance.
     * @method
     * @param {number} value  The number of seconds to add. The number can be positive or negative [Required]
     * @return {Date}    this
     */
    $P.addSeconds = function (value) {
        return this.addMilliseconds(value * 1000);
    };

    /**
     * Adds the specified number of seconds to this instance.
     * @method
     * @param {number} value  The number of seconds to add. The number can be positive or negative [Required]
     * @return {Date}    this
     */
    $P.addMinutes = function (value) {
        return this.addMilliseconds(value * 60000);
        /* 60*1000 */
    };

    /**
     * Adds the specified number of hours to this instance.
     * @method
     * @param {number} value  The number of hours to add. The number can be positive or negative [Required]
     * @return {Date}  this
     */
    $P.addHours = function (value) {
        return this.addMilliseconds(value * 3600000);
        /* 60*60*1000 */
    };

    /**
     * Adds the specified number of days to this instance.
     * @method
     * @param {number} value  The number of days to add. The number can be positive or negative [Required]
     * @return {Date}  this
     */
    $P.addDays = function (value) {
        this.setDate(this.getDate() + value * 1);
        return this;
    };

    /**
     * Adds the specified number of weeks to this instance.
     * @method
     * @param {number} value  The number of weeks to add. The number can be positive or negative [Required]
     * @return {Date}  this.addDays(value * 7)
     */
    $P.addWeeks = function (value) {
        return this.addDays(value * 7);
    };

    /**
     * Adds the specified number of months to this instance.
     * @method
     * @param {number} value  The number of months to add. The number can be positive or negative [Required]
     * @return {Date}  this
     */
    $P.addMonths = function (value) {
        var n = this.getDate();
        this.setDate(1);
        this.setMonth(this.getMonth() + value * 1);
        this.setDate(Math.min(n, $D.getDaysInMonth(this.getFullYear(), this.getMonth())));
        return this;
    };

    /**
     * Adds the specified number of years to this instance.
     * @param {number} value  The number of years to add. The number can be positive or negative [Required]
     * @return {Date}    this
     */
    $P.addYears = function (value) {
        return this.addMonths(value * 12);
    };

    /**
     * Adds (or subtracts) to the value of the years, months, weeks, days, hours, minutes, seconds, milliseconds of the date instance using given configuration object. Positive and Negative values allowed.
     * @method
     * @param {Object} config  Configuration object containing attributes (months, days, etc.)
     * @return {Date}  this
     * @example
     * Date.today().add( { days: 1, months: 1 } )
     * new Date().add( { years: -1 } )
     */
    $P.add = function (config) {
        if (typeof config == "number") {
            this._orient = config;
            return this;
        }

        var x = config;

        if (x.milliseconds) {
            this.addMilliseconds(x.milliseconds);
        }
        if (x.seconds) {
            this.addSeconds(x.seconds);
        }
        if (x.minutes) {
            this.addMinutes(x.minutes);
        }
        if (x.hours) {
            this.addHours(x.hours);
        }
        if (x.weeks) {
            this.addWeeks(x.weeks);
        }
        if (x.months) {
            this.addMonths(x.months);
        }
        if (x.years) {
            this.addYears(x.years);
        }
        if (x.days) {
            this.addDays(x.days);
        }
        return this;
    };

    var $y, $m, $d;

    /**
     * Get the week number. Week one (1) is the week which contains the first Thursday of the year. Monday is considered the first day of the week.
     * This algorithm is a JavaScript port of the work presented by Claus Tøndering at http://www.tondering.dk/claus/cal/node8.html#SECTION00880000000000000000
     * .getWeek() Algorithm Copyright (c) 2008 Claus Tondering.
     * The .getWeek() function does NOT convert the date to UTC. The local datetime is used. Please use .getISOWeek() to get the week of the UTC converted date.
     * @method
     * @return {number}  1 to 53
     */
    $P.getWeek = function () {
        var a, b, c, d, e, f, g, n, s, w;

        $y = (!$y) ? this.getFullYear() : $y;
        $m = (!$m) ? this.getMonth() + 1 : $m;
        $d = (!$d) ? this.getDate() : $d;

        if ($m <= 2) {
            a = $y - 1;
            b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
            c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
            s = b - c;
            e = 0;
            f = $d - 1 + (31 * ($m - 1));
        } else {
            a = $y;
            b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
            c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0);
            s = b - c;
            e = s + 1;
            f = $d + ((153 * ($m - 3) + 2) / 5) + 58 + s;
        }

        g = (a + b) % 7;
        d = (f + g - e) % 7;
        n = (f + 3 - d) | 0;

        if (n < 0) {
            w = 53 - ((g - s) / 5 | 0);
        } else if (n > 364 + s) {
            w = 1;
        } else {
            w = (n / 7 | 0) + 1;
        }

        $y = $m = $d = null;

        return w;
    };

    /**
     * Get the ISO 8601 week number. Week one ("01") is the week which contains the first Thursday of the year. Monday is considered the first day of the week.
     * The .getISOWeek() function does convert the date to it's UTC value. Please use .getWeek() to get the week of the local date.
     * @method
     * @return {string}  "01" to "53"
     */
    $P.getISOWeek = function () {
        $y = this.getUTCFullYear();
        $m = this.getUTCMonth() + 1;
        $d = this.getUTCDate();
        return p(this.getWeek());
    };

    /**
     * Moves the date to Monday of the week set. Week one (1) is the week which contains the first Thursday of the year.
     * @method
     * @param {number} n  A Number (1 to 53) that represents the week of the year.
     * @return {Date}    this
     */
    $P.setWeek = function (n) {
        return this.moveToDayOfWeek(1).addWeeks(n - this.getWeek());
    };

    var validate = function (n, min, max, name) {
        if (typeof n == "undefined") {
            return false;
        } else if (typeof n != "number") {
            throw new TypeError(n + " is not a Number.");
        } else if (n < min || n > max) {
            throw new RangeError(n + " is not a valid value for " + name + ".");
        }
        return true;
    };

    /**
     * Validates the number is within an acceptable range for milliseconds [0-999].
     * @method
     * @param {number} value  The number to check if within range.
     * @return {boolean} true if within range, otherwise false.
     */
    $D.validateMillisecond = function (value) {
        return validate(value, 0, 999, "millisecond");
    };

    /**
        Validates the number is within an acceptable range for seconds [0-59].
        @method
        @param {number} value The number to check if within range.
        @return {boolean} true if within range, otherwise false.
     */
    $D.validateSecond = function (value) {
        return validate(value, 0, 59, "second");
    };

    /**
     * Validates the number is within an acceptable range for minutes [0-59].
     * @function
     * @param {number} value  The number to check if within range.
     * @return {boolean} true if within range, otherwise false.
     */
    $D.validateMinute = function (value) {
        return validate(value, 0, 59, "minute");
    };

    /**
     * Validates the number is within an acceptable range for hours [0-23].
     * @function
     * @param {number} value  The number to check if within range.
     * @return {boolean} true If within range, otherwise false.
     */
    $D.validateHour = function (value) {
        return validate(value, 0, 23, "hour");
    };

    /**
     * Validates the number is within an acceptable range for the days in a month [0-MaxDaysInMonth].
     * @function
     * @param {number} value  The number to check if within range.
     * @param {number} year  The number to check if within range.
     * @param {number} month  The number to check if within range.
     * @return {boolean} true if within range, otherwise false.
     */
    $D.validateDay = function (value, year, month) {
        return validate(value, 1, $D.getDaysInMonth(year, month), "day");
    };

    /**
     * Validates the number is within an acceptable range for months [0-11].
     * @function
     * @param {number} value  The number to check if within range.
     * @return {boolean} true if within range, otherwise false.
     */
    $D.validateMonth = function (value) {
        return validate(value, 0, 11, "month");
    };

    /**
     * Validates the number is within an acceptable range for years.
     * @function
     * @param {number} value  The number to check if within range.
     * @return {boolean} true if within range, otherwise false.
     */
    $D.validateYear = function (value) {
        return validate(value, 0, 9999, "year");
    };

    /**
     * Set the value of year, month, day, hour, minute, second, millisecond of date instance using given configuration object.
     * @function
     * @param {Object} config Configuration object containing attributes (month, day, etc.)
     * @return {Date} this
     * @example
     * Date.today().set( { day: 20, month: 1 } )
     * new Date().set( { millisecond: 0 } )
     */
    $P.set = function (config) {
        if ($D.validateMillisecond(config.millisecond)) {
            this.addMilliseconds(config.millisecond - this.getMilliseconds());
        }

        if ($D.validateSecond(config.second)) {
            this.addSeconds(config.second - this.getSeconds());
        }

        if ($D.validateMinute(config.minute)) {
            this.addMinutes(config.minute - this.getMinutes());
        }

        if ($D.validateHour(config.hour)) {
            this.addHours(config.hour - this.getHours());
        }

        if ($D.validateMonth(config.month)) {
            this.addMonths(config.month - this.getMonth());
        }

        if ($D.validateYear(config.year)) {
            this.addYears(config.year - this.getFullYear());
        }

        /* day has to go last because you can't validate the day without first knowing the month */
        if ($D.validateDay(config.day, this.getFullYear(), this.getMonth())) {
            this.addDays(config.day - this.getDate());
        }

        if (config.timezone) {
            this.setTimezone(config.timezone);
        }

        if (config.timezoneOffset) {
            this.setTimezoneOffset(config.timezoneOffset);
        }

        if (config.week && validate(config.week, 0, 53, "week")) {
            this.setWeek(config.week);
        }

        return this;
    };

    /**
     * Moves the date to the first day of the month.
     * @method
     * @return {Date} this
     */
    $P.moveToFirstDayOfMonth = function () {
        return this.set({ day: 1 });
    };

    /**
     * Moves the date to the last day of the month.
     * @method
     * @return {Date} this
     */
    $P.moveToLastDayOfMonth = function () {
        return this.set({ day: $D.getDaysInMonth(this.getFullYear(), this.getMonth())});
    };

    /**
     * Moves the date to the next n'th occurrence of the dayOfWeek starting from the beginning of the month. The number (-1) is a magic number and will return the last occurrence of the dayOfWeek in the month.
     * @method
     * @param {number} dayOfWeek  The dayOfWeek to move to.
     * @param {number} occurrence  The n'th occurrence to move to. Use (-1) to return the last occurrence in the month.
     * @return {Date}    this
     */
    $P.moveToNthOccurrence = function (dayOfWeek, occurrence) {
        var shift = 0;
        if (occurrence > 0) {
            shift = occurrence - 1;
        }
        else if (occurrence === -1) {
            this.moveToLastDayOfMonth();
            if (this.getDay() !== dayOfWeek) {
                this.moveToDayOfWeek(dayOfWeek, -1);
            }
            return this;
        }
        return this.moveToFirstDayOfMonth().addDays(-1).moveToDayOfWeek(dayOfWeek, +1).addWeeks(shift);
    };

    /**
     * Move to the next or last dayOfWeek based on the orient value.
     * @method
     * @param {number} dayOfWeek The dayOfWeek to move to
     * @param {number} orient  Forward (+1) or Back (-1). Defaults to +1. [Optional]
     * @return {Date}    this
     */
    $P.moveToDayOfWeek = function (dayOfWeek, orient) {
        var diff = (dayOfWeek - this.getDay() + 7 * (orient || +1)) % 7;
        return this.addDays((diff === 0) ? diff += 7 * (orient || +1) : diff);
    };

    /**
     * Move to the next or last month based on the orient value.
     * @method
     * @param {number} month  The month to move to. 0 = January, 11 = December
     * @param {number} orient  Forward (+1) or Back (-1). Defaults to +1. [Optional]
     * @return {Date}    this
     */
    $P.moveToMonth = function (month, orient) {
        var diff = (month - this.getMonth() + 12 * (orient || +1)) % 12;
        return this.addMonths((diff === 0) ? diff += 12 * (orient || +1) : diff);
    };

    /**
     * Get the Ordinal day (numeric day number) of the year, adjusted for leap year.
     * @method
     * @return {number} 1 through 365 (366 in leap years)
     */
    $P.getOrdinalNumber = function () {
        return Math.ceil((this.clone().clearTime() - new Date(this.getFullYear(), 0, 1)) / 86400000) + 1;
    };

    /**
     * Get the time zone abbreviation of the current date.
     * @method
     * @return {string} The abbreviated time zone name (e.g. "EST")
     */
    $P.getTimezone = function () {
        return $D.getTimezoneAbbreviation(this.getUTCOffset());
    };
    /**
     * @method
     * @param {number} offset
     * @return {number} this.addMinutes(there - here)
     */
    $P.setTimezoneOffset = function (offset) {
        var here = this.getTimezoneOffset(), there = Number(offset) * -6 / 10;
        return this.addMinutes(there - here);
    };
    /**
     * @method
     * @param {number} offset
     * @return {number} this.setTimezoneOffset($D.getTimezoneOffset(offset))
     */
    $P.setTimezone = function (offset) {
        return this.setTimezoneOffset($D.getTimezoneOffset(offset));
    };

    /**
     * Indicates whether Daylight Saving Time is observed in the current time zone.
     * @method
     * @return {boolean} true|false
     */
    $P.hasDaylightSavingTime = function () {
        return (Date.today().set({month: 0, day: 1}).getTimezoneOffset() !== Date.today().set({month: 6, day: 1}).getTimezoneOffset());
    };

    /**
     * Indicates whether this Date instance is within the Daylight Saving Time range for the current time zone.
     * @method
     * @return {boolean} true|false
     */
    $P.isDaylightSavingTime = function () {
        return Date.today().set({month: 0, day: 1}).getTimezoneOffset() != this.getTimezoneOffset();
    };

    /**
     * Get the offset from UTC of the current date.
     * @method
     * @return {string} The 4-character offset string prefixed with + or - (e.g. "-0500").
     */
    $P.getUTCOffset = function () {
        var n = this.getTimezoneOffset() * -10 / 6, r;
        if (n < 0) {
            r = (n - 10000).toString();
            return r.charAt(0) + r.substr(2);
        } else {
            r = (n + 10000).toString();
            return "+" + r.substr(1);
        }
    };

    /**
     * Returns the number of milliseconds between this date and date.
     * @method
     * @param {Date} date Defaults to now
     * @return {number} The diff in milliseconds
     */
    $P.getElapsed = function (date) {
        return (date || new Date()) - this;
    };

    if (!$P.toISOString) {
        /**
            Converts the current date instance into a string with an ISO 8601 format. The date is converted to it's UTC value.
            @method
            @return {string}  ISO 8601 string of date
         */
        $P.toISOString = function () {
            // From http://www.json.org/json.js. Public Domain.
            function f(n) {
                return n < 10 ? '0' + n : n;
            }

            return '"' + this.getUTCFullYear() + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate()) + 'T' +
                f(this.getUTCHours()) + ':' +
                f(this.getUTCMinutes()) + ':' +
                f(this.getUTCSeconds()) + 'Z"';
        };
    }

    // private
    $P._toString = $P.toString;

    /**
        Converts the value of the current Date object to its equivalent string representation.
        Format Specifiers
        @example
       <pre>
        CUSTOM DATE AND TIME FORMAT STRINGS
     Format  Description                                                                  Example
     ------  ---------------------------------------------------------------------------  -----------------------
     s      The seconds of the minute between 0-59.                                      "0" to "59"
     ss     The seconds of the minute with leading zero if required.                     "00" to "59"

     m      The minute of the hour between 0-59.                                         "0"  or "59"
     mm     The minute of the hour with leading zero if required.                        "00" or "59"

     h      The hour of the day between 1-12.                                            "1"  to "12"
     hh     The hour of the day with leading zero if required.                           "01" to "12"

     H      The hour of the day between 0-23.                                            "0"  to "23"
     HH     The hour of the day with leading zero if required.                           "00" to "23"

     d      The day of the month between 1 and 31.                                       "1"  to "31"
     dd     The day of the month with leading zero if required.                          "01" to "31"
     ddd    Abbreviated day name. $C.abbreviatedDayNames.                                "Mon" to "Sun"
     dddd   The full day name. $C.dayNames.                                              "Monday" to "Sunday"

     M      The month of the year between 1-12.                                          "1" to "12"
     MM     The month of the year with leading zero if required.                         "01" to "12"
     MMM    Abbreviated month name. $C.abbreviatedMonthNames.                            "Jan" to "Dec"
     MMMM   The full month name. $C.monthNames.                                          "January" to "December"

     yy     The year as a two-digit number.                                              "99" or "08"
     yyyy   The full four digit year.                                                    "1999" or "2008"

     t      Displays the first character of the A.M./P.M. designator.                    "A" or "P"
     $C.amDesignator or $C.pmDesignator
     tt     Displays the A.M./P.M. designator.                                           "AM" or "PM"
     $C.amDesignator or $C.pmDesignator

     S      The ordinal suffix ("st, "nd", "rd" or "th") of the current day.            "st, "nd", "rd" or "th"

     || *Format* || *Description* || *Example* ||
     || d      || The CultureInfo shortDate Format Pattern                                     || "M/d/yyyy" ||
     || D      || The CultureInfo longDate Format Pattern                                      || "dddd, MMMM dd, yyyy" ||
     || F      || The CultureInfo fullDateTime Format Pattern                                  || "dddd, MMMM dd, yyyy h:mm:ss tt" ||
     || m      || The CultureInfo monthDay Format Pattern                                      || "MMMM dd" ||
     || r      || The CultureInfo rfc1123 Format Pattern                                       || "ddd, dd MMM yyyy HH:mm:ss GMT" ||
     || s      || The CultureInfo sortableDateTime Format Pattern                              || "yyyy-MM-ddTHH:mm:ss" ||
     || t      || The CultureInfo shortTime Format Pattern                                     || "h:mm tt" ||
     || T      || The CultureInfo longTime Format Pattern                                      || "h:mm:ss tt" ||
     || u      || The CultureInfo universalSortableDateTime Format Pattern                     || "yyyy-MM-dd HH:mm:ssZ" ||
     || y      || The CultureInfo yearMonth Format Pattern                                     || "MMMM, yyyy" ||


     STANDARD DATE AND TIME FORMAT STRINGS
     Format  Description                                                                  Example ("en-US")
     ------  ---------------------------------------------------------------------------  -----------------------
     d      The CultureInfo shortDate Format Pattern                                     "M/d/yyyy"
     D      The CultureInfo longDate Format Pattern                                      "dddd, MMMM dd, yyyy"
     F      The CultureInfo fullDateTime Format Pattern                                  "dddd, MMMM dd, yyyy h:mm:ss tt"
     m      The CultureInfo monthDay Format Pattern                                      "MMMM dd"
     r      The CultureInfo rfc1123 Format Pattern                                       "ddd, dd MMM yyyy HH:mm:ss GMT"
     s      The CultureInfo sortableDateTime Format Pattern                              "yyyy-MM-ddTHH:mm:ss"
     t      The CultureInfo shortTime Format Pattern                                     "h:mm tt"
     T      The CultureInfo longTime Format Pattern                                      "h:mm:ss tt"
     u      The CultureInfo universalSortableDateTime Format Pattern                     "yyyy-MM-dd HH:mm:ssZ"
     y      The CultureInfo yearMonth Format Pattern                                     "MMMM, yyyy"
     </pre>
     */
    /**
     * @method
     * @param {string} format  A format string consisting of one or more format spcifiers [Optional].
     * @return {string}  A string representation of the current Date object.
     */
    $P.toString = function (format) {
        var x = this;

        // Standard Date and Time Format Strings. Formats pulled from CultureInfo file and
        // may vary by culture.
        if (format && format.length == 1) {
            var c = $C.formatPatterns;
            x.t = x.toString;
            switch (format) {
                case "d":
                    return x.t(c.shortDate);
                case "D":
                    return x.t(c.longDate);
                case "F":
                    return x.t(c.fullDateTime);
                case "m":
                    return x.t(c.monthDay);
                case "r":
                    return x.t(c.rfc1123);
                case "s":
                    return x.t(c.sortableDateTime);
                case "t":
                    return x.t(c.shortTime);
                case "T":
                    return x.t(c.longTime);
                case "u":
                    return x.t(c.universalSortableDateTime);
                case "y":
                    return x.t(c.yearMonth);
            }
        }

        var ord = function (n) {
            switch (n * 1) {
                case 1:
                case 21:
                case 31:
                    return "st";
                case 2:
                case 22:
                    return "nd";
                case 3:
                case 23:
                    return "rd";
                default:
                    return "th";
            }
        };

        return format ? format.replace(/(\\)?(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|S)/g,
            function (m) {
                if (m.charAt(0) === "\\") {
                    return m.replace("\\", "");
                }
                x.h = x.getHours;
                switch (m) {
                    case "hh":
                        return p(x.h() < 13 ? (x.h() === 0 ? 12 : x.h()) : (x.h() - 12));
                    case "h":
                        return x.h() < 13 ? (x.h() === 0 ? 12 : x.h()) : (x.h() - 12);
                    case "HH":
                        return p(x.h());
                    case "H":
                        return x.h();
                    case "mm":
                        return p(x.getMinutes());
                    case "m":
                        return x.getMinutes();
                    case "ss":
                        return p(x.getSeconds());
                    case "s":
                        return x.getSeconds();
                    case "yyyy":
                        return p(x.getFullYear(), 4);
                    case "yy":
                        return p(x.getFullYear());
                    case "dddd":
                        return $C.dayNames[x.getDay()];
                    case "ddd":
                        return $C.abbreviatedDayNames[x.getDay()];
                    case "dd":
                        return p(x.getDate());
                    case "d":
                        return x.getDate();
                    case "MMMM":
                        return $C.monthNames[x.getMonth()];
                    case "MMM":
                        return $C.abbreviatedMonthNames[x.getMonth()];
                    case "MM":
                        return p((x.getMonth() + 1));
                    case "M":
                        return x.getMonth() + 1;
                    case "t":
                        return x.h() < 12 ? $C.amDesignator.substring(0, 1) : $C.pmDesignator.substring(0, 1);
                    case "tt":
                        return x.h() < 12 ? $C.amDesignator : $C.pmDesignator;
                    case "S":
                        return ord(x.getDate());
                    default:
                        return m;
                }
            }
        ) : this._toString();
    };
}());
(function () {

    // Date formatting


    /**
     * @version: 1.0 Alpha-1
     * @author: Coolite Inc. http://www.coolite.com/
     * @date: 2008-04-13
     * @copyright: Copyright (c) 2006-2008, Coolite Inc. (http://www.coolite.com/). All rights reserved.
     * @license: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/.
     * @website: http://www.datejs.com/
     */

    Date.CultureInfo = {
        /* Culture Name */
        name: "en-US",
        englishName: "English (United States)",
        nativeName: "English (United States)",

        /* Day Name Strings */
        dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"],

        /* Month Name Strings */
        monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

        /* AM/PM Designators */
        amDesignator: "AM",
        pmDesignator: "PM",

        firstDayOfWeek: 0,
        twoDigitYearMax: 2029,

        /**
         * The dateElementOrder is based on the order of the format specifiers in the formatPatterns.DatePattern.
         * @example:
         * shortDatePattern    dateElementOrder
         * ------------------  ----------------
         * "M/d/yyyy"          "mdy"
         * "dd/MM/yyyy"        "dmy"
         * "yyyy-MM-dd"        "ymd"
         *
         * The correct dateElementOrder is required by the parser to
         * determine the expected order of the date elements in the
         * string being parsed.
         */
        dateElementOrder: "mdy",

        /* Standard date and time format patterns */
        formatPatterns: {
            shortDate: "M/d/yyyy",
            longDate: "dddd, MMMM dd, yyyy",
            shortTime: "h:mm tt",
            longTime: "h:mm:ss tt",
            fullDateTime: "dddd, MMMM dd, yyyy h:mm:ss tt",
            sortableDateTime: "yyyy-MM-ddTHH:mm:ss",
            universalSortableDateTime: "yyyy-MM-dd HH:mm:ssZ",
            rfc1123: "ddd, dd MMM yyyy HH:mm:ss GMT",
            monthDay: "MMMM dd",
            yearMonth: "MMMM, yyyy"
        },

        /**
         * NOTE: If a string format is not parsing correctly, but
         * you would expect it parse, the problem likely lies below.
         *
         * The following regex patterns control most of the string matching
         * within the parser.
         *
         * The Month name and Day name patterns were automatically generated
         * and in general should be (mostly) correct.
         *
         * Beyond the month and day name patterns are natural language strings.
         * Example: "next", "today", "months"
         *
         * These natural language string may NOT be correct for this culture.
         * If they are not correct, please translate and edit this file
         * providing the correct regular expression pattern.
         *
         * If you modify this file, please post your revised CultureInfo file
         * to the Datejs Forum located at http://www.datejs.com/forums/.
         *
         * Please mark the subject of the post with [CultureInfo]. Example:
         *    Subject: [CultureInfo] Translated "da-DK" Danish(Denmark)
         *
         * We will add the modified patterns to the master source files.
         *
         * As well, please review the list of "Future Strings" section below.
         */
        regexPatterns: {
            jan: /^jan(uary)?/i,
            feb: /^feb(ruary)?/i,
            mar: /^mar(ch)?/i,
            apr: /^apr(il)?/i,
            may: /^may/i,
            jun: /^jun(e)?/i,
            jul: /^jul(y)?/i,
            aug: /^aug(ust)?/i,
            sep: /^sep(t(ember)?)?/i,
            oct: /^oct(ober)?/i,
            nov: /^nov(ember)?/i,
            dec: /^dec(ember)?/i,

            sun: /^su(n(day)?)?/i,
            mon: /^mo(n(day)?)?/i,
            tue: /^tu(e(s(day)?)?)?/i,
            wed: /^we(d(nesday)?)?/i,
            thu: /^th(u(r(s(day)?)?)?)?/i,
            fri: /^fr(i(day)?)?/i,
            sat: /^sa(t(urday)?)?/i,

            future: /^next/i,
            past: /^last|past|prev(ious)?/i,
            add: /^(\+|aft(er)?|from|hence)/i,
            subtract: /^(\-|bef(ore)?|ago)/i,

            yesterday: /^yes(terday)?/i,
            today: /^t(od(ay)?)?/i,
            tomorrow: /^tom(orrow)?/i,
            now: /^n(ow)?/i,

            millisecond: /^ms|milli(second)?s?/i,
            second: /^sec(ond)?s?/i,
            minute: /^mn|min(ute)?s?/i,
            hour: /^h(our)?s?/i,
            week: /^w(eek)?s?/i,
            month: /^m(onth)?s?/i,
            day: /^d(ay)?s?/i,
            year: /^y(ear)?s?/i,

            shortMeridian: /^(a|p)/i,
            longMeridian: /^(a\.?m?\.?|p\.?m?\.?)/i,
            timezone: /^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt|utc)/i,
            ordinalSuffix: /^\s*(st|nd|rd|th)/i,
            timeContext: /^\s*(\:|a(?!u|p)|p)/i
        },

        timezones: [
            {name:"UTC", offset:"-000"},
            {name:"GMT", offset:"-000"},
            {name:"EST", offset:"-0500"},
            {name:"EDT", offset:"-0400"},
            {name:"CST", offset:"-0600"},
            {name:"CDT", offset:"-0500"},
            {name:"MST", offset:"-0700"},
            {name:"MDT", offset:"-0600"},
            {name:"PST", offset:"-0800"},
            {name:"PDT", offset:"-0700"}
        ]
    };

    /********************
     ** Future Strings **
     ********************
     *
     * The following list of strings may not be currently used, but
     * may be incorporated into the Datejs library later.
     *
     * We would appreciate any help translating the strings below.
     *
     * If you modify this file, please post your revised CultureInfo file
     * to the Datejs Forum located at http://www.datejs.com/forums/.
     *
     * Please mark the subject of the post with [CultureInfo]. Example:
     *    Subject: [CultureInfo] Translated "da-DK" Danish(Denmark)b
     *
     * English Name        Translated
     * ------------------  -----------------
     * about               about
     * ago                 ago
     * date                date
     * time                time
     * calendar            calendar
     * show                show
     * hourly              hourly
     * daily               daily
     * weekly              weekly
     * bi-weekly           bi-weekly
     * fortnight           fortnight
     * monthly             monthly
     * bi-monthly          bi-monthly
     * quarter             quarter
     * quarterly           quarterly
     * yearly              yearly
     * annual              annual
     * annually            annually
     * annum               annum
     * again               again
     * between             between
     * after               after
     * from now            from now
     * repeat              repeat
     * times               times
     * per                 per
     * min (abbrev minute) min
     * morning             morning
     * noon                noon
     * night               night
     * midnight            midnight
     * mid-night           mid-night
     * evening             evening
     * final               final
     * future              future
     * spring              spring
     * summer              summer
     * fall                fall
     * winter              winter
     * end of              end of
     * end                 end
     * long                long
     * short               short
     */
    /**
     * @function
     * @param {string} s
     * @param {number} 1
     * @returns ("000" + s).slice(l * -1)
     */
    var p = function (s, l) {
        if (!l) {
            l = 2;
        }
        return ("000" + s).slice(l * -1);
    };

    /**
     * Converts the value of the current Date object to its equivalent string representation.
     * Format Specifiers
     * @method
     * @param {string} format  A format string consisting of one or more format spcifiers [Optional].
     * @return {string}  A string representation of the current Date object.
     * @example
     * CUSTOM DATE AND TIME FORMAT STRINGS
     * Format  Description                                                                  Example
     * ------  ---------------------------------------------------------------------------  -----------------------
     * s      The seconds of the minute between 0-59.                                      "0" to "59"
     * ss     The seconds of the minute with leading zero if required.                     "00" to "59"
     *
     * m      The minute of the hour between 0-59.                                         "0"  or "59"
     * mm     The minute of the hour with leading zero if required.                        "00" or "59"
     *
     * h      The hour of the day between 1-12.                                            "1"  to "12"
     * hh     The hour of the day with leading zero if required.                           "01" to "12"
     *
     * H      The hour of the day between 0-23.                                            "0"  to "23"
     * HH     The hour of the day with leading zero if required.                           "00" to "23"
     *
     * d      The day of the month between 1 and 31.                                       "1"  to "31"
     * dd     The day of the month with leading zero if required.                          "01" to "31"
     * ddd    Abbreviated day name. Date.CultureInfo.abbreviatedDayNames.                                "Mon" to "Sun"
     * dddd   The full day name. Date.CultureInfo.dayNames.                                              "Monday" to "Sunday"
     *
     * M      The month of the year between 1-12.                                          "1" to "12"
     * MM     The month of the year with leading zero if required.                         "01" to "12"
     * MMM    Abbreviated month name. Date.CultureInfo.abbreviatedMonthNames.                            "Jan" to "Dec"
     * MMMM   The full month name. Date.CultureInfo.monthNames.                                          "January" to "December"
     *
     * yy     The year as a two-digit number.                                              "99" or "08"
     * yyyy   The full four digit year.                                                    "1999" or "2008"
     *
     * t      Displays the first character of the A.M./P.M. designator.                    "A" or "P"
     * Date.CultureInfo.amDesignator or Date.CultureInfo.pmDesignator
     * tt     Displays the A.M./P.M. designator.                                           "AM" or "PM"
     * Date.CultureInfo.amDesignator or Date.CultureInfo.pmDesignator
     *
     * S      The ordinal suffix ("st, "nd", "rd" or "th") of the current day.            "st, "nd", "rd" or "th"
     *
     * || *Format* || *Description* || *Example* ||
     * || d      || The CultureInfo shortDate Format Pattern                                     || "M/d/yyyy" ||
     * || D      || The CultureInfo longDate Format Pattern                                      || "dddd, MMMM dd, yyyy" ||
     * || F      || The CultureInfo fullDateTime Format Pattern                                  || "dddd, MMMM dd, yyyy h:mm:ss tt" ||
     * || m      || The CultureInfo monthDay Format Pattern                                      || "MMMM dd" ||
     * || r      || The CultureInfo rfc1123 Format Pattern                                       || "ddd, dd MMM yyyy HH:mm:ss GMT" ||
     * || s      || The CultureInfo sortableDateTime Format Pattern                              || "yyyy-MM-ddTHH:mm:ss" ||
     * || t      || The CultureInfo shortTime Format Pattern                                     || "h:mm tt" ||
     * || T      || The CultureInfo longTime Format Pattern                                      || "h:mm:ss tt" ||
     * || u      || The CultureInfo universalSortableDateTime Format Pattern                     || "yyyy-MM-dd HH:mm:ssZ" ||
     * || y      || The CultureInfo yearMonth Format Pattern                                     || "MMMM, yyyy" ||
     *
     *
     * STANDARD DATE AND TIME FORMAT STRINGS
     * Format  Description                                                                  Example ("en-US")
     * ------  ---------------------------------------------------------------------------  -----------------------
     * d      The CultureInfo shortDate Format Pattern                                     "M/d/yyyy"
     * D      The CultureInfo longDate Format Pattern                                      "dddd, MMMM dd, yyyy"
     * F      The CultureInfo fullDateTime Format Pattern                                  "dddd, MMMM dd, yyyy h:mm:ss tt"
     * m      The CultureInfo monthDay Format Pattern                                      "MMMM dd"
     * r      The CultureInfo rfc1123 Format Pattern                                       "ddd, dd MMM yyyy HH:mm:ss GMT"
     * s      The CultureInfo sortableDateTime Format Pattern                              "yyyy-MM-ddTHH:mm:ss"
     * t      The CultureInfo shortTime Format Pattern                                     "h:mm tt"
     * T      The CultureInfo longTime Format Pattern                                      "h:mm:ss tt"
     * u      The CultureInfo universalSortableDateTime Format Pattern                     "yyyy-MM-dd HH:mm:ssZ"
     * y      The CultureInfo yearMonth Format Pattern                                     "MMMM, yyyy"
     */
    Date.prototype.format = function (format) {
        var x = this;

        // Standard Date and Time Format Strings. Formats pulled from CultureInfo file and
        // may vary by culture.
        if (format && format.length == 1) {
            var c = Date.CultureInfo.formatPatterns;
            x.t = x.format;
            switch (format) {
                case "c":
                    return x.toISOString();
                case "d":
                    return x.t(c.shortDate);
                case "D":
                    return x.t(c.longDate);
                case "F":
                    return x.t(c.fullDateTime);
                case "m":
                    return x.t(c.monthDay);
                case "r":
                    return x.t(c.rfc1123);
                case "s":
                    return x.t(c.sortableDateTime);
                case "t":
                    return x.t(c.shortTime);
                case "T":
                    return x.t(c.longTime);
                case "u":
                    return x.t(c.universalSortableDateTime);
                case "y":
                    return x.t(c.yearMonth);
            }
        }

        var ord = function (n) {
            switch (n * 1) {
                case 1:
                case 21:
                case 31:
                    return "st";
                case 2:
                case 22:
                    return "nd";
                case 3:
                case 23:
                    return "rd";
                default:
                    return "th";
            }
        };

        return format ? format.replace(/(\\)?(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|S)/g,
            function (m) {
                if (m.charAt(0) === "\\") {
                    return m.replace("\\", "");
                }
                x.h = x.getHours;
                switch (m) {
                    case "hh":
                        return p(x.h() < 13 ? (x.h() === 0 ? 12 : x.h()) : (x.h() - 12));
                    case "h":
                        return x.h() < 13 ? (x.h() === 0 ? 12 : x.h()) : (x.h() - 12);
                    case "HH":
                        return p(x.h());
                    case "H":
                        return x.h();
                    case "mm":
                        return p(x.getMinutes());
                    case "m":
                        return x.getMinutes();
                    case "ss":
                        return p(x.getSeconds());
                    case "s":
                        return x.getSeconds();
                    case "yyyy":
                        return p(x.getFullYear(), 4);
                    case "yy":
                        return p(x.getFullYear());
                    case "dddd":
                        return Date.CultureInfo.dayNames[x.getDay()];
                    case "ddd":
                        return Date.CultureInfo.abbreviatedDayNames[x.getDay()];
                    case "dd":
                        return p(x.getDate());
                    case "d":
                        return x.getDate();
                    case "MMMM":
                        return Date.CultureInfo.monthNames[x.getMonth()];
                    case "MMM":
                        return Date.CultureInfo.abbreviatedMonthNames[x.getMonth()];
                    case "MM":
                        return p((x.getMonth() + 1));
                    case "M":
                        return x.getMonth() + 1;
                    case "t":
                        return x.h() < 12 ? Date.CultureInfo.amDesignator.substring(0, 1) : Date.CultureInfo.pmDesignator.substring(0, 1);
                    case "tt":
                        return x.h() < 12 ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
                    case "S":
                        return ord(x.getDate());
                    default:
                        return m;
                }
            }
        ) : this.toString();
    };

    Date.Parsing = {
        Exception: function (s) {
            this.message = "Parse error at '" + s.substring(0, 10) + " ...'";
        }
    };

    var $P = Date.Parsing;
    var _ = $P.Operators = {
        //
        // Tokenizers
        //
        rtoken: function (r) { // regex token
            return function (s) {
                var mx = s.match(r);
                if (mx) {
                    return ([ mx[0], s.substring(mx[0].length) ]);
                } else {
                    throw new $P.Exception(s);
                }
            };
        },
        token: function (s) { // whitespace-eating token
            return function (s) {
                return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s);
                // Removed .strip()
                // return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s).strip();
            };
        },
        stoken: function (s) { // string token
            return _.rtoken(new RegExp("^" + s));
        },

        //
        // Atomic Operators
        //

        until: function (p) {
            return function (s) {
                var qx = [], rx = null;
                while (s.length) {
                    try {
                        rx = p.call(this, s);
                    } catch (e) {
                        qx.push(rx[0]);
                        s = rx[1];
                        continue;
                    }
                    break;
                }
                return [ qx, s ];
            };
        },
        many: function (p) {
            return function (s) {
                var rx = [], r = null;
                while (s.length) {
                    try {
                        r = p.call(this, s);
                    } catch (e) {
                        return [ rx, s ];
                    }
                    rx.push(r[0]);
                    s = r[1];
                }
                return [ rx, s ];
            };
        },

        // generator operators -- see below
        optional: function (p) {
            return function (s) {
                var r = null;
                try {
                    r = p.call(this, s);
                } catch (e) {
                    return [ null, s ];
                }
                return [ r[0], r[1] ];
            };
        },
        not: function (p) {
            return function (s) {
                try {
                    p.call(this, s);
                } catch (e) {
                    return [null, s];
                }
                throw new $P.Exception(s);
            };
        },
        ignore: function (p) {
            return p ?
                function (s) {
                    var r = null;
                    r = p.call(this, s);
                    return [null, r[1]];
                } : null;
        },
        product: function () {
            var px = arguments[0],
                qx = Array.prototype.slice.call(arguments, 1), rx = [];
            for (var i = 0; i < px.length; i++) {
                rx.push(_.each(px[i], qx));
            }
            return rx;
        },
        cache: function (rule) {
            var cache = {}, r = null;
            return function (s) {
                try {
                    r = cache[s] = (cache[s] || rule.call(this, s));
                } catch (e) {
                    r = cache[s] = e;
                }
                if (r instanceof $P.Exception) {
                    throw r;
                } else {
                    return r;
                }
            };
        },

        // vector operators -- see below
        any: function () {
            var px = arguments;
            return function (s) {
                var r = null;
                for (var i = 0; i < px.length; i++) {
                    if (px[i] == null) {
                        continue;
                    }
                    try {
                        r = (px[i].call(this, s));
                    } catch (e) {
                        r = null;
                    }
                    if (r) {
                        return r;
                    }
                }
                throw new $P.Exception(s);
            };
        },
        each: function () {
            var px = arguments;
            return function (s) {
                var rx = [], r = null;
                for (var i = 0; i < px.length; i++) {
                    if (px[i] == null) {
                        continue;
                    }
                    try {
                        r = (px[i].call(this, s));
                    } catch (e) {
                        throw new $P.Exception(s);
                    }
                    rx.push(r[0]);
                    s = r[1];
                }
                return [ rx, s];
            };
        },
        all: function () {
            var px = arguments, _ = _;
            return _.each(_.optional(px));
        },

        // delimited operators
        sequence: function (px, d, c) {
            d = d || _.rtoken(/^\s*/);
            c = c || null;

            if (px.length == 1) {
                return px[0];
            }
            return function (s) {
                var r = null, q = null;
                var rx = [];
                for (var i = 0; i < px.length; i++) {
                    try {
                        r = px[i].call(this, s);
                    } catch (e) {
                        break;
                    }
                    rx.push(r[0]);
                    try {
                        q = d.call(this, r[1]);
                    } catch (ex) {
                        q = null;
                        break;
                    }
                    s = q[1];
                }
                if (!r) {
                    throw new $P.Exception(s);
                }
                if (q) {
                    throw new $P.Exception(q[1]);
                }
                if (c) {
                    try {
                        r = c.call(this, r[1]);
                    } catch (ey) {
                        throw new $P.Exception(r[1]);
                    }
                }
                return [ rx, (r ? r[1] : s) ];
            };
        },

        //
        // Composite Operators
        //
        between: function (d1, p, d2) {
            d2 = d2 || d1;
            var _fn = _.each(_.ignore(d1), p, _.ignore(d2));
            return function (s) {
                var rx = _fn.call(this, s);
                return [
                    [rx[0][0], rx[0][2]],
                    rx[1]
                ];
            };
        },
        list: function (p, d, c) {
            d = d || _.rtoken(/^\s*/);
            c = c || null;
            return (p instanceof Array ?
                _.each(_.product(p.slice(0, -1), _.ignore(d)), p.slice(-1), _.ignore(c)) :
                _.each(_.many(_.each(p, _.ignore(d))), p, _.ignore(c)));
        },
        set: function (px, d, c) {
            d = d || _.rtoken(/^\s*/);
            c = c || null;
            return function (s) {
                // r is the current match, best the current 'best' match
                // which means it parsed the most amount of input
                var r = null, p = null, q = null, rx = null, best = [
                    [],
                    s
                ], last = false;

                // go through the rules in the given set
                for (var i = 0; i < px.length; i++) {

                    // last is a flag indicating whether this must be the last element
                    // if there is only 1 element, then it MUST be the last one
                    q = null;
                    p = null;
                    r = null;
                    last = (px.length == 1);

                    // first, we try simply to match the current pattern
                    // if not, try the next pattern
                    try {
                        r = px[i].call(this, s);
                    } catch (e) {
                        continue;
                    }

                    // since we are matching against a set of elements, the first
                    // thing to do is to add r[0] to matched elements
                    rx = [
                        [r[0]],
                        r[1]
                    ];

                    // if we matched and there is still input to parse and
                    // we don't already know this is the last element,
                    // we're going to next check for the delimiter ...
                    // if there's none, or if there's no input left to parse
                    // than this must be the last element after all ...
                    if (r[1].length > 0 && ! last) {
                        try {
                            q = d.call(this, r[1]);
                        } catch (ex) {
                            last = true;
                        }
                    } else {
                        last = true;
                    }

                    // if we parsed the delimiter and now there's no more input,
                    // that means we shouldn't have parsed the delimiter at all
                    // so don't update r and mark this as the last element ...
                    if (!last && q[1].length === 0) {
                        last = true;
                    }


                    // so, if this isn't the last element, we're going to see if
                    // we can get any more matches from the remaining (unmatched)
                    // elements ...
                    if (!last) {

                        // build a list of the remaining rules we can match against,
                        // i.e., all but the one we just matched against
                        var qx = [];
                        for (var j = 0; j < px.length; j++) {
                            if (i != j) {
                                qx.push(px[j]);
                            }
                        }

                        // now invoke recursively set with the remaining input
                        // note that we don't include the closing delimiter ...
                        // we'll check for that ourselves at the end
                        p = _.set(qx, d).call(this, q[1]);

                        // if we got a non-empty set as a result ...
                        // (otw rx already contains everything we want to match)
                        if (p[0].length > 0) {
                            // update current result, which is stored in rx ...
                            // basically, pick up the remaining text from p[1]
                            // and concat the result from p[0] so that we don't
                            // get endless nesting ...
                            rx[0] = rx[0].concat(p[0]);
                            rx[1] = p[1];
                        }
                    }

                    // at this point, rx either contains the last matched element
                    // or the entire matched set that starts with this element.

                    // now we just check to see if this variation is better than
                    // our best so far, in terms of how much of the input is parsed
                    if (rx[1].length < best[1].length) {
                        best = rx;
                    }

                    // if we've parsed all the input, then we're finished
                    if (best[1].length === 0) {
                        break;
                    }
                }

                // so now we've either gone through all the patterns trying them
                // as the initial match; or we found one that parsed the entire
                // input string ...

                // if best has no matches, just return empty set ...
                if (best[0].length === 0) {
                    return best;
                }

                // if a closing delimiter is provided, then we have to check it also
                if (c) {
                    // we try this even if there is no remaining input because the pattern
                    // may well be optional or match empty input ...
                    try {
                        q = c.call(this, best[1]);
                    } catch (ey) {
                        throw new $P.Exception(best[1]);
                    }

                    // it parsed ... be sure to update the best match remaining input
                    best[1] = q[1];
                }

                // if we're here, either there was no closing delimiter or we parsed it
                // so now we have the best match; just return it!
                return best;
            };
        },
        forward: function (gr, fname) {
            return function (s) {
                return gr[fname].call(this, s);
            };
        },

        //
        // Translation Operators
        //
        replace: function (rule, repl) {
            return function (s) {
                var r = rule.call(this, s);
                return [repl, r[1]];
            };
        },
        process: function (rule, fn) {
            return function (s) {
                var r = rule.call(this, s);
                return [fn.call(this, r[0]), r[1]];
            };
        },
        min: function (min, rule) {
            return function (s) {
                var rx = rule.call(this, s);
                if (rx[0].length < min) {
                    throw new $P.Exception(s);
                }
                return rx;
            };
        }
    };


    // Generator Operators And Vector Operators

    // Generators are operators that have a signature of F(R) => R,
    // taking a given rule and returning another rule, such as
    // ignore, which parses a given rule and throws away the result.

    // Vector operators are those that have a signature of F(R1,R2,...) => R,
    // take a list of rules and returning a new rule, such as each.

    // Generator operators are converted (via the following _generator
    // function) into functions that can also take a list or array of rules
    // and return an array of new rules as though the function had been
    // called on each rule in turn (which is what actually happens).

    // This allows generators to be used with vector operators more easily.
    // Example:
    // each(ignore(foo, bar)) instead of each(ignore(foo), ignore(bar))

    // This also turns generators into vector operators, which allows
    // constructs like:
    // not(cache(foo, bar))

    var _generator = function (op) {
        return function () {
            var args = null, rx = [];
            if (arguments.length > 1) {
                args = Array.prototype.slice.call(arguments);
            } else if (arguments[0] instanceof Array) {
                args = arguments[0];
            }
            if (args) {
                for (var i = 0, px = args.shift(); i < px.length; i++) {
                    args.unshift(px[i]);
                    rx.push(op.apply(null, args));
                    args.shift();
                    return rx;
                }
            } else {
                return op.apply(null, arguments);
            }
        };
    };

    var gx = "optional not ignore cache".split(/\s/);

    for (var i = 0; i < gx.length; i++) {
        _[gx[i]] = _generator(_[gx[i]]);
    }

    var _vector = function (op) {
        return function () {
            if (arguments[0] instanceof Array) {
                return op.apply(null, arguments[0]);
            } else {
                return op.apply(null, arguments);
            }
        };
    };

    var vx = "each any all".split(/\s/);

    for (var j = 0; j < vx.length; j++) {
        _[vx[j]] = _vector(_[vx[j]]);
    }

}());

(function () {
    var $D = Date, $P = $D.prototype, $C = $D.CultureInfo;

    var flattenAndCompact = function (ax) {
        var rx = [];
        for (var i = 0; i < ax.length; i++) {
            if (ax[i] instanceof Array) {
                rx = rx.concat(flattenAndCompact(ax[i]));
            } else {
                if (ax[i]) {
                    rx.push(ax[i]);
                }
            }
        }
        return rx;
    };

    $D.Grammar = {};

    $D.Translator = {
        hour: function (s) {
            return function () {
                this.hour = Number(s);
            };
        },
        minute: function (s) {
            return function () {
                this.minute = Number(s);
            };
        },
        second: function (s) {
            return function () {
                this.second = Number(s);
            };
        },
        meridian: function (s) {
            return function () {
                this.meridian = s.slice(0, 1).toLowerCase();
            };
        },
        timezone: function (s) {
            return function () {
                var n = s.replace(/[^\d\+\-]/g, "");
                if (n.length) {
                    this.timezoneOffset = Number(n);
                } else {
                    this.timezone = s.toLowerCase();
                }
            };
        },
        day: function (x) {
            var s = x[0];
            return function () {
                this.day = Number(s.match(/\d+/)[0]);
            };
        },
        month: function (s) {
            return function () {
                this.month = (s.length == 3) ? "jan feb mar apr may jun jul aug sep oct nov dec".indexOf(s) / 4 : Number(s) - 1;
            };
        },
        year: function (s) {
            return function () {
                var n = Number(s);
                this.year = ((s.length > 2) ? n :
                    (n + (((n + 2000) < $C.twoDigitYearMax) ? 2000 : 1900)));
            };
        },
        rday: function (s) {
            return function () {
                switch (s) {
                    case "yesterday":
                        this.days = -1;
                        break;
                    case "tomorrow":
                        this.days = 1;
                        break;
                    case "today":
                        this.days = 0;
                        break;
                    case "now":
                        this.days = 0;
                        this.now = true;
                        break;
                }
            };
        },
        finishExact: function (x) {
            x = (x instanceof Array) ? x : [ x ];

            for (var i = 0; i < x.length; i++) {
                if (x[i]) {
                    x[i].call(this);
                }
            }

            var now = new Date();

            if ((this.hour || this.minute) && (!this.month && !this.year && !this.day)) {
                this.day = now.getDate();
            }

            if (!this.year) {
                this.year = now.getFullYear();
            }

            if (!this.month && this.month !== 0) {
                this.month = now.getMonth();
            }

            if (!this.day) {
                this.day = 1;
            }

            if (!this.hour) {
                this.hour = 0;
            }

            if (!this.minute) {
                this.minute = 0;
            }

            if (!this.second) {
                this.second = 0;
            }

            if (this.meridian && this.hour) {
                if (this.meridian == "p" && this.hour < 12) {
                    this.hour = this.hour + 12;
                } else if (this.meridian == "a" && this.hour == 12) {
                    this.hour = 0;
                }
            }

            if (this.day > $D.getDaysInMonth(this.year, this.month)) {
                throw new RangeError(this.day + " is not a valid value for days.");
            }

            var r = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second);

            if (this.timezone) {
                r.set({ timezone: this.timezone });
            } else if (this.timezoneOffset) {
                r.set({ timezoneOffset: this.timezoneOffset });
            }

            return r;
        },
        finish: function (x) {
            x = (x instanceof Array) ? flattenAndCompact(x) : [ x ];

            if (x.length === 0) {
                return null;
            }

            for (var i = 0; i < x.length; i++) {
                if (typeof x[i] == "function") {
                    x[i].call(this);
                }
            }

            var today = $D.today();

            if (this.now && !this.unit && !this.operator) {
                return new Date();
            } else if (this.now) {
                today = new Date();
            }

            var expression = !!(this.days && this.days !== null || this.orient || this.operator);

            var gap, mod, orient;
            orient = ((this.orient == "past" || this.operator == "subtract") ? -1 : 1);

            if (!this.now && "hour minute second".indexOf(this.unit) != -1) {
                today.setTimeToNow();
            }

            if (this.month || this.month === 0) {
                if ("year day hour minute second".indexOf(this.unit) != -1) {
                    this.value = this.month + 1;
                    this.month = null;
                    expression = true;
                }
            }

            if (!expression && this.weekday && !this.day && !this.days) {
                var temp = Date[this.weekday]();
                this.day = temp.getDate();
                if (!this.month) {
                    this.month = temp.getMonth();
                }
                this.year = temp.getFullYear();
            }

            if (expression && this.weekday && this.unit != "month") {
                this.unit = "day";
                gap = ($D.getDayNumberFromName(this.weekday) - today.getDay());
                mod = 7;
                this.days = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
            }

            if (this.month && this.unit == "day" && this.operator) {
                this.value = (this.month + 1);
                this.month = null;
            }

            if (this.value != null && this.month != null && this.year != null) {
                this.day = this.value * 1;
            }

            if (this.month && !this.day && this.value) {
                today.set({ day: this.value * 1 });
                if (!expression) {
                    this.day = this.value * 1;
                }
            }

            if (!this.month && this.value && this.unit == "month" && !this.now) {
                this.month = this.value;
                expression = true;
            }

            if (expression && (this.month || this.month === 0) && this.unit != "year") {
                this.unit = "month";
                gap = (this.month - today.getMonth());
                mod = 12;
                this.months = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
                this.month = null;
            }

            if (!this.unit) {
                this.unit = "day";
            }

            if (!this.value && this.operator && this.operator !== null && this[this.unit + "s"] && this[this.unit + "s"] !== null) {
                this[this.unit + "s"] = this[this.unit + "s"] + ((this.operator == "add") ? 1 : -1) + (this.value || 0) * orient;
            } else if (this[this.unit + "s"] == null || this.operator != null) {
                if (!this.value) {
                    this.value = 1;
                }
                this[this.unit + "s"] = this.value * orient;
            }

            if (this.meridian && this.hour) {
                if (this.meridian == "p" && this.hour < 12) {
                    this.hour = this.hour + 12;
                } else if (this.meridian == "a" && this.hour == 12) {
                    this.hour = 0;
                }
            }

            if (this.weekday && !this.day && !this.days) {
                var temp = Date[this.weekday]();
                this.day = temp.getDate();
                if (temp.getMonth() !== today.getMonth()) {
                    this.month = temp.getMonth();
                }
            }

            if ((this.month || this.month === 0) && !this.day) {
                this.day = 1;
            }

            if (!this.orient && !this.operator && this.unit == "week" && this.value && !this.day && !this.month) {
                return Date.today().setWeek(this.value);
            }

            if (expression && this.timezone && this.day && this.days) {
                this.day = this.days;
            }

            return (expression) ? today.add(this) : today.set(this);
        }
    };

    var _ = $D.Parsing.Operators, g = $D.Grammar, t = $D.Translator, _fn;

    g.datePartDelimiter = _.rtoken(/^([\s\-\.\,\/\x27]+)/);
    g.timePartDelimiter = _.stoken(":");
    g.whiteSpace = _.rtoken(/^\s*/);
    g.generalDelimiter = _.rtoken(/^(([\s\,]|at|@|on)+)/);

    var _C = {};
    g.ctoken = function (keys) {
        var fn = _C[keys];
        if (! fn) {
            var c = $C.regexPatterns;
            var kx = keys.split(/\s+/), px = [];
            for (var i = 0; i < kx.length; i++) {
                px.push(_.replace(_.rtoken(c[kx[i]]), kx[i]));
            }
            fn = _C[keys] = _.any.apply(null, px);
        }
        return fn;
    };
    g.ctoken2 = function (key) {
        return _.rtoken($C.regexPatterns[key]);
    };

    // hour, minute, second, meridian, timezone
    g.h = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2]|[1-9])/), t.hour));
    g.hh = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2])/), t.hour));
    g.H = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/), t.hour));
    g.HH = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3])/), t.hour));
    g.m = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.minute));
    g.mm = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.minute));
    g.s = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.second));
    g.ss = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.second));
    g.hms = _.cache(_.sequence([g.H, g.m, g.s], g.timePartDelimiter));

    // _.min(1, _.set([ g.H, g.m, g.s ], g._t));
    g.t = _.cache(_.process(g.ctoken2("shortMeridian"), t.meridian));
    g.tt = _.cache(_.process(g.ctoken2("longMeridian"), t.meridian));
    g.z = _.cache(_.process(_.rtoken(/^((\+|\-)\s*\d\d\d\d)|((\+|\-)\d\d\:?\d\d)/), t.timezone));
    g.zz = _.cache(_.process(_.rtoken(/^((\+|\-)\s*\d\d\d\d)|((\+|\-)\d\d\:?\d\d)/), t.timezone));

    g.zzz = _.cache(_.process(g.ctoken2("timezone"), t.timezone));
    g.timeSuffix = _.each(_.ignore(g.whiteSpace), _.set([ g.tt, g.zzz ]));
    g.time = _.each(_.optional(_.ignore(_.stoken("T"))), g.hms, g.timeSuffix);

    // days, months, years
    g.d = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1]|\d)/),
        _.optional(g.ctoken2("ordinalSuffix"))), t.day));
    g.dd = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1])/),
        _.optional(g.ctoken2("ordinalSuffix"))), t.day));
    g.ddd = g.dddd = _.cache(_.process(g.ctoken("sun mon tue wed thu fri sat"),
        function (s) {
            return function () {
                this.weekday = s;
            };
        }
    ));
    g.M = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d|\d)/), t.month));
    g.MM = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d)/), t.month));
    g.MMM = g.MMMM = _.cache(_.process(
        g.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"), t.month));
    g.y = _.cache(_.process(_.rtoken(/^(\d\d?)/), t.year));
    g.yy = _.cache(_.process(_.rtoken(/^(\d\d)/), t.year));
    g.yyy = _.cache(_.process(_.rtoken(/^(\d\d?\d?\d?)/), t.year));
    g.yyyy = _.cache(_.process(_.rtoken(/^(\d\d\d\d)/), t.year));

    // rolling these up into general purpose rules
    _fn = function () {
        return _.each(_.any.apply(null, arguments), _.not(g.ctoken2("timeContext")));
    };

    g.day = _fn(g.d, g.dd);
    g.month = _fn(g.M, g.MMM);
    g.year = _fn(g.yyyy, g.yy);

    // relative date / time expressions
    g.orientation = _.process(g.ctoken("past future"),
        function (s) {
            return function () {
                this.orient = s;
            };
        }
    );
    g.operator = _.process(g.ctoken("add subtract"),
        function (s) {
            return function () {
                this.operator = s;
            };
        }
    );
    g.rday = _.process(g.ctoken("yesterday tomorrow today now"), t.rday);
    g.unit = _.process(g.ctoken("second minute hour day week month year"),
        function (s) {
            return function () {
                this.unit = s;
            };
        }
    );
    g.value = _.process(_.rtoken(/^\d\d?(st|nd|rd|th)?/),
        function (s) {
            return function () {
                this.value = s.replace(/\D/g, "");
            };
        }
    );
    g.expression = _.set([ g.rday, g.operator, g.value, g.unit, g.orientation, g.ddd, g.MMM ]);

    // pre-loaded rules for different date part order preferences
    _fn = function () {
        return  _.set(arguments, g.datePartDelimiter);
    };
    g.mdy = _fn(g.ddd, g.month, g.day, g.year);
    g.ymd = _fn(g.ddd, g.year, g.month, g.day);
    g.dmy = _fn(g.ddd, g.day, g.month, g.year);
    g.date = function (s) {
        return ((g[$C.dateElementOrder] || g.mdy).call(this, s));
    };

    // parsing date format specifiers - ex: "h:m:s tt"
    // this little guy will generate a custom parser based
    // on the format string, ex: g.format("h:m:s tt")
    g.format = _.process(_.many(
        _.any(
            // translate format specifiers into grammar rules
            _.process(
                _.rtoken(/^(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/),
                function (fmt) {
                    if (g[fmt]) {
                        return g[fmt];
                    } else {
                        throw $D.Parsing.Exception(fmt);
                    }
                }
            ),
            // translate separator tokens into token rules
            _.process(
                _.rtoken(/^[^dMyhHmstz]+/), // all legal separators
                function (s) {
                    return _.ignore(_.stoken(s));
                }
            )
        )),
        // construct the parser ...
        function (rules) {
            return _.process(_.each.apply(null, rules), t.finishExact);
        }
    );

    var _F = {
        //"M/d/yyyy": function (s) {
        //	var m = s.match(/^([0-2]\d|3[0-1]|\d)\/(1[0-2]|0\d|\d)\/(\d\d\d\d)/);
        //	if (m!=null) {
        //		var r =  [ t.month.call(this,m[1]), t.day.call(this,m[2]), t.year.call(this,m[3]) ];
        //		r = t.finishExact.call(this,r);
        //		return [ r, "" ];
        //	} else {
        //		throw new Date.Parsing.Exception(s);
        //	}
        //}
        //"M/d/yyyy": function (s) { return [ new Date(Date._parse(s)), ""]; }
    };
    var _get = function (f) {
        return _F[f] = (_F[f] || g.format(f)[0]);
    };

    g.formats = function (fx) {
        if (fx instanceof Array) {
            var rx = [];
            for (var i = 0; i < fx.length; i++) {
                rx.push(_get(fx[i]));
            }
            return _.any.apply(null, rx);
        } else {
            return _get(fx);
        }
    };

    // check for these formats first
    g._formats = g.formats([
        "\"yyyy-MM-ddTHH:mm:ssZ\"",
        "yyyy-MM-ddTHH:mm:ssZ",
        "yyyy-MM-ddTHH:mm:ssz",
        "yyyy-MM-ddTHH:mm:ss",
        "yyyy-MM-ddTHH:mmZ",
        "yyyy-MM-ddTHH:mmz",
        "yyyy-MM-ddTHH:mm",
        "ddd, MMM dd, yyyy H:mm:ss tt",
        "ddd MMM d yyyy HH:mm:ss zzz",
        "MMddyyyy",
        "ddMMyyyy",
        "Mddyyyy",
        "ddMyyyy",
        "Mdyyyy",
        "dMyyyy",
        "yyyy",
        "Mdyy",
        "dMyy",
        "d"
    ]);

    // starting rule for general purpose grammar
    g._start = _.process(_.set([ g.date, g.time, g.expression ],
        g.generalDelimiter, g.whiteSpace), t.finish);

    // real starting rule: tries selected formats first,
    // then general purpose rule
    /**
     * @function
     * @param {string} s
     */
    g.start = function (s) {
        try {
            var r = g._formats.call({}, s);
            if (r[1].length === 0) {
                return r;
            }
        } catch (e) {
        }
        return g._start.call({}, s);
    };

    $D._parse = $D.parse;

    /**
     * Converts the specified string value into its JavaScript Date equivalent using CultureInfo specific format information.
     * @function
     * @param {string} s  The string value to convert into a Date object [Required]
     * @return {Date} A Date object or null if the string cannot be converted into a Date.
     * @example
     * ///////////
     * // Dates //
     * ///////////
     *
     * // 15-Oct-2004
     * var d1 = Date.parse("10/15/2004");
     *
     * // 15-Oct-2004
     * var d1 = Date.parse("15-Oct-2004");
     *
     * // 15-Oct-2004
     * var d1 = Date.parse("2004.10.15");
     *
     * //Fri Oct 15, 2004
     * var d1 = Date.parse("Fri Oct 15, 2004");
     *
     * ///////////
     * // Times //
     * ///////////
     *
     * // Today at 10 PM.
     * var d1 = Date.parse("10 PM");
     *
     * // Today at 10:30 PM.
     * var d1 = Date.parse("10:30 P.M.");
     *
     * // Today at 6 AM.
     * var d1 = Date.parse("06am");
     *
     * /////////////////////
     * // Dates and Times //
     * /////////////////////
     *
     * // 8-July-2004 @ 10:30 PM
     * var d1 = Date.parse("July 8th, 2004, 10:30 PM");
     *
     * // 1-July-2004 @ 10:30 PM
     * var d1 = Date.parse("2004-07-01T22:30:00");
     *
     * ////////////////////
     * // Relative Dates //
     * ////////////////////
     *
     * // Returns today's date. The string "today" is culture specific.
     * var d1 = Date.parse("today");
     *
     * // Returns yesterday's date. The string "yesterday" is culture specific.
     * var d1 = Date.parse("yesterday");
     *
     * // Returns the date of the next thursday.
     * var d1 = Date.parse("Next thursday");
     *
     * // Returns the date of the most previous monday.
     * var d1 = Date.parse("last monday");
     *
     * // Returns today's day + one year.
     * var d1 = Date.parse("next year");
     *
     * ///////////////
     * // Date Math //
     * ///////////////
     *
     * // Today + 2 days
     * var d1 = Date.parse("t+2");
     *
     * // Today + 2 days
     * var d1 = Date.parse("today + 2 days");
     *
     * // Today + 3 months
     * var d1 = Date.parse("t+3m");
     *
     * // Today - 1 year
     * var d1 = Date.parse("today - 1 year");
     *
     * // Today - 1 year
     * var d1 = Date.parse("t-1y");
     *
     *
     * /////////////////////////////
     * // Partial Dates and Times //
     * /////////////////////////////
     *
     * // July 15th of this year.
     * var d1 = Date.parse("July 15");
     *
     * // 15th day of current day and year.
     * var d1 = Date.parse("15");
     *
     * // July 1st of current year at 10pm.
     * var d1 = Date.parse("7/1 10pm");
     */
    $D.parse = function (s) {
        var r = null;
        if (!s) {
            return null;
        }
        if (s instanceof Date) {
            return s;
        }
        try {
            r = $D.Grammar.start.call({}, s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1"));
        } catch (e) {
            return null;
        }
        return ((r[1].length === 0) ? r[0] : null);
    };

    $D.getParseFunction = function (fx) {
        var fn = $D.Grammar.formats(fx);
        return function (s) {
            var r = null;
            try {
                r = fn.call({}, s);
            } catch (e) {
                return null;
            }
            return ((r[1].length === 0) ? r[0] : null);
        };
    };

    /**
     * Converts the specified string value into its JavaScript Date equivalent using the specified format {string} or formats {Array} and the CultureInfo specific format information. The format of the string value must match one of the supplied formats exactly.
     * @function
     * @param {string} s  The string value to convert into a Date object [Required].
     * @param {Object} fx  The expected format {string} or an array of expected formats {Array} of the date string [Required].
     * @return {Date}  A Date object or null if the string cannot be converted into a Date.
     * @example
     * // 15-Oct-2004
     * var d1 = Date.parseExact("10/15/2004", "M/d/yyyy");
     *
     * // 15-Oct-2004
     * var d1 = Date.parse("15-Oct-2004", "M-ddd-yyyy");
     *
     * // 15-Oct-2004
     * var d1 = Date.parse("2004.10.15", "yyyy.MM.dd");
     *
     * // Multiple formats
     * var d1 = Date.parseExact("10/15/2004", ["M/d/yyyy", "MMMM d, yyyy"]);
     */
    $D.parseExact = function (s, fx) {
        return $D.getParseFunction(fx)(s);
    };

}());


// Date
var FUNCTION_CLASS = '[object Function]',
    BOOLEAN_CLASS = '[object Boolean]',
    ARRAY_CLASS = '[object Array]',
    DATE_CLASS = '[object Date]';
var _toString = Object.prototype.toString;

// TODO much like Array.isArray these should probably be moved into a shim i.e. Foo.isFoo(obj)

var isDate = function(object) {
    return _toString.call(object) === DATE_CLASS;
};

var formatDate = function(v, format) {
    var date;
    if (typeof v === "string") {
        // try to create a Date instance from the string
        // date must be a string that can be parsed by Date
        // see - http://www.w3schools.com/jsref/jsref_parse.asp
        date = new Date(Date.parse(v));
    } else if (typeof v === "number") {
        date = new Date(v);
    } else {
        date = v;
    }
    if (isDate(date)) {
        return date.format(format);
    }
    return v;

};


/**
 * Date Validator:
 * @class DateValidator
 * @classdesc Validate that date provided as string/number can be converted to a Date Object using the pattern provided.
 * @extends Validator
 */
var DateValidator = exports.DateValidator = Validator.specialize(/** @lends DateValidator# */ {

    /**
     * @type {Property}
     * @default {Date} 'MM/dd/yyyy'
     */
    pattern: {
        value: 'MM/dd/yyyy'
    },

    /**
     * @function
     * @param {Date} v Value.
     * //@returns {message: 'Unable to parse date - ' + v + ' in the format - ' + this.pattern} | new Date(result)
     */
    validate: {
        value: function(v) {
            // @todo - implement a Date validator that will accept all the date formats
            // that we support for Formatting
            // for now, just accept what is possible by default
            //var result = Date.parse(v, this.pattern);
            var result = Date.parseExact(v, this.pattern);
            if (isNaN(result) || result == null) {
                // The parseDate returns the default Unix date (12/31/1969) if it is unable to parse
                // the date in the format
                return {message: 'Unable to parse date - ' + v + ' in the format - ' + this.pattern};
            } else {
                return new Date(result);
            }
        }
    }
});


// Date Converter
/**
 * @class DateConverter
 */
var DateConverter = exports.DateConverter = Converter.specialize(/** @lends DateConverter# */ {
    /**
     Specifies whether the converter allows partial conversion.
     @type {Property}
     @default {boolean} true
     */
    allowPartialConversion: {
        value: false
    },

    /**
     * @type {Property}
     * @default {Function} new DateValidator()
     */
    validator: {
        value: new DateValidator()
    },

    // valid fn values are:
    /**
     * @type {Property}
     * @default {Date} 'MM/dd/yyyy'
     */
    pattern: {
        value: 'MM/dd/yyyy'
    },

    /**
     * @method
     * @param {Date} v Value.
     * @returns v
     */
    convert: {
        value: function(v) {
            var t = typeof v;
            if (isDate(v) || t === "string" || t === "number") {
                return formatDate(v, this.pattern);
            }
            return v;
        }
    },
    /**
     * @method
     * @param {Date} v Value.
     */
    revert: {
        value: function(v) {
            if(isDate(v)) {
                return v;
            }
            this.validator.pattern = this.pattern;

            var result = this.validator.validate(v);
            if (isDate(result)) {
                return result;
            } else {
                throw new Error(result.message);
            }
        }
    }
});
