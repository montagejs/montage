/**
 * @module montage/core/converter/camel-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    camelCase = require('lodash/fp/camelCase'),
    singleton;

/**
 * Converts string to camel case.
 *
 * @class CamelCaseConverter
 * @extends Converter
 */
var CamelCaseConverter = exports.CamelCaseConverter = Converter.specialize({
    convert: {
        value: function (v) {
            return camelCase(v);
        }
    }
});

Object.defineProperty(exports, 'defaultCamelCaseConverter', {

    get: function () {
        return singleton || (singleton = new CamelCaseConverter());
    }

});
