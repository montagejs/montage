/**
 * @module montage/core/converter/invert-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    singleton;

/**
 * Inverts the value of a boolean value.
 *
 * @class InvertConverter
 * @extends Converter
 */
exports.InvertConverter = Converter.specialize({
    
    constructor: {
        value: function () {
            if (!singleton) {
                singleton = this;
            }

            return singleton;
        }
    },

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
