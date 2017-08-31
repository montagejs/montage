/**
 * @module montage/core/converter/snake-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    snakeCase = require('lodash/fp/snakeCase'),
    deprecate = require("../deprecate"),
    shouldMuteWarning = false,
    singleton;

/**
 * Converts string to snake case.
 *
 * @class SnakeCaseConverter
 * @extends Converter
 */
var SnakeCaseConverter = exports.SnakeCaseConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === SnakeCaseConverter) {
                if (!singleton) {
                    singleton = this;
                }

                if (!shouldMuteWarning) {
                    deprecate.deprecationWarning(
                        "Instantiating SnakeCaseConverter is deprecated," +
                        " use its Singleton instead"
                    );
                }

                return singleton;
            }

            return this;
        }
    },

    convert: {
        value: function (v) {
            return snakeCase(v);
        }
    }
});

Object.defineProperty(exports, 'Singleton', {
    get: function () {
        if (!singleton) {
            shouldMuteWarning = true;
            singleton = new SnakeCaseConverter();
            shouldMuteWarning = false;
        }

        return singleton;
    }
});
