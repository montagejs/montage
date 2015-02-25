/**
 * @module montage/core/converter/upper-case-converter
 * @requires montage/core/core
 * @requires montage/core/converter/converter
 */
var Montage = require("../core").Montage;
var Converter = require("./converter").Converter;

/**
 * @class UpperCaseConverter
 * @classdesc Converts a string to upper-case.
 */
exports.UpperCaseConverter = Converter.specialize( /** @lends UpperCaseConverter# */ {

    _convert: {
        value: function (v) {
            if (v && typeof v === 'string') {
                return (v.toUpperCase ? v.toUpperCase() : v);
            }
            return v;
        }
    },

    /**
     * Converts the specified string to all upper case letters.
     * @function
     * @param {string} v The string to convert.
     * @returns {string} The converted string.
     */
    convert: {value: function (v) {
        return this._convert(v);
    }},

    /**
     * Reverts the specified string.
     * @function
     * @param {string} v The specified string.
     * @returns {string}
     */
    revert: {value: function (v) {
        return this._convert(v);
    }}

});

