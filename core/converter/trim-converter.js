/**
 * @module montage/core/converter/trim-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    trim = require('lodash.trim'),
    deprecate = require("../deprecate"),
    shouldMuteWarning = false,
    singleton;

/**
 * @class TrimConverter
 * @classdesc Trims a string of white space.
 * @example
 * <caption>Removes leading and trailing white space from a string.</caption>
 * var Converter= require("./converter").Converter,
 * TrimConverter = require("./converter").TrimConverter;
 * var str = "      Hello World     ";
 * var trimConverter = new TrimConverter();
 * console.log("After trim: " + trimConverter.convert(str));
 * // After trim: Hello World
 */
var TrimConverter = exports.TrimConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === TrimConverter) {
                if (!singleton) {
                    singleton = this;
                }

                if (!shouldMuteWarning) {
                    deprecate.deprecationWarning(
                        "Instantiating TrimConverter is deprecated," +
                        " use its singleton instead"
                    );
                }

                return singleton;
            }

            return this;
        }
    },

    _convert: {
        value: function (v) {
            if (v && typeof v === 'string') {
                return trim(v);
            }
        }
    },

    /**
     * Trims the provided string and returns the new string.
     * @function
     * @param {string} v The string to trim.
     * @returns this._convert(v)
     */
    convert: {value: function (v) {
        return this._convert(v);
    }},

    /**
     * Reverts the conversion.
     * @function
     * @param {string} v The string to revert.
     * @returns this._convert(v)
     */
    revert: {value: function (v) {
        return this._convert(v);
    }}

});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            shouldMuteWarning = true;
            singleton = new TrimConverter();
            shouldMuteWarning = false;
        }

        return singleton;
    }
});
