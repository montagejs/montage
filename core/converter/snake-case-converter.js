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
var SnakeCaseConverter = exports.SnakeCaseConverter = Converter.specialize({
    convert: {
        value: function (v) {
            return snakeCase(v);
        }
    }
});

Object.defineProperty(exports, 'defaultSnakeCaseConverter', {

    get: function () {
        return singleton || (singleton = new SnakeCaseConverter());
    }

});
