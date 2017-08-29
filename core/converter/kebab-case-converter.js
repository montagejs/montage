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
exports.KebabCaseConverter = Converter.specialize({

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
            return kebabCase(v);
        }
    }
});
