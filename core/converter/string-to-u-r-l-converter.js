/**
 * @module montage/core/converter/bytes-converter
 * @requires montage/core/converter/converter
 * @requires montage/core/converter/number-converter
 */
var Converter = require("./converter").Converter;

/**
 * @class StringToURLConverter
 * @classdesc Converts a string value to a URL instance.
 * @extends Converter
 */
exports.StringToURLConverter = Converter.specialize( /** @lends StringToURLConverter# */ {

    /**
     * Converts the specified value to a URL.
     * @function
     * @param {Property} v The value to format.
     * @returns {URL} The value converted to a URL.
     */
    convert: {
        value: function (v) {
            if(v == null) {
                return null;
            } else {
                return new URL(v);
            }
        }
    },

    /**
     * Reverts a URL to a string.
     * @function
     * @param {URL} v The value to revert.
     * @returns {string} v
     * @see StringToURLConverter#convert
     */
    revert: {
        value: function (v) {
            return v.toString();
        }
    }

});

