/**
 * @module montage/core/converter/invert-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter;

/**
 * Inverts the value of a boolean value.
 *
 * @class InvertConverter
 * @extends Converter
 */
var InvertConverter = exports.InvertConverter = Converter.specialize( {
    convert: {
        value: function (v) {
            return !v;
        }
    },

    revert: {
        value: function (v) {
            return !v;
        }
    }
});
