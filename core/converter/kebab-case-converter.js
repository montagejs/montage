/**
 * @module montage/core/converter/kebab-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    kebabCase = require('lodash/fp/kebabCase'),
    singleton;

/**
 * Converts string to kebab case.
 *
 * @class KebabCaseConverter
 * @extends Converter
 */
var KebabCaseConverter = exports.KebabCaseConverter = Converter.specialize({
    convert: {
        value: function (v) {
            return kebabCase(v);
        }
    }
});

Object.defineProperty(exports, 'defaultKebabCaseConverter', {

    get: function () {
        return singleton || (singleton = new KebabCaseConverter());
    }

});
