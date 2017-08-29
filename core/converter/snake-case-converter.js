/**
 * @module montage/core/converter/snake-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    snakeCase = require('lodash/fp/snakeCase'),
    singleton;

/**
 * Converts string to snake case.
 *
 * @class SnakeCaseConverter
 * @extends Converter
 */
exports.SnakeCaseConverter = Converter.specialize({

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
            return snakeCase(v);
        }
    }
});
