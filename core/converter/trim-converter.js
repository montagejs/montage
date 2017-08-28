/**
 * @module montage/core/converter/trim-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    trim = require('lodash/fp/trim'),
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
var TrimConverter = exports.TrimConverter = Converter.specialize( /** @lends TrimConverter# */ {

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

Object.defineProperty(exports, 'defaultTrimConverter', {

    get: function () {
        return singleton || (singleton = new TrimConverter());
    }

});
