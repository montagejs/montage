/**
 * @module montage/core/converter/international-duration-to-string-formatter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    Montage = require("../core").Montage,
    Locale = require("../locale").Locale;

/**
 * Formats a Duration to a String using standard Intl.DateTimeFormat.
 *
 * https://github.com/tc39/proposal-intl-duration-format
 *
 * @class InternationalDurationToStringFormatter
 * @extends Converter
 */

 InternationalDurationToStringFormatterOptions = Montage.specialize( /** @lends Duration */ {
    localeMatcher: {
        value: "best-fit"
    }
 });

var InternationalDurationToStringFormatter = exports.InternationalDurationToStringFormatter = Converter.specialize({

    _locale: {
        value: Locale.systemLocale
    },

    locale: {
        get: function() {
            return this._locale;
        },
        set: function(value) {
            if(value !== this._locale) {
                this._locale = value;
                this.__dayDateFormatter = null;
            }
        }
    },

    _options: {
        value: undefined
    },



    /**
     * Specify options to convert a duration to a string
     *
     * Parameters
     *  - locales: Array<string> | string: A locale string or a list of locale strings in decreasing order of preference.
     *  - options?: object: An object for configuring the behavior of the instance. It may have some or all of the following properties:
     *      - localeMatcher: "best-fit" | "lookup": A string denoting which locale matching algorithm to use. Defaults to "best fit".
     *      - numberingSystem: string: A string containing the name of the numbering system to be used for number formatting.
     *      - style: "long" | "short" | "narrow" | "digital": The base style to be used for formatting.
     *        This can be overriden per-unit by setting the more granular options. Defaults to "short".
     *      - years: "long" | "short" | "narrow": The style to be used for formatting years.
     *      - yearsDisplay: "always" | "auto": Whether to always display years, or only if nonzero.
     *      - months: "long" | "short" | "narrow": The style to be used for formatting months.
     *      - monthsDisplay: "always" | "auto": Whether to always display months, or only if nonzero.
     *      - weeks: "long" | "short" | "narrow": The style to be used for formatting weeks.
     *      - weeksDisplay: "always" | "auto": Whether to always display weeks, or only if nonzero.
     *      - days: "long" | "short" | "narrow": The style to be used for formatting days.
     *      - daysDisplay: "always" | "auto": Whether to always display days, or only if nonzero.
     *      - hours: "long" | "short" | "narrow" | "numeric" | "2-digit": The style to be used for formatting hours.
     *      - hoursDisplay: "always" | "auto": Whether to always display hours, or only if nonzero.
     *      - minutes: "long" | "short" | "narrow" | "numeric" | "2-digit": The style to be used for formatting minutes.
     *      - minutesDisplay: "always" | "auto": Whether to always display minutes, or only if nonzero.
     *      - seconds: "long" | "short" | "narrow" | "numeric" | "2-digit": The style to be used for formatting seconds.
     *      - secondsDisplay: "always" | "auto": Whether to always display seconds, or only if nonzero.
     *      - milliseconds: "long" | "short" | "narrow" | "numeric": The style to be used for formatting milliseconds.
     *      - millisecondsDisplay: "always" | "auto": Whether to always display milliseconds, or only if nonzero.
     *      - microseconds: "long" | "short" | "narrow" | "numeric": The style to be used for formatting microseconds.
     *      - microsecondsDisplay: "always" | "auto": Whether to always display microseconds, or only if nonzero.
     *      - nanoseconds: "long" | "short" | "narrow" | "numeric": The style to be used for formatting nanoseconds.
     *      - nanosecondsDisplay: "always" | "auto": Whether to always display nanoseconds, or only if nonzero.
     *      - fractionalDigits: number: How many fractional digits to display in the output. Additional decimal places
     *        will be truncated towards zero. (Temporal.Duration.prototype.round can be used to obtain different rounding behavior.)
     *        Normally this option applies to fractional seconds, but this option actually applies to the largest seconds-or-smaller unit
     *        that uses the "numeric" or "2-digit" style. For example, if options are
     *              { seconds: "narrow", milliseconds: "narrow", fractionalDigits: 2}
     *        then the output can be "5s 2.39ms".
     *        If this option is omitted, only nonzero decimals will be displayed and trailing zeroes will be omitted.
     *
     *      - listType: Possible values are one of:
     *          - "conjunction" — stands for "and"-based lists (default, e.g., "A, B, and C"),
     *          - "disjunction" — stands for "or"-based lists (e.g., "A, B, or C"),
     *          - "unit" — stands for lists of values with units (e.g., "5 pounds, 12 ounces")
     *
     *      - listStyle: The length of the formatted message. Possible values are:
     *          - "long" (default, e.g., "A, B, and C"); "short" (e.g., "A, B, C")
     *          - "short" (e.g., "A, B, C")
     *          - "narrow" (e.g., "A B C")
     *
     *          When style is "short" or "narrow", "unit" is the only allowed value for the type option
     *
     *
     *  - Default values
     *      - The per-unit style options default to the value of style for all styles except "digital",
     *      for which units years till days default to "narrow" and hours till nanoseconds default to "numeric".
     *
     *      - The per-unit display options default to "auto" if the corresponding style option is undefined and "always" otherwise.
     *
     *
     * - Notes
     *      - Some locales may share the same representation between "long" and "short" or between "narrow" and "short".
     *      Others may use different representations for each one, e.g. "3 seconds", "3 secs", "3s".
     *
     *      - Any unit with the style "numeric" preceded by a unit of style "numeric" or "2-digit" should act like the style "2-digit"
     *      was used instead. For example, {hours: 'numeric', minutes: 'numeric'} can produce output like "3:08".
     *
     * @proeprty
     * @returns {object} The converter options
     */
    options: {
        get: function() {
            return this._options;
        },
        set: function(value) {
            if(value !== this._options) {
                this._options = value;
                this.__relativeTimeFormatter = null;
                this.__listFormatter = null;
            }
        }
    },

    __listFormatter: {
        value: undefined
    },
    _listFormatter: {
        get: function() {
            if(!this.__listFormatter) {
                if(Intl.ListFormat) {
                    this.__listFormatter = new Intl.ListFormat(
                        this._locale.identifier, {
                            type: (this.options.listType || "conjunction"),
                            style: (this.options.listStyle || "long")
                        });
                } else {
                    /* until we have a way to polyfill correctly Intl.ListFormat */
                    this.__listFormatter = {
                        format: function(array) {
                            return array.join(", ");
                        }
                    };
                }
            }
            return this.__listFormatter;
        }
    },

    __relativeTimeFormatter: {
        value: undefined
    },
    _relativeTimeFormatter: {
        get: function() {
            if(!this.__relativeTimeFormatter) {
                if(Intl.RelativeTimeFormat) {
                    this.__relativeTimeFormatter = new Intl.RelativeTimeFormat(
                        this._locale.identifier, this.options);
                } else {
                    this.__relativeTimeFormatter = {
                        formatToParts: function(value, part) {
                            if(Math.sign(value) < 0) {
                                return [
                                    {
                                        type: "integer",
                                        value: +Math.abs(value),
                                        unit: part.substring(0,part.length-1)
                                    },
                                    {
                                        type: "literal",
                                        value: " " + part+" ago"
                                    }
                                ];
                            } else {
                                return [
                                    {
                                        type: "literal",
                                        value: "in "
                                    },
                                    {
                                        type: "integer",
                                        value: +value,
                                        unit: part.substring(0,part.length-1)
                                    },
                                    {
                                        type: "literal",
                                        value: " " + part
                                    }
                                ];
                            }
                        }
                    };
                }
            }
            return this.__relativeTimeFormatter;
        }
    },

    /**
     * Convert a duration to a string
     *
     *
     * Notes: The Intl.RelativeTimeFormat.prototype.formatToParts method is a version of the format method
     * which it returns an array of objects which represent "parts" of the object, separating the formatted
     * number into its consituent parts and separating it from other surrounding text. These objects have two
     * properties: type a NumberFormat formatToParts type, and value, which is the String which is the component
     * of the output. If a "part" came from NumberFormat, it will have a unit property which indicates the unit
     * being formatted; literals which are part of the larger frame will not have this property.
     *
     * const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
     *
     * // Format relative time using the day unit
     * rtf.formatToParts(-1, "day");
     * // > [{ type: "literal", value: "yesterday"}]
     *
     * rtf.formatToParts(100, "day");
     * // > [{ type: "literal", value: "in " },
     * // >  { type: "integer", value: "100", unit: "day" },
     * // >  { type: "literal", value: " days" }]
     *
     * @method
     * @returns {string} The original string with its first letter capitalized.
     */
    convert: {
        value: function (v) {

            if(v) {
                var options = this.options,
                    relativeTimeFormatter = this._relativeTimeFormatter,
                    relativeTimeFormatParts,
                    components = [];

                if(v.years || options.yearsDisplay === "always") {
                    relativeTimeFormatParts = relativeTimeFormatter.formatToParts(v.years, "years");
                    components.push(relativeTimeFormatParts[1].value+relativeTimeFormatParts[2].value);
                }
                if(v.months || options.monthsDisplay === "always") {
                    relativeTimeFormatParts = relativeTimeFormatter.formatToParts(v.months, "months");
                    components.push(relativeTimeFormatParts[1].value+relativeTimeFormatParts[2].value);
                }
                if(v.weeks || options.weeksDisplay === "always") {
                    relativeTimeFormatParts = relativeTimeFormatter.formatToParts(v.weeks, "weeks");
                    components.push(relativeTimeFormatParts[1].value+relativeTimeFormatParts[2].value);
                }
                if(v.days || options.daysDisplay === "always") {
                    relativeTimeFormatParts = relativeTimeFormatter.formatToParts(v.days, "days");
                    components.push(relativeTimeFormatParts[1].value+relativeTimeFormatParts[2].value);
                }
                if(v.hours || options.hoursDisplay === "always") {
                    relativeTimeFormatParts = relativeTimeFormatter.formatToParts(v.hours, "hours");
                    components.push(relativeTimeFormatParts[1].value+relativeTimeFormatParts[2].value);
                }
                if(v.minutes || options.minutesDisplay === "always") {
                    relativeTimeFormatParts = relativeTimeFormatter.formatToParts(v.minutes, "minutes");
                    components.push(relativeTimeFormatParts[1].value+relativeTimeFormatParts[2].value);
                }
                if(v.seconds || options.secondsDisplay === "always") {
                    relativeTimeFormatParts = relativeTimeFormatter.formatToParts(v.seconds, "seconds");
                    components.push(relativeTimeFormatParts[1].value+relativeTimeFormatParts[2].value);
                }

                if(v.milliseconds || v.microseconds || v.nanoseconds) {
                    console.warn("converting a durtion milliseconds, microseconds and nanoseconds to string is not implemented");
                }

                return this._listFormatter.format(components);
            }
             else {
                return "";
             }
        }
    }
});
