/**
 * @module montage/core/converter/invert-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    deprecate = require("../deprecate"),    
    shouldMuteWarning = false,
    singleton;

/**
 * Inverts the value of a boolean value.
 *
 * @class InvertConverter
 * @extends Converter
 */
var InvertConverter = exports.InvertConverter = Converter.specialize({
    
    constructor: {
        value: function () {
            if (this.constructor === InvertConverter) {
                if (!singleton) {
                    singleton = this;
                }

                if (!shouldMuteWarning) {
                    deprecate.deprecationWarning(
                        "Instantiating InvertConverter is deprecated," +
                        " use its singleton instead"
                    );
                }

                return singleton;
            }

            return this;
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

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            shouldMuteWarning = true;
            singleton = new InvertConverter();
            shouldMuteWarning = false;
        }

        return singleton;
    }
});
