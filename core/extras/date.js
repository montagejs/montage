var Range = require("../range").Range;


/**
*  Defines extensions to intrinsic `Date` object.
 *
*  @module montage/core/extras/date
*  @see {external:Date}
*/

/**
 * @external
 */



/**
 *  Returns a date UnixTime, which is the number of seconds since the Unix Epoch.
 *
 *  @property external:Date#unixTime
 *  @returns {Number} - the UnixTime
*/
Object.defineProperty(Date.prototype, "unixTime", {
    get: function () {
        return this.getTime() / 1000 | 0;
    },
    enumerable: true,
    configurable: true
});

/**
 *  Creates a copy of a date.
 *
 *  @function external:Date#clone
 *  @returns {Date} - a new date
*/
Object.defineProperty(Date.prototype, "clone", {
    value: function () {
        return new Date(this);
    },
    writable: true,
    enumerable: false,
    configurable: true
});

Object.defineProperty(Date.prototype, "fullDayRange", {

    get: function (date) {
        var dayStart = this.clone();
        dayStart.setHours(0, 0, 0, 0);
        var dayEnd = dayStart.clone();
        dayEnd.setHours(23, 59, 59, 999);
        return new Range(dayStart, dayEnd);
    },
    enumerable: false,
    configurable: true
});
Object.defineProperty(Date.prototype, "adjustComponentValues", {
    value: function (year, monthIndex, days, hours, minutes, seconds, milliseconds) {

        // because of the duration optimizations it is much
        // more efficient to grab all the values up front
        // then set them directly (which will avoid a normalization call).
        // So we don't actually normalize until we need it.
        var millisecond,
            second,
            minute,
            hour,
            myDay,
            month,
            myYear;

        if (Number.isFinite(milliseconds) && milliseconds !== 0) {
            millisecond = this.millisecond;
            millisecond += milliseconds;
            this.millisecond = milliseconds;
        }

        if (Number.isFinite(seconds) && seconds !== 0) {
            second = this.second;
            second += seconds;
            this.second = second;
        }

        if (Number.isFinite(minutes) && minutes !== 0) {
            minute = this.minute;
            minute += minutes;
            this.minute = minute;
        }

        if (Number.isFinite(hours) && hours !== 0) {
            hour = this.hour;
            hour += hours;
            this.hour = hour;
        }

        if (Number.isFinite(days) && days !== 0) {
            myDay = this.day;
            myDay += days;
            this.day = myDay;
        }

        if (Number.isFinite(monthIndex) && monthIndex !== 0) {
            month = this.month;
            month += monthIndex;
            this.month = month;
        }

        if (Number.isFinite(year) && year !== 0) {
            myYear = this.year;
            myYear += year;
            this.year = myYear;
        }
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Date.prototype, "adjustDuration", {
    value: function adjustDuration(duration) {

        return this.adjustComponentValues(duration.years, duration.months, (duration.weeks*7)+ duration.days, duration.hours, duration.minutes, duration.seconds, duration.milliseconds);
    },
    writable: true,
    enumerable: false,
    configurable: true
});


/*
    TimeOffset
*/

Object.defineProperty(Date.prototype, "dateByAdjustingComponentValues", {
    value: function dateByAdjustingComponentValues(year, monthIndex, day, hours, minutes, seconds, milliseconds) {
        var calendarDate = this.clone();
        calendarDate.adjustComponentValues(year, monthIndex, day, hours, minutes, seconds, milliseconds);
        return calendarDate;
    },
    writable: true,
    enumerable: false,
    configurable: true
});

Object.defineProperty(Date.prototype, "dateByAdjustingDuration", {
    value: function dateByAdjustingDuration(duration) {

        return this.dateByAdjustingComponentValues(duration.years, duration.months, (duration.weeks*7)+ duration.days, duration.hours, duration.minutes, duration.seconds, duration.milliseconds);
    },
    writable: true,
    enumerable: false,
    configurable: true
});


/**
 *  Assess if an instance a date is valid
 *
 *      - date checks whether the parameter was not a falsy value (undefined, null, 0, "", etc..)
 *      - Object.prototype.toString.call(date) returns a native string representation of the given object type - In our case "[object Date]".
 *      Because date.toString() overrides its parent method, we need to .call or .apply the method from Object.prototype directly which ..
 *      Bypasses user-defined object type with the same constructor name (e.g.: "Date")
 *      Works across different JS contexts (e.g. iframes) in contrast to instanceof or Date.prototype.isPrototypeOf.
 *      - !isNaN(date) finally checks whether the value was not an Invalid Date.
 *
 *  @function external:Date#isValid
 *  @returns {boolean} - result
*/

Object.defineProperty(Date, "isValidDate", {
    value: function isValidDate(date) {
        return date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date);
    },
    writable: true,
    enumerable: false,
    configurable: true
});


/**
 *  Assess if a string is a known representation of a date
 *
 *
 *  @function external:Date#isValid
 *  @returns {boolean} - result
*/

Object.defineProperty(Date, "isValidDateString", {
    value: function isValidDate(date) {
        return date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date);
    },
    writable: true,
    enumerable: false,
    configurable: true
});



/*
 * rfc3339date.js version 0.1.3
 *
 * from https://github.com/tardate/rfc3339date.js/blob/master/rfc3339date.js
 *
 * Adds ISO 8601 / RFC 3339 date parsing to the Javascript Date object.
 * Usage:
 *   var d = Date.parseISO8601( "2010-07-20T15:00:00Z" );
 *   var d = Date.parse( "2010-07-20T15:00:00Z" );
 * Tested for compatibilty/coexistence with:
 *   - jQuery [http://jquery.com]
 *   - datejs [http://www.datejs.com/]
 *
 * Copyright (c) 2010 Paul GALLAGHER http://tardate.com
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 */

/*
 * Number.prototype.toPaddedString
 * Number instance method used to left-pad numbers to the specified length
 * Used by the Date.prototype.toRFC3339XXX methods
 */
Number.prototype.toPaddedString = function (len, fillchar) {
    var result = this.toString();
    if (typeof (fillchar) == 'undefined') { fillchar = '0' };
    while (result.length < len) { result = fillchar + result; };
    return result;
}

/*
 * Date.prototype.toRFC3339UTCString
 * Date instance method to format the date as ISO8601 / RFC 3339 string (in UTC format).
 * Usage: var d = new Date().toRFC3339UTCString();
 *              => "2010-07-25T11:51:31.427Z"
 * Parameters:
 *  supressFormating : if supplied and 'true', will force to remove date/time separators
  *  supressMillis : if supplied and 'true', will force not to include milliseconds
*/
Date.prototype.toRFC3339UTCString = function (supressFormating, supressMillis) {
    var dSep = (supressFormating ? '' : '-');
    var tSep = (supressFormating ? '' : ':');
    var result = this.getUTCFullYear().toString();
    result += dSep + (this.getUTCMonth() + 1).toPaddedString(2);
    result += dSep + this.getUTCDate().toPaddedString(2);
    result += 'T' + this.getUTCHours().toPaddedString(2);
    result += tSep + this.getUTCMinutes().toPaddedString(2);
    result += tSep + this.getUTCSeconds().toPaddedString(2);
    if ((!supressMillis) && (this.getUTCMilliseconds() > 0)) result += '.' + this.getUTCMilliseconds().toPaddedString(3);
    return result + 'Z';
}

/*
 * Date.prototype.toRFC3339LocaleString
 * Date instance method to format the date as ISO8601 / RFC 3339 string (in local timezone format).
 * Usage: var d = new Date().toRFC3339LocaleString();
 *              => "2010-07-25T19:51:31.427+08:00"
 * Parameters:
 *  supressFormating : if supplied and 'true', will force to remove date/time separators
 *  supressMillis : if supplied and 'true', will force not to include milliseconds
*/
Date.prototype.toRFC3339LocaleString = function (supressFormating, supressMillis) {
    var dSep = (supressFormating ? '' : '-');
    var tSep = (supressFormating ? '' : ':');
    var result = this.getFullYear().toString();
    result += dSep + (this.getMonth() + 1).toPaddedString(2);
    result += dSep + this.getDate().toPaddedString(2);
    result += 'T' + this.getHours().toPaddedString(2);
    result += tSep + this.getMinutes().toPaddedString(2);
    result += tSep + this.getSeconds().toPaddedString(2);
    if ((!supressMillis) && (this.getMilliseconds() > 0)) result += '.' + this.getMilliseconds().toPaddedString(3);
    var tzOffset = -this.getTimezoneOffset();
    result += (tzOffset < 0 ? '-' : '+')
    result += (tzOffset / 60).toPaddedString(2);
    result += tSep + (tzOffset % 60).toPaddedString(2);
    return result;
}

var parseRFC3339_RegExp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)?(:)?(\d\d)?([\.,]\d+)?($|Z|([+-])(\d\d)(:)?(\d\d)?)/i;

function _stringMatchRFC3339(dString, isString) {

    // if ((isString !== true || (typeof dString != 'string')) && !dString.endsWith("Z")) return;
    // return dString.match(_stringMatchRFC3339.parseRFC3339_RegExp);

    if ((isString || typeof dString === 'string') && dString.endsWith("Z")) {
        return dString.match(_stringMatchRFC3339.parseRFC3339_RegExp);
    }

}
_stringMatchRFC3339.parseRFC3339_RegExp = parseRFC3339_RegExp

/*
 * Date.parseRFC3339
 * extend Date with a method parsing ISO8601 / RFC 3339 date strings.
 * Usage: var d = Date.parseRFC3339( "2010-07-20T15:00:00Z" );
 */
function _parseRFC3339(dString, isString) {
    var result,
        d = _stringMatchRFC3339(dString, isString);

    if (d) {
        var year = parseInt(d[1], 10),
            mon = parseInt(d[3], 10) - 1,
            day = parseInt(d[5], 10),
            hour = parseInt(d[7], 10),
            mins = (d[9] ? parseInt(d[9], 10) : 0),
            secs = (d[11] ? parseInt(d[11], 10) : 0),
            millis = (d[12] ? parseFloat(String(1.5).charAt(1) + d[12].slice(1)) * 1000 : 0);

        if (d[13]) {
            result = new Date(0);
            result.setUTCFullYear(year);
            result.setUTCMonth(mon);
            result.setUTCDate(day);
            result.setUTCHours(hour);
            result.setUTCMinutes(mins);
            result.setUTCSeconds(secs);
            result.setUTCMilliseconds(millis);
            if (d[13] && d[14]) {
                var offset = (d[15] * 60)
                if (d[17]) offset += parseInt(d[17], 10);
                offset *= ((d[14] == '-') ? -1 : 1);
                result.setTime(result.getTime() - offset * 60 * 1000);
            }
        } else {
            result = new Date(year, mon, day, hour, mins, secs, millis);
        }
    }
    return result;
    //}

};

_parseRFC3339.endsByZ = /Z$/i;
Date.parseRFC3339 = _parseRFC3339;
Date.stringMatchRFC3339 = _stringMatchRFC3339;


function isRFC3339DateString(dString) {
    if ((_typeOf || (typeof dString)) != 'string' || !isRFC3339DateString.endsByZ.test(dString)) return false;
    return isRFC3339DateString.parseRFC3339_RegExp.test(dString);
};
isRFC3339DateString.parseRFC3339_RegExp = parseRFC3339_RegExp;
isRFC3339DateString.endsByZ = _parseRFC3339.endsByZ;
Date.isRFC3339DateString = isRFC3339DateString;

if (!Object.getOwnPropertyDescriptor(Date.prototype, 'year')) {

    Object.defineProperties(Date.prototype, {
        "year": {
            get: function () {
                return this.getFullYear();
            },
            set: function (value) {
                return this.setFullYear(value);
            },
            configurable: true
        },
        "month": {
            get: function () {
                //Date API is 0 based
                return this.getMonth() + 1;
            },
            set: function (value) {
                //Date API is 0 based
                return this.setMonth(value - 1);
            },
            configurable: true
        },
        "day": {
            get: function () {
                return this.getDate();
            },
            set: function (value) {
                return this.setDate(value);
            },
            configurable: true
        },
        "hour": {
            get: function () {
                return this.getHours();
            },
            set: function (value) {
                return this.setHours(value);
            },
            configurable: true
        },
        "minute": {
            get: function () {
                return this.getMinutes();
            },
            set: function (value) {
                return this.setMinutes(value);
            },
            configurable: true
        },
        "second": {
            get: function () {
                return this.getSeconds();
            },
            set: function (value) {
                return this.setSeconds(value);
            },
            configurable: true
        },
        "millisecond": {
            get: function () {
                return this.getMilliseconds();
            },
            set: function (value) {
                return this.setMilliseconds(value);
            },
            configurable: true
        }
    });
}


Object.defineProperty(Date.prototype, "isToday", {
    get: function () {
        var today = new Date();
        return this.day === today.day &&
            this.month === today.month &&
            this.year === today.year;
    },
    configurable: true
});






/**********
 * Part of https://github.com/tardate/rfc3339date.js/.
 * But it not only conflicts with a Date.parse override currently done in date-converter.js,
 * it's also wrong as JavaScript standard Date.parse doesn't return a date but a number of milliseconds
 */

/*
 * Date.parse
 * extend Date with a parse method alias for parseRFC3339.
 * If parse is already defined, chain methods to include parseRFC3339
 * Usage: var d = Date.parse( "2010-07-20T15:00:00Z" );
 */
//   if (typeof Date.parse != 'function') {
//     Date.parse = Date.parseRFC3339;
//   } else {
//     var oldparse = Date.parse;
//     Date.parse = function(d) {
//       var result = Date.parseRFC3339(d);
//       if (!result && oldparse) {
//         result = oldparse(d);
//       }
//       return result;
//     }
//   }



/*
    from https://github.com/iamkun/dayjs/blob/dev/src/index.js#L53
    and
    https://github.com/iamkun/dayjs/blob/dev/src/constant.js
*/

/*
exports- const SECONDS_A_MINUTE = 60
exports- const SECONDS_A_HOUR = SECONDS_A_MINUTE * 60
exports- const SECONDS_A_DAY = SECONDS_A_HOUR * 24
exports- const SECONDS_A_WEEK = SECONDS_A_DAY * 7

exports- const MILLISECONDS_A_SECOND = 1e3
exports- const MILLISECONDS_A_MINUTE = SECONDS_A_MINUTE * MILLISECONDS_A_SECOND
exports- const MILLISECONDS_A_HOUR = SECONDS_A_HOUR * MILLISECONDS_A_SECOND
exports- const MILLISECONDS_A_DAY = SECONDS_A_DAY * MILLISECONDS_A_SECOND
exports- const MILLISECONDS_A_WEEK = SECONDS_A_WEEK * MILLISECONDS_A_SECOND

// English locales
exports- const MS = 'millisecond'
exports- const S = 'second'
exports- const MIN = 'minute'
exports- const H = 'hour'
exports- const D = 'day'
exports- const W = 'week'
exports- const M = 'month'
exports- const Q = 'quarter'
exports- const Y = 'year'
exports- const DATE = 'date'

exports- const FORMAT_DEFAULT = 'YYYY-MM-DDTHH:mm:ssZ'

exports- const INVALID_DATE_STRING = 'Invalid Date'

// regex
exports- const REGEX_PARSE = /^(\d{4})-?(\d{1,2})-?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?.?(\d{1,3})?$/
exports- const REGEX_FORMAT = /\[([^\]]+)]|Y{2,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g
*/

/*
const parseDate = (cfg) => {
    const { date, utc } = cfg
    if (date === null) return new Date(NaN) // null is invalid
    if (Utils.u(date)) return new Date() // today
    if (date instanceof Date) return new Date(date)
    if (typeof date === 'string' && !/Z$/i.test(date)) {
      const d = date.match(C.REGEX_PARSE)
      if (d) {
        if (utc) {
          return new Date(Date.UTC(d[1], d[2] - 1, d[3]
            || 1, d[4] || 0, d[5] || 0, d[6] || 0, d[7] || 0))
        }
        return new Date(d[1], d[2] - 1, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, d[7] || 0)
      }
    }

    return new Date(date) // everything else
  }
*/


/*
    other
    https://jsfiddle.net/qm9osm4a/

    from: https://stackoverflow.com/questions/522251/whats-the-difference-between-iso-8601-and-rfc-3339-date-formats
*/
/*
var dateRegex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})\.?(\d{3})?(?:(?:([+-]\d{2}):?(\d{2}))|Z)?$/;

  function parseISODate(d) {
    var m = dateRegex.exec(d);
    //milliseconds are optional.
    if( m[7] === undefined ){
      m[7] = 0;
    }

    //if timezone is undefined, it must be Z or nothing (otherwise the group would have captured).
    if( m[8] === undefined && m[9] === undefined){
      //Use UTC.
      m[8] = 0;
      m[9] = 0;
    }

    var year   = +m[1];
    var month  = +m[2];
    var day    = +m[3];
    var hour   = +m[4];
    var minute = +m[5];
    var second = +m[6];
    var msec   = +m[7];
    var tzHour = +m[8];
    var tzMin  = +m[9];
    var tzOffset = tzHour * 60 + tzMin;

    //console.log(year+', '+(month - 1)+', '+day+', '+hour+', '+(minute - tzOffset)+', '+second+', '+msec);

    return new Date(year, month - 1, day, hour, minute - tzOffset, second, msec);
  }

    //Override the browser's default parse function first, but if that fails fall back to parseISODate.
  Date.defaultParse = Date.parse;
  Date.parse = function(d){
    var defaultVal;
    try {
      defaultVal = Date.defaultParse(d);
    }
    catch(err){}
    if( defaultVal ){
      return defaultVal;
    }
    else{
      try {
        return parseISODate(d).getTime();
      }
      catch(err){
        return NaN;
      }
    }
  }
  */
