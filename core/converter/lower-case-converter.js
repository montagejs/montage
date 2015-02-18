/**
 * @module montage/core/converter/lower-case-converter
 * @requires montage/core/core
 * @requires montage/core/converter/converter
 */
var Montage = require("../core").Montage;
var Converter = require("./converter").Converter;

/**
 * @class LowerCaseConverter
 * @classdesc Converts a string to lowercase.
 */
exports.LowerCaseConverter = Converter.specialize( /** @lends LowerCaseConverter# */{

    _convert: {
        value: function (v) {
            if (v && typeof v === 'string') {
                return (v.toLowerCase ? v.toLowerCase() : v);
            }
            return v;
        }
    },

    /**
     * @function
     * @param {string} v Case format
     * @returns this._convert(v)
     */
    convert: {value: function (v) {
        return this._convert(v);
    }},

    /**
     * @function
     * @param {string} v Case format
     * @returns this._convert(v)
     */
    revert: {value: function (v) {
        return this._convert(v);
    }}

});

