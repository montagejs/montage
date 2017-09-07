/**
 * @module montage/core/converter/upper-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    deprecate = require("../deprecate"),
    shouldMuteWarning = false,    
    singleton;    

/**
 * @class UpperCaseConverter
 * @classdesc Converts a string to upper-case.
 */
var UpperCaseConverter = exports.UpperCaseConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === UpperCaseConverter) {
                if (!singleton) {
                    singleton = this;
                }

                if (!shouldMuteWarning) {
                    deprecate.deprecationWarning(
                        "Instantiating UpperCaseConverter is deprecated," +
                        " use its singleton instead"
                    );
                }

                return singleton;
            }

            return this;
        }
    },

    _convert: {
        value: function (v) {
            if (v && typeof v === 'string') {
                return (v.toUpperCase ? v.toUpperCase() : v);
            }
            return v;
        }
    },

    /**
     * Converts the specified string to all upper case letters.
     * @function
     * @param {string} v The string to convert.
     * @returns {string} The converted string.
     */
    convert: {value: function (v) {
        return this._convert(v);
    }},

    /**
     * Reverts the specified string.
     * @function
     * @param {string} v The specified string.
     * @returns {string}
     */
    revert: {value: function (v) {
        return this._convert(v);
    }}

});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            shouldMuteWarning = true;
            singleton = new UpperCaseConverter();
            shouldMuteWarning = false;
        }

        return singleton;
    }
});
