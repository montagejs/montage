/**
 * @module montage/core/converter/r-f-c-3339-u-t-c-string-to-date-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    deprecate = require("../extras/date"),
    singleton;

/**
 * @class RFC3339UTCStringToDateConverter
 * @classdesc Converts an RFC3339 UTC string to a date and reverts it.
 */
var RFC3339UTCStringToDateConverter = exports.RFC3339UTCStringToDateConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === RFC3339UTCStringToDateConverter) {
                if (!singleton) {
                    singleton = this;
                }

                return singleton;
            }

            return this;
        }
    },

    /**
     * Converts the RFC3339 string to a Date.
     * @function
     * @param {string} v The string to convert.
     * @returns {Date} The Date converted from the string.
     */
    convert: {value: function (v) {
        return  Date.parseRFC3339(v);
    }},

    /**
     * Reverts the specified Date to an RFC3339 String.
     * @function
     * @param {string} v The specified string.
     * @returns {string}
     */
    revert: {value: function (v) {
        return v ? v.toISOString() : v;
    }}

});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new RFC3339UTCStringToDateConverter();
        }

        return singleton;
    }
});
