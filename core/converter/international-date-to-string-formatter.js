/**
 * @module montage/core/converter/international-date-to-string-formatter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    Locale = require("../locale").Locale;

/**
 * Formats a Date to a String using standard Intl.DateTimeFormat.
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
 *
 * @class InternationalDateToStringFormatter
 * @extends Converter
 */
var InternationalDateToStringFormatter = exports.InternationalDateToStringFormatter = Converter.specialize({

    _locale: {
        value: Locale.systemLocale
    },

    locale: {
        get: function() {
            return this._locale;
        },
        set: function(value) {
            if(value !== this._locale) {
                this._locale = value;
                this.__dayDateFormatter = null;
            }
        }
    },

    _options: {
        value: undefined
    },

    options: {
        get: function() {
            return this._options;
        },
        set: function(value) {
            if(value !== this._options) {
                this._options = value;
                this.__dayDateFormatter = null;
            }
        }
    },

    __dayDateFormatter: {
        value: undefined
    },

    _dayDateFormatter: {
        get: function() {
            if(!this.__dayDateFormatter) {
                this.__dayDateFormatter = Intl.DateTimeFormat(
                    this._locale.identifier, this.options);
            }
            return this.__dayDateFormatter;
        }
    },
    convert: {
        value: function (v) {
            return v && v instanceof Date ? this._dayDateFormatter.format(v) : "";
        }
    }
});
