/*

*/
var Montage = require("../core").Montage,
    ICAL = require('ical.js'),
    TimeZone = require("./time-zone-core").TimeZone,
    currentEnvironment = require("../environment").currentEnvironment,
    ICAL_Time = ICAL.Time,
    ICAL_Time_Prototype = ICAL.Time.prototype,
    CalendarDate = exports.CalendarDate = ICAL_Time,
    CalendarDatePrototype = ICAL_Time_Prototype,
    Range = require("../range").Range;


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
 * Create a new . The instance is modified in
 * place.
 *
 * @param {Number=} year            The year for this date
 * @param {Number=} month           The month for this date - starting at 1
 * @param {Number=} day             The day for this date
 * @param {Number=} hours           The hour for this date
 * @param {Number=} minutes         The minute for this date
 * @param {Number=} seconds         The second for this date
 * @param {Number=} milliseconds    The milliseconds for this date
 * @param {TimeZone} timeZone       The timeZone for this date
 *
 * borrowing from ical.js time.js fromData() that we unfortunately
 * can't re-factor to extract what we need in a way it would be used
 * in both places.
 */

CalendarDate.withUTCComponentValuesInTimeZone = function(year, month, day, hours, minutes, seconds, milliseconds, timeZone) {
    var calendarDate = new CalendarDate();

    calendarDate.isDate = hours === undefined || hours === null;

    //Initialize in UTC
    if(year) {
        calendarDate.year = Number(year);
    }
    if(month) {
        calendarDate.month = Number(month);
    }
    if(day) {
        calendarDate.day = Number(day);
    }
    if(hours) {
        calendarDate.hour = Number(hours);
    }
    if(minutes) {
        calendarDate.minute = Number(minutes);
    }
    if(seconds) {
        calendarDate.second = Number(seconds);
    }
    calendarDate.zone = TimeZone.UTCTimeZone;



    //Then convert to timeZone if we have one
    if(timeZone) {
        calendarDate.timeZone = timeZone;
    }

    calendarDate._cachedUnixTime = null;

    return calendarDate;

};




/**
 * Adds the duration to the current time. The instance is modified in
 * place.
 *
 * @param {ICAL.Duration} aDuration         The duration to add
 */
CalendarDatePrototype.adjustComponentValues = function(year, monthIndex, days, hours, minutes, seconds, milliseconds) {

    if(milliseconds !== undefined) {
        console.warn("CalendarDate doesn't properly supports milliseconds yet");
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

    // if(Number.isFinite(seconds)) second += seconds;
    // if(Number.isFinite(minutes)) minute += minutes;
    // if(Number.isFinite(hours)) hour += hours;
    // if(Number.isFinite(days)) myDay += days;
    // day += 7 * weeks;
    if(Number.isFinite(monthIndex)) month += monthIndex;
    if(Number.isFinite(year)) myYear += year;

    // this.second = second;
    // this.minute = minute;
    // this.hour = hour;
    // this.day = myDay;
    this.month = month;
    this.year = myYear;

    this.adjust((Number.isFinite(days) && days) || 0, (Number.isFinite(hours) && hours) || 0, (Number.isFinite(minutes) && minutes) || 0, (Number.isFinite(seconds) && seconds) || 0);

    // this._cachedUnixTime = null;
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

CalendarDatePrototype.setComponentValues = function(year, month, day, hours, minutes, seconds, milliseconds, timeZone) {
    if(typeof arguments[0] !== "number" && arguments.length === 1) {
        this.fromData(arguments[0]);
    } else {
        if(milliseconds) this.millisecond = milliseconds;
        if(seconds) this.seconds = seconds;
        if(minutes) this.minute = minutes;
        if(hours) this.hour = hours;
        if(day) this.day = day;
        if(month) this.month = month;
        if(year) this.year = year;
        if(timeZone) this.timeZone = timeZone;
    }
};

CalendarDatePrototype.takeComponentValuesFromCalendarDate = function(aCalendarDate) {
    this.setComponentValues(aCalendarDate.year, aCalendarDate.month, aCalendarDate.day, aCalendarDate.hour, aCalendarDate.minute, aCalendarDate.second, aCalendarDate.milliseconds,aCalendarDate.timeZone);
}


Object.defineProperty(CalendarDatePrototype,"timeZone",{
    get: function() {
        return this.zone;
    },
    set: function(value) {
        if(value !== this.zone) {
            TimeZone.convertCalendarDateFromTimeZoneToTimeZone (this,this.zone,value);
            this.zone = value;
        }
    },
    configurable: true
});

Object.defineProperty(CalendarDatePrototype,"fullDayRange",{

    get: function(date) {
        var dayStart  = this.clone();
        dayStart.setHours(0,0,0,0);
        var dayEnd = dayStart.clone();
        dayEnd.setHours(23,59,59,999);
        return new Range(dayStart,dayEnd);
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

/**
 * The toLocaleString() method returns a string with a language sensitive
 * representation of this date. The locales and options arguments let applications
 * specify the language whose formatting conventions should be used and customize
 * the behavior of the method.
 *
 * @method
 * @argument {string||Locale||Array<string>||Array<Locale>} locales - The locale(s).
 * @argument {Object} options - Options to configure the formatting of the locale string.
 */

CalendarDatePrototype.toLocaleString = function(locales, options) {
    /*
        Because we can't require Locale for now because of a circular dependency, we can't test for instanceof Locale, so we work around it
    */
    if(typeof locales !== "string") {
        locales = locales.identifier;
    } else if(Array.isArray(locales)) {
        for (var i=0, countI = locales.length;(i < countI); i++) {
            if(typeof locales[i] !== "string") {
                locales[i] = locales[i].identifier;
            }
        }
    }
    return new Intl.DateTimeFormat(locales,options).format(this);
};
Object.defineProperty(CalendarDatePrototype,"defaultStringDescription",{
    get: function() {
        //There's a circular dependency issue between calendar, calendar-date and locale...
        return this.toLocaleString(currentEnvironment.systemLocaleIdentifier);
    },
    configurable: true
});

CalendarDatePrototype.setHours = function(hoursValue, minutesValue, secondsValue, msValue) {
    this.setComponentValues(0, 0, 0, hoursValue, minutesValue, secondsValue, msValue);
}


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
CalendarDatePrototype.toLocaleTimeString()
CalendarDatePrototype.toSource()
CalendarDatePrototype.toString()
CalendarDatePrototype.toTimeString()
CalendarDatePrototype.toUTCString()
CalendarDatePrototype.valueOf()
*/




/**
 * Date specific methods added to Range until we introduce a DateRange
 * that would work for both native Date and CalendarDate.
 */

function DateRangeIterator(){};

Object.defineProperties(DateRangeIterator.prototype, {

    initWithRangeComponentStepDirection: {
        value: function(range, component, step, direction) {
            this.range = range;
            this.component = component;
            this.step = step;
            if(direction) {
                this.direction = direction;
            }
            return self;
        }
    },
    range: {
        value: undefined
    },
    component: {
        value: undefined
    },
     _step: {
        value: 1
    },
    step: {
        get: function() {
            return this._step;
        },
        set: function() {
            if(Number.isFinite(step)) {
                this.step = step;
            } else {
                throw "step: "+step+" isn't a valid number";
            }
        }
    },
    direction: {
        value: undefined
    },
    _nextValue: {
        value: undefined
    },
    next: {
        value: function() {
            let result;
            if (nextIndex < end) {
                result = { value: nextIndex, done: false }
                nextIndex += step;
                iterationCount++;
                return result;
            }
            return { value: iterationCount, done: true }
         }
    }
});

// To Satisfy both the Iterator Protocol and Iterable
DateRangeIterator.prototype[Symbol.iterator] = function() { return this; };

Object.defineProperty(Range.prototype,"componentIterator", {
    value: function* (component, direction, step) {
        var begin = this.begin,
            beginComponent = begin[component],
            end = this.end,
            endComponent = end[component];

        dayIterator.component = "day";
        if(step !== undefined) {
            dayIterator.step = step;
        }
        dayIterator.range = this;

        return dayIterator;
    }
});

Object.defineProperty(CalendarDate, "fullDayTimeRangeFrom", {
    value: function(aDate) {
        if(aDate instanceof Date) {
            return CalendarDate.fromJSDate(aDate).fullDayRange;
        } else if(aDate instanceof CalendarDate) {
            return aDate.fullDayRange;
        } else {
            return null;
        }
    }
});


Object.defineProperty(Range.prototype, "fullDayIterator", {
    value: function* (step/*,direction*/ /* todo for later*/) {
        var iterationFullDayRange = this.begin.fullDayRange,
            iBegin, iEnd,
            reply;

            /*
                can't wait to use
                https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters
            */
            step = step || 1;
            while(Range.compareBeginToEnd(iterationFullDayRange,this) <= 0) {
                /*
                    reply is the result of calling iterator.next(reply), which gives the power to seek in the iteration more than one step at a time

                */
                reply = yield iterationFullDayRange;

                //Create a new range for the next iteration
                iBegin = iterationFullDayRange.begin.clone();
                iEnd = iterationFullDayRange.end.clone();

                //set the new range bounds to the next day
                iBegin.adjustComponentValues(0,0,(reply||1)*step);
                iEnd.adjustComponentValues(0,0,(reply||1)*step);

                //Make the range
                iterationFullDayRange = new Range(iBegin,iEnd);

            }


    }
});

