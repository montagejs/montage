/**
 * @module montage/core/duration
 * @requires montage/core/core
 * @requires montage/core/logger
 */
 var Montage = require("./core").Montage,
    logger = require("./logger").logger("duration"),
    YEARS = "years",
    MONTHS = "months",
    WEEKS = "weeks",
    DAYS = "days",
    HOURS = "hours",
    MINUTES = "minutes",
    SECONDS = "seconds",
    MILLISECONDS = "milliseconds",
    MICROSECONDS = "microseconds",
    NANOSECONDS = "nanoseconds",
    SIGN = "sign",
    units = [
        { unit: YEARS, symbol: 'Y' },
        { unit: MONTHS, symbol: 'M' },
        { unit: WEEKS, symbol: 'W' },
        { unit: DAYS, symbol: 'D' },
        { unit: HOURS, symbol: 'H' },
        { unit: MINUTES, symbol: 'M' },
        { unit: SECONDS, symbol: 'S' },
    ],
    r = function r(name, unit) {
        //return `((?<${name}>-?\\d*[\\.,]?\\d+)${unit})?`;

        var result = "((?<";

        result += name;
        result += ">-?\\d*[\\.,]?\\d+)";
        result += unit;
        result += ")?";
        return result;
    },
    durationRegex = new RegExp([
        '(?<negative>-)?P',
        r(YEARS, 'Y'),
        r(MONTHS, 'M'),
        r(WEEKS, 'W'),
        r(DAYS, 'D'),
        '(T',
        r(HOURS, 'H'),
        r(MINUTES, 'M'),
        r(SECONDS, 'S'),
        ')?', // end optional time
    ].join('')),
    parseNum = function parseNum(s) {
        if (s === '' || s === undefined || s === null) {
            return undefined;
        }
        return parseFloat(s.replace(',', '.'));
    };

    require("./extras/math");

    exports.InvalidDurationError = new Error('Invalid duration');


/**
 * @class Duration
 * @extends Montage
 *
 * A Duration represents a (positive or negative) duration of time which can be used in date/time arithmetic.
 *
 * modeled after upcomoing standard Temporal.Duration
 *
 *      https://tc39.es/proposal-temporal/docs/duration.html
 *
 * so we can remove and extend later.
 *
 */
exports.Duration = Montage.specialize( /** @lends Duration */ {
    /**
     * @function
     * @param {Number} years (optional) A number of years.
     * @param {Number} months (optional) A number of months.
     * @param {Number} weeks (optional) A number of weeks.
     * @param {Number} days (optional) A number of days.
     * @param {Number} hours (optional) A number of hours.
     * @param {Number} minutes (optional) A number of minutes.
     * @param {Number} seconds (optional) A number of seconds.
     * @param {Number} milliseconds (optional) A number of milliseconds.
     * @param {Number} microseconds (optional) A number of microseconds.
     * @param {Number} nanoseconds (optional) A number of nanoseconds.
     * @returns {Duration} this
     *
     * All of the arguments are optional. Any missing or undefined numerical arguments are taken to be zero,
     * and all non-integer numerical arguments are rounded to the nearest integer, towards zero. Any non-zero
     * arguments must all have the same sign.
     *
     * Use this constructor directly if you have the correct parameters already as numerical values.
     * Otherwise Temporal.Duration.from() is probably more convenient because it accepts more kinds of input
     * and allows controlling the overflow behaviour.
     */
     constructor: {
        value: function (years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds) {
            if(arguments.length) {
                return this.initWithComponents(years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds);
            } else {
                return this;
            }
        }
    },

    // DurationSign: (y, mon, w, d, h, min, s, ms, µs, ns) => {
    //     for (const prop of [y, mon, w, d, h, min, s, ms, µs, ns]) {
    //       if (prop !== 0) return prop < 0 ? -1 : 1;
    //     }
    //     return 0;
    //   },

    _setComponent: {
        value:function(name, value, isLast) {
            value = this[name] = Math.floor(Number(value)) || 0;

            if (!Number.isFinite(value)) {
                throw new RangeError('infinite values not allowed as duration fields');
            }

            if(value !== 0 || isLast) {
                //The first non zero value sets the sign:
                if(!this.hasOwnProperty(SIGN)) {
                    this.sign = value !== 0
                        ? value < 0
                            ? -1
                            : 1
                        : 0;
                } else {
                    var valueSign = Math.sign(value);
                    if (valueSign !== 0 && valueSign !== this.sign) {
                        throw new RangeError('mixed-sign values not allowed as duration fields');
                    }
                }
            }
        }
    },
    /**
     * years
     *
     * @property {number} years
     * @default 0
     */
    years: {
        value: 0
    },
    months: {
        value: 0
    },
    weeks: {
        value: 0
    },
    days: {
        value: 0
    },
    hours: {
        value: 0
    },
    minutes: {
        value: 0
    },
    seconds: {
        value: 0
    },
    milliseconds: {
        value: 0
    },
    microseconds: {
        value: 0
    },
    nanoseconds: {
        value: 0
    },

    /**
     * sign property has the value –1, 0, or 1, depending on whether the duration is
     * negative, zero, or positive.
     *
     * @property {number} years
     * @default 0
     */
    sign: {
        value: 0
    },

    isNegative: {
        get: function() {
            return this.sign === -1;
        }
    },

    /**
     * isBlank property is a convenience property that tells whether duration represents
     * a zero length of time. In other words, duration.isBlank === (duration.sign === 0).
     *
     * Usage example:
     * d = Temporal.Duration.from('PT0S');
     * .blank; // => true
     *
     * d = Temporal.Duration.from({ days: 0, hours: 0, minutes: 0 });
     * d.blank; // => true
     *
     * @property {number} years
     * @default 0
     */
     isBlank: {
        get: function() {
            return (this.sign === 0);
        }
    },

    /**
     * @function
     * @param {Number} years (optional) A number of years.
     * @param {Number} months (optional) A number of months.
     * @param {Number} weeks (optional) A number of weeks.
     * @param {Number} days (optional) A number of days.
     * @param {Number} hours (optional) A number of hours.
     * @param {Number} minutes (optional) A number of minutes.
     * @param {Number} seconds (optional) A number of seconds.
     * @param {Number} milliseconds (optional) A number of milliseconds.
     * @param {Number} microseconds (optional) A number of microseconds.
     * @param {Number} nanoseconds (optional) A number of nanoseconds.
     * @returns {Duration} this
     */
     initWithComponents : {
        value: function (years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds) {

            this._setComponent(YEARS, years);
            this._setComponent(MONTHS, months);
            this._setComponent(WEEKS, weeks);
            this._setComponent(DAYS, days);
            this._setComponent(HOURS, hours);
            this._setComponent(MINUTES, minutes);
            this._setComponent(SECONDS, seconds);
            this._setComponent(MILLISECONDS, milliseconds);
            this._setComponent(MICROSECONDS, microseconds);
            this._setComponent(NANOSECONDS, nanoseconds, true);

            return this;
        }
    },

    /**
     * @function
     * @param input: A Duration-like object or a string from which to create a Temporal.Duration.
     * @returns {Object} this
     */
    initFrom : {
        value: function (input) {
            if(typeof input === "string") {
                return this.initFromString(input);
            } else {
                return this.initWithComponents(input.years, input.months, input.weeks, input.days, input.hours, input.minutes, input.seconds, input.milliseconds, input.microseconds, input.nanoseconds);
            }
            return this;
        }
    },

    /**
     * @function
     * @param input: an ISO 8601 string.
     * @returns {Duration} this
     */
    initFromString : {
        value: function (durationStr) {
            var match = durationRegex.exec(durationStr);
            if (!match || !match.groups) {
                throw exports.InvalidDurationError;
            }
            var empty = true,
                values = [],
                i = 0, countI = units.length, unit;
            for (; (unit = units[i]); i++) {
                if (match.groups[unit]) {
                    empty = false;
                    values.push(parseNum(match.groups[unit]));
                } else {
                    values.push(undefined);
                }
            }
            if (empty) {
                throw exports.InvalidDurationError;
            }

            this.initWithComponents.apply(this,values);

            if (match.groups.negative) {
                duration.negative = true;
            }
            return this;

        }
    },


    serializeSelf: {
        value: function (serializer) {
            var memberIterator = this._membersIntValue.keys(),
                members = []
                aMember, aValue
                values;
            while ((aMember = memberIterator.next().value)) {
                members.push(aMember);
                aValue = this[aMember];
                if(typeof aValue !== "number") {
                    (values || (values = [])).push(aValue);
                }
            }

            serializer.setProperty("members", members);
            if(values) {
                serializer.setProperty("values", values);
            }
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            var members, values;
            members = deserializer.getProperty("members");
            if (members !== void 0) {
                values = deserializer.getProperty("values");
                this._addMembers(members, values, this._membersByValue, this._membersIntValue);
            }
        }
    },




    /**
     * Compares two Temporal.Duration objects. Returns an integer indicating whether one is shorter or longer
     * or is equal to two.
     *
     *      −1 if one is shorter than two;
     *      0 if one and two are equally long;
     *      1 if one is longer than two.
     * If one and two are not Temporal.Duration objects, then they will be converted to one as if they were passed
     * to Temporal.Duration.from().
     *
     * If any of the years, months, or weeks properties of either of the durations are nonzero, then the relativeTo option
     * is required, since comparing durations with years, months, or weeks requires a point on the calendar to figure out
     * how long they are.
     *
     * Negative durations are treated as the same as negative numbers for comparison purposes: they are "less" (shorter)
     * than zero.
     *
     * The relativeTo option may be a Temporal.ZonedDateTime in which case time zone offset changes will be taken into
     * account when comparing days with hours. If relativeTo is a Temporal.PlainDateTime, then days are always
     * considered equal to 24 hours.
     *
     * If relativeTo is neither a Temporal.PlainDateTime nor a Temporal.ZonedDateTime, then it will be converted to one
     * of the two, as if it were first attempted with Temporal.ZonedDateTime.from() and then with
     * Temporal.PlainDateTime.from(). This means that an ISO 8601 string with a time zone name annotation in it,
     * or a property bag with a timeZone property, will be converted to a Temporal.ZonedDateTime, and an ISO 8601 string
     * without a time zone name or a property bag without a timeZone property will be converted to a Temporal.PlainDateTime.
     *
     * @function
     * @param {Duration || Object <DurationLike>} other other duration to compare
     * @param {Object} options An object with properties representing options for the operation.
     *          The following option is recognized:
     *              - relativeTo (Temporal.PlainDateTime, Temporal.ZonedDateTime, or value convertible to one of those):
     *              The starting point to use when converting between years, months, weeks, and days.
     * @returns −1, 0, or 1.
     */
    compare: {
        value: function (one, two, options) {

        }
    },

    /**
     * This method creates a new Temporal.Duration which is a copy of duration,
     * but any properties present on durationLike override the ones already present
     * on duration.
     *
     * Since Temporal.Duration objects each represent a fixed duration,
     * use this method instead of modifying one.
     *
     * All non-zero properties of durationLike must have the same sign, and they must
     * additionally have the same sign as the non-zero properties of duration, unless they
     * override all of these non-zero properties. If a property of durationLike is
     * infinity, then this function will throw a RangeError.
     *
     * @function
     * @param {Object <DurationLike>} member The member to be added.
     * @returns {Duration}
     */
    with: {
        value: function (durationLike) {

        }
    },

    /**
     * This method adds other to duration, resulting in a longer duration.
     *
     * The other argument is an object with properties denoting a duration, such as { hours: 5, minutes: 30 },
     * or a string such as PT5H30M, or a Temporal.Duration object. If other is not a Temporal.Duration object,
     * then it will be converted to one as if it were passed to Temporal.Duration.from().
     *
     * In order to be valid, the resulting duration must not have fields with mixed signs, and so the result is balanced.
     * For usage examples and a more complete explanation of how balancing works and why it is necessary, see Duration balancing.
     *
     * By default, you cannot add durations with years, months, or weeks, as that could be ambiguous depending on the start date.
     * To do this, you must provide a start date using the relativeTo option.
     *
     * The relativeTo option may be a Temporal.ZonedDateTime in which case time zone offset changes will be taken into account when
     * converting between days and hours. If relativeTo is omitted or is a Temporal.PlainDateTime, then days are always considered
     * equal to 24 hours.
     *
     * If relativeTo is neither a Temporal.PlainDateTime nor a Temporal.ZonedDateTime, then it will be converted to one of the two,
     * as if it were first attempted with Temporal.ZonedDateTime.from() and then with Temporal.PlainDateTime.from(). This means that
     * an ISO 8601 string with a time zone name annotation in it, or a property bag with a timeZone property, will be converted to a
     *  Temporal.ZonedDateTime, and an ISO 8601 string without a time zone name or a property bag without a timeZone property will be
     * converted to a Temporal.PlainDateTime.
     *
     * Adding a negative duration is equivalent to subtracting the absolute value of that duration.
     *
     * @function
     * @param {Duration|Object<DurationLike>|string} other (Temporal.Duration or value convertible to one): The duration to add.
     * @param {Object} options (optional) An object with properties representing options for the addition.
     *                  The following option is recognized:
     *                          - relativeTo (Temporal.PlainDateTime, Temporal.ZonedDateTime, or value convertible
     *                          to one of those): The starting point to use when adding years, months, weeks, and days.
     * @returns {Duration} a new Temporal.Duration object which represents the sum of the durations of duration and other.
     *
     * Usage example:
     *  hour = Temporal.Duration.from('PT1H');
     *  hour.add({ minutes: 30 }); // => PT1H30M
     *
     *  // Examples of balancing:
     *  one = Temporal.Duration.from({ hours: 1, minutes: 30 });
     *  two = Temporal.Duration.from({ hours: 2, minutes: 45 });
     *  result = one.add(two); // => PT4H15M
     *
     *  fifty = Temporal.Duration.from('P50Y50M50DT50H50M50.500500500S');
     *  // WRONG result = fifty.add(fifty); // => throws, need relativeTo
     *  result = fifty.add(fifty, { relativeTo: '1900-01-01' }); // => P108Y7M12DT5H41M41.001001S
     *
     *  // Example of converting ambiguous units relative to a start date
     *  oneAndAHalfMonth = Temporal.Duration.from({ months: 1, days: 15 });
     *
     *  // WRONG oneAndAHalfMonth.add(oneAndAHalfMonth); // => throws
     *  oneAndAHalfMonth.add(oneAndAHalfMonth, { relativeTo: '2000-02-01' }); // => P3M
     *  oneAndAHalfMonth.add(oneAndAHalfMonth, { relativeTo: '2000-03-01' }); // => P2M30D
     *
     */
     add: {
        value: function (other, options) {
            return;
        }
    },

    subtract: {
        value: function (other, options) {

            return false;
        }
    },

    /**
     * Returns a new Temporal.Duration object with the opposite sign.
     *
     * @function
     * @returns {Duration} a new Temporal.Duration object with the opposite sign..
     */
    negated: {
        value: function () {
            return this;
        }
    },

    /**
     * Returns a new Temporal.Duration object that is always positive.
     *
     * This method gives the absolute value of duration. It returns a newly constructed Temporal.Duration
     * with all the fields having the same magnitude as those of duration, but positive.
     * If duration is already positive or zero, then the returned object is a copy of duration.
     * @function
     * @returns {Duration} a new Temporal.Duration object with the opposite sign..
     */
     abs: {
        value: function () {
            return (new this.constructor().initWithComponents(Math.abs(this.years), Math.abs(this.months), Math.abs(this.weeks), Math.abs(this.days), Math.abs(this.hours), Math.abs(this.minutes), Math.abs(this.seconds), Math.abs(this.milliseconds), Math.abs(this.microseconds), Math.abs(this.nanoseconds)));
        }
    },

    /**
     * Returns a new Temporal.Duration object with the opposite sign.
     *
     * @function
     * @returns {Duration} a new Temporal.Duration object with the opposite sign..
     */
     round: {
        value: function () {
            return this;
        }
    },

    /**
     * Returns a new Temporal.Duration object with the opposite sign.
     *
     * @function
     * @param {Object} options An object with properties representing options for the operation. The following options are recognized:
     *      - unit (string): The unit of time that will be returned. Valid values are 'year', 'month', 'week', 'day', 'hour',
     *      'minute', 'second', 'millisecond', 'microsecond', and 'nanosecond'. There is no default; unit is required.
     *
     *      - relativeTo (Temporal.PlainDateTime): The starting point to use when converting between years, months, weeks, and days.
     *      It must be a Temporal.PlainDateTime, or a value that can be passed to Temporal.PlainDateTime.from().
     *
     * @returns {Number} a floating-point number representing the number of desired units in the Temporal.Duration
     */
     total: {
        value: function (options) {
            return this;
        }
    },

    /**
     * This method overrides Object.prototype.toString() and provides the ISO 8601 description of the duration.
     * The output precision can be controlled with the fractionalSecondDigits or smallestUnit option. If no options
     * are given, the default is fractionalSecondDigits: 'auto', which omits trailing zeroes after the decimal
     * point.
     *
     * The value is truncated to fit the requested precision, unless a different rounding mode is given with the
     * roundingMode option, as in Temporal.Duration.round(). Note that rounding may change the value of other units
     * as well.
     *
     * Usage examples:
     *
     * d = Temporal.Duration.from({ years: 1, days: 1 });
     * d.toString(); // => P1Y1D
     * d = Temporal.Duration.from({ years: -1, days: -1 });
     * d.toString(); // => -P1Y1D
     * d = Temporal.Duration.from({ milliseconds: 1000 });
     * d.toString(); // => PT1S
     *
     * // The output format always balances units under 1 s, even if the
     * // underlying Temporal.Duration object doesn't.
     * nobal = Temporal.Duration.from({ milliseconds: 3500 });
     * console.log(`${nobal}`, nobal.seconds, nobal.milliseconds); // => 'PT3.5S 0 3500'
     * bal = nobal.round({ largestUnit: 'year' }); // balance through round
     * console.log(`${bal}`, bal.seconds, bal.milliseconds); // => 'PT3.5S 3 500'
     *
     * d = Temporal.Duration.from('PT59.999999999S');
     * d.toString({ smallestUnit: 'second' }); // => PT59S
     * d.toString({ fractionalSecondDigits: 0 }); // => PT59S
     * d.toString({ fractionalSecondDigits: 4 }); // => PT59.9999S
     * d.toString({ fractionalSecondDigits: 8, roundingMode: 'halfExpand' });
     * // => PT60.00000000S

     * @function
     * @param {Object} options (optional) An object with properties representing options for the operation.
     *                  The following options are recognized:
     *                      - fractionalSecondDigits (number or string): How many digits to print after
     *                      the decimal point in the output string. Valid values are 'auto', 0, 1, 2, 3, 4, 5,
     *                      6, 7, 8, or 9. The default is 'auto'.
     *
     *                      - smallestUnit (string): The smallest unit of time to include in the output string.
     *                      This option overrides fractionalSecondDigits if both are given. Valid values are
     *                      'second', 'millisecond', 'microsecond', and 'nanosecond'.
     *
     *                      - roundingMode (string): How to handle the remainder. Valid values are 'ceil', 'floor',
     *                      'trunc', and 'halfExpand'. The default is 'trunc'.
     *
     *                      - postgreSQLIntervalCompatibility: true/false When negative, prefix each block by "-"
     *
     * @returns {string}  the duration as an ISO 8601 string.
     *
     * Implementations here:
     *  - https://github.com/js-temporal/temporal-polyfill/blob/main/lib/duration.ts
     *  - https://github.com/smhg/date-duration/blob/master/src/duration.js
     *  - https://github.com/MelleB/tinyduration/blob/master/src/index.ts
     */

     toString: {
        value: function(options) {
            if (!this.years &&
                !this.weeks &&
                !this.months &&
                !this.days &&
                !this.hours &&
                !this.minutes &&
                !this.seconds) {
                return 'PT0S';
            }
            var isPostgreSQLIntervalCompatibility = !!options.postgreSQLIntervalCompatibility;
            return [
                !isPostgreSQLIntervalCompatibility ? this.isNegative && '-' : "",
                'P',
                this._componentToString(this.years, 'Y', options),
                this._componentToString(this.months, 'M', options),
                this._componentToString(this.weeks, 'W', options),
                this._componentToString(this.days, 'D', options),
                (this.hours || this.minutes || this.seconds) && 'T',
                this._componentToString(this.hours, 'H', options),
                this._componentToString(this.minutes, 'M', options),
                this._componentToString(this.seconds, 'S', options),
            ]
                .filter(Boolean)
                .join('');
        }
    },

    _componentToString: {
        value:  function _componentToString(number, component, options) {
            if (!number) {
                return undefined;
            }
            var numberAsString = number.toString(),
                exponentIndex = numberAsString.indexOf('e');

            if (exponentIndex > -1) {
                var magnitude = parseInt(numberAsString.slice(exponentIndex + 2), 10);
                numberAsString = number.toFixed(magnitude + exponentIndex - 2);
            }

            // if(options.postgreSQLIntervalCompatibility && this.isNegative) {
            //     return "-"+numberAsString + component;
            // } else {
                return numberAsString + component;
            //}

        }
    },

    /**
     * Returns: a string representation of the duration that can be passed to Temporal.Duration.from().
     * This method is the same as duration.toString(). It is usually not called directly,
     * but it can be called automatically by JSON.stringify().
     *
     * @function
     * @returns {String} the duration as an ISO 8601 string.
     */
    toJSON: {
        value: function () {
            return this;
        }
    },

    /**
     * This method overrides Object.prototype.toLocaleString() to provide a human-readable,
     * language-sensitive representation of duration.
     *
     * The locales and options arguments are the same as in the constructor to Intl.DurationFormat.
     *
     * NOTE: This method requires that your JavaScript environment supports Intl.DurationFormat.
     * That is still an early-stage proposal and at the time of writing it is not supported anywhere.
     * If Intl.DurationFormat is not available, then the output of this method is the same as that of duration.toString(),
     * and the locales and options arguments are ignored.
     *
     *
     * @function
     * @param {String || Array<String>} locales (optional) a string or array of strings.
     *          A string with a BCP 47 language tag with an optional Unicode extension key, or an array of such strings.
     * @param {Object} options (optional) An object with properties influencing the formatting.
     * @returns {String} a language-sensitive representation of the duration.
     */
     toLocaleString: {
        value: function () {
            return this;
        }
    }

}, {

    /**
     * @function
     * @param input: A Duration-like object or a string from which to create a Temporal.Duration.
     * @returns {Object} this
     */
    from : {
        value: function (input) {
            return (new this).initFrom(input);
        }
    },
        /**
     * Compares two Temporal.Duration objects. Returns an integer indicating whether one is shorter or longer
     * or is equal to two.
     *
     *      −1 if one is shorter than two;
     *      0 if one and two are equally long;
     *      1 if one is longer than two.
     * If one and two are not Temporal.Duration objects, then they will be converted to one as if they were passed
     * to Temporal.Duration.from().
     *
     * If any of the years, months, or weeks properties of either of the durations are nonzero, then the relativeTo option
     * is required, since comparing durations with years, months, or weeks requires a point on the calendar to figure out
     * how long they are.
     *
     * Negative durations are treated as the same as negative numbers for comparison purposes: they are "less" (shorter)
     * than zero.
     *
     * The relativeTo option may be a Temporal.ZonedDateTime in which case time zone offset changes will be taken into
     * account when comparing days with hours. If relativeTo is a Temporal.PlainDateTime, then days are always
     * considered equal to 24 hours.
     *
     * If relativeTo is neither a Temporal.PlainDateTime nor a Temporal.ZonedDateTime, then it will be converted to one
     * of the two, as if it were first attempted with Temporal.ZonedDateTime.from() and then with
     * Temporal.PlainDateTime.from(). This means that an ISO 8601 string with a time zone name annotation in it,
     * or a property bag with a timeZone property, will be converted to a Temporal.ZonedDateTime, and an ISO 8601 string
     * without a time zone name or a property bag without a timeZone property will be converted to a Temporal.PlainDateTime.
     *
     * @function
     * @param {Duration || Object <DurationLike>} one First duration to compare.
     * @param {Duration || Object <DurationLike>} two Second duration to compare.
     * @param {Object} options An object with properties representing options for the operation.
     *          The following option is recognized:
     *              - relativeTo (Temporal.PlainDateTime, Temporal.ZonedDateTime, or value convertible to one of those):
     *              The starting point to use when converting between years, months, weeks, and days.
     * @returns −1, 0, or 1.
     */
    compare : {
        value: function (one, two, options) {
            return one.compare(two, options);
        }
    },
    isISO8601DurationString: {
        value: function(value) {
            return durationRegex.test(value);
        }
    }
});

