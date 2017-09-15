/**
 * @module montage/core/converter/snake-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    snakeCase = require('lodash.snakecase'),
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

                return singleton;
            }

            return this;
        }
    },

    convert: {
        value: snakeCase
    }
});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new SnakeCaseConverter();
        }

        return singleton;
    }
});
