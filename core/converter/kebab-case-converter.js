/**
 * @module montage/core/converter/kebab-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    kebabCase = require('lodash/fp/kebabCase'),
    deprecate = require("../deprecate"),
    shouldMuteWarning = false,
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

                if (!shouldMuteWarning) {
                    deprecate.deprecationWarning(
                        "Instantiating KebabCaseConverter is deprecated," +
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
            return kebabCase(v);
        }
    }
});

Object.defineProperty(exports, 'Singleton', {
    get: function () {
        if (!singleton) {
            shouldMuteWarning = true;
            singleton = new KebabCaseConverter();
            shouldMuteWarning = false;
        }

        return singleton;
    }
});
