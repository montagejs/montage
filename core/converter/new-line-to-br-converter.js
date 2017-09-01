/**
 * @module montage/core/converter/new-line-to-br-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    deprecate = require("../deprecate"),
    shouldMuteWarning = false,    
    singleton;

/**
 * Replaces all new line characters with a HTML &lt;br&gt;
 * @memberof module:montage/core/converter#
 * @function
 * @param {string} str The string to format.
 * @returns {string} The formatted string.
 */
var newLineToBr = function (str) {
    return str.replace(/(\r\n|\r|\n)/g, '<br />');
};

/**
 * @class NewLineToBrConverter
 * @classdesc Converts a newline to a &lt;br&gt; tag.
 */
var NewLineToBrConverter = exports.NewLineToBrConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === NewLineToBrConverter) {
                if (!singleton) {
                    singleton = this;
                }

                if (!shouldMuteWarning) {
                    deprecate.deprecationWarning(
                        "Instantiating NewLineToBrConverter is deprecated," +
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
                return newLineToBr(v);
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
            singleton = new NewLineToBrConverter();
            shouldMuteWarning = false;
        }

        return singleton;
    }
});
