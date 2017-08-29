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
exports.CamelCaseConverter = Converter.specialize({

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
            return camelCase(v);
        }
    }
});
