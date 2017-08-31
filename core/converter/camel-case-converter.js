/**
 * @module montage/core/converter/camel-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    camelCase = require('lodash/fp/camelCase'),
    deprecate = require("../deprecate"),
    shouldMuteWarning = false,
    singleton;

/**
 * Converts string to camel case.
 *
 * @class CamelCaseConverter
 * @extends Converter
 */
var CamelCaseConverter = exports.CamelCaseConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === CamelCaseConverter) {
                if (!singleton) {
                    singleton = this;
                }

                if (!shouldMuteWarning) {
                    deprecate.deprecationWarning(
                        "Instantiating CamelCaseConverter is deprecated," +
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
            return camelCase(v);
        }
    }
    
});

Object.defineProperty(exports, 'Singleton', {
    get: function () {
        if (!singleton) {
            shouldMuteWarning = true;
            singleton = new CamelCaseConverter();
            shouldMuteWarning = false;
        }

        return singleton;
    }
});
