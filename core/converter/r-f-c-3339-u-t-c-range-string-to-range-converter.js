/**
 * @module montage/core/converter/r-f-c-3339-u-t-c-range-string-to-range-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    Range = require("../range").Range,
    singleton;

    //for Date.parseRFC3339
    require("../extras/date");

/**
 * @class RFC3339UTCRangeStringToRangeConverter
 * @classdesc Converts an RFC3339 UTC string to a date and reverts it.
 */
var RFC3339UTCRangeStringToRangeConverter = exports.RFC3339UTCRangeStringToRangeConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === RFC3339UTCRangeStringToRangeConverter) {
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
     * @returns {Range} The Date converted from the string.
     */
    convert: {
        value: function (v) {
            return Range.parse(v,Date);
            return Range.parse(v,Date.parseRFC3339);
        //return  Date.parseRFC3339(v);
        }
    },

    /**
     * Reverts the specified Date to an RFC3339 String.
     * @function
     * @param {Range} v The specified string.
     * @returns {string}
     */
    revert: {
        value: function (v) {
            //Wish we could just called toString() on v,
            //but it's missing the abillity to cutomize the
            //stringify of begin/end
            return v.bounds[0] + v.begin.toISOString() + "," + v.end.toISOString()+ v.bounds[1]

            return v.toISOString();
        }
    }

});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new RFC3339UTCRangeStringToRangeConverter();
        }

        return singleton;
    }
});
