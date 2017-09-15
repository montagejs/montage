/**
 * @module montage/core/converter/camel-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    camelCase = require('lodash.camelcase'),
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

                return singleton;
            }

            return this;
        }
    },

    convert: {
        value: camelCase
    }
    
});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new CamelCaseConverter();
        }

        return singleton;
    }
});
