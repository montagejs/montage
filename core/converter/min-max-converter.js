/**
 * @module montage/core/converter/min-max-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("montage/core/converter/converter").Converter;

function _clamp(value) {

    return value <= this.min ? this.min : value >= this.max ? this.max : value;
    
};

/**
 * Converts a number to an integer
 * @class MinMaxConverter
 * @extends Converter
 */
var MinMaxConverter = exports.MinMaxConverter = Converter.specialize({

    constructor: {
        value: function () {
            // if (this.constructor === MinMaxConverter) {
            //     if (!singleton) {
            //         singleton = this;
            //     }

            //     return singleton;
            // }

            // return this;
        }
    },

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

// Object.defineProperty(exports, 'singleton', {
//     get: function () {
//         if (!singleton) {
//             singleton = new MinMaxConverter();
//         }

//         return singleton;
//     }
// });