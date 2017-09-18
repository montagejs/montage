/**
 * @module montage/core/converter/number-to-nearest-integer-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    singleton;

/**
 * Converts a number to an integer
 * @class NumberToNearestIntegerConverter
 * @extends Converter
 */
var NumberToNearestIntegerConverter = exports.NumberToNearestIntegerConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === NumberToNearestIntegerConverter) {
                if (!singleton) {
                    singleton = this;
                }

                return singleton;
            }

            return this;
        }
    },

    convert: {
        value: function(value) {
            return Math.round(value);
        }
    },

    revert: {
        value: function(value) {
            return Math.round(value);
        }
    }


});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new NumberToNearestIntegerConverter();
        }

        return singleton;
    }
});
