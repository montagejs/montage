/**
 * @module montage/core/converter/range-enforcer
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter;

function _clamp(value) {

    return value <= this.min ? this.min : value >= this.max ? this.max : value;
    
}

/**
 * Converts a number to an integer
 * @class RangeEnforcer
 * @extends Converter
 */
var RangeEnforcer = exports.RangeEnforcer = Converter.specialize({

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
