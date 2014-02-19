/**
 * @module montage/core/converter/new-line-to-br-converter
 * @requires montage/core/core
 * @requires montage/core/converter/converter
 */

var Montage = require("montage").Montage;
var Converter = require('core/converter/converter').Converter;

/**
 * Replaces all new line characters with a HTML &lt;br&gt;
 * @memberof module:montage/core/converter#
 * @function
 * @param {string} str The string to format.
 * @returns {string} The formatted string.
 */
var newLineToBr = function(str) {
    return str.replace(/(\r\n|\r|\n)/g, '<br />');
};

/**
 * @class NewLineToBrConverter
 * @classdesc Converts a newline to a &lt;br&gt; tag.
 */
exports.NewLineToBrConverter = Converter.specialize( /** @lends NewLineToBrConverter# */{

    _convert: {
        value: function(v) {
            if (v && typeof v === 'string') {
                return newLineToBr(v);
            }
            return v;
        }
    },

    /**
     * @method
     * @param {string} v Case format
     * @returns this._convert(v)
     */
    convert: {value: function(v) {
        return this._convert(v);
    }},

    /**
     * @method
     * @param {string} v Case format
     * @returns this._convert(v)
     */
    revert: {value: function(v) {
        return this._convert(v);
    }}

});

