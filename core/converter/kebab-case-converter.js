/**
 * @module montage/core/converter/kebab-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    kebabCase = require('lodash.kebabcase'),
    singleton;

/**
 * Converts string to kebab case.
 *
 * @class KebabCaseConverter
 * @extends Converter
 */
var KebabCaseConverter = exports.KebabCaseConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === KebabCaseConverter) {
                if (!singleton) {
                    singleton = this;
                }

                return singleton;
            }

            return this;
        }
    },

    convert: {
        value: kebabCase
    }
});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new KebabCaseConverter();
        }

        return singleton;
    }
});
