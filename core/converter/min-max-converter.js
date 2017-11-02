/**
 * @module montage/core/converter/min-max-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter;

function _clamp(value) {

    return value <= this.min ? this.min : value >= this.max ? this.max : value;
    
}

/**
 * Converts a number to an integer
 * @class MinMaxConverter
 * @extends Converter
 */
var MinMaxConverter = exports.MinMaxConverter = Converter.specialize({

    min: {
        value: null
    },

    max: {
        value: null
    },

    convert: {
        value: _clamp
    },

    revert: {
        value: _clamp
    }
    
});
