/**
 * @module montage/core/converter/lower-case-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    deprecate = require("../deprecate"),
    shouldMuteWarning = false,    
    singleton;

/**
 * @class LowerCaseConverter
 * @classdesc Converts a string to lowercase.
 */
var LowerCaseConverter = exports.LowerCaseConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === LowerCaseConverter) {
                if (!singleton) {
                    singleton = this;
                }

                if (!shouldMuteWarning) {
                    deprecate.deprecationWarning(
                        "Instantiating LowerCaseConverter is deprecated," +
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
                return (v.toLowerCase ? v.toLowerCase() : v);
            }
            return v;
        }
    },

    /**
     * @function
     * @param {string} v Case format
     * @returns this._convert(v)
     */
    convert: {value: function (v) {
        return this._convert(v);
    }},

    /**
     * @function
     * @param {string} v Case format
     * @returns this._convert(v)
     */
    revert: {value: function (v) {
        return this._convert(v);
    }}

});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            shouldMuteWarning = true;
            singleton = new LowerCaseConverter();
            shouldMuteWarning = false;
        }

        return singleton;
    }
});
